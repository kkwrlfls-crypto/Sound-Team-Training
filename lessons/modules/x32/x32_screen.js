/* =============================================================================
   window.X32Screen — Behringer X32 메인 디스플레이(5" 컬러 화면, 800×480) 모든 페이지 (2026-11-08, 화면 작업자)

   var s = X32Screen.mount(el, model, opts)
     el    : 화면을 그릴 자리(사진 위 화면 칸). 크기에 맞춰 800×480 화면을 줄이거나 키워 그려요.
     model : X32Model.create() 로 만든 콘솔
     opts  : { bigHost: 요소(선택) — 「크게 보기」 판을 넣을 곳. 없으면 el 이 든 .x32p 안 사진 상자 바로 아래 · 없으면 el 바로 뒤
               big: false — 「크게 보기」 단추 숨기기,  help: true — 크게 보기 판 아래 쉬운 설명 }
   s.destroy()        s.openBig() / s.closeBig()        s.state() → { page, tab, tabId, layer, modal, big }

   읽는 것: model.state 전체, model.meters(requestAnimationFrame 으로 그림), X32Model.COLORS · FX_TYPES · INPUT_BLOCKS · OUT_SOURCES …
   받는 입력: model.set('screen.input', { kind:'enc', index:0..5, delta:±n | press:true } | { kind:'page', dir:±1 } | { kind:'layer', dir:±1 } | { kind:'utility' } | { kind:'back' })
   화면을 직접 눌러도(터치처럼) 돼요: 탭 · 목록 · 단추 · 엔코더 칸(누르기 · 위아래로 끌기 · 휠) · EQ 점 끌기 · 페이더 끌기.
   화면 글자는 X32 실물처럼 영어. 「크게 보기」 판의 안내만 쉬운 한국어.
   ============================================================================= */
