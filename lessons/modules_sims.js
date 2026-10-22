/* =============================================================================
   학습 모듈 실습(가상 장비) — window.STASims.micPlacement / gainStage
   mount(el, opts) → { destroy(), state(), set(obj) }   opts.onTask(id) 는 과제를 달성한 순간 한 번 호출
   - 모든 값은 교육용 근사 모델. 화면에도 그렇게 표시함.
   ============================================================================= */
(function () {
  'use strict';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function db(x) { return 20 * Math.log10(Math.max(x, 1e-9)); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* ======================================================================= 마이크 배치 */
  var MIC_TYPES = {
    dyn: { name: '다이내믹 · 카디오이드', ex: 'Shure SM58', a: 0.5, sens: 0, phantom: false },
    super: { name: '다이내믹 · 슈퍼카디오이드', ex: 'Shure Beta 58A', a: 0.366, sens: 1, phantom: false },
    cond: { name: '콘덴서 · 카디오이드', ex: '보컬용 콘덴서', a: 0.5, sens: 10, phantom: true },
    omni: { name: '콘덴서 · 무지향(옴니)', ex: '측정·합창용', a: 1, sens: 10, phantom: true }
  };
  function micPlacement(el, opts) {
    opts = opts || {};
    var W = 3.2, H = 2.0;                       // 무대 크기(m)
    var mouth = { x: 0.62, y: 1.0 }, wedge = { x: 2.7, y: 1.0 };
    var S = { type: 'dyn', phantom: false, x: 1.3, y: 1.42, ang: -150, sawCondNoPh: false, done: {} };
    el.innerHTML =
      '<div class="sim-mic">' +
        '<div class="sim-stage"><canvas class="sim-canvas" aria-label="무대를 위에서 본 그림: 보컬, 마이크, 모니터 스피커"></canvas>' +
          '<div class="sim-hint">마이크(동그란 머리)를 끌어 옮기고, 앞쪽 노란 손잡이를 끌어 방향을 돌리세요.</div></div>' +
        '<div class="sim-side">' +
          '<div class="sim-box"><h4>마이크 종류</h4><div class="sim-types">' + Object.keys(MIC_TYPES).map(function (k) { var m = MIC_TYPES[k];
            return '<label class="sim-type"><input type="radio" name="simMicType" value="' + k + '"' + (k === S.type ? ' checked' : '') + '><span><b>' + esc(m.name) + '</b><small>' + esc(m.ex) + (m.phantom ? ' · 팬텀 전원 필요' : '') + '</small></span></label>'; }).join('') + '</div>' +
            '<label class="sim-switch"><input type="checkbox" data-sim="phantom"><span>콘솔 팬텀 전원 <b>+48V</b></span></label></div>' +
          '<div class="sim-box"><h4>조절</h4><label class="sim-range"><span>마이크 방향 <b data-out="ang"></b></span><input type="range" min="-180" max="180" step="1" data-sim="ang" aria-label="마이크 방향"></label>' +
            '<div class="sim-btns"><button type="button" class="sim-btn" data-sim="aim">입 쪽으로 향하기</button><button type="button" class="sim-btn" data-sim="near">입 앞 8 cm 로</button><button type="button" class="sim-btn" data-sim="reset">처음 위치</button></div></div>' +
          '<div class="sim-box sim-listen"><h4>소리로 듣기</h4><button type="button" class="sim-btn sim-play" data-sim="play">🔊 소리 켜기</button>' +
            '<p class="sim-note" data-role="listen">실제 보컬 녹음이 지금 마이크 위치에서 들리는 소리로 바뀌어요. 거리·방향·근접 효과·실내 울림이 반영돼요.</p></div>' +
          '<div class="sim-box sim-read" data-role="read"></div>' +
        '</div>' +
      '</div>';
    var cv = el.querySelector('canvas'), ctx = cv.getContext('2d'), read = el.querySelector('[data-role=read]'), angIn = el.querySelector('[data-sim=ang]'), phIn = el.querySelector('[data-sim=phantom]');
    var px = 1, dpr = Math.min(2, window.devicePixelRatio || 1);
    function size() { var w = cv.parentNode.clientWidth || 600, h = Math.round(w * H / W); cv.style.width = w + 'px'; cv.style.height = h + 'px'; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); px = w / W; draw(); }
    function toPx(p) { return { x: p.x * px, y: p.y * px }; }
    function pattern(a, th) { return Math.abs(a + (1 - a) * Math.cos(th)); }
    function angTo(p) { return Math.atan2(p.y - S.y, p.x - S.x); }
    function rel(th) { var d = th - S.ang * Math.PI / 180; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return Math.abs(d); }
    function calc() {
      var m = MIC_TYPES[S.type], ds = Math.max(0.02, Math.hypot(mouth.x - S.x, mouth.y - S.y)), dw = Math.max(0.2, Math.hypot(wedge.x - S.x, wedge.y - S.y));
      var ts = rel(angTo(mouth)), tw = rel(angTo(wedge)), gs = Math.max(0.03, pattern(m.a, ts)), gw = Math.max(0.03, pattern(m.a, tw));
      var live = !m.phantom || S.phantom;
      var voice = db(0.1 / ds) + db(gs) + m.sens;                 // 입 10 cm 정면 = 0 dB (다이내믹 기준)
      var mon = 10 - db(dw) + db(gw) + m.sens;                    // 모니터 스피커 소리가 마이크로 들어가는 크기(상대)
      var margin = (voice - m.sens) - (mon - m.sens) - 5;         // 피드백 여유: 감도는 둘 다에 똑같이 더해져 상쇄됨
      var k = 2 * Math.PI * 100 / 343, prox = m.a < 1 ? db(m.a + (1 - m.a) * Math.sqrt(1 + 1 / Math.pow(k * ds, 2))) : 0;
      var risk = margin >= 15 ? 'low' : margin >= 8 ? 'mid' : 'high';
      return { m: m, ds: ds, dw: dw, tsDeg: ts * 180 / Math.PI, twDeg: tw * 180 / Math.PI, live: live, voice: voice, mon: mon, margin: margin, prox: prox, risk: risk };
    }
    function bar(v, lo, hi, cls) { var p = clamp((v - lo) / (hi - lo), 0, 1) * 100; return '<span class="sim-bar ' + (cls || '') + '"><i style="width:' + p.toFixed(1) + '%"></i></span>'; }
    function update() {
      var c = calc();
      angIn.value = Math.round(S.ang); el.querySelector('[data-out=ang]').textContent = Math.round(S.ang) + '°';
      var vtxt, vcls;
      if (!c.live) { vtxt = '신호 없음 — 콘덴서 마이크는 전원이 필요해요'; vcls = 'bad'; }
      else if (c.voice < -8) { vtxt = '작아요 — 마이크가 멀거나 입을 향하지 않아요'; vcls = 'warn'; }
      else if (c.voice > 9) { vtxt = '아주 커요 — 너무 가까워요'; vcls = 'warn'; }
      else { vtxt = '알맞아요'; vcls = 'ok'; }
      var riskTxt = { low: '낮음', mid: '보통', high: '높음 (하울링 위험)' }[c.risk], proxTxt = c.prox >= 10 ? '강함' : c.prox >= 4 ? '약간' : '거의 없음';
      read.innerHTML = '<h4>결과 <small>교육용 근사 계산</small></h4>' +
        '<div class="sim-row"><span>입-마이크 거리</span><b>' + Math.round(c.ds * 100) + ' cm · 입 방향에서 ' + Math.round(c.tsDeg) + '° 벗어남</b></div>' +
        '<div class="sim-row"><span>목소리 크기</span><b class="' + vcls + '">' + (c.live ? (c.voice >= 0 ? '+' : '') + c.voice.toFixed(1) + ' dB · ' : '') + vtxt + '</b></div>' + (c.live ? bar(c.voice, -30, 15, vcls) : '') +
        '<div class="sim-row"><span>모니터 스피커 방향</span><b>마이크 정면에서 ' + Math.round(c.twDeg) + '°</b></div>' +
        '<div class="sim-row"><span>피드백 위험</span><b class="' + (c.risk === 'low' ? 'ok' : c.risk === 'mid' ? 'warn' : 'bad') + '">' + (c.live ? riskTxt + ' (여유 ' + c.margin.toFixed(0) + ' dB)' : '—') + '</b></div>' + (c.live ? bar(c.margin, -10, 30, c.risk === 'low' ? 'ok' : c.risk === 'mid' ? 'warn' : 'bad') : '') +
        '<div class="sim-row"><span>근접 효과 (100 Hz 저음)</span><b>' + (c.live ? (c.m.a < 1 ? '+' + c.prox.toFixed(1) + ' dB · ' + proxTxt : '무지향이라 거의 없음') : '—') + '</b></div>' +
        '<p class="sim-note">피드백 여유 = 목소리 크기 − 모니터 소리 유입(계산값). 감도가 높은 마이크는 목소리와 스피커 소리를 똑같이 크게 받아 여유는 그대로예요.</p>';
      // 과제 판정
      var good = c.live && c.ds >= 0.05 && c.ds <= 0.15 && c.tsDeg <= 20;
      if (S.type === 'dyn' && good) hit('distance');
      if (good && c.risk === 'low') hit('feedback');
      if (c.live && c.m.a < 1 && c.ds <= 0.03) hit('proximity');
      if ((S.type === 'cond' || S.type === 'omni') && !S.phantom) S.sawCondNoPh = true;
      if ((S.type === 'cond' || S.type === 'omni') && S.phantom && S.sawCondNoPh) hit('phantom');
      if (S.type === 'omni' && c.live && c.ds <= 0.15 && c.risk !== 'low') hit('omni');
      draw(c);
      S.last = c;
      applyAudio(c);
    }
    function hit(id) { if (S.done[id]) return; S.done[id] = true; if (opts.onTask) opts.onTask(id); }
    function draw(c) {
      if (!c) c = S.last || calc();
      var w = cv.width, h = cv.height; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
      var Wp = w / dpr, Hp = h / dpr;
      ctx.fillStyle = '#eef3f8'; ctx.fillRect(0, 0, Wp, Hp);
      ctx.strokeStyle = '#d6dee8'; ctx.lineWidth = 1; for (var gx = 0; gx <= W; gx += 0.2) { ctx.beginPath(); ctx.moveTo(gx * px, 0); ctx.lineTo(gx * px, Hp); ctx.stroke(); } for (var gy = 0; gy <= H; gy += 0.2) { ctx.beginPath(); ctx.moveTo(0, gy * px); ctx.lineTo(Wp, gy * px); ctx.stroke(); }
      ctx.fillStyle = '#64748b'; ctx.font = '11px sans-serif'; ctx.fillText('격자 한 칸 = 20 cm', 8, Hp - 8);
      // 보컬(위에서 본 머리)
      var M = toPx(mouth), hd = { x: (mouth.x - 0.12) * px, y: mouth.y * px };
      ctx.fillStyle = '#f2d2b6'; ctx.strokeStyle = '#8b5e3c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(hd.x, hd.y, 0.11 * px, 0.13 * px, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#3f2a1d'; ctx.beginPath(); ctx.ellipse(hd.x - 0.03 * px, hd.y, 0.08 * px, 0.12 * px, 0, Math.PI * 0.5, Math.PI * 1.5); ctx.fill();
      ctx.fillStyle = '#b91c1c'; ctx.beginPath(); ctx.arc(M.x, M.y, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0f2747'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('보컬 (입 ●)', hd.x, hd.y - 0.17 * px);
      // 모니터 스피커(웨지) — 보컬 쪽을 향함
      var Wd = toPx(wedge); ctx.save(); ctx.translate(Wd.x, Wd.y); ctx.fillStyle = '#1f2937'; ctx.beginPath(); ctx.moveTo(-0.12 * px, -0.26 * px); ctx.lineTo(0.12 * px, -0.22 * px); ctx.lineTo(0.12 * px, 0.22 * px); ctx.lineTo(-0.12 * px, 0.26 * px); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2; for (var i = 1; i <= 3; i++) { ctx.beginPath(); ctx.arc(-0.12 * px, 0, (0.08 + i * 0.07) * px, Math.PI * 0.75, Math.PI * 1.25); ctx.stroke(); } ctx.restore();
      ctx.fillStyle = '#0f2747'; ctx.fillText('모니터 스피커', Wd.x, Wd.y - 0.32 * px);
      // 연결선
      var P = toPx(S);
      ctx.setLineDash([5, 5]); ctx.lineWidth = 1.5; ctx.strokeStyle = '#b91c1c'; ctx.beginPath(); ctx.moveTo(P.x, P.y); ctx.lineTo(M.x, M.y); ctx.stroke();
      ctx.strokeStyle = '#475569'; ctx.beginPath(); ctx.moveTo(P.x, P.y); ctx.lineTo(Wd.x, Wd.y); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#b91c1c'; ctx.font = 'bold 12px sans-serif'; ctx.fillText(Math.round(c.ds * 100) + ' cm', (P.x + M.x) / 2, (P.y + M.y) / 2 - 8);
      // 지향성 그림
      var a = MIC_TYPES[S.type].a, R = 0.42 * px, A = S.ang * Math.PI / 180;
      ctx.beginPath(); for (var d = 0; d <= 360; d += 4) { var th = d * Math.PI / 180, r = R * pattern(a, th), x = P.x + r * Math.cos(A + th), y = P.y + r * Math.sin(A + th); if (d) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.closePath();
      ctx.fillStyle = c.live ? 'rgba(14,116,144,0.16)' : 'rgba(100,116,139,0.10)'; ctx.fill(); ctx.strokeStyle = c.live ? '#0e7490' : '#94a3b8'; ctx.lineWidth = 2; ctx.stroke();
      // 마이크 몸체(손잡이는 뒤쪽)
      ctx.save(); ctx.translate(P.x, P.y); ctx.rotate(A); ctx.fillStyle = '#1f2937'; ctx.beginPath(); ctx.moveTo(-0.02 * px, -0.016 * px); ctx.lineTo(-0.2 * px, -0.011 * px); ctx.lineTo(-0.2 * px, 0.011 * px); ctx.lineTo(-0.02 * px, 0.016 * px); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#cbd5e1'; ctx.strokeStyle = '#475569'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, Math.max(7, 0.025 * px), 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.restore();
      var hp = handlePos(); ctx.fillStyle = '#f59e0b'; ctx.strokeStyle = '#92400e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(hp.x, hp.y, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#92400e'; ctx.font = 'bold 11px sans-serif'; ctx.fillText('방향', hp.x, hp.y - 13);
    }
    function handlePos() { var P = toPx(S), A = S.ang * Math.PI / 180, r = 0.5 * px; return { x: P.x + r * Math.cos(A), y: P.y + r * Math.sin(A) }; }
    /* ---- 소리 (교육용 근사) — 2026-10-22 다시 만듦 ----
       실제 보컬 녹음 → [방향: 입에서 벗어날수록 고음 감쇠] → [근접 효과: 저음 쉘빙] → [거리·지향성 크기] → 출력
       + 실내 울림(짧고 부드러운 잔향)을 거리와 상관없이 일정하게 → 멀어질수록 「멀고 울리는」 소리
       하울링은 소리로 흉내 내지 않고 화면 표시만 함(귀에 거슬리는 소리 방지). 하울링 연습은 「하울링 제어 훈련」 탭에서. */
    var actx = null, A = null;
    function roomIR(ctx) { var sr = ctx.sampleRate, n = Math.floor(sr * 0.9), b = ctx.createBuffer(2, n, sr);
      for (var k = 0; k < 2; k++) { var d = b.getChannelData(k), lp = 0; for (var i = 0; i < n; i++) { var t = i / sr, w = Math.random() * 2 - 1; lp += (w - lp) * 0.18; d[i] = t < 0.015 ? 0 : lp * Math.exp(-t / 0.16) * 0.9; } } return b; }   // 고음을 깎은 잡음 꼬리 = 부드러운 울림
    function startAudio() {
      var info = el.querySelector('[data-role=listen]'), btn = el.querySelector('[data-sim=play]');
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) { info.textContent = '이 브라우저에서는 소리를 낼 수 없어요.'; return; }
      actx = actx || new AC(); if (actx.resume) actx.resume();
      btn.disabled = true; info.textContent = '녹음을 불러오는 중…';
      loadVox(function (env) {
        btn.disabled = false;
        if (!env.buffer) { info.textContent = '녹음을 불러오지 못해 소리는 들을 수 없어요.'; return; }
        if (A) return;
        var src = actx.createBufferSource(); src.buffer = env.buffer; src.loop = true;
        var norm = actx.createGain(); norm.gain.value = 0.45 / (env.max || 1);
        var lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = -3.01;
        var ls = actx.createBiquadFilter(); ls.type = 'lowshelf'; ls.frequency.value = 160;
        var dir = actx.createGain();
        var room = actx.createConvolver(); room.buffer = roomIR(actx); var roomG = actx.createGain();
        var live = actx.createGain(), out = actx.createGain(); out.gain.value = 0.9;
        var lim = actx.createDynamicsCompressor(); lim.threshold.value = -10; lim.knee.value = 6; lim.ratio.value = 8; lim.attack.value = 0.005; lim.release.value = 0.2;
        src.connect(norm); norm.connect(lp); lp.connect(ls); ls.connect(dir); dir.connect(live);
        norm.connect(room); room.connect(roomG); roomG.connect(live);
        live.connect(lim); lim.connect(out); out.connect(actx.destination);
        src.start();
        A = { src: src, lp: lp, ls: ls, dir: dir, roomG: roomG, live: live, out: out };
        btn.textContent = '🔇 소리 끄기'; btn.classList.add('on');
        info.textContent = '지금 마이크 위치에서 들리는 소리예요. 끌어서 멀리·가까이, 옆으로 돌려 보세요. 하울링은 아래 「피드백 위험」으로 보여 줘요. (교육용 근사)';
        S.audio = true; applyAudio(S.last || calc(), true);
      });
    }
    function stopAudio() {
      if (A) { try { A.src.stop(); A.out.disconnect(); } catch (e) { /* 이미 멈춤 */ } }
      A = null; S.audio = false; var btn = el.querySelector('[data-sim=play]'); if (btn) { btn.textContent = '🔊 소리 켜기'; btn.classList.remove('on'); }
    }
    function applyAudio(c, now) {
      if (!A || !c) return; var t = actx.currentTime, tc = now ? 0.005 : 0.06, m = c.m;
      var f = clamp(16000 * Math.pow(0.5, c.tsDeg / 35), 3000, 16000);                       // 입에서 벗어날수록 고음부터 줄어듦
      A.lp.frequency.setTargetAtTime(f, t, tc);
      A.ls.gain.setTargetAtTime(Math.min(12, c.prox), t, tc);                                  // 근접 효과(귀 보호를 위해 +12 dB 까지만)
      var vDb = clamp(c.voice - m.sens, -36, 9);                                              // 거리·방향에 따른 목소리 크기(감도 차이는 듣기 편하게 빼고 화면에만 표시)
      A.dir.gain.setTargetAtTime(Math.pow(10, (vDb - 3) / 20), t, tc);
      var ree = m.a >= 1 ? 1 : m.a >= 0.5 ? 0.58 : 0.52;                                       // 실내 울림을 받는 정도(무지향 1, 카디오이드 ≈ 1/√3)
      A.roomG.gain.setTargetAtTime(0.045 * ree, t, tc);
      A.live.gain.setTargetAtTime(c.live ? 1 : 0, t, 0.02);
    }
    var drag = null;
    function evPt(e) { var r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    cv.addEventListener('pointerdown', function (e) {
      var p = evPt(e), hp = handlePos(), P = toPx(S);
      if (Math.hypot(p.x - hp.x, p.y - hp.y) < 16) drag = 'rot'; else if (Math.hypot(p.x - P.x, p.y - P.y) < 26) drag = 'move'; else return;
      cv.setPointerCapture(e.pointerId); e.preventDefault();
    });
    cv.addEventListener('pointermove', function (e) {
      var p = evPt(e);
      if (!drag) { var hp = handlePos(), P = toPx(S); cv.style.cursor = Math.hypot(p.x - hp.x, p.y - hp.y) < 16 ? 'grab' : Math.hypot(p.x - P.x, p.y - P.y) < 26 ? 'move' : ''; return; }
      if (drag === 'move') { S.x = clamp(p.x / px, 0.15, W - 0.15); S.y = clamp(p.y / px, 0.15, H - 0.15); }
      else { var P2 = toPx(S); S.ang = Math.atan2(p.y - P2.y, p.x - P2.x) * 180 / Math.PI; }
      update();
    });
    cv.addEventListener('pointerup', function () { drag = null; });
    el.addEventListener('change', function (e) {
      var t = e.target;
      if (t.name === 'simMicType') { S.type = t.value; update(); }
      if (t.getAttribute('data-sim') === 'phantom') { S.phantom = t.checked; update(); }
    });
    el.addEventListener('input', function (e) { if (e.target === angIn) { S.ang = +angIn.value; update(); } });
    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-sim]'); if (!b || b.tagName !== 'BUTTON') return; var k = b.getAttribute('data-sim');
      if (k === 'aim') S.ang = angTo(mouth) * 180 / Math.PI;
      if (k === 'near') { S.x = mouth.x + 0.08; S.y = mouth.y; S.ang = 180; }
      if (k === 'reset') { S.x = 1.3; S.y = 1.42; S.ang = -150; }
      if (k === 'play') { if (A) stopAudio(); else startAudio(); return; }
      update();
    });
    var ro = window.ResizeObserver ? new ResizeObserver(function () { size(); }) : null; if (ro) ro.observe(cv.parentNode); else window.addEventListener('resize', size);
    size(); update();
    return {
      destroy: function () { stopAudio(); if (actx && actx.close) { try { actx.close(); } catch (e) { /* noop */ } } actx = null; if (ro) ro.disconnect(); el.innerHTML = ''; },
      state: function () { var c = S.last || calc(); return { audio: !!A, lp: A ? A.lp.frequency.value : null, room: A ? A.roomG.gain.value : null, dir: A ? A.dir.gain.value : null, type: S.type, phantom: S.phantom, x: S.x, y: S.y, ang: S.ang, ds: c.ds, voice: c.voice, margin: c.margin, risk: c.risk, prox: c.prox, live: c.live, done: Object.keys(S.done) }; },
      set: function (o) { Object.keys(o).forEach(function (k) { S[k] = o[k]; }); var r = el.querySelector('input[name=simMicType][value="' + S.type + '"]'); if (r) r.checked = true; phIn.checked = !!S.phantom; update(); return this.state(); },
      mouth: mouth, wedge: wedge
    };
  }

  /* ======================================================================= Gain Structure */
  // 레벨 모델 (교육용 단순화, MG12XU 참고)
  //  입력: 녹음의 가장 큰 순간 = −28 dBu (노래하는 보컬 + 다이내믹 마이크 수준)
  //  미터: 0 = +4 dBu,  PEAK = +17 dBu (클리핑 3 dB 아래, MG12XU 설명서),  클리핑 = +20 dBu
  //  잡음: 프리앰프 뒤 −55 dBu 고정 (실제보다 크게 — 듣고 비교하기 쉽게)
  var IN_TOP = -28, NOM = 4, PEAK = 17, CLIP = 20, NOISE = -55;
  var FADER_PTS = [[0, -Infinity], [0.06, -60], [0.25, -30], [0.5, -10], [0.75, 0], [1, 10]];
  function faderDb(p) { if (p <= 0) return -Infinity; for (var i = 1; i < FADER_PTS.length; i++) { var a = FADER_PTS[i - 1], b = FADER_PTS[i]; if (p <= b[0]) { if (a[1] === -Infinity) return -60 - (b[0] - p) / b[0] * 30; return a[1] + (b[1] - a[1]) * (p - a[0]) / (b[0] - a[0]); } } return 10; }
  function faderPos(d) { for (var i = 1; i < FADER_PTS.length; i++) { var a = FADER_PTS[i - 1], b = FADER_PTS[i]; if (d <= b[1]) { if (a[1] === -Infinity) return b[0]; return a[0] + (b[0] - a[0]) * (d - a[1]) / (b[1] - a[1]); } } return 1; }
  var envCache = null;
  function b64ToBuf(uri) { var b = atob(uri.slice(uri.indexOf(',') + 1)), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u.buffer; }
  function loadVox(cb) {
    if (envCache) { cb(envCache); return; }
    var uri = window.MG12XU_SOURCE_AUDIO_BASE64 && window.MG12XU_SOURCE_AUDIO_BASE64.leadVox;
    var OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    function synth() { var blk = 0.05, n = 400, env = []; for (var i = 0; i < n; i++) { var t = i * blk, ph = (t % 5) / 5; env.push(ph < 0.85 ? 0.25 + 0.75 * Math.pow(Math.sin(Math.PI * ph / 0.85), 2) * (0.6 + 0.4 * Math.sin(t * 2.3)) : 0.01); } envCache = { env: env, blk: blk, dur: n * blk, buffer: null, synthetic: true }; cb(envCache); }
    if (!uri || !OAC) { synth(); return; }
    try {
      var oc = new OAC(1, 2, 44100);
      var pr = oc.decodeAudioData(b64ToBuf(uri), function (buf) { done(buf); }, function () { synth(); });
      if (pr && pr.catch) pr.catch(function () { /* 콜백에서 처리 */ });
    } catch (e) { synth(); }
    function done(buf) {
      if (envCache) return;
      var blk = 0.05, n = Math.floor(buf.duration / blk), sr = buf.sampleRate, ch = [], i, k, max = 0, env = [];
      for (k = 0; k < buf.numberOfChannels; k++) ch.push(buf.getChannelData(k));
      for (i = 0; i < n; i++) { var p = 0, s0 = Math.floor(i * blk * sr), s1 = Math.min(ch[0].length, Math.floor((i + 1) * blk * sr)); for (k = 0; k < ch.length; k++) for (var j = s0; j < s1; j += 2) { var v = Math.abs(ch[k][j]); if (v > p) p = v; } env.push(p); if (p > max) max = p; }
      env = env.map(function (v) { return v / (max || 1); });
      envCache = { env: env, blk: blk, dur: n * blk, buffer: buf, max: max, synthetic: false }; cb(envCache);
    }
  }
  function gainStage(el, opts) {
    opts = opts || {};
    var S = { gain: 10, fader: -20, done: {}, okSince: 0, clipSeen: false, audio: false, t0: performance.now(), hist: [], movedFader: false };
    el.innerHTML =
      '<div class="sim-gain">' +
        '<div class="sim-strip" aria-label="가상 채널">' +
          '<div class="sim-col"><div class="sim-lbl">GAIN</div><div class="sim-knob" data-role="knob"><i></i></div><input type="range" min="0" max="60" step="1" data-sim="gain" aria-label="GAIN"><b data-out="gain"></b>' +
            '<div class="sim-peak" data-role="peak"><i></i>PEAK</div></div>' +
          '<div class="sim-col"><div class="sim-lbl">입력 (PFL)</div><div class="sim-meter" data-role="mIn"></div></div>' +
          '<div class="sim-col"><div class="sim-lbl">페이더</div><input type="range" class="sim-vfader" min="0" max="1000" step="1" data-sim="fader" aria-label="채널 페이더" orient="vertical"><b data-out="fader"></b></div>' +
          '<div class="sim-col"><div class="sim-lbl">출력</div><div class="sim-meter" data-role="mOut"></div></div>' +
        '</div>' +
        '<div class="sim-side">' +
          '<div class="sim-box"><h4>소리</h4><button type="button" class="sim-btn sim-play" data-sim="play">🔊 소리 켜기</button><p class="sim-note" data-role="src"></p></div>' +
          '<div class="sim-box sim-read" data-role="read"></div>' +
          '<div class="sim-box"><h4>빠른 설정</h4><div class="sim-btns"><button type="button" class="sim-btn" data-preset="low">GAIN 작게 + 페이더 크게</button><button type="button" class="sim-btn" data-preset="hot">GAIN 너무 크게</button><button type="button" class="sim-btn" data-preset="start">처음 상태로</button></div></div>' +
        '</div>' +
      '</div>';
    var gIn = el.querySelector('[data-sim=gain]'), fIn = el.querySelector('[data-sim=fader]'), read = el.querySelector('[data-role=read]'), peakEl = el.querySelector('[data-role=peak]');
    var SEG_IN = [-30, -20, -10, -6, -3, 0, 3, 6, 10, 13], SEG_OUT = SEG_IN;
    function meterHtml(segs) { return segs.slice().reverse().map(function (s) { return '<span data-v="' + s + '" class="' + (s >= 10 ? 'r' : s >= 0 ? 'y' : 'g') + '"><em>' + (s > 0 ? '+' : '') + s + '</em></span>'; }).join(''); }
    el.querySelector('[data-role=mIn]').innerHTML = meterHtml(SEG_IN); el.querySelector('[data-role=mOut]').innerHTML = meterHtml(SEG_OUT);
    function setMeter(role, v) { el.querySelectorAll('[data-role=' + role + '] span').forEach(function (s) { s.classList.toggle('on', v >= +s.getAttribute('data-v')); }); }
    var env = null, actx = null, nodes = null, raf = 0, alive = true;
    function now() { if (S.audio && actx && nodes) return (actx.currentTime - nodes.start) % env.dur; return ((performance.now() - S.t0) / 1000) % (env ? env.dur : 1); }
    function levels() {
      var i = env ? Math.floor(now() / env.blk) % env.env.length : 0, a = env ? env.env[i] : 0;
      var inDbu = a > 0.0005 ? db(a) + IN_TOP : -100, pre = inDbu + S.gain, F = S.fader;
      var post = Math.min(pre, CLIP), out = F === -Infinity ? -100 : post + F, noiseOut = F === -Infinity ? -100 : NOISE + F;
      return { pre: pre, inM: pre - NOM, peak: pre >= PEAK, clip: pre >= CLIP, out: out, outM: Math.max(out, noiseOut) - NOM, noiseM: noiseOut - NOM, F: F };
    }
    function tick() {
      if (!alive) return; raf = requestAnimationFrame(tick);
      var L = levels(), t = performance.now();
      setMeter('mIn', L.inM); setMeter('mOut', L.outM); peakEl.classList.toggle('on', L.peak);
      S.hist.push({ t: t, inM: L.inM, peak: L.peak, outM: L.out - NOM, clip: L.clip, F: L.F }); while (S.hist.length && t - S.hist[0].t > 3000) S.hist.shift();
      var win = S.hist, span = win.length ? t - win[0].t : 0, maxIn = -100, anyPeak = false, maxOut = -100;
      win.forEach(function (h) { if (h.inM > maxIn) maxIn = h.inM; if (h.peak) anyPeak = true; if (h.outM > maxOut) maxOut = h.outM; });
      S.maxIn = maxIn; S.anyPeak = anyPeak; S.maxOut = maxOut;
      var proper = span > 2800 && maxIn >= -3 && maxIn <= 6 && !anyPeak;
      if (proper) hit('proper');
      if (L.clip) { S.clipSeen = true; if (L.F <= -10) hit('clip'); }
      var snr = maxIn + NOM - NOISE;
      if (span > 1500 && maxIn < -20 && L.F >= 6) hit('noise');
      if (proper && S.movedFader && maxOut >= -6 && maxOut <= 0) hit('fader');
      S.snr = snr;
      S.frame = (S.frame || 0) + 1; if (S.frame % 6 === 1) renderRead(L);
    }
    function renderRead(L) {
      var snr = S.snr, q = S.anyPeak ? ['bad', 'PEAK — GAIN 이 너무 커요'] : S.maxIn > 6 ? ['warn', '조금 커요'] : S.maxIn >= -3 ? ['ok', '알맞아요'] : S.maxIn >= -20 ? ['warn', '조금 작아요'] : ['bad', '너무 작아요'];
      var nq = snr >= 55 ? ['ok', '깨끗해요'] : snr >= 45 ? ['warn', '조용할 때 잡음이 조금 들려요'] : ['bad', '잡음이 잘 들려요'];
      read.innerHTML = '<h4>지금 상태 <small>교육용 단순 모델 · 최근 3초</small></h4>' +
        '<div class="sim-row"><span>GAIN / 페이더</span><b>+' + S.gain + ' dB / ' + fmtF(S.fader) + '</b></div>' +
        '<div class="sim-row"><span>입력 미터 최대</span><b class="' + q[0] + '">' + fmt(S.maxIn) + ' · ' + q[1] + '</b></div>' +
        '<div class="sim-row"><span>찌그러짐(클리핑)</span><b class="' + (L.clip || S.anyPeak ? 'bad' : 'ok') + '">' + (S.hist.some(function (h) { return h.clip; }) ? '있음 — 페이더를 내려도 남아요' : '없음') + '</b></div>' +
        '<div class="sim-row"><span>신호 대 잡음</span><b class="' + nq[0] + '">' + snr.toFixed(0) + ' dB · ' + nq[1] + '</b></div>' +
        '<div class="sim-row"><span>출력 미터 최대</span><b>' + fmt(S.maxOut) + '</b></div>';
    }
    function fmt(v) { return v <= -60 ? '−∞' : (v > 0 ? '+' : '') + v.toFixed(0); }
    function fmtF(d) { return d === -Infinity ? '−∞ dB' : (d > 0 ? '+' : '') + d.toFixed(1) + ' dB'; }
    function hit(id) { if (S.done[id]) return; S.done[id] = true; if (opts.onTask) opts.onTask(id); }
    function setGain(g) { S.gain = clamp(Math.round(g), 0, 60); gIn.value = S.gain; el.querySelector('[data-out=gain]').textContent = '+' + S.gain + ' dB'; el.querySelector('[data-role=knob] i').style.transform = 'rotate(' + (-135 + S.gain / 60 * 270) + 'deg)'; applyAudio(); }
    function setFader(d) { S.fader = d; fIn.value = Math.round(faderPos(d) * 1000); el.querySelector('[data-out=fader]').textContent = fmtF(d); applyAudio(); }
    function applyAudio() { if (!nodes) return; var t = actx.currentTime; nodes.pre.gain.setTargetAtTime(Math.pow(10, (S.gain + IN_TOP - CLIP) / 20) / (env.max || 1), t, 0.02); nodes.fad.gain.setTargetAtTime(S.fader === -Infinity ? 0 : Math.pow(10, S.fader / 20), t, 0.02); }
    function startAudio() {
      if (!env || !env.buffer) { el.querySelector('[data-role=src]').textContent = '녹음을 불러오지 못해 소리는 들을 수 없어요(미터는 가상 신호로 동작).'; return; }
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      actx = actx || new AC(); if (actx.resume) actx.resume();
      var src = actx.createBufferSource(); src.buffer = env.buffer; src.loop = true;
      var pre = actx.createGain(), shp = actx.createWaveShaper(); shp.curve = new Float32Array([-1, 1]); shp.oversample = 'none';   // ±1 을 넘으면 잘림 = 클리핑
      var nb = actx.createBuffer(1, actx.sampleRate * 2, actx.sampleRate), nd = nb.getChannelData(0); for (var i = 0; i < nd.length; i++) nd[i] = (Math.random() * 2 - 1);
      var ns = actx.createBufferSource(); ns.buffer = nb; ns.loop = true; var ng = actx.createGain(); ng.gain.value = Math.pow(10, (NOISE - CLIP) / 20);
      var fad = actx.createGain(), mon = actx.createGain(); mon.gain.value = 0.5;
      src.connect(pre); pre.connect(shp); shp.connect(fad); ns.connect(ng); ng.connect(fad); fad.connect(mon); mon.connect(actx.destination);
      var start = actx.currentTime + 0.05, off = now(); src.start(start, off); ns.start(start);
      nodes = { src: src, ns: ns, pre: pre, fad: fad, mon: mon, start: start - off };
      S.audio = true; applyAudio();
    }
    function stopAudio() { if (nodes) { try { nodes.src.stop(); nodes.ns.stop(); nodes.mon.disconnect(); } catch (e) { /* 이미 멈춤 */ } } var t = now(); nodes = null; S.audio = false; S.t0 = performance.now() - t * 1000; }
    el.addEventListener('input', function (e) { if (e.target === gIn) setGain(+gIn.value); if (e.target === fIn) { S.movedFader = true; setFader(faderDb(+fIn.value / 1000)); } });
    el.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.getAttribute('data-sim') === 'play') { if (S.audio) { stopAudio(); b.textContent = '🔊 소리 켜기'; b.classList.remove('on'); } else { startAudio(); if (S.audio) { b.textContent = '🔇 소리 끄기'; b.classList.add('on'); } } }
      var p = b.getAttribute('data-preset');
      if (p === 'low') { setGain(4); S.movedFader = true; setFader(8); }
      if (p === 'hot') { setGain(60); }
      if (p === 'start') { setGain(10); setFader(-20); }
    });
    setGain(S.gain); setFader(S.fader);
    el.querySelector('[data-role=src]').textContent = '녹음을 불러오는 중…';
    loadVox(function (e) { env = e; el.querySelector('[data-role=src]').textContent = e.synthetic ? '녹음을 불러오지 못해 가상 신호로 미터만 보여 줘요.' : '보컬 녹음(MG12XU 실습과 같은 음원)이 반복 재생돼요. 처음엔 소리가 꺼져 있어요.'; S.t0 = performance.now(); tick(); });
    return {
      destroy: function () { alive = false; cancelAnimationFrame(raf); stopAudio(); if (actx && actx.close) { try { actx.close(); } catch (e) { /* noop */ } } el.innerHTML = ''; },
      state: function () { return { gain: S.gain, fader: S.fader, maxIn: S.maxIn, anyPeak: S.anyPeak, maxOut: S.maxOut, snr: S.snr, clipSeen: S.clipSeen, audio: S.audio, ready: !!env, synthetic: env && env.synthetic, done: Object.keys(S.done) }; },
      set: function (o) { if (o.gain != null) setGain(o.gain); if (o.fader != null) { S.movedFader = true; setFader(o.fader); } return this.state(); },
      faderDb: faderDb, faderPos: faderPos
    };
  }
  window.STASims = { micPlacement: micPlacement, gainStage: gainStage, MIC_TYPES: MIC_TYPES };
})();
