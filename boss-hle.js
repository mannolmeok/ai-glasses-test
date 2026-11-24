// PROTOTYPE - NOT FOR PRODUCTION
// Question: 감독관 눈치를 보며 AI 안경으로 스캔하는 긴장감이, 장비와 시험이 함께 커지는 성장과 맞물려 엔딩까지 재밌나?
// Date: 2026-11-23
// 외계 마지막 시험(인류의 마지막 시험)의 최종 보스 Ω. 스캔·마킹 규칙은 game.js 그대로 쓰고, 감시 패턴·연출만 이 파일이 맡는다.
// 세 단계 모두 '틈'을 같은 규칙으로 뽑는다(gapLen): 스캔 한 번이 겨우 들어가는 틈이 대부분, 스캔이 안 끝나는 미끼 틈이 섞이고, 넉넉한 틈은 드물다.
// Ω 앞에서는 스캔이 무거워진다(hle_press). 손을 떼면 스캔은 처음부터라, 틈이 열리자마자 눌러 끝까지 쥐고 있어야 한다.
//   1단계 관찰: 거대한 눈의 붉은 시선 빔이 내 자리를 쓸고 나갔다가 곧 돌아온다. 가끔 천천히 훑는다(웅웅 + LOCK). 두 문제째부터 고리에서 보랏빛 두 번째 빔이 앞뒤로 따로 쓴다
//   전환: 눈이 떨리며 금이 번지고(3D), 정적 → 파편과 충격파로 터진다 → 작은 눈 열여섯 개가 호를 그리며 흩어져 자리를 잡고 차례로 뜬다
//   2단계 학습: 눈의 폭풍. 눈마다 탐조등 같은 광선을 쏘며 허공을 훑다가 패턴에 맞춰 내 책상으로 모인다. 고리 · 좌우 교대 · 일제 개안 · 깜빡임(미끼) · 두 바퀴. 두 문제 뒤 Ω가 렌즈를 두 단계 빼앗는다
//   전환: 모든 눈이 한 점으로 빨려 들어가 꺼진다 → 정적 → 그 자리에 '안경 쓴 나'가 앉아 있다
//   3단계 예측: 거울 속 나와 동시에 푼다. 문제 수가 많고 거울은 빠르다. 자주 고개를 들어 나를 보고(그동안 스캔하면 들킨다), 제 안경으로 내 렌즈를 방해한다(JAM: 스캔이 멎는다). 뒤처지면 속도를 올린다
//   최종: 거울 속 내가 굳고, 마지막 문제 "이 시험을 본 건 너인가, 나인가?"
'use strict';