(function () {
  'use strict';
  var W = 800, H = 480, NINF = -Infinity, OFF = -90, FS = 48000;
  var HD = 36, TB = 34, EN = 78, BY = HD + TB, BH = H - HD - TB - EN;   // 머리 · 탭 · 몸통 · 엔코더 줄

  /* ---------------------------------------------------------------- 작은 도움 함수 */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function range(n) { var a = []; for (var i = 0; i < n; i++) a.push(i); return a; }
  function isOff(v) { return v == null || !isFinite(v) || v <= OFF + 0.01; }
  function clone(o) { return o == null ? o : JSON.parse(JSON.stringify(o)); }
  function sig(v, n) { if (!v) return 0; var p = Math.pow(10, (n || 3) - Math.ceil(Math.log10(Math.abs(v)))); return Math.round(v * p) / p; }
  function fDb(v, unit) { if (isOff(v)) return '-oo' + (unit ? ' dB' : ''); return (v > 0 ? '+' : v < 0 ? '-' : '') + Math.abs(v).toFixed(1) + (unit ? ' dB' : ''); }
  function fDbI(v) { return isOff(v) ? '-∞' : (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(1); }
  function fHz(f) { f = +f || 0; return f < 1000 ? (f < 100 ? f.toFixed(1).replace(/\.0$/, '') : Math.round(f)) + ' Hz' : (f / 1000).toFixed(f < 10000 ? 2 : 1) + ' kHz'; }
  function fMs(ms) { ms = +ms || 0; return ms >= 1000 ? (ms / 1000).toFixed(2) + ' s' : (ms < 10 ? ms.toFixed(2) : ms < 100 ? ms.toFixed(1) : Math.round(ms)) + ' ms'; }
  function fPan(p) { p = Math.round(+p || 0); return p === 0 ? 'C' : (p < 0 ? 'L' : 'R') + Math.abs(p); }
  function fRatio(r) { r = +r || 1; return (r >= 10 ? r.toFixed(0) : r.toFixed(1)) + ':1'; }
  function now() { return (window.performance && performance.now) ? performance.now() : Date.now(); }
  function M() { return window.X32Model || {}; }
  function f2db(p) { var X = M(); if (X.faderToDb) { var d = X.faderToDb(p); return isFinite(d) ? d : OFF; } p = clamp(p, 0, 1); if (p <= 0) return OFF; if (p >= 0.5) return p * 40 - 30; if (p >= 0.25) return p * 80 - 50; if (p >= 0.0625) return p * 160 - 70; return p * 480 - 90; }
  function db2f(d) { var X = M(); if (X.dbToFader) return X.dbToFader(d); if (isOff(d)) return 0; if (d < -60) return (d + 90) / 480; if (d < -30) return (d + 70) / 160; if (d < -10) return (d + 50) / 80; return Math.min(1, (d + 30) / 40); }
  function mfrac(d) { return isOff(d) || d < -60 ? 0 : clamp((d + 60) / 60, 0, 1); }   // 미터 −60..0 dBFS

  /* ---------------------------------------------------------------- X32 목록(설명서 · OSC 문서) */
  var COLS0 = [['OFF', '#2b2d31'], ['RD', '#ef4444'], ['GN', '#4ade80'], ['YE', '#facc15'], ['BL', '#60a5fa'], ['MG', '#e879f9'], ['CY', '#22d3ee'], ['WH', '#e5e7eb']];
  function colors() { var X = M(); if (X.COLORS && X.COLORS.length >= 16) return X.COLORS; var a = []; COLS0.forEach(function (c) { a.push({ id: c[0], bg: c[1], fg: '#0b0c0e', inv: false }); }); COLS0.forEach(function (c) { a.push({ id: c[0] + 'i', bg: '#0b0c0e', fg: c[0] === 'OFF' ? '#9ca3af' : c[1], inv: true }); }); return a; }
  function col(i) { var c = colors()[clamp(i | 0, 0, 15)]; return c; }
  var ICONS = ['Empty', 'Kick Back', 'Kick Front', 'Snare Top', 'Snare Bottom', 'High Tom', 'Mid Tom', 'Floor Tom', 'Hi-Hat', 'Ride', 'Drum Kit', 'Cowbell', 'Bongos', 'Congas', 'Tambourine', 'Vibraphone', 'Electric Bass', 'Acoustic Bass', 'Contrabass', 'Les Paul Guitar', 'Ibanez Guitar', 'Washburn Guitar', 'Acoustic Guitar', 'Bass Amp', 'Guitar Amp', 'Amp Cabinet', 'Piano', 'Organ', 'Harpsichord', 'Keyboard', 'Synthesizer 1', 'Synthesizer 2', 'Synthesizer 3', 'Keytar', 'Trumpet', 'Trombone', 'Saxophone', 'Clarinet', 'Violin', 'Cello', 'Male Vocal', 'Female Vocal', 'Choir', 'Hand Sign', 'Talk A', 'Talk B', 'Large Dia. Mic', 'Condenser L', 'Condenser R', 'Handheld Mic', 'Wireless Mic', 'Podium Mic', 'Headset Mic', 'XLR Jack', 'TRS Plug', 'TRS Plug L', 'TRS Plug R', 'RCA Plug L', 'RCA Plug R', 'Reel to Reel', 'FX', 'Computer', 'Monitor Wedge', 'Speaker L', 'Speaker R', 'Speaker Array', 'Speaker Pole', 'Amp Rack', 'Controls', 'Fader', 'MixBus', 'Matrix', 'Routing', 'Smiley'];
  var ICAT = 'blank kick kick snare snare tom tom tom cym cym kit perc perc perc perc keys bass bass bass gtr gtr gtr agtr amp amp amp piano keys piano keys keys keys keys keys brass brass brass brass violin violin voc voc choir hand talk talk mic mic mic mic wless podium headset plug plug plug plug plug plug tape fx pc wedge spk spk spk spk rack ctrl fader bus bus route smile'.split(' ');
  var GLYPH = {
    blank: '', kick: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/>', snare: '<ellipse cx="12" cy="8" rx="8" ry="3"/><path d="M4 8v8c0 1.7 3.6 3 8 3s8-1.3 8-3V8"/>',
    tom: '<ellipse cx="12" cy="7" rx="6.5" ry="2.5"/><path d="M5.5 7v9c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5V7"/>', cym: '<path d="M2 9q10-5 20 0z"/><path d="M12 8v13M8 21h8"/>',
    kit: '<circle cx="12" cy="15" r="6"/><circle cx="12" cy="15" r="2"/><path d="M1 7q4-2 8 0M15 6q4-2 8 0"/>', perc: '<path d="M8 4h8l-2 17h-4z"/><ellipse cx="12" cy="4" rx="4" ry="1.3"/>',
    bass: '<path d="M14 10l7-7M19 2l3 3"/><path d="M13 11c-2-2-6-1-7 1-1 1 0 2-1 3s-3 1-3 4 3 4 5 3 2-2 3-3 3 0 4-2-1-3-1-6z"/>', gtr: '<path d="M14 10l7-7M19 2l3 3"/><path d="M13 11c-2-2-6-1-7 1-1 1 0 2-1 3s-3 1-3 4 3 4 5 3 2-2 3-3 3 0 4-2-1-3-1-6z"/><path d="M7 17l2 2"/>',
    agtr: '<path d="M15 9l6-6"/><circle cx="9" cy="15" r="6"/><circle cx="9" cy="15" r="2"/>', amp: '<rect x="3" y="5" width="18" height="15" rx="1.5"/><path d="M6 9h12M6 12h12M6 15h12"/>',
    piano: '<rect x="2" y="6" width="20" height="13" rx="1"/><path d="M6 6v8M10 6v8M14 6v8M18 6v8M2 14h20"/>', keys: '<rect x="2" y="8" width="20" height="9" rx="1"/><path d="M5 8v5M8 8v5M11 8v5M14 8v5M17 8v5M20 8v5M6 5h2M11 5h2"/>',
    brass: '<path d="M2 12h12M14 8v8l7 4V4z"/><path d="M5 12v3M8 12v3"/>', violin: '<path d="M12 2v7"/><path d="M9 9c-3 0-3 4 0 5-3 1-3 6 3 7 6-1 6-6 3-7 3-1 3-5 0-5z"/>',
    voc: '<circle cx="10" cy="8" r="4"/><path d="M3 21c0-5 3-8 7-8s7 3 7 8"/><rect x="18" y="3" width="3" height="6" rx="1.5"/>', choir: '<circle cx="6" cy="9" r="3"/><circle cx="12" cy="7" r="3"/><circle cx="18" cy="9" r="3"/><path d="M1 20c0-4 2-6 5-6M23 20c0-4-2-6-5-6M7 21c0-5 2-8 5-8s5 3 5 8"/>',
    hand: '<path d="M8 21v-9l-3-3 1-1 3 2V4h2v7h1V3h2v8h1V4h2v9c0 4-2 8-6 8z"/>', talk: '<path d="M3 4h18v12H9l-5 4v-4H3z"/>',
    mic: '<rect x="9" y="2" width="6" height="11" rx="3"/><path d="M6 10a6 6 0 0 0 12 0M12 16v5M8 21h8"/>', wless: '<rect x="9" y="2" width="6" height="9" rx="3"/><path d="M10 11l1 10h2l1-10M18 4q2 2 0 4M20 2q4 4 0 8"/>',
    podium: '<path d="M4 21h16l-2-9H6z"/><path d="M12 12V5q0-2 3-3"/><circle cx="15" cy="2.5" r="1"/>', headset: '<path d="M5 12a7 7 0 0 1 14 0"/><rect x="3" y="11" width="4" height="7" rx="1.5"/><rect x="17" y="11" width="4" height="7" rx="1.5"/><path d="M5 18q2 3 6 3"/>',
    plug: '<circle cx="12" cy="12" r="8"/><circle cx="9" cy="10" r="1.2"/><circle cx="15" cy="10" r="1.2"/><circle cx="12" cy="15" r="1.2"/>', tape: '<circle cx="7" cy="11" r="4.5"/><circle cx="17" cy="11" r="4.5"/><path d="M7 15.5h10"/>',
    fx: '<path d="M12 2l2.5 6.5L21 9l-5 4.5L17.5 21 12 17l-5.5 4L8 13.5 3 9l6.5-.5z"/>', pc: '<rect x="3" y="4" width="18" height="12" rx="1"/><path d="M8 20h8M12 16v4"/>',
    wedge: '<path d="M3 18h18L17 7H7z"/><circle cx="12" cy="13" r="2.5"/>', spk: '<rect x="6" y="2" width="12" height="20" rx="1.5"/><circle cx="12" cy="15" r="4"/><circle cx="12" cy="6.5" r="1.8"/>',
    rack: '<rect x="3" y="3" width="18" height="18" rx="1"/><path d="M3 9h18M3 15h18M6 6h6M6 12h6M6 18h6"/>', ctrl: '<circle cx="7" cy="8" r="3"/><circle cx="17" cy="8" r="3"/><circle cx="12" cy="17" r="3"/>',
    fader: '<path d="M8 3v18M16 3v18"/><rect x="5" y="12" width="6" height="4" rx="1"/><rect x="13" y="6" width="6" height="4" rx="1"/>', bus: '<path d="M3 6h18M3 12h18M3 18h18"/><circle cx="8" cy="6" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="10" cy="18" r="2"/>',
    route: '<path d="M3 6h6l6 12h6M3 18h6l2-4M15 6h6M13 10l2-4"/>', smile: '<circle cx="12" cy="12" r="9"/><path d="M8 14q4 4 8 0"/><circle cx="9" cy="9.5" r="1"/><circle cx="15" cy="9.5" r="1"/>'
  };
  function icon(n, size, color) { var g = GLYPH[ICAT[clamp((n | 0) - 1, 0, 73)]] || ''; return '<svg class="ic" viewBox="0 0 24 24" width="' + (size || 22) + '" height="' + (size || 22) + '" fill="none" stroke="' + (color || 'currentColor') + '" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + g + '</svg>'; }

  var GATE_MODES = ['EXP2', 'EXP3', 'EXP4', 'GATE', 'DUCK'], DYN_MODES = ['COMP', 'EXP'], RATIOS = [1.1, 1.3, 1.5, 2, 2.5, 3, 4, 5, 7, 10, 20, 100];
  var EQ_TYPES = ['LCut', 'LShv', 'PEQ', 'VEQ', 'HShv', 'HCut'], TAPS = ['IN', 'PRE EQ', 'POST EQ', 'PRE', 'POST', 'GRP'];
  var TAPLBL = { 'IN': 'IN/LC', 'PRE EQ': '<-EQ', 'POST EQ': 'EQ->', 'PRE': 'PRE', 'POST': 'POST', 'GRP': 'GRP' };
  var FILT_TYPES = ['LC6', 'LC12', 'HC6', 'HC12', '1.0', '2.0', '3.0', '5.0', '10.0'];
  var INS_SEL = ['OFF'].concat(range(8).reduce(function (a, k) { return a.concat(['FX' + (k + 1) + 'L', 'FX' + (k + 1) + 'R']); }, []), range(6).map(function (k) { return 'AUX' + (k + 1); }));
  var BANDN = { 4: ['LOW', 'LO MID', 'HI MID', 'HIGH'], 6: ['BAND 1', 'BAND 2', 'BAND 3', 'BAND 4', 'BAND 5', 'BAND 6'] };
  var BANDC = ['#ff6b6b', '#ffb347', '#ffe066', '#7ee081', '#5bc0eb', '#c792ea'];
  function SRC() { var a = [{ v: -1, l: 'OFF' }]; range(32).forEach(function (i) { a.push({ v: i, l: 'In ' + pad2(i + 1) }); }); range(6).forEach(function (i) { a.push({ v: 32 + i, l: 'Aux ' + (i + 1) }); }); a.push({ v: 38, l: 'USB L' }, { v: 39, l: 'USB R' }); range(8).forEach(function (i) { a.push({ v: 40 + i, l: 'FX ' + ((i >> 1) + 1) + (i % 2 ? 'R' : 'L') }); }); range(16).forEach(function (i) { a.push({ v: 48 + i, l: 'Bus ' + pad2(i + 1) }); }); return a; }
  function KEYSRC() { var a = ['SELF']; range(32).forEach(function (i) { a.push('CH ' + pad2(i + 1)); }); range(8).forEach(function (i) { a.push('AUX ' + (i + 1)); }); range(8).forEach(function (i) { a.push('FX ' + ((i >> 1) + 1) + (i % 2 ? 'R' : 'L')); }); return a; }
  function inBlocks() { var X = M(); if (X.INPUT_BLOCKS) return X.INPUT_BLOCKS; var a = []; for (var i = 0; i < 4; i++) a.push('Local ' + (i * 8 + 1) + '-' + (i * 8 + 8)); ['AES50A', 'AES50B'].forEach(function (k) { for (var j = 0; j < 6; j++) a.push(k + ' ' + (j * 8 + 1) + '-' + (j * 8 + 8)); }); for (i = 0; i < 4; i++) a.push('Card ' + (i * 8 + 1) + '-' + (i * 8 + 8)); return a; }
  function auxBlocks() { var X = M(); return X.AUX_BLOCKS || ['AUX 1-6 / USB 2', 'AUX 1-4 / USB 4', 'Card 1-8', 'AES50A 1-8', 'AES50B 1-8']; }
  function outSources() { var X = M(); if (X.OUT_SOURCES) return X.OUT_SOURCES; return ['Off', 'Main L', 'Main R', 'M/C'].concat(range(16).map(function (i) { return 'MixBus ' + pad2(i + 1); }), range(6).map(function (i) { return 'Matrix ' + (i + 1); }), range(32).map(function (i) { return 'Ch ' + pad2(i + 1) + ' (Direct)'; }), ['Monitor L', 'Monitor R', 'Talkback']); }
  function blkLabel(b) { return String(b || '').replace(/^AES50A/, 'AES50-A').replace(/^AES50B/, 'AES50-B').replace(/^Local/, 'Local In'); }
  var OUT_TAPS = ['IN/LC', '<-EQ', 'EQ->', 'PRE', 'POST'];
  var CARD_BLOCKS = function () { return inBlocks().concat(['Out 1-8', 'Out 9-16', 'P16 1-8', 'P16 9-16', 'Aux 1-6/Mon', 'AuxIn 1-6/TB']); };
  var AES_BLOCKS = ['Off', 'Local 1-8', 'Local 9-16', 'Local 17-24', 'Local 25-32', 'Out 1-8', 'Out 9-16', 'P16 1-8', 'P16 9-16', 'Card 1-8', 'Card 9-16', 'Card 17-24', 'Card 25-32'];
  function XLR_BLOCKS(b) { var o = b % 2 ? 4 : 0, a = []; [0, 8, 16, 24].forEach(function (s) { a.push('Local ' + (s + o + 1) + '-' + (s + o + 4)); }); ['AES50A', 'AES50B'].forEach(function (k) { [0, 8, 16, 24, 32, 40].forEach(function (s) { a.push(k + ' ' + (s + o + 1) + '-' + (s + o + 4)); }); }); [0, 8, 16, 24].forEach(function (s) { a.push('Card ' + (s + o + 1) + '-' + (s + o + 4)); }); a.push('Out ' + (o + 1) + '-' + (o + 4), 'Out ' + (o + 9) + '-' + (o + 12), 'P16 ' + (o + 1) + '-' + (o + 4), 'P16 ' + (o + 9) + '-' + (o + 12), 'Aux/CR', 'Aux/TB'); return a; }
  var MON_SRC = ['Off', 'Main LR', 'LR + M/C', 'LR PFL', 'LR AFL', 'Aux 5/6', 'Aux 7/8'];
  var TB_DEST = ['Off', 'Main LR', 'MixBus 01-02', 'MixBus 03-04', 'MixBus 05-06', 'MixBus 07-08', 'MixBus 09-10', 'MixBus 11-12', 'MixBus 13-14', 'MixBus 15-16', 'MixBus 01-08', 'MixBus 01-16', 'All Mix + LR'];
  var FX_SRC = ['INS'].concat(range(16).map(function (i) { return 'MixBus ' + (i + 1); }), ['M/C']);

  /* ---- 이펙트: X32 종류 목록 · 파라미터(설명서 · OSC 문서). [키, 이름, 최소, 최대, 단위, 'log'|'lin'|목록, 기본] ---- */
  function P(k, l, lo, hi, u, sc, d) { return { k: k, l: l, lo: lo, hi: hi, u: u, sc: sc || 'lin', d: d }; }
  var RV = function (dec, decHi) { return [P('predelay', 'PRE DELAY', 0, 200, 'ms', 'lin', 20), P('decay', 'DECAY', dec, decHi, 's', 'log', 2.2), P('size', 'SIZE', 2, 100, '', 'lin', 60), P('damping', 'DAMPING', 1000, 20000, 'Hz', 'log', 6000), P('diffuse', 'DIFFUSE', 1, 30, '', 'lin', 20), P('mix', 'MIX', 0, 100, '%', 'lin', 100),
    P('lowcut', 'LO CUT', 10, 500, 'Hz', 'log', 100), P('hicut', 'HI CUT', 200, 20000, 'Hz', 'log', 10000), P('bassmulti', 'BASS MULTI', 0.5, 2, 'x', 'log', 1), P('spread', 'SPREAD', 0, 50, '', 'lin', 25), P('shape', 'SHAPE', 0, 250, '', 'lin', 100), P('modspeed', 'MOD SPEED', 0, 100, '', 'lin', 50)]; };
  var FACT = ['1/4', '1/3', '3/8', '1/2', '2/3', '3/4', '1', '1/4X', '1/3X', '3/8X', '1/2X', '2/3X', '3/4X', '1X'];
  var DLY = [P('mix', 'MIX', 0, 100, '%', 'lin', 100), P('time', 'TIME', 1, 3000, 'ms', 'log', 375), P('mode', 'MODE', 0, 0, '', ['ST', 'X', 'M'], 'ST'), P('factorL', 'FACTOR L', 0, 0, '', FACT, '1/4'), P('factorR', 'FACTOR R', 0, 0, '', FACT, '3/8'), P('feedback', 'FEEDBACK', 0, 100, '%', 'lin', 30),
    P('offset', 'OFFSET L/R', -100, 100, 'ms', 'lin', 0), P('lowcut', 'LO CUT', 10, 500, 'Hz', 'log', 100), P('hicut', 'HI CUT', 200, 20000, 'Hz', 'log', 8000), P('fbLowcut', 'FEED LO CUT', 10, 500, 'Hz', 'log', 10), P('fbHicut', 'FEED HI CUT', 200, 20000, 'Hz', 'log', 20000), P('spread', 'SPREAD', 0, 100, '%', 'lin', 50)];
  var MOD = [P('speed', 'SPEED', 0.05, 5, 'Hz', 'log', 0.5), P('depth', 'DEPTH', 0, 100, '%', 'lin', 40), P('delay', 'DELAY', 0.5, 50, 'ms', 'log', 10), P('feedback', 'FEEDBACK', 0, 90, '%', 'lin', 0), P('phase', 'PHASE', 0, 180, '°', 'lin', 90), P('mix', 'MIX', 0, 100, '%', 'lin', 50),
    P('lowcut', 'LO CUT', 10, 500, 'Hz', 'log', 10), P('hicut', 'HI CUT', 200, 20000, 'Hz', 'log', 20000), P('wave', 'WAVE', 0, 0, '', ['TRI', 'SIN', 'SAW', 'SQU'], 'SIN'), P('spread', 'SPREAD', 0, 100, '%', 'lin', 50)];
  var FXDEF = {
    'Hall Reverb': RV(0.2, 5), 'Ambience': RV(0.2, 7.3), 'Ambiance': RV(0.2, 7.3), 'Rich Plate Reverb': RV(0.3, 29), 'Plate Reverb': RV(0.5, 10), 'Room Reverb': RV(0.3, 29), 'Chamber Reverb': RV(0.3, 29), 'Vintage Reverb': RV(0.3, 4.5), 'Vintage Room': RV(0.3, 4.5),
    'Stereo Delay': DLY, '3-Tap Delay': DLY, 'Stereo Chorus': MOD, 'Stereo Flanger': MOD, 'Stereo Phaser': MOD,
    'Dual DeEsser': [P('lo', 'LO BAND', 0, 50, 'dB', 'lin', 0), P('hi', 'HI BAND', 0, 50, 'dB', 'lin', 0), P('voice', 'VOICE', 0, 0, '', ['FEM', 'MALE'], 'FEM'), P('mode', 'MODE', 0, 0, '', ['ST', 'M/S'], 'ST'), P('mix', 'MIX', 0, 100, '%', 'lin', 100)],
    'Stereo Pitch': [P('semi', 'SEMITONE', -12, 12, '', 'lin', 0), P('cent', 'CENT', -50, 50, '', 'lin', 0), P('delay', 'DELAY', 1, 100, 'ms', 'log', 10), P('lowcut', 'LO CUT', 10, 500, 'Hz', 'log', 10), P('hicut', 'HI CUT', 200, 20000, 'Hz', 'log', 20000), P('mix', 'MIX', 0, 100, '%', 'lin', 50)],
    'Tube Stage': [P('drive', 'DRIVE', 0, 100, '%', 'lin', 20), P('even', 'EVEN HARM', 0, 50, '%', 'lin', 10), P('odd', 'ODD HARM', 0, 50, '%', 'lin', 10), P('gain', 'GAIN', -12, 12, 'dB', 'lin', 0), P('lowcut', 'LO CUT', 10, 500, 'Hz', 'log', 10), P('mix', 'MIX', 0, 100, '%', 'lin', 100)],
    'Leisure Compressor': [P('gain', 'GAIN', 0, 60, 'dB', 'lin', 0), P('peak', 'PEAK RED.', 0, 100, '%', 'lin', 30), P('mode', 'MODE', 0, 0, '', ['COMP', 'LIM'], 'COMP'), P('out', 'OUT GAIN', -18, 6, 'dB', 'lin', 0), P('mix', 'MIX', 0, 100, '%', 'lin', 100)]
  };
  function isGeq(t) { return /Graphic EQ|TrueEQ/.test(t || ''); }
  function fxDefs(t) { if (FXDEF[t]) return FXDEF[t]; if (/Reverb|Room|Ambi/.test(t)) return RV(0.2, 10); if (/Delay/.test(t)) return DLY; if (/Chorus|Flanger|Phaser/.test(t)) return MOD; return [P('mix', 'MIX', 0, 100, '%', 'lin', 100)]; }
  function fxTypes() { var X = M(); return X.FX_TYPES || Object.keys(FXDEF); }
  function fxTypesFor(slot) { var all = fxTypes(); if (slot < 4) return all; return all.filter(function (t) { return !/Reverb|Ambi|Room|Delay|Chorus|Flanger|Pitch/.test(t); }); }   // FX 5-8 은 인서트 이펙트만(X32 설명서)
  function fxShort(t) { return { 'Hall Reverb': 'HALL', 'Ambience': 'AMBI', 'Rich Plate Reverb': 'RPLT', 'Plate Reverb': 'PLAT', 'Room Reverb': 'ROOM', 'Chamber Reverb': 'CHAM', 'Vintage Reverb': 'VREV', 'Stereo Delay': 'DLY', '3-Tap Delay': '3TAP', 'Stereo Chorus': 'CRS', 'Stereo Flanger': 'FLNG', 'Stereo Phaser': 'PHAS', 'Dual Graphic EQ': 'GEQ2', 'Stereo Graphic EQ': 'GEQ', 'Dual DeEsser': 'DES2', 'Stereo Pitch': 'PIT', 'Tube Stage': 'DRV', 'Leisure Compressor': 'LEC' }[t] || String(t || '').slice(0, 4).toUpperCase(); }
  var GEQF = [20, 25, 31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000, 12500, 16000, 20000];
  function geqLbl(f) { return f >= 1000 ? (f / 1000) + 'k' : String(f); }

  /* ---------------------------------------------------------------- 소리 그래프 계산 */
  function biq(type, f0, g, q) {
    var A = Math.pow(10, g / 40), w0 = 2 * Math.PI * clamp(f0, 10, 22000) / FS, cs = Math.cos(w0), sn = Math.sin(w0), al = sn / (2 * Math.max(0.1, q)), b0, b1, b2, a0, a1, a2, sq;
    if (type === 'VEQ') { q = q * (1 + Math.abs(g) / 10); al = sn / (2 * q); type = 'PEQ'; }
    if (type === 'PEQ') { b0 = 1 + al * A; b1 = -2 * cs; b2 = 1 - al * A; a0 = 1 + al / A; a1 = -2 * cs; a2 = 1 - al / A; }
    else if (type === 'LShv') { sq = 2 * Math.sqrt(A) * al; b0 = A * ((A + 1) - (A - 1) * cs + sq); b1 = 2 * A * ((A - 1) - (A + 1) * cs); b2 = A * ((A + 1) - (A - 1) * cs - sq); a0 = (A + 1) + (A - 1) * cs + sq; a1 = -2 * ((A - 1) + (A + 1) * cs); a2 = (A + 1) + (A - 1) * cs - sq; }
    else if (type === 'HShv') { sq = 2 * Math.sqrt(A) * al; b0 = A * ((A + 1) + (A - 1) * cs + sq); b1 = -2 * A * ((A - 1) + (A + 1) * cs); b2 = A * ((A + 1) + (A - 1) * cs - sq); a0 = (A + 1) - (A - 1) * cs + sq; a1 = 2 * ((A - 1) - (A + 1) * cs); a2 = (A + 1) - (A - 1) * cs - sq; }
    else if (type === 'LCut') { b0 = (1 + cs) / 2; b1 = -(1 + cs); b2 = (1 + cs) / 2; a0 = 1 + al; a1 = -2 * cs; a2 = 1 - al; }
    else if (type === 'HCut') { b0 = (1 - cs) / 2; b1 = 1 - cs; b2 = (1 - cs) / 2; a0 = 1 + al; a1 = -2 * cs; a2 = 1 - al; }
    else return null;
    return [b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0];
  }
  function magDb(c, f) { if (!c) return 0; var w = 2 * Math.PI * f / FS, c1 = Math.cos(w), c2 = Math.cos(2 * w), s1 = Math.sin(w), s2 = Math.sin(2 * w); var nr = c[0] + c[1] * c1 + c[2] * c2, ni = -(c[1] * s1 + c[2] * s2), dr = 1 + c[3] * c1 + c[4] * c2, di = -(c[3] * s1 + c[4] * s2); return 10 * Math.log10((nr * nr + ni * ni) / (dr * dr + di * di) + 1e-12); }
  function eqResp(eq, lc, n) {
    var D = DSP(); if (D && D.eqResponse) { var fr = [], i; for (i = 0; i <= n; i++) fr.push(20 * Math.pow(1000, i / n)); var bl = eq && eq.on !== false ? (eq.bands || []).slice() : []; if (lc && lc.on) bl.push({ type: 'LCut', freq: lc.freq, gain: 0, q: 0.707 }); try { return D.eqResponse(bl, fr, FS); } catch (e) { /* 아래 식으로 */ } }
    return eqResp0(eq, lc, n);
  }
  function eqResp0(eq, lc, n) { var bands = (eq && eq.bands) || [], cs = bands.map(function (b) { var lcq = b.type === 'LCut' || b.type === 'HCut' ? 0.707 : b.q; return biq(b.type, b.freq, b.gain, lcq); }), lcc = lc && lc.on ? biq('LCut', lc.freq, 0, 0.707) : null, out = [], i, f;
    for (i = 0; i <= n; i++) { f = 20 * Math.pow(1000, i / n); var d = 0; if (eq && eq.on !== false) cs.forEach(function (c) { d += magDb(c, f); }); if (lcc) d += magDb(lcc, f); out.push(d); } return out; }
  function DSP() { return window.X32Audio && window.X32Audio.dsp; }   // 오디오 엔진과 같은 식(있으면)
  function gateOut(x, g) { var D = DSP(); if (g && g.on && D && D.gateGain) return x + D.gateGain(x, g.mode, +g.thr, +g.range || 0); return gateOut0(x, g); }
  function dynOut(x, d) { var D = DSP(); if (d && d.on && D && D.compGain) return x + D.compGain(x, +d.thr, +d.ratio || 1, +d.knee || 0, d.mode) + (+d.gain || 0); return dynOut0(x, d); }
  function gateOut0(x, g) { if (!g || !g.on) return x; if (g.mode === 'DUCK') return x >= g.thr ? x - g.range : x; if (x >= g.thr) return x; var r = g.mode === 'EXP2' ? 2 : g.mode === 'EXP3' ? 3 : g.mode === 'EXP4' ? 4 : 1e9; var y = r > 1e8 ? x - g.range : g.thr + (x - g.thr) * r; return Math.max(y, x - g.range); }
  function dynOut0(x, d) {
    if (!d || !d.on) return x; var thr = d.thr, r = d.ratio || 1, kw = (d.knee || 0) * 4, y;
    if (d.mode === 'EXP') y = x >= thr ? x : Math.max(thr + (x - thr) * r, -120);
    else if (kw > 0 && Math.abs(x - thr) <= kw / 2) { var t = x - thr + kw / 2; y = x + (1 / r - 1) * t * t / (2 * kw); }
    else y = x > thr ? thr + (x - thr) / r : x;
    return y + (d.gain || 0);
  }

  /* ---------------------------------------------------------------- 모양(CSS) */
  function css() {
    if (document.getElementById('x32s-css')) return;
    var st = document.createElement('style'); st.id = 'x32s-css';
    st.textContent = [
      '.x32s{position:relative;width:100%;height:100%;overflow:hidden;background:#000;touch-action:none;user-select:none;-webkit-user-select:none;border-radius:inherit;contain:layout paint}',
      '.x32s.auto{aspect-ratio:800/480;height:auto}',
      '.x32s.small{touch-action:pan-x pan-y}.x32s.small [data-enc],.x32s.small [data-d]{touch-action:none}',
      '.x32s *{box-sizing:border-box}',
      '.x32s-scr{position:absolute;left:0;top:0;width:800px;height:480px;transform-origin:0 0;background:#05070a;color:#e6ebf0;font:13px/1.2 Arial,"Helvetica Neue","Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif;overflow:hidden;text-align:left;letter-spacing:0}',
      '.x32s-scr [data-a],.x32s-scr [data-d]{cursor:pointer}',
      /* 머리 */
      '.x32s-hd{position:absolute;left:0;top:0;width:800px;height:36px;display:flex;align-items:stretch;gap:4px;padding:3px 4px;background:linear-gradient(#323942,#171c22);border-bottom:1px solid #000}',
      '.x32s-hd .cb{display:flex;align-items:center;gap:6px;width:250px;padding:0 8px;border-radius:3px;font-weight:700;overflow:hidden;white-space:nowrap}',
      '.x32s-hd .cb .id{font-size:12px;opacity:.85}.x32s-hd .cb .nm{font-size:16px;overflow:hidden;text-overflow:ellipsis}',
      '.x32s-hd .sc{flex:1;display:flex;align-items:center;gap:6px;padding:0 10px;background:#0c0f13;border-radius:3px;border:1px solid #2b323b;overflow:hidden;white-space:nowrap;font-size:13px}',
      '.x32s-hd .sc b{color:#ffd23a}.x32s-hd .sc i{font-style:normal;color:#ff9f1c;font-weight:700}',
      '.x32s-hd .in{display:flex;align-items:center;gap:5px;padding:0 4px;font-size:11px;font-weight:700;color:#8a96a3}',
      '.x32s-hd .in span{padding:2px 4px;border-radius:2px;border:1px solid #3a424c}.x32s-hd .in span.on{color:#062;background:#3ddc84;border-color:#3ddc84}',
      '.x32s-hd .in .tm{font-size:14px;color:#e6ebf0;border:0;min-width:42px;text-align:right}',
      '.x32s-hd .bg{width:58px;border-radius:3px;border:1px solid #5b6672;background:#28303a;color:#fff;font:700 12px/1 inherit;cursor:pointer}',
      /* 탭 */
      '.x32s-tb{position:absolute;left:0;top:36px;width:800px;height:34px;display:flex;align-items:stretch;background:#11151a;border-bottom:2px solid #39c6f4}',
      '.x32s-tb .pg{display:flex;align-items:center;padding:0 10px;background:#39c6f4;color:#001018;font-weight:900;font-size:13px;letter-spacing:.02em}',
      '.x32s-tb .t{flex:1 1 0;display:flex;align-items:center;justify-content:center;min-width:0;padding:0 4px;color:#9aa6b2;font-size:13px;font-weight:700;border-right:1px solid #232a32;white-space:nowrap;overflow:hidden}',
      '.x32s-tb .t.on{background:linear-gradient(#4a5563,#2c343e);color:#fff}',
      '.x32s-tb .ly{display:flex;align-items:center;padding:0 8px;color:#ffd23a;font-size:11px;font-weight:700;white-space:nowrap}',
      /* 몸통 · 엔코더 */
      '.x32s-bd{position:absolute;left:0;top:70px;width:800px;height:332px;overflow:hidden}',
      '.x32s-en{position:absolute;left:0;top:402px;width:800px;height:78px;display:flex;background:#000;border-top:1px solid #39424d}',
      '.x32s-en .e{flex:1 1 0;position:relative;margin:3px 2px;padding:5px 7px 4px;border-radius:4px;background:linear-gradient(#262d36,#171c22);border:1px solid #333c47;overflow:hidden;cursor:ns-resize;touch-action:none}',
      '.x32s-en .e.x{opacity:.35;cursor:default}',
      '.x32s-en .e.fl{border-color:#39c6f4;box-shadow:0 0 0 1px #39c6f4 inset}',
      '.x32s-en .e .l{font-size:11px;font-weight:700;color:#9fb0c0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-transform:uppercase}',
      '.x32s-en .e .v{font-size:18px;font-weight:700;color:#fff;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.x32s-en .e .r{position:absolute;left:7px;right:7px;bottom:6px;height:4px;background:#0a0d10;border-radius:2px;overflow:hidden}.x32s-en .e .r b{display:block;height:100%;background:#39c6f4}',
      '.x32s-en .e .p{position:absolute;right:5px;top:4px;padding:1px 4px;border-radius:2px;font-size:10px;font-weight:900;color:#9aa6b2;border:1px solid #4a5462}',
      '.x32s-en .e .p.on{background:#ffd23a;color:#1a1400;border-color:#ffd23a}',
      '.x32s-en .e .p.cg.on{background:#3ddc84;border-color:#3ddc84;color:#032}',
      '.x32s-en .e .p.cr.on{background:#ff4d4d;border-color:#ff4d4d;color:#200}',
      /* 공통 상자 */
      '.x32s .bx{position:absolute;background:#12161c;border:1px solid #2f3842;border-radius:4px;overflow:hidden}',
      '.x32s .bx>.h{display:flex;align-items:center;gap:6px;height:22px;padding:0 7px;background:linear-gradient(#2c343e,#1f252d);font-weight:700;font-size:12px;color:#cfd8e2;white-space:nowrap}',
      '.x32s .led{display:inline-block;min-width:24px;padding:1px 4px;border-radius:2px;font-size:10px;font-weight:900;text-align:center;color:#7d8996;border:1px solid #47515d;background:#0b0e12}',
      '.x32s .led.on{background:#3ddc84;color:#032;border-color:#3ddc84}.x32s .led.y.on{background:#ffd23a;border-color:#ffd23a;color:#1a1400}.x32s .led.r.on{background:#ff4d4d;border-color:#ff4d4d;color:#200}.x32s .led.o.on{background:#ff9f1c;border-color:#ff9f1c;color:#210}',
      '.x32s .kv{display:flex;justify-content:space-between;gap:6px;padding:2px 7px;font-size:12px;white-space:nowrap}.x32s .kv span{color:#8a96a3}.x32s .kv b{color:#fff;font-weight:700}',
      '.x32s .kv.hi{background:#173246}.x32s .kv.hi b{color:#ffd23a}',
      '.x32s .big{font-size:22px;font-weight:700;color:#fff}',
      '.x32s .dim{color:#7d8996}.x32s .yel{color:#ffd23a}.x32s .cy{color:#39c6f4}',
      '.x32s .lst{position:absolute;overflow:hidden}.x32s .lst div{height:16px;line-height:16px;padding:0 6px;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#b8c3ce;border-radius:2px}',
      '.x32s .lst div.cur{color:#3ddc84;font-weight:700}.x32s .lst div.cur::before{content:"\\25CF ";}',
      '.x32s .lst div.hi{background:#39c6f4;color:#001018;font-weight:700}',
      '.x32s .btn{display:inline-flex;align-items:center;justify-content:center;padding:3px 8px;border-radius:3px;border:1px solid #4a5462;background:linear-gradient(#323b46,#222831);color:#e6ebf0;font-size:12px;font-weight:700;white-space:nowrap}',
      '.x32s .btn.on{background:#ffd23a;color:#1a1400;border-color:#ffd23a}.x32s .btn.g.on{background:#3ddc84;border-color:#3ddc84;color:#032}.x32s .btn.r.on{background:#ff4d4d;border-color:#ff4d4d;color:#200}',
      /* 미터 */
      '.x32s .mv{position:absolute;background:#0a0d10;border:1px solid #232a32;overflow:hidden}',
      '.x32s .mv>b{position:absolute;inset:0;background:linear-gradient(0deg,#22c55e 0,#22c55e 70%,#facc15 70%,#facc15 90%,#ef4444 90%);clip-path:inset(calc((1 - var(--v,0)) * 100%) 0 0 0)}',
      '.x32s .mh{position:absolute;background:#0a0d10;border:1px solid #232a32;overflow:hidden}',
      '.x32s .mh>b{position:absolute;inset:0;background:linear-gradient(90deg,#22c55e 0,#22c55e 70%,#facc15 70%,#facc15 90%,#ef4444 90%);clip-path:inset(0 calc((1 - var(--v,0)) * 100%) 0 0)}',
      '.x32s .mv.gr>b{background:#ff9f1c;clip-path:inset(0 0 calc((1 - var(--v,0)) * 100%) 0)}.x32s .mh.gr>b{background:#ff9f1c;clip-path:inset(0 0 0 calc((1 - var(--v,0)) * 100%))}',
      '.x32s .mv.gt>b{background:#a78bfa;clip-path:inset(0 0 calc((1 - var(--v,0)) * 100%) 0)}',
      '.x32s .gl{display:inline-block;width:12px;height:12px;border-radius:50%;background:#2a2f36;border:1px solid #47515d;vertical-align:-2px}.x32s .gl.on{background:#3ddc84;box-shadow:0 0 6px #3ddc84}',
      '.x32s svg text{font-family:inherit}',
      /* 창(이름 · 키보드) */
      '.x32s-md{position:absolute;left:0;top:70px;width:800px;height:332px;background:#0b0e12;display:none}',
      '.x32s-md.on{display:block}',
      '.x32s-md .kb{position:absolute;left:10px;top:84px;width:540px}',
      '.x32s-md .kb div{display:flex;gap:4px;margin-bottom:4px;justify-content:center}',
      '.x32s-md .kb span{flex:0 0 48px;height:40px;display:flex;align-items:center;justify-content:center;border-radius:4px;background:linear-gradient(#38424e,#252c35);border:1px solid #4d5866;font-size:16px;font-weight:700;color:#fff;cursor:pointer}',
      '.x32s-md .kb span.w{flex-basis:96px;font-size:13px}.x32s-md .kb span.ww{flex-basis:200px;font-size:13px}.x32s-md .kb span.hi{background:#39c6f4;color:#001018;border-color:#39c6f4}',
      '.x32s-md .nf{position:absolute;left:10px;top:10px;width:540px;height:64px;border-radius:5px;border:2px solid #39c6f4;background:#000;display:flex;align-items:center;gap:10px;padding:0 12px}',
      '.x32s-md .nf .tx{font-size:28px;font-weight:700;color:#fff;white-space:pre;letter-spacing:.02em}.x32s-md .nf .tx u{text-decoration:none;border-left:3px solid #ffd23a;margin-left:-1px;animation:x32sBlink 1s steps(1) infinite}',
      '@keyframes x32sBlink{50%{border-color:transparent}}',
      '.x32s-md input.ti{position:absolute;left:10px;top:10px;width:540px;height:64px;opacity:0;font-size:16px;border:0;padding:0;cursor:text}',
      '.x32s-md .sw{position:absolute;left:566px;top:10px;width:224px}',
      '.x32s-md .sw i{display:inline-block;width:50px;height:30px;margin:0 4px 4px 0;border-radius:3px;border:2px solid #333;cursor:pointer;font-style:normal;font-size:10px;font-weight:900;text-align:center;line-height:26px}',
      '.x32s-md .sw i.on{border-color:#fff;box-shadow:0 0 0 2px #39c6f4}',
      /* 작은 화면 글자 · 크게 보기 */
      '.x32s-cap{position:absolute;left:0;right:0;bottom:0;padding:2% 3%;background:rgba(0,0,0,.82);color:#fff;font:700 13px/1.2 Arial,"Noto Sans KR",sans-serif;display:none;pointer-events:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.x32s.small .x32s-cap{display:block}',
      '.x32s-cap b{color:#ffd23a}',
      '.x32s-zb{position:absolute;right:2%;top:3%;z-index:2;padding:.25em .5em;border-radius:4px;border:1px solid #9fdcff;background:rgba(10,40,60,.92);color:#fff;font:800 11px/1.1 Arial,"Noto Sans KR",sans-serif;cursor:pointer;display:none}',
      '.x32s.small .x32s-zb{display:block}',
      '.x32s-big{margin:8px 0 4px;padding:10px;border-radius:12px;background:#0f1720;border:1px solid #23303d;color:#e5e7eb;display:flex;flex-direction:column;gap:8px;min-width:0}',
      '.x32s-big .bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:.82rem}.x32s-big .bar b{font-size:.92rem}.x32s-big .bar .sp{flex:1 1 auto}',
      '.x32s-big button{font:inherit;font-size:.78rem;font-weight:700;color:#e5e7eb;background:#1f2a36;border:1px solid #3a4a5b;border-radius:8px;padding:6px 10px;cursor:pointer;touch-action:manipulation}',
      '.x32s-big button.on{background:#39c6f4;color:#001018;border-color:#39c6f4}',
      '.x32s-big .host{width:100%;max-width:800px;margin:0 auto;aspect-ratio:800/480;border-radius:6px;overflow:hidden;border:3px solid #2a2f36;background:#000}',
      '.x32s-big .row{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}',
      '.x32s-big .encs{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px;max-width:800px;width:100%;margin:0 auto}',
      '.x32s-big .enc{display:flex;flex-direction:column;align-items:center;gap:4px;min-width:0}',
      '.x32s-big .knob{width:min(56px,100%);aspect-ratio:1;border-radius:50%;background:radial-gradient(circle at 40% 35%,#4a4d53,#1d1e21 70%);border:2px solid #0a0a0b;box-shadow:0 0 0 3px #26292e;position:relative;cursor:ns-resize;touch-action:none}',
      '.x32s-big .knob::after{content:"";position:absolute;left:50%;top:8%;width:3px;height:32%;margin-left:-1.5px;background:#ff8a1f;border-radius:2px;transform-origin:50% 130%;transform:rotate(var(--r,0deg))}',
      '.x32s-big .enc .pm{display:flex;gap:3px;width:100%}.x32s-big .enc .pm button{flex:1;padding:5px 0;min-width:0}',
      '.x32s-big .enc .pr{width:100%;padding:5px 0}',
      '.x32s-big .help{margin:0;font-size:.8rem;line-height:1.5;color:#b6c2cf}',
      '.x32s-big .help.rot{display:none;color:#7dd3fc}',
      '@media (max-width:560px){.x32s-big .help.rot{display:block}.x32s-big{padding:8px}.x32s-big .encs{gap:3px}.x32s-big button{padding:6px 6px;font-size:.72rem}}'
    ].join('\n');
    document.head.appendChild(st);
  }

  /* ================================================================ mount */
  function mount(el, m, opts) {
    opts = opts || {}; css();
    var alive = true, raf = 0, views = [], big = null, ro = null, dirty = true, lastLayout = '';
    var LS = {};   // 모델에 없는 화면 전용 값(편집 중 위치 등)
    var ui = { layer: {}, srcHi: null, keyHi: null, insHi: null, rtHi: [null, null, null, null, null], rtFocus: 0, outHi: null, fxSel: 0, fxTypeHi: null, sendFocus: 0, dcaSel: 0, mgSel: 0, sceneHi: null, libHi: 0, libScope: { head: true, config: true, gate: true, dyn: true, eq: true, sends: false }, libFx: 0, setRow: 0, linkHi: 0, chHi: 0, safeHi: 0, tbHi: 0, geqBand: 15, utilFrom: null, flash: -1, flashT: 0, toast: '', toastT: 0, pend: null, clip: null, msg: '', msgT: 0, lastPage: 'home' };
    var modal = null;   // { kind:'name', type, index, text, cur, ch, color, icon, after }

    /* ---------- 읽기 · 쓰기 */
    function G(p) { var v = m.get ? m.get(p) : undefined; return v === undefined ? LS[p] : v; }
    function Gd(p, d) { var v = G(p); return v == null ? d : v; }
    function SET(p, v) { if (m.set) m.set(p, v, { from: 'screen' }); else LS[p] = v; touch(); }
    function setDeep(prefix, obj) { m.batch(function () { (function walk(pre, o) { if (o === null || typeof o !== 'object' || Array.isArray(o) && o.length && typeof o[0] !== 'object' && pre.slice(-6) !== '.bands') { SET(pre, o); return; } if (Array.isArray(o) && typeof o[0] !== 'object') { o.forEach(function (x, i) { SET(pre + '.' + i, x); }); return; } Object.keys(o).forEach(function (k) { walk(pre + '.' + k, o[k]); }); })(prefix, obj); }); }
    function touch() { dirty = true; }
    function msg(t) { ui.msg = t; ui.msgT = now(); touch(); }
    function page() { var p = Gd('screen.page', 'home'); return PAGEDEF[p] ? p : 'home'; }
    function sel() { var s = Gd('config.selected', { type: 'ch', index: 0 }), t = s.type || 'ch', i = s.index | 0; if (t === 'main' && (i === 'm' || s.index === 'm')) i = 1; var pre = t === 'main' ? 'main.' + (i === 1 ? 'm' : 'st') : t + '.' + i; return { t: t, i: i, pre: pre, o: G(pre) || {}, id: m.shortId ? m.shortId(t, i) : t + ' ' + (i + 1), name: m.label ? m.label(t, i) : (G(pre + '.name') || '') }; }
    function stripAt(t, i) { return t === 'main' ? G('main.' + (i === 1 ? 'm' : 'st')) : G(t + '.' + i); }
    function meterOf(t, i) { var mt = m.meters || {}; if (t === 'main') { var mm = mt.main || {}; return i === 1 ? mm.m : Math.max(mm.l == null ? NINF : mm.l, mm.r == null ? NINF : mm.r); } var a = mt[t]; return a ? a[i] : NINF; }
    function inMeter(s) { var mt = m.meters || {}, k = { ch: 'chIn', aux: 'auxIn', fxr: 'fxrIn' }[s.t]; if (k && mt[k] && mt[k][s.i] != null) return mt[k][s.i]; return meterOf(s.t, s.i); }   // 게이트 · 컴프에 들어가는 크기(GAIN 뒤)
    function choose(list, i) { return list[clamp(i, 0, list.length - 1)]; }
    function stepList(list, cur, d) { var k = list.indexOf(cur); if (k < 0) k = 0; return list[clamp(k + d, 0, list.length - 1)]; }

    /* ---------- 엔코더 정의 만들기 */
    function E(l, v, t, p, x) { var e = { l: l, v: v, t: t, p: p }; if (x) for (var k in x) e[k] = x[k]; return e; }
    var NOE = E('', '', null, null, { x: true });
    function tNum(path, lo, hi, step, def) { return function (d) { var v = +Gd(path, def == null ? lo : def); SET(path, +clamp(Math.round((v + d * step) / step) * step, lo, hi).toFixed(4)); }; }
    function tLog(path, lo, hi, steps, def) { return function (d) { var v = +Gd(path, def || lo); if (!(v > 0)) v = lo; SET(path, sig(clamp(v * Math.pow(hi / lo, d / steps), lo, hi), 4)); }; }
    function tList(path, list) { return function (d) { SET(path, stepList(list, G(path), d)); }; }
    function tFader(path) { return function (d) { var p = db2f(Gd(path, OFF)); var np = clamp(p + d / 100, 0, 1); var db = np <= 0 ? OFF : Math.round(f2db(np) * 10) / 10; SET(path, db); }; }
    function pTog(path) { return function () { SET(path, !G(path)); }; }
    function frLin(v, lo, hi) { return clamp((v - lo) / (hi - lo), 0, 1); }
    function frLog(v, lo, hi) { return v > 0 ? clamp(Math.log(v / lo) / Math.log(hi / lo), 0, 1) : 0; }

    /* ================================================================ 페이지 정의 */
    var TABS = {
      home: [['home', 'home'], ['config', 'config'], ['gate', 'gate'], ['dyn', 'dyn'], ['eq', 'eq'], ['sends', 'sends'], ['main', 'main']],
      meters: [['channel', 'channel'], ['mixbus', 'mix bus'], ['auxfx', 'aux/fx'], ['inout', 'in/out'], ['rta', 'rta']],
      routing: [['home', 'home'], ['out', 'out 1-16'], ['aux', 'aux out'], ['p16', 'p16 out'], ['card', 'card out'], ['aes50a', 'aes50-a'], ['aes50b', 'aes50-b'], ['xlr', 'xlr out']],
      setup: [['global', 'global'], ['config', 'config'], ['remote', 'remote'], ['network', 'network'], ['scribble', 'scribble strip'], ['preamps', 'preamps'], ['card', 'card']],
      library: [['channel', 'channel'], ['effects', 'effects'], ['routing', 'routing']],
      effects: [['home', 'home']].concat(range(8).map(function (k) { return ['fx' + (k + 1), 'fx' + (k + 1)]; })),
      mutegrp: [['home', 'mute groups']],
      scenes: [['home', 'home'], ['scenes', 'scenes'], ['psafe', 'param safe'], ['csafe', 'chan safe']],
      monitor: [['monitor', 'monitor'], ['talka', 'talk A'], ['talkb', 'talk B'], ['osc', 'osc']],
      assign: [['home', 'home'], ['seta', 'set A'], ['setb', 'set B'], ['setc', 'set C']],
      recorder: [['home', 'home'], ['config', 'config']],
      utility: [['util', 'utility']]
    };
    var PNAME = { home: 'HOME', meters: 'METERS', routing: 'ROUTING', setup: 'SETUP', library: 'LIBRARY', effects: 'EFFECTS', mutegrp: 'MUTE GRP', scenes: 'SCENES', monitor: 'MONITOR', assign: 'ASSIGN', recorder: 'USB', utility: 'UTILITY' };
    function homeVisible(s) { var o = s.o || {}; return TABS.home.filter(function (t) { var id = t[0]; if (id === 'gate') return !!o.gate; if (id === 'dyn') return !!o.dyn; if (id === 'sends') return !!(o.sends || o.mtxSends); if (id === 'eq') return !!o.eq; if (id === 'main') return o.fader != null; return true; }); }
    function tabsOf(p) { return p === 'home' ? homeVisible(sel()) : TABS[p] || [['home', 'home']]; }
    function tabId(p) {
      var tabs = tabsOf(p), t = G('screen.tab'), all = p === 'home' ? TABS.home : tabs;
      var id = typeof t === 'string' ? t : (all[t | 0] || all[0])[0];
      if (!tabs.some(function (x) { return x[0] === id; })) { if (p === 'home') { var order = ['eq', 'config', 'home']; id = tabs.some(function (x) { return x[0] === id; }) ? id : (id === 'gate' || id === 'dyn' ? (tabs.some(function (x) { return x[0] === 'dyn'; }) ? 'dyn' : 'eq') : order.filter(function (o) { return tabs.some(function (x) { return x[0] === o; }); })[0]); } else id = tabs[0][0]; }
      return id;
    }
    function setTab(p, id) { var all = p === 'home' ? TABS.home : tabsOf(p), k = -1; all.forEach(function (t, i) { if (t[0] === id) k = i; }); if (k < 0) k = 0; m.batch(function () { if (G('screen.page') !== p) SET('screen.page', p); SET('screen.tab', k); }); }
    function layerKey() { return page() + ':' + tabId(page()); }
    function layer(n) { var k = layerKey(), v = ui.layer[k] || 0; return n ? clamp(v, 0, n - 1) : v; }

    /* ---------- 공통 그림 */
    function svgGrid(w, h, xs, ys) { var s = ''; xs.forEach(function (x) { s += '<line x1="' + x + '" y1="0" x2="' + x + '" y2="' + h + '" stroke="#26303a"/>'; }); ys.forEach(function (y) { s += '<line x1="0" y1="' + y + '" x2="' + w + '" y2="' + y + '" stroke="#26303a"/>'; }); return s; }
    function fx2x(f, w) { return Math.log(f / 20) / Math.log(1000) * w; }
    function eqSvg(o, w, h, ctx, big) {
      var eq = o.eq || {}, lc = o.preamp && o.preamp.lowcut, n = big ? 160 : 60, r = eqResp(eq, lc, n), rng = big ? 15 : 18, y = function (d) { return h / 2 - clamp(d, -rng * 1.2, rng * 1.2) / rng * (h / 2 - 4); }, pts = r.map(function (d, i) { return (i / n * w).toFixed(1) + ',' + y(d).toFixed(1); }).join(' ');
      var grid = svgGrid(w, h, [50, 100, 200, 500, 1000, 2000, 5000, 10000].map(function (f) { return +fx2x(f, w).toFixed(1); }), [y(12), y(6), y(0), y(-6), y(-12)].map(function (v) { return +v.toFixed(1); }));
      var s = '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" style="display:block">' + grid;
      if (big) { [[100, '100'], [1000, '1k'], [10000, '10k'], [50, '50'], [200, '200'], [500, '500'], [2000, '2k'], [5000, '5k']].forEach(function (f) { s += '<text x="' + (fx2x(f[0], w) + 3).toFixed(0) + '" y="' + (h - 4) + '" fill="#5f6b78" font-size="10">' + f[1] + '</text>'; }); [12, 6, -6, -12].forEach(function (d) { s += '<text x="3" y="' + (y(d) - 2).toFixed(0) + '" fill="#5f6b78" font-size="10">' + (d > 0 ? '+' : '') + d + '</text>'; }); }
      var on = eq.on !== false;
      s += '<polygon points="0,' + (h / 2) + ' ' + pts + ' ' + w + ',' + (h / 2) + '" fill="' + (on ? 'rgba(255,210,58,.16)' : 'rgba(140,150,160,.08)') + '"/>';
      s += '<polyline points="' + pts + '" fill="none" stroke="' + (on ? '#ffd23a' : '#6b7682') + '" stroke-width="' + (big ? 2.5 : 1.6) + '"/>';
      if (big && lc && lc.on) s += '<line x1="' + fx2x(lc.freq, w).toFixed(1) + '" y1="0" x2="' + fx2x(lc.freq, w).toFixed(1) + '" y2="' + h + '" stroke="#ff9f1c" stroke-dasharray="4 3"/><text x="' + (fx2x(lc.freq, w) + 4).toFixed(0) + '" y="14" fill="#ff9f1c" font-size="11" font-weight="700">LOW CUT</text>';
      if (big) (eq.bands || []).forEach(function (b, k) { var cx = fx2x(b.freq, w), cy = b.type === 'LCut' || b.type === 'HCut' ? h / 2 : y(b.gain), hi = k === (G('config.view.eqBand') | 0) ? 1 : 0; s += '<g ' + ctx.D({ type: 'eqpt', band: k }) + '><circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="' + (hi ? 13 : 11) + '" fill="' + BANDC[k] + '" fill-opacity=".9" stroke="' + (hi ? '#fff' : '#000') + '" stroke-width="2"/><text x="' + cx.toFixed(1) + '" y="' + (cy + 4).toFixed(1) + '" text-anchor="middle" font-size="12" font-weight="900" fill="#000">' + (k + 1) + '</text></g>'; });
      return s + '</svg>';
    }
    function xferSvg(kind, o, w, h, ctx, big) {
      var g = o[kind] || {}, lo = kind === 'gate' ? -80 : -60, X = function (d) { return (d - lo) / -lo * w; }, Y = function (d) { return h - (clamp(d, lo, 0) - lo) / -lo * h; }, pts = [];
      for (var i = 0; i <= 60; i++) { var x = lo + i / 60 * -lo, yv = kind === 'gate' ? gateOut(x, g) : dynOut(x, g); pts.push(X(x).toFixed(1) + ',' + Y(yv).toFixed(1)); }
      var tk = kind === 'gate' ? [-60, -40, -20] : [-48, -36, -24, -12];
      var s = '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" style="display:block" ' + (big ? ctx.D({ type: 'thr', kind: kind, lo: lo }) : '') + '>' + svgGrid(w, h, tk.map(function (d) { return +X(d).toFixed(1); }), tk.map(function (d) { return +Y(d).toFixed(1); }));
      s += '<line x1="0" y1="' + h + '" x2="' + w + '" y2="0" stroke="#3b4652" stroke-dasharray="3 3"/>';
      if (big) tk.forEach(function (d) { s += '<text x="' + (X(d) + 2).toFixed(0) + '" y="' + (h - 3) + '" fill="#5f6b78" font-size="10">' + d + '</text>'; });
      s += '<line x1="' + X(g.thr).toFixed(1) + '" y1="0" x2="' + X(g.thr).toFixed(1) + '" y2="' + h + '" stroke="#ff9f1c" stroke-width="' + (big ? 2 : 1) + '"/>';
      s += '<polyline points="' + pts.join(' ') + '" fill="none" stroke="' + (g.on ? '#39c6f4' : '#6b7682') + '" stroke-width="' + (big ? 2.5 : 1.6) + '"/>';
      s += '<circle data-dot="' + kind + '" data-w="' + w + '" data-h="' + h + '" cx="-10" cy="-10" r="' + (big ? 6 : 3.5) + '" fill="#ffd23a" stroke="#000"/>';
      if (big) s += '<text x="' + (X(g.thr) + 4).toFixed(0) + '" y="14" fill="#ff9f1c" font-size="11" font-weight="700">THR ' + fDb(g.thr) + '</text>';
      return s + '</svg>';
    }
    function mv(key, x, y, w, h, cls) { return '<div class="mv ' + (cls || '') + '" data-mt="' + key + '" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px"><b></b></div>'; }
    function mh(key, x, y, w, h, cls) { return '<div class="mh ' + (cls || '') + '" data-mt="' + key + '" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px"><b></b></div>'; }
    function bx(x, y, w, h, title, inner, extra) { return '<div class="bx" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px"' + (extra || '') + '>' + (title != null ? '<div class="h">' + title + '</div>' : '') + inner + '</div>'; }
    function led(on, txt, cls, a) { return '<span class="led ' + (cls || '') + (on ? ' on' : '') + '"' + (a || '') + '>' + esc(txt) + '</span>'; }
    function kv(k, v, hi, a) { return '<div class="kv' + (hi ? ' hi' : '') + '"' + (a || '') + '><span>' + esc(k) + '</span><b>' + v + '</b></div>'; }
    function listHtml(items, cur, hi, x, y, w, rows, ctx, onPick) {
      var n = items.length, start = clamp((hi == null ? cur : hi) - (rows >> 1), 0, Math.max(0, n - rows)), s = '<div class="lst" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + (rows * 16) + 'px">';
      for (var i = start; i < Math.min(n, start + rows); i++) s += '<div class="' + (i === cur ? 'cur ' : '') + (i === hi ? 'hi' : '') + '" ' + ctx.A((function (k) { return function () { onPick(k); }; })(i)) + '>' + esc(items[i]) + '</div>';
      return s + '</div>';
    }
    function chipColor(o) { var c = col(o.color); return 'background:' + c.bg + ';color:' + c.fg; }

    /* ================================================================ HOME */
    function srcIdx(v) { var L = SRC(); for (var i = 0; i < L.length; i++) if (L[i].v === v) return i; return 0; }
    function homeBuild(ctx) {
      var s = sel(), o = s.o, id = tabId('home'), pre = s.pre, b = '', enc = [], lay = 1, isIn = s.t === 'ch' || s.t === 'aux' || s.t === 'fxr';
      var pa = o.preamp || {}, g = o.gate, d = o.dyn, eq = o.eq || {};
      if (id === 'home' && s.t === 'dca') {
        var mem = []; ['ch', 'aux', 'fxr', 'bus', 'mtx'].forEach(function (t) { (G(t) || []).forEach(function (oo, i) { if (oo.dca && oo.dca[s.i]) mem.push({ t: t, i: i, o: oo }); }); });
        b += bx(6, 6, 600, 320, 'DCA ' + (s.i + 1) + ' Members (' + mem.length + ')', '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:5px;padding:7px">' + mem.map(function (x) { var c2 = col(x.o.color); return '<div style="height:44px;border-radius:3px;padding:3px 6px;background:' + c2.bg + ';color:' + c2.fg + ';overflow:hidden" ' + ctx.A(function () { if (m.select) m.select(x.t, x.i); }) + '><div style="font-size:10px;font-weight:700">' + esc(m.shortId ? m.shortId(x.t, x.i) : '') + '</div><div style="font-size:14px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(x.o.name || '') + '</div></div>'; }).join('') + '</div>');
        b += bx(612, 6, 182, 320, 'DCA Fader', '<div style="padding:10px"><div class="big">' + fDbI(o.fader) + ' <span class="dim" style="font-size:12px">dB</span></div><div style="margin-top:10px">' + led(o.mute, 'MUTE', 'r', ctx.A(pTog(pre + '.mute'))) + ' ' + led(o.solo, 'SOLO', 'y', ctx.A(pTog(pre + '.solo'))) + '</div><div class="dim" style="font-size:11px;margin-top:14px;line-height:1.4">DCA moves the level of all member channels together. It carries no audio itself.</div></div>');
        enc = [E('DCA', s.id, function (dd) { stepSel(dd); }, null), NOE, NOE, NOE, E('Solo', o.solo ? 'ON' : 'OFF', null, pTog(pre + '.solo'), { pl: 'SOLO', on: o.solo }), E('Fader', fDb(o.fader, 1), tFader(pre + '.fader'), pTog(pre + '.mute'), { f: db2f(o.fader), pl: 'MUTE', on: o.mute, pc: 'cr' })];
      }
      else if (id === 'home') {
        lay = 2; var L = layer(2);
        // 신호 흐름 상자
        var x = 6;
        if (isIn) { b += bx(x, 6, 150, 184, 'Input' + (s.t === 'ch' ? ' <span class="dim">' + esc(srcName(s)) + '</span>' : ''),
          '<div style="padding:6px 8px"><div class="big" ' + ctx.A(function () { }) + '>' + fDb(pa.gain) + '<span class="dim" style="font-size:12px"> dB</span></div>' +
          '<div style="display:flex;gap:4px;margin:6px 0">' + led(pa.phantom, '48V', 'r', ctx.A(pTog(pre + '.preamp.phantom'))) + led(pa.invert, 'Ø', 'y', ctx.A(pTog(pre + '.preamp.invert'))) + led(pa.lowcut && pa.lowcut.on, 'LC', 'y', ctx.A(pTog(pre + '.preamp.lowcut.on'))) + '</div>' +
          '<div class="dim" style="font-size:11px">LOW CUT</div><div style="font-weight:700">' + fHz(pa.lowcut && pa.lowcut.freq) + '</div>' +
          '<div class="dim" style="font-size:11px;margin-top:4px">DELAY ' + led(pa.delay && pa.delay.on, pa.delay && pa.delay.on ? 'ON' : 'OFF', 'y') + '</div><div style="font-weight:700">' + fMs(pa.delay && pa.delay.ms) + '</div></div>' + mv('sel', 136, 30, 8, 146)); x += 158; }
        if (g) { b += bx(x, 6, 112, 184, 'Gate ' + led(g.on, g.on ? 'ON' : 'OFF', '', ctx.A(pTog(pre + '.gate.on'))), '<div style="padding:5px 7px 0" ' + ctx.A(function () { setTab('home', 'gate'); }) + '>' + xferSvg('gate', o, 96, 84, ctx) + '</div>' + kv('THR', fDb(g.thr)) + kv('MODE', esc(g.mode)) + '<div class="kv"><span>KEY</span><b><span class="gl" data-gl="sel"></span></b></div>'); x += 120; }
        if (o.insert) { b += bx(x, 6, 74, 184, 'Insert', '<div style="padding:8px 7px">' + led(o.insert.on, o.insert.on ? 'ON' : 'OFF', 'y', ctx.A(pTog(pre + '.insert.on'))) + '<div class="dim" style="margin-top:10px;font-size:11px">POS</div><b>' + esc(o.insert.pos || 'POST') + '</b><div class="dim" style="margin-top:8px;font-size:11px">SEL</div><b>' + esc(o.insert.sel || 'OFF') + '</b></div>'); x += 82; }
        if (o.eq) { b += bx(x, 6, 168, 184, 'Equalizer ' + led(eq.on !== false, eq.on !== false ? 'ON' : 'OFF', '', ctx.A(pTog(pre + '.eq.on'))), '<div style="padding:5px 6px 0" ' + ctx.A(function () { setTab('home', 'eq'); }) + '>' + eqSvg(o, 154, 80, ctx) + '</div>' + (eq.bands || []).slice(0, 4).map(function (bd, k) { return '<div class="kv" style="padding:1px 7px"><span style="color:' + BANDC[k] + '">' + (BANDN[(eq.bands || []).length] || BANDN[4])[k] + '</span><b>' + fDb(bd.gain) + '</b></div>'; }).join('')); x += 176; }
        if (d) { b += bx(x, 6, 112, 184, 'Dynamics ' + led(d.on, d.on ? 'ON' : 'OFF', '', ctx.A(pTog(pre + '.dyn.on'))), '<div style="padding:5px 7px 0" ' + ctx.A(function () { setTab('home', 'dyn'); }) + '>' + xferSvg('dyn', o, 96, 84, ctx) + '</div>' + kv('THR', fDb(d.thr)) + kv('RATIO', fRatio(d.ratio)) + mh('selgr', 8, 168, 96, 8, 'gr')); x += 120; }
        // 오른쪽: 센드 · 메인
        var rx = Math.max(x, 650), rw = 800 - rx - 6, sd = o.sends || o.mtxSends || [];
        if (sd.length) { var bw = Math.floor((rw - 14) / sd.length); b += bx(rx, 6, rw, 92, (o.sends ? 'Sends' : 'Matrix'), '<div style="position:relative;height:66px" ' + ctx.A(function () { setTab('home', 'sends'); }) + '>' + sd.map(function (sn, k) { var f = db2f(sn.level); return '<div style="position:absolute;left:' + (7 + k * bw) + 'px;bottom:4px;width:' + (bw - 2) + 'px;height:' + Math.max(1, Math.round(f * 56)) + 'px;background:' + (sn.on === false ? '#4a5462' : '#39c6f4') + '"></div>'; }).join('') + '</div>'); }
        if (o.fader != null) b += bx(rx, 104, rw, 86, 'Main', (o.main ? '<div class="kv"><span>LR</span><b>' + led(o.main.st, 'ST', '', ctx.A(pTog(pre + '.main.st'))) + ' ' + led(o.main.mono, 'M', '', ctx.A(pTog(pre + '.main.mono'))) + '</b></div>' : '') + kv('PAN', fPan(o.main ? o.main.pan : o.pan)) + kv('FADER', fDb(o.fader)) + '');
        // 아래 줄: 미터 · DCA · 뮤트 그룹
        b += bx(6, 198, 380, 128, 'Meters', '<div class="dim" style="position:absolute;left:8px;top:32px;font-size:11px">IN</div>' + mh('sel', 40, 30, 330, 16) + '<div class="dim" style="position:absolute;left:8px;top:56px;font-size:11px">GATE</div>' + mh('selgt', 40, 54, 330, 10, 'gr') + '<div class="dim" style="position:absolute;left:8px;top:74px;font-size:11px">GR</div>' + mh('selgr', 40, 72, 330, 10, 'gr') +
          '<div style="position:absolute;left:8px;top:94px;right:8px;display:flex;justify-content:space-between;font-size:11px" class="dim"><span>-60</span><span>-48</span><span>-36</span><span>-24</span><span>-12</span><span>-6</span><span>0</span></div><div style="position:absolute;right:10px;top:6px;font-weight:700" class="yel" data-mv="sel"></div>');
        if (o.dca) b += bx(394, 198, 400, 60, 'DCA', '<div style="display:flex;gap:4px;padding:6px">' + o.dca.map(function (on, k) { return '<span class="btn' + (on ? ' on' : '') + '" style="flex:1;padding:4px 0' + (ui.dcaSel === k && L === 1 ? ';outline:2px solid #39c6f4' : '') + '" ' + ctx.A(pTog(pre + '.dca.' + k)) + '>' + (k + 1) + '</span>'; }).join('') + '</div>');
        if (o.muteGrp) b += bx(394, 266, 400, 60, 'Mute Groups', '<div style="display:flex;gap:4px;padding:6px">' + o.muteGrp.map(function (on, k) { return '<span class="btn r' + (on ? ' on' : '') + '" style="flex:1;padding:4px 0' + (ui.mgSel === k && L === 1 ? ';outline:2px solid #39c6f4' : '') + '" ' + ctx.A(pTog(pre + '.muteGrp.' + k)) + '>' + (k + 1) + '</span>'; }).join('') + '</div>');
        if (L === 0) enc = [
          isIn ? E('Gain', fDb(pa.gain, 1), tNum(pre + '.preamp.gain', -12, 60, 0.5), function () { var k = linkKey(s); if (k) SET(k, !G(k)); }, { f: frLin(pa.gain, -12, 60), pl: 'LINK', on: !!G(linkKey(s)) }) : NOE,
          g ? E('Gate Thr', fDb(g.thr, 1), tNum(pre + '.gate.thr', -80, 0, 0.5), pTog(pre + '.gate.on'), { f: frLin(g.thr, -80, 0), pl: 'GATE', on: g.on, pc: 'cg' }) : NOE,
          o.insert ? E('Insert', o.insert.pos || 'POST', tList(pre + '.insert.pos', ['PRE', 'POST']), pTog(pre + '.insert.on'), { pl: 'INS', on: o.insert.on, pc: 'cg' }) : NOE,
          d ? E('Dyn Pos', Gd(pre + '.dyn.pos', 'POST') === 'PRE' ? 'PRE EQ' : 'POST EQ', tList(pre + '.dyn.pos', ['PRE', 'POST']), pTog(pre + '.eq.on'), { pl: 'EQ', on: eq.on !== false, pc: 'cg' }) : (o.eq ? E('EQ', eq.on !== false ? 'ON' : 'OFF', null, pTog(pre + '.eq.on'), { pl: 'EQ', on: eq.on !== false, pc: 'cg' }) : NOE),
          d ? E('Comp Thr', fDb(d.thr, 1), tNum(pre + '.dyn.thr', -60, 0, 0.5), pTog(pre + '.dyn.on'), { f: frLin(d.thr, -60, 0), pl: 'COMP', on: d.on, pc: 'cg' }) : NOE,
          o.main ? E('Pan', fPan(o.main.pan), tNum(pre + '.main.pan', -100, 100, 2), pTog(pre + '.main.st'), { f: frLin(o.main.pan, -100, 100), pl: 'LR', on: o.main.st, pc: 'cg' }) : (o.pan != null ? E('Pan', fPan(o.pan), tNum(pre + '.pan', -100, 100, 2), null, { f: frLin(o.pan, -100, 100) }) : NOE)];
        else enc = [
          E('Channel', s.id, function (dd) { stepSel(dd); }, isIn ? pTog(pre + '.preamp.phantom') : null, isIn ? { pl: '48V', on: pa.phantom, pc: 'cr' } : null),
          isIn ? E('Phase', pa.invert ? 'INV' : 'NORM', null, pTog(pre + '.preamp.invert'), { pl: 'Ø', on: pa.invert }) : NOE,
          o.dca ? E('DCA', 'DCA ' + (ui.dcaSel + 1) + (o.dca[ui.dcaSel] ? ' ●' : ''), function (dd) { ui.dcaSel = clamp(ui.dcaSel + dd, 0, 7); touch(); }, pTog(pre + '.dca.' + ui.dcaSel), { pl: 'ASGN', on: o.dca[ui.dcaSel] }) : NOE,
          o.muteGrp ? E('Mute Grp', 'MG ' + (ui.mgSel + 1) + (o.muteGrp[ui.mgSel] ? ' ●' : ''), function (dd) { ui.mgSel = clamp(ui.mgSel + dd, 0, 5); touch(); }, pTog(pre + '.muteGrp.' + ui.mgSel), { pl: 'ASGN', on: o.muteGrp[ui.mgSel] }) : NOE,
          E('Solo', o.solo ? 'ON' : 'OFF', null, pTog(pre + '.solo'), { pl: 'SOLO', on: o.solo }),
          o.fader != null ? E('Fader', fDb(o.fader, 1), tFader(pre + '.fader'), pTog(pre + '.mute'), { f: db2f(o.fader), pl: 'MUTE', on: o.mute, pc: 'cr' }) : NOE];
      }
      else if (id === 'config') {
        lay = 2; var L2 = layer(2), SL = SRC(), si = srcIdx(o.source), shi = ui.srcHi == null ? si : ui.srcHi, c = col(o.color);
        b += bx(6, 6, 238, 126, 'Name / Color / Icon', '<div style="margin:6px 8px;height:50px;border-radius:4px;display:flex;align-items:center;gap:8px;padding:0 10px;' + chipColor(o) + '" ' + ctx.A(function () { openName(s.t, s.i); }) + '>' + icon(o.icon, 34) + '<div><div style="font-size:11px;font-weight:700;opacity:.8">' + esc(s.id) + '</div><div style="font-size:20px;font-weight:800;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(o.name || s.name) + '</div></div></div>' +
          '<div class="kv"><span>ICON</span><b>' + esc(ICONS[clamp((o.icon | 0) - 1, 0, 73)]) + '</b></div><div class="kv"><span>COLOR</span><b>' + esc(c.id) + '</b></div>');
        b += bx(6, 138, 238, 188, 'Color', '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;padding:6px">' + colors().map(function (cc, k) { return '<i style="display:block;height:28px;border-radius:3px;background:' + cc.bg + ';color:' + cc.fg + ';font-style:normal;font-size:10px;font-weight:900;text-align:center;line-height:26px;border:2px solid ' + ((o.color | 0) === k ? '#fff' : '#333') + '" ' + ctx.A(function () { SET(pre + '.color', k); }) + '>' + cc.id + '</i>'; }).join('') + '</div>');
        if (isIn) {
          b += bx(250, 6, 190, 320, 'Source', '');
          b += listHtml(SL.map(function (x) { return x.l; }), si, shi, 256, 34, 178, 18, ctx, function (k) { if (ui.srcHi === k) SET(pre + '.source', SL[k].v); ui.srcHi = k; touch(); });
          if (s.t === 'ch' && m.inputSource) { var is = m.inputSource(s.i); b += '<div style="position:absolute;left:256px;top:326px"></div>'; b += bx(446, 270, 348, 56, 'Signal', '<div class="kv"><span>' + esc(SL[si].l) + ' ←</span><b class="' + (is.live ? '' : 'yel') + '">' + esc(is.block ? blkLabel(is.kind + ' ' + is.n) : '—') + (is.live ? '' : '  (no signal)') + '</b></div>'); }
          b += bx(446, 6, 170, 120, 'Preamp', kv('GAIN', fDb(pa.gain, 1), L2 === 0) + kv('TRIM', fDb(pa.trim || 0, 1)) + '<div class="kv"><span>48V / Ø</span><b>' + led(pa.phantom, '48V', 'r', ctx.A(pTog(pre + '.preamp.phantom'))) + ' ' + led(pa.invert, 'Ø', 'y', ctx.A(pTog(pre + '.preamp.invert'))) + '</b></div><div class="kv"><span>LINK</span><b>' + led(!!G(linkKey(s)), 'LINK', 'y', ctx.A(function () { var k = linkKey(s); if (k) SET(k, !G(k)); })) + '</b></div>');
          b += bx(622, 6, 172, 120, 'Low Cut ' + led(pa.lowcut && pa.lowcut.on, pa.lowcut && pa.lowcut.on ? 'ON' : 'OFF', 'y', ctx.A(pTog(pre + '.preamp.lowcut.on'))), '<div class="big" style="padding:6px 8px">' + fHz(pa.lowcut && pa.lowcut.freq) + '</div>' + lcSvg(pa.lowcut, 156, 46));
          b += bx(446, 132, 170, 132, 'Delay ' + led(pa.delay && pa.delay.on, pa.delay && pa.delay.on ? 'ON' : 'OFF', 'y', ctx.A(pTog(pre + '.preamp.delay.on'))), '<div class="big" style="padding:6px 8px">' + fMs(pa.delay && pa.delay.ms) + '</div>' + kv('METER', ((pa.delay && pa.delay.ms || 0) * 0.343).toFixed(2) + ' m') + kv('FEET', ((pa.delay && pa.delay.ms || 0) * 1.125).toFixed(1) + ' ft'));
        } else { b += bx(250, 6, 366, 120, 'Config', kv('TYPE', esc(s.id)) + (o.stereoLinkWithNext != null ? kv('LINK', led(o.stereoLinkWithNext, 'LINK', 'y', ctx.A(pTog(pre + '.stereoLinkWithNext')))) : '')); }
        if (o.insert) { var ih = ui.insHi == null ? INS_SEL.indexOf(o.insert.sel || 'OFF') : ui.insHi; b += bx(622, 132, 172, isIn && s.t === 'ch' ? 132 : 194, 'Insert ' + led(o.insert.on, o.insert.on ? 'ON' : 'OFF', 'y', ctx.A(pTog(pre + '.insert.on'))), kv('POS', esc(o.insert.pos || 'POST')) + kv('SEL', esc(o.insert.sel || 'OFF'))); b += listHtml(INS_SEL, INS_SEL.indexOf(o.insert.sel || 'OFF'), ih, 628, 196, 160, isIn && s.t === 'ch' ? 4 : 8, ctx, function (k) { if (ui.insHi === k) SET(pre + '.insert.sel', INS_SEL[k]); ui.insHi = k; touch(); }); }
        if (L2 === 0) enc = [
          isIn ? E('Gain', fDb(pa.gain, 1), tNum(pre + '.preamp.gain', -12, 60, 0.5), function () { var k = linkKey(s); if (k) SET(k, !G(k)); }, { f: frLin(pa.gain, -12, 60), pl: 'LINK', on: !!G(linkKey(s)) }) : E('Link', o.stereoLinkWithNext ? 'ON' : 'OFF', null, o.stereoLinkWithNext != null ? pTog(pre + '.stereoLinkWithNext') : null, { pl: 'LINK', on: o.stereoLinkWithNext }),
          isIn ? E('Low Cut', fHz(pa.lowcut && pa.lowcut.freq), tLog(pre + '.preamp.lowcut.freq', 20, 400, 100, 100), pTog(pre + '.preamp.lowcut.on'), { f: frLog(pa.lowcut && pa.lowcut.freq, 20, 400), pl: 'LC', on: pa.lowcut && pa.lowcut.on, pc: 'cg' }) : NOE,
          isIn ? E('Source', SL[shi].l, function (dd) { ui.srcHi = clamp((ui.srcHi == null ? si : ui.srcHi) + dd, 0, SL.length - 1); touch(); }, function () { SET(pre + '.source', SL[ui.srcHi == null ? si : ui.srcHi].v); }, { pl: 'SET', on: shi === si }) : NOE,
          isIn ? E('Delay', fMs(pa.delay && pa.delay.ms), tLog(pre + '.preamp.delay.ms', 0.3, 500, 120, 0.3), pTog(pre + '.preamp.delay.on'), { f: frLog(pa.delay && pa.delay.ms, 0.3, 500), pl: 'DLY', on: pa.delay && pa.delay.on, pc: 'cg' }) : NOE,
          o.insert ? E('Insert Pos', o.insert.pos || 'POST', tList(pre + '.insert.pos', ['PRE', 'POST']), pTog(pre + '.insert.on'), { pl: 'INS', on: o.insert.on, pc: 'cg' }) : NOE,
          o.insert ? E('Insert Sel', INS_SEL[ui.insHi == null ? INS_SEL.indexOf(o.insert.sel || 'OFF') : ui.insHi], function (dd) { ui.insHi = clamp((ui.insHi == null ? INS_SEL.indexOf(o.insert.sel || 'OFF') : ui.insHi) + dd, 0, INS_SEL.length - 1); touch(); }, function () { if (ui.insHi != null) SET(pre + '.insert.sel', INS_SEL[ui.insHi]); }, { pl: 'SET' }) : NOE];
        else enc = [
          E('Icon', ICONS[clamp((o.icon | 0) - 1, 0, 73)], tNum(pre + '.icon', 1, 74, 1, 1), function () { openName(s.t, s.i); }, { pl: 'EDIT', f: frLin(o.icon || 1, 1, 74) }),
          E('Color', col(o.color).id, tNum(pre + '.color', 0, 15, 1, 0), null, { f: frLin(o.color || 0, 0, 15) }),
          E('Name', o.name || '—', null, function () { openName(s.t, s.i); }, { pl: 'EDIT' }),
          isIn ? E('48V', pa.phantom ? 'ON' : 'OFF', null, pTog(pre + '.preamp.phantom'), { pl: '48V', on: pa.phantom, pc: 'cr' }) : NOE,
          isIn ? E('Trim', fDb(pa.trim || 0, 1), tNum(pre + '.preamp.trim', -18, 18, 0.5, 0), null, { f: frLin(pa.trim || 0, -18, 18) }) : NOE,
          isIn ? E('Phase', pa.invert ? 'INV' : 'NORM', null, pTog(pre + '.preamp.invert'), { pl: 'Ø', on: pa.invert }) : NOE];
      }
      else if (id === 'gate' && g) {
        lay = 2; var L3 = layer(2), flt = g.filter || {};
        b += bx(6, 6, 300, 320, 'Gate ' + led(g.on, g.on ? 'ON' : 'OFF', '', ctx.A(pTog(pre + '.gate.on'))) + ' <span class="dim">' + esc(s.id) + '</span>', '<div style="padding:6px">' + xferSvg('gate', o, 286, 284, ctx, true) + '</div>');
        b += bx(312, 6, 250, 320, 'Parameters', '<div style="display:flex;gap:3px;padding:6px">' + GATE_MODES.map(function (md) { return '<span class="btn' + (g.mode === md ? ' on' : '') + '" style="flex:1;padding:4px 0" ' + ctx.A(function () { SET(pre + '.gate.mode', md); }) + '>' + md + '</span>'; }).join('') + '</div>' +
          kv('THRESHOLD', fDb(g.thr, 1), L3 === 0) + kv('RANGE', (+g.range).toFixed(0) + ' dB', L3 === 0) + kv('ATTACK', fMs(g.attack), L3 === 0) + kv('HOLD', fMs(g.hold), L3 === 0) + kv('RELEASE', fMs(g.release), L3 === 0) +
          kv('KEY SOURCE', esc(g.keySrc || 'SELF'), L3 === 1) + kv('KEY FILTER', (flt.on ? 'ON' : 'OFF'), L3 === 1) + kv('FILTER TYPE', esc(flt.type || '3.0'), L3 === 1) + kv('FILTER FREQ', fHz(flt.freq || 1000), L3 === 1));
        b += bx(568, 6, 226, 320, 'Meters', '<div class="dim" style="position:absolute;left:14px;top:30px;font-size:11px">IN</div>' + mv('sel', 14, 46, 26, 246) + '<div class="dim" style="position:absolute;left:58px;top:30px;font-size:11px">GATE</div>' + mv('selgt', 58, 46, 26, 246, 'gt') +
          '<div style="position:absolute;left:104px;top:40px;font-size:12px"><div class="dim">KEY</div><div style="margin:6px 0 14px"><span class="gl" data-gl="sel"></span> <span data-gs="sel" style="font-weight:700"></span></div><div class="dim">IN LEVEL</div><div class="yel" style="font-weight:700;margin-top:4px" data-mv="sel"></div><div class="dim" style="margin-top:14px">REDUCTION</div><div class="yel" style="font-weight:700;margin-top:4px" data-mv="selgt"></div></div>');
        enc = L3 === 0 ? [
          E('Threshold', fDb(g.thr, 1), tNum(pre + '.gate.thr', -80, 0, 0.5), pTog(pre + '.gate.on'), { f: frLin(g.thr, -80, 0), pl: 'ON', on: g.on, pc: 'cg' }),
          E('Range', (+g.range).toFixed(0) + ' dB', tNum(pre + '.gate.range', 3, 60, 1), null, { f: frLin(g.range, 3, 60) }),
          E('Attack', fMs(g.attack), tNum(pre + '.gate.attack', 0, 120, 0.5), null, { f: frLin(g.attack, 0, 120) }),
          E('Hold', fMs(g.hold), tLog(pre + '.gate.hold', 0.02, 2000, 100, 50), null, { f: frLog(g.hold, 0.02, 2000) }),
          E('Release', fMs(g.release), tLog(pre + '.gate.release', 5, 4000, 100, 200), null, { f: frLog(g.release, 5, 4000) }),
          E('Mode', g.mode, tList(pre + '.gate.mode', GATE_MODES), null, { f: GATE_MODES.indexOf(g.mode) / 4 })] : [
          E('Key Source', g.keySrc || 'SELF', tList(pre + '.gate.keySrc', KEYSRC()), null),
          E('Key Filter', flt.on ? 'ON' : 'OFF', null, pTog(pre + '.gate.filter.on'), { pl: 'FILT', on: flt.on, pc: 'cg' }),
          E('Filter Type', flt.type || '3.0', tList(pre + '.gate.filter.type', FILT_TYPES), null),
          E('Filter Freq', fHz(flt.freq || 1000), tLog(pre + '.gate.filter.freq', 20, 20000, 200, 1000), null, { f: frLog(flt.freq || 1000, 20, 20000) }), NOE, NOE];
      }
      else if (id === 'dyn' && d) {
        lay = 2; var L4 = layer(2), df = d.filter || {};
        b += bx(6, 6, 300, 320, 'Dynamics ' + led(d.on, d.on ? 'ON' : 'OFF', '', ctx.A(pTog(pre + '.dyn.on'))) + ' <span class="dim">' + esc(s.id) + '</span>', '<div style="padding:6px">' + xferSvg('dyn', o, 286, 284, ctx, true) + '</div>');
        b += bx(312, 6, 250, 320, 'Parameters', '<div style="display:flex;gap:3px;padding:6px">' + DYN_MODES.map(function (md) { return '<span class="btn' + (d.mode === md ? ' on' : '') + '" style="flex:1;padding:4px 0" ' + ctx.A(function () { SET(pre + '.dyn.mode', md); }) + '>' + md + '</span>'; }).join('') + ['PEAK', 'RMS'].map(function (md) { return '<span class="btn' + (d.det === md ? ' on' : '') + '" style="flex:1;padding:4px 0" ' + ctx.A(function () { SET(pre + '.dyn.det', md); }) + '>' + md + '</span>'; }).join('') + ['LIN', 'LOG'].map(function (md) { return '<span class="btn' + (d.env === md ? ' on' : '') + '" style="flex:1;padding:4px 0" ' + ctx.A(function () { SET(pre + '.dyn.env', md); }) + '>' + md + '</span>'; }).join('') + '</div>' +
          kv('THRESHOLD', fDb(d.thr, 1), L4 === 0) + kv('RATIO', fRatio(d.ratio), L4 === 0) + kv('KNEE', String(d.knee), L4 === 0) + kv('GAIN', fDb(d.gain, 1), L4 === 0) + kv('ATTACK', fMs(d.attack), L4 === 0) + kv('RELEASE', fMs(d.release), L4 === 0) +
          kv('HOLD', fMs(d.hold), L4 === 1) + kv('MIX', (d.mix == null ? 100 : d.mix) + ' %', L4 === 1) + kv('AUTO TIME', d.auto ? 'ON' : 'OFF', L4 === 1) + kv('KEY', esc(d.keySrc || 'SELF'), L4 === 1) + kv('POS', Gd(pre + '.dyn.pos', 'POST') === 'PRE' ? 'PRE EQ' : 'POST EQ', L4 === 1));
        b += bx(568, 6, 226, 320, 'Meters', '<div class="dim" style="position:absolute;left:14px;top:30px;font-size:11px">IN</div>' + mv('sel', 14, 46, 26, 246) + '<div class="dim" style="position:absolute;left:58px;top:30px;font-size:11px">GR</div>' + mv('selgr', 58, 46, 26, 246, 'gr') +
          '<div style="position:absolute;left:104px;top:40px;font-size:12px"><div class="dim">IN LEVEL</div><div class="yel" style="font-weight:700;margin-top:4px" data-mv="sel"></div><div class="dim" style="margin-top:14px">GAIN REDUCTION</div><div class="yel" style="font-weight:700;margin-top:4px;font-size:18px" data-mv="selgr"></div><div class="dim" style="margin-top:14px">MAKE-UP</div><div style="font-weight:700;margin-top:4px">' + fDb(d.gain, 1) + '</div></div>');
        enc = L4 === 0 ? [
          E('Threshold', fDb(d.thr, 1), tNum(pre + '.dyn.thr', -60, 0, 0.5), pTog(pre + '.dyn.on'), { f: frLin(d.thr, -60, 0), pl: 'ON', on: d.on, pc: 'cg' }),
          E('Ratio', fRatio(d.ratio), function (dd) { SET(pre + '.dyn.ratio', stepList(RATIOS, RATIOS.reduce(function (a, r) { return Math.abs(r - d.ratio) < Math.abs(a - d.ratio) ? r : a; }, RATIOS[0]), dd)); }, null, { f: RATIOS.indexOf(d.ratio) / 11 }),
          E('Knee', String(d.knee), tNum(pre + '.dyn.knee', 0, 5, 1), null, { f: (d.knee || 0) / 5 }),
          E('Gain', fDb(d.gain, 1), tNum(pre + '.dyn.gain', 0, 24, 0.5), pTog(pre + '.dyn.auto'), { f: frLin(d.gain, 0, 24), pl: 'AUTO', on: d.auto }),
          E('Attack', fMs(d.attack), tNum(pre + '.dyn.attack', 0, 120, 1), null, { f: frLin(d.attack, 0, 120) }),
          E('Release', fMs(d.release), tLog(pre + '.dyn.release', 5, 4000, 100, 100), null, { f: frLog(d.release, 5, 4000) })] : [
          E('Hold', fMs(d.hold), tLog(pre + '.dyn.hold', 0.02, 2000, 100, 10), null, { f: frLog(d.hold, 0.02, 2000) }),
          E('Mode', d.mode, tList(pre + '.dyn.mode', DYN_MODES), null),
          E('Det / Env', d.det + ' / ' + d.env, function (dd) { if (dd > 0) SET(pre + '.dyn.' + (d.det === 'PEAK' ? 'det' : 'env'), d.det === 'PEAK' ? 'RMS' : 'LIN'); else SET(pre + '.dyn.' + (d.env === 'LIN' ? 'env' : 'det'), d.env === 'LIN' ? 'LOG' : 'PEAK'); }, null),
          E('Mix', (d.mix == null ? 100 : d.mix) + ' %', tNum(pre + '.dyn.mix', 0, 100, 5, 100), null, { f: (d.mix == null ? 100 : d.mix) / 100 }),
          E('Key Source', d.keySrc || 'SELF', tList(pre + '.dyn.keySrc', KEYSRC()), pTog(pre + '.dyn.filter.on'), { pl: 'FILT', on: df.on }),
          E('Position', Gd(pre + '.dyn.pos', 'POST') === 'PRE' ? 'PRE EQ' : 'POST EQ', tList(pre + '.dyn.pos', ['PRE', 'POST']), null)];
      }
      else if (id === 'eq' && o.eq) {
        lay = 4; var L5 = layer(4), bands = eq.bands || [], nb = bands.length, names = BANDN[nb] || BANDN[4], cur = clamp(G('config.view.eqBand') | 0, 0, nb - 1);
        b += bx(6, 6, 788, 226, 'Equalizer ' + led(eq.on !== false, eq.on !== false ? 'ON' : 'OFF', '', ctx.A(pTog(pre + '.eq.on'))) + (isIn ? ' ' + led(pa.lowcut && pa.lowcut.on, 'LOW CUT ' + fHz(pa.lowcut && pa.lowcut.freq), 'o', ctx.A(pTog(pre + '.preamp.lowcut.on'))) : '') + ' <span class="dim" style="margin-left:auto">' + ['GAIN', 'FREQUENCY', 'Q (WIDTH)', 'MODE'][L5] + '</span>', '<div style="padding:4px 6px" data-eqsvg="1">' + eqSvg(o, 774, 192, ctx, true) + '</div>');
        var cw = Math.floor(788 / nb);
        bands.forEach(function (bd, k) {
          b += bx(6 + k * cw, 238, cw - 4, 88, '<span style="color:' + BANDC[k] + '">●</span> ' + names[k], '<div style="display:flex;gap:2px;padding:3px 4px;flex-wrap:wrap">' + EQ_TYPES.map(function (t) { return '<span class="btn' + (bd.type === t ? ' on' : '') + '" style="padding:1px 3px;font-size:10px' + (L5 === 3 ? '' : ';opacity:.8') + '" ' + ctx.A(function () { SET(pre + '.eq.bands.' + k + '.type', t); }) + '>' + t + '</span>'; }).join('') + '</div>' +
            '<div style="display:flex;justify-content:space-between;padding:1px 6px;font-size:12px"><b class="' + (L5 === 1 ? 'yel' : '') + '">' + fHz(bd.freq) + '</b><b class="' + (L5 === 0 ? 'yel' : '') + '">' + fDb(bd.gain) + '</b><b class="' + (L5 === 2 ? 'yel' : '') + '">Q ' + (+bd.q).toFixed(1) + '</b></div>', k === cur ? ' style="left:' + (6 + k * cw) + 'px;top:238px;width:' + (cw - 4) + 'px;height:88px;border-color:#39c6f4" ' + ctx.A(function () { SET('config.view.eqBand', k); }) : ' ' + ctx.A(function () { SET('config.view.eqBand', k); }));
        });
        var bandEnc = function (k) {
          var bd = bands[k], bp = pre + '.eq.bands.' + k, nm = names[k];
          if (L5 === 0) return E(nm + ' Gain', fDb(bd.gain, 1), function (dd) { SET('config.view.eqBand', k); tNum(bp + '.gain', -15, 15, 0.5)(dd); }, function () { SET(bp + '.gain', 0); }, { f: frLin(bd.gain, -15, 15), pl: '0 dB' });
          if (L5 === 1) return E(nm + ' Freq', fHz(bd.freq), function (dd) { SET('config.view.eqBand', k); tLog(bp + '.freq', 20, 20000, 200)(dd); }, null, { f: frLog(bd.freq, 20, 20000) });
          if (L5 === 2) return E(nm + ' Q', (+bd.q).toFixed(1), function (dd) { SET('config.view.eqBand', k); tLog(bp + '.q', 0.3, 10, 72)(-dd); }, null, { f: 1 - frLog(bd.q, 0.3, 10) });
          return E(nm + ' Mode', bd.type, function (dd) { SET('config.view.eqBand', k); tList(bp + '.type', EQ_TYPES)(dd); }, null, { f: EQ_TYPES.indexOf(bd.type) / 5 });
        };
        if (nb >= 6) enc = range(6).map(bandEnc);
        else enc = [isIn ? E('Low Cut', fHz(pa.lowcut && pa.lowcut.freq), tLog(pre + '.preamp.lowcut.freq', 20, 400, 100, 100), pTog(pre + '.preamp.lowcut.on'), { f: frLog(pa.lowcut && pa.lowcut.freq, 20, 400), pl: 'LC', on: pa.lowcut && pa.lowcut.on, pc: 'cg' }) : NOE].concat(range(Math.min(4, nb)).map(bandEnc), [E('EQ', eq.on !== false ? 'IN' : 'OUT', null, pTog(pre + '.eq.on'), { pl: 'EQ', on: eq.on !== false, pc: 'cg' })]);
      }
      else if (id === 'sends' && (o.sends || o.mtxSends)) {
        var isMtx = !o.sends, sd2 = o.sends || o.mtxSends, ns = sd2.length, key = isMtx ? '.mtxSends.' : '.sends.';
        lay = isMtx ? 1 : 2; var L6 = layer(lay), fo = clamp(ui.sendFocus, 0, Math.max(0, ns - 4)), cwid = Math.floor(788 / ns);
        sd2.forEach(function (sn, k) {
          var x0 = 6 + k * cwid, inF = k >= fo && k < fo + 4, bname = isMtx ? 'MTX ' + (k + 1) : (m.label ? m.label('bus', k) : 'Bus ' + (k + 1));
          b += '<div class="bx" style="left:' + x0 + 'px;top:6px;width:' + (cwid - 3) + 'px;height:320px;' + (inF ? 'border-color:#39c6f4;background:#14212c' : '') + '">' +
            '<div style="text-align:center;font-size:11px;font-weight:700;padding:3px 0;background:#232b34">' + (isMtx ? 'MX' : '') + (k + 1) + '</div><div style="text-align:center;font-size:10px;color:#8a96a3;height:26px;overflow:hidden;padding:1px 2px;line-height:12px">' + esc(bname) + '</div>' +
            '<div style="position:absolute;left:' + Math.round(cwid / 2 - 9) + 'px;top:62px;width:6px;height:190px;background:#000;border-radius:3px" ' + ctx.D({ type: 'fader', path: pre + key + k + '.level', top: 62, hgt: 190 }) + '></div>' +
            '<div style="position:absolute;left:' + Math.round(cwid / 2 - 17) + 'px;top:' + (62 + Math.round((1 - db2f(sn.level)) * 190) - 6) + 'px;width:22px;height:12px;border-radius:2px;background:' + (sn.on === false ? '#6b7682' : '#e6ebf0') + ';pointer-events:none"></div>' +
            mv('send:' + k, Math.round(cwid / 2 + 6), 62, 5, 190) +
            '<div style="position:absolute;left:0;right:0;top:258px;text-align:center;font-size:11px;font-weight:700">' + fDbI(sn.level) + '</div>' +
            '<div style="position:absolute;left:3px;right:3px;top:276px;text-align:center"><span class="led ' + (sn.on === false ? '' : 'on') + '" style="min-width:0;width:100%" ' + ctx.A(pTog(pre + key + k + '.on')) + '>' + (sn.on === false ? 'OFF' : 'ON') + '</span></div>' +
            (isMtx ? '' : '<div style="position:absolute;left:0;right:0;top:298px;text-align:center;font-size:10px;color:#ffd23a" ' + ctx.A(function () { SET(pre + key + k + '.tap', stepList(TAPS, sn.tap, 1) === sn.tap ? TAPS[0] : stepList(TAPS, sn.tap, 1)); }) + '>' + esc(TAPLBL[sn.tap] || sn.tap || '') + '</div>') + '</div>';
        });
        var focusE = E('Focus', (isMtx ? 'MX ' : 'Bus ') + (fo + 1) + '-' + (fo + 4), function (dd) { ui.sendFocus = clamp(fo + dd * 2, 0, Math.max(0, ns - 4)); if (!isMtx) SET('config.view.sendBank', Math.floor(ui.sendFocus / 4)); touch(); }, function () { ui.sendFocus = fo + 4 > ns - 4 ? 0 : fo + 4; if (!isMtx) SET('config.view.sendBank', Math.floor(ui.sendFocus / 4)); touch(); }, { pl: '+4' });
        if (L6 === 0) enc = range(4).map(function (j) { var k = fo + j, sn = sd2[k]; return sn ? E((isMtx ? 'Mtx ' : 'Bus ') + (k + 1), fDb(sn.level, 1), tFader(pre + key + k + '.level'), pTog(pre + key + k + '.on'), { f: db2f(sn.level), pl: 'ON', on: sn.on !== false, pc: 'cg' }) : NOE; }).concat([NOE, focusE]);
        else enc = [E('Tap ' + (fo + 1) + '-' + (fo + 2), TAPLBL[sd2[fo].tap] || sd2[fo].tap, function (dd) { var t = stepList(TAPS, sd2[fo].tap, dd); m.batch(function () { SET(pre + key + fo + '.tap', t); SET(pre + key + (fo + 1) + '.tap', t); }); }, null), NOE,
          E('Tap ' + (fo + 3) + '-' + (fo + 4), TAPLBL[sd2[fo + 2].tap] || sd2[fo + 2].tap, function (dd) { var t = stepList(TAPS, sd2[fo + 2].tap, dd); m.batch(function () { SET(pre + key + (fo + 2) + '.tap', t); SET(pre + key + (fo + 3) + '.tap', t); }); }, null), NOE, NOE, focusE];
      }
      else { // main
        var mn = o.main || {}, fpos = db2f(o.fader);
        b += bx(6, 6, 260, 150, 'Stereo (LR) ' + (o.main ? led(mn.st, mn.st ? 'ON' : 'OFF', '', ctx.A(pTog(pre + '.main.st'))) : ''), '<div style="padding:10px"><div class="dim" style="font-size:11px">PAN / BAL</div><div class="big">' + fPan(o.main ? mn.pan : o.pan) + '</div>' +
          '<div style="position:relative;height:16px;margin-top:10px;background:#000;border-radius:8px" ' + ctx.D({ type: 'hslider', path: pre + (o.main ? '.main.pan' : '.pan'), lo: -100, hi: 100, step: 2 }) + '><div style="position:absolute;left:50%;top:0;bottom:0;width:1px;background:#444"></div><div style="position:absolute;top:-3px;width:14px;height:22px;border-radius:3px;background:#39c6f4;left:calc(' + ((((o.main ? mn.pan : o.pan) || 0) + 100) / 2) + '% - 7px)"></div></div></div>');
        if (o.main) b += bx(6, 162, 260, 164, 'Mono / Center ' + led(mn.mono, mn.mono ? 'ON' : 'OFF', '', ctx.A(pTog(pre + '.main.mono'))), '<div style="padding:10px"><div class="dim" style="font-size:11px">M/C LEVEL</div><div class="big">' + fDb(mn.mlevel, 1) + '</div>' +
          '<div style="position:relative;height:16px;margin-top:10px;background:#000;border-radius:8px" ' + ctx.D({ type: 'hfader', path: pre + '.main.mlevel' }) + '><div style="position:absolute;top:-3px;width:14px;height:22px;border-radius:3px;background:#e6ebf0;left:calc(' + (db2f(mn.mlevel) * 100) + '% - 7px)"></div></div></div>');
        b += bx(272, 6, 170, 320, 'Fader', '<div style="position:absolute;left:24px;top:36px;width:8px;height:240px;background:#000;border-radius:4px" ' + ctx.D({ type: 'fader', path: pre + '.fader', top: 36, hgt: 240 }) + '></div>' +
          '<div style="position:absolute;left:12px;top:' + (36 + Math.round((1 - fpos) * 240) - 9) + 'px;width:32px;height:18px;border-radius:3px;background:linear-gradient(#f4f5f7,#9ea2aa);pointer-events:none"></div>' + mv('sel', 52, 36, 10, 240) +
          [10, 5, 0, -10, -20, -30, -40, -60].map(function (dd) { return '<div class="dim" style="position:absolute;left:70px;font-size:10px;top:' + (36 + Math.round((1 - db2f(dd)) * 240) - 6) + 'px">' + (dd > 0 ? '+' : '') + dd + '</div>'; }).join('') +
          '<div style="position:absolute;left:96px;top:40px"><div class="big">' + fDbI(o.fader) + '</div><div class="dim" style="font-size:11px">dB</div></div>' +
          '<div style="position:absolute;left:96px;top:120px;display:flex;flex-direction:column;gap:6px"><span class="btn r' + (o.mute ? ' on' : '') + '" ' + ctx.A(pTog(pre + '.mute')) + '>MUTE</span><span class="btn' + (o.solo ? ' on' : '') + '" ' + ctx.A(pTog(pre + '.solo')) + '>SOLO</span></div>');
        if (o.dca) b += bx(448, 6, 346, 156, 'DCA Assign', '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:5px;padding:7px">' + o.dca.map(function (on, k) { return '<span class="btn' + (on ? ' on' : '') + '" style="flex-direction:column;height:54px' + (ui.dcaSel === k ? ';outline:2px solid #39c6f4' : '') + '" ' + ctx.A(pTog(pre + '.dca.' + k)) + '><b>DCA ' + (k + 1) + '</b><small style="font-size:10px;font-weight:400;max-width:70px;overflow:hidden;text-overflow:ellipsis">' + esc(G('dca.' + k + '.name') || '') + '</small></span>'; }).join('') + '</div>');
        if (o.muteGrp) b += bx(448, 168, 346, 158, 'Mute Group Assign', '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5px;padding:7px">' + o.muteGrp.map(function (on, k) { return '<span class="btn r' + (on ? ' on' : '') + '" style="flex-direction:column;height:56px' + (ui.mgSel === k ? ';outline:2px solid #39c6f4' : '') + '" ' + ctx.A(pTog(pre + '.muteGrp.' + k)) + '><b>MG ' + (k + 1) + '</b><small style="font-size:10px;font-weight:400">' + esc(G('muteGroups.' + k + '.name') || '') + '</small></span>'; }).join('') + '</div>');
        enc = [o.main ? E('Pan', fPan(mn.pan), tNum(pre + '.main.pan', -100, 100, 2), pTog(pre + '.main.st'), { f: frLin(mn.pan, -100, 100), pl: 'LR', on: mn.st, pc: 'cg' }) : (o.pan != null ? E('Pan', fPan(o.pan), tNum(pre + '.pan', -100, 100, 2), null, { f: frLin(o.pan, -100, 100) }) : NOE),
          o.main ? E('M/C Level', fDb(mn.mlevel, 1), tFader(pre + '.main.mlevel'), pTog(pre + '.main.mono'), { f: db2f(mn.mlevel), pl: 'MONO', on: mn.mono, pc: 'cg' }) : NOE,
          o.dca ? E('DCA', 'DCA ' + (ui.dcaSel + 1) + (o.dca[ui.dcaSel] ? ' ●' : ''), function (dd) { ui.dcaSel = clamp(ui.dcaSel + dd, 0, 7); touch(); }, pTog(pre + '.dca.' + ui.dcaSel), { pl: 'ASGN', on: o.dca[ui.dcaSel] }) : NOE,
          o.muteGrp ? E('Mute Grp', 'MG ' + (ui.mgSel + 1) + (o.muteGrp[ui.mgSel] ? ' ●' : ''), function (dd) { ui.mgSel = clamp(ui.mgSel + dd, 0, 5); touch(); }, pTog(pre + '.muteGrp.' + ui.mgSel), { pl: 'ASGN', on: o.muteGrp[ui.mgSel] }) : NOE,
          E('Solo', o.solo ? 'ON' : 'OFF', null, pTog(pre + '.solo'), { pl: 'SOLO', on: o.solo }),
          E('Fader', fDb(o.fader, 1), tFader(pre + '.fader'), pTog(pre + '.mute'), { f: fpos, pl: 'MUTE', on: o.mute, pc: 'cr' })];
      }
      return { body: b, enc: enc, layers: lay };
    }
    function srcName(s) { var v = s.o.source; if (v == null) return ''; var L = SRC(), k = srcIdx(v); return L[k] ? L[k].l : ''; }
    function linkKey(s) { if (s.t === 'ch') return 'config.link.ch.' + (s.i >> 1); if (s.t === 'aux') return 'config.link.aux.' + (s.i >> 1); if (s.t === 'fxr') return 'config.link.fxr.' + (s.i >> 1); if (s.t === 'bus') return 'bus.' + (s.i & ~1) + '.stereoLinkWithNext'; if (s.t === 'mtx') return 'config.link.mtx.' + (s.i >> 1); return null; }
    function lcSvg(lc, w, h) { var c = biq('LCut', (lc && lc.freq) || 100, 0, 0.707), pts = []; for (var i = 0; i <= 40; i++) { var f = 20 * Math.pow(1000, i / 40), d = lc && lc.on ? magDb(c, f) : 0; pts.push((i / 40 * w).toFixed(1) + ',' + (8 - clamp(d, -36, 3) / 36 * (h - 10)).toFixed(1)); } return '<svg width="' + w + '" height="' + h + '" style="display:block;margin:0 8px">' + svgGrid(w, h, [fx2x(100, w), fx2x(1000, w)], [8]) + '<polyline points="' + pts.join(' ') + '" fill="none" stroke="' + (lc && lc.on ? '#ff9f1c' : '#6b7682') + '" stroke-width="2"/></svg>'; }
    var SEL_ORDER = [];
    ['ch', 32, 'aux', 8, 'fxr', 8, 'bus', 16, 'mtx', 6, 'main', 2, 'dca', 8].forEach(function (x, k, a) { if (k % 2 === 0) for (var i = 0; i < a[k + 1]; i++) SEL_ORDER.push({ type: x, index: i }); });
    function stepSel(d) { var s = sel(), k = 0; SEL_ORDER.forEach(function (x, i) { if (x.type === s.t && x.index === s.i) k = i; }); var n = SEL_ORDER[clamp(k + d, 0, SEL_ORDER.length - 1)]; if (m.select) m.select(n.type, n.index); else SET('config.selected', n); }

    /* ================================================================ METERS */
    function metersBuild(ctx) {
      var id = tabId('meters'), b = '', i, n;
      function row(keys, names, x0, y0, w, h, lbl) { var cw = w / keys.length, s = ''; keys.forEach(function (k, j) { var x = Math.round(x0 + j * cw); s += mv(k, x + 2, y0, Math.max(4, Math.round(cw) - 6), h) + '<div style="position:absolute;left:' + x + 'px;top:' + (y0 + h + 2) + 'px;width:' + Math.round(cw) + 'px;text-align:center;font-size:' + (cw < 26 ? 9 : 10) + 'px;font-weight:700;color:#cfd8e2;overflow:hidden;white-space:nowrap">' + esc(lbl[j]) + '</div>' + (cw >= 30 ? '<div style="position:absolute;left:' + x + 'px;top:' + (y0 + h + 14) + 'px;width:' + Math.round(cw) + 'px;text-align:center;font-size:9px;color:#7d8996;overflow:hidden;white-space:nowrap">' + esc(names[j] || '') + '</div>' : ''); }); return s; }
      function scale(x, y0, h) { return [0, -6, -12, -24, -36, -48, -60].map(function (d) { return '<div class="dim" style="position:absolute;left:' + x + 'px;top:' + (y0 + Math.round((1 - mfrac(d)) * h) - 6) + 'px;font-size:9px">' + d + '</div>'; }).join(''); }
      var lb = function (t, k) { var o = stripAt(t, k); return o && o.name ? o.name.slice(0, 6) : ''; };
      if (id === 'channel') {
        b += bx(6, 6, 788, 320, 'Input Channels 1-32', scale(4, 34, 220) + row(range(32).map(function (k) { return 'ch:' + k; }), range(32).map(function (k) { return lb('ch', k); }), 24, 34, 760, 220, range(32).map(function (k) { return String(k + 1); })) +
          range(32).map(function (k) { var x = Math.round(24 + k * 760 / 32); return '<div style="position:absolute;left:' + (x + 3) + 'px;top:290px;width:' + Math.round(760 / 32 - 6) + 'px;height:6px" ><div class="mh gr" data-mt="gt:' + k + '" style="left:0;top:0;width:100%;height:6px"><b></b></div></div><div style="position:absolute;left:' + (x + 3) + 'px;top:300px;width:' + Math.round(760 / 32 - 6) + 'px;height:6px"><div class="mh gr" data-mt="gr:' + k + '" style="left:0;top:0;width:100%;height:6px"><b></b></div></div>'; }).join('') +
          '<div class="dim" style="position:absolute;left:4px;top:288px;font-size:9px">G</div><div class="dim" style="position:absolute;left:4px;top:298px;font-size:9px">C</div>');
      } else if (id === 'mixbus') {
        var keys = range(16).map(function (k) { return 'bus:' + k; }).concat(range(6).map(function (k) { return 'mtx:' + k; }), ['main:l', 'main:r', 'main:m']), lbls = range(16).map(function (k) { return 'B' + (k + 1); }).concat(range(6).map(function (k) { return 'MX' + (k + 1); }), ['L', 'R', 'M/C']);
        b += bx(6, 6, 788, 320, 'Mix Bus 1-16 · Matrix 1-6 · Main', scale(4, 34, 236) + row(keys, range(16).map(function (k) { return lb('bus', k); }).concat(range(9).map(function () { return ''; })), 24, 34, 760, 236, lbls));
      } else if (id === 'auxfx') {
        b += bx(6, 6, 388, 320, 'Aux In 1-6 · USB', scale(4, 34, 236) + row(range(8).map(function (k) { return 'aux:' + k; }), range(8).map(function (k) { return lb('aux', k); }), 24, 34, 360, 236, ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'USB L', 'USB R']));
        b += bx(400, 6, 394, 320, 'FX Returns 1-4', scale(398, 34, 236).replace(/left:398px/g, 'left:4px') + row(range(8).map(function (k) { return 'fxr:' + k; }), range(8).map(function (k) { return lb('fxr', k); }), 24, 34, 360, 236, ['1L', '1R', '2L', '2R', '3L', '3R', '4L', '4R']));
      } else if (id === 'inout') {
        b += bx(6, 6, 788, 156, 'Inputs (Local 1-32)', row(range(32).map(function (k) { return 'in:' + k; }), [], 10, 30, 774, 96, range(32).map(function (k) { return String(k + 1); })));
        b += bx(6, 168, 788, 158, 'Outputs (Out 1-16 · Aux Out 1-6)', row(range(16).map(function (k) { return 'out:' + k; }).concat(range(6).map(function (k) { return 'aout:' + k; })), [], 10, 30, 774, 96, range(16).map(function (k) { return String(k + 1); }).concat(range(6).map(function (k) { return 'A' + (k + 1); }))));
      } else {
        var rsrc = Gd('config.rta.source', 'Main LR'), has = m.meters && m.meters.rta && m.meters.rta.length;
        b += bx(6, 6, 788, 320, 'RTA — ' + esc(rsrc), '<div style="position:absolute;left:30px;top:30px;width:750px;height:250px">' + range(31).map(function (k) { return mv('rta:' + k, Math.round(k * 750 / 31), 0, Math.round(750 / 31) - 3, 250); }).join('') + '</div>' +
          range(31).filter(function (k) { return k % 3 === 0; }).map(function (k) { return '<div class="dim" style="position:absolute;left:' + (30 + Math.round(k * 750 / 31)) + 'px;top:286px;font-size:10px">' + geqLbl(GEQF[k]) + '</div>'; }).join('') +
          (has ? '' : '<div style="position:absolute;left:0;right:0;top:140px;text-align:center;color:#7d8996;font-size:14px">RTA: no signal</div>'));
      }
      var enc = [NOE, NOE, NOE, NOE, NOE, NOE];
      if (id === 'rta') enc = [E('RTA Source', rsrc, tList('config.rta.source', ['Main LR', 'Solo', 'Ch Select']), null), NOE, NOE, NOE, NOE, NOE];
      return { body: b, enc: enc, layers: 1 };
    }

    /* ================================================================ ROUTING */
    function routingBuild(ctx) {
      var id = tabId('routing'), b = '', enc = [], IB = inBlocks(), AB = auxBlocks();
      if (id === 'home') {
        var blocks = G('routing.input.blocks') || [], aux = G('routing.input.aux'), A = G('routing.aes50') || {};
        ['Inputs 1-8', 'Inputs 9-16', 'Inputs 17-24', 'Inputs 25-32', 'Aux In 1-6'].forEach(function (t, k) {
          var list = k < 4 ? IB : AB, cur = list.indexOf(k < 4 ? blocks[k] : aux), hi = ui.rtHi[k] == null ? cur : ui.rtHi[k], x = 6 + k * 158;
          b += bx(x, 6, 152, 290, t, '<div style="padding:3px 7px;font-size:11px;color:' + (noLink(k < 4 ? blocks[k] : aux) ? '#ff9f1c' : '#3ddc84') + ';font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(blkLabel(k < 4 ? blocks[k] : aux)) + (noLink(k < 4 ? blocks[k] : aux) ? ' (no link)' : '') + '</div>', ui.rtFocus === k ? ' style="left:' + x + 'px;top:6px;width:152px;height:290px;border-color:#39c6f4"' : '');
          b += listHtml(list.map(blkLabel), cur, hi, x + 2, 48, 148, 15, ctx, function (j) { ui.rtFocus = k; if (ui.rtHi[k] === j) SET(k < 4 ? 'routing.input.blocks.' + k : 'routing.input.aux', list[j]); ui.rtHi[k] = j; touch(); });
        });
        b += '<div style="position:absolute;left:6px;top:302px;width:788px;height:24px;display:flex;gap:14px;align-items:center;font-size:12px;padding:0 8px;background:#12161c;border:1px solid #2f3842;border-radius:4px">' +
          '<span><span class="gl ' + (A.a && A.a.connected ? 'on' : '') + '"></span> AES50-A ' + (A.a && A.a.connected ? esc(A.a.device || 'connected') : '<span class="dim">not connected</span>') + '</span>' +
          '<span><span class="gl ' + (A.b && A.b.connected ? 'on' : '') + '"></span> AES50-B ' + (A.b && A.b.connected ? esc(A.b.device || 'connected') : '<span class="dim">not connected</span>') + '</span>' +
          '<span><span class="gl ' + (G('routing.card.connected') ? 'on' : '') + '"></span> CARD ' + esc(Gd('routing.card.type', 'X-USB')) + '</span><span class="dim" style="margin-left:auto">turn = select · press = connect</span></div>';
        enc = range(5).map(function (k) { var list = k < 4 ? IB : AB, cur = list.indexOf(k < 4 ? blocks[k] : aux), hi = ui.rtHi[k] == null ? cur : ui.rtHi[k]; return E(k < 4 ? 'In ' + (k * 8 + 1) + '-' + (k * 8 + 8) : 'Aux In', String(list[clamp(hi, 0, list.length - 1)]).replace(/^AES50([AB])/, 'AES50-$1').replace(' / ', '/'), function (d) { ui.rtFocus = k; ui.rtHi[k] = clamp((ui.rtHi[k] == null ? Math.max(0, cur) : ui.rtHi[k]) + d, 0, list.length - 1); touch(); }, function () { ui.rtFocus = k; SET(k < 4 ? 'routing.input.blocks.' + k : 'routing.input.aux', list[clamp(hi, 0, list.length - 1)]); }, { pl: 'SET', on: hi === cur }); }).concat([NOE]);
        return { body: b, enc: enc, layers: 1 };
      }
      // 출력: 하나씩(out · aux · p16) 또는 블록(card · aes50 · xlr)
      var per = id === 'out' || id === 'aux' || id === 'p16', path, n, opts2, title, cur, items;
      if (per) {
        path = 'routing.output.' + (id === 'out' ? 'local' : id); n = id === 'aux' ? 6 : 16; opts2 = outSources(); title = id === 'out' ? 'Output' : id === 'aux' ? 'Aux Out' : 'P16 Out';
        items = range(n).map(function (k) { var v = G(path + '.' + k); return v && typeof v === 'object' ? v : { src: v || 'Off', tap: 'POST' }; });
      } else if (id === 'card') { path = 'routing.output.card'; n = 4; opts2 = CARD_BLOCKS(); title = 'Card Out'; items = range(4).map(function (k) { return { src: G(path + '.' + k) || ['Local 1-8', 'Local 9-16', 'Local 17-24', 'Local 25-32'][k] }; }); }
      else if (id === 'xlr') { path = 'routing.output.xlr'; n = 4; opts2 = null; title = 'XLR Out'; items = range(4).map(function (k) { return { src: G(path + '.' + k) || 'Out ' + (k * 4 + 1) + '-' + (k * 4 + 4) }; }); }
      else { path = 'routing.output.' + id; n = 6; opts2 = AES_BLOCKS; title = (id === 'aes50a' ? 'AES50-A' : 'AES50-B') + ' Out'; items = range(6).map(function (k) { return { src: aesBlock(path, k) }; }); }
      var fo = clamp(ui.outFocus == null ? 0 : ui.outFocus, 0, n - 1), lst = opts2 || XLR_BLOCKS(fo), ci = lst.indexOf(items[fo].src), hi = ui.outHi == null ? Math.max(0, ci) : clamp(ui.outHi, 0, lst.length - 1);
      var bl = per ? '' : ' (8ch)'.replace('8', id === 'xlr' ? '4' : '8');
      var rowsH = per ? 19 : 34;
      b += bx(6, 6, 470, 320, title + bl, items.map(function (it, k) { var lab = per ? title + ' ' + pad2(k + 1) : title + ' ' + (id === 'xlr' ? (k * 4 + 1) + '-' + (k * 4 + 4) : (k * 8 + 1) + '-' + (k * 8 + 8)); var x = per && n > 8 ? (k < 8 ? 0 : 235) : 0, y = 24 + (per && n > 8 ? k % 8 : k) * (per ? 36 : rowsH + 4); return '<div ' + ctx.A(function () { ui.outFocus = k; ui.outHi = null; touch(); }) + ' style="position:absolute;left:' + (x + 6) + 'px;top:' + y + 'px;width:' + (per && n > 8 ? 222 : 456) + 'px;height:' + (per ? 32 : rowsH) + 'px;padding:2px 8px;border-radius:3px;background:' + (k === fo ? '#173246' : '#0b0e12') + ';border:1px solid ' + (k === fo ? '#39c6f4' : '#232a32') + '"><div style="font-size:10px;color:#8a96a3">' + esc(lab) + (per && it.tap ? ' · ' + esc(it.tap) : '') + '</div><div style="font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(blkLabel(it.src)) + '</div></div>'; }).join(''));
      b += bx(482, 6, 312, 320, 'Source for ' + esc(per ? title + ' ' + pad2(fo + 1) : title + ' ' + (fo + 1)), '');
      b += listHtml(lst.map(blkLabel), ci, hi, 488, 32, 300, 18, ctx, function (j) { if (ui.outHi === j) assignOut(path, fo, lst[j], per, id); ui.outHi = j; touch(); });
      enc = [E(per ? title : 'Block', per ? pad2(fo + 1) : String(fo + 1), function (d) { ui.outFocus = clamp(fo + d, 0, n - 1); ui.outHi = null; touch(); }, null),
        E('Source', blkLabel(lst[hi]), function (d) { ui.outHi = clamp(hi + d, 0, lst.length - 1); touch(); }, function () { assignOut(path, fo, lst[hi], per, id); }, { pl: 'SET', on: hi === ci }),
        per && id !== 'aux' || per ? E('Tap', items[fo].tap || 'POST', function (d) { SET(path + '.' + fo + '.tap', stepList(OUT_TAPS.concat(['POST']).filter(function (x, i, a) { return a.indexOf(x) === i; }), items[fo].tap || 'POST', d)); }, null) : NOE, NOE, NOE, NOE];
      return { body: b, enc: enc, layers: 1 };
    }
    function noLink(b) { var x = /^(AES50A|AES50B|Card)/.exec(String(b || '')); if (!x) return false; if (x[1] === 'Card') return G('routing.card.connected') === false; return !G('routing.aes50.' + (x[1] === 'AES50A' ? 'a' : 'b') + '.connected'); }
    function aesBlock(path, k) { var a = range(8).map(function (j) { var v = G(path + '.' + (k * 8 + j)); return v && typeof v === 'object' ? v.src : v || 'Off'; }); if (a.every(function (x) { return x === 'Off'; })) return 'Off'; var m0 = String(a[0]).match(/^(.*?)\s?(\d+)$/); if (m0) { var ok = a.every(function (x, j) { return x === m0[1] + (m0[1].slice(-1) === ' ' ? '' : ' ') + (+m0[2] + j) || x === m0[1] + ' ' + (+m0[2] + j); }); if (ok) return m0[1].trim() + ' ' + m0[2] + '-' + (+m0[2] + 7); } return 'Mixed'; }
    function assignOut(path, k, v, per, id) {
      if (per) { var cur = G(path + '.' + k); if (cur && typeof cur === 'object') SET(path + '.' + k + '.src', v); else SET(path + '.' + k, v); return; }
      if (id === 'aes50a' || id === 'aes50b') { var mm = v.match(/^(.*) (\d+)-(\d+)$/); m.batch(function () { for (var j = 0; j < 8; j++) SET(path + '.' + (k * 8 + j) + '.src', mm ? mm[1] + ' ' + (+mm[2] + j) : 'Off'); }); return; }
      if (id === 'xlr' && !G('routing.output.xlr')) { SET('routing.output.xlr', ['Out 1-4', 'Out 5-8', 'Out 9-12', 'Out 13-16']); }
      SET(path + '.' + k, v);
    }

    /* ================================================================ SETUP */
    function setRows(rows, ctx, x, y, w, rowH) { var s = ''; rows.forEach(function (r, k) { s += '<div style="position:absolute;left:' + x + 'px;top:' + (y + k * rowH) + 'px;width:' + w + 'px;height:' + (rowH - 3) + 'px;display:flex;align-items:center;gap:8px;padding:0 10px;border-radius:3px;background:' + (k === ui.setRow ? '#173246' : '#0f1318') + ';border:1px solid ' + (k === ui.setRow ? '#39c6f4' : '#232a32') + '" ' + ctx.A(function () { ui.setRow = k; touch(); }) + '><span style="flex:1;color:#b8c3ce;font-size:12px">' + esc(r.l) + '</span><span class="btn" style="padding:1px 6px" ' + ctx.A(function () { ui.setRow = k; if (r.t) r.t(-1); }) + '>◀</span><b style="min-width:150px;text-align:center;' + (k === ui.setRow ? 'color:#ffd23a' : '') + '">' + esc(r.v) + '</b><span class="btn" style="padding:1px 6px" ' + ctx.A(function () { ui.setRow = k; if (r.t) r.t(1); else if (r.p) r.p(); }) + '>▶</span></div>'; }); return s; }
    function rowsEnc(rows) { var r = rows[clamp(ui.setRow, 0, rows.length - 1)] || {}; return [E('Select', r.l || '', function (d) { ui.setRow = clamp(ui.setRow + d, 0, rows.length - 1); touch(); }, null), E('Value', r.v || '', r.t || null, r.p || null, { pl: r.p ? 'SET' : '' }), NOE, NOE, NOE, NOE]; }
    function optRow(l, path, list, def) { var v = Gd(path, def); return { l: l, v: String(v), t: function (d) { SET(path, stepList(list, v, d)); } }; }
    function numRow(l, path, lo, hi, st, def, fmt) { var v = +Gd(path, def); return { l: l, v: fmt ? fmt(v) : String(v), t: tNum(path, lo, hi, st, def) }; }
    function onRow(l, path, def) { var v = !!Gd(path, def); return { l: l, v: v ? 'ON' : 'OFF', t: function () { SET(path, !v); }, p: function () { SET(path, !v); } }; }
    function setupBuild(ctx) {
      var id = tabId('setup'), b = '', rows = null, enc;
      if (id === 'global') rows = [numRow('Screen Brightness', 'config.lcd.brightness', 10, 100, 5, 50, function (v) { return v + ' %'; }), numRow('LCD Contrast (Scribble)', 'config.lcd.contrast', 0, 100, 5, 50, function (v) { return v + ' %'; }), numRow('LED Brightness', 'config.setup.led', 10, 100, 10, 60, function (v) { return v + ' %'; }),
        optRow('Solo Mode', 'config.solo.mode', ['PFL', 'AFL'], 'PFL'), onRow('Exclusive Solo', 'config.solo.exclusive', false), onRow('Dim on Solo', 'config.solo.dimSolo', true), onRow('Select follows Solo', 'config.setup.selFollowsSolo', false),
        onRow('Confirm Scene Load', 'config.setup.confirmScene', true), optRow('Clock', 'config.setup.clock', ['24h', '12h'], '24h')];
      else if (id === 'config') {
        rows = [optRow('Sample Rate', 'config.setup.rate', ['48 kHz', '44.1 kHz'], '48 kHz'), optRow('Sync Source', 'config.setup.sync', ['Internal', 'AES50-A', 'AES50-B', 'Card'], 'Internal'), optRow('Main Bus Mode', 'config.setup.lrmode', ['LR + M', 'LCR'], 'LR + M'), optRow('Talkback Mic', 'config.setup.tbSrc', ['Internal', 'External'], 'Internal')];
        b += bx(6, 6, 388, 320, 'Console Config', setRows(rows, ctx, 6, 28, 374, 38));
        var pairs = []; range(16).forEach(function (k) { pairs.push({ l: 'Ch ' + (2 * k + 1) + '-' + (2 * k + 2), p: 'config.link.ch.' + k }); }); range(4).forEach(function (k) { pairs.push({ l: 'Aux ' + (2 * k + 1) + '-' + (2 * k + 2), p: 'config.link.aux.' + k }); }); range(8).forEach(function (k) { pairs.push({ l: 'Bus ' + (2 * k + 1) + '-' + (2 * k + 2), p: 'bus.' + (2 * k) + '.stereoLinkWithNext' }); }); range(3).forEach(function (k) { pairs.push({ l: 'Mtx ' + (2 * k + 1) + '-' + (2 * k + 2), p: 'config.link.mtx.' + k }); });
        b += bx(400, 6, 394, 320, 'Channel Link / Bus Pairing', '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;padding:6px">' + pairs.map(function (pp, k) { var on = !!G(pp.p); return '<span class="btn' + (on ? ' on' : '') + '" style="font-size:11px;padding:4px 0' + (ui.linkHi === k ? ';outline:2px solid #39c6f4' : '') + '" ' + ctx.A(function () { ui.linkHi = k; SET(pp.p, !on); }) + '>' + pp.l + '</span>'; }).join('') + '</div>');
        enc = rowsEnc(rows); var lp = pairs[clamp(ui.linkHi, 0, pairs.length - 1)];
        enc[3] = E('Link Pair', lp.l + (G(lp.p) ? ' ●' : ''), function (d) { ui.linkHi = clamp(ui.linkHi + d, 0, pairs.length - 1); touch(); }, function () { SET(lp.p, !G(lp.p)); }, { pl: 'LINK', on: !!G(lp.p) });
        return { body: b, enc: enc, layers: 1 };
      }
      else if (id === 'remote') rows = [optRow('Remote Control', 'config.setup.remote', ['Off', 'HUI', 'Mackie', 'Generic CC'], 'Off'), optRow('Interface', 'config.setup.remoteIf', ['USB Card', 'MIDI', 'Ethernet'], 'USB Card'), onRow('MIDI In', 'config.setup.midiIn', false), onRow('MIDI Out', 'config.setup.midiOut', false)];
      else if (id === 'network') { b += bx(6, 6, 788, 320, 'Network', [['IP Address', '192.168.0.64'], ['Subnet Mask', '255.255.255.0'], ['Gateway', '192.168.0.1'], ['DHCP', Gd('config.setup.dhcp', false) ? 'ON' : 'OFF'], ['Remote Apps', 'X32-Edit · X32-Mix · X32-Q'], ['MAC', '00:1A:2B:3C:4D:5E']].map(function (r) { return kv(r[0], esc(r[1])); }).join('').replace(/class="kv"/g, 'class="kv" style="padding:8px 14px;font-size:14px"')); return { body: b, enc: [E('DHCP', Gd('config.setup.dhcp', false) ? 'ON' : 'OFF', null, pTog('config.setup.dhcp'), { pl: 'DHCP', on: Gd('config.setup.dhcp', false) }), NOE, NOE, NOE, NOE, NOE], layers: 1 }; }
      else if (id === 'scribble') {
        var hi = clamp(ui.chHi, 0, 31);
        range(32).forEach(function (k) { var o = G('ch.' + k) || {}, c = col(o.color), x = 6 + (k % 8) * 98, y = 6 + Math.floor(k / 8) * 80; b += '<div class="bx" style="left:' + x + 'px;top:' + y + 'px;width:94px;height:76px;background:' + c.bg + ';color:' + c.fg + ';border:2px solid ' + (k === hi ? '#39c6f4' : '#000') + '" ' + ctx.A(function () { ui.chHi = k; touch(); openName('ch', k); }) + '><div style="display:flex;align-items:center;gap:4px;padding:4px 6px 0;font-size:11px;font-weight:700">' + icon(o.icon, 18) + ' CH ' + pad2(k + 1) + '</div><div style="padding:6px;font-size:15px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(o.name || '') + '</div></div>'; });
        var ho = G('ch.' + hi) || {};
        return { body: b, enc: [E('Channel', 'CH ' + pad2(hi + 1), function (d) { ui.chHi = clamp(hi + d, 0, 31); touch(); }, function () { openName('ch', hi); }, { pl: 'NAME' }), E('Color', col(ho.color).id, tNum('ch.' + hi + '.color', 0, 15, 1, 0), null, { f: (ho.color || 0) / 15 }), E('Icon', ICONS[clamp((ho.icon | 0) - 1, 0, 73)], tNum('ch.' + hi + '.icon', 1, 74, 1, 1), null), NOE, NOE, NOE], layers: 1 };
      }
      else if (id === 'preamps') {
        var ph = clamp(ui.chHi, 0, 31);
        range(32).forEach(function (k) { var o = G('ch.' + k) || {}, pa = o.preamp || {}, x = 6 + (k % 16) * 49, y = 6 + Math.floor(k / 16) * 162, f = frLin(pa.gain, -12, 60); b += '<div class="bx" style="left:' + x + 'px;top:' + y + 'px;width:46px;height:156px;' + (k === ph ? 'border-color:#39c6f4;background:#14212c' : '') + '" ' + ctx.A(function () { ui.chHi = k; touch(); }) + '><div style="text-align:center;font-size:11px;font-weight:700;padding:2px 0;background:#232b34">' + (k + 1) + '</div><div style="position:absolute;left:8px;top:22px;width:10px;height:90px;background:#000"><div style="position:absolute;left:0;right:0;bottom:0;height:' + Math.round(f * 90) + 'px;background:#39c6f4"></div></div>' + mv('ch:' + k, 26, 22, 8, 90) + '<div style="position:absolute;left:0;right:0;top:116px;text-align:center;font-size:10px;font-weight:700">' + fDbI(pa.gain) + '</div><div style="position:absolute;left:4px;right:4px;top:132px;text-align:center"><span class="led r' + (pa.phantom ? ' on' : '') + '" style="min-width:0;width:100%" ' + ctx.A(pTog('ch.' + k + '.preamp.phantom')) + '>48V</span></div></div>'; });
        var pp2 = (G('ch.' + ph) || {}).preamp || {};
        return { body: b, enc: [E('Preamp', 'Local ' + (ph + 1), function (d) { ui.chHi = clamp(ph + d, 0, 31); touch(); }, null), E('Gain', fDb(pp2.gain, 1), tNum('ch.' + ph + '.preamp.gain', -12, 60, 0.5), pTog('ch.' + ph + '.preamp.phantom'), { f: frLin(pp2.gain, -12, 60), pl: '48V', on: pp2.phantom, pc: 'cr' }), NOE, NOE, NOE, NOE], layers: 1 };
      }
      else rows = [{ l: 'Card Type', v: Gd('routing.card.type', 'X-USB') + (G('routing.card.connected') === false ? ' (not detected)' : '') }, optRow('USB Channels (in/out)', 'config.setup.usbCh', ['32/32', '16/16', '32/8', '8/32', '8/8', '2/2'], '32/32'), optRow('USB Driver', 'config.setup.usbDrv', ['ASIO / Core Audio'], 'ASIO / Core Audio')];
      b += bx(6, 6, 788, 320, { global: 'Global Settings', remote: 'Remote', card: 'Expansion Card' }[id] || '', setRows(rows, ctx, 6, 28, 774, Math.min(36, Math.floor(290 / rows.length))));
      return { body: b, enc: rowsEnc(rows), layers: 1 };
    }

    /* ================================================================ LIBRARY */
    var LIBKEY = 'x32s-library-v1';
    function libLoad() { var L = G('library'); if (L && L.channel) return L; var st = null; try { st = JSON.parse(localStorage.getItem(LIBKEY) || 'null'); } catch (e) { st = null; } if (st && st.channel) { LS.library = st; return st; } LS.library = libFactory(); return LS.library; }
    function libSave(L) { if (G('library') && G('library').channel && m.state && m.state.library) SET('library', L); else { LS.library = L; try { localStorage.setItem(LIBKEY, JSON.stringify(L)); } catch (e) { /* 저장 못 하면 이번만 */ } touch(); } }
    function libFactory() {
      var g = function (thr) { return { on: true, mode: 'GATE', thr: thr, range: 40, attack: 0.5, hold: 60, release: 180, keySrc: 'SELF', filter: { on: false, type: '3.0', freq: 1000 } }; };
      var dy = function (thr, r, a, rl, mk) { return { on: true, mode: 'COMP', thr: thr, ratio: r, knee: 2, attack: a, hold: 10, release: rl, gain: mk, auto: false, det: 'PEAK', env: 'LOG', keySrc: 'SELF', filter: { on: false, type: '3.0', freq: 1000 }, mix: 100 }; };
      var eqb = function (a) { return { on: true, bands: a.map(function (x) { return { type: x[0], freq: x[1], gain: x[2], q: x[3] }; }) }; };
      return {
        channel: [
          { name: '*Vocal Lead', data: { preamp: { lowcut: { on: true, freq: 100 } }, gate: { on: false }, dyn: dy(-18, 3, 10, 120, 3), eq: eqb([['PEQ', 180, -2, 1.5], ['PEQ', 400, -2, 2], ['PEQ', 3000, 2, 1.5], ['HShv', 10000, 2.5, 0.7]]) } },
          { name: '*Speech', data: { preamp: { lowcut: { on: true, freq: 120 } }, gate: { on: false }, dyn: dy(-20, 2.5, 15, 150, 3), eq: eqb([['LShv', 150, -3, 0.7], ['PEQ', 300, -2, 1.5], ['PEQ', 2500, 2, 1.2], ['HShv', 9000, 1, 0.7]]) } },
          { name: '*Kick', data: { preamp: { lowcut: { on: true, freq: 30 } }, gate: g(-35), dyn: dy(-15, 4, 5, 80, 2), eq: eqb([['PEQ', 60, 4, 1.4], ['PEQ', 350, -6, 2], ['PEQ', 3500, 3, 1.5], ['HShv', 10000, -2, 0.7]]) } },
          { name: '*Snare', data: { preamp: { lowcut: { on: true, freq: 80 } }, gate: g(-32), dyn: dy(-16, 3, 3, 100, 2), eq: eqb([['PEQ', 200, 2, 1.5], ['PEQ', 600, -3, 2], ['PEQ', 5000, 3, 1.4], ['HShv', 10000, 2, 0.7]]) } },
          { name: '*Acoustic Gtr', data: { preamp: { lowcut: { on: true, freq: 90 } }, gate: { on: false }, dyn: dy(-20, 2.5, 15, 150, 2), eq: eqb([['PEQ', 120, -2, 1.5], ['PEQ', 250, -3, 2], ['PEQ', 3000, 2, 1.2], ['HShv', 10000, 2, 0.7]]) } },
          { name: '*Bass DI', data: { preamp: { lowcut: { on: true, freq: 35 } }, gate: { on: false }, dyn: dy(-18, 4, 10, 150, 3), eq: eqb([['LShv', 80, 2, 0.7], ['PEQ', 250, -3, 1.5], ['PEQ', 800, 2, 1.5], ['HShv', 5000, -2, 0.7]]) } }
        ],
        effects: [{ name: '*Vocal Hall', data: { type: 'Hall Reverb', params: { predelay: 30, decay: 1.8, size: 60, damping: 6000, lowcut: 150, hicut: 9000, mix: 100 } } }, { name: '*Short Plate', data: { type: 'Plate Reverb', params: { predelay: 10, decay: 1.1, size: 40, damping: 7000, lowcut: 150, hicut: 10000, mix: 100 } } }, { name: '*1/4 Delay 120', data: { type: 'Stereo Delay', params: { time: 500, factorL: '1/4', factorR: '3/8', feedback: 25, lowcut: 200, hicut: 6000, mix: 100 } } }],
        routing: [{ name: '*Local (Default)', data: { input: { blocks: ['Local 1-8', 'Local 9-16', 'Local 17-24', 'Local 25-32'], aux: 'AUX 1-6 / USB 2' } } }, { name: '*Stage Box AES50-A', data: { input: { blocks: ['AES50A 1-8', 'AES50A 9-16', 'AES50A 17-24', 'AES50A 25-32'], aux: 'AUX 1-6 / USB 2' } } }, { name: '*USB Playback', data: { input: { blocks: ['Card 1-8', 'Card 9-16', 'Card 17-24', 'Card 25-32'], aux: 'AUX 1-6 / USB 2' } } }]
      };
    }
    function chPreset(o, scope) { var d = {}; if (scope.head) d.head = { gain: o.preamp.gain, phantom: o.preamp.phantom }; if (scope.config) d.preamp = { invert: o.preamp.invert, lowcut: clone(o.preamp.lowcut), delay: clone(o.preamp.delay) }; if (scope.gate && o.gate) d.gate = clone(o.gate); if (scope.dyn && o.dyn) d.dyn = clone(o.dyn); if (scope.eq && o.eq) d.eq = clone(o.eq); if (scope.sends && o.sends) d.sends = clone(o.sends); return d; }
    function applyCh(pre, d, scope) { m.batch(function () { if (d.head && scope.head) setDeep(pre + '.preamp', d.head); if (d.preamp && scope.config) setDeep(pre + '.preamp', d.preamp); if (d.gate && scope.gate && G(pre + '.gate')) setDeep(pre + '.gate', d.gate); if (d.dyn && scope.dyn && G(pre + '.dyn')) setDeep(pre + '.dyn', d.dyn); if (d.eq && scope.eq && G(pre + '.eq')) { var nb = (G(pre + '.eq.bands') || []).length; SET(pre + '.eq.on', d.eq.on !== false); (d.eq.bands || []).slice(0, nb).forEach(function (bd, k) { setDeep(pre + '.eq.bands.' + k, bd); }); } if (d.sends && scope.sends && G(pre + '.sends')) setDeep(pre + '.sends', d.sends); }); }
    function libraryBuild(ctx) {
      var id = tabId('library'), L = libLoad(), list = L[id] || [], hi = clamp(ui.libHi, 0, Math.max(0, list.length - 1)), b = '', s = sel(), it = list[hi];
      b += bx(6, 6, 420, 320, { channel: 'Channel Presets', effects: 'Effects Presets', routing: 'Routing Presets' }[id] + ' (' + list.length + ')', '');
      b += listHtml(list.map(function (p, k) { return pad2(k + 1) + '  ' + p.name; }), -1, hi, 12, 32, 408, 18, ctx, function (k) { ui.libHi = k; touch(); });
      var target = id === 'channel' ? esc(s.id + ' ' + s.name) : id === 'effects' ? 'FX ' + (ui.libFx + 1) + ' · ' + esc(G('fx.' + ui.libFx + '.type') || '') : 'Input routing';
      var info = '<div class="kv" style="padding:6px 10px"><span>TARGET</span><b>' + target + '</b></div><div class="kv" style="padding:6px 10px"><span>PRESET</span><b>' + esc(it ? it.name : '—') + '</b></div>';
      if (id === 'channel') info += '<div style="padding:6px 10px;font-size:11px;color:#8a96a3">RECALL SCOPE</div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding:0 10px">' + [['head', 'Head Amp'], ['config', 'Config'], ['gate', 'Gate'], ['dyn', 'Dynamics'], ['eq', 'EQ'], ['sends', 'Sends']].map(function (sc) { return '<span class="btn' + (ui.libScope[sc[0]] ? ' on' : '') + '" ' + ctx.A(function () { ui.libScope[sc[0]] = !ui.libScope[sc[0]]; touch(); }) + '>' + sc[1] + '</span>'; }).join('') + '</div>';
      if (id === 'effects') info += '<div style="display:flex;gap:4px;padding:6px 10px">' + range(8).map(function (k) { return '<span class="btn' + (ui.libFx === k ? ' on' : '') + '" style="flex:1;padding:4px 0" ' + ctx.A(function () { ui.libFx = k; touch(); }) + '>' + (k + 1) + '</span>'; }).join('') + '</div>';
      info += '<div style="display:flex;gap:6px;padding:14px 10px 0;flex-wrap:wrap">' + ['Load', 'Save', 'Rename', 'Delete'].map(function (a2) { return '<span class="btn" style="flex:1;padding:8px 0" ' + ctx.A(function () { libAct(a2, id); }) + '>' + a2 + '</span>'; }).join('') + '</div>';
      if (ui.msg && now() - ui.msgT < 2500) info += '<div style="padding:10px;color:#3ddc84;font-weight:700">' + esc(ui.msg) + '</div>';
      b += bx(432, 6, 362, 320, 'Preset', info);
      var enc = [E('Preset', it ? it.name : '—', function (d) { ui.libHi = clamp(hi + d, 0, Math.max(0, list.length - 1)); touch(); }, function () { libAct('Load', id); }, { pl: 'LOAD' }),
        id === 'effects' ? E('FX Slot', 'FX ' + (ui.libFx + 1), function (d) { ui.libFx = clamp(ui.libFx + d, 0, 7); touch(); }, null) : NOE,
        E('Save', 'new', null, function () { libAct('Save', id); }, { pl: 'SAVE' }), E('Rename', '', null, function () { libAct('Rename', id); }, { pl: 'NAME' }), E('Delete', '', null, function () { libAct('Delete', id); }, { pl: 'DEL', pc: 'cr' }), E('Load', '', null, function () { libAct('Load', id); }, { pl: 'LOAD', pc: 'cg' })];
      return { body: b, enc: enc, layers: 1 };
    }
    function libAct(a, id) {
      var L = clone(libLoad()), list = L[id] = L[id] || [], hi = clamp(ui.libHi, 0, Math.max(0, list.length - 1)), it = list[hi], s = sel();
      if (a === 'Load') { if (!it) return; if (id === 'channel') { if (!(s.t === 'ch' || s.t === 'aux' || s.t === 'fxr' || s.t === 'bus')) return; applyCh(s.pre, it.data, ui.libScope); msg('Loaded "' + it.name + '" → ' + s.id); } else if (id === 'effects') { m.batch(function () { SET('fx.' + ui.libFx + '.type', it.data.type); SET('fx.' + ui.libFx + '.params', clone(it.data.params)); }); msg('Loaded "' + it.name + '" → FX ' + (ui.libFx + 1)); } else { setDeep('routing.input', it.data.input); msg('Loaded "' + it.name + '"'); } return; }
      if (a === 'Delete') { if (!it) return; list.splice(hi, 1); libSave(L); msg('Deleted'); return; }
      if (a === 'Save') { var nm = id === 'channel' ? s.name : id === 'effects' ? (G('fx.' + ui.libFx + '.type') || 'FX') : 'Routing'; openText(nm, function (txt) { var L2 = clone(libLoad()), d; if (id === 'channel') d = chPreset(s.o, { head: true, config: true, gate: true, dyn: true, eq: true, sends: true }); else if (id === 'effects') d = { type: G('fx.' + ui.libFx + '.type'), params: clone(G('fx.' + ui.libFx + '.params')) }; else d = { input: clone(G('routing.input')) }; L2[id].push({ name: txt || nm, data: d }); ui.libHi = L2[id].length - 1; libSave(L2); msg('Saved "' + (txt || nm) + '"'); }); return; }
      if (a === 'Rename' && it) openText(it.name, function (txt) { var L3 = clone(libLoad()); L3[id][hi].name = txt || it.name; libSave(L3); });
    }

    /* ================================================================ EFFECTS */
    function effectsBuild(ctx) {
      var id = tabId('effects'), b = '', enc, fxs = G('fx') || [];
      if (id === 'home') {
        var sl = clamp(ui.fxSel, 0, 7), types = fxTypesFor(sl), curT = types.indexOf((fxs[sl] || {}).type), th = ui.fxTypeHi == null ? Math.max(0, curT) : clamp(ui.fxTypeHi, 0, types.length - 1);
        range(8).forEach(function (k) { var f = fxs[k] || {}, x = 6 + (k % 2) * 258, y = 6 + Math.floor(k / 2) * 80, src = f.source || {}; b += '<div class="bx" style="left:' + x + 'px;top:' + y + 'px;width:254px;height:76px;background:linear-gradient(#20262e,#11151a);' + (k === sl ? 'border-color:#39c6f4;box-shadow:0 0 0 1px #39c6f4 inset' : '') + '" ' + ctx.A(function () { if (ui.fxSel === k) setTab('effects', 'fx' + (k + 1)); ui.fxSel = k; ui.fxTypeHi = null; touch(); }) + '>' +
          '<div style="position:absolute;left:8px;top:6px;font-size:20px;font-weight:900;color:#39c6f4">' + (k + 1) + '</div><div style="position:absolute;left:34px;top:6px;right:30px;font-size:15px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(f.type || '—') + '</div>' +
          '<div style="position:absolute;left:34px;top:28px;font-size:11px;color:#8a96a3">' + (k < 4 ? 'IN L: ' + esc(src.l || 'INS') + ' · R: ' + esc(src.r || 'INS') : 'INSERT ONLY') + '</div>' +
          '<div style="position:absolute;left:34px;top:46px;font-size:11px;color:#ffd23a">' + (f['return'] != null ? 'RTN FX ' + (Math.floor(f['return'] / 2) + 1) : (k < 4 ? 'RTN —' : 'INS')) + '</div>' + mv('fxr:' + (k < 4 ? k * 2 : 99), 228, 8, 6, 60) + mv('fxr:' + (k < 4 ? k * 2 + 1 : 99), 237, 8, 6, 60) + '</div>'; });
        b += bx(524, 6, 270, 320, 'Type for FX ' + (sl + 1), '');
        b += listHtml(types, curT, th, 530, 32, 258, 18, ctx, function (j) { if (ui.fxTypeHi === j) setFxType(sl, types[j]); ui.fxTypeHi = j; touch(); });
        var srcs = (fxs[sl] || {}).source || {};
        enc = [E('FX Slot', 'FX ' + (sl + 1), function (d) { ui.fxSel = clamp(sl + d, 0, 7); ui.fxTypeHi = null; touch(); }, function () { setTab('effects', 'fx' + (sl + 1)); }, { pl: 'EDIT' }),
          E('Type', types[th], function (d) { ui.fxTypeHi = clamp(th + d, 0, types.length - 1); touch(); }, function () { setFxType(sl, types[th]); }, { pl: 'SET', on: th === curT }),
          sl < 4 ? E('Source L', srcs.l || 'INS', function (d) { SET('fx.' + sl + '.source.l', stepList(FX_SRC, srcs.l || 'INS', d)); }, null) : NOE,
          sl < 4 ? E('Source R', srcs.r || 'INS', function (d) { SET('fx.' + sl + '.source.r', stepList(FX_SRC, srcs.r || 'INS', d)); }, null) : NOE, NOE, E('Edit', '', null, function () { setTab('effects', 'fx' + (sl + 1)); }, { pl: 'EDIT' })];
        return { body: b, enc: enc, layers: 1 };
      }
      var k = (+id.slice(2) || 1) - 1, f = fxs[k] || {}, t = f.type || '', pr = f.params || {}, pre = 'fx.' + k + '.params';
      ui.fxSel = k;
      if (isGeq(t)) {
        var bands = pr.bands || range(31).map(function () { return 0; }), bh = clamp(ui.geqBand, 0, 30);
        b += bx(6, 6, 788, 320, 'FX ' + (k + 1) + ' · ' + esc(t), range(31).map(function (j) { var x = 14 + j * 25, v = +bands[j] || 0; return '<div style="position:absolute;left:' + x + 'px;top:34px;width:21px;height:230px;border-radius:2px;background:' + (j === bh ? '#173246' : '#0b0e12') + '" ' + ctx.D({ type: 'geq', path: pre + '.bands.' + j, band: j, top: 34, hgt: 230 }) + '><div style="position:absolute;left:9px;top:0;bottom:0;width:3px;background:#000"></div><div style="position:absolute;left:0;right:0;top:114px;height:1px;background:#3b4652"></div><div style="position:absolute;left:2px;width:17px;height:10px;border-radius:2px;background:' + (j === bh ? '#ffd23a' : '#e6ebf0') + ';top:' + Math.round((1 - (v + 15) / 30) * 220) + 'px"></div></div><div class="dim" style="position:absolute;left:' + (x - 4) + 'px;top:270px;width:29px;text-align:center;font-size:9px">' + geqLbl(GEQF[j]) + '</div>'; }).join('') + '<div style="position:absolute;left:14px;top:290px;font-size:12px">BAND <b class="yel">' + geqLbl(GEQF[bh]) + ' Hz  ' + fDb(bands[bh], 1) + '</b></div>');
        enc = [E('Band', geqLbl(GEQF[bh]) + ' Hz', function (d) { ui.geqBand = clamp(bh + d, 0, 30); touch(); }, null), E('Gain', fDb(bands[bh], 1), tNum(pre + '.bands.' + bh, -15, 15, 0.5, 0), function () { SET(pre + '.bands.' + bh, 0); }, { f: ((+bands[bh] || 0) + 15) / 30, pl: '0 dB' }), NOE, NOE,
          E('Reset All', '', null, function () { SET(pre + '.bands', range(31).map(function () { return 0; })); }, { pl: 'FLAT' }), E('Mix', (pr.mix == null ? 100 : pr.mix) + ' %', tNum(pre + '.mix', 0, 100, 5, 100), null, { f: (pr.mix == null ? 100 : pr.mix) / 100 })];
        return { body: b, enc: enc, layers: 1 };
      }
      var defs = fxDefs(t), nl = Math.ceil(defs.length / 6), L = layer(nl), pg = defs.slice(L * 6, L * 6 + 6);
      var panel = '<div style="position:absolute;left:10px;top:28px;right:10px;height:44px;display:flex;align-items:center;gap:12px;padding:0 12px;border-radius:4px;background:linear-gradient(90deg,#1b2a3a,#0f1720);border:1px solid #2c4258"><b style="font-size:22px;color:#39c6f4">' + esc(fxShort(t)) + '</b><span style="font-size:15px;font-weight:700">' + esc(t) + '</span><span class="dim" style="margin-left:auto">' + (k < 4 ? 'SEND FX · ' + esc(((f.source || {}).l) || 'INS') : 'INSERT FX') + '</span>' + mv('fxr:' + (k < 4 ? k * 2 : 99), 0, 0, 0, 0).replace('class="mv ', 'class="mv x ') + '</div>';
      panel += defs.map(function (p2, j) { var v = pr[p2.k] == null ? p2.d : pr[p2.k], fr = Array.isArray(p2.sc) ? Math.max(0, p2.sc.indexOf(v)) / Math.max(1, p2.sc.length - 1) : p2.sc === 'log' ? frLog(v, p2.lo, p2.hi) : frLin(v, p2.lo, p2.hi), x = 16 + (j % 6) * 128, y = 84 + Math.floor(j / 6) * 118, on = Math.floor(j / 6) === L; return '<div style="position:absolute;left:' + x + 'px;top:' + y + 'px;width:118px;height:112px;text-align:center;' + (on ? '' : 'opacity:.45') + '" ' + ctx.D({ type: 'fxknob', path: pre + '.' + p2.k, def: p2 }) + '>' + knobSvg(fr, on) + '<div style="font-size:11px;font-weight:700;color:#9fb0c0;margin-top:2px">' + esc(p2.l) + '</div><div style="font-size:14px;font-weight:700;' + (on ? 'color:#ffd23a' : '') + '">' + esc(fxVal(p2, v)) + '</div></div>'; }).join('');
      b += bx(6, 6, 788, 320, 'FX ' + (k + 1) + ' · Edit', panel);
      enc = pg.map(function (p2) { var v = pr[p2.k] == null ? p2.d : pr[p2.k]; return E(p2.l, fxVal(p2, v), function (d) { fxTurn(pre + '.' + p2.k, p2, d); }, function () { SET(pre + '.' + p2.k, p2.d); }, { pl: 'DEF', f: Array.isArray(p2.sc) ? Math.max(0, p2.sc.indexOf(v)) / Math.max(1, p2.sc.length - 1) : p2.sc === 'log' ? frLog(v, p2.lo, p2.hi) : frLin(v, p2.lo, p2.hi) }); });
      while (enc.length < 6) enc.push(NOE);
      return { body: b, enc: enc, layers: nl };
    }
    function knobSvg(fr, on) { var a0 = -135, a1 = a0 + 270 * fr, r = 34, cx = 59, cy = 42, pt = function (a) { var rad = (a - 90) * Math.PI / 180; return (cx + r * Math.cos(rad)).toFixed(1) + ',' + (cy + r * Math.sin(rad)).toFixed(1); }; var large = a1 - a0 > 180 ? 1 : 0; return '<svg width="118" height="80" style="display:block"><path d="M' + pt(a0) + ' A' + r + ',' + r + ' 0 1 1 ' + pt(135) + '" fill="none" stroke="#2a323c" stroke-width="6"/>' + (fr > 0.005 ? '<path d="M' + pt(a0) + ' A' + r + ',' + r + ' 0 ' + large + ' 1 ' + pt(a1) + '" fill="none" stroke="' + (on ? '#39c6f4' : '#5a6672') + '" stroke-width="6"/>' : '') + '<circle cx="' + cx + '" cy="' + cy + '" r="24" fill="#22272e" stroke="#000"/><line x1="' + cx + '" y1="' + cy + '" x2="' + pt(a1).split(',')[0] + '" y2="' + pt(a1).split(',')[1] + '" stroke="#ff8a1f" stroke-width="3" transform="scale(1)"/></svg>'; }
    function fxVal(p2, v) { if (Array.isArray(p2.sc)) return String(v); v = +v; if (p2.u === 'Hz') return fHz(v); if (p2.u === 'ms') return fMs(v); if (p2.u === 's') return v.toFixed(2) + ' s'; if (p2.u === 'dB') return fDb(v, 1); return (Math.abs(v) < 10 && v % 1 ? v.toFixed(2) : Math.round(v)) + (p2.u ? ' ' + p2.u : ''); }
    function fxTurn(path, p2, d) { var v = G(path); if (v == null) v = p2.d; if (Array.isArray(p2.sc)) { SET(path, stepList(p2.sc, v, d)); return; } if (p2.sc === 'log') { SET(path, sig(clamp((+v || p2.lo) * Math.pow(p2.hi / p2.lo, d / 100), p2.lo, p2.hi), 3)); return; } var st = (p2.hi - p2.lo) / 100; SET(path, +clamp(+v + d * st, p2.lo, p2.hi).toFixed(p2.hi - p2.lo <= 10 ? 2 : 1)); }
    function setFxType(k, t) { var cur = G('fx.' + k + '.params') || {}, np = {}; fxDefs(t).forEach(function (p2) { np[p2.k] = cur[p2.k] != null && !Array.isArray(p2.sc) ? cur[p2.k] : p2.d; }); if (isGeq(t)) np = { bands: range(31).map(function () { return 0; }), mix: 100 }; m.batch(function () { SET('fx.' + k + '.type', t); SET('fx.' + k + '.params', np); }); ui.fxTypeHi = null; }

    /* ================================================================ MUTE GRP */
    function mutegrpBuild(ctx) {
      var b = '', s = sel(), L = layer(2), mg = G('muteGroups') || [];
      range(6).forEach(function (k) {
        var on = mg[k] && mg[k].on, mem = [], x = 6 + (k % 3) * 264, y = 6 + Math.floor(k / 3) * 162;
        ['ch', 'aux', 'fxr', 'bus'].forEach(function (t) { (G(t) || []).forEach(function (o, i) { if (o.muteGrp && o.muteGrp[k]) mem.push(m.shortId ? m.shortId(t, i) : t + (i + 1)); }); });
        var mine = s.o.muteGrp && s.o.muteGrp[k];
        b += '<div class="bx" style="left:' + x + 'px;top:' + y + 'px;width:258px;height:156px;' + (on ? 'border-color:#ff4d4d;background:#2a1012' : '') + '"><div class="h" style="' + (on ? 'background:#ff4d4d;color:#200' : '') + '">MUTE GROUP ' + (k + 1) + ' <span style="margin-left:auto;font-weight:400">' + esc((mg[k] && mg[k].name) || '') + '</span></div>' +
          '<div style="padding:6px 8px;font-size:11px;color:#b8c3ce;height:72px;overflow:hidden;line-height:15px">' + (mem.length ? esc(mem.join(', ')) : '<span class="dim">(empty)</span>') + '</div>' +
          '<div style="position:absolute;left:8px;right:8px;bottom:8px;display:flex;gap:6px"><span class="btn r' + (on ? ' on' : '') + '" style="flex:2;padding:8px 0" ' + ctx.A(pTog('muteGroups.' + k + '.on')) + '>' + (on ? 'MUTED' : 'MUTE') + '</span>' + (s.o.muteGrp ? '<span class="btn' + (mine ? ' on' : '') + '" style="flex:1;padding:8px 0" ' + ctx.A(pTog(s.pre + '.muteGrp.' + k)) + '>' + (mine ? '● ' : '+ ') + esc(s.id) + '</span>' : '') + '</div></div>';
      });
      var enc = range(6).map(function (k) { return L === 0 ? E('Group ' + (k + 1), mg[k] && mg[k].on ? 'MUTED' : 'off', null, pTog('muteGroups.' + k + '.on'), { pl: 'MUTE', on: mg[k] && mg[k].on, pc: 'cr' }) : (s.o.muteGrp ? E('Assign ' + (k + 1), s.id + (s.o.muteGrp[k] ? ' ●' : ''), null, pTog(s.pre + '.muteGrp.' + k), { pl: 'ASGN', on: s.o.muteGrp[k] }) : NOE); });
      return { body: b, enc: enc, layers: 2 };
    }

    /* ================================================================ SCENES */
    function scenesBuild(ctx) {
      var id = tabId('scenes'), sc = G('config.scenes') || { list: [] }, list = sc.list || [], b = '', cur = sc.current | 0, hi = ui.sceneHi == null ? (sc.next == null ? cur : sc.next | 0) : ui.sceneHi; hi = clamp(hi, 0, 99);
      if (id === 'home' || id === 'scenes') {
        var names = range(100).map(function (k) { var s2 = list[k]; return pad2(k) + '  ' + (s2 && s2.data ? (s2.name || '(no name)') : '- - -'); });
        b += bx(6, 6, 460, 320, 'Scenes', '');
        b += listHtml(names, cur, hi, 12, 32, 448, 18, ctx, function (k) { if (ui.sceneHi === k && id === 'home') sceneGo(k); ui.sceneHi = k; SET('config.scenes.next', k); touch(); });
        var it = list[hi];
        b += bx(472, 6, 322, 320, id === 'home' ? 'Current / Next' : 'Scene Manager', '<div style="padding:10px"><div class="dim" style="font-size:11px">CURRENT</div><div class="big" style="font-size:18px">' + pad2(cur) + '  ' + esc((list[cur] || {}).name || '') + (sc.dirty ? ' <span style="color:#ff9f1c">*</span>' : '') + '</div>' +
          '<div class="dim" style="font-size:11px;margin-top:12px">' + (id === 'home' ? 'NEXT' : 'SELECTED') + '</div><div class="big" style="font-size:18px;color:#ffd23a">' + pad2(hi) + '  ' + esc(it && it.data ? it.name : '- - -') + '</div>' +
          '<div style="font-size:11px;margin-top:10px;color:' + (sc.dirty ? '#ff9f1c' : '#7d8996') + '">' + (sc.dirty ? 'Edited since last recall/save' : 'No changes since recall') + '</div></div>' +
          '<div style="position:absolute;left:10px;right:10px;bottom:10px;display:grid;grid-template-columns:repeat(3,1fr);gap:6px">' +
          (id === 'home' ? '<span class="btn g" style="padding:10px 0;grid-column:span 2" ' + ctx.A(function () { sceneGo(hi); }) + '>GO (Load ' + pad2(hi) + ')</span><span class="btn' + (sc.canUndo ? '' : ' x') + '" style="padding:10px 0;' + (sc.canUndo ? '' : 'opacity:.4') + '" ' + ctx.A(function () { if (m.undoScene) m.undoScene(); }) + '>UNDO</span>' : '') +
          '<span class="btn" style="padding:10px 0" ' + ctx.A(function () { sceneSave(hi); }) + '>SAVE</span><span class="btn" style="padding:10px 0" ' + ctx.A(function () { sceneRename(hi); }) + '>RENAME</span><span class="btn r" style="padding:10px 0" ' + ctx.A(function () { sceneDel(hi); }) + '>DELETE</span></div>');
        var pick = function (d) { ui.sceneHi = clamp(hi + d, 0, 99); SET('config.scenes.next', ui.sceneHi); touch(); };
        var enc = id === 'home' ? [E('Scene', pad2(hi) + ' ' + ((it && it.data && it.name) || '- - -'), pick, function () { sceneGo(hi); }, { pl: 'GO', pc: 'cg' }), NOE, E('Save', '', null, function () { sceneSave(hi); }, { pl: 'SAVE' }), E('Rename', '', null, function () { sceneRename(hi); }, { pl: 'NAME' }), E('Undo', sc.canUndo ? 'ready' : '—', null, function () { if (m.undoScene) m.undoScene(); }, { pl: 'UNDO', on: sc.canUndo }), E('Go', '', null, function () { sceneGo(hi); }, { pl: 'GO', pc: 'cg' })]
          : [E('Scene', pad2(hi) + ' ' + ((it && it.data && it.name) || '- - -'), pick, null), NOE, E('Save', '', null, function () { sceneSave(hi); }, { pl: 'SAVE' }), E('Rename', '', null, function () { sceneRename(hi); }, { pl: 'NAME' }), E('Delete', '', null, function () { sceneDel(hi); }, { pl: 'DEL', pc: 'cr' }), E('Copy to next', '', null, function () { sceneCopy(hi); }, { pl: 'COPY' })];
        return { body: b, enc: enc, layers: 1 };
      }
      if (id === 'psafe') {
        var cats = [['preamp', 'Input Preamps (Head Amp)'], ['config', 'Channel Config'], ['eq', 'EQ'], ['dyn', 'Gate / Dynamics'], ['sends', 'Sends'], ['fader', 'Fader / Pan / Mute'], ['routing', 'Routing In/Out'], ['fx', 'Effects'], ['dca', 'DCA / Mute Groups']], ph = clamp(ui.safeHi, 0, cats.length - 1);
        b += bx(6, 6, 788, 320, 'Parameter Safe — these are NOT changed by scene recall', '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:10px">' + cats.map(function (c2, k) { var on = !!G('config.scenes.safe.params.' + c2[0]); return '<span class="btn' + (on ? ' on' : '') + '" style="padding:18px 4px' + (k === ph ? ';outline:2px solid #39c6f4' : '') + '" ' + ctx.A(function () { ui.safeHi = k; SET('config.scenes.safe.params.' + c2[0], !on); }) + '>' + (on ? 'SAFE · ' : '') + c2[1] + '</span>'; }).join('') + '</div>');
        return { body: b, enc: [E('Category', cats[ph][1], function (d) { ui.safeHi = clamp(ph + d, 0, cats.length - 1); touch(); }, pTog('config.scenes.safe.params.' + cats[ph][0]), { pl: 'SAFE', on: !!G('config.scenes.safe.params.' + cats[ph][0]) }), NOE, NOE, NOE, NOE, NOE], layers: 1 };
      }
      var chs = [], b2 = '';
      range(32).forEach(function (k) { chs.push({ l: String(k + 1), p: 'ch.' + k }); }); range(8).forEach(function (k) { chs.push({ l: 'A' + (k + 1), p: 'aux.' + k }); }); range(8).forEach(function (k) { chs.push({ l: 'F' + (k + 1), p: 'fxr.' + k }); }); range(16).forEach(function (k) { chs.push({ l: 'B' + (k + 1), p: 'bus.' + k }); }); range(6).forEach(function (k) { chs.push({ l: 'MX' + (k + 1), p: 'mtx.' + k }); }); chs.push({ l: 'LR', p: 'main.st' }, { l: 'M/C', p: 'main.m' }); range(8).forEach(function (k) { chs.push({ l: 'D' + (k + 1), p: 'dca.' + k }); });
      var chh = clamp(ui.safeHi, 0, chs.length - 1);
      b2 = '<div style="display:grid;grid-template-columns:repeat(16,1fr);gap:3px;padding:6px">' + chs.map(function (c2, k) { var on = !!G('config.scenes.safe.ch.' + c2.p.replace('.', '_')); return '<span class="btn' + (on ? ' on' : '') + '" style="padding:6px 0;font-size:11px' + (k === chh ? ';outline:2px solid #39c6f4' : '') + '" ' + ctx.A(function () { ui.safeHi = k; SET('config.scenes.safe.ch.' + c2.p.replace('.', '_'), !on); }) + '>' + c2.l + '</span>'; }).join('') + '</div>';
      b += bx(6, 6, 788, 320, 'Channel Safe — lit channels are NOT changed by scene recall', b2);
      return { body: b, enc: [E('Channel', chs[chh].l, function (d) { ui.safeHi = clamp(chh + d, 0, chs.length - 1); touch(); }, function () { var p2 = 'config.scenes.safe.ch.' + chs[chh].p.replace('.', '_'); SET(p2, !G(p2)); }, { pl: 'SAFE', on: !!G('config.scenes.safe.ch.' + chs[chh].p.replace('.', '_')) }), NOE, NOE, NOE, NOE, NOE], layers: 1 };
    }
    function safeKeep() {   // 씬을 불러와도 바꾸지 않을 것(Param Safe · Chan Safe) — 지금 값을 기억
      var sp = G('config.scenes.safe') || {}, P2 = sp.params || {}, C2 = sp.ch || {}, keep = [];
      Object.keys(C2).forEach(function (k) { if (C2[k]) { var p = k.replace('_', '.'); keep.push([p, clone(G(p))]); } });
      var strips = []; ['ch', 'aux', 'fxr', 'bus', 'mtx'].forEach(function (t) { (G(t) || []).forEach(function (o, i) { strips.push(t + '.' + i); }); }); strips.push('main.st', 'main.m');
      strips.forEach(function (p) { var o = G(p); if (!o) return; if (P2.preamp && o.preamp) keep.push([p + '.preamp.gain', o.preamp.gain], [p + '.preamp.phantom', o.preamp.phantom], [p + '.preamp.trim', o.preamp.trim]); if (P2.config) ['name', 'color', 'icon', 'source'].forEach(function (k) { if (o[k] != null) keep.push([p + '.' + k, o[k]]); }); if (P2.eq && o.eq) keep.push([p + '.eq', clone(o.eq)]); if (P2.dyn) { if (o.gate) keep.push([p + '.gate', clone(o.gate)]); if (o.dyn) keep.push([p + '.dyn', clone(o.dyn)]); } if (P2.sends && o.sends) keep.push([p + '.sends', clone(o.sends)]); if (P2.fader) { keep.push([p + '.fader', o.fader], [p + '.mute', o.mute]); if (o.main) keep.push([p + '.main', clone(o.main)]); } if (P2.dca) { if (o.dca) keep.push([p + '.dca', clone(o.dca)]); if (o.muteGrp) keep.push([p + '.muteGrp', clone(o.muteGrp)]); } });
      if (P2.routing) keep.push(['routing', clone(G('routing'))]); if (P2.fx) keep.push(['fx', clone(G('fx'))]); if (P2.dca) keep.push(['dca', clone(G('dca'))], ['muteGroups', clone(G('muteGroups'))]);
      return keep;
    }
    function sceneGo(k) {
      var sc = G('config.scenes') || {}, it = (sc.list || [])[k]; if (!it || !it.data) { msg('Empty scene'); return; }
      if (m.loadScene) m.loadScene(k); else { var keep = safeKeep(); m.restore(it.data); SET('config.scenes.current', k); applyKeep(keep); }   // m.loadScene 은 아래에서 Safe 를 지키게 감쌌어요
      ui.sceneHi = k; touch();
    }
    function applyKeep(keep) {
      if (!keep.length) return;
      m.batch(function () { keep.forEach(function (kv2) { (function walk(p, v) { if (v !== null && typeof v === 'object' && !(Array.isArray(v) && (!v.length || typeof v[0] !== 'object') && !/\.(dca|muteGrp|bands)$/.test(p))) { if (Array.isArray(v) && typeof v[0] !== 'object') { v.forEach(function (x, i) { m.set(p + '.' + i, x, { from: 'screen', scene: true }); }); return; } Object.keys(v).forEach(function (k) { walk(p + '.' + k, v[k]); }); return; } m.set(p, v, { from: 'screen', scene: true }); })(kv2[0], kv2[1]); }); });
    }
    // 씬 불러오기(표면의 GO 단추든 화면이든) 때 Param Safe · Chan Safe 를 지키도록 이 콘솔의 loadScene 을 감싸요(모델 파일은 그대로)
    var origLoad = m.loadScene;
    if (typeof origLoad === 'function' && !origLoad._x32s) { m.loadScene = function () { var keep = safeKeep(), r = origLoad.apply(m, arguments); if (r !== false) applyKeep(keep); return r; }; m.loadScene._x32s = true; m.loadScene._orig = origLoad; }
    function sceneSave(k) { var sc = G('config.scenes') || {}, it = (sc.list || [])[k]; openText(it && it.name || ('Scene ' + pad2(k)), function (txt) { if (m.saveScene) m.saveScene(k, txt); else SET('config.scenes.list.' + k, { name: txt, data: m.snapshot() }); SET('config.scenes.current', k); }); }
    function sceneRename(k) { var it = (Gd('config.scenes.list', []))[k]; if (!it || !it.data) return; openText(it.name || '', function (txt) { SET('config.scenes.list.' + k + '.name', txt); }); }
    function sceneDel(k) { var it = (Gd('config.scenes.list', []))[k]; if (!it) return; SET('config.scenes.list.' + k, { name: '', data: null }); }
    function sceneCopy(k) { var L = Gd('config.scenes.list', []), it = L[k]; if (!it || !it.data) return; SET('config.scenes.list.' + (k + 1), { name: it.name + ' copy', data: clone(it.data) }); ui.sceneHi = k + 1; }

    /* ================================================================ MONITOR · TALKBACK */
    function monitorBuild(ctx) {
      var id = tabId('monitor'), b = '', mon = G('config.monitor') || {}, so = G('config.solo') || {}, tb = G('config.talkback') || {}, enc, anySolo = m.anySolo ? m.anySolo() : false;
      if (id === 'monitor') {
        b += bx(6, 6, 300, 320, 'Monitor', kv('MONITOR LEVEL', fDb(mon.level, 1)) + kv('PHONES LEVEL', fDb(mon.phones, 1)) + kv('SOURCE', esc(mon.source || 'Main LR')) + kv('MONO', mon.mono ? 'ON' : 'OFF') + kv('DIM', mon.dim ? 'ON (' + (mon.dimAtt == null ? -20 : mon.dimAtt) + ' dB)' : 'OFF') + kv('SOLO MODE', esc(so.mode || 'PFL')) + kv('DIM ON SOLO', so.dimSolo ? 'ON' : 'OFF') + kv('SOLO ACTIVE', anySolo ? '<span style="color:#ffd23a">YES</span>' : 'no') +
          '<div style="display:flex;gap:6px;padding:10px">' + led(mon.mono, 'MONO', 'y', ctx.A(pTog('config.monitor.mono'))) + led(mon.dim, 'DIM', 'y', ctx.A(pTog('config.monitor.dim'))) + led(anySolo, 'SOLO', 'y') + '</div>');
        b += bx(312, 6, 220, 320, 'Source', ''); b += listHtml(MON_SRC, MON_SRC.indexOf(mon.source || 'Main LR'), MON_SRC.indexOf(mon.source || 'Main LR'), 318, 32, 208, MON_SRC.length, ctx, function (j) { SET('config.monitor.source', MON_SRC[j]); });
        b += bx(538, 6, 256, 320, 'Meters', '<div class="dim" style="position:absolute;left:24px;top:30px;font-size:11px">MON L R</div>' + mv('mon:l', 24, 48, 22, 250) + mv('mon:r', 52, 48, 22, 250) + '<div class="dim" style="position:absolute;left:110px;top:30px;font-size:11px">SOLO L R</div>' + mv('solo:l', 110, 48, 22, 250) + mv('solo:r', 138, 48, 22, 250));
        enc = [E('Monitor', fDb(mon.level, 1), tFader('config.monitor.level'), null, { f: db2f(mon.level) }), E('Phones', fDb(mon.phones, 1), tFader('config.monitor.phones'), null, { f: db2f(mon.phones) }), E('Source', mon.source || 'Main LR', tList('config.monitor.source', MON_SRC), null),
          E('Mono', mon.mono ? 'ON' : 'OFF', null, pTog('config.monitor.mono'), { pl: 'MONO', on: mon.mono }), E('Dim', (mon.dimAtt == null ? -20 : mon.dimAtt) + ' dB', tNum('config.monitor.dimAtt', -40, 0, 1, -20), pTog('config.monitor.dim'), { pl: 'DIM', on: mon.dim }), E('Solo Mode', so.mode || 'PFL', tList('config.solo.mode', ['PFL', 'AFL']), pTog('config.solo.dimSolo'), { pl: 'DIM S', on: so.dimSolo })];
        return { body: b, enc: enc, layers: 1 };
      }
      if (id === 'talka' || id === 'talkb') {
        var ab = id === 'talka' ? 'a' : 'b', dk = 'config.talkback.dest' + ab.toUpperCase(), dv = G(dk) || 'Off', on = !!tb[ab];
        b += bx(6, 6, 300, 320, 'Talkback ' + ab.toUpperCase() + ' ' + led(on, on ? 'TALK' : 'OFF', 'y', ctx.A(pTog('config.talkback.' + ab))), kv('LEVEL', fDb(tb.level, 1)) + kv('DESTINATION', esc(dv)) + kv('LATCH', tb.latch ? 'ON' : 'OFF') + kv('MIC', esc(Gd('config.setup.tbSrc', 'Internal'))) + '<div style="padding:10px"><span class="btn' + (on ? ' on' : '') + '" style="width:100%;padding:16px 0;font-size:16px" ' + ctx.A(pTog('config.talkback.' + ab)) + '>TALK ' + ab.toUpperCase() + '</span></div>');
        b += bx(312, 6, 482, 320, 'Destination', ''); b += listHtml(TB_DEST, TB_DEST.indexOf(dv), ui.tbHi == null ? TB_DEST.indexOf(dv) : ui.tbHi, 318, 32, 470, TB_DEST.length, ctx, function (j) { ui.tbHi = j; SET(dk, TB_DEST[j]); });
        enc = [E('Talk Level', fDb(tb.level, 1), tFader('config.talkback.level'), null, { f: db2f(tb.level) }), E('Destination', dv, function (d) { SET(dk, stepList(TB_DEST, dv, d)); ui.tbHi = null; }, null), E('Latch', tb.latch ? 'ON' : 'OFF', null, pTog('config.talkback.latch'), { pl: 'LATCH', on: tb.latch }), NOE, NOE, E('Talk ' + ab.toUpperCase(), on ? 'ON' : 'OFF', null, pTog('config.talkback.' + ab), { pl: 'TALK', on: on })];
        return { body: b, enc: enc, layers: 1 };
      }
      var osc = G('config.osc') || {}, oon = !!osc.on, typ = osc.type || 'SINE', fq = osc.freq || 1000, lv = osc.level == null ? -20 : osc.level, ds = osc.dest || 'MixBus 01';
      var ODEST = ['Main LR', 'M/C'].concat(range(16).map(function (i) { return 'MixBus ' + pad2(i + 1); }));
      b += bx(6, 6, 788, 320, 'Oscillator ' + led(oon, oon ? 'ON' : 'OFF', 'r', ctx.A(pTog('config.osc.on'))), kv('TYPE', typ) + kv('FREQUENCY', fHz(fq)) + kv('LEVEL', fDb(lv, 1)) + kv('DESTINATION', esc(ds)) + '<div style="display:flex;gap:6px;padding:10px">' + ['SINE', 'PINK', 'WHITE'].map(function (t) { return '<span class="btn' + (typ === t ? ' on' : '') + '" style="flex:1;padding:10px 0" ' + ctx.A(function () { SET('config.osc.type', t); }) + '>' + t + '</span>'; }).join('') + '</div>');
      enc = [E('Type', typ, tList('config.osc.type', ['SINE', 'PINK', 'WHITE']), null), E('Frequency', fHz(fq), tLog('config.osc.freq', 20, 20000, 200, 1000), null, { f: frLog(fq, 20, 20000) }), E('Level', fDb(lv, 1), tNum('config.osc.level', -60, 0, 1, -20), null, { f: frLin(lv, -60, 0) }), E('Destination', ds, tList('config.osc.dest', ODEST), null), NOE, E('Osc', oon ? 'ON' : 'OFF', null, pTog('config.osc.on'), { pl: 'ON', on: oon, pc: 'cr' })];
      return { body: b, enc: enc, layers: 1 };
    }

    /* ================================================================ ASSIGN · USB */
    function assignBuild(ctx) {
      var id = tabId('assign'), cur = Gd('config.assign.set', 'A'), setK = id === 'home' ? cur : id.slice(3).toUpperCase(), st = G('config.assign.sets.' + setK) || {}, b = '';
      b += bx(6, 6, 388, 320, 'Set ' + setK + ' — Knobs 1-4' + (setK === cur ? ' (active)' : ''), (st.knobs || []).map(function (k2, i) { return kv('KNOB ' + (i + 1), esc(k2.label || '—')); }).join('').replace(/class="kv"/g, 'class="kv" style="padding:10px 12px;font-size:14px"'));
      b += bx(400, 6, 394, 320, 'Set ' + setK + ' — Buttons 5-12', (st.buttons || []).map(function (k2, i) { return kv('BUTTON ' + (i + 5), esc(k2.label || '—')); }).join('').replace(/class="kv"/g, 'class="kv" style="padding:6px 12px;font-size:13px"'));
      return { body: b, enc: [E('Active Set', cur, tList('config.assign.set', ['A', 'B', 'C']), null), NOE, NOE, NOE, NOE, NOE], layers: 1 };
    }
    function recorderBuild(ctx) {
      var u = G('config.usb') || {}, b = bx(6, 6, 788, 320, 'USB Recorder', kv('STATE', u.recording ? '<span style="color:#ff4d4d">REC</span>' : u.playing ? '<span style="color:#3ddc84">PLAY</span>' : 'STOP') + kv('FILE', esc(u.file || '—')) + kv('REC SOURCE', esc((Gd('routing.output.usbRec.l', 'Main L')) + ' / ' + Gd('routing.output.usbRec.r', 'Main R'))) +
        '<div style="display:flex;gap:8px;padding:14px">' + [['STOP', function () { m.batch(function () { SET('config.usb.recording', false); SET('config.usb.playing', false); }); }], ['PLAY', function () { SET('config.usb.playing', true); }], ['REC', function () { SET('config.usb.recording', true); }]].map(function (x) { return '<span class="btn" style="flex:1;padding:14px 0" ' + ctx.A(x[1]) + '>' + x[0] + '</span>'; }).join('') + '</div>');
      return { body: b, enc: [E('Stop', '', null, function () { m.batch(function () { SET('config.usb.recording', false); SET('config.usb.playing', false); }); }, { pl: 'STOP' }), E('Play', '', null, function () { SET('config.usb.playing', !u.playing); }, { pl: 'PLAY', on: u.playing, pc: 'cg' }), E('Record', '', null, function () { SET('config.usb.recording', !u.recording); }, { pl: 'REC', on: u.recording, pc: 'cr' }), NOE, NOE, NOE], layers: 1 };
    }

    /* ================================================================ UTILITY (지금 페이지에 맞는 기능) */
    var DEF_EQ = function (nb) { return nb === 6 ? [{ type: 'LCut', freq: 80, gain: 0, q: 0.7 }, { type: 'PEQ', freq: 200, gain: 0, q: 2 }, { type: 'PEQ', freq: 600, gain: 0, q: 2 }, { type: 'PEQ', freq: 2000, gain: 0, q: 2 }, { type: 'PEQ', freq: 5000, gain: 0, q: 2 }, { type: 'HShv', freq: 12000, gain: 0, q: 2 }] : [{ type: 'PEQ', freq: 124.7, gain: 0, q: 2 }, { type: 'PEQ', freq: 496.6, gain: 0, q: 2 }, { type: 'PEQ', freq: 1970, gain: 0, q: 2 }, { type: 'HShv', freq: 10020, gain: 0, q: 2 }]; };
    function utilFns() {
      var from = ui.utilFrom || { page: 'home', tab: 'home' }, s = sel(), pre = s.pre, o = s.o, fns = [];
      function cp(kind, data, label) { ui.clip = { kind: kind, data: clone(data), from: s.id }; msg('Copied ' + label + ' (' + s.id + ')'); }
      function ps(kind, fn) { if (!ui.clip || ui.clip.kind !== kind) { msg('Clipboard is empty'); return; } fn(ui.clip.data); msg('Pasted ' + kind + ' → ' + s.id); }
      if (from.page === 'home') {
        var tid = from.tab;
        if (tid === 'eq' && o.eq) fns = [['Copy EQ', function () { cp('eq', o.eq, 'EQ'); }], ['Paste EQ', function () { ps('eq', function (d) { m.batch(function () { SET(pre + '.eq.on', d.on !== false); (d.bands || []).slice(0, (o.eq.bands || []).length).forEach(function (bd, k) { setDeep(pre + '.eq.bands.' + k, bd); }); }); }); }], ['Reset EQ', function () { m.batch(function () { DEF_EQ((o.eq.bands || []).length).forEach(function (bd, k) { setDeep(pre + '.eq.bands.' + k, bd); }); }); msg('EQ reset'); }], ['Flat (0 dB)', function () { m.batch(function () { (o.eq.bands || []).forEach(function (bd, k) { SET(pre + '.eq.bands.' + k + '.gain', 0); }); }); }], ['EQ Library', function () { goLib('channel'); }]];
        else if ((tid === 'gate' || tid === 'dyn') && o[tid]) fns = [['Copy ' + (tid === 'gate' ? 'Gate' : 'Dyn'), function () { cp(tid, o[tid], tid); }], ['Paste ' + (tid === 'gate' ? 'Gate' : 'Dyn'), function () { ps(tid, function (d) { if (G(pre + '.' + tid)) setDeep(pre + '.' + tid, d); }); }], ['Reset', function () { setDeep(pre + '.' + tid, tid === 'gate' ? { on: false, mode: 'GATE', thr: -80, range: 60, attack: 0.5, hold: 50, release: 200 } : { on: false, mode: 'COMP', thr: 0, ratio: 3, knee: 2, attack: 10, hold: 10, release: 100, gain: 0, auto: false }); msg('Reset'); }], ['Library', function () { goLib('channel'); }]];
        else if (tid === 'sends' && (o.sends || o.mtxSends)) fns = [['Copy Sends', function () { cp('sends', o.sends || o.mtxSends, 'sends'); }], ['Paste Sends', function () { ps('sends', function (d) { if (o.sends) setDeep(pre + '.sends', d); }); }], ['All Sends -oo', function () { m.batch(function () { (o.sends || o.mtxSends).forEach(function (x, k) { SET(pre + (o.sends ? '.sends.' : '.mtxSends.') + k + '.level', OFF); }); }); }], ['All Sends 0 dB', function () { m.batch(function () { (o.sends || o.mtxSends).forEach(function (x, k) { SET(pre + (o.sends ? '.sends.' : '.mtxSends.') + k + '.level', 0); }); }); }]];
        else fns = [['Name / Icon / Color', function () { openName(s.t, s.i); }], ['Copy Channel', function () { cp('channel', o, 'channel'); }], ['Paste Channel', function () { ps('channel', function (d) { var dd = clone(d); delete dd.name; delete dd.color; delete dd.icon; delete dd.source; delete dd.solo; ['gate', 'dyn', 'eq', 'sends', 'mtxSends', 'insert', 'preamp', 'main'].forEach(function (k) { if (!G(pre + '.' + k)) delete dd[k]; }); if (dd.eq && dd.eq.bands && o.eq && dd.eq.bands.length !== (o.eq.bands || []).length) delete dd.eq; setDeep(pre, dd); }); }], ['Reset Channel', function () { resetCh(pre, o); msg('Channel reset'); }], ['Load Preset', function () { goLib('channel'); }], ['Save Preset', function () { goLib('channel'); libAct('Save', 'channel'); }]];
      } else if (from.page === 'effects') { var k = ui.fxSel; fns = [['Copy FX ' + (k + 1), function () { ui.clip = { kind: 'fx', data: clone(G('fx.' + k)) }; msg('Copied FX ' + (k + 1)); }], ['Paste FX ' + (k + 1), function () { if (!ui.clip || ui.clip.kind !== 'fx') { msg('Clipboard is empty'); return; } m.batch(function () { SET('fx.' + k + '.type', ui.clip.data.type); SET('fx.' + k + '.params', clone(ui.clip.data.params)); }); msg('Pasted → FX ' + (k + 1)); }], ['Default Params', function () { setFxType(k, G('fx.' + k + '.type')); var np = {}; fxDefs(G('fx.' + k + '.type')).forEach(function (p2) { np[p2.k] = p2.d; }); if (!isGeq(G('fx.' + k + '.type'))) SET('fx.' + k + '.params', np); msg('Defaults'); }], ['FX Library', function () { ui.libFx = k; goLib('effects'); }]]; }
      else if (from.page === 'routing') fns = [['Routing Library', function () { goLib('routing'); }], ['Default (Local)', function () { setDeep('routing.input', { blocks: ['Local 1-8', 'Local 9-16', 'Local 17-24', 'Local 25-32'], aux: auxBlocks()[0] }); msg('Inputs = Local 1-32'); }]];
      else if (from.page === 'scenes') { var hi = ui.sceneHi == null ? (Gd('config.scenes.current', 0) | 0) : ui.sceneHi; fns = [['Save Scene', function () { sceneSave(hi); }], ['Rename', function () { sceneRename(hi); }], ['Delete', function () { sceneDel(hi); }], ['Undo Load', function () { if (m.undoScene) m.undoScene(); }]]; }
      else if (from.page === 'setup' && from.tab === 'scribble') fns = [['Edit Name', function () { openName('ch', clamp(ui.chHi, 0, 31)); }]];
      else fns = [['Name / Icon / Color', function () { openName(s.t, s.i); }], ['Copy Channel', function () { cp('channel', o, 'channel'); }], ['Scenes', function () { setTab('scenes', 'home'); }]];
      return fns.slice(0, 6);
    }
    function resetCh(pre, o) { var d = {}; if (o.preamp) d.preamp = { gain: 0, trim: 0, phantom: false, invert: false, lowcut: { on: false, freq: 100 }, delay: { on: false, ms: 0.3 } }; if (o.gate) d.gate = { on: false, mode: 'GATE', thr: -80, range: 60, attack: 0.5, hold: 50, release: 200 }; if (o.dyn) d.dyn = { on: false, mode: 'COMP', thr: 0, ratio: 3, knee: 2, attack: 10, hold: 10, release: 100, gain: 0 }; if (o.eq) { d.eq = { on: true }; } if (o.insert) d.insert = { on: false }; d.fader = OFF; d.mute = false; setDeep(pre, d); if (o.eq) m.batch(function () { DEF_EQ((o.eq.bands || []).length).forEach(function (bd, k) { setDeep(pre + '.eq.bands.' + k, bd); }); }); if (o.sends) m.batch(function () { o.sends.forEach(function (x, k) { SET(pre + '.sends.' + k + '.level', OFF); }); }); }
    function goLib(tab) { closeUtil(); setTab('library', tab); }
    function closeUtil() { var f = ui.utilFrom; ui.utilFrom = null; if (f) setTab(f.page, f.tab); else setTab('home', 'home'); }
    function utilityBuild(ctx) {
      var from = ui.utilFrom || { page: 'home', tab: 'home' }, fns = utilFns(), s = sel(), b = '';
      b += bx(6, 6, 788, 320, 'UTILITY — ' + (PNAME[from.page] || '') + ' / ' + esc(from.tab) + ' · ' + esc(s.id + ' ' + s.name), '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:14px">' + fns.map(function (f, k) { return '<span class="btn" style="padding:22px 6px;font-size:15px;flex-direction:column;gap:4px" ' + ctx.A(f[1]) + '><small style="font-size:10px;color:#8a96a3">ENC ' + (k + 1) + '</small>' + esc(f[0]) + '</span>'; }).join('') + '</div>' +
        (ui.clip ? '<div style="position:absolute;left:14px;bottom:44px;font-size:12px" class="dim">Clipboard: ' + esc(ui.clip.kind) + (ui.clip.from ? ' from ' + esc(ui.clip.from) : '') + '</div>' : '') +
        (ui.msg && now() - ui.msgT < 2500 ? '<div style="position:absolute;left:14px;bottom:20px;color:#3ddc84;font-weight:700">' + esc(ui.msg) + '</div>' : '') +
        '<div style="position:absolute;right:14px;bottom:14px"><span class="btn" style="padding:8px 16px" ' + ctx.A(closeUtil) + '>EXIT UTILITY</span></div>');
      var enc = fns.map(function (f) { return E(f[0], '', null, f[1], { pl: 'GO' }); }); while (enc.length < 6) enc.push(NOE);
      return { body: b, enc: enc, layers: 1 };
    }

    /* ================================================================ 이름 · 키보드 창 */
    var CHARS = ' ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.,+&/#()!?:';
    var KROWS = ['1234567890', 'QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
    function openName(t, i) { var o = stripAt(t, i) || {}; modal = { kind: 'name', type: t, index: i, text: String(o.name || ''), cur: String(o.name || '').length, ch: 1, color: o.color | 0, icon: o.icon || 1, lower: false }; SET('screen.modal', { kind: 'name', type: t, index: i }); touch(); focusSoon(); }
    function openText(text, done) { modal = { kind: 'text', text: String(text || '').slice(0, 12), cur: String(text || '').slice(0, 12).length, ch: 1, after: done, lower: false }; touch(); focusSoon(); }
    function closeModal(ok) {
      var md = modal; modal = null;
      if (md && ok) { if (md.kind === 'name') { var pre = md.type === 'main' ? 'main.' + (md.index === 1 ? 'm' : 'st') : md.type + '.' + md.index; m.batch(function () { SET(pre + '.name', md.text.slice(0, 12)); if (G(pre + '.color') != null || md.type !== 'dca') SET(pre + '.color', md.color); if (md.type !== 'dca') SET(pre + '.icon', md.icon); }); } else if (md.after) md.after(md.text.slice(0, 12)); }
      if (md && md.kind === 'name') SET('screen.modal', null);
      views.forEach(function (v) { if (v.ti && document.activeElement === v.ti) v.ti.blur(); });
      touch();
    }
    function mIns(c) { if (!modal) return; var t = modal.text; if (t.length >= 12) return; modal.text = t.slice(0, modal.cur) + c + t.slice(modal.cur); modal.cur += c.length; touch(); }
    function mDel() { if (!modal || modal.cur <= 0) return; modal.text = modal.text.slice(0, modal.cur - 1) + modal.text.slice(modal.cur); modal.cur--; touch(); }
    var focusWanted = false;
    function focusSoon() { focusWanted = true; }
    function modalBuild(ctx) {
      var md = modal, b = '', isName = md.kind === 'name', c = col(md.color || 0), lab = isName ? (m.shortId ? m.shortId(md.type, md.index) : '') : 'NAME';
      b += '<div class="nf"><div style="flex:0 0 auto;display:flex;align-items:center;gap:6px;padding:4px 8px;border-radius:4px;' + (isName ? 'background:' + c.bg + ';color:' + c.fg : 'background:#222;color:#ccc') + '">' + (isName ? icon(md.icon, 26) : '') + '<b style="font-size:12px">' + esc(lab) + '</b></div><div class="tx">' + esc(md.text.slice(0, md.cur)) + '<u></u>' + esc(md.text.slice(md.cur)) + '</div><div class="dim" style="margin-left:auto;font-size:11px">' + md.text.length + '/12</div></div>';
      b += '<input class="ti" type="text" maxlength="12" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="이름 입력 (키보드로 써도 돼요)">';
      var pend = CHARS.charAt(md.ch);
      b += '<div class="kb">' + KROWS.map(function (r) { return '<div>' + r.split('').map(function (ch) { var ch2 = md.lower ? ch.toLowerCase() : ch; return '<span class="' + (ch2 === pend ? 'hi' : '') + '" ' + ctx.A(function () { mIns(ch2); }) + '>' + esc(ch2) + '</span>'; }).join('') + '</div>'; }).join('') +
        '<div><span class="w" ' + ctx.A(function () { md.lower = !md.lower; touch(); }) + '>' + (md.lower ? 'ABC' : 'abc') + '</span><span class="ww" ' + ctx.A(function () { mIns(' '); }) + '>SPACE</span><span ' + ctx.A(function () { mIns('-'); }) + '>-</span><span ' + ctx.A(function () { md.cur = Math.max(0, md.cur - 1); touch(); }) + '>◀</span><span ' + ctx.A(function () { md.cur = Math.min(md.text.length, md.cur + 1); touch(); }) + '>▶</span><span class="w" ' + ctx.A(mDel) + '>⌫ DEL</span></div></div>';
      if (isName) {
        b += '<div class="sw"><div class="dim" style="font-size:11px;margin-bottom:4px">COLOR</div>' + colors().map(function (cc, k) { return '<i class="' + (k === md.color ? 'on' : '') + '" style="background:' + cc.bg + ';color:' + cc.fg + '" ' + ctx.A(function () { md.color = k; touch(); }) + '>' + cc.id + '</i>'; }).join('') +
          '<div class="dim" style="font-size:11px;margin:6px 0 4px">ICON</div><div style="display:flex;align-items:center;gap:6px"><span class="btn" ' + ctx.A(function () { md.icon = clamp(md.icon - 1, 1, 74); touch(); }) + '>◀</span><div style="flex:1;display:flex;align-items:center;gap:6px;padding:4px;border-radius:4px;background:#000">' + icon(md.icon, 30, '#e6ebf0') + '<span style="font-size:11px">' + esc(ICONS[md.icon - 1]) + '</span></div><span class="btn" ' + ctx.A(function () { md.icon = clamp(md.icon + 1, 1, 74); touch(); }) + '>▶</span></div></div>';
      }
      b += '<div style="position:absolute;left:566px;bottom:10px;width:224px;display:flex;gap:6px"><span class="btn" style="flex:1;padding:10px 0" ' + ctx.A(function () { closeModal(false); }) + '>CANCEL</span><span class="btn g on" style="flex:1;padding:10px 0" ' + ctx.A(function () { closeModal(true); }) + '>OK</span></div>';
      var enc = [E('Cursor', String(md.cur), function (d) { md.cur = clamp(md.cur + d, 0, md.text.length); touch(); }, null),
        E('Character', pend === ' ' ? 'SPACE' : pend, function (d) { md.ch = (md.ch + d + CHARS.length) % CHARS.length; touch(); }, function () { mIns(CHARS.charAt(md.ch)); }, { pl: 'INS' }),
        E('Delete', '', null, mDel, { pl: 'DEL', pc: 'cr' }),
        isName ? E('Icon', ICONS[md.icon - 1], function (d) { md.icon = clamp(md.icon + d, 1, 74); touch(); }, null) : NOE,
        isName ? E('Color', col(md.color).id, function (d) { md.color = clamp(md.color + d, 0, 15); touch(); }, null) : NOE,
        E('Done', '', null, function () { closeModal(true); }, { pl: 'OK', pc: 'cg' })];
      return { body: b, enc: enc, layers: 1, modal: true };
    }

    var PAGEDEF = { home: homeBuild, meters: metersBuild, routing: routingBuild, setup: setupBuild, library: libraryBuild, effects: effectsBuild, mutegrp: mutegrpBuild, scenes: scenesBuild, monitor: monitorBuild, assign: assignBuild, recorder: recorderBuild, utility: utilityBuild };

    /* ================================================================ 그리기 */
    function mkCtx(v) { var acts = [], drags = []; return { acts: acts, drags: drags, A: function (fn) { acts.push(fn); return 'data-a="' + (acts.length - 1) + '"'; }, D: function (o) { drags.push(o); return 'data-d="' + (drags.length - 1) + '"'; } }; }
    var DUMMY = { A: function () { return ''; }, D: function () { return ''; } };
    function build(ctx) {
      var p = page();
      if (modal) return modalBuild(ctx);
      if (p === 'utility') { if (!ui.utilFrom) ui.utilFrom = { page: ui.lastPage === 'utility' ? 'home' : ui.lastPage, tab: ui.lastTab || 'home' }; return utilityBuild(ctx); }
      if (G('screen.modal') && G('screen.modal').kind === 'name' && !modal) { var sm = G('screen.modal'); openName(sm.type || sel().t, sm.index == null ? sel().i : sm.index); return modalBuild(ctx); }
      return PAGEDEF[p](ctx);
    }
    function header() {
      var s = sel(), c = col(s.o.color), sc = G('config.scenes') || {}, cur = sc.current | 0, it = (sc.list || [])[cur] || {}, A = G('routing.aes50') || {}, d = new Date(), sof = G('config.sendsOnFader');
      var hh = Gd('config.setup.clock', '24h') === '12h' ? ((d.getHours() + 11) % 12 + 1) : d.getHours();
      return '<div class="cb" style="background:' + c.bg + ';color:' + c.fg + '">' + icon(s.o.icon, 24) + '<span class="id">' + esc(s.id) + '</span><span class="nm">' + esc(s.name) + '</span></div>' +
        '<div class="sc">' + (sof ? '<i>SENDS ON FADER' + (G('config.sofTarget') ? ' → ' + esc(sofName()) : '') + '</i> ' : '') + '<span class="dim">Scene</span> <b>' + pad2(cur) + '</b> ' + esc(it.name || '') + (sc.dirty ? ' <i>*</i>' : '') + '</div>' +
        '<div class="in"><span class="' + (A.a && A.a.connected ? 'on' : '') + '">A</span><span class="' + (A.b && A.b.connected ? 'on' : '') + '">B</span><span class="' + (G('routing.card.connected') ? 'on' : '') + '">CARD</span>' + (m.anySolo && m.anySolo() ? '<span class="on" style="background:#ffd23a;border-color:#ffd23a;color:#1a1400">SOLO</span>' : '') + '<span class="tm">' + pad2(hh) + ':' + pad2(d.getMinutes()) + '</span></div>';
    }
    function sofName() { var t = G('config.sofTarget'); if (!t) return ''; if (typeof t === 'object') return m.shortId ? m.shortId(t.type, t.index) + ' ' + m.label(t.type, t.index) : ''; return 'BUS ' + pad2((t | 0) + 1) + (m.label ? ' ' + m.label('bus', t | 0) : ''); }
    function tabsHtml(P2, ctx) {
      var p = page();
      if (modal) return '<div class="pg">' + (modal.kind === 'name' ? 'NAME / ICON / COLOR' : 'TEXT ENTRY') + '</div><div class="t on">keyboard</div><div class="ly">ENC 6 = OK</div>';
      if (p === 'utility') return '<div class="pg">UTILITY</div><div class="t on">' + esc(PNAME[(ui.utilFrom || {}).page] || '') + '</div>';
      var tabs = tabsOf(p), id = tabId(p), L = P2.layers > 1 ? layer(P2.layers) : 0;
      return '<div class="pg">' + PNAME[p] + '</div>' + tabs.map(function (t) { return '<div class="t' + (t[0] === id ? ' on' : '') + '" ' + ctx.A(function () { setTab(p, t[0]); }) + '>' + esc(t[1]) + '</div>'; }).join('') + (P2.layers > 1 ? '<div class="ly">LAYER ' + (L + 1) + '/' + P2.layers + ' ▲▼</div>' : '');
    }
    function encHtml(enc, ctx) {
      return enc.map(function (e, k) { e = e || NOE; var fl = ui.flash === k && now() - ui.flashT < 500; return '<div class="e' + (e.x || (!e.t && !e.p) ? ' x' : '') + (fl ? ' fl' : '') + '" data-enc="' + k + '"><div class="l">' + esc(e.l) + '</div><div class="v">' + esc(e.v) + '</div>' + (e.pl ? '<span class="p ' + (e.pc || '') + (e.on ? ' on' : '') + '">' + esc(e.pl) + '</span>' : '') + (e.f != null ? '<div class="r"><b style="width:' + Math.round(clamp(e.f, 0, 1) * 100) + '%"></b></div>' : '') + '</div>'; }).join('');
    }
    function renderAll() {   // 한 번 만들어 모든 화면(작은 것 · 큰 것)에 똑같이 씀
      var ctx = mkCtx(), P2;
      try { P2 = build(ctx); } catch (err) { if (window.console) console.error('X32Screen', err); P2 = { body: '<div style="padding:20px;color:#f87171">screen error</div>', enc: [], layers: 1 }; }
      var R = { P2: P2, ctx: ctx, hd: header(), tb: tabsHtml(P2, ctx), en: encHtml(P2.enc, ctx) };
      views.forEach(function (v) { renderView(v, R); });
    }
    function renderView(v, R) {
      var P2 = R.P2, ctx = R.ctx;
      v.enc = P2.enc; v.layers = P2.layers || 1;
      v.hd.innerHTML = R.hd;
      v.tb.innerHTML = R.tb;
      if (modal) { v.md.innerHTML = P2.body; v.md.classList.add('on'); v.bd.style.visibility = 'hidden'; v.ti = v.md.querySelector('input.ti'); if (v.ti) { v.ti.value = modal.text; bindTi(v); } }
      else { v.md.classList.remove('on'); v.md.innerHTML = ''; v.ti = null; v.bd.style.visibility = ''; v.bd.innerHTML = P2.body; }
      v.en.innerHTML = R.en;
      v.acts = ctx.acts; v.drags = ctx.drags;
      v.mEls = v.scr.querySelectorAll('[data-mt]'); v.dots = v.scr.querySelectorAll('[data-dot]'); v.mvs = v.scr.querySelectorAll('[data-mv]'); v.gls = v.scr.querySelectorAll('[data-gl]'); v.gss = v.scr.querySelectorAll('[data-gs]');
      var br = +Gd('config.lcd.brightness', 50); v.scr.style.filter = br === 50 ? '' : 'brightness(' + (0.55 + br / 100 * 0.9).toFixed(2) + ')';
      // 작은 화면 글자
      var p = page(), s = sel(), e = ui.flash >= 0 && now() - ui.flashT < 1800 ? (P2.enc[ui.flash] || null) : null;
      v.cap.innerHTML = e && e.l ? '<b>' + esc(e.l) + '</b> ' + esc(e.v || (e.on ? 'ON' : '')) : (modal ? '<b>NAME</b> ' + esc(modal.text) + '_' : '<b>' + (PNAME[p] || '') + '</b> › ' + esc(p === 'utility' ? 'utility' : (tabsOf(p).filter(function (t) { return t[0] === tabId(p); })[0] || ['', ''])[1]) + ' · ' + esc(s.id + ' ' + s.name));
      if (v.help) v.help.textContent = helpText();
      if (v.pgBtns) v.pgBtns.forEach(function (bt) { bt.classList.toggle('on', bt.getAttribute('data-pg') === p); });
      if (focusWanted && modal && v.ti) { var vv = big ? big.view : views[0]; if (vv === v) { focusWanted = false; if (!window.matchMedia || window.matchMedia('(pointer:fine)').matches || big) { try { v.ti.focus({ preventScroll: true }); v.ti.setSelectionRange(modal.cur, modal.cur); } catch (x) { /* noop */ } } } }
    }
    function bindTi(v) {
      var ti = v.ti; if (!ti || ti._b) return; ti._b = 1;
      ti.addEventListener('input', function () { if (!modal) return; modal.text = ti.value.slice(0, 12); modal.cur = clamp(ti.selectionStart == null ? modal.text.length : ti.selectionStart, 0, modal.text.length); views.forEach(function (w) { if (w !== v) w.needs = true; }); paintModalText(); });
      ti.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); closeModal(true); } else if (e.key === 'Escape') { e.preventDefault(); closeModal(false); } else setTimeout(function () { if (modal && ti.selectionStart != null) { modal.cur = ti.selectionStart; paintModalText(); } }, 0); });
      ti.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    }
    function paintModalText() { views.forEach(function (w) { var tx = w.md.querySelector('.tx'); if (tx && modal) tx.innerHTML = esc(modal.text.slice(0, modal.cur)) + '<u></u>' + esc(modal.text.slice(modal.cur)); if (w.ti && w.ti !== document.activeElement && modal) w.ti.value = modal.text; }); }
    function helpText() {
      var p = page(), id = p === 'utility' ? '' : tabId(p);
      if (modal) return '이름 칸을 누르고 컴퓨터(휴대폰) 키보드로 써도 돼요. 한글도 돼요. 화면 글자판을 눌러도 되고, 엔코더 2를 돌려 글자를 고르고 눌러 넣어도 돼요. 다 쓰면 OK(엔코더 6).';
      var H2 = {
        home: { home: '고른 채널의 소리 길을 한눈에 봐요: 입력 → 게이트 → EQ → 컴프 → 센드 → 메인. LAYER ▲▼ 로 엔코더 기능이 바뀌어요.', config: '이름 · 색 · 아이콘 · 소스(어느 입력을 받을지) · 로우컷 · 딜레이를 정해요. 이름 칸을 누르면 글자판이 나와요.', gate: '작은 소리를 막는 게이트예요. 주황 선(THRESHOLD)보다 작은 소리는 줄어요. 그림을 좌우로 끌어도 돼요.', dyn: '큰 소리를 눌러 주는 컴프레서예요. 주황 선을 넘는 만큼 GR 미터가 움직여요.', eq: '소리 높낮이별 크기를 바꿔요. 색 점을 끌면 바로 바뀌어요. LAYER ▲▼ 로 GAIN · FREQ · Q · MODE 를 바꿔 돌려요.', sends: '이 채널을 믹스 버스(모니터 등)로 얼마나 보낼지 정해요. 엔코더 6으로 4개씩 옮겨요.', main: '메인 스피커로 보내기(LR) · 좌우(PAN) · 페이더 · DCA · 뮤트 그룹을 정해요.' },
        meters: '모든 채널 · 버스 · 메인의 소리 크기를 한꺼번에 봐요.', routing: '어느 입력(무대 · 스테이지박스 · USB)이 어느 채널로 들어갈지, 소리가 어디로 나갈지 정해요. 엔코더를 돌려 고르고 눌러서 연결해요. 잘못 바꾸면 소리가 안 들어와요.',
        setup: '화면 밝기 · 채널 묶기(링크) · 이름표 · 프리앰프 같은 콘솔 기본 설정이에요.', library: '채널 하나 · 이펙트 하나 · 라우팅 설정을 따로 저장하고 불러와요.', effects: '안에 든 이펙터 8대를 봐요. 칸을 한 번 더 누르면(엔코더 1 누르기) 편집 화면이 나와요.', mutegrp: '여러 채널을 한 번에 끄는 뮤트 그룹이에요.', scenes: '콘솔 전체 설정(씬)을 저장하고 불러와요. 목록에서 고르고 GO.', monitor: '헤드폰 · 모니터로 무엇을 들을지, 토크백(말하기)을 정해요.', assign: 'ASSIGN 노브 · 단추에 무엇이 붙어 있는지 봐요.', recorder: 'USB 녹음 · 재생 화면이에요.', utility: '지금 화면에서 쓰는 도움 기능(복사 · 붙여넣기 · 이름 · 되돌리기)이에요.' };
      var h = H2[p]; return typeof h === 'object' ? (h[id] || '') : (h || '');
    }

    /* ---------- 미터 움직임 */
    var hold = {}, inMap = null;
    function mval(key) {
      var mt = m.meters || {}, s = sel(), a = key.split(':'), k = a[0], i = +a[1];
      if (k === 'sel') return meterOf(s.t, s.i);
      if (k === 'selgr') return s.t === 'ch' ? (mt.gr && mt.gr.ch ? mt.gr.ch[s.i] : 0) : s.t === 'bus' ? (mt.gr && mt.gr.bus ? mt.gr.bus[s.i] : 0) : 0;
      if (k === 'selgt') return s.t === 'ch' && mt.gate && mt.gate.ch ? mt.gate.ch[s.i] : 0;
      if (k === 'ch' || k === 'aux' || k === 'fxr' || k === 'bus' || k === 'mtx') return mt[k] ? mt[k][i] : NINF;
      if (k === 'main') return mt.main ? mt.main[a[1]] : NINF;
      if (k === 'mon' || k === 'solo') return mt[k] ? mt[k][a[1]] : NINF;
      if (k === 'gr') return mt.gr && mt.gr.ch ? mt.gr.ch[i] : 0;
      if (k === 'gt') return mt.gate && mt.gate.ch ? mt.gate.ch[i] : 0;
      if (k === 'rta') return mt.rta ? mt.rta[i] : NINF;
      if (k === 'send') { var o = s.o, sn = (o.sends || o.mtxSends || [])[i]; if (!sn || sn.on === false || isOff(sn.level)) return NINF; var base = meterOf(s.t, s.i); return base + sn.level + (/PRE|IN/.test(sn.tap || '') ? -(isOff(o.fader) ? -60 : o.fader) : 0); }
      if (k === 'in') { if (!inMap) { inMap = {}; for (var c = 0; c < 32; c++) if (m.inputSource) { var is = m.inputSource(c); if (is.kind === 'Local' && inMap[is.n - 1] == null) inMap[is.n - 1] = c; } } return inMap[i] != null && mt.ch ? mt.ch[inMap[i]] : NINF; }
      if (k === 'out' || k === 'aout') { var v = G('routing.output.' + (k === 'out' ? 'local' : 'aux') + '.' + i); return srcMeter(v && typeof v === 'object' ? v.src : v); }
      return NINF;
    }
    function srcMeter(src) { var mt = m.meters || {}, x; src = String(src || ''); if (src === 'Main L') return mt.main && mt.main.l; if (src === 'Main R') return mt.main && mt.main.r; if (src === 'M/C') return mt.main && mt.main.m; if ((x = src.match(/^MixBus (\d+)/))) return mt.bus && mt.bus[+x[1] - 1]; if ((x = src.match(/^Matrix (\d+)/))) return mt.mtx && mt.mtx[+x[1] - 1]; if ((x = src.match(/^Ch (\d+)/))) return mt.ch && mt.ch[+x[1] - 1]; if (src === 'Monitor L') return mt.mon && mt.mon.l; if (src === 'Monitor R') return mt.mon && mt.mon.r; return NINF; }
    function paintMeters(v) {
      inMap = null;
      if (v.mEls) for (var i = 0; i < v.mEls.length; i++) {
        var e = v.mEls[i], key = e.getAttribute('data-mt'), raw = mval(key), isGr = /^(selgr|selgt|gr|gt)/.test(key), f;
        if (isGr) f = clamp(Math.abs(+raw || 0) / 24, 0, 1); else f = mfrac(raw);
        var hk = v.id + key, pv = hold[hk] || 0; f = f >= pv ? f : Math.max(f, pv - 0.035); hold[hk] = f;
        e.style.setProperty('--v', f.toFixed(3));
      }
      if (v.dots) for (i = 0; i < v.dots.length; i++) {
        var dt = v.dots[i], kind = dt.getAttribute('data-dot'), w = +dt.getAttribute('data-w'), h = +dt.getAttribute('data-h'), s = sel(), g = s.o[kind], inp = inMeter(s), lo = kind === 'gate' ? -80 : -60;
        if (!g || isOff(inp) || inp < lo) { dt.setAttribute('cx', -10); continue; }
        var y = kind === 'gate' ? gateOut(inp, g) : dynOut(inp, g);
        dt.setAttribute('cx', ((clamp(inp, lo, 0) - lo) / -lo * w).toFixed(1)); dt.setAttribute('cy', (h - (clamp(y, lo, 0) - lo) / -lo * h).toFixed(1));
      }
      if (v.frame++ % 6) return;
      if (v.mvs) for (i = 0; i < v.mvs.length; i++) { var k2 = v.mvs[i].getAttribute('data-mv'), r = mval(k2); v.mvs[i].textContent = k2 === 'selgr' || k2 === 'selgt' ? (r ? '-' + Math.abs(r).toFixed(1) + ' dB' : '0.0 dB') : isOff(r) || r < -90 ? '-oo' : r.toFixed(1) + ' dBFS'; }
      var gr = Math.abs(+mval('selgt') || 0), sg = sel().o.gate, open = !sg || !sg.on || gr < 3;
      if (v.gls) for (i = 0; i < v.gls.length; i++) v.gls[i].classList.toggle('on', open && !isOff(mval('sel')));
      if (v.gss) for (i = 0; i < v.gss.length; i++) v.gss[i].textContent = !sg || !sg.on ? 'bypass' : open ? 'open' : 'closed';
      if (now() - (v.clockT || 0) > 15000) { v.clockT = now(); var tm = v.hd.querySelector('.tm'); if (tm) { var d = new Date(); tm.textContent = pad2(d.getHours()) + ':' + pad2(d.getMinutes()); } }
    }

    /* ---------- 입력 처리 */
    function curEnc() { var P2 = build(DUMMY); return P2; }
    function doEnc(k, delta, press) {
      var P2 = curEnc(), e = P2.enc[k]; if (!e) return;
      if (press) { if (e.p) e.p(); } else if (delta && e.t) e.t(delta);
      ui.flash = k; ui.flashT = now(); touch();
    }
    function moveTab(dir) { if (modal) return; var p = page(); if (p === 'utility') return; var tabs = tabsOf(p), id = tabId(p), k = 0; tabs.forEach(function (t, i) { if (t[0] === id) k = i; }); setTab(p, tabs[(k + dir + tabs.length) % tabs.length][0]); }
    function moveLayer(dir) { var P2 = curEnc(), n = P2.layers || 1; if (n < 2) return; var key = layerKey(); ui.layer[key] = ((ui.layer[key] || 0) - dir + n) % n; touch(); }   // ▲(dir −1 아님) : X32 처럼 위 = 앞 층
    var lastSeq = null;
    function onInput(ev) {
      if (!ev || typeof ev !== 'object') return;
      if (ev.seq != null) { if (ev.seq === lastSeq) return; lastSeq = ev.seq; }
      if (ev.kind === 'enc') doEnc(clamp(ev.index | 0, 0, 5), +ev.delta || 0, !!ev.press);
      else if (ev.kind === 'page') moveTab(ev.dir > 0 ? 1 : -1);
      else if (ev.kind === 'layer') { var n = curEnc().layers || 1; if (n > 1) { var key = layerKey(); ui.layer[key] = clamp((ui.layer[key] || 0) + (ev.dir > 0 ? 1 : -1), 0, n - 1); touch(); } }
      else if (ev.kind === 'utility') toggleUtility();
      else if (ev.kind === 'back') { if (modal) closeModal(false); else if (page() === 'utility') closeUtil(); }
    }
    function toggleUtility() {
      if (modal) { closeModal(false); return; }
      var p = page();
      if (p === 'utility') { closeUtil(); return; }
      if (p === 'home' && tabId('home') === 'config') { var s = sel(); openName(s.t, s.i); return; }
      ui.utilFrom = { page: p, tab: tabId(p) }; SET('screen.page', 'utility');
    }
    var pendingLocal = null, seqLocal = 0;
    function send(ev) { ev.seq = 'scr' + (++seqLocal) + '-' + Date.now(); pendingLocal = ev; SET('screen.input', ev); if (pendingLocal === ev) { pendingLocal = null; onInput(ev); } }
    function onModel(path, value) {
      if (path === 'screen.input') { if (pendingLocal && value && value.seq === pendingLocal.seq) pendingLocal = null; onInput(value); return; }
      if (path === 'screen.tab') { ui.tabVal = value; ui.tabMem[page()] = value; }
      if (path === 'screen.page') { var p = String(value); if (p === 'utility') { if (!ui.utilFrom) ui.utilFrom = { page: ui.lastPage === 'utility' ? 'home' : ui.lastPage, tab: ui.lastTab || 'home' }; } else { ui.utilFrom = null; ui.lastPage = p; } if (modal && modal.kind !== 'name') modal = null; }
      if (path === 'screen.tab' || path === 'screen.page') { ui.srcHi = null; ui.insHi = null; ui.outHi = null; ui.outFocus = 0; ui.fxTypeHi = null; ui.setRow = 0; if (page() !== 'utility') ui.lastTab = tabId(page()); }
      if (path === 'config.selected') { ui.srcHi = null; ui.insHi = null; }
      if (path === 'config.view.sendBank') ui.sendFocus = (value | 0) * 4;
      if (path === 'screen.modal') { if (value && value.kind === 'name' && !modal) openName(value.type || sel().t, value.index == null ? sel().i : value.index); else if (!value && modal && modal.kind === 'name') { modal = null; } }
      if (path === 'config.scenes.next' && value != null) ui.sceneHi = value | 0;
      if (!modal && irrelevant(path)) return;
      touch();
    }
    function irrelevant(path) {   // 지금 화면에 안 보이는 값이 바뀌면 다시 그리지 않음(페이더를 끌 때 가볍게)
      var mm = /^(ch|aux|fxr|bus|mtx)\.(\d+)\.(.*)$/.exec(path); if (!mm) return false;
      var p = page(), s = sel(), mine = s.t === mm[1] && s.i === +mm[2], tail = mm[3];
      if (/^(name|color|icon|solo)$/.test(tail)) return false;
      if (p === 'home') { if (mine) return false; if (mm[1] === 'bus' && tail === 'stereoLinkWithNext') return false; return true; }
      if (p === 'meters' || p === 'library' || p === 'monitor' || p === 'assign' || p === 'recorder') return true;
      if (p === 'setup') { var t = tabId('setup'); return !(t === 'preamps' && /^preamp\./.test(tail) || t === 'config' && tail === 'stereoLinkWithNext'); }
      if (p === 'mutegrp') return !/^muteGrp/.test(tail);
      if (p === 'routing' || p === 'effects' || p === 'scenes') return true;
      return false;
    }

    /* ---------- 화면 누르기 · 끌기 */
    function bindView(v) {
      var dragS = null;
      function toLocal(e) { var r = v.scr.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; }
      function onDown(e) {
        if (e.button != null && e.button !== 0) return;
        var t = e.target, encEl = t.closest && t.closest('[data-enc]'), dEl = t.closest && t.closest('[data-d]'), aEl = t.closest && t.closest('[data-a]');
        if (encEl && v.scr.contains(encEl)) { e.preventDefault(); dragS = { kind: 'enc', k: +encEl.getAttribute('data-enc'), y: e.clientY, acc: 0, moved: false, id: e.pointerId }; try { v.root.setPointerCapture(e.pointerId); } catch (x) { /* noop */ } return; }
        if (dEl && v.scr.contains(dEl)) { var spec = v.drags[+dEl.getAttribute('data-d')]; if (spec) { e.preventDefault(); dragS = { kind: 'd', spec: spec, el: dEl, y: e.clientY, x: e.clientX, moved: false, acc: 0, id: e.pointerId, aEl: aEl }; try { v.root.setPointerCapture(e.pointerId); } catch (x) { /* noop */ } dragApply(dragS, e, true); return; } }
        if (aEl && v.scr.contains(aEl)) { dragS = { kind: 'a', el: aEl, id: e.pointerId }; }
      }
      function onMove(e) {
        if (!dragS || dragS.id !== e.pointerId) return;
        if (dragS.kind === 'enc') { e.preventDefault(); var dy = dragS.y - e.clientY, r = v.scr.getBoundingClientRect(), stepPx = Math.max(6, r.height / 48); if (Math.abs(dy) >= stepPx) { var n = Math.trunc(dy / stepPx); dragS.y -= n * stepPx; dragS.moved = true; doEnc(dragS.k, n, false); } return; }
        if (dragS.kind === 'd') { e.preventDefault(); dragS.moved = true; dragApply(dragS, e, false); }
      }
      function onUp(e) {
        if (!dragS || dragS.id !== e.pointerId) return; var d = dragS; dragS = null;
        if (d.kind === 'enc' && !d.moved) doEnc(d.k, 0, true);
        if (d.kind === 'a') { var el2 = document.elementFromPoint(e.clientX, e.clientY); if (el2 && d.el.contains(el2)) runAct(d.el); }
        if (d.kind === 'd' && !d.moved && d.spec.type === 'eqpt') SET('config.view.eqBand', d.spec.band);
      }
      function runAct(el2) { var fn = v.acts[+el2.getAttribute('data-a')]; if (fn) { fn(); touch(); } }
      function dragApply(d, e, first) {
        var sp = d.spec, r = d.el.getBoundingClientRect(), L2 = toLocal(e);
        if (sp.type === 'eqpt') { var svg = v.scr.querySelector('[data-eqsvg] svg'); if (!svg) return; var sr = svg.getBoundingClientRect(); if (first) { SET('config.view.eqBand', sp.band); return; } var fx = clamp((e.clientX - sr.left) / sr.width, 0, 1), fy = clamp((e.clientY - sr.top) / sr.height, 0, 1), f = sig(20 * Math.pow(1000, fx), 3), gdb = Math.round((0.5 - fy) * 2 * 15 * (sr.height / 2) / (sr.height / 2 - 4 * sr.height / 192) * 2) / 2, s = sel(), bp = s.pre + '.eq.bands.' + sp.band, bt = G(bp + '.type'); m.batch(function () { SET(bp + '.freq', f); if (bt !== 'LCut' && bt !== 'HCut') SET(bp + '.gain', clamp(gdb, -15, 15)); }); return; }
        if (sp.type === 'thr') { var fx2 = clamp((e.clientX - r.left) / r.width, 0, 1), s2 = sel(); SET(s2.pre + '.' + sp.kind + '.thr', Math.round((sp.lo + fx2 * -sp.lo) * 2) / 2); return; }
        if (sp.type === 'fader' || sp.type === 'geq') { var fy2 = clamp((e.clientY - r.top) / r.height, 0, 1); if (sp.type === 'geq') { ui.geqBand = sp.band; SET(sp.path, Math.round((0.5 - fy2) * 60) / 2); } else { var p = 1 - fy2; SET(sp.path, p <= 0.005 ? OFF : Math.round(f2db(p) * 10) / 10); } return; }
        if (sp.type === 'hfader') { var px = clamp((e.clientX - r.left) / r.width, 0, 1); SET(sp.path, px <= 0.005 ? OFF : Math.round(f2db(px) * 10) / 10); return; }
        if (sp.type === 'hslider') { var px2 = clamp((e.clientX - r.left) / r.width, 0, 1); SET(sp.path, Math.round((sp.lo + px2 * (sp.hi - sp.lo)) / sp.step) * sp.step); return; }
        if (sp.type === 'fxknob') { if (first) { d.lastY = e.clientY; return; } var dy = d.lastY - e.clientY, stepPx = Math.max(3, v.scr.getBoundingClientRect().height / 160); if (Math.abs(dy) >= stepPx) { var n = Math.trunc(dy / stepPx); d.lastY -= n * stepPx; fxTurn(sp.path, sp.def, n); } }
        void L2;
      }
      function onWheel(e) {
        var t = e.target, encEl = t.closest && t.closest('[data-enc]'), dEl = t.closest && t.closest('[data-d]');
        if (encEl && v.scr.contains(encEl)) { e.preventDefault(); doEnc(+encEl.getAttribute('data-enc'), e.deltaY < 0 ? 1 : -1, false); return; }
        if (dEl && v.scr.contains(dEl)) { var sp = v.drags[+dEl.getAttribute('data-d')]; if (!sp) return; e.preventDefault(); var d = e.deltaY < 0 ? 1 : -1, s = sel();
          if (sp.type === 'eqpt') { SET('config.view.eqBand', sp.band); tLog(s.pre + '.eq.bands.' + sp.band + '.q', 0.3, 10, 72)(-d); }
          else if (sp.type === 'fader') tFader(sp.path)(d); else if (sp.type === 'hfader') tFader(sp.path)(d); else if (sp.type === 'hslider') tNum(sp.path, sp.lo, sp.hi, sp.step)(d); else if (sp.type === 'geq') tNum(sp.path, -15, 15, 0.5, 0)(d); else if (sp.type === 'fxknob') fxTurn(sp.path, sp.def, d); else if (sp.type === 'thr') tNum(s.pre + '.' + sp.kind + '.thr', sp.lo, 0, 0.5)(d); }
      }
      v.root.addEventListener('pointerdown', onDown); v.root.addEventListener('pointermove', onMove, { passive: false }); v.root.addEventListener('pointerup', onUp); v.root.addEventListener('pointercancel', function () { dragS = null; });
      v.root.addEventListener('wheel', onWheel, { passive: false });
      v.root.addEventListener('click', function (e) { e.stopPropagation(); });
      v.unbind = function () { };
    }

    /* ---------- 화면 하나(작은 것 · 큰 것) 만들기 */
    function makeView(host, isBig) {
      var root = document.createElement('div'); root.className = 'x32s' + (host.clientHeight < 4 ? ' auto' : ''); root.setAttribute('role', 'application'); root.setAttribute('aria-label', 'X32 메인 화면' + (isBig ? ' (크게 보기)' : ''));
      root.innerHTML = '<div class="x32s-scr"><div class="x32s-hd"></div><div class="x32s-tb"></div><div class="x32s-bd"></div><div class="x32s-md"></div><div class="x32s-en"></div></div><div class="x32s-cap" aria-hidden="true"></div>' + (isBig || opts.big === false ? '' : '<button type="button" class="x32s-zb" aria-label="화면 크게 보기">화면 크게</button>');
      host.appendChild(root);
      var v = { id: isBig ? 'B' : 'S', root: root, scr: root.querySelector('.x32s-scr'), hd: root.querySelector('.x32s-hd'), tb: root.querySelector('.x32s-tb'), bd: root.querySelector('.x32s-bd'), md: root.querySelector('.x32s-md'), en: root.querySelector('.x32s-en'), cap: root.querySelector('.x32s-cap'), frame: 0, acts: [], drags: [], big: isBig };
      var zb = root.querySelector('.x32s-zb'); if (zb) { zb.addEventListener('pointerdown', function (e) { e.stopPropagation(); }); zb.addEventListener('click', function (e) { e.stopPropagation(); if (big) closeBig(); else openBig(); }); }
      bindView(v); fit(v); views.push(v); return v;
    }
    function fit(v) {
      var w = v.root.clientWidth || v.root.parentNode.clientWidth || 320, h = v.root.clientHeight || w * H / W, k = Math.min(w / W, h / H);
      if (!(k > 0)) k = 0.4;
      v.scr.style.transform = 'scale(' + k.toFixed(4) + ')'; v.scr.style.left = Math.max(0, (w - W * k) / 2).toFixed(1) + 'px'; v.scr.style.top = Math.max(0, (h - H * k) / 2).toFixed(1) + 'px';
      v.root.classList.toggle('small', !v.big && k < 0.5);
      var cf = Math.max(9, Math.min(14, w / 22)); v.cap.style.fontSize = cf.toFixed(1) + 'px'; var zb = v.root.querySelector('.x32s-zb'); if (zb) zb.style.fontSize = Math.max(9, Math.min(12, w / 26)).toFixed(1) + 'px';
    }

    /* ---------- 크게 보기 판 */
    function bigHost() {
      if (opts.bigHost) return { parent: opts.bigHost, before: null };
      var px = el.closest && el.closest('.x32p'); if (px) { var sc = px.querySelector('.x32p-scroll') || px.querySelector('[data-role=scroll]'); if (sc && sc.parentNode) return { parent: sc.parentNode, before: sc.nextSibling }; return { parent: px, before: null }; }
      return { parent: el.parentNode && el.parentNode.parentNode ? el.parentNode.parentNode : document.body, before: null };
    }
    var PGB = [['home', 'HOME'], ['meters', 'METERS'], ['routing', 'ROUTING'], ['setup', 'SETUP'], ['library', 'LIBRARY'], ['effects', 'EFFECTS'], ['mutegrp', 'MUTE GRP'], ['utility', 'UTILITY'], ['scenes', 'SCENES'], ['monitor', 'MONITOR']];
    function openBig() {
      if (big) { big.box.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); return; }
      var hp = bigHost(), box = document.createElement('div'); box.className = 'x32s-big'; box.setAttribute('data-role', 'x32-screen-big');
      box.innerHTML = '<div class="bar"><b>X32 화면 크게 보기</b><span class="sp">사진 속 화면과 같은 화면이에요. 여기서 눌러도, 사진 위에서 눌러도 똑같이 바뀌어요.</span><button type="button" data-x="close">닫기</button></div>' +
        '<div class="row" data-x="pages">' + PGB.map(function (p) { return '<button type="button" data-pg="' + p[0] + '">' + p[1] + '</button>'; }).join('') + '</div>' +
        '<div class="host"></div>' +
        '<div class="row"><button type="button" data-x="pl">◀ PAGE</button><button type="button" data-x="pr">PAGE ▶</button><button type="button" data-x="lu">LAYER ▲</button><button type="button" data-x="ld">LAYER ▼</button></div>' +
        '<div class="encs">' + range(6).map(function (k) { return '<div class="enc"><div class="knob" data-k="' + k + '" role="slider" tabindex="0" aria-label="엔코더 ' + (k + 1) + ' (돌리기: 위아래로 끌기 · 휠 · 화살표 키)"></div><div class="pm"><button type="button" data-x="dec" data-k="' + k + '" aria-label="엔코더 ' + (k + 1) + ' 왼쪽으로">−</button><button type="button" data-x="inc" data-k="' + k + '" aria-label="엔코더 ' + (k + 1) + ' 오른쪽으로">+</button></div><button type="button" class="pr" data-x="press" data-k="' + k + '">누르기 ' + (k + 1) + '</button></div>'; }).join('') + '</div>' +
        (opts.help === false ? '' : '<p class="help"></p>') + '<p class="help rot">휴대폰을 가로로 돌리면 화면이 더 크게 보여요.</p>';
      if (hp.before) hp.parent.insertBefore(box, hp.before); else hp.parent.appendChild(box);
      var v = makeView(box.querySelector('.host'), true); v.help = box.querySelector('.help'); v.pgBtns = [].slice.call(box.querySelectorAll('[data-pg]'));
      var rot = [0, 0, 0, 0, 0, 0];
      function turn(k, d) { rot[k] = (rot[k] + d * 15) % 360; var kn = box.querySelector('.knob[data-k="' + k + '"]'); if (kn) kn.style.setProperty('--r', rot[k] + 'deg'); send({ kind: 'enc', index: k, delta: d }); }
      box.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return; var x = b.getAttribute('data-x'), k = +b.getAttribute('data-k'), pg = b.getAttribute('data-pg');
        if (pg) { if (pg === 'utility') send({ kind: 'utility' }); else { if (modal) closeModal(false); ui.utilFrom = null; var cur = page(); if (cur === pg) moveTab(1); else { var mem = ui.tabMem[pg]; m.batch(function () { SET('screen.modal', null); SET('screen.page', pg); SET('screen.tab', mem == null ? 0 : mem); }); } } return; }
        if (x === 'close') closeBig(); else if (x === 'pl') send({ kind: 'page', dir: -1 }); else if (x === 'pr') send({ kind: 'page', dir: 1 }); else if (x === 'lu') send({ kind: 'layer', dir: -1 }); else if (x === 'ld') send({ kind: 'layer', dir: 1 });
        else if (x === 'inc') turn(k, 1); else if (x === 'dec') turn(k, -1); else if (x === 'press') send({ kind: 'enc', index: k, press: true });
      });
      var kd = null;
      box.addEventListener('pointerdown', function (e) { var kn = e.target.closest('.knob'); if (!kn) return; e.preventDefault(); kd = { k: +kn.getAttribute('data-k'), y: e.clientY, id: e.pointerId, moved: false }; try { kn.setPointerCapture(e.pointerId); } catch (x) { /* noop */ } });
      box.addEventListener('pointermove', function (e) { if (!kd || kd.id !== e.pointerId) return; e.preventDefault(); var dy = kd.y - e.clientY; if (Math.abs(dy) >= 8) { var n = Math.trunc(dy / 8); kd.y -= n * 8; kd.moved = true; turn(kd.k, n); } });
      box.addEventListener('pointerup', function (e) { if (kd && kd.id === e.pointerId) { if (!kd.moved) send({ kind: 'enc', index: kd.k, press: true }); kd = null; } });
      box.addEventListener('wheel', function (e) { var kn = e.target.closest('.knob'); if (!kn) return; e.preventDefault(); turn(+kn.getAttribute('data-k'), e.deltaY < 0 ? 1 : -1); }, { passive: false });
      box.addEventListener('keydown', function (e) { var kn = e.target.closest && e.target.closest('.knob'); if (!kn) return; var d = e.key === 'ArrowUp' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowDown' || e.key === 'ArrowLeft' ? -1 : 0; if (d) { e.preventDefault(); turn(+kn.getAttribute('data-k'), d); } else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); send({ kind: 'enc', index: +kn.getAttribute('data-k'), press: true }); } });
      big = { box: box, view: v }; if (ro) ro.observe(v.root);
      touch(); setTimeout(function () { if (alive && big) { fit(big.view); box.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } }, 30);
      views.forEach(function (w) { var zb = w.root.querySelector('.x32s-zb'); if (zb) zb.textContent = '크게 닫기'; });
    }
    function closeBig() { if (!big) return; var v = big.view; views = views.filter(function (w) { return w !== v; }); if (ro) try { ro.unobserve(v.root); } catch (x) { /* noop */ } if (big.box.parentNode) big.box.parentNode.removeChild(big.box); big = null; views.forEach(function (w) { var zb = w.root.querySelector('.x32s-zb'); if (zb) zb.textContent = '화면 크게'; }); }

    /* ---------- 시작 */
    var main = makeView(el, false);
    if (window.ResizeObserver) { ro = new ResizeObserver(function () { views.forEach(fit); }); ro.observe(main.root); }
    window.addEventListener('resize', onResize);
    function onResize() { views.forEach(fit); }
    m.on(onModel);
    ui.lastPage = page(); ui.lastTab = tabId(page()); ui.tabVal = G('screen.tab'); ui.tabMem = {}; ui.tabMem[page()] = ui.tabVal;
    var lastPaint = 0;
    function tick() {
      if (!alive) return; raf = requestAnimationFrame(tick);
      if (!el.isConnected) return;
      var t = now();
      if (dirty || (ui.flash >= 0 && t - ui.flashT > 500 && t - ui.flashT < 600) || (ui.flash >= 0 && t - ui.flashT > 1800 && t - ui.flashT < 1900) || (ui.msg && t - ui.msgT > 2500 && t - ui.msgT < 2600)) { dirty = false; renderAll(); }
      else if (views.some(function (w) { return w.needs; })) views.forEach(function (w) { if (w.needs) { w.needs = false; } });
      if (t - lastPaint > 30) { lastPaint = t; views.forEach(paintMeters); }
    }
    renderAll(); dirty = false; tick();

    return {
      destroy: function () { if (m.loadScene && m.loadScene._x32s && m.loadScene._orig === origLoad) m.loadScene = origLoad; alive = false; cancelAnimationFrame(raf); m.off(onModel); window.removeEventListener('resize', onResize); if (ro) ro.disconnect(); closeBig(); if (main.root.parentNode) main.root.parentNode.removeChild(main.root); views = []; },
      openBig: openBig, closeBig: closeBig, input: function (ev) { send(ev || {}); },
      state: function () { var p = page(); return { page: p, tab: p === 'utility' ? 'utility' : tabId(p), layer: layer(), modal: modal ? { kind: modal.kind, text: modal.text } : null, big: !!big, util: ui.utilFrom, enc: (curEnc().enc || []).map(function (e) { return e ? e.l + (e.v ? ': ' + e.v : '') : ''; }) }; }
    };
  }

  window.X32Screen = { mount: mount, version: 1, ICONS: ICONS };
})();
