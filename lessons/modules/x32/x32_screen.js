/* =============================================================================
   window.X32Screen — Behringer X32 메인 디스플레이(5" 컬러 화면, 800×480) 모든 페이지 (2026-11-08, 화면 작업자)

   var s = X32Screen.mount(el, model, opts)
     el    : 화면을 그릴 자리(사진 위 화면 칸). 크기에 맞춰 800×480 화면을 줄이거나 키워 그려요.
     model : X32Model.create() 로 만든 콘솔
     opts  : { bigHost: 요소(선택) — 「크게 보기」 판을 넣을 곳. 없으면 el 이 든 .x32p 안 사진 상자 바로 위(2026-11-08) · 없으면 el 바로 뒤
               name: 'X32' | 'M32' — 크게 보기 판 제목 · 읽기 이름,
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
  var HD = 46, TB = 28, EN = 78, BY = HD + TB, BH = H - HD - TB - EN;   // 머리 · 탭 · 몸통 · 엔코더 줄

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
  var BANDC = ['#2cc6d8', '#f5d000', '#d455d8', '#f5a623', '#e53935', '#f5a623'], BANDC6 = ['#2cc6d8', '#3cc84a', '#f5d000', '#d455d8', '#e53935', '#f5a623'];   // FW4 띠 색: LOW 청록 · (LOW2 초록) · LO MID 노랑 · HI MID 자홍 · (HIGH2 빨강) · HIGH 주황
  function bandC(n, k) { return (n > 4 ? BANDC6 : BANDC)[k] || '#fff'; }
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
      /* 2026-11-08 FW4 모양: 실제 X32(펌웨어 4.x) 화면 사진을 보고 맞춤 — 회색 판 · 진회색 칸 머리 · 흰 값 칸 · 흰 노브 + 주황 호 · 노랑 켜짐 · 주황 시계 */
      '@font-face{font-family:"X32 Cond";font-weight:500;font-display:swap;src:url(fonts/barlow-semi-condensed/barlow-semi-condensed-latin-500-normal.woff2) format("woff2")}',
      '@font-face{font-family:"X32 Cond";font-weight:600;font-display:swap;src:url(fonts/barlow-semi-condensed/barlow-semi-condensed-latin-600-normal.woff2) format("woff2")}',
      '@font-face{font-family:"X32 Cond";font-weight:700;font-display:swap;src:url(fonts/barlow-semi-condensed/barlow-semi-condensed-latin-700-normal.woff2) format("woff2")}',
      '.x32s-scr{position:absolute;left:0;top:0;width:800px;height:480px;transform-origin:0 0;background:#000;color:#f2f3f4;font:600 13px/1.15 "X32 Cond","Arial Narrow",Arial,"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif;overflow:hidden;text-align:left;letter-spacing:.01em}',
      '.x32s-scr [data-a],.x32s-scr [data-d]{cursor:pointer}',
      /* 머리: 채널 칸 · CUE · 재생 · 상태 · 시계 */
      '.x32s-hd{position:absolute;left:0;top:0;width:800px;height:46px;background:#000;z-index:2}',
      '.x32s-hd .cb{position:absolute;left:2px;top:2px;width:94px;height:70px;background:#000;border:1px solid #6d7278;color:#fff;overflow:hidden}',
      '.x32s-hd .cb .bar{position:absolute;right:2px;top:2px;bottom:2px;width:8px}',
      '.x32s-hd .cb .ic{position:absolute;left:6px;top:5px;opacity:.9}',
      '.x32s-hd .cb .id{position:absolute;left:6px;top:30px;font-size:16px;font-weight:700;white-space:nowrap}',
      '.x32s-hd .cb .ln{position:absolute;left:4px;right:14px;top:49px;height:1px;background:#8a8f95}',
      '.x32s-hd .cb .nm{position:absolute;left:6px;right:14px;top:51px;font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.x32s-hd .cue{position:absolute;left:100px;top:2px;width:206px;height:42px}',
      '.x32s-hd .cue .t1{position:absolute;left:66px;top:0;right:0;height:20px;border:1px solid #5d6268;background:#0b0c0d}',
      '.x32s-hd .cue .t2{position:absolute;left:66px;top:21px;right:0;height:20px;border:1px solid #5d6268;background:#0b0c0d;font-size:11px;color:#ffb21e;padding:2px 4px;white-space:nowrap;overflow:hidden}',
      '.x32s-hd .cue .lb{position:absolute;left:0;top:0;width:64px;height:41px;border:1px solid #5d6268;border-right:0;background:#0b0c0d;color:#8b9096;font-size:11px;padding:24px 0 0 14px}',
      '.x32s-hd .ply{position:absolute;left:310px;top:2px;width:186px;height:42px;border:1px solid #5d6268;background:#0b0c0d}',
      '.x32s-hd .ply .tt{position:absolute;left:6px;right:6px;top:2px;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#fff}',
      '.x32s-hd .ply .tm{position:absolute;left:0;right:0;top:21px;height:20px;border-top:1px solid #5d6268;display:flex;align-items:center;justify-content:space-around;font-size:14px;color:#fff}',
      '.x32s-hd .ply .tm i{display:inline-block;width:10px;height:10px;background:#fff}',
      '.x32s-hd .st{position:absolute;left:499px;top:2px;width:168px;height:42px;border:1px solid #5d6268;background:#0b0c0d;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;font-size:12px;color:#fff}',
      '.x32s-hd .st span{display:flex;align-items:center;gap:5px;padding-left:6px;white-space:nowrap;overflow:hidden}',
      '.x32s-hd .st span:nth-child(odd){border-right:1px solid #5d6268}.x32s-hd .st span:nth-child(-n+2){border-bottom:1px solid #5d6268}',
      '.x32s-hd .st q{quotes:none;display:inline-block;width:7px;height:7px;background:#3a3d40}.x32s-hd .st q.on{background:#2fd34d}.x32s-hd .st q.y{background:#f5b400}',
      '.x32s-hd .ck{position:absolute;left:671px;top:2px;width:127px;height:42px;border:1px solid #5d6268;background:#0b0c0d;color:#f5a623;font-size:28px;font-weight:600;display:flex;align-items:baseline;justify-content:center;padding-top:4px;letter-spacing:.02em;font-variant-numeric:tabular-nums}',
      '.x32s-hd .ck small{font-size:15px;margin-left:2px}',
      '.x32s-hd .sof{position:absolute;left:310px;top:2px;width:186px;height:42px;background:#f5b400;color:#111;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;text-align:center;line-height:1.1;padding:0 4px}',
      /* 탭 줄 */
      '.x32s-tb{position:absolute;left:98px;top:46px;width:702px;height:28px;display:flex;align-items:stretch;gap:2px;padding:0 2px;background:#000;z-index:1}',
      '.x32s-tb .t{flex:1 1 0;display:flex;align-items:center;justify-content:center;min-width:0;padding:0 2px;margin-top:3px;background:#2b2e31;color:#8d939a;font-size:14px;font-weight:700;text-transform:uppercase;white-space:nowrap;overflow:hidden;letter-spacing:.03em}',
      '.x32s-tb .t.on{margin-top:0;background:#474c52;color:#fff;font-size:19px}',
      '.x32s-tb .t.sm{font-size:12px}.x32s-tb .t.sm.on{font-size:15px}',
      /* 몸통 · 엔코더 */
      '.x32s-bd{position:absolute;left:0;top:74px;width:800px;height:328px;overflow:hidden;background:#474c52;border:2px solid #474c52}',
      '.x32s-en{position:absolute;left:0;top:402px;width:800px;height:78px;display:flex;gap:4px;padding:6px 3px 2px;background:#000}',
      '.x32s-en .pgi{position:absolute;right:4px;top:-9px;display:flex;gap:2px;z-index:2}.x32s-en .pgi i{font-style:normal;width:12px;height:12px;font-size:11px;line-height:12px;text-align:center;font-weight:700;background:#56595d;color:#1a1a1a}.x32s-en .pgi i.on{background:#f5a623;color:#111}',
      '.x32s-en .e{flex:1 1 0;position:relative;min-width:0;background:#2e3135;overflow:hidden;cursor:ns-resize;touch-action:none}',
      '.x32s-en .e.x{background:#1b1d1f;cursor:default}.x32s-en .e.x>*{visibility:hidden}',
      '.x32s-en .e.fl{box-shadow:0 0 0 2px #f5a623 inset}',
      '.x32s-en .e .kn{position:absolute;left:5px;top:6px;width:38px;height:38px}',
      '.x32s-en .e .l{position:absolute;left:42px;right:2px;top:4px;text-align:center;font-size:14px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.x32s-en .e .v{position:absolute;left:46px;right:4px;top:24px;height:19px;display:flex;align-items:center;justify-content:center;gap:3px;white-space:nowrap;overflow:hidden}',
      '.x32s-en .e .v b{background:#eef0f1;color:#111;font-size:14px;font-weight:700;padding:0 5px;height:18px;line-height:18px;min-width:44px;text-align:center;overflow:hidden;text-overflow:ellipsis;max-width:100%}',
      '.x32s-en .e .v u{text-decoration:none;color:#fff;font-size:12px;flex:none}',
      '.x32s-en .e .r{display:none}',
      '.x32s-en .e .p{position:absolute;left:0;right:0;bottom:0;height:18px;line-height:18px;text-align:center;font-size:13px;font-weight:700;color:#d7dadd;background:#62666b;text-transform:uppercase;letter-spacing:.03em;white-space:nowrap;overflow:hidden}',
      '.x32s-en .e .p.on{background:#f5b400;color:#111}',
      '.x32s-en .e .p.cr.on{background:#e53935;color:#fff}',
      '.x32s-en .e .p.nop{background:#3b3e42}',
      /* 공통 상자(칸) */
      '.x32s .bx{position:absolute;background:#3d4146;border:1px solid #2a2d30;overflow:hidden}',
      '.x32s .bx>.h{display:flex;align-items:center;justify-content:center;gap:6px;height:20px;padding:0 6px;background:#25282b;font-weight:700;font-size:13px;color:#fff;white-space:nowrap;text-transform:uppercase;letter-spacing:.03em}',
      '.x32s .sec{position:absolute;height:20px;line-height:20px;text-align:center;background:#25282b;color:#fff;font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:.03em;white-space:nowrap;overflow:hidden}',
      '.x32s .led{display:inline-block;min-width:26px;padding:1px 5px;font-size:11px;font-weight:700;text-align:center;color:#1c1d1f;background:#8e949a;text-transform:uppercase}',
      '.x32s .led.on{background:#f5b400;color:#111}.x32s .led.r.on{background:#e53935;color:#fff}',
      '.x32s .kv{display:flex;justify-content:space-between;align-items:center;gap:6px;padding:2px 7px;font-size:12px;white-space:nowrap}.x32s .kv span{color:#d9dcdf;text-transform:uppercase}.x32s .kv b{color:#111;background:#eef0f1;padding:0 4px;font-weight:700;min-width:30px;text-align:right}',
      '.x32s .kv.hi{background:#5b6168}.x32s .kv.hi b{box-shadow:0 0 0 2px #f5a623}',
      '.x32s .vb{display:inline-block;background:#eef0f1;color:#111;font-weight:700;font-size:14px;padding:0 5px;height:18px;line-height:18px;text-align:center;white-space:nowrap}',
      '.x32s .un{color:#fff;font-size:12px;margin-left:3px}',
      '.x32s .cap{font-size:13px;font-weight:700;color:#fff;text-transform:uppercase;text-align:center;white-space:nowrap}',
      '.x32s .big{font-size:22px;font-weight:700;color:#fff}',
      '.x32s .dim{color:#b9bec3}.x32s .yel{color:#f5b400}.x32s .cy{color:#f5a623}',
      '.x32s .lst{position:absolute;overflow:hidden;background:#000;border:1px solid #9aa0a6;padding:1px}.x32s .lst div{height:15px;line-height:15px;padding:0 5px;margin-bottom:1px;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#fff;background:#1e2023;border:1px solid #3b3f43}',
      '.x32s .lst div.cur{color:#f5a623}',
      '.x32s .lst div.hi{border:2px solid #f5a623;line-height:11px;color:#f5a623;background:#2a2620}',
      '.x32s .btn{flex:0 0 auto;width:auto;height:auto;border-radius:0;box-shadow:none;min-height:0;min-width:0;line-height:1;margin:0;transform:none;font-family:inherit;letter-spacing:.02em}',
      '.x32s .btn{display:inline-flex;align-items:center;justify-content:center;padding:2px 8px;border:0;background:#8e949a;color:#1c1d1f;font-size:12px;font-weight:700;white-space:nowrap;text-transform:uppercase}',
      '.x32s .btn.big2{font-size:22px;font-weight:600;background:#8e949a;color:#d9dcdf;text-transform:uppercase}.x32s .btn.big2.on{background:#f5b400;color:#111}',
      '.x32s .btn.on{background:#f5b400;color:#111}.x32s .btn.r.on{background:#e53935;color:#fff}.x32s .btn.dk{background:#1c1e20;color:#fff;border:1px solid #8e949a}.x32s .btn.dk.on{border-color:#f5a623;color:#f5a623;background:#2a2620}',
      /* 미터(칸으로 나뉜 LED) */
      '.x32s .mv{position:absolute;background:#111;overflow:hidden}',
      '.x32s .mv>b{position:absolute;inset:0;background:linear-gradient(0deg,#2fb344 0,#2fb344 62%,#c9c22b 62%,#c9c22b 88%,#e5332a 88%);clip-path:inset(calc((1 - var(--v,0)) * 100%) 0 0 0)}',
      '.x32s .mv::after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent 0,transparent 3px,#111 3px,#111 4px);pointer-events:none}',
      '.x32s .mh{position:absolute;background:#111;overflow:hidden}',
      '.x32s .mh>b{position:absolute;inset:0;background:linear-gradient(90deg,#2fb344 0,#2fb344 62%,#c9c22b 62%,#c9c22b 88%,#e5332a 88%);clip-path:inset(0 calc((1 - var(--v,0)) * 100%) 0 0)}',
      '.x32s .mh::after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0,transparent 4px,#111 4px,#111 5px);pointer-events:none}',
      '.x32s .mv.gr>b{background:#e5332a;clip-path:inset(0 0 calc((1 - var(--v,0)) * 100%) 0)}.x32s .mh.gr>b{background:#e5332a;clip-path:inset(0 0 0 calc((1 - var(--v,0)) * 100%))}',
      '.x32s .mv.rta>b{background:linear-gradient(0deg,#1d4fd0,#3a7bff)}.x32s .mv.rta::after{display:none}',
      '.x32s .mv.gt>b{background:#e5332a;clip-path:inset(0 0 calc((1 - var(--v,0)) * 100%) 0)}',
      '.x32s .gl{display:inline-block;width:12px;height:12px;border-radius:50%;background:#1b1c1e;border:1px solid #8e949a;vertical-align:-2px}.x32s .gl.on{background:#f5b400;border-color:#f5b400;box-shadow:0 0 5px #f5b400}',
      '.x32s .gph{position:absolute;background:#0c0c0c;border:2px solid #1d1f21;overflow:hidden}',
      '.x32s svg text{font-family:inherit}',
      /* 창(이름 · 키보드) */
      '.x32s-md{position:absolute;left:0;top:74px;width:800px;height:328px;background:#474c52;display:none}',
      '.x32s-md.on{display:block}',
      '.x32s-md .kb{position:absolute;left:10px;top:84px;width:540px}',
      '.x32s-md .kb div{display:flex;gap:4px;margin-bottom:4px;justify-content:center}',
      '.x32s-md .kb span{flex:0 0 48px;height:40px;display:flex;align-items:center;justify-content:center;background:#2b2e31;border:1px solid #8e949a;font-size:17px;font-weight:700;color:#fff;cursor:pointer}',
      '.x32s-md .kb span.w{flex-basis:96px;font-size:13px}.x32s-md .kb span.ww{flex-basis:200px;font-size:13px}.x32s-md .kb span.hi{background:#f5b400;color:#111;border-color:#f5b400}',
      '.x32s-md .nf{position:absolute;left:10px;top:10px;width:540px;height:64px;border:2px solid #f5a623;background:#000;display:flex;align-items:center;gap:10px;padding:0 12px}',
      '.x32s-md .nf .tx{font-size:30px;font-weight:700;color:#fff;white-space:pre;letter-spacing:.02em}.x32s-md .nf .tx u{text-decoration:none;border-left:3px solid #f5a623;margin-left:-1px;animation:x32sBlink 1s steps(1) infinite}',
      '@keyframes x32sBlink{50%{border-color:transparent}}',
      '.x32s-md input.ti{position:absolute;left:10px;top:10px;width:540px;height:64px;opacity:0;font-size:16px;border:0;padding:0;cursor:text}',
      '.x32s-md .sw{position:absolute;left:566px;top:10px;width:224px}',
      '.x32s-md .sw i{display:inline-block;width:50px;height:30px;margin:0 4px 4px 0;border:2px solid #222;cursor:pointer;font-style:normal;font-size:10px;font-weight:700;text-align:center;line-height:26px}',
      '.x32s-md .sw i.on{border-color:#fff;box-shadow:0 0 0 2px #f5a623}',
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
    var ui = { oscHi: null, layer: {}, srcHi: null, keyHi: null, insHi: null, rtHi: [null, null, null, null, null], rtFocus: 0, outHi: null, fxSel: 0, fxTypeHi: null, sendFocus: 0, dcaSel: 0, mgSel: 0, sceneHi: null, libHi: 0, libScope: { head: true, config: true, gate: true, dyn: true, eq: true, sends: false }, libFx: 0, setRow: 0, linkHi: 0, chHi: 0, safeHi: 0, tbHi: 0, geqBand: 15, utilFrom: null, flash: -1, flashT: 0, toast: '', toastT: 0, pend: null, clip: null, msg: '', msgT: 0, lastPage: 'home' };
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
      monitor: [['monitor', 'monitor'], ['talka', 'talkback A'], ['talkb', 'talkback B'], ['osc', 'oscillator']],
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
    function svgGrid(w, h, xs, ys) { var s = ''; xs.forEach(function (x) { s += '<line x1="' + x + '" y1="0" x2="' + x + '" y2="' + h + '" stroke="#3a3d41"/>'; }); ys.forEach(function (y) { s += '<line x1="0" y1="' + y + '" x2="' + w + '" y2="' + y + '" stroke="#3a3d41"/>'; }); return s; }
    function fx2x(f, w) { return Math.log(f / 20) / Math.log(1000) * w; }
    function eqSvg(o, w, h, ctx, big) {
      var eq = o.eq || {}, lc = o.preamp && o.preamp.lowcut, n = big ? 160 : 60, r = eqResp(eq, lc, n), rng = big ? 15 : 18, y = function (d) { return h / 2 - clamp(d, -rng * 1.2, rng * 1.2) / rng * (h / 2 - 4); }, pts = r.map(function (d, i) { return (i / n * w).toFixed(1) + ',' + y(d).toFixed(1); }).join(' ');
      var grid = svgGrid(w, h, [50, 100, 200, 500, 1000, 2000, 5000, 10000].map(function (f) { return +fx2x(f, w).toFixed(1); }), [y(12), y(6), y(0), y(-6), y(-12)].map(function (v) { return +v.toFixed(1); }));
      var s = '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" style="display:block">' + grid;
      if (big) { [[100, '100'], [1000, '1k'], [10000, '10k'], [50, '50'], [200, '200'], [500, '500'], [2000, '2k'], [5000, '5k']].forEach(function (f) { s += '<text x="' + (fx2x(f[0], w) + 3).toFixed(0) + '" y="' + (h - 4) + '" fill="#d9dcdf" font-size="10">' + f[1] + '</text>'; }); [12, 6, -6, -12].forEach(function (d) { s += '<text x="3" y="' + (y(d) - 2).toFixed(0) + '" fill="#d9dcdf" font-size="10">' + (d > 0 ? '+' : '') + d + '</text>'; }); }
      var on = eq.on !== false;
      s += '<polygon points="0,' + (h / 2) + ' ' + pts + ' ' + w + ',' + (h / 2) + '" fill="' + (on ? 'rgba(255,210,58,.16)' : 'rgba(140,150,160,.08)') + '"/>';
      s += '<polyline points="' + pts + '" fill="none" stroke="' + (on ? '#f5b400' : '#9aa0a6') + '" stroke-width="' + (big ? 2.5 : 1.6) + '"/>';
      if (big && lc && lc.on) s += '<line x1="' + fx2x(lc.freq, w).toFixed(1) + '" y1="0" x2="' + fx2x(lc.freq, w).toFixed(1) + '" y2="' + h + '" stroke="#ff9f1c" stroke-dasharray="4 3"/><text x="' + (fx2x(lc.freq, w) + 4).toFixed(0) + '" y="14" fill="#ff9f1c" font-size="11" font-weight="700">LOW CUT</text>';
      if (big) (eq.bands || []).forEach(function (b, k) { var cx = fx2x(b.freq, w), cy = b.type === 'LCut' || b.type === 'HCut' ? h / 2 : y(b.gain), hi = k === (G('config.view.eqBand') | 0) ? 1 : 0; s += '<g ' + ctx.D({ type: 'eqpt', band: k }) + '><circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="' + (hi ? 13 : 11) + '" fill="' + bandC((eq.bands || []).length, k) + '" fill-opacity=".9" stroke="' + (hi ? '#fff' : '#000') + '" stroke-width="2"/><text x="' + cx.toFixed(1) + '" y="' + (cy + 4).toFixed(1) + '" text-anchor="middle" font-size="12" font-weight="900" fill="#000">' + (k + 1) + '</text></g>'; });
      return s + '</svg>';
    }
    function xferSvg(kind, o, w, h, ctx, big) {
      var g = o[kind] || {}, lo = kind === 'gate' ? -80 : -60, X = function (d) { return (d - lo) / -lo * w; }, Y = function (d) { return h - (clamp(d, lo, 0) - lo) / -lo * h; }, pts = [];
      for (var i = 0; i <= 60; i++) { var x = lo + i / 60 * -lo, yv = kind === 'gate' ? gateOut(x, g) : dynOut(x, g); pts.push(X(x).toFixed(1) + ',' + Y(yv).toFixed(1)); }
      var tk = kind === 'gate' ? [-60, -40, -20] : [-48, -36, -24, -12];
      var s = '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" style="display:block" ' + (big ? ctx.D({ type: 'thr', kind: kind, lo: lo }) : '') + '>' + svgGrid(w, h, tk.map(function (d) { return +X(d).toFixed(1); }), tk.map(function (d) { return +Y(d).toFixed(1); }));
      s += '<line x1="0" y1="' + h + '" x2="' + w + '" y2="0" stroke="#55595e" stroke-dasharray="3 3"/>';
      if (big) tk.forEach(function (d) { s += '<text x="' + (X(d) + 2).toFixed(0) + '" y="' + (h - 3) + '" fill="#d9dcdf" font-size="10">' + d + '</text>'; });
      s += '<line x1="' + X(g.thr).toFixed(1) + '" y1="0" x2="' + X(g.thr).toFixed(1) + '" y2="' + h + '" stroke="#c9ccd0" stroke-opacity=".55" stroke-width="' + (big ? 1.5 : 1) + '"/>';
      s += '<polyline points="' + pts.join(' ') + '" fill="none" stroke="' + (g.on ? '#f5b400' : '#9aa0a6') + '" stroke-width="' + (big ? 2.5 : 1.8) + '"/>';
      s += '<circle data-dot="' + kind + '" data-w="' + w + '" data-h="' + h + '" cx="-10" cy="-10" r="' + (big ? 6 : 3.5) + '" fill="#f5b400" stroke="#000"/>';
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
    /* ---------- FW4 그림 조각(절대 위치) */
    function sec(x, y, w, t, h) { return '<div class="sec" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px' + (h ? ';height:' + h + 'px;line-height:' + h + 'px' : '') + '">' + t + '</div>'; }
    function at(x, y, html, st) { return '<div style="position:absolute;left:' + x + 'px;top:' + y + 'px;' + (st || '') + '">' + html + '</div>'; }
    function sbtn(t, on, a, x, y, w, h, cls) { return '<span class="btn ' + (cls || '') + (on ? ' on' : '') + '" ' + (a || '') + ' style="position:absolute;left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + (h || 18) + 'px">' + t + '</span>'; }
    function vbox(v, u, x, y, w) { return '<div style="position:absolute;left:' + x + 'px;top:' + y + 'px;display:flex;align-items:center"><span class="vb" style="min-width:' + (w || 50) + 'px">' + esc(v) + '</span>' + (u ? '<span class="un">' + esc(u) + '</span>' : '') + '</div>'; }
    function knobAt(f, x, y, sz, cap, ctx, turn, unit) { return '<div style="position:absolute;left:' + x + 'px;top:' + y + 'px;width:' + sz + 'px;height:' + sz + 'px" ' + (turn ? ctx.D({ type: 'knob', turn: turn }) : '') + '>' + knobSvg(f, sz) + '</div>' + (cap ? '<div class="cap" style="position:absolute;left:' + (x - 30) + 'px;top:' + (y + sz + 2) + 'px;width:' + (sz + 60) + 'px">' + cap + (unit ? '<div style="font-size:11px;color:#d9dcdf;text-transform:none">' + unit + '</div>' : '') + '</div>' : ''); }
    function gph(x, y, w, h, inner, extra) { return '<div class="gph" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px"' + (extra || '') + '>' + inner + '</div>'; }
    function icoBtn(svg, t, on, a, x, y, red) { return '<div ' + (a || '') + ' style="position:absolute;left:' + x + 'px;top:' + y + 'px;display:flex;align-items:center;gap:5px;font-size:12px;font-weight:700;color:#fff"><span style="width:20px;height:18px;display:flex;align-items:center;justify-content:center;background:' + (on ? (red ? '#e53935' : '#f5b400') : '#1c1e20') + ';border:1px solid #8e949a">' + svg + '</span>' + t + '</div>'; }
    var IC_48 = '<svg width="12" height="14" viewBox="0 0 12 14" fill="#fff"><path d="M7 0L1 8h4l-1 6 7-9H7z"/></svg>', IC_PH = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#fff" stroke-width="1.6"><circle cx="7" cy="7" r="5"/><path d="M2 12L12 2"/></svg>',
      IC_DL = '<svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="#fff" stroke-width="1.4"><path d="M1 11L5 1l4 10z"/><path d="M11 4v6M9.5 4h3"/></svg>', IC_LC = '<svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="#fff" stroke-width="1.6"><path d="M1 11q4-10 8-10h6"/></svg>';
    function chipColor(o) { var c = col(o.color); return 'background:' + c.bg + ';color:' + c.fg; }

    function eqBig(o, w, h, ctx, cur, names) {   // FW4 큰 EQ 그래프: 촘촘한 로그 격자 · dB 눈금 · 위쪽 띠 번호 깃발 · 노랑 곡선
      var eq = o.eq || {}, lc = o.preamp && o.preamp.lowcut, n = 200, r = eqResp(eq, lc, n), rng = 15, y = function (d) { return h / 2 - clamp(d, -rng * 1.2, rng * 1.2) / rng * (h / 2 - 4); }, pts = r.map(function (d, i) { return (i / n * w).toFixed(1) + ',' + y(d).toFixed(1); }).join(' '), on = eq.on !== false, nb = (eq.bands || []).length;
      var s = '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" style="display:block">' + svgGrid(w, h, logXs(w), [15, 10, 5, 0, -5, -10, -15].map(function (d) { return +y(d).toFixed(1); }));
      [[15, '+15'], [10, '+10'], [5, '+5'], [0, '0dB'], [-5, '-5'], [-10, '-10'], [-15, '-15']].forEach(function (t) { s += '<text x="4" y="' + (y(t[0]) - 2).toFixed(0) + '" fill="#e6e8ea" font-size="10" font-weight="600">' + t[1] + '</text>'; });
      [[20, '20'], [40, '40'], [60, '60'], [80, '80'], [100, '100'], [200, '200'], [400, '400'], [600, '600'], [800, '800'], [1000, '1k'], [2000, '2k'], [4000, '4k'], [6000, '6k'], [8000, '8k'], [10000, '10k'], [20000, '20k']].forEach(function (f) { var x = fx2x(f[0], w); s += '<text x="' + Math.min(w - 14, Math.max(2, x - 6)).toFixed(0) + '" y="' + (h - 3) + '" fill="#e6e8ea" font-size="10" font-weight="600">' + f[1] + '</text>'; });
      s += '<polygon points="0,' + (h / 2) + ' ' + pts + ' ' + w + ',' + (h / 2) + '" fill="' + (on ? 'rgba(245,180,0,.22)' : 'rgba(150,155,160,.12)') + '"/><polyline points="' + pts + '" fill="none" stroke="' + (on ? '#f5c518' : '#9aa0a6') + '" stroke-width="2.5"/>';
      if (lc && lc.on) s += '<line x1="' + fx2x(lc.freq, w).toFixed(1) + '" y1="16" x2="' + fx2x(lc.freq, w).toFixed(1) + '" y2="' + h + '" stroke="#f5a623" stroke-dasharray="4 3"/>';
      (eq.bands || []).forEach(function (b, k) { var cx = fx2x(b.freq, w), cy = b.type === 'LCut' || b.type === 'HCut' ? h / 2 : y(b.gain), c = bandC(nb, k), hi = k === cur;
        s += '<line x1="' + cx.toFixed(1) + '" y1="16" x2="' + cx.toFixed(1) + '" y2="' + h + '" stroke="' + c + '" stroke-opacity="' + (hi ? '.9' : '.45') + '" stroke-dasharray="' + (hi ? '0' : '3 3') + '"/>' +
          '<g ' + ctx.D({ type: 'eqpt', band: k }) + '><rect x="' + (cx - 7).toFixed(1) + '" y="2" width="14" height="14" fill="' + (hi ? c : '#111') + '" stroke="' + c + '" stroke-width="1.5"/><text x="' + cx.toFixed(1) + '" y="13" text-anchor="middle" font-size="11" font-weight="700" fill="' + (hi ? '#111' : c) + '">' + (k + 1) + '</text>' +
          '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="' + (hi ? 8 : 6) + '" fill="' + c + '" fill-opacity="' + (hi ? '1' : '.75') + '" stroke="#111" stroke-width="1.5"/></g>'; });
      return s + '</svg>';
    }
    /* GATE · DYN 탭 공통(FW4): 왼쪽 INPUT LEVEL 미터, 가운데 전달 그래프 + 빨강 미터, 오른쪽 아래 FILTER · KEY SOURCE */
    function scaleV(x, y, h, lbl) { return lbl.map(function (t) { return '<div style="position:absolute;left:' + x + 'px;top:' + Math.round(y + t[1] * h - 6) + 'px;font-size:10px;color:#d9dcdf">' + t[0] + '</div>'; }).join(''); }
    function dynCommon(ctx, s, kind, g, flt) {
      var pre = s.pre, b = '', LV = [['Clip', 0], ['-2', 0.04], ['-6', 0.1], ['-12', 0.2], ['-18', 0.3], ['-30', 0.5], ['-42', 0.7], ['-60', 1]];
      b += sec(4, 4, 92, 'INPUT LEVEL') + '<div style="position:absolute;left:4px;top:24px;width:92px;height:296px;background:#3d4146"></div>' + mv('sel', 30, 34, 22, 270) + scaleV(58, 34, 270, LV);
      b += gph(102, 6, 196, 238, xferSvg(kind, o0(s), 192, 234, ctx, true)) + mv(kind === 'gate' ? 'selgt' : 'selgr', 302, 6, 18, 238, kind === 'gate' ? 'gt' : 'gr') + scaleV(324, 6, 238, [['-6', 0.1], ['-18', 0.3], ['-30', 0.5], ['-48', 0.8]]);
      // FILTER · KEY SOURCE
      var ft = flt.type || '3.0', bp = !/^(LC|HC)/.test(ft), ic = function (t, on, svg) { return '<div ' + ctx.A(function () { SET(pre + '.' + kind + '.filter.type', t); }) + ' style="width:16px;height:14px;margin-bottom:3px;border:1px solid #9aa0a6;background:' + (on ? '#f5b400' : '#1c1e20') + ';display:flex;align-items:center;justify-content:center">' + svg + '</div>'; };
      b += '<div style="position:absolute;left:410px;top:128px;width:378px;height:1px;background:#6d7278"></div>';
      b += sbtn('FILTER', flt.on, ctx.A(pTog(pre + '.' + kind + '.filter.on')), 430, 140, 58) + vbox(fHz(flt.freq || 1000).replace(/ (k?Hz)$/, ''), '', 430, 166, 58) +
        knobAt(frLog(flt.freq || 1000, 20, 20000), 438, 190, 42, 'FREQ', ctx, tLog(pre + '.' + kind + '.filter.freq', 20, 20000, 200, 1000), 'Hz');
      b += at(504, 146, ic('LC6', ft === 'LC6', '<svg width="10" height="8"><path d="M0 8Q3 0 10 0" stroke="#fff" fill="none"/></svg>') + ic('LC12', ft === 'LC12', '<svg width="10" height="8"><path d="M1 8Q2 0 10 0" stroke="#fff" fill="none" stroke-width="1.6"/></svg>') + ic('HC6', ft === 'HC6', '<svg width="10" height="8"><path d="M0 0Q7 0 10 8" stroke="#fff" fill="none"/></svg>') + ic('HC12', ft === 'HC12', '<svg width="10" height="8"><path d="M0 0Q8 0 9 8" stroke="#fff" fill="none" stroke-width="1.6"/></svg>') + ic('3.0', bp, '<svg width="10" height="8"><path d="M0 8L5 1 10 8" stroke="' + (bp ? '#111' : '#fff') + '" fill="none" stroke-width="1.6"/></svg>'));
      b += vbox(bp ? ft : '-', '', 540, 166, 46) + knobAt(bp ? Math.max(0, ['1.0', '2.0', '3.0', '5.0', '10.0'].indexOf(ft)) / 4 : 0, 544, 190, 42, 'SLOPE/Q', ctx, tList(pre + '.' + kind + '.filter.type', FILT_TYPES), 'Hz');
      var KS = KEYSRC(), kcur = Math.max(0, KS.indexOf(g.keySrc || 'SELF'));
      b += '<div class="cap" style="position:absolute;left:646px;top:136px;width:142px;font-size:12px">┌ KEY SOURCE ┐</div>' + listHtml(KS.map(function (k) { return k === 'SELF' ? 'Self' : k.replace(/^CH (\d+)/, 'Channel $1'); }), kcur, kcur, 652, 152, 136, 9, ctx, function (k) { SET(pre + '.' + kind + '.keySrc', KS[k]); });
      return b;
    }
    function o0(s) { return s.o; }
    function atkKnobs(ctx, base, g, dyn) {   // 위 오른쪽: ATTACK · HOLD · RELEASE (+ DYN 은 GAIN · MIX)
      var K = [['ATTACK', g.attack, frLin(g.attack, 0, 120), tNum(base + '.attack', 0, dyn ? 1 : 0.5, 0)], ['HOLD', g.hold, frLog(g.hold, 0.02, 2000), tLog(base + '.hold', 0.02, 2000, 100, dyn ? 10 : 50)], ['RELEASE', g.release, frLog(g.release, 5, 4000), tLog(base + '.release', 5, 4000, 100, dyn ? 100 : 200)]];
      K[0][3] = tNum(base + '.attack', 0, 120, dyn ? 1 : 0.5);
      var b = '', x0 = dyn ? 404 : 430, sp = dyn ? 66 : 74;
      K.forEach(function (k, i) { var x = x0 + i * sp; b += vbox(+k[1] < 10 ? (+k[1]).toFixed(2).replace(/0$/, '') : String(Math.round(+k[1])), '', x, 12, 46) + knobAt(k[2], x + 2, 36, 42, k[0], ctx, k[3], 'ms'); });
      if (dyn) { var x4 = x0 + 3 * sp; b += vbox(fDbI(g.gain).replace('−', '-'), '', x4, 12, 46) + knobAt(frLin(g.gain, 0, 24), x4 + 2, 36, 42, 'GAIN', ctx, tNum(base + '.gain', 0, 24, 0.5), 'dB') + sbtn('AUTO', g.auto, ctx.A(pTog(base + '.auto')), x4 + 64, 12, 44) +
        vbox((g.mix == null ? 100 : g.mix) + '', '%', x4 + 64, 36, 32); }
      return b;
    }
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
        /* FW4 HOME 탭: IN | GATE | EQ | DYNAMICS | INS | OUT | AUTO | BUS SENDS → 단추 줄 → 값 칸 → 노브 → SAFE · DCAs · MUTE GROUPS */
        var mn = o.main || {}, ins = o.insert, sd = o.sends || o.mtxSends || [], lk = linkKey(s), safeP = 'config.scenes.safe.ch.' + pre.replace('.', '_');
        b += sec(4, 4, 92, 'IN') + sec(100, 4, 112, 'GATE') + sec(216, 4, 176, 'EQ') + sec(396, 4, 112, 'DYNAMICS') + sec(512, 4, 56, 'INS') + sec(572, 4, 40, 'OUT') + sec(616, 4, 46, 'AUTO') + sec(666, 4, 126, o.sends ? 'BUS SENDS' : 'MATRIX');
        if (isIn) {
          b += mv('sel', 6, 30, 14, 98) + at(4, 26, '', 'width:92px;height:104px;background:#3d4146;z-index:-1');
          b += icoBtn(IC_48, '48V', pa.phantom, ctx.A(pTog(pre + '.preamp.phantom')), 26, 32, true) + icoBtn(IC_PH, 'INVERT', pa.invert, ctx.A(pTog(pre + '.preamp.invert')), 26, 56) +
            icoBtn(IC_DL, 'DELAY', pa.delay && pa.delay.on, ctx.A(pTog(pre + '.preamp.delay.on')), 26, 84) + icoBtn(IC_LC, 'LOCUT', pa.lowcut && pa.lowcut.on, ctx.A(pTog(pre + '.preamp.lowcut.on')), 26, 108);
          b += sbtn('LINK', lk && !!G(lk), lk ? ctx.A(function () { SET(lk, !G(lk)); }) : '', 22, 140, 56) + vbox(fDbI(pa.gain).replace('−', '-'), '', 22, 164, 56) +
            knobAt(frLin(pa.gain, -12, 60), 29, 188, 42, 'GAIN', ctx, tNum(pre + '.preamp.gain', -12, 60, 0.5));
        } else b += at(4, 26, '<div style="width:92px;height:104px;background:#3d4146"></div>');
        if (g) {
          b += gph(102, 28, 92, 100, xferSvg('gate', o, 88, 96, ctx), ctx.A(function () { setTab('home', 'gate'); })) + mv('selgt', 196, 28, 14, 100, 'gt') +
            sbtn('GATE', g.on, ctx.A(pTog(pre + '.gate.on')), 126, 140, 60) + vbox(fDbI(g.thr).replace('−', '-'), '', 126, 164, 60) +
            knobAt(frLin(g.thr, -80, 0), 135, 188, 42, 'THRESH', ctx, tNum(pre + '.gate.thr', -80, 0, 0.5));
        }
        if (o.eq) b += gph(218, 28, 172, 100, eqSvg(o, 168, 96, ctx), ctx.A(function () { setTab('home', 'eq'); })) + sbtn('EQ', eq.on !== false, ctx.A(pTog(pre + '.eq.on')), 274, 140, 60);
        if (d) {
          b += gph(398, 28, 92, 100, xferSvg('dyn', o, 88, 96, ctx), ctx.A(function () { setTab('home', 'dyn'); })) + mv('selgr', 492, 28, 14, 100, 'gr') +
            sbtn(d.mode === 'EXP' ? 'EXP' : 'COMP', d.on, ctx.A(pTog(pre + '.dyn.on')), 420, 140, 60) + vbox(fDbI(d.thr).replace('−', '-'), '', 420, 164, 60) +
            knobAt(frLin(d.thr, -60, 0), 429, 188, 42, 'THRESH', ctx, tNum(pre + '.dyn.thr', -60, 0, 0.5));
        }
        if (ins) {
          var ion = !!ins.on, post = (ins.pos || 'POST') === 'POST';
          b += '<svg style="position:absolute;left:512px;top:28px" width="56" height="100" viewBox="0 0 56 100"><path d="M0 46H56" stroke="#9aa0a6" stroke-width="1.5"/><circle cx="18" cy="46" r="4" fill="#3d4146" stroke="#c9ccd0" stroke-width="1.5"/><circle cx="38" cy="46" r="4" fill="#3d4146" stroke="#c9ccd0" stroke-width="1.5"/>' +
            '<path d="M18 46v40M38 46v40" stroke="' + (ion ? '#f5b400' : '#c9ccd0') + '" stroke-width="1.5" stroke-dasharray="' + (ion ? '0' : '3 3') + '"/><text x="28" y="' + (post ? 20 : 20) + '" fill="#d9dcdf" font-size="10" text-anchor="middle">' + (post ? 'POST' : 'PRE') + '</text></svg>' +
            sbtn('INS', ion, ctx.A(pTog(pre + '.insert.on')), 514, 140, 52);
        }
        if (o.fader != null) {
          var ff = db2f(o.fader);
          b += '<div style="position:absolute;left:576px;top:30px;width:4px;height:96px;background:#1a1b1d"></div><div ' + ctx.D({ type: 'fader', path: pre + '.fader' }) + ' style="position:absolute;left:572px;top:28px;width:16px;height:100px"><div style="position:absolute;left:0;top:' + Math.round((1 - ff) * 88) + 'px;width:16px;height:12px;background:linear-gradient(#f2f2f2,#9da1a5);border:1px solid #222"></div></div>' +
            '<div style="position:absolute;left:574px;top:' + (28 + Math.round((1 - ff) * 88) + 12) + 'px;width:4px;height:' + Math.max(0, 100 - Math.round((1 - ff) * 88) - 12) + 'px;background:#f5b400"></div>' + mv('sel', 594, 28, 14, 100);
        }
        if (o.main) {
          b += sbtn('X', false, '', 642, 30, 18, 18, 'dk') + sbtn('Y', false, '', 642, 52, 18, 18, 'dk') + '<div style="position:absolute;left:620px;top:30px;width:18px;height:40px;background:#111;border:1px solid #5d6268"></div>' +
            sbtn('MONO', mn.mono, ctx.A(pTog(pre + '.main.mono')), 616, 84, 46, 16, 'dk') + sbtn('SUB', false, '', 616, 106, 46, 18) +
            sbtn('LR', mn.st, ctx.A(pTog(pre + '.main.st')), 590, 140, 52) + vbox(fPan(mn.pan).replace(/^C$/, '+0'), '', 590, 164, 52) +
            knobAt(frLin(mn.pan, -100, 100), 595, 188, 42, 'PAN', ctx, tNum(pre + '.main.pan', -100, 100, 2));
        }
        // BUS SENDS 1-16 (또는 매트릭스 1-6)
        var rowH = Math.floor(292 / Math.max(6, sd.length || 16));
        b += at(668, 28, sd.map(function (sn, k) { var f = sn.on === false ? 0 : db2f(sn.level); return '<div style="display:flex;align-items:center;gap:3px;height:' + (rowH - 2) + 'px;margin-bottom:2px" ' + ctx.A(function () { setTab('home', 'sends'); }) + '><span style="width:20px;height:100%;border:1px solid #c9ccd0;font-size:10px;line-height:' + (rowH - 4) + 'px;text-align:center;color:#fff">' + (k + 1) + '</span><span style="flex:1;height:100%;background:#151618;border:1px solid #2a2d30;position:relative"><i style="position:absolute;left:0;top:0;bottom:0;width:' + Math.round(f * 100) + '%;background:' + (/PRE|IN/.test(sn.tap || '') ? '#5bb0e0' : '#2fb344') + '"></i></span></div>'; }).join(''), 'width:122px');
        // 아래 줄: SAFE · DCAs · MUTE GROUPS
        b += sbtn('SAFE', !!G(safeP), ctx.A(function () { SET(safeP, !G(safeP)); }), 4, 284, 80, 34, 'big2') +
          (o.dca ? '<div style="position:absolute;left:90px;top:284px;width:286px;height:34px;border:1px solid #2a2d30;background:#3d4146;display:flex;align-items:center;gap:5px;padding:0 6px"><span style="font-size:13px;font-weight:700;margin-right:4px">DCAs</span>' + o.dca.map(function (on, k) { return '<span class="btn dk' + (on ? ' on' : '') + '" style="width:23px;height:22px;padding:0;font-size:13px' + (ui.dcaSel === k && L === 1 ? ';box-shadow:0 0 0 2px #f5a623' : '') + '" ' + ctx.A(pTog(pre + '.dca.' + k)) + '>' + (k + 1) + '</span>'; }).join('') + '</div>' : '') +
          (o.muteGrp ? '<div style="position:absolute;left:380px;top:284px;width:282px;height:34px;border:1px solid #2a2d30;background:#3d4146;display:flex;align-items:center;gap:5px;padding:0 6px"><span style="font-size:13px;font-weight:700;margin-right:4px">MUTE GROUPS</span>' + o.muteGrp.map(function (on, k) { return '<span class="btn dk' + (on ? ' on' : '') + '" style="width:23px;height:22px;padding:0;font-size:13px' + (ui.mgSel === k && L === 1 ? ';box-shadow:0 0 0 2px #f5a623' : '') + '" ' + ctx.A(pTog(pre + '.muteGrp.' + k)) + '>' + (k + 1) + '</span>'; }).join('') + '</div>' : '');
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
        /* FW4 CONFIG 탭: INPUT SECTION(입력 미터 · SOURCE 목록 · 48V/INVERT · LINK · GAIN) | DELAY | LOW CUT | INSERT(PRE · INS · POST, 목록) + 위쪽 신호 흐름 줄 */
        var dly = pa.delay || {}, lc0 = pa.lowcut || {}, ins0 = o.insert, dms = +dly.ms || 0;
        b += sec(4, 4, 262, 'INPUT SECTION') + sec(272, 4, 120, 'DELAY') + sec(398, 4, 120, 'LOW CUT') + sec(524, 4, 268, 'INSERT');
        // 신호 흐름 줄(위)
        var blk = function (x, w, svg, on, a) { return '<div ' + (a || '') + ' style="position:absolute;left:' + x + 'px;top:36px;width:' + w + 'px;height:20px;background:' + (on ? '#f5b400' : '#3d4146') + ';border:1px solid #c9ccd0;display:flex;align-items:center;justify-content:center">' + svg + '</div>'; };
        b += '<div style="position:absolute;left:268px;top:46px;width:524px;height:1px;background:#c9ccd0"></div>' +
          blk(320, 24, IC_DL, false, ctx.A(pTog(pre + '.preamp.delay.on'))) + blk(446, 24, IC_LC, false, ctx.A(pTog(pre + '.preamp.lowcut.on'))) +
          (ins0 ? blk(538, 22, IC_LC, false) + blk(600, 44, '<svg width="34" height="12" viewBox="0 0 34 12" fill="none" stroke="#fff" stroke-width="1.5"><path d="M1 9q8-8 16 0t16 0"/></svg>', false, ctx.A(function () { setTab('home', 'eq'); })) + blk(676, 22, '<svg width="14" height="12" viewBox="0 0 14 12" fill="none" stroke="#fff" stroke-width="1.6"><path d="M1 11q5-10 12-10"/></svg>', false, ctx.A(function () { setTab('home', 'dyn'); })) + blk(738, 44, '<svg width="22" height="10" viewBox="0 0 22 10" fill="none" stroke="#fff" stroke-width="1.5"><path d="M1 5h20"/><rect x="7" y="1" width="8" height="8" fill="#3d4146"/></svg>', false) +
            '<div style="position:absolute;left:' + ((ins0.pos || 'POST') === 'PRE' ? 548 : 686) + 'px;top:56px;width:1px;height:26px;border-left:1px dotted #c9ccd0"></div>' : '') +
          '<div style="position:absolute;left:331px;top:56px;width:1px;height:28px;border-left:1px dotted #c9ccd0"></div><div style="position:absolute;left:457px;top:56px;width:1px;height:28px;border-left:1px dotted #c9ccd0"></div>';
        if (isIn) {
          b += mh('sel', 10, 30, 250, 14) + at(10, 46, '<div style="position:relative;width:250px;height:12px;font-size:10px;color:#d9dcdf">' + [[-42, 0.3], [-18, 0.7], [-12, 0.8], [-6, 0.9], [-2, 0.966]].map(function (t) { return '<span style="position:absolute;left:' + Math.round(t[1] * 250 - 8) + 'px">' + t[0] + '</span>'; }).join('') + '<span style="position:absolute;right:0">Clip</span></div>');
          var SLL = SL.map(function (x, k) { return k === 0 ? 'OFF' : pad2(k) + ' : ' + x.l.replace(/\s+/g, ''); });
          b += '<div class="cap" style="position:absolute;left:14px;top:62px;width:104px;font-size:12px">┌ SOURCE ┐</div>' + listHtml(SLL, si, shi, 12, 78, 106, 13, ctx, function (k) { if (ui.srcHi === k) SET(pre + '.source', SL[k].v); ui.srcHi = k; touch(); });
          b += icoBtn(IC_48, '48V', pa.phantom, ctx.A(pTog(pre + '.preamp.phantom')), 134, 88, true) + icoBtn(IC_PH, 'INVERT', pa.invert, ctx.A(pTog(pre + '.preamp.invert')), 134, 114);
          b += sbtn('LINK', !!G(linkKey(s)), ctx.A(function () { var k = linkKey(s); if (k) SET(k, !G(k)); }), 150, 150, 52) + vbox(fDbI(pa.gain).replace('−', '-'), 'dB', 146, 174, 50) +
            knobAt(frLin(pa.gain, -12, 60), 154, 200, 44, 'GAIN', ctx, tNum(pre + '.preamp.gain', -12, 60, 0.5));
          if (s.t === 'ch' && m.inputSource) { var is = m.inputSource(s.i); b += at(128, 284, '<span style="font-size:11px;color:#d9dcdf">' + esc(SL[si].l) + ' ← </span><span class="vb" style="font-size:12px;height:16px;line-height:16px;' + (is.live ? '' : 'background:#f5b400') + '">' + esc(is.block ? blkLabel(is.kind + ' ' + is.n) : '—') + (is.live ? '' : ' (no signal)') + '</span>'); }
          // DELAY
          b += sbtn('DELAY', dly.on, ctx.A(pTog(pre + '.preamp.delay.on')), 306, 86, 54) + vbox((dms * 1.125).toFixed(1), 'ft', 300, 110, 46) + vbox((dms * 0.343).toFixed(2), 'm', 300, 132, 46) + vbox(dms < 10 ? dms.toFixed(1) : String(Math.round(dms)), 'ms', 300, 154, 46) +
            knobAt(frLog(dms || 0.3, 0.3, 500), 310, 200, 44, 'DELAY', ctx, tLog(pre + '.preamp.delay.ms', 0.3, 500, 120, 0.3));
          // LOW CUT
          b += sbtn('LOCUT', lc0.on, ctx.A(pTog(pre + '.preamp.lowcut.on')), 412, 86, 56) + vbox(String(Math.round(lc0.freq || 100)), 'Hz', 474, 86, 40) +
            gph(404, 112, 236, 168, '<div style="margin-top:6px">' + lcSvg(lc0, 216, 150) + '</div>', ctx.D({ type: 'knob', turn: tLog(pre + '.preamp.lowcut.freq', 20, 400, 100, 100) }));
        } else b += at(10, 40, '<div class="dim" style="font-size:13px">' + esc(s.id) + (o.stereoLinkWithNext != null ? '' : '') + '</div>') + (o.stereoLinkWithNext != null ? sbtn('LINK', o.stereoLinkWithNext, ctx.A(pTog(pre + '.stereoLinkWithNext')), 20, 70, 60) : '');
        if (ins0) {
          var ihh = ui.insHi == null ? INS_SEL.indexOf(ins0.sel || 'OFF') : ui.insHi, ipos = ins0.pos || 'POST';
          b += sbtn('PRE', ipos === 'PRE', ctx.A(function () { SET(pre + '.insert.pos', 'PRE'); }), 548, 88, 46, 18, 'dk') + sbtn('INS', ins0.on, ctx.A(pTog(pre + '.insert.on')), 618, 88, 46) + sbtn('POST', ipos === 'POST', ctx.A(function () { SET(pre + '.insert.pos', 'POST'); }), 688, 88, 46, 18, 'dk') +
            '<div class="cap" style="position:absolute;left:652px;top:118px;width:136px;font-size:12px">┌ INSERT ┐</div>' +
            listHtml(INS_SEL.map(function (x) { return x === 'OFF' ? 'OFF' : '[' + x.replace(/^FX(\d)([LR])$/, 'Fx$1$2') + ']'; }), INS_SEL.indexOf(ins0.sel || 'OFF'), ihh, 652, 134, 136, 10, ctx, function (k) { if (ui.insHi === k) SET(pre + '.insert.sel', INS_SEL[k]); ui.insHi = k; touch(); });
        }
        if (L2 === 0) enc = [   // FW4 순서: Source(SELECT) · Gain(LINK) · Delay(DELAY) · Lo Cut(LOW CUT) · Ins Pos(INSERT) · Insert(CONNECT)
          isIn ? E('Source', (function (k) { return k === 0 ? 'OFF' : SL[k].l.replace(/^In /, 'Ch'); })(shi), function (dd) { ui.srcHi = clamp((ui.srcHi == null ? si : ui.srcHi) + dd, 0, SL.length - 1); touch(); }, function () { SET(pre + '.source', SL[ui.srcHi == null ? si : ui.srcHi].v); }, { pl: 'SELECT', on: shi !== si }) : NOE,
          isIn ? E('Gain', fDb(pa.gain, 1), tNum(pre + '.preamp.gain', -12, 60, 0.5), function () { var k = linkKey(s); if (k) SET(k, !G(k)); }, { f: frLin(pa.gain, -12, 60), pl: 'LINK', on: !!G(linkKey(s)) }) : E('Link', o.stereoLinkWithNext ? 'ON' : 'OFF', null, o.stereoLinkWithNext != null ? pTog(pre + '.stereoLinkWithNext') : null, { pl: 'LINK', on: o.stereoLinkWithNext }),
          isIn ? E('Delay', fMs(pa.delay && pa.delay.ms), tLog(pre + '.preamp.delay.ms', 0.3, 500, 120, 0.3), pTog(pre + '.preamp.delay.on'), { f: frLog(pa.delay && pa.delay.ms, 0.3, 500), pl: 'DELAY', on: pa.delay && pa.delay.on }) : NOE,
          isIn ? E('Lo Cut', fHz(pa.lowcut && pa.lowcut.freq), tLog(pre + '.preamp.lowcut.freq', 20, 400, 100, 100), pTog(pre + '.preamp.lowcut.on'), { f: frLog(pa.lowcut && pa.lowcut.freq, 20, 400), pl: 'LOW CUT', on: pa.lowcut && pa.lowcut.on }) : NOE,
          o.insert ? E('Ins Pos', o.insert.pos || 'POST', tList(pre + '.insert.pos', ['PRE', 'POST']), pTog(pre + '.insert.on'), { pl: 'INSERT', on: o.insert.on, ic: 'lr' }) : NOE,
          o.insert ? E('Insert', INS_SEL[ui.insHi == null ? INS_SEL.indexOf(o.insert.sel || 'OFF') : ui.insHi], function (dd) { ui.insHi = clamp((ui.insHi == null ? INS_SEL.indexOf(o.insert.sel || 'OFF') : ui.insHi) + dd, 0, INS_SEL.length - 1); touch(); }, function () { if (ui.insHi != null) SET(pre + '.insert.sel', INS_SEL[ui.insHi]); }, { pl: 'CONNECT' }) : NOE];
        else enc = [
          E('Icon', ICONS[clamp((o.icon | 0) - 1, 0, 73)], tNum(pre + '.icon', 1, 74, 1, 1), function () { openName(s.t, s.i); }, { pl: 'EDIT', f: frLin(o.icon || 1, 1, 74) }),
          E('Color', col(o.color).id, tNum(pre + '.color', 0, 15, 1, 0), null, { f: frLin(o.color || 0, 0, 15) }),
          E('Name', o.name || '—', null, function () { openName(s.t, s.i); }, { pl: 'EDIT' }),
          isIn ? E('48V', pa.phantom ? 'ON' : 'OFF', null, pTog(pre + '.preamp.phantom'), { pl: '48V', on: pa.phantom, pc: 'cr' }) : NOE,
          isIn ? E('Trim', fDb(pa.trim || 0, 1), tNum(pre + '.preamp.trim', -18, 18, 0.5, 0), null, { f: frLin(pa.trim || 0, -18, 18) }) : NOE,
          isIn ? E('Phase', pa.invert ? 'INV' : 'NORM', null, pTog(pre + '.preamp.invert'), { pl: 'Ø', on: pa.invert }) : NOE];
      }
      else if (id === 'gate' && g) {   /* FW4 GATE 탭: INPUT LEVEL | 전달 그래프 + 줄어든 양 미터 | ATTACK · HOLD · RELEASE | FILTER · KEY SOURCE */
        lay = 2; var L3 = layer(2), flt = g.filter || {};
        b += dynCommon(ctx, s, 'gate', g, flt);
        b += vbox(fDbI(g.thr).replace('−', '-'), 'dB', 106, 268, 52) + vbox(String(Math.round(+g.range)), 'dB', 190, 268, 44) + at(106, 252, '<span class="cap" style="font-size:12px">THRESH</span>') + at(190, 252, '<span class="cap" style="font-size:12px">RANGE</span>') +
          at(106, 296, GATE_MODES.map(function (md) { return '<span class="btn' + (g.mode === md ? ' on' : '') + '" style="width:36px;height:18px;margin-right:3px;font-size:11px" ' + ctx.A(function () { SET(pre + '.gate.mode', md); }) + '>' + md + '</span>'; }).join(''));
        b += atkKnobs(ctx, pre + '.gate', g, false);
        var gTh = E('Threshold', fDb(g.thr, 1), tNum(pre + '.gate.thr', -80, 0, 0.5), pTog(pre + '.gate.on'), { f: frLin(g.thr, -80, 0), pl: 'ACTIVE', on: g.on }),
          gMd = E('Mode', g.mode, tList(pre + '.gate.mode', GATE_MODES), null, { f: GATE_MODES.indexOf(g.mode) / 4 });
        enc = L3 === 0 ? [gTh, gMd,
          E('Attack', fMs(g.attack), tNum(pre + '.gate.attack', 0, 120, 0.5), null, { f: frLin(g.attack, 0, 120) }),
          E('Hold', fMs(g.hold), tLog(pre + '.gate.hold', 0.02, 2000, 100, 50), null, { f: frLog(g.hold, 0.02, 2000) }),
          E('Release', fMs(g.release), tLog(pre + '.gate.release', 5, 4000, 100, 200), null, { f: frLog(g.release, 5, 4000) }),
          E('Range', (+g.range).toFixed(1) + ' dB', tNum(pre + '.gate.range', 3, 60, 1), null, { f: frLin(g.range, 3, 60) })] : [gTh, gMd, NOE,
          E('Filter Freq', fHz(flt.freq || 1000), tLog(pre + '.gate.filter.freq', 20, 20000, 200, 1000), pTog(pre + '.gate.filter.on'), { f: frLog(flt.freq || 1000, 20, 20000), pl: 'FILTER', on: flt.on }),
          E('Filter Type', flt.type || '3.0', tList(pre + '.gate.filter.type', FILT_TYPES), null, { f: Math.max(0, FILT_TYPES.indexOf(flt.type || '3.0')) / (FILT_TYPES.length - 1) }),
          E('Key Source', g.keySrc || 'SELF', tList(pre + '.gate.keySrc', KEYSRC()), null)];
      }
      else if (id === 'dyn' && d) {   /* FW4 DYN 탭: 같은 짜임 + RATIO · KNEE · MODE(COMP/EXP · PEAK/RMS · LIN/LOG) · GAIN */
        lay = 2; var L4 = layer(2), df = d.filter || {}, dpos = Gd(pre + '.dyn.pos', 'POST');
        b += dynCommon(ctx, s, 'dyn', d, df);
        b += at(106, 252, '<span class="cap" style="font-size:12px">THRESH</span>') + at(176, 252, '<span class="cap" style="font-size:12px">RATIO</span>') + at(240, 252, '<span class="cap" style="font-size:12px">KNEE</span>') +
          vbox(fDbI(d.thr).replace('−', '-'), 'dB', 104, 268, 46) + vbox(fRatio(d.ratio).replace(':1', ''), '', 174, 268, 40) + vbox(String(d.knee), '', 238, 268, 28) +
          at(104, 296, [['COMP', d.mode === 'COMP', function () { SET(pre + '.dyn.mode', 'COMP'); }], ['EXP', d.mode === 'EXP', function () { SET(pre + '.dyn.mode', 'EXP'); }], ['PEAK', d.det === 'PEAK', function () { SET(pre + '.dyn.det', 'PEAK'); }], ['RMS', d.det === 'RMS', function () { SET(pre + '.dyn.det', 'RMS'); }], ['LIN', d.env === 'LIN', function () { SET(pre + '.dyn.env', 'LIN'); }], ['LOG', d.env === 'LOG', function () { SET(pre + '.dyn.env', 'LOG'); }]].map(function (x2) { return '<span class="btn' + (x2[1] ? ' on' : '') + '" style="width:31px;height:18px;margin-right:2px;font-size:11px" ' + ctx.A(x2[2]) + '>' + x2[0] + '</span>'; }).join(''));
        b += atkKnobs(ctx, pre + '.dyn', d, true);
        var dTh = E('Threshold', fDb(d.thr, 1), tNum(pre + '.dyn.thr', -60, 0, 0.5), pTog(pre + '.dyn.on'), { f: frLin(d.thr, -60, 0), pl: 'ACTIVE', on: d.on }),
          dRt = E('Ratio', fRatio(d.ratio), function (dd) { SET(pre + '.dyn.ratio', stepList(RATIOS, RATIOS.reduce(function (a2, r) { return Math.abs(r - d.ratio) < Math.abs(a2 - d.ratio) ? r : a2; }, RATIOS[0]), dd)); }, function () { SET(pre + '.dyn.mode', d.mode === 'COMP' ? 'EXP' : 'COMP'); }, { f: Math.max(0, RATIOS.indexOf(d.ratio)) / 11, pl: d.mode === 'EXP' ? 'EXP' : 'COMP', on: true });
        enc = L4 === 0 ? [dTh, dRt,
          E('Attack', fMs(d.attack), tNum(pre + '.dyn.attack', 0, 120, 1), function () { SET(pre + '.dyn.det', d.det === 'PEAK' ? 'RMS' : 'PEAK'); }, { f: frLin(d.attack, 0, 120), pl: d.det === 'RMS' ? 'RMS' : 'PEAK', on: true }),
          E('Hold', fMs(d.hold), tLog(pre + '.dyn.hold', 0.02, 2000, 100, 10), function () { SET(pre + '.dyn.env', d.env === 'LIN' ? 'LOG' : 'LIN'); }, { f: frLog(d.hold, 0.02, 2000), pl: d.env === 'LIN' ? 'LIN' : 'LOG', on: true }),
          E('Release', fMs(d.release), tLog(pre + '.dyn.release', 5, 4000, 100, 100), null, { f: frLog(d.release, 5, 4000) }),
          E('Gain', fDb(d.gain, 1), tNum(pre + '.dyn.gain', 0, 24, 0.5), pTog(pre + '.dyn.auto'), { f: frLin(d.gain, 0, 24), pl: 'AUTO', on: d.auto })] : [dTh, dRt,
          E('Knee', String(d.knee), tNum(pre + '.dyn.knee', 0, 5, 1), function () { SET(pre + '.dyn.pos', dpos === 'PRE' ? 'POST' : 'PRE'); }, { f: (d.knee || 0) / 5, pl: dpos === 'PRE' ? 'PRE EQ' : 'POST EQ', on: true }),
          E('Filter Freq', fHz(df.freq || 1000), tLog(pre + '.dyn.filter.freq', 20, 20000, 200, 1000), pTog(pre + '.dyn.filter.on'), { f: frLog(df.freq || 1000, 20, 20000), pl: 'FILTER', on: df.on }),
          E('Filter Type', df.type || '3.0', tList(pre + '.dyn.filter.type', FILT_TYPES), null, { f: Math.max(0, FILT_TYPES.indexOf(df.type || '3.0')) / (FILT_TYPES.length - 1) }),
          E('Key Source', d.keySrc || 'SELF', tList(pre + '.dyn.keySrc', KEYSRC()), null)];
      }
      else if (id === 'eq' && o.eq) {   /* FW4 EQ 탭: 큰 그래프(띠 번호 표시) + 오른쪽 띠 고르기 단추 + 아래 띠 칸(FREQ · GAIN · Q · MODE). 엔코더: Freq · Gain · Q · Mode · Select */
        lay = 1; var bands = eq.bands || [], nb = bands.length, names = nb > 4 ? ['LOW', 'LOW 2', 'LOW MID', 'HIGH MID', 'HIGH 2', 'HIGH'] : ['LOW', 'LOW MID', 'HIGH MID', 'HIGH'], cur = clamp(G('config.view.eqBand') | 0, 0, nb - 1), eon = eq.on !== false;
        var GW = 700, GH = 180;
        b += gph(4, 4, GW + 4, GH + 4, '<div data-eqsvg="1">' + eqBig(o, GW, GH, ctx, cur, names) + '</div>');
        // 오른쪽: EQ 켜기 + 띠 단추(위에서 아래로 HIGH → LOW)
        b += sbtn('EQ', eon, ctx.A(pTog(pre + '.eq.on')), 714, 6, 76, 20);
        range(nb).reverse().forEach(function (k, i) { b += sbtn(names[k], k === cur, ctx.A(function () { SET('config.view.eqBand', k); }), 714, 34 + i * 25, 76, 20, 'dk'); });
        // 아래 띠 칸
        var bw = Math.floor(792 / nb);
        bands.forEach(function (bd, k) {
          var x0 = 4 + k * bw, w0 = bw - 6, sel2 = k === cur, cut = bd.type === 'LCut' || bd.type === 'HCut', bp = pre + '.eq.bands.' + k;
          b += '<div ' + ctx.A(function () { SET('config.view.eqBand', k); }) + ' style="position:absolute;left:' + x0 + 'px;top:192px;width:' + w0 + 'px;height:128px;background:#2b2e31;border:' + (sel2 ? '2px solid #f5a623' : '1px solid #1d1f21') + '">' +
            '<div style="display:flex;height:22px;align-items:stretch;border-bottom:3px solid ' + bandC(nb, k) + '"><span style="width:22px;display:flex;align-items:center;justify-content:center;background:' + bandC(nb, k) + ';color:#111;font-weight:700">' + (k + 1) + '</span><span style="flex:1;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;color:#fff">' + names[k] + '</span></div>' +
            [['FREQ', fHz(bd.freq).replace(/ (k?Hz)$/, ''), / kHz$/.test(fHz(bd.freq)) ? 'kHz' : 'Hz'], ['GAIN', cut ? '—' : fDbI(bd.gain).replace('−', '-'), 'dB'], ['Q', cut ? '—' : (+bd.q).toFixed(1), ''], ['MODE', bd.type === 'PEQ' ? 'PEQ' : bd.type, '']].map(function (r, i) {
              return '<div style="position:absolute;left:6px;top:' + (30 + i * 24) + 'px;font-size:13px;font-weight:700;color:#fff">' + r[0] + '</div><div style="position:absolute;left:' + Math.round(w0 * 0.42) + 'px;top:' + (29 + i * 24) + 'px;display:flex;align-items:center"><span class="vb" style="min-width:' + Math.round(w0 * 0.34) + 'px;font-size:13px">' + esc(r[1]) + '</span>' + (r[2] ? '<span class="un">' + r[2] + '</span>' : '') + '</div>'; }).join('') + '</div>';
        });
        var cbd = bands[cur] || {}, cbp = pre + '.eq.bands.' + cur, ccut = cbd.type === 'LCut' || cbd.type === 'HCut';
        enc = [isIn ? E('Low Cut', fHz(pa.lowcut && pa.lowcut.freq), tLog(pre + '.preamp.lowcut.freq', 20, 400, 100, 100), pTog(pre + '.preamp.lowcut.on'), { f: frLog(pa.lowcut && pa.lowcut.freq, 20, 400), pl: 'LOW CUT', on: pa.lowcut && pa.lowcut.on }) : NOE,
          E('Freq', fHz(cbd.freq), tLog(cbp + '.freq', 20, 20000, 200), null, { f: frLog(cbd.freq, 20, 20000) }),
          E('Gain', ccut ? '—' : fDb(cbd.gain, 1), ccut ? null : tNum(cbp + '.gain', -15, 15, 0.25), function () { SET(cbp + '.gain', 0); }, { f: ccut ? 0.5 : frLin(cbd.gain, -15, 15), pl: 'RESET' }),
          E('Q', (+cbd.q).toFixed(1), function (dd) { tLog(cbp + '.q', 0.3, 10, 72)(-dd); }, null, { f: 1 - frLog(cbd.q, 0.3, 10) }),
          E('Mode', cbd.type, tList(cbp + '.type', EQ_TYPES), function () { m.batch(function () { range(nb).forEach(function (k) { SET(pre + '.eq.bands.' + k + '.gain', 0); }); }); }, { pl: 'RESET ALL' }),
          E('Select', String(cur + 1), function (dd) { SET('config.view.eqBand', clamp(cur + dd, 0, nb - 1)); }, pTog(pre + '.eq.on'), { pl: 'EQ', on: eon })];
      }
      else if (id === 'sends' && (o.sends || o.mtxSends)) {
        var isMtx = !o.sends, sd2 = o.sends || o.mtxSends, ns = sd2.length, key = isMtx ? '.mtxSends.' : '.sends.';
        lay = isMtx ? 1 : 2; var L6 = layer(lay), fo = clamp(ui.sendFocus, 0, Math.max(0, ns - 4)), cwid = Math.floor(788 / ns);
        sd2.forEach(function (sn, k) {
          var x0 = 6 + k * cwid, inF = k >= fo && k < fo + 4, bname = isMtx ? 'MTX ' + (k + 1) : (m.label ? m.label('bus', k) : 'Bus ' + (k + 1));
          b += '<div class="bx" style="left:' + x0 + 'px;top:6px;width:' + (cwid - 3) + 'px;height:320px;' + (inF ? 'border-color:#f5a623;background:#14212c' : '') + '">' +
            '<div style="text-align:center;font-size:11px;font-weight:700;padding:3px 0;background:#232b34">' + (isMtx ? 'MX' : '') + (k + 1) + '</div><div style="text-align:center;font-size:10px;color:#d9dcdf;height:26px;overflow:hidden;padding:1px 2px;line-height:12px">' + esc(bname) + '</div>' +
            '<div style="position:absolute;left:' + Math.round(cwid / 2 - 9) + 'px;top:62px;width:6px;height:190px;background:#000;border-radius:3px" ' + ctx.D({ type: 'fader', path: pre + key + k + '.level', top: 62, hgt: 190 }) + '></div>' +
            '<div style="position:absolute;left:' + Math.round(cwid / 2 - 17) + 'px;top:' + (62 + Math.round((1 - db2f(sn.level)) * 190) - 6) + 'px;width:22px;height:12px;border-radius:2px;background:' + (sn.on === false ? '#9aa0a6' : '#e6ebf0') + ';pointer-events:none"></div>' +
            mv('send:' + k, Math.round(cwid / 2 + 6), 62, 5, 190) +
            '<div style="position:absolute;left:0;right:0;top:258px;text-align:center;font-size:11px;font-weight:700">' + fDbI(sn.level) + '</div>' +
            '<div style="position:absolute;left:3px;right:3px;top:276px;text-align:center"><span class="led ' + (sn.on === false ? '' : 'on') + '" style="min-width:0;width:100%" ' + ctx.A(pTog(pre + key + k + '.on')) + '>' + (sn.on === false ? 'OFF' : 'ON') + '</span></div>' +
            (isMtx ? '' : '<div style="position:absolute;left:0;right:0;top:298px;text-align:center;font-size:10px;color:#f5b400" ' + ctx.A(function () { SET(pre + key + k + '.tap', stepList(TAPS, sn.tap, 1) === sn.tap ? TAPS[0] : stepList(TAPS, sn.tap, 1)); }) + '>' + esc(TAPLBL[sn.tap] || sn.tap || '') + '</div>') + '</div>';
        });
        var focusE = E('Focus', (isMtx ? 'MX ' : 'Bus ') + (fo + 1) + '-' + (fo + 4), function (dd) { ui.sendFocus = clamp(fo + dd * 2, 0, Math.max(0, ns - 4)); if (!isMtx) SET('config.view.sendBank', Math.floor(ui.sendFocus / 4)); touch(); }, function () { ui.sendFocus = fo + 4 > ns - 4 ? 0 : fo + 4; if (!isMtx) SET('config.view.sendBank', Math.floor(ui.sendFocus / 4)); touch(); }, { pl: '+4' });
        if (L6 === 0) enc = range(4).map(function (j) { var k = fo + j, sn = sd2[k]; return sn ? E((isMtx ? 'Mtx ' : 'Bus ') + (k + 1), fDb(sn.level, 1), tFader(pre + key + k + '.level'), pTog(pre + key + k + '.on'), { f: db2f(sn.level), pl: 'ON', on: sn.on !== false, pc: 'cg' }) : NOE; }).concat([NOE, focusE]);
        else enc = [E('Tap ' + (fo + 1) + '-' + (fo + 2), TAPLBL[sd2[fo].tap] || sd2[fo].tap, function (dd) { var t = stepList(TAPS, sd2[fo].tap, dd); m.batch(function () { SET(pre + key + fo + '.tap', t); SET(pre + key + (fo + 1) + '.tap', t); }); }, null), NOE,
          E('Tap ' + (fo + 3) + '-' + (fo + 4), TAPLBL[sd2[fo + 2].tap] || sd2[fo + 2].tap, function (dd) { var t = stepList(TAPS, sd2[fo + 2].tap, dd); m.batch(function () { SET(pre + key + (fo + 2) + '.tap', t); SET(pre + key + (fo + 3) + '.tap', t); }); }, null), NOE, NOE, focusE];
      }
      else { // main
        var mn = o.main || {}, fpos = db2f(o.fader);
        b += bx(6, 6, 260, 150, 'Stereo (LR) ' + (o.main ? led(mn.st, mn.st ? 'ON' : 'OFF', '', ctx.A(pTog(pre + '.main.st'))) : ''), '<div style="padding:10px"><div class="dim" style="font-size:11px">PAN / BAL</div><div class="big">' + fPan(o.main ? mn.pan : o.pan) + '</div>' +
          '<div style="position:relative;height:16px;margin-top:10px;background:#000;border-radius:8px" ' + ctx.D({ type: 'hslider', path: pre + (o.main ? '.main.pan' : '.pan'), lo: -100, hi: 100, step: 2 }) + '><div style="position:absolute;left:50%;top:0;bottom:0;width:1px;background:#444"></div><div style="position:absolute;top:-3px;width:14px;height:22px;border-radius:3px;background:#f5a623;left:calc(' + ((((o.main ? mn.pan : o.pan) || 0) + 100) / 2) + '% - 7px)"></div></div></div>');
        if (o.main) b += bx(6, 162, 260, 164, 'Mono / Center ' + led(mn.mono, mn.mono ? 'ON' : 'OFF', '', ctx.A(pTog(pre + '.main.mono'))), '<div style="padding:10px"><div class="dim" style="font-size:11px">M/C LEVEL</div><div class="big">' + fDb(mn.mlevel, 1) + '</div>' +
          '<div style="position:relative;height:16px;margin-top:10px;background:#000;border-radius:8px" ' + ctx.D({ type: 'hfader', path: pre + '.main.mlevel' }) + '><div style="position:absolute;top:-3px;width:14px;height:22px;border-radius:3px;background:#e6ebf0;left:calc(' + (db2f(mn.mlevel) * 100) + '% - 7px)"></div></div></div>');
        b += bx(272, 6, 170, 320, 'Fader', '<div style="position:absolute;left:24px;top:36px;width:8px;height:240px;background:#000;border-radius:4px" ' + ctx.D({ type: 'fader', path: pre + '.fader', top: 36, hgt: 240 }) + '></div>' +
          '<div style="position:absolute;left:12px;top:' + (36 + Math.round((1 - fpos) * 240) - 9) + 'px;width:32px;height:18px;border-radius:3px;background:linear-gradient(#f4f5f7,#9ea2aa);pointer-events:none"></div>' + mv('sel', 52, 36, 10, 240) +
          [10, 5, 0, -10, -20, -30, -40, -60].map(function (dd) { return '<div class="dim" style="position:absolute;left:70px;font-size:10px;top:' + (36 + Math.round((1 - db2f(dd)) * 240) - 6) + 'px">' + (dd > 0 ? '+' : '') + dd + '</div>'; }).join('') +
          '<div style="position:absolute;left:96px;top:40px"><div class="big">' + fDbI(o.fader) + '</div><div class="dim" style="font-size:11px">dB</div></div>' +
          '<div style="position:absolute;left:96px;top:120px;display:flex;flex-direction:column;gap:6px"><span class="btn r' + (o.mute ? ' on' : '') + '" ' + ctx.A(pTog(pre + '.mute')) + '>MUTE</span><span class="btn' + (o.solo ? ' on' : '') + '" ' + ctx.A(pTog(pre + '.solo')) + '>SOLO</span></div>');
        if (o.dca) b += bx(448, 6, 346, 156, 'DCA Assign', '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:5px;padding:7px">' + o.dca.map(function (on, k) { return '<span class="btn' + (on ? ' on' : '') + '" style="flex-direction:column;height:54px' + (ui.dcaSel === k ? ';outline:2px solid #f5a623' : '') + '" ' + ctx.A(pTog(pre + '.dca.' + k)) + '><b>DCA ' + (k + 1) + '</b><small style="font-size:10px;font-weight:400;max-width:70px;overflow:hidden;text-overflow:ellipsis">' + esc(G('dca.' + k + '.name') || '') + '</small></span>'; }).join('') + '</div>');
        if (o.muteGrp) b += bx(448, 168, 346, 158, 'Mute Group Assign', '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5px;padding:7px">' + o.muteGrp.map(function (on, k) { return '<span class="btn r' + (on ? ' on' : '') + '" style="flex-direction:column;height:56px' + (ui.mgSel === k ? ';outline:2px solid #f5a623' : '') + '" ' + ctx.A(pTog(pre + '.muteGrp.' + k)) + '><b>MG ' + (k + 1) + '</b><small style="font-size:10px;font-weight:400">' + esc(G('muteGroups.' + k + '.name') || '') + '</small></span>'; }).join('') + '</div>');
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
    function logXs(w) { var xs = []; [20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000].forEach(function (f) { xs.push(+fx2x(f, w).toFixed(1)); }); return xs; }
    function lcSvg(lc, w, h) {   // FW4: 검정 판 · 촘촘한 로그 격자 · 노랑 선
      var c = biq('LCut', (lc && lc.freq) || 100, 0, 0.707), pts = []; for (var i = 0; i <= 60; i++) { var f = 20 * Math.pow(1000, i / 60), d = lc && lc.on ? magDb(c, f) : 0; pts.push((i / 60 * w).toFixed(1) + ',' + (10 - clamp(d, -36, 3) / 36 * (h - 14)).toFixed(1)); }
      return '<svg width="' + w + '" height="' + h + '" style="display:block;margin:0 auto">' + svgGrid(w, h, logXs(w), range(7).map(function (k) { return Math.round(k * h / 6); })) + '<polyline points="' + pts.join(' ') + '" fill="none" stroke="' + (lc && lc.on ? '#f5b400' : '#9aa0a6') + '" stroke-width="2"/></svg>';
    }
    var SEL_ORDER = [];
    ['ch', 32, 'aux', 8, 'fxr', 8, 'bus', 16, 'mtx', 6, 'main', 2, 'dca', 8].forEach(function (x, k, a) { if (k % 2 === 0) for (var i = 0; i < a[k + 1]; i++) SEL_ORDER.push({ type: x, index: i }); });
    function stepSel(d) { var s = sel(), k = 0; SEL_ORDER.forEach(function (x, i) { if (x.type === s.t && x.index === s.i) k = i; }); var n = SEL_ORDER[clamp(k + d, 0, SEL_ORDER.length - 1)]; if (m.select) m.select(n.type, n.index); else SET('config.selected', n); }

    /* ================================================================ METERS */
    function metersBuild(ctx) {
      var id = tabId('meters'), b = '', i, n;
      function row(keys, names, x0, y0, w, h, lbl) { var cw = w / keys.length, s = ''; keys.forEach(function (k, j) { var x = Math.round(x0 + j * cw); s += mv(k, x + 2, y0, Math.max(4, Math.round(cw) - 6), h) + '<div style="position:absolute;left:' + x + 'px;top:' + (y0 + h + 2) + 'px;width:' + Math.round(cw) + 'px;text-align:center;font-size:' + (cw < 26 ? 9 : 10) + 'px;font-weight:700;color:#cfd8e2;overflow:hidden;white-space:nowrap">' + esc(lbl[j]) + '</div>' + (cw >= 30 ? '<div style="position:absolute;left:' + x + 'px;top:' + (y0 + h + 14) + 'px;width:' + Math.round(cw) + 'px;text-align:center;font-size:9px;color:#c9ccd0;overflow:hidden;white-space:nowrap">' + esc(names[j] || '') + '</div>' : ''); }); return s; }
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
        /* FW4 RTA: 촘촘한 격자 그래프 + 파랑 막대(31밴드) · 아래 CHANNEL EQ DEFAULTS · GEQ DEFAULTS · RTA SOURCE */
        var rsrc = Gd('config.rta.source', 'Main LR'), has = m.meters && m.meters.rta && m.meters.rta.length, RW = 760, RH = 214, ry = function (d) { return Math.round((d + 36) / 36 * 0 + (-d / 36) * RH); };
        var rg = svgGrid(RW, RH, logXs(RW), [-6, -12, -18, -24, -30].map(function (d) { return Math.round(-d / 36 * RH); }));
        [[-6], [-12], [-18], [-24], [-30]].forEach(function (t) { rg += '<text x="-26" y="' + (Math.round(-t[0] / 36 * RH) + 4) + '" fill="#e6e8ea" font-size="10" font-weight="600">' + t[0] + '</text>'; });
        [[20, '20'], [40, '40'], [60, '60'], [80, '80'], [100, '100'], [200, '200'], [300, '300'], [400, '400'], [600, '600'], [800, '800'], [1000, '1k'], [2000, '2k'], [3000, '3k'], [4000, '4k'], [5000, '5k'], [6000, '6k'], [8000, '8k'], [10000, '10k'], [20000, '20k']].forEach(function (f) { rg += '<text x="' + (fx2x(f[0], RW) - 6).toFixed(0) + '" y="' + (RH + 13) + '" fill="#e6e8ea" font-size="10" font-weight="600">' + f[1] + '</text>'; });
        b += gph(4, 4, 792, 244, '<svg style="position:absolute;left:30px;top:6px;overflow:visible" width="' + RW + '" height="' + RH + '">' + rg + '<text x="' + (RW - 4) + '" y="14" text-anchor="end" fill="#fff" font-size="12" font-weight="700">' + esc(rsrc) + '</text></svg>' +
          '<div style="position:absolute;left:30px;top:6px;width:' + RW + 'px;height:' + RH + 'px">' + range(31).map(function (k) { var x0 = fx2x(GEQF[k] / 1.12, RW), x1 = fx2x(GEQF[k] * 1.12, RW); return '<div class="mv rta" data-mt="rta:' + k + '" style="left:' + x0.toFixed(0) + 'px;top:0;width:' + Math.max(3, x1 - x0 - 2).toFixed(0) + 'px;height:' + RH + 'px;background:transparent"><b></b></div>'; }).join('') + '</div>' +
          (has ? '' : '<div style="position:absolute;left:0;right:0;top:100px;text-align:center;color:#c9ccd0;font-size:14px">RTA: no signal</div>'));
        var preEq = !!G('config.rta.preEq'), spec = !!G('config.rta.spectro'), useRta = Gd('config.rta.geqUse', true), postGeq = !!G('config.rta.postGeq'), solo = Gd('config.rta.soloPrio', true);
        var chk = function (t, on, a2, x, y) { return '<div ' + a2 + ' style="position:absolute;left:' + x + 'px;top:' + y + 'px;display:flex;align-items:center;gap:5px;font-size:12px;font-weight:700;color:#fff;text-transform:uppercase"><span style="width:11px;height:11px;border:1px solid #c9ccd0;background:' + (on ? '#f5b400' : '#1c1e20') + '"></span>' + t + '</div>'; };
        b += sec(36, 256, 186, 'CHANNEL EQ DEFAULTS') + chk('PRE EQ', preEq, ctx.A(pTog('config.rta.preEq')), 40, 282) + chk('SPECTROGRAPH', spec, ctx.A(pTog('config.rta.spectro')), 112, 282) +
          sec(250, 256, 120, 'GEQ DEFAULTS') + chk('USE RTA SOURCE', useRta, ctx.A(function () { SET('config.rta.geqUse', !useRta); }), 250, 282) + chk('POST GEQ', postGeq, ctx.A(pTog('config.rta.postGeq')), 384, 262) + chk('SPECTROGRAPH', !!G('config.rta.geqSpec'), ctx.A(pTog('config.rta.geqSpec')), 384, 282) +
          sec(506, 256, 120, 'RTA SOURCE') + '<div ' + ctx.A(function () { SET('config.rta.soloPrio', !solo); }) + ' style="position:absolute;left:504px;top:278px;width:124px;height:20px;border:2px solid #f5a623"></div>' + chk('SOLO PRIORITY', solo, '', 510, 282) +
          listHtml(['Main LR', 'Solo', 'Ch Select'], ['Main LR', 'Solo', 'Ch Select'].indexOf(rsrc), ['Main LR', 'Solo', 'Ch Select'].indexOf(rsrc), 650, 256, 140, 3, ctx, function (k) { SET('config.rta.source', ['Main LR', 'Solo', 'Ch Select'][k]); });
      }
      var enc = [NOE, NOE, NOE, NOE, NOE, NOE];
      if (id === 'rta') { var ph = Gd('config.rta.peakHold', 2), dc = Gd('config.rta.decay', 8), gn = Gd('config.rta.gain', 18), ov = Gd('config.rta.overlay', 60);
        enc = [E('Select', rsrc === 'Main LR' ? 'MainLR' : rsrc === 'Solo' ? 'SPrio' : 'ChSel', tList('config.rta.source', ['Main LR', 'Solo', 'Ch Select']), null, { pl: 'SET', on: true }),
          E('Peak Hold', ph + 's', tNum('config.rta.peakHold', 0, 5, 1, 2), function () { SET('config.rta.mode', Gd('config.rta.mode', 'BAR') === 'BAR' ? 'SPEC' : 'BAR'); }, { f: ph / 5, pl: Gd('config.rta.mode', 'BAR'), on: true }),
          E('Decay', dc.toFixed(2) + ' s', tNum('config.rta.decay', 0.25, 16, 0.25, 8), function () { SET('config.rta.det', Gd('config.rta.det', 'RMS') === 'RMS' ? 'PEAK' : 'RMS'); }, { f: dc / 16, pl: Gd('config.rta.det', 'RMS'), on: true }),
          E('Gain', gn + ' dB', tNum('config.rta.gain', 0, 60, 1, 18), function () { SET('config.rta.autoGain', !G('config.rta.autoGain')); }, { f: gn / 60, pl: 'AUTO GAIN', on: !!G('config.rta.autoGain') }),
          E('EQ Overlay', ov + ' %', tNum('config.rta.overlay', 0, 100, 5, 60), pTog('config.rta.postOverlay'), { f: ov / 100, pl: G('config.rta.postOverlay') ? 'POST' : 'PRE', on: true }),
          E('Source', rsrc, tList('config.rta.source', ['Main LR', 'Solo', 'Ch Select']), null, { pl: 'COLOURED BARS' })]; }
      return { body: b, enc: enc, layers: 1 };
    }

    /* ================================================================ ROUTING */
    function routingBuild(ctx) {
      var id = tabId('routing'), b = '', enc = [], IB = inBlocks(), AB = auxBlocks();
      if (id === 'home') {
        var blocks = G('routing.input.blocks') || [], aux = G('routing.input.aux'), A = G('routing.aes50') || {};
        ['Inputs 1-8', 'Inputs 9-16', 'Inputs 17-24', 'Inputs 25-32', 'Aux In 1-6'].forEach(function (t, k) {
          var list = k < 4 ? IB : AB, cur = list.indexOf(k < 4 ? blocks[k] : aux), hi = ui.rtHi[k] == null ? cur : ui.rtHi[k], x = 6 + k * 158;
          b += bx(x, 6, 152, 290, t, '<div style="padding:3px 7px;font-size:11px;color:' + (noLink(k < 4 ? blocks[k] : aux) ? '#ff9f1c' : '#3ddc84') + ';font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(blkLabel(k < 4 ? blocks[k] : aux)) + (noLink(k < 4 ? blocks[k] : aux) ? ' (no link)' : '') + '</div>', ui.rtFocus === k ? ' style="left:' + x + 'px;top:6px;width:152px;height:290px;border-color:#f5a623"' : '');
          b += listHtml(list.map(blkLabel), cur, hi, x + 2, 48, 148, 15, ctx, function (j) { ui.rtFocus = k; if (ui.rtHi[k] === j) SET(k < 4 ? 'routing.input.blocks.' + k : 'routing.input.aux', list[j]); ui.rtHi[k] = j; touch(); });
        });
        b += '<div style="position:absolute;left:6px;top:302px;width:788px;height:24px;display:flex;gap:14px;align-items:center;font-size:12px;padding:0 8px;background:#3d4146;border:1px solid #2a2d30;border-radius:4px">' +
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
      b += bx(6, 6, 470, 320, title + bl, items.map(function (it, k) { var lab = per ? title + ' ' + pad2(k + 1) : title + ' ' + (id === 'xlr' ? (k * 4 + 1) + '-' + (k * 4 + 4) : (k * 8 + 1) + '-' + (k * 8 + 8)); var x = per && n > 8 ? (k < 8 ? 0 : 235) : 0, y = 24 + (per && n > 8 ? k % 8 : k) * (per ? 36 : rowsH + 4); return '<div ' + ctx.A(function () { ui.outFocus = k; ui.outHi = null; touch(); }) + ' style="position:absolute;left:' + (x + 6) + 'px;top:' + y + 'px;width:' + (per && n > 8 ? 222 : 456) + 'px;height:' + (per ? 32 : rowsH) + 'px;padding:2px 8px;border-radius:3px;background:' + (k === fo ? '#5b6168' : '#2b2e31') + ';border:1px solid ' + (k === fo ? '#f5a623' : '#2a2d30') + '"><div style="font-size:10px;color:#d9dcdf">' + esc(lab) + (per && it.tap ? ' · ' + esc(it.tap) : '') + '</div><div style="font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(blkLabel(it.src)) + '</div></div>'; }).join(''));
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
    function setRows(rows, ctx, x, y, w, rowH) { var s = ''; rows.forEach(function (r, k) { s += '<div style="position:absolute;left:' + x + 'px;top:' + (y + k * rowH) + 'px;width:' + w + 'px;height:' + (rowH - 3) + 'px;display:flex;align-items:center;gap:8px;padding:0 10px;background:' + (k === ui.setRow ? '#5b6168' : '#3d4146') + ';border:1px solid ' + (k === ui.setRow ? '#f5a623' : '#2a2d30') + '" ' + ctx.A(function () { ui.setRow = k; touch(); }) + '><span style="flex:1;color:#e6e8ea;font-size:12px">' + esc(r.l) + '</span><span class="btn" style="padding:1px 6px" ' + ctx.A(function () { ui.setRow = k; if (r.t) r.t(-1); }) + '>◀</span><b class="vb" style="min-width:150px;' + (k === ui.setRow ? 'box-shadow:0 0 0 2px #f5a623' : '') + '">' + esc(r.v) + '</b><span class="btn" style="padding:1px 6px" ' + ctx.A(function () { ui.setRow = k; if (r.t) r.t(1); else if (r.p) r.p(); }) + '>▶</span></div>'; }); return s; }
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
        b += bx(400, 6, 394, 320, 'Channel Link / Bus Pairing', '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;padding:6px">' + pairs.map(function (pp, k) { var on = !!G(pp.p); return '<span class="btn' + (on ? ' on' : '') + '" style="font-size:11px;padding:4px 0' + (ui.linkHi === k ? ';outline:2px solid #f5a623' : '') + '" ' + ctx.A(function () { ui.linkHi = k; SET(pp.p, !on); }) + '>' + pp.l + '</span>'; }).join('') + '</div>');
        enc = rowsEnc(rows); var lp = pairs[clamp(ui.linkHi, 0, pairs.length - 1)];
        enc[3] = E('Link Pair', lp.l + (G(lp.p) ? ' ●' : ''), function (d) { ui.linkHi = clamp(ui.linkHi + d, 0, pairs.length - 1); touch(); }, function () { SET(lp.p, !G(lp.p)); }, { pl: 'LINK', on: !!G(lp.p) });
        return { body: b, enc: enc, layers: 1 };
      }
      else if (id === 'remote') rows = [optRow('Remote Control', 'config.setup.remote', ['Off', 'HUI', 'Mackie', 'Generic CC'], 'Off'), optRow('Interface', 'config.setup.remoteIf', ['USB Card', 'MIDI', 'Ethernet'], 'USB Card'), onRow('MIDI In', 'config.setup.midiIn', false), onRow('MIDI Out', 'config.setup.midiOut', false)];
      else if (id === 'network') { b += bx(6, 6, 788, 320, 'Network', [['IP Address', '192.168.0.64'], ['Subnet Mask', '255.255.255.0'], ['Gateway', '192.168.0.1'], ['DHCP', Gd('config.setup.dhcp', false) ? 'ON' : 'OFF'], ['Remote Apps', 'X32-Edit · X32-Mix · X32-Q'], ['MAC', '00:1A:2B:3C:4D:5E']].map(function (r) { return kv(r[0], esc(r[1])); }).join('').replace(/class="kv"/g, 'class="kv" style="padding:8px 14px;font-size:14px"')); return { body: b, enc: [E('DHCP', Gd('config.setup.dhcp', false) ? 'ON' : 'OFF', null, pTog('config.setup.dhcp'), { pl: 'DHCP', on: Gd('config.setup.dhcp', false) }), NOE, NOE, NOE, NOE, NOE], layers: 1 }; }
      else if (id === 'scribble') {
        var hi = clamp(ui.chHi, 0, 31);
        range(32).forEach(function (k) { var o = G('ch.' + k) || {}, c = col(o.color), x = 6 + (k % 8) * 98, y = 6 + Math.floor(k / 8) * 80; b += '<div class="bx" style="left:' + x + 'px;top:' + y + 'px;width:94px;height:76px;background:' + c.bg + ';color:' + c.fg + ';border:2px solid ' + (k === hi ? '#f5a623' : '#000') + '" ' + ctx.A(function () { ui.chHi = k; touch(); openName('ch', k); }) + '><div style="display:flex;align-items:center;gap:4px;padding:4px 6px 0;font-size:11px;font-weight:700">' + icon(o.icon, 18) + ' CH ' + pad2(k + 1) + '</div><div style="padding:6px;font-size:15px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(o.name || '') + '</div></div>'; });
        var ho = G('ch.' + hi) || {};
        return { body: b, enc: [E('Channel', 'CH ' + pad2(hi + 1), function (d) { ui.chHi = clamp(hi + d, 0, 31); touch(); }, function () { openName('ch', hi); }, { pl: 'NAME' }), E('Color', col(ho.color).id, tNum('ch.' + hi + '.color', 0, 15, 1, 0), null, { f: (ho.color || 0) / 15 }), E('Icon', ICONS[clamp((ho.icon | 0) - 1, 0, 73)], tNum('ch.' + hi + '.icon', 1, 74, 1, 1), null), NOE, NOE, NOE], layers: 1 };
      }
      else if (id === 'preamps') {
        var ph = clamp(ui.chHi, 0, 31);
        range(32).forEach(function (k) { var o = G('ch.' + k) || {}, pa = o.preamp || {}, x = 6 + (k % 16) * 49, y = 6 + Math.floor(k / 16) * 162, f = frLin(pa.gain, -12, 60); b += '<div class="bx" style="left:' + x + 'px;top:' + y + 'px;width:46px;height:156px;' + (k === ph ? 'border-color:#f5a623;background:#14212c' : '') + '" ' + ctx.A(function () { ui.chHi = k; touch(); }) + '><div style="text-align:center;font-size:11px;font-weight:700;padding:2px 0;background:#232b34">' + (k + 1) + '</div><div style="position:absolute;left:8px;top:22px;width:10px;height:90px;background:#000"><div style="position:absolute;left:0;right:0;bottom:0;height:' + Math.round(f * 90) + 'px;background:#f5a623"></div></div>' + mv('ch:' + k, 26, 22, 8, 90) + '<div style="position:absolute;left:0;right:0;top:116px;text-align:center;font-size:10px;font-weight:700">' + fDbI(pa.gain) + '</div><div style="position:absolute;left:4px;right:4px;top:132px;text-align:center"><span class="led r' + (pa.phantom ? ' on' : '') + '" style="min-width:0;width:100%" ' + ctx.A(pTog('ch.' + k + '.preamp.phantom')) + '>48V</span></div></div>'; });
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
      if (id === 'channel') info += '<div style="padding:6px 10px;font-size:11px;color:#d9dcdf">RECALL SCOPE</div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding:0 10px">' + [['head', 'Head Amp'], ['config', 'Config'], ['gate', 'Gate'], ['dyn', 'Dynamics'], ['eq', 'EQ'], ['sends', 'Sends']].map(function (sc) { return '<span class="btn' + (ui.libScope[sc[0]] ? ' on' : '') + '" ' + ctx.A(function () { ui.libScope[sc[0]] = !ui.libScope[sc[0]]; touch(); }) + '>' + sc[1] + '</span>'; }).join('') + '</div>';
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
        range(8).forEach(function (k) { var f = fxs[k] || {}, x = 6 + (k % 2) * 258, y = 6 + Math.floor(k / 2) * 80, src = f.source || {}; b += '<div class="bx" style="left:' + x + 'px;top:' + y + 'px;width:254px;height:76px;background:linear-gradient(#20262e,#11151a);' + (k === sl ? 'border-color:#f5a623;box-shadow:0 0 0 1px #f5a623 inset' : '') + '" ' + ctx.A(function () { if (ui.fxSel === k) setTab('effects', 'fx' + (k + 1)); ui.fxSel = k; ui.fxTypeHi = null; touch(); }) + '>' +
          '<div style="position:absolute;left:8px;top:6px;font-size:20px;font-weight:900;color:#f5a623">' + (k + 1) + '</div><div style="position:absolute;left:34px;top:6px;right:30px;font-size:15px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(f.type || '—') + '</div>' +
          '<div style="position:absolute;left:34px;top:28px;font-size:11px;color:#d9dcdf">' + (k < 4 ? 'IN L: ' + esc(src.l || 'INS') + ' · R: ' + esc(src.r || 'INS') : 'INSERT ONLY') + '</div>' +
          '<div style="position:absolute;left:34px;top:46px;font-size:11px;color:#f5b400">' + (f['return'] != null ? 'RTN FX ' + (Math.floor(f['return'] / 2) + 1) : (k < 4 ? 'RTN —' : 'INS')) + '</div>' + mv('fxr:' + (k < 4 ? k * 2 : 99), 228, 8, 6, 60) + mv('fxr:' + (k < 4 ? k * 2 + 1 : 99), 237, 8, 6, 60) + '</div>'; });
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
        b += bx(6, 6, 788, 320, 'FX ' + (k + 1) + ' · ' + esc(t), range(31).map(function (j) { var x = 14 + j * 25, v = +bands[j] || 0; return '<div style="position:absolute;left:' + x + 'px;top:34px;width:21px;height:230px;border-radius:2px;background:' + (j === bh ? '#5b6168' : '#2b2e31') + '" ' + ctx.D({ type: 'geq', path: pre + '.bands.' + j, band: j, top: 34, hgt: 230 }) + '><div style="position:absolute;left:9px;top:0;bottom:0;width:3px;background:#000"></div><div style="position:absolute;left:0;right:0;top:114px;height:1px;background:#55595e"></div><div style="position:absolute;left:2px;width:17px;height:10px;border-radius:2px;background:' + (j === bh ? '#f5b400' : '#e6ebf0') + ';top:' + Math.round((1 - (v + 15) / 30) * 220) + 'px"></div></div><div class="dim" style="position:absolute;left:' + (x - 4) + 'px;top:270px;width:29px;text-align:center;font-size:9px">' + geqLbl(GEQF[j]) + '</div>'; }).join('') + '<div style="position:absolute;left:14px;top:290px;font-size:12px">BAND <b class="yel">' + geqLbl(GEQF[bh]) + ' Hz  ' + fDb(bands[bh], 1) + '</b></div>');
        enc = [E('Band', geqLbl(GEQF[bh]) + ' Hz', function (d) { ui.geqBand = clamp(bh + d, 0, 30); touch(); }, null), E('Gain', fDb(bands[bh], 1), tNum(pre + '.bands.' + bh, -15, 15, 0.5, 0), function () { SET(pre + '.bands.' + bh, 0); }, { f: ((+bands[bh] || 0) + 15) / 30, pl: '0 dB' }), NOE, NOE,
          E('Reset All', '', null, function () { SET(pre + '.bands', range(31).map(function () { return 0; })); }, { pl: 'FLAT' }), E('Mix', (pr.mix == null ? 100 : pr.mix) + ' %', tNum(pre + '.mix', 0, 100, 5, 100), null, { f: (pr.mix == null ? 100 : pr.mix) / 100 })];
        return { body: b, enc: enc, layers: 1 };
      }
      var defs = fxDefs(t), nl = Math.ceil(defs.length / 6), L = layer(nl), pg = defs.slice(L * 6, L * 6 + 6);
      var panel = '<div style="position:absolute;left:10px;top:28px;right:10px;height:44px;display:flex;align-items:center;gap:12px;padding:0 12px;border-radius:4px;background:linear-gradient(90deg,#1b2a3a,#0f1720);border:1px solid #2c4258"><b style="font-size:22px;color:#f5a623">' + esc(fxShort(t)) + '</b><span style="font-size:15px;font-weight:700">' + esc(t) + '</span><span class="dim" style="margin-left:auto">' + (k < 4 ? 'SEND FX · ' + esc(((f.source || {}).l) || 'INS') : 'INSERT FX') + '</span>' + mv('fxr:' + (k < 4 ? k * 2 : 99), 0, 0, 0, 0).replace('class="mv ', 'class="mv x ') + '</div>';
      panel += defs.map(function (p2, j) { var v = pr[p2.k] == null ? p2.d : pr[p2.k], fr = Array.isArray(p2.sc) ? Math.max(0, p2.sc.indexOf(v)) / Math.max(1, p2.sc.length - 1) : p2.sc === 'log' ? frLog(v, p2.lo, p2.hi) : frLin(v, p2.lo, p2.hi), x = 16 + (j % 6) * 128, y = 84 + Math.floor(j / 6) * 118, on = Math.floor(j / 6) === L; return '<div style="position:absolute;left:' + x + 'px;top:' + y + 'px;width:118px;height:112px;text-align:center;' + (on ? '' : 'opacity:.45') + '" ' + ctx.D({ type: 'fxknob', path: pre + '.' + p2.k, def: p2 }) + '>' + knobSvg(fr, on) + '<div style="font-size:11px;font-weight:700;color:#d9dcdf;margin-top:2px">' + esc(p2.l) + '</div><div style="font-size:14px;font-weight:700;' + (on ? 'color:#f5b400' : '') + '">' + esc(fxVal(p2, v)) + '</div></div>'; }).join('');
      b += bx(6, 6, 788, 320, 'FX ' + (k + 1) + ' · Edit', panel);
      enc = pg.map(function (p2) { var v = pr[p2.k] == null ? p2.d : pr[p2.k]; return E(p2.l, fxVal(p2, v), function (d) { fxTurn(pre + '.' + p2.k, p2, d); }, function () { SET(pre + '.' + p2.k, p2.d); }, { pl: 'DEF', f: Array.isArray(p2.sc) ? Math.max(0, p2.sc.indexOf(v)) / Math.max(1, p2.sc.length - 1) : p2.sc === 'log' ? frLog(v, p2.lo, p2.hi) : frLin(v, p2.lo, p2.hi) }); });
      while (enc.length < 6) enc.push(NOE);
      return { body: b, enc: enc, layers: nl };
    }
    function knobSvg(fr, on) { var a0 = -135, a1 = a0 + 270 * fr, r = 34, cx = 59, cy = 42, pt = function (a) { var rad = (a - 90) * Math.PI / 180; return (cx + r * Math.cos(rad)).toFixed(1) + ',' + (cy + r * Math.sin(rad)).toFixed(1); }; var large = a1 - a0 > 180 ? 1 : 0; return '<svg width="118" height="80" style="display:block"><path d="M' + pt(a0) + ' A' + r + ',' + r + ' 0 1 1 ' + pt(135) + '" fill="none" stroke="#2a323c" stroke-width="6"/>' + (fr > 0.005 ? '<path d="M' + pt(a0) + ' A' + r + ',' + r + ' 0 ' + large + ' 1 ' + pt(a1) + '" fill="none" stroke="' + (on ? '#f5a623' : '#5a6672') + '" stroke-width="6"/>' : '') + '<circle cx="' + cx + '" cy="' + cy + '" r="24" fill="#22272e" stroke="#000"/><line x1="' + cx + '" y1="' + cy + '" x2="' + pt(a1).split(',')[0] + '" y2="' + pt(a1).split(',')[1] + '" stroke="#ff8a1f" stroke-width="3" transform="scale(1)"/></svg>'; }
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
          '<div style="padding:6px 8px;font-size:11px;color:#e6e8ea;height:72px;overflow:hidden;line-height:15px">' + (mem.length ? esc(mem.join(', ')) : '<span class="dim">(empty)</span>') + '</div>' +
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
          '<div class="dim" style="font-size:11px;margin-top:12px">' + (id === 'home' ? 'NEXT' : 'SELECTED') + '</div><div class="big" style="font-size:18px;color:#f5b400">' + pad2(hi) + '  ' + esc(it && it.data ? it.name : '- - -') + '</div>' +
          '<div style="font-size:11px;margin-top:10px;color:' + (sc.dirty ? '#ff9f1c' : '#c9ccd0') + '">' + (sc.dirty ? 'Edited since last recall/save' : 'No changes since recall') + '</div></div>' +
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
        b += bx(6, 6, 788, 320, 'Parameter Safe — these are NOT changed by scene recall', '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:10px">' + cats.map(function (c2, k) { var on = !!G('config.scenes.safe.params.' + c2[0]); return '<span class="btn' + (on ? ' on' : '') + '" style="padding:18px 4px' + (k === ph ? ';outline:2px solid #f5a623' : '') + '" ' + ctx.A(function () { ui.safeHi = k; SET('config.scenes.safe.params.' + c2[0], !on); }) + '>' + (on ? 'SAFE · ' : '') + c2[1] + '</span>'; }).join('') + '</div>');
        return { body: b, enc: [E('Category', cats[ph][1], function (d) { ui.safeHi = clamp(ph + d, 0, cats.length - 1); touch(); }, pTog('config.scenes.safe.params.' + cats[ph][0]), { pl: 'SAFE', on: !!G('config.scenes.safe.params.' + cats[ph][0]) }), NOE, NOE, NOE, NOE, NOE], layers: 1 };
      }
      var chs = [], b2 = '';
      range(32).forEach(function (k) { chs.push({ l: String(k + 1), p: 'ch.' + k }); }); range(8).forEach(function (k) { chs.push({ l: 'A' + (k + 1), p: 'aux.' + k }); }); range(8).forEach(function (k) { chs.push({ l: 'F' + (k + 1), p: 'fxr.' + k }); }); range(16).forEach(function (k) { chs.push({ l: 'B' + (k + 1), p: 'bus.' + k }); }); range(6).forEach(function (k) { chs.push({ l: 'MX' + (k + 1), p: 'mtx.' + k }); }); chs.push({ l: 'LR', p: 'main.st' }, { l: 'M/C', p: 'main.m' }); range(8).forEach(function (k) { chs.push({ l: 'D' + (k + 1), p: 'dca.' + k }); });
      var chh = clamp(ui.safeHi, 0, chs.length - 1);
      b2 = '<div style="display:grid;grid-template-columns:repeat(16,1fr);gap:3px;padding:6px">' + chs.map(function (c2, k) { var on = !!G('config.scenes.safe.ch.' + c2.p.replace('.', '_')); return '<span class="btn' + (on ? ' on' : '') + '" style="padding:6px 0;font-size:11px' + (k === chh ? ';outline:2px solid #f5a623' : '') + '" ' + ctx.A(function () { ui.safeHi = k; SET('config.scenes.safe.ch.' + c2.p.replace('.', '_'), !on); }) + '>' + c2.l + '</span>'; }).join('') + '</div>';
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
        b += bx(6, 6, 300, 320, 'Monitor', kv('MONITOR LEVEL', fDb(mon.level, 1)) + kv('PHONES LEVEL', fDb(mon.phones, 1)) + kv('SOURCE', esc(mon.source || 'Main LR')) + kv('MONO', mon.mono ? 'ON' : 'OFF') + kv('DIM', mon.dim ? 'ON (' + (mon.dimAtt == null ? -20 : mon.dimAtt) + ' dB)' : 'OFF') + kv('SOLO MODE', esc(so.mode || 'PFL')) + kv('DIM ON SOLO', so.dimSolo ? 'ON' : 'OFF') + kv('SOLO ACTIVE', anySolo ? '<span style="color:#f5b400">YES</span>' : 'no') +
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
      /* FW4 MONITOR › OSCILLATOR: LEVEL(미터 · GENERATE) | OSCILLATOR PREFERENCES(F1 · F2 · TYPE) | OSCILLATOR DESTINATION(BUS 1-16 · MAIN L/R/LR/M·C · MTX 1-6) */
      var osc = G('config.osc') || {}, oon = !!osc.on, typ = osc.type || 'SINE', lv = osc.level == null ? -20 : osc.level, f1 = +osc.f1 || +osc.freq || 1000, f2 = +osc.f2 || 10000, fsel = osc.fsel === 2 ? 2 : 1, to = osc.to || {};
      if (!Object.keys(to).some(function (k) { return to[k]; })) { var ld = String(osc.dest || 'MixBus 01'), lm = /MixBus\s*0?(\d+)/i.exec(ld); to = {}; if (lm) to['b' + (+lm[1])] = true; else if (/M\/C/.test(ld)) to.M = true; else if (/Main/.test(ld)) { to.L = true; to.R = true; } }
      var DL = range(16).map(function (k) { return ['b' + (k + 1), String(k + 1), 'Bus ' + (k + 1)]; }).concat([['L', 'L', 'Main L'], ['R', 'R', 'Main R'], ['LR', 'LR', 'Main LR'], ['M', 'M/C', 'M/C']], range(6).map(function (k) { return ['x' + (k + 1), String(k + 1), 'Mtx ' + (k + 1)]; }));
      var isTo = function (d) { return d[0] === 'LR' ? !!(to.L && to.R) : !!to[d[0]]; }, curD = DL.findIndex ? DL.findIndex(function (d) { return d[0] !== 'L' && d[0] !== 'R' ? isTo(d) : isTo(d) && !(to.L && to.R); }) : -1;
      if (curD < 0 && to.L && to.R) curD = 18; if (curD < 0) { var lg = /MixBus\s*0?(\d+)/i.exec(osc.dest || 'MixBus 01'); curD = lg ? +lg[1] - 1 : /M\/C/.test(osc.dest || '') ? 19 : /Main/.test(osc.dest || '') ? 18 : 0; }
      var dHi = ui.oscHi == null ? curD : ui.oscHi;
      var assign = function (k) { var d = DL[k], nt = {}; if (d[0] === 'LR') { nt.L = true; nt.R = true; } else nt[d[0]] = true; m.batch(function () { SET('config.osc.to', nt); SET('config.osc.dest', d[2]); }); ui.oscHi = null; };
      var fq = function (f) { return f >= 1000 ? (f / 1000).toFixed(f >= 10000 ? 1 : 2).replace('.', 'k') : String(Math.round(f)); };
      b += sec(4, 4, 116, 'LEVEL') + '<div style="position:absolute;left:4px;top:24px;width:116px;height:296px;background:#3d4146"></div>' +
        '<div class="mv" style="left:30px;top:40px;width:20px;height:200px"><b style="--v:' + (oon ? clamp((lv + 60) / 60, 0, 1) : 0).toFixed(3) + '"></b></div>' + scaleV(58, 40, 200, [['Clip', 0], ['-2', 0.04], ['-6', 0.1], ['-18', 0.3], ['-42', 0.7], ['-60', 1]]) +
        sbtn('GENERATE', oon, ctx.A(pTog('config.osc.on')), 8, 270, 108, 26);
      b += sec(126, 4, 336, 'OSCILLATOR PREFERENCES') + '<div style="position:absolute;left:126px;top:24px;width:336px;height:296px;background:#3d4146"></div>' +
        sbtn('F1', fsel === 1, ctx.A(function () { SET('config.osc.fsel', 1); }), 154, 44, 46, 18, 'dk') + vbox(fq(f1), 'Hz', 150, 66, 54) + knobAt(frLog(f1, 20, 20000), 158, 92, 44, 'FREQUENCY', ctx, tLog('config.osc.f1', 20, 20000, 200, 1000)) +
        sbtn('F2', fsel === 2, ctx.A(function () { SET('config.osc.fsel', 2); }), 254, 44, 46, 18, 'dk') + vbox(fq(f2), 'Hz', 250, 66, 54) + knobAt(frLog(f2, 20, 20000), 258, 92, 44, 'FREQUENCY', ctx, tLog('config.osc.f2', 20, 20000, 200, 10000)) +
        sec(350, 30, 76, 'TYPE') + [['SINE', '<svg width="30" height="22" viewBox="0 0 30 22"><path d="M2 11Q8.5 -4 15 11T28 11" fill="none" stroke="#fff" stroke-width="2"/></svg>'], ['PINK', '<svg width="30" height="22" viewBox="0 0 30 22">' + range(14).map(function (k) { var hh = 4 + ((k * 37) % 13); return '<rect x="' + (2 + k * 2) + '" y="' + (11 - hh / 2) + '" width="1.4" height="' + hh + '" fill="#e879f9"/>'; }).join('') + '</svg>'], ['WHITE', '<svg width="30" height="22" viewBox="0 0 30 22">' + range(14).map(function (k) { var hh = 6 + ((k * 53) % 11); return '<rect x="' + (2 + k * 2) + '" y="' + (11 - hh / 2) + '" width="1.4" height="' + hh + '" fill="#fff"/>'; }).join('') + '</svg>']].map(function (t, i) {
          var on = typ === t[0]; return '<div ' + ctx.A(function () { SET('config.osc.type', t[0]); }) + ' style="position:absolute;left:354px;top:' + (56 + i * 40) + 'px;width:40px;height:32px;background:#0c0c0c;border:2px solid ' + (on ? '#f5a623' : '#55595e') + ';display:flex;align-items:center;justify-content:center">' + t[1] + '</div><span style="position:absolute;left:402px;top:' + (64 + i * 40) + 'px;width:14px;height:14px;border-radius:50%;background:' + (on ? '#f5b400' : '#111') + ';border:1px solid #9aa0a6;color:#111;font-size:11px;line-height:13px;text-align:center">' + (on ? '✓' : '') + '</span>'; }).join('') +
        at(140, 190, '<div style="font-size:13px;color:#fff;line-height:1.35">ⓘ When activated,<br>Oscillator replaces destination signal.</div>');
      var dbtn = function (k, x, y, w) { var d = DL[k], on = isTo(d); return '<span class="btn dk' + (on ? ' on' : '') + '" ' + ctx.A(function () { assign(k); }) + ' style="position:absolute;left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:26px;font-size:15px' + (on ? ';background:#f5b400;color:#111;border-color:#f5b400' : '') + (k === dHi && !on ? ';box-shadow:0 0 0 2px #f5a623' : '') + '">' + d[1] + '</span>'; };
      b += sec(468, 4, 324, 'OSCILLATOR DESTINATION') + '<div style="position:absolute;left:468px;top:24px;width:324px;height:296px;background:#3d4146"></div>' + at(478, 92, '<span class="cap">BUS</span>') + at(474, 214, '<span class="cap">MAIN</span>') + at(478, 266, '<span class="cap">MTX</span>');
      range(16).forEach(function (k) { b += dbtn(k, 530 + (k % 6) * 42, 44 + Math.floor(k / 6) * 34, 34); });
      b += dbtn(16, 530, 208, 34) + dbtn(17, 572, 208, 34) + dbtn(18, 614, 208, 76) + dbtn(19, 698, 208, 76);
      range(6).forEach(function (k) { b += dbtn(20 + k, 530 + k * 42, 260, 34); });
      enc = [E('Level', fDb(lv, 1), tNum('config.osc.level', -60, 0, 0.5, -20), pTog('config.osc.on'), { f: frLin(lv, -60, 0), pl: 'GENERATE', on: oon }),
        E('Freq', fq(f1) + ' Hz', tLog('config.osc.f1', 20, 20000, 200, 1000), function () { SET('config.osc.fsel', 1); }, { f: frLog(f1, 20, 20000), pl: 'F1', on: fsel === 1 }),
        E('Freq', fq(f2) + ' Hz', tLog('config.osc.f2', 20, 20000, 200, 10000), function () { SET('config.osc.fsel', 2); }, { f: frLog(f2, 20, 20000), pl: 'F2', on: fsel === 2 }),
        E('Select', typ.charAt(0) + typ.slice(1).toLowerCase(), tList('config.osc.type', ['SINE', 'PINK', 'WHITE']), null, { pl: 'SET', on: true }), NOE,
        E('Select', DL[dHi][2].replace('Main ', ''), function (dd) { ui.oscHi = clamp(dHi + dd, 0, DL.length - 1); touch(); }, function () { assign(dHi); }, { pl: 'ASSIGN', on: dHi === curD })];
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
      b += bx(6, 6, 788, 320, 'UTILITY — ' + (PNAME[from.page] || '') + ' / ' + esc(from.tab) + ' · ' + esc(s.id + ' ' + s.name), '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:14px">' + fns.map(function (f, k) { return '<span class="btn" style="padding:22px 6px;font-size:15px;flex-direction:column;gap:4px" ' + ctx.A(f[1]) + '><small style="font-size:10px;color:#d9dcdf">ENC ' + (k + 1) + '</small>' + esc(f[0]) + '</span>'; }).join('') + '</div>' +
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
    function header() {   // FW4: 채널 칸(+ 색 막대) · CUE · USB 재생 · 상태(A/B/L/C) · 시계
      var s = sel(), c = col(s.o.color), sc = G('config.scenes') || {}, cur = sc.current | 0, it = (sc.list || [])[cur] || {}, A = G('routing.aes50') || {}, d = new Date(), sof = G('config.sendsOnFader'), u = G('config.usb') || {};
      var hh = Gd('config.setup.clock', '24h') === '12h' ? ((d.getHours() + 11) % 12 + 1) : d.getHours(), rate = Gd('config.setup.rate', '48K'), card = G('routing.card.connected'), solo = m.anySolo && m.anySolo();
      var ut = u.time | 0, mm = function (t) { t = Math.max(0, t | 0); return Math.floor(t / 60) + ':' + pad2(t % 60); };
      return '<div class="cb"><span class="id">' + esc(s.id) + '</span><span class="ln"></span><span class="nm">' + esc(s.name) + '</span><span class="bar" style="background:' + (c.id === 'OFF' ? '#3a3d40' : c.bg) + '"></span></div>' +
        '<div class="cue"><div class="lb">CUE</div><div class="t1"></div><div class="t2">' + (sc.dirty ? '' : '') + pad2(cur) + ' ' + esc(it.name || '') + (sc.dirty ? ' *' : '') + '</div></div>' +
        (sof ? '<div class="sof">SENDS ON FADER' + (G('config.sofTarget') ? '<br>' + esc(sofName()) : '') + '</div>' :
          '<div class="ply"><div class="tt">' + esc(u.file || (u.recording ? 'REC' : '')) + '</div><div class="tm"><span>' + mm(ut) + '</span>' + (u.playing ? '<span style="color:#2fd34d">▶</span>' : u.recording ? '<span style="color:#e53935">●</span>' : '<i></i>') + '<span>-' + mm((u.len | 0) - ut) + '</span></div></div>') +
        '<div class="st"><span><q class="' + (A.a && A.a.connected ? 'on' : '') + '"></q>A: ' + esc(A.a && A.a.connected ? (A.a.device || 'S16') : '-') + '</span><span><q class="on"></q>L: ' + esc(String(rate).replace(/\s*kHz/i, 'K')) + '</span>' +
          '<span><q class="' + (A.b && A.b.connected ? 'on' : '') + '"></q>B: ' + esc(A.b && A.b.connected ? (A.b.device || 'S16') : '-') + '</span><span>' + (solo ? '<q class="y"></q><b style="color:#f5b400">SOLO</b>' : '<q class="' + (card ? 'on' : '') + '"></q>C: ' + esc(card ? (G('routing.card.type') || 'X-USB').replace(/^X-/, '') : '-')) + '</span></div>' +
        '<div class="ck">' + pad2(hh) + ':' + pad2(d.getMinutes()) + '<small>:' + pad2(d.getSeconds()) + '</small></div>';
    }
    function sofName() { var t = G('config.sofTarget'); if (!t) return ''; if (typeof t === 'object') return m.shortId ? m.shortId(t.type, t.index) + ' ' + m.label(t.type, t.index) : ''; return 'BUS ' + pad2((t | 0) + 1) + (m.label ? ' ' + m.label('bus', t | 0) : ''); }
    function tabsHtml(P2, ctx) {   // FW4: 대문자 탭, 고른 탭은 몸통 색으로 이어짐(페이지 이름 칸 없음)
      var p = page();
      if (modal) return '<div class="t on">' + (modal.kind === 'name' ? 'NAME / ICON / COLOR' : 'TEXT ENTRY') + '</div>';
      if (p === 'utility') return '<div class="t on">UTILITY</div><div class="t">' + esc(((tabsOf((ui.utilFrom || {}).page || 'home').filter(function (t) { return t[0] === (ui.utilFrom || {}).tab; })[0]) || ['', PNAME[(ui.utilFrom || {}).page] || ''])[1]) + '</div>';
      var tabs = tabsOf(p), id = tabId(p), smc = tabs.length > 7 || tabs.some(function (t) { return t[1].length > 10; }) ? ' sm' : '';
      return tabs.map(function (t) { return '<div class="t' + smc + (t[0] === id ? ' on' : '') + '" ' + ctx.A(function () { setTab(p, t[0]); }) + '>' + esc(t[1]) + '</div>'; }).join('');
    }
    /* 엔코더 칸 그림: 값이 있는 손잡이는 노브(주황 호), 목록 고르기는 돌림 화살표, 단추처럼 바꾸는 값은 ↔ */
    function knobSvg(f, sz) {
      sz = sz || 38; var r = sz / 2 - 3, c = sz / 2, a0 = -225, a1 = a0 + 270 * clamp(f, 0, 1), P2 = function (a, rr) { var t = a * Math.PI / 180; return [(c + rr * Math.cos(t)).toFixed(2), (c + rr * Math.sin(t)).toFixed(2)]; };
      var s0 = P2(a0, r + 1.5), s1 = P2(a1, r + 1.5), large = a1 - a0 > 180 ? 1 : 0, pt = P2(a1, r - 4), pc = P2(a1, 2);
      return '<svg viewBox="0 0 ' + sz + ' ' + sz + '" width="' + sz + '" height="' + sz + '"><circle cx="' + c + '" cy="' + c + '" r="' + (r + 1.5) + '" fill="none" stroke="#141516" stroke-width="3"/>' +
        (f > 0.003 ? '<path d="M' + s0.join(' ') + ' A' + (r + 1.5) + ' ' + (r + 1.5) + ' 0 ' + large + ' 1 ' + s1.join(' ') + '" fill="none" stroke="#f5a623" stroke-width="3"/>' : '') +
        '<circle cx="' + c + '" cy="' + c + '" r="' + (r - 1) + '" fill="#f1f2f3"/><circle cx="' + c + '" cy="' + c + '" r="' + (r - 1) + '" fill="none" stroke="#9a9fa4"/><line x1="' + pc[0] + '" y1="' + pc[1] + '" x2="' + pt[0] + '" y2="' + pt[1] + '" stroke="#1b1c1d" stroke-width="2.4" stroke-linecap="round"/></svg>';
    }
    function rotSvg() { return '<svg viewBox="0 0 38 38" width="38" height="38" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"><path d="M8 15a12 12 0 0 1 19-6"/><path d="M30 23a12 12 0 0 1-19 6"/><path d="M25 5l3 4-4.5 1.5"/><path d="M13 33l-3-4 4.5-1.5"/></svg>'; }
    function lrSvg() { return '<svg viewBox="0 0 38 38" width="38" height="38" fill="#fff"><path d="M5 19l8-7v4h12v-4l8 7-8 7v-4H13v4z"/></svg>'; }
    function udSvg() { return '<svg viewBox="0 0 38 38" width="38" height="38" fill="#fff"><path d="M19 4l7 8h-4v14h4l-7 8-7-8h4V12h-4z"/></svg>'; }
    function splitVal(v) { v = String(v == null ? '' : v); var mt = v.match(/^(.*?\S)\s+(dB|Hz|kHz|ms|s|%|m|ft|°)$/); return mt ? [mt[1], mt[2]] : [v, '']; }
    function encHtml(enc, ctx, layers) {
      var L = layers > 1 ? layer(layers) : 0;
      return (layers > 1 ? '<div class="pgi">' + range(layers).map(function (k) { return '<i class="' + (k === L ? 'on' : '') + '">' + (k + 1) + '</i>'; }).join('') + '</div>' : '') +
        enc.map(function (e, k) { e = e || NOE; var fl = ui.flash === k && now() - ui.flashT < 500, sv = splitVal(e.v), ic = e.f != null ? knobSvg(e.f) : e.t ? (e.ic === 'ud' ? udSvg() : e.ic === 'lr' ? lrSvg() : rotSvg()) : '';
          return '<div class="e' + (e.x || (!e.t && !e.p) ? ' x' : '') + (fl ? ' fl' : '') + '" data-enc="' + k + '">' + (ic ? '<div class="kn">' + ic + '</div>' : '') + '<div class="l"' + (ic ? '' : ' style="left:4px"') + '>' + esc(e.l) + '</div>' +
            (e.v !== '' && e.v != null ? '<div class="v"' + (ic ? '' : ' style="left:6px"') + '><b>' + esc(sv[0]) + '</b>' + (sv[1] ? '<u>' + esc(sv[1]) + '</u>' : '') + '</div>' : '') +
            '<span class="p ' + (e.pc === 'cr' ? 'cr' : '') + (e.on ? ' on' : '') + (e.pl ? '' : ' nop') + '">' + esc(e.pl || '') + '</span>' + (e.f != null ? '<div class="r"><b style="width:' + Math.round(clamp(e.f, 0, 1) * 100) + '%"></b></div>' : '') + '</div>'; }).join('');
    }
    function renderAll() {   // 한 번 만들어 모든 화면(작은 것 · 큰 것)에 똑같이 씀
      var ctx = mkCtx(), P2;
      try { P2 = build(ctx); } catch (err) { if (window.console) console.error('X32Screen', err); P2 = { body: '<div style="padding:20px;color:#f87171">screen error</div>', enc: [], layers: 1 }; }
      var R = { P2: P2, ctx: ctx, hd: header(), tb: tabsHtml(P2, ctx), en: encHtml(P2.enc, ctx, P2.layers || 1) };
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
        home: { home: '고른 채널의 소리 길을 한눈에 봐요: 입력 → 게이트 → EQ → 컴프 → 센드 → 메인. LAYER ▲▼ 로 엔코더 기능이 바뀌어요.', config: '소스(어느 입력을 받을지) · 게인 · 딜레이 · 로우컷 · 인서트를 정해요. 목록은 한 번 눌러 고르고 한 번 더 누르면 연결돼요. 이름 · 색 · 아이콘은 UTILITY 또는 LAYER ▼(2쪽)에서 바꿔요.', gate: '작은 소리를 막는 게이트예요. THRESH 보다 작은 소리는 RANGE 만큼 줄어요. 그림을 좌우로 끌어도 되고, 노브를 위아래로 끌어도 돼요. LAYER ▼(2쪽)는 키 필터 · 키 소스예요.', dyn: '큰 소리를 눌러 주는 컴프레서예요. THRESH 를 넘는 만큼 빨강 미터(줄어든 양)가 움직여요. 엔코더를 누르면 COMP/EXP · PEAK/RMS · LIN/LOG 가 바뀌어요.', eq: '소리 높낮이별 크기를 바꿔요. 색 점을 끌면 바로 바뀌어요. 오른쪽 단추나 엔코더 6(Select)으로 띠를 고르고, 엔코더 2~5로 FREQ · GAIN · Q · MODE 를 돌려요.', sends: '이 채널을 믹스 버스(모니터 등)로 얼마나 보낼지 정해요. 엔코더 6으로 4개씩 옮겨요.', main: '메인 스피커로 보내기(LR) · 좌우(PAN) · 페이더 · DCA · 뮤트 그룹을 정해요.' },
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
        if (sp.type === 'knob') { if (first) { d.lastY = e.clientY; return; } var dyk = d.lastY - e.clientY, stk = Math.max(3, v.scr.getBoundingClientRect().height / 160); if (Math.abs(dyk) >= stk) { var nk = Math.trunc(dyk / stk); d.lastY -= nk * stk; if (sp.turn) sp.turn(nk); } return; }
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
      var root = document.createElement('div'); root.className = 'x32s' + (host.clientHeight < 4 ? ' auto' : ''); root.setAttribute('role', 'application'); root.setAttribute('aria-label', (opts.name || 'X32') + ' 메인 화면' + (isBig ? ' (크게 보기)' : ''));
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
      var px = el.closest && el.closest('.x32p'); if (px) { var sc = px.querySelector('.x32p-scroll') || px.querySelector('[data-role=scroll]'); if (sc && sc.parentNode) return { parent: sc.parentNode, before: sc }; /* 2026-11-08: 크게 보기 판은 사진 콘솔 위쪽에 */ return { parent: px, before: null }; }
      return { parent: el.parentNode && el.parentNode.parentNode ? el.parentNode.parentNode : document.body, before: null };
    }
    var PGB = [['home', 'HOME'], ['meters', 'METERS'], ['routing', 'ROUTING'], ['setup', 'SETUP'], ['library', 'LIBRARY'], ['effects', 'EFFECTS'], ['mutegrp', 'MUTE GRP'], ['utility', 'UTILITY'], ['scenes', 'SCENES'], ['monitor', 'MONITOR']];
    function openBig() {
      if (big) { big.box.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); return; }
      var hp = bigHost(), box = document.createElement('div'); box.className = 'x32s-big'; box.setAttribute('data-role', 'x32-screen-big');
      box.innerHTML = '<div class="bar"><b>' + esc(opts.name || 'X32') + ' 화면 크게 보기</b><span class="sp">사진 속 화면과 같은 화면이에요. 여기서 눌러도, 사진 위에서 눌러도 똑같이 바뀌어요.</span><button type="button" data-x="close">닫기</button></div>' +
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