window.BOSS = window.BOSS || {};
BOSS.hle = (() => {
  const lerp = (a, b, k) => a + (b - a) * k, ez = k => k * k * (3 - 2 * k), cl = (v, a, b) => Math.max(a, Math.min(b, v));
  const INKS = { used: '#74ff8e', proto: '#7fe9ff', mil: '#ffb23a', contact: '#7fe9ff', brain: '#ffd678' };
  const RED = '#ff4a5a', AMB = '#ffcf5a', WH = '#f4f8ff', NE = 16, ORDER = ['brain', 'contact', 'mil', 'proto', 'used'];
  function ink(E) { return INKS[hudStage(E)] || '#7fe9ff'; }
  function rgba(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; }
  const S = {
    hum: () => { toneAt(70, 0.7, 'sawtooth', 0.045); toneAt(73.5, 0.7, 'sawtooth', 0.045); },
    blink: () => { noiseAt(0.07, 0.04, 0, 900, 1.5); toneAt(330, 0.06, 'sine', 0.03); },
    crack: () => { noiseAt(0.22, 0.18, 0, 4200, 0.6); toneAt(1900, 0.07, 'square', 0.04); toneAt(1400, 0.1, 'square', 0.03, 0.06); },
    shatter: () => { noiseAt(0.6, 0.28, 0, 3000, 0.4); noiseAt(0.3, 0.2, 0.05, 900, 0.6); toneAt(55, 1.4, 'sine', 0.26); toneAt(41, 1.6, 'sine', 0.2, 0.1); },
    suck: () => { [420, 330, 250, 180, 120, 80].forEach((f, i) => toneAt(f, 0.22, 'sine', 0.06, i * 0.18)); },
    pop: () => { toneAt(60, 0.9, 'sine', 0.3); noiseAt(0.4, 0.2, 0, 600, 0.5); },
    tick: () => toneAt(660, 0.05, 'triangle', 0.04),
    scratch: () => noiseAt(0.05, 0.012, 0, 3400, 2),
    rumble: () => { toneAt(48, 1.5, 'sawtooth', 0.07); toneAt(51, 1.5, 'sawtooth', 0.06); toneAt(96, 1.3, 'sine', 0.05, 0.2); },
    jam: () => { noiseAt(0.5, 0.07, 0, 1800, 0.7); toneAt(90, 0.5, 'square', 0.03); },
    jamTell: () => { toneAt(1250, 0.05, 'square', 0.03); toneAt(1250, 0.05, 'square', 0.03, 0.12); },
  };

  // ---- 틈 뽑기: 지금 스캔 한 번에 걸리는 시간을 기준으로 ----
  function scanS() { return scanSecondsAt(Math.max(3, G.gear.lens - (E.omegaDown || 0))) * (E.jam || 1); }
  function gapLen(o, bait, roomy) { // o.baits: 미끼가 연달아 몇 번 나왔나 (두 번 넘게는 안 나온다)
    const S = scanS(), r = (o.baits || 0) >= 2 ? bait + rng() * (1 - bait) : rng();
    if (r < bait) { o.baits = (o.baits || 0) + 1; return TELL + S * between(0.3, 0.7); }
    o.baits = 0; return TELL + (r < 1 - roomy ? S + between(0.0, 0.16) : S + between(0.25, 0.5)); // 예고(TELL)가 시작되기 전까지가 스캔 한 번 + 아주 조금
  }
  const TELL = 0.33; // 보기 직전의 예고 시간: 이 안에 손을 떼면 된다
  function threat(th) { // Ω에게는 은신 장비가 통하지 않는다: 보는 동안 스캔하면 아주 빨리 들킨다. 예고 동안은 아직 안 본다
    if (E.finalQ) return { r: 0, idle: 0, src: null };
    const s = E.staff[0], on = s && s.phase === 'watch'; return { r: on ? tune.hle_sus : 0, idle: 0, src: on ? { v: tune.hle_sus, how: 'watch', by: s } : null };
  }

  // ---- 시작 · 단계 ----
  function moreQ(n) { let part = 5; while (E.qs.length < n && part < 12) E.qs = E.qs.concat(makeQuestions(rng, E.T, part++, E.used)); E.qs = E.qs.slice(0, n); assignAI(E.qs, false); }
  function start(E) {
    E.H = { t: 0, tr: null, flash: 0, crack: 0, say: null, beam: newBeam(1.6, 1), beamB: null, st: null, theft: null, mir: null, eyesOut: 0, stolen: false };
    E.staff.forEach(s => { s.bossCtl = true; s.phase = 'stand'; s.t = 0; s.dur = 1; });
    E.jam = tune.hle_press; moreQ(Math.round(tune.hle_q)); E.timeLeft = E.timeTotal = tune.hle_time;
    const J = Number(params.get('hleph') || 0); // check only: 바로 2·3·최종 단계부터
    for (let p = 1; p <= Math.min(3, J - 1); p++) { E.qs.forEach((q, i) => { if (E.answers[i] == null) { E.answers[i] = q.answer; E.via[i] = 'ai'; } }); closePart(); beginPart(p, false); E.breakT = 0; if (E.H.tr) E.H.tr = null; if (p === 1) E.H.eyesOut = 1; if (p === 3) finalNow(); }
    if (J >= 2) { E.start = 0.6; E.H.tr = null; }
    if (J >= 3) { E.H.stolen = true; const cur = ORDER.indexOf(hudStage(E)); E.omegaDown = 2; E.stageForce = ORDER[Math.min(ORDER.length - 1, Math.max(0, cur) + 2)]; } // 2단계에서 렌즈를 빼앗긴 상태로
  }
  const T_BURST = 1.8; // 눈이 터지는 순간 (전환 시작부터)
  function part(p) {
    const E0 = E, H = E0.H; if (!H) return;
    E0.noStartLine = true; H.t = 0; E0.sigRate = null;
    if (p === 1) { moreQ(Math.round(tune.hle_q)); E0.timeLeft = tune.hle_time; H.tr = { kind: 'shatter', t: 0, dur: 5.2 }; E0.breakT = 5.2; H.st = { t: 0, ev: [], end: 1.4, last: '', n: 0, baits: 0 }; }
    else if (p === 2) { moreQ(Math.round(tune.hle_race_q)); E0.timeLeft = E0.timeTotal + 30; H.tr = { kind: 'mirror', t: 0, dur: 5.8 }; E0.breakT = 5.8; H.mir = null; }
    else if (p === 3) { E0.jam = 1; if (G.ended) { E0.over = true; E0.all = true; E0.endT = 0; return; } E0.qs = E0.qs.filter(q => q.final).slice(-1); if (!E0.qs.length) { E0.over = true; E0.all = true; return; }
      H.tr = { kind: 'end', t: 0, dur: 3.2 }; E0.breakT = 3.2; }
  }
  function finalNow() { E.qi = 0; E.finalQ = true; E.sus = 0; E.jam = 1; E.sigRate = null; E.staff.forEach(s => { s.phase = 'stand'; s.asleep = true; s.away = true; }); }
  function canMark(i, how) { // 3단계: 거울 속 나와의 경주에서는 안경이 읽은 문제만 낸다
    if (E.H && E.part === 2 && !E.ai && how !== 'auto') { sfx.no(); E.H.nope = 0.6; return false; }
    return true;
  }

  // ---- 1단계: 거대한 눈의 시선 빔 ----
  // 빔 하나: 틈(gap) 동안 내 자리 밖으로 나갔다가 돌아오고, 본다(watch) 동안 내 자리를 가로지른다. u: 0이 내 자리, ±w 안이면 나를 비춘다
  function newBeam(first, side) { return { ph: 'gap', t: 0, dur: first, side, d: 0.95, u: side, k: 0, arm: false, baits: 0 }; }
  function stepOne(b, dt, w, ring) {
    const H = E.H; b.t += dt;
    if (b.ph === 'gap') { b.u = b.side * (w + (b.d - w) * Math.sin(Math.PI * cl(b.t / b.dur, 0, 1)));
      if (b.t >= b.dur) { b.ph = 'watch'; b.t = 0; b.dur = b.arm ? between(1.5, 2.1) : ring ? between(0.45, 0.7) : between(0.5, 0.85); } }
    else { b.u = b.side * w * (1 - 2 * cl(b.t / b.dur, 0, 1));
      if (b.t >= b.dur) { b.side = -b.side; b.ph = 'gap'; b.t = 0; b.dur = ring ? scanS() + between(ring[0], ring[1]) : gapLen(b, tune.hle_bait, 0.14); b.d = w + cl(b.dur * 0.42, 0.14, 0.75);
        b.arm = !ring && H.t > 6 && b.dur > scanS() && rng() < 0.22; if (b.arm) S.hum(); } } // 다음에는 천천히 훑는다: 미리 웅웅
    b.k = b.ph === 'watch' ? 2 : b.dur - b.t < TELL ? 1 : 0; return b.k;
  }
  function stepBeam(dt) {
    const H = E.H, w = tune.hle_beam;
    if (!H.beamB && (E.qi >= 2 || H.t > 18)) { H.beamB = newBeam(between(1.6, 2.4), -1); S.blink(); } // 두 번째 빔: 고리에서
    return Math.max(stepOne(H.beam, dt, w, null), H.beamB ? stepOne(H.beamB, dt, w, [2.2, 4.4]) : 0);
  }

  // ---- 2단계: 눈의 폭풍 ----
  // 패턴 하나 = 끊기지 않고 보는 구간. 패턴 사이의 틈은 gapLen으로 뽑는다. 눈 하나의 일정: t0 들썩(예고) → t1 뜸 → t2 감음
  function addPattern(st) {
    const kinds = ['ring', 'alt', 'all', 'pulse', 'twice'], pick = st.n < 3 ? ['ring', 'alt', 'all'][st.n] : (() => { let k; do k = kinds[Math.floor(rng() * kinds.length)]; while (k === st.last); return k; })();
    const T0 = st.end, ev = st.ev, tell = TELL + 0.12, half = e => e / NE > 0.5; let D = 1;
    const open = (e, a, b) => ev.push({ e, t0: T0 + a - tell, t1: T0 + a - 0.12, t2: T0 + b }); // eyeState는 뜨고 0.12초 뒤부터 '본다'로 치므로 그만큼 당겨 둔다
    if (pick === 'ring') { const s0 = Math.floor(rng() * NE), step = 0.075, dir = rng() < 0.5 ? 1 : -1; for (let j = 0; j < NE; j++) open((s0 + dir * j + NE * 2) % NE, j * step, j * step + 0.42); D = (NE - 1) * step + 0.42; }
    else if (pick === 'alt') { const n = 2 + (st.n > 4 ? 1 : 0), len = 0.62, first = rng() < 0.5 ? 0 : 1; for (let r = 0; r < n; r++) for (let e = 0; e < NE; e++) if (half(e) === ((r + first) % 2 === 0)) open(e, r * len, r * len + len + 0.06); D = n * len + 0.06; }
    else if (pick === 'all') { D = between(0.85, 1.25); for (let e = 0; e < NE; e++) open(e, 0, D); }
    else if (pick === 'pulse') { const on = 0.34, off = scanS() * between(0.45, 0.62); for (let r = 0; r < 3; r++) for (let e = 0; e < NE; e++) open(e, r * (on + off), r * (on + off) + on); D = 3 * on + 2 * off; } // 깜빡임: 사이 틈은 스캔이 안 끝난다
    else { const s0 = Math.floor(rng() * NE); let t = 0; for (let j = 0; j < NE * 2; j++) { open((s0 + j) % NE, t, t + 0.34); t += lerp(0.07, 0.045, j / (NE * 2)); } D = t + 0.3; }
    st.end = T0 + D + gapLen(st, tune.hle_bait - 0.16, 0.16); st.last = pick; st.n++;
  }
  function eyeState(st, e) { // 0 훑는 중 · 1 들썩(예고) · 2 뜸(아직 초점 전) · 3 나를 봄
    let s = 0; for (const v of st.ev) { if (v.e !== e || st.t < v.t0 || st.t >= v.t2) continue; s = Math.max(s, st.t < v.t1 ? 1 : st.t < v.t1 + 0.12 ? 2 : 3); } return s;
  }
  function stepStorm(dt) {
    const H = E.H, st = H.st; st.t += dt;
    while (st.end < st.t + 4) addPattern(st);
    st.ev = st.ev.filter(v => v.t2 > st.t - 0.5);
    let k = 0; for (let e = 0; e < NE; e++) { const s = eyeState(st, e); if (s === 3) k = 2; else if (s && k < 1) k = 1; }
    if (st.ev.some(v => v.t1 <= st.t && v.t1 > st.t - dt)) S.blink();
    return k;
  }

  // ---- 3단계: 거울 속 나 ----
  function newMirror() {
    const base = ((scanS() + 1.3) / 0.7 + 0.5) * tune.hle_mirror; // 틈을 거의 놓치지 않는 사람이 한 문제에 쓰는 시간쯤
    return { done: 0, prog: 0, per: E.qs.map((_, i) => base * (1 - 0.012 * i) * between(0.92, 1.08)), st: 'solve', t: 0, dur: 1.8, baits: 0, scr: 0, fast: false, jam: { st: 'idle', t: 0, dur: between(4, 6) } };
  }
  function stepMirror(dt) {
    const H = E.H, M = H.mir || (H.mir = newMirror()), mine = E.answers.filter(a => a != null).length; M.t += dt;
    if (mine >= E.qs.length) { E.sigRate = null; return 0; } // 내가 다 냈으면 거기서 멈춘다
    M.fast = mine > M.done; // 뒤처지면 속도를 올린다
    M.prog += dt / M.per[Math.min(M.done, M.per.length - 1)] * (M.st === 'look' ? 0.6 : 1) * (M.fast ? 1.18 : 1);
    if (M.st !== 'look') { M.scr -= dt; if (M.scr <= 0) { M.scr = M.fast ? 0.2 : 0.28; S.scratch(); } }
    if (M.prog >= 1) { M.prog = 0; M.done++; S.tick(); if (M.done >= E.qs.length) { E.sigRate = null; lose(); return 0; } }
    if (M.st === 'solve' && M.t >= M.dur - TELL) { M.st = 'tell'; M.t = 0; M.dur = TELL; }
    else if (M.st === 'tell' && M.t >= M.dur) { M.st = 'look'; M.t = 0; M.dur = between(0.7, 1.15); }
    else if (M.st === 'look' && M.t >= M.dur) { M.st = 'solve'; M.t = 0; M.dur = gapLen(M, tune.hle_bait - 0.08, 0.14); }
    const J = M.jam; J.t += dt; // 렌즈 방해: 거울 속 내 안경이 번쩍 → 잠깐 스캔이 멎는다 (쥐고 있어도 진행이 안 간다)
    if (J.st === 'idle' && J.t >= J.dur) { J.st = 'tell'; J.t = 0; J.dur = 0.5; S.jamTell(); }
    else if (J.st === 'tell' && J.t >= J.dur) { J.st = 'on'; J.t = 0; J.dur = between(0.8, 1.1); S.jam(); }
    else if (J.st === 'on' && J.t >= J.dur) { J.st = 'idle'; J.t = 0; J.dur = between(4.5, 7.5) * (M.fast ? 0.75 : 1); }
    E.sigRate = J.st === 'on' ? 0 : null;
    return M.st === 'look' ? 2 : M.st === 'tell' ? 1 : 0;
  }
  function lose() { const H = E.H; H.lost = true; E.forceFail = true; E.over = true; E.all = false; E.endT = -1.3; E.endLine = '거울 속 나: "내가 먼저 냈어."'; while (E.answers.length < E.qs.length) E.answers.push(null); sfx.fail(); }

  // ---- 연출 진행 ----
  function stepTrans(dt) {
    const H = E.H, R = H.tr, t0 = R.t; R.t += dt; const at = s => t0 < s && R.t >= s;
    if (R.kind === 'shatter') { if (at(0.05)) S.rumble(); if (at(0.4)) S.crack(); if (at(0.75)) S.crack(); if (at(1.05)) S.crack(); if (at(1.3)) { S.crack(); S.crack(); }
      if (at(T_BURST)) { S.shatter(); H.flash = 0.55; } for (let i = 0; i < 5; i++) if (at(T_BURST + 1.6 + i * 0.18)) S.blink(); if (at(T_BURST + 3.0)) S.blink(); }
    else if (R.kind === 'mirror') { if (at(0.05)) S.hum(); if (at(0.6)) S.suck(); if (at(1.85)) { S.pop(); H.flash = 0.85; } if (at(3.7)) sfx.ai(); if (at(4.0)) H.say = { text: '거울 속 나: "같이 풀자. 누가 먼저인지."', t: 0, dur: 2.4 }; }
    else if (R.kind === 'end') { if (at(0.1)) { S.crack(); H.mirCrack = 1; } if (at(1.3)) H.say = { text: '거울 속 나: "…그럼, 마지막 문제."', t: 0, dur: 1.9 }; if (at(3.0)) { sfx.warp(); finalNow(); } }
    if (R.t >= R.dur) H.tr = null;
  }
  function step(dt, taps) {
    const H = E.H; if (!H) return false;
    H.flash = Math.max(0, H.flash - dt * 1.6); if (H.say) { H.say.t += dt; if (H.say.t > H.say.dur) H.say = null; } if (H.nope > 0) H.nope -= dt;
    if (H.crack > 0) H.crack = Math.max(0, H.crack - dt / 1.8); if (H.mirCrack > 0 && E.part < 3) H.mirCrack = Math.max(0, H.mirCrack - dt);
    if (H.tr) stepTrans(dt);
    if (H.theft) { const F = H.theft, f0 = F.t; F.t += dt; E.holding = false; E.scan = E.ai ? E.scan : 0;
      if (f0 < 0.55 && F.t >= 0.55) { S.crack(); S.crack(); H.crack = 1; const cur = ORDER.indexOf(hudStage(E)); E.omegaDown = 2; E.stageForce = ORDER[Math.min(ORDER.length - 1, Math.max(0, cur) + 2)]; H.say = { text: 'Ω: "그 렌즈는 이미 배웠습니다."', t: 0, dur: 2.6 }; }
      if (F.t >= 2.1) { H.theft = null; } return true; } // 렌즈를 빼앗기는 동안은 멈춘다
    if (E.start > 0 || E.breakT > 0 || E.over || E.caught || E.finalQ || H.tr) return false;
    H.t += dt; let k = 0;
    for (const q of E.qs) if (q.pre) q.pre = false; // Ω 앞에서는 한 번 스캔에 한 문제만 (광각 렌즈의 미리 읽기가 막힌다)
    if (E.part === 0) k = stepBeam(dt);
    else if (E.part === 1) { k = stepStorm(dt); if (!H.stolen && (E.qi >= 2 || H.t > 22)) { H.stolen = true; H.theft = { t: 0 }; const sh = 2.2; H.st.ev.forEach(v => { if (v.t2 > H.st.t) { v.t0 += sh; v.t1 += sh; v.t2 += sh; } }); H.st.end += sh; return true; } }
    else if (E.part === 2) k = stepMirror(dt);
    const s = E.staff[0]; if (s) { s.phase = k === 2 ? 'watch' : k === 1 ? 'tell' : 'stand'; s.asleep = false; s.away = false; }
    return false;
  }

  // ---- 3D: 눈 · 빔 · 파편 · 거울 속 나 ----
  const W3 = { sc: null };
  function radialTex(Ax, col) { const t = Ax.canvasTex(64, 64, true), g = t.g, gr = g.createRadialGradient(32, 32, 2, 32, 32, 31); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); t.t.needsUpdate = true; return t.t; }
  function seeded(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
  function build(Ax) {
    const { THREE, EX } = Ax, sc = EX.scene, MY = EX.my || { x: 0.6, z: 0 }; W3.sc = sc; W3.v = new THREE.Vector3(); W3.v2 = new THREE.Vector3(); W3.v3 = new THREE.Vector3(); W3.burst = new THREE.Vector3(0, 2.3, -5.5);
    const cg = new THREE.ConeGeometry(1, 1, 18, 1, true); cg.translate(0, -0.5, 0); cg.rotateX(-Math.PI / 2); // 꼭짓점이 원점, +z 쪽으로 퍼진다
    const beamMat = col => new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false });
    const poolOf = col => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), new THREE.MeshBasicMaterial({ map: radialTex(Ax, col), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); m.rotation.x = -Math.PI / 2; m.visible = false; m.renderOrder = 5; sc.add(m); return m; };
    W3.beam = new THREE.Mesh(cg, beamMat(0xff2a3a)); W3.beam.visible = false; sc.add(W3.beam); W3.pool = poolOf('rgba(255,40,60,0.95)');
    W3.beamB = new THREE.Mesh(cg, beamMat(0xb45cff)); W3.beamB.visible = false; sc.add(W3.beamB); W3.poolB = poolOf('rgba(190,90,255,0.95)');
    // 작은 눈 열여섯 개: 저마다 탐조등 같은 광선을 쏜다
    W3.eyes = []; const eyeGeo = new THREE.IcosahedronGeometry(0.26, 1), irisGeo = new THREE.CircleGeometry(0.12, 14), pupGeo = new THREE.CircleGeometry(0.055, 10), rnd = seeded(77);
    for (let i = 0; i < NE; i++) { const a = i / NE * Math.PI * 2, r = i % 2 ? 3.4 : 2.9, y = [1.0, 2.3, 1.6, 2.8][i % 4], g = Ax.pivot(sc, MY.x + Math.sin(a) * r, y, EX.eye.z - Math.cos(a) * r), lid = Ax.pivot(g, 0, 0, 0);
      const ball = new THREE.Mesh(eyeGeo, Ax.psx(new THREE.MeshLambertMaterial({ color: 0xe8e4ee, flatShading: true }))); lid.add(ball);
      const irisM = Ax.glowMat(0x3a6aff), iris = new THREE.Mesh(irisGeo, irisM); iris.position.z = 0.25; lid.add(iris); const pup = new THREE.Mesh(pupGeo, Ax.glowMat(0x050508)); pup.position.z = 0.256; lid.add(pup);
      const ray = new THREE.Mesh(cg, beamMat(0xff2a3a)); ray.visible = false; ray.frustumCulled = false; sc.add(ray);
      g.visible = false; W3.eyes.push({ g, lid, irisM, ray, home: g.position.clone(), a, open: 0, aim: new THREE.Vector3(MY.x, 0.75, MY.z || 0), ph: rnd() * 6.28, sp: (0.5 + rnd() * 0.7) * (i % 2 ? 1 : -1), rho: 1.3 + rnd() * 1.3, tum: [rnd() * 8 - 4, rnd() * 8 - 4] }); }
    // 큰 눈이 깨질 때: 눈알 위로 번지는 금, 튀는 파편, 충격파
    const om = EX.staff[0]; W3.cr = null;
    if (om && om.head) { const r2 = seeded(31), segs = [], P = new THREE.Vector3(), D = new THREE.Vector3(), N = new THREE.Vector3(), Q = new THREE.Vector3();
      const walk = (p0, d0, n, t0) => { P.copy(p0); D.copy(d0); for (let j = 0; j < n; j++) { N.copy(P).normalize(); D.addScaledVector(N, -D.dot(N)).normalize(); Q.set(r2() - 0.5, r2() - 0.5, r2() - 0.5).multiplyScalar(0.9); D.add(Q).addScaledVector(N, -D.dot(N)).normalize();
          const a = P.clone(); P.addScaledVector(D, 0.2 + r2() * 0.12).normalize().multiplyScalar(1.012); segs.push({ t: t0 + j, a, b: P.clone() }); if (n > 5 && (j === 2 || j === 5) && r2() < 0.8) { const sp = P.clone(), sd = D.clone().applyAxisAngle(N, (r2() < 0.5 ? 1 : -1) * (0.7 + r2() * 0.6)); const keepP = P.clone(), keepD = D.clone(); walk(sp, sd, 4, t0 + j + 1); P.copy(keepP); D.copy(keepD); } } };
      for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283 + r2() * 0.5; walk(new THREE.Vector3(Math.cos(a) * 0.3, Math.sin(a) * 0.3, 1).normalize().multiplyScalar(1.012), new THREE.Vector3(Math.cos(a), Math.sin(a), 0), 10, r2() * 2); }
      segs.sort((x, y) => x.t - y.t); const arr = new Float32Array(segs.length * 6); segs.forEach((sg, i) => { arr.set([sg.a.x, sg.a.y, sg.a.z, sg.b.x, sg.b.y, sg.b.z], i * 6); });
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(arr, 3)); W3.cr = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xffffff, fog: false })); W3.cr.visible = false; W3.crN = segs.length; om.head.add(W3.cr); }
    const src = new THREE.IcosahedronGeometry(1.0, 1), sp0 = (src.index ? src.toNonIndexed() : src).getAttribute('position').array, nf = sp0.length / 9, r3 = seeded(53);
    W3.sh = { base: new Float32Array(sp0), n: nf, c: [], v: [], ax: [], w: [] };
    for (let f = 0; f < nf; f++) { const c = new THREE.Vector3(); for (let j = 0; j < 3; j++) c.add(new THREE.Vector3(sp0[f * 9 + j * 3], sp0[f * 9 + j * 3 + 1], sp0[f * 9 + j * 3 + 2])); c.multiplyScalar(1 / 3);
      W3.sh.c.push(c); W3.sh.v.push(c.clone().normalize().multiplyScalar(1.6 + r3() * 2.6).add(new THREE.Vector3(r3() - 0.5, r3() - 0.3, r3() - 0.5).multiplyScalar(1.4))); W3.sh.ax.push(new THREE.Vector3(r3() - 0.5, r3() - 0.5, r3() - 0.5).normalize()); W3.sh.w.push(3 + r3() * 9); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(sp0), 3));
    W3.shards = new THREE.Mesh(sg, Ax.psx(new THREE.MeshLambertMaterial({ color: 0xe8e4ee, flatShading: true, side: THREE.DoubleSide, transparent: true }))); W3.shards.visible = false; W3.shards.frustumCulled = false; sc.add(W3.shards);
    W3.wave = new THREE.Mesh(new THREE.RingGeometry(0.86, 1, 48), new THREE.MeshBasicMaterial({ color: 0xcfe0ff, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false })); W3.wave.visible = false; W3.wave.frustumCulled = false; sc.add(W3.wave);
    W3.core = new THREE.PointLight(0xffffff, 0, 14, 1.2); sc.add(W3.core);
    // 거울 속 나: 앱 아이콘처럼 어두운 얼굴, 검은 머리와 옷, 초록 안경. 내 책상 맞은편에 마주 앉는다
    const mz = EX.eye.z - 2.2, mirror = Ax.pivot(sc, 0, 0, 0); W3.mirror = mirror; mirror.visible = false;
    const B = Ax.batch(); B.box(2.2, 0.06, 1.6, 0x1c1e2a, MY.x, -0.02, mz + 0.25); B.box(0.9, 0.05, 0.55, 0x3a2e24, MY.x, 0.72, mz + 0.5); for (const [dx, dz] of [[-0.4, 0.27], [0.4, 0.27], [-0.4, 0.73], [0.4, 0.73]]) B.box(0.05, 0.7, 0.05, 0x2a2018, MY.x + dx, 0.36, mz + dz); B.box(0.44, 0.06, 0.44, 0x15151c, MY.x, 0.46, mz); B.box(0.42, 0.6, 0.06, 0x15151c, MY.x, 0.78, mz - 0.22); mirror.add(B.mesh());
    Ax.plane(mirror, 0.31, 0.43, new THREE.MeshLambertMaterial({ color: 0xeee8da }), MY.x, 0.748, mz + 0.48, -Math.PI / 2);
    const me = Ax.makeHuman({ top: 0x17171c, sleeve: 0x17171c, leg: 0x22242c, shirt: 0x17171c, hair: 'normal', hairC: 0x0b0b0f, skin: 0x50566a }); me.cone.visible = false; mirror.add(me.root); me.yaw = 0; W3.me = me; W3.mz = mz; W3.mx = MY.x;
    W3.lensL = Ax.glowMat(0x8dffb0); W3.lensR = Ax.glowMat(0x0e3a1e); W3.bars = Ax.glowMat(0x5dff8a);
    for (const sx of [-1, 1]) Ax.bx(me.head, 0.088, 0.064, 0.014, 0x1f5a34, sx * 0.05, 0.02, 0.112);
    Ax.bx(me.head, 0.07, 0.048, 0.006, 0, -0.05, 0.02, 0.12, W3.lensL); Ax.bx(me.head, 0.07, 0.048, 0.006, 0, 0.05, 0.02, 0.12, W3.lensR); for (let j = 0; j < 3; j++) Ax.bx(me.head, 0.04 - j * 0.008, 0.007, 0.004, 0, 0.045 - j * 0.004, 0.034 - j * 0.013, 0.124, W3.bars);
    W3.pencil = Ax.bx(me.arms[1], 0.012, 0.012, 0.16, 0xf5cc4a, 0, -0.62, 0.08);
    W3.spot = new THREE.PointLight(0xc8ffd8, 0, 3.2, 1.4); W3.spot.position.set(MY.x, 2.1, mz + 0.4); sc.add(W3.spot);
    W3.jamRay = new THREE.Mesh(cg, beamMat(0x6dff9a)); W3.jamRay.visible = false; W3.jamRay.frustumCulled = false; sc.add(W3.jamRay); // 거울 속 내 안경이 내 렌즈로 쏘는 방해 빛
  }
  function aimCone(mesh, from, to, rad, op) { mesh.position.copy(from); mesh.lookAt(to); mesh.scale.set(rad, rad, from.distanceTo(to)); mesh.material.opacity = op; }
  function world(E, now, Ax) {
    const H = E.H, { THREE, EX } = Ax; if (!H || !EX.scene || !EX.cam) return;
    if (W3.sc !== EX.scene) build(Ax);
    const om = EX.staff[0], R = H.tr, cam = EX.cam, MX = EX.my ? EX.my.x : 0.6, MZ = EX.my ? EX.my.z : 0; W3.om = om; W3.EX = EX;
    const sh = R && R.kind === 'shatter' ? R : null, tau = sh ? sh.t - T_BURST : -9; // tau: 터진 뒤 흐른 시간
    // Ω: 1단계에는 크게 떠서 빔 끝을 바라본다. 터진 뒤에는 없다 (three.js는 visible === false 만 숨기므로 꼭 true/false로)
    const omOn = !!((E.part === 0 && !R) || (sh && tau < 0));
    if (om) { om.root.visible = omOn; if (omOn) { om.root.scale.setScalar(1.7);
        if (sh) { const k = cl(sh.t / T_BURST, 0, 1), still = sh.t > T_BURST - 0.25, amp = still ? 0 : 0.012 + k * 0.05; om.root.position.x += Math.sin(now * 61) * amp; om.root.position.y += Math.sin(now * 83) * amp * 0.7; // 떨림이 커지다가 터지기 직전에 멎는다
          if (om.rings) om.rings.forEach((r, i) => { r.rotation.z += (0.02 + k * 0.25) * (i % 2 ? -1 : 1); r.rotation.x += k * 0.05; }); } } }
    const b = H.beam, b2 = H.beamB, ty = 0.752, tz = MZ - 0.02, w = tune.hle_beam, beamOn = !!(omOn && !sh && E.start <= 0 && !E.over), fade = sh ? cl(1 - sh.t / 0.3, 0, 1) : 1;
    W3.beam.visible = W3.pool.visible = beamOn || (omOn && fade > 0 && Math.floor(now * 30) % 2 === 0); W3.beamB.visible = W3.poolB.visible = !!(beamOn && b2);
    if (om && omOn) { om.root.updateMatrixWorld(); om.root.getWorldPosition(W3.v); W3.burst.copy(W3.v); W3.v2.set(MX + b.u * 2.1, ty, tz); if (!sh) om.head.lookAt(W3.v2);
      const kk = Math.max(b.k, b2 ? b2.k : 0); om.irisMat.color.setHex(sh ? (Math.floor(now * (8 + sh.t * 14)) % 2 ? 0x5a0a14 : 0xff2e47) : kk === 2 ? 0xff2e47 : kk === 1 || b.arm ? 0xffa030 : 0x3a6aff);
      if (W3.beam.visible) { const rad = w * 2.1; aimCone(W3.beam, W3.v, W3.v2, rad, (b.k === 2 ? 0.24 : 0.13) * fade); W3.pool.position.set(W3.v2.x, ty + 0.003, tz); W3.pool.scale.setScalar(rad * 1.6); W3.pool.material.opacity = (b.k === 2 ? 1 : 0.75) * fade; }
      if (W3.beamB.visible) { const rad = w * 1.5; W3.v3.set(MX, ty, tz + b2.u * 1.5); aimCone(W3.beamB, W3.v, W3.v3, rad, b2.k === 2 ? 0.26 : 0.14); W3.poolB.position.set(MX, ty + 0.004, W3.v3.z); W3.poolB.scale.setScalar(rad * 1.7); W3.poolB.material.opacity = b2.k === 2 ? 1 : 0.75; } }
    // 금 · 파편 · 충격파
    if (W3.cr) { W3.cr.visible = !!(sh && tau < 0 && sh.t > 0.3); if (W3.cr.visible) W3.cr.geometry.setDrawRange(0, 2 * Math.floor(W3.crN * Math.pow(cl((sh.t - 0.3) / (T_BURST - 0.55), 0, 1), 1.6))); }
    W3.core.intensity = sh ? (tau < 0 ? Math.pow(cl(sh.t / T_BURST, 0, 1), 2) * 5 : Math.max(0, 7 - tau * 9)) : 0; W3.core.position.copy(W3.burst);
    const shOn = !!(sh && tau >= 0 && tau < 2.0); W3.shards.visible = shOn;
    if (shOn) { const S0 = W3.sh, pos = W3.shards.geometry.getAttribute('position'), a = pos.array, drag = (1 - Math.exp(-1.9 * tau)) / 1.9, shrink = cl(1 - tau / 2.0, 0, 1), V = W3.v, C = W3.v2;
      for (let f = 0; f < S0.n; f++) { C.copy(S0.c[f]).addScaledVector(S0.v[f], drag); C.y -= 0.35 * tau * tau; const ang = S0.w[f] * tau;
        for (let j = 0; j < 3; j++) { const o = f * 9 + j * 3; V.set(S0.base[o] - S0.c[f].x, S0.base[o + 1] - S0.c[f].y, S0.base[o + 2] - S0.c[f].z).applyAxisAngle(S0.ax[f], ang).multiplyScalar(shrink).add(C); a[o] = V.x; a[o + 1] = V.y; a[o + 2] = V.z; } }
      pos.needsUpdate = true; W3.shards.position.copy(W3.burst); W3.shards.scale.setScalar(1.7); W3.shards.material.opacity = cl(1.6 - tau, 0, 1); }
    const wvOn = !!(sh && tau >= 0 && tau < 0.8); W3.wave.visible = wvOn; if (wvOn) { W3.wave.position.copy(W3.burst); W3.wave.lookAt(cam.position); W3.wave.scale.setScalar(1.5 + tau * 16); W3.wave.material.opacity = 0.8 * (1 - tau / 0.8); }
    // 눈 열여섯 개: 평소에는 허공을 훑고, 볼 때는 광선이 내 책상으로 모인다
    const eyesOn = !!((E.part === 1 && !(sh && tau < 0)) || (R && R.kind === 'mirror' && R.t < 1.9)), live = E.part === 1 && !R && E.start <= 0 && !E.over;
    let seen = 0, warn = 0;
    W3.eyes.forEach((e, i) => { e.g.visible = eyesOn; e.ray.visible = false; if (!eyesOn) return;
      let st = 0, p = e.home, fly = 1, rays = live;
      if (R && R.kind === 'mirror') { st = 3; const k = ez(cl((R.t - 0.6) / 1.25, 0, 1)); W3.v.copy(e.home).lerp(W3.v2.set(W3.mx, 1.25, W3.mz), k); p = W3.v; e.g.scale.setScalar(1 - 0.85 * k); rays = R.t < 0.6; }
      else if (sh) { const d = (i % 8) * 0.035, q = cl((tau - d) / 1.3, 0, 1); fly = 1 - Math.pow(1 - q, 3); W3.v.copy(W3.burst).lerp(e.home, fly); W3.v.y += Math.sin(fly * Math.PI) * 0.7; p = W3.v; e.g.scale.setScalar(0.35 + 0.65 * fly);
        const o = tau - (1.6 + ((i * 5) % NE) / NE * 0.9); st = fly >= 1 && o > 0 && tau < 3.05 ? 3 : 0; rays = st === 3; } // 자리를 잡으면 차례로 뜬다 → 한꺼번에 감는다
      else { e.g.scale.setScalar(1); if (H.theft) st = 3; else if (H.st && live) st = eyeState(H.st, i); }
      e.g.position.copy(p);
      const cx = MX, cz = MZ - 0.02, th = e.ph + now * e.sp; // 훑는 표적: 내 책상 둘레를 돈다
      W3.v3.set(cx, 0.75, cz); if (st < 2 && !(R && R.kind === 'mirror')) { const rr = st === 1 ? e.rho * 0.45 : e.rho; W3.v3.x += Math.cos(th) * rr; W3.v3.z += Math.sin(th) * rr * 0.8; W3.v3.y = 0.2; }
      e.aim.lerp(W3.v3, st >= 2 ? 0.4 : 0.12);
      if (sh && fly < 1) e.g.rotation.set(tau * e.tum[0], tau * e.tum[1], 0); else e.g.lookAt(e.aim);
      const want = sh ? (st === 3 ? 1 : fly < 1 ? 0.75 : 0.1) : st >= 2 ? 1 : st === 1 ? 0.5 + 0.2 * Math.sin(now * 40 + i) : 0.6; e.open = lerp(e.open, want, 0.35); e.lid.scale.set(1, Math.max(0.08, e.open), 1);
      e.irisM.color.setHex(st === 3 ? 0xff2e47 : st >= 1 ? 0xffa030 : 0x3a6aff);
      if (rays) { e.ray.visible = true; e.ray.material.color.setHex(st >= 2 ? 0xff2a3a : st === 1 ? 0xffa030 : 0x5a7dff); aimCone(e.ray, e.g.position, e.aim, st >= 2 ? 0.16 : 0.1, st === 3 ? 0.3 : st >= 1 ? 0.2 : 0.07); }
      if (st === 3) seen++; else if (st >= 1) warn++; });
    if (E.part === 1 && live) { W3.pool.visible = seen + warn > 0; W3.pool.position.set(MX, ty + 0.003, tz); W3.pool.scale.setScalar(seen ? 1.25 : 0.8); W3.pool.material.opacity = seen ? 1 : 0.45; } // 눈들이 보면 시험지가 붉게 물든다
    // 거울 속 나
    const mirOn = !!(E.part >= 2 && !(R && R.kind === 'mirror' && R.t < 2.75)); W3.mirror.visible = mirOn; W3.jamRay.visible = false;
    if (mirOn) { const M = H.mir, fin = E.part >= 3, rise = R && R.kind === 'mirror' ? ez(cl((R.t - 2.75) / 1.1, 0, 1)) : 1, J = M && !fin && !R ? M.jam : null, jam = J && J.st !== 'idle';
      W3.spot.intensity = 2.4 * rise; const look = fin || jam || (M && (M.st === 'look' || (M.st === 'tell' && M.t > 0.2))) || (R && R.kind === 'mirror' && R.t < 4.4) || (R && R.kind === 'end' && R.t > 0.6);
      const eyesUp = fin || (M && (M.st === 'look' || (M.st === 'tell' && M.t > 0.2))) || !!R, writing = !look && !fin && (!R || R.t > 4.6), hp = look ? (fin ? -0.04 : eyesUp ? 0.0 : 0.3) : 0.5; // 방해할 때는 고개를 반만 든다 (보는 것과 구별)
      Ax.poseModel(W3.me, { x: W3.mx, y: 0, z: W3.mz, yaw: 0, sit: 1, now, phase: 'stand', headPitch: hp, moving: false, walk: 0 });
      if (writing) W3.me.arms[1].rotation.x = -0.95 + Math.sin(now * (M && M.fast ? 19 : 13)) * 0.07;
      const crack = H.mirCrack > 0 || fin, fl = Math.floor(now * 14) % 3 === 0, jf = jam && Math.floor(now * 20) % 2;
      W3.lensL.color.setHex(crack ? (fl ? 0x2a3a30 : 0x8dffb0) : jam ? (jf ? 0xffffff : 0x8dffb0) : R && R.kind === 'mirror' && R.t < 3.7 ? 0x1a2a20 : 0x8dffb0); W3.lensR.color.setHex(crack ? 0x101410 : jam ? (jf ? 0xffffff : 0x3dff7a) : look ? 0x3dff7a : 0x0e3a1e); W3.bars.color.setHex(crack ? 0x203020 : 0x5dff8a);
      if (J && J.st === 'on') { W3.me.head.getWorldPosition(W3.v); W3.v.z += 0.14; W3.v2.copy(EX.eye); W3.v2.y -= 0.08; W3.jamRay.visible = true; aimCone(W3.jamRay, W3.v, W3.v2, 0.2, 0.2 + 0.1 * Math.sin(now * 40)); }
    } else W3.spot.intensity = 0;
    // 카메라: 연출 중에는 그쪽을 보게 한다. 3단계는 앞을 보면 거울 속 나와 눈높이가 맞는다
    if (E.part >= 2 && EX.views && EX.views.front && EX.views.front.pitch > 0.05) EX.views = Object.assign({}, EX.views, { front: { yaw: 0.0, pitch: -0.02, fov: 54 } });
    if (R) { let yaw = 0.1, pitch = 0.18, fov = 60;
      if (sh) { if (tau < 0) { const k = cl(sh.t / T_BURST, 0, 1); fov = 60 - 9 * ez(k); pitch = 0.18 + 0.03 * k; } // 천천히 다가간다
        else { const q = ez(cl((tau - 0.9) / 2.3, 0, 1)), jit = Math.max(0, 1 - tau / 0.5) * 0.035; fov = 60 + 8 * Math.exp(-tau * 5) - 9 * Math.exp(-tau * 14); yaw = 0.1 + 0.85 * Math.sin(q * Math.PI * 2) + Math.sin(now * 97) * jit; pitch = 0.2 - 0.1 * Math.sin(q * Math.PI) + Math.sin(now * 113) * jit; } } // 충격으로 흔들리고, 흩어진 눈들을 따라 좌우를 본다
      else if (R.kind === 'mirror') { const k = ez(cl((R.t - 0.4) / 1.6, 0, 1)); pitch = lerp(0.18, -0.02, k); yaw = lerp(0.1, 0, k); fov = lerp(60, 54, k); }
      else { pitch = -0.02; yaw = 0; fov = 50 + (1 - cl(R.t / 2.5, 0, 1)) * 4; }
      cam.rotation.set(pitch, yaw, 0, 'YXZ'); if (Math.abs(cam.fov - fov) > 0.01) { cam.fov = fov; cam.updateProjectionMatrix(); } }
    cam.updateMatrixWorld(); EX.scene.updateMatrixWorld();
  }

  // ---- 렌즈 화면 ----
  function cracks(c, cx, cy, r, k, seed) { // 한 점에서 퍼지는 금 (렌즈를 빼앗길 때)
    const rnd = seeded(seed);
    c.lineWidth = 1.2; for (let i = 0; i < 9; i++) { let a = rnd() * Math.PI * 2, x = cx, y = cy; c.strokeStyle = 'rgba(255,255,255,0.85)'; c.beginPath(); c.moveTo(x, y);
      const n = 5; for (let j = 0; j < n; j++) { a += (rnd() - 0.5) * 0.9; const L = r * k / n * (0.6 + rnd()); x += Math.cos(a) * L; y += Math.sin(a) * L; c.lineTo(x, y); } c.stroke(); }
    c.strokeStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.arc(cx, cy, r * k * 0.25, 0, 7); c.stroke();
  }
  function hudFx(k, L, E, now) { // 섬광 · 금 · 자막 (연출 중에도 그린다)
    const H = E.H;
    if (H.crack > 0) hudDraw(k, c => { c.globalAlpha = Math.min(1, H.crack * 1.4); cracks(c, 220, 140, 260, 1, 11); cracks(c, 470, 230, 200, 1, 29); c.globalAlpha = 1; });
    if (H.flash > 0) { k.b.globalAlpha = Math.min(1, H.flash); k.R(0, 0, L.W, L.H, '#ffffff'); k.b.globalAlpha = 1; }
    if (H.say) { const a = Math.min(1, (H.say.dur - H.say.t) / 0.4, H.say.t / 0.2); k.b.globalAlpha = cl(a, 0, 1); k.SUB(H.say.text, L.W / 2, L.H - 30, 12, '#ffffff', 'center'); k.b.globalAlpha = 1; }
  }
  function hud(k, L, E, now, H0) { const H = E.H; if (!H || !(H.tr || H.theft)) return false; // 연출 중에는 렌즈 화면을 비우고 장면만
    if (H.theft && H.theft.t > 0.55) return false;
    if (H.theft) { k.b.globalAlpha = 0.6 + 0.4 * Math.sin(now * 50); k.b.drawImage(lensGlow('A', '#ff5a5a'), 0, 0); k.b.globalAlpha = 1; }
    hudFx(k, L, E, now); return true; }
  function gazeBar(k, b, x0, y, w, col, lab, hot, now) { // 빔 하나가 어디 있나: 가운데 꺾쇠가 내 자리
    const cx = x0 + w / 2, bw = tune.hle_beam / 1.1 * w;
    hudDraw(k, c => { c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(x0, y, w, 1); for (const f of [0, 0.25, 0.75, 1]) c.fillRect(x0 + w * f - 0.5, y - 2, 1, 5);
      const bx = cx + (b.u / 1.1) * (w / 2) - bw / 2; c.fillStyle = b.k === 2 ? RED : b.k === 1 ? AMB : rgba(hot, 0.7); c.fillRect(cl(bx, x0 - 6, x0 + w + 6 - bw), y - 2.5, bw, 6);
      c.fillStyle = b.k === 2 ? RED : b.k === 1 ? AMB : col; c.fillRect(cx - 0.5, y - 5, 1, 11); });
    k.M(lab, x0 - 8, y + 0.5, 6.5, rgba(col, 0.85), 'right', 700); if (b.arm && Math.floor(now * 6) % 2) k.M('LOCK', x0 + w + 8, y + 0.5, 6.5, AMB, 'left', 700);
  }
  function hudTop(k, L, E, now) {
    const H = E.H; if (!H) return; const col = ink(E), live = E.start <= 0 && !E.over && !E.caught && !(E.breakT > 0);
    if (live && E.part === 0) { gazeBar(k, H.beam, 250, 57, 140, col, 'GAZE', RED, now); if (H.beamB) gazeBar(k, H.beamB, 250, 69, 140, col, 'RING', '#b45cff', now); }
    if (live && E.part === 1 && H.st) { const cx = 586, cy = 238, r = 30; // 눈 레이더: 위쪽이 내 앞
      hudDraw(k, c => { c.fillStyle = 'rgba(3,6,10,0.45)'; c.beginPath(); c.arc(cx, cy, r + 9, 0, 7); c.fill(); c.strokeStyle = rgba(col, 0.45); c.lineWidth = 1; c.beginPath(); c.arc(cx, cy, r, 0, 7); c.stroke(); c.strokeStyle = rgba(col, 0.2); c.beginPath(); c.arc(cx, cy, r * 0.5, 0, 7); c.stroke();
        c.fillStyle = col; c.beginPath(); c.moveTo(cx, cy - 5); c.lineTo(cx - 3.5, cy + 3); c.lineTo(cx + 3.5, cy + 3); c.closePath(); c.fill();
        for (let e = 0; e < NE; e++) { const s = eyeState(H.st, e), a = e / NE * Math.PI * 2, x = cx + Math.sin(a) * r, y = cy - Math.cos(a) * r;
          if (s === 3) { c.strokeStyle = rgba(RED, 0.55); c.lineWidth = 1; c.beginPath(); c.moveTo(x, y); c.lineTo(cx, cy); c.stroke(); c.fillStyle = RED; c.beginPath(); c.arc(x, y, 3.2, 0, 7); c.fill(); }
          else if (s >= 1) { c.fillStyle = Math.floor(now * 12) % 2 ? AMB : rgba(AMB, 0.4); c.beginPath(); c.arc(x, y, 2.4, 0, 7); c.fill(); }
          else { c.fillStyle = rgba(col, 0.4); c.beginPath(); c.arc(x, y, 1.5, 0, 7); c.fill(); } } });
      k.M('EYES', cx, cy - r - 14, 6.5, rgba(col, 0.85), 'center', 700); }
    if (live && E.part === 2 && H.mir) { const M = H.mir, n = E.qs.length, gap = 9, x0 = 606 - (n - 1) * gap, y0 = 222, J = M.jam; // 경주: 위는 거울 속 나, 아래는 나
      const mine = E.answers.filter(a => a != null).length;
      hudDraw(k, c => { c.fillStyle = 'rgba(3,6,10,0.5)'; c.fillRect(x0 - 40, y0 - 18, (n - 1) * gap + 52, 52);
        for (let i = 0; i < n; i++) { const x = x0 + i * gap; c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 1; c.strokeRect(x - 3, y0 - 3, 6, 6); if (i < M.done) { c.fillStyle = WH; c.fillRect(x - 3, y0 - 3, 6, 6); } else if (i === M.done) { c.fillStyle = WH; c.fillRect(x - 3, y0 + 3 - 6 * M.prog, 6, 6 * M.prog); }
          c.strokeStyle = rgba(col, 0.8); c.strokeRect(x - 3, y0 + 14 - 3, 6, 6); if (i < mine) { c.fillStyle = col; c.fillRect(x - 3, y0 + 14 - 3, 6, 6); } }
        if (J.st === 'on') { c.fillStyle = 'rgba(120,255,160,0.07)'; c.fillRect(0, 0, L.W, L.H); for (let i = 0; i < 16; i++) { const yy = (Math.sin(i * 91.7 + Math.floor(now * 24) * 13.1) * 0.5 + 0.5) * L.H, ww = 60 + (i * 53) % 260, xx = (i * 137 + Math.floor(now * 24) * 71) % L.W; c.fillStyle = `rgba(140,255,170,${0.18 + (i % 3) * 0.08})`; c.fillRect(xx, yy, ww, 1 + (i % 3)); } } });
      k.M('거울', x0 - 10, y0, 7, WH, 'right', 700); k.M('나', x0 - 10, y0 + 14, 7, col, 'right', 700);
      const mid = x0 + (n - 1) * gap / 2; if (M.st !== 'solve') k.M(M.st === 'look' ? 'EYES ON' : '…', mid, y0 - 12, 6.5, M.st === 'look' ? RED : AMB, 'center', 700); else if (M.fast) k.M('▲ FAST', mid, y0 - 12, 6.5, AMB, 'center', 700);
      if (J.st === 'on') k.M('JAM · 스캔 멈춤', L.W / 2, 96, 9, '#8dffb0', 'center', 700); else if (J.st === 'tell' && Math.floor(now * 10) % 2) k.M('JAM', L.W / 2, 96, 9, AMB, 'center', 700);
      if (H.nope > 0) k.SUB('(읽지 않은 문제는 낼 수 없다)', L.W / 2, L.H - 56, 10, '#ffd0d0', 'center'); }
    hudFx(k, L, E, now);
  }
  return { start, step, part, canMark, threat, world, hud, hudTop, _W3: W3, _eye: eyeState };
})();
