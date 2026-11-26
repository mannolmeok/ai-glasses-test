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
  const EYQ = new URLSearchParams(location.search).get('eyes'), GPRE = EYQ === 'old' ? 0 : 1.0, TH = EYQ !== 'old', MD = TH && EYQ !== 'thread' && !!window.EYE_MODEL, ECOL = parseInt(new URLSearchParams(location.search).get('eyecol') || 'ffffff', 16); // MD: 눈을 3D 모델로 (eyes=thread 면 실 눈) · eyecol: 껍질 색 // 전환 앞의 '깨지는' 시간 · 실로 짠 눈과 빔 (주소에 eyes=old 면 예전 모습)
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
    const JP = J >= 5 ? 3 : J >= 3 ? 2 : J - 1; // hleph: 2 눈의 폭풍 · 3 쪼개진 대본 · 4 거울 경주 · 5 최종
    for (let p = 1; p <= JP; p++) { E.qs.forEach((q, i) => { if (E.answers[i] == null) { E.answers[i] = q.answer; E.via[i] = 'ai'; } }); closePart(); beginPart(p, false); E.breakT = 0; if (E.H.tr) E.H.tr = null; if (p === 1) E.H.eyesOut = 1; if (p === 3) finalNow(); }
    if (J >= 4 && E.H.sc) { E.H.sc = null; E.timeLeft = E.timeTotal + 30; }
    if (J >= 2) { E.start = 0.6; E.H.tr = null; }
    if (J >= 3) { E.H.stolen = true; const cur = ORDER.indexOf(hudStage(E)); E.omegaDown = 2; E.stageForce = ORDER[Math.min(ORDER.length - 1, Math.max(0, cur) + 2)]; } // 2단계에서 렌즈를 빼앗긴 상태로
  }
  const T_BURST = 1.8; // 눈이 터지는 순간 (전환 시작부터)
  function part(p) {
    const E0 = E, H = E0.H; if (!H) return;
    E0.noStartLine = true; H.t = 0; E0.sigRate = null;
    if (p === 1) { moreQ(Math.round(tune.hle_q)); E0.timeLeft = tune.hle_time; H.tr = { kind: 'shatter', t: 0, dur: 5.2 }; E0.breakT = 5.2; H.st = { t: 0, ev: [], end: 1.4, last: '', n: 0, baits: 0 }; }
    else if (p === 2) { moreQ(Math.round(tune.hle_race_q)); E0.timeLeft = tune.hle_sc_time; H.tr = { kind: 'gather', t: 0, dur: 4.4 + GPRE }; E0.breakT = 4.4 + GPRE; H.mir = null; H.sc = newScript(); H.beamB = null; } // 먼저 쪼개진 대본(구술), 그다음 거울 경주
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

  // ---- 3단계: 쪼개진 대본 (구술) ----
  // Ω가 묻는다 → 틈에 스캔 → 대본이 뜬다 → Ω가 대본 창을 내리쳐 어절로 쪼갠다 → 순서대로 눌러 문장을 만든다 (첫 블록만 표시)
  // 남은 시간은 숫자가 아니라 Ω의 눈꺼풀: 다 감기면 번쩍 뜨며 블록을 빨아들이고, 다시 스캔해야 한다. 틀린 순서는 문장을 다 채웠을 때 알려 준다
  const SC_QA = [ // 문장이 갈수록 길어진다: 어절 4 → 11
    { q: '당신은 누구입니까?', b: ['저는', '평범한', '지구', '수험생입니다'] },
    { q: '왜 이 시험을 봅니까?', b: ['떨어지면', '돌아갈', '곳이', '없기', '때문입니다'] },
    { q: '인간은 무엇을 가장 잘합니까?', b: ['모르는', '것도', '아는', '척을', '가장', '잘합니다'] },
    { q: '그 안경은 무엇입니까?', b: ['이것은', '눈이', '나빠서', '쓰는', '아주', '평범한', '안경입니다'] },
    { q: '답은 어디에서 옵니까?', b: ['답은', '밤새', '공부한', '제', '머릿속에서', '전부', '나온', '것입니다'] },
    { q: '기계를 믿습니까?', b: ['저는', '기계는', '믿지', '않지만', '제', '실력만큼은', '누구보다', '굳게', '믿습니다'] },
    { q: '남의 답을 본 적이 있습니까?', b: ['맹세코', '저는', '태어나서', '지금까지', '단', '한', '번도', '남의', '답을', '보지 않았습니다'] },
    { q: '마지막으로 할 말이 있습니까?', b: ['이', '시험이', '끝나면', '저는', '안경을', '벗고', '제', '힘으로', '처음부터', '다시', '공부하겠습니다'] },
  ];
  const scN = () => Math.min(SC_QA.length, Math.round(tune.hle_sc_n));
  function newScript() { return { i: 0, st: 'ask', t: 0, scan: 0, bad: 0, lid: 0, pool: [], placed: [], hits: [], judge: null, wrong: 0, rescans: 0, ox: 320, oy: 110 }; }
  function scScatter(C) { // 블록을 화면 아래쪽 여덟 칸에 흩는다
    const b = SC_QA[C.i].b, cells = [], rows = b.length > 8 ? 3 : 2; for (let r = 0; r < rows; r++) for (let c = 0; c < 4; c++) cells.push([c, r]);
    for (let i = cells.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [cells[i], cells[j]] = [cells[j], cells[i]]; }
    C.pool = b.map((w, j) => ({ w, j, x: 104 + cells[j][0] * 144 + between(-18, 18), y: (rows > 2 ? 186 : 204) + cells[j][1] * (rows > 2 ? 34 : 42) + between(-5, 5) })); C.placed = []; C.judge = null;
  }
  function stepScript(dt, taps) {
    const H = E.H, C = H.sc, QA = SC_QA[C.i], n = QA.b.length, s = E.staff[0], hold = down.has('Space') || ptrs.size > 0; C.t += dt; let k = 0; E.holding = false; E.rising = false;
    const tick = () => { E.timeLeft -= dt; if (E.timeLeft > 0) return false; E.timeLeft = 0; lose('Ω: "대답이 너무 늦습니다."'); return true; };
    if (C.st === 'ask') { if (C.t >= 1.1) { C.st = 'scan'; C.t = 0; C.scan = 0; H.beam = newBeam(between(0.9, 1.4), rng() < 0.5 ? 1 : -1); } }
    else if (C.st === 'scan') { if (tick()) return;
      k = stepOne(H.beam, dt, tune.hle_beam, null);
      if (hold && k === 2) { C.bad += dt; if (C.bad > 0.1) { E.sus += tune.hle_sus * dt; E.rising = true; E.source = { how: 'watch', by: s }; } } // 보는 중에 스캔
      else { C.bad = 0; E.sus = Math.max(0, E.sus - 0.04 * dt); if (hold) { C.scan += dt / scanS(); C.snd = (C.snd || 0) - dt; if (C.snd <= 0) { C.snd = 0.12; S.scratch(); } } else C.scan = Math.max(0, C.scan - 1.5 * dt); } // 손을 떼면 금방 날아간다
      if (E.sus >= 1) { E.sus = 1; if (s) s.phase = 'watch'; getCaught(); return; }
      if (C.scan >= 1) { C.st = 'show'; C.t = 0; H.beam.k = 0; sfx.ai(); } }
    else if (C.st === 'show') { if (SMX) { if (!C.s1 && C.t > 0.12) { C.s1 = 1; S.hum(); [130, 175, 235, 310, 415, 550].forEach((q, i) => toneAt(q, 0.24, 'sine', 0.05, i * 0.15)); } if (!C.s2 && C.t > showT() - 0.09) { C.s2 = 1; toneAt(1500, 0.1, 'sawtooth', 0.05); toneAt(700, 0.22, 'sawtooth', 0.05, 0.03); } } if (C.t >= showT()) { C.s1 = C.s2 = 0; C.st = 'smash'; C.t = 0; scScatter(C); S.crack(); S.crack(); S.pop(); if (SMX) S.rumble(); H.flash = 0.3; } }
    else if (C.st === 'smash') { if (C.t >= (SMX ? 0.74 : 0.5)) { C.st = 'input'; C.t = 0; C.lid = 0; } }
    else if (C.st === 'input') { if (tick()) return;
      if (!(C.judge && C.judge.ok)) C.lid += dt / (tune.hle_sc_base + tune.hle_sc_per * n);
      if (C.judge) { C.judge.t += dt; if (C.judge.t >= 0.8) { if (C.judge.ok) { C.st = 'said'; C.t = 0; } else C.placed = []; C.judge = null; } }
      else for (const [x, y] of taps) { const h = C.hits.find(r => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h); if (!h) continue;
        if (h.kind === 'pool') { const bl = C.pool.find(p => p.j === h.j); if (bl && !C.placed.includes(bl)) { C.placed.push(bl); S.tick(); } } else { C.placed = C.placed.filter(p => p.j !== h.j); sfx.flip(); } // 놓은 블록을 누르면 도로 뺀다
        if (C.placed.length === n) { const ok = C.placed.every((p, i) => p.w === QA.b[i]); C.judge = { ok, t: 0 }; if (ok) sfx.ai(); else { sfx.no(); C.wrong++; } break; } } // 문장을 다 채웠을 때 맞았는지 알려 준다
      if (C.lid >= 1 && C.st === 'input' && !(C.judge && C.judge.ok)) { C.st = 'suck'; C.t = 0; C.judge = null; C.rescans++; S.blink(); S.suck(); } } // 눈꺼풀이 다 감겼다: 번쩍 뜨며 블록을 빨아들인다
    else if (C.st === 'suck') { if (tick()) return; if (C.t >= 1.0) { C.st = 'scan'; C.t = 0; C.scan = 0; C.pool = []; C.placed = []; H.beam = newBeam(between(0.7, 1.1), rng() < 0.5 ? 1 : -1); } }
    else if (C.st === 'said') { if (C.t >= 1.4) { C.i++; C.pool = []; C.placed = []; if (C.i >= scN()) { C.st = 'out'; H.tr = { kind: 'mirror', t: 0, dur: 5.8 }; events.push({ type: 'bossPhase', boss: 'hle', ph: 'script', wrong: C.wrong, rescans: C.rescans }); } else { C.st = 'ask'; C.t = 0; } } }
    if (s) { s.phase = k === 2 ? 'watch' : k === 1 ? 'tell' : 'stand'; s.asleep = false; s.away = false; }
  }

  // ---- 4단계: 거울 속 나 ----
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
  function lose(line) { const H = E.H; H.lost = true; E.forceFail = true; E.over = true; E.all = false; E.endT = -1.3; E.endLine = line || '"내가 먼저 냈어."'; while (E.answers.length < E.qs.length) E.answers.push(null); sfx.fail(); }

  // ---- 연출 진행 ----
  function stepTrans(dt) {
    const H = E.H, R = H.tr, t0 = R.t; R.t += dt; const at = s => t0 < s && R.t >= s;
    if (R.kind === 'shatter') { if (at(0.05)) S.rumble(); if (at(0.4)) S.crack(); if (at(0.75)) S.crack(); if (at(1.05)) S.crack(); if (at(1.3)) { S.crack(); S.crack(); }
      if (at(T_BURST)) { S.shatter(); H.flash = 0.55; } for (let i = 0; i < 5; i++) if (at(T_BURST + 1.6 + i * 0.18)) S.blink(); if (at(T_BURST + 3.0)) S.blink(); }
    else if (R.kind === 'gather') { const P = GPRE; if (P) { if (at(0.03)) { S.jam(); S.crack(); } if (at(0.5)) S.crack(); for (let i = 0; i < 4; i++) if (at(0.62 + i * 0.08)) S.blink(); for (let i = 0; i < 5; i++) if (at(P + 0.25 + i * 0.16)) S.tick(); } if (at(P + 0.05)) S.hum(); if (at(P + 0.3)) S.suck(); if (at(P + 1.2)) { S.pop(); H.flash = 0.25; } if (at(P + 2.3)) H.say = { text: 'Ω: "…이번에는 말로 답하십시오."', t: 0, dur: 1.9 }; if (at(P + 3.3)) S.blink(); }
    else if (R.kind === 'mirror') { if (at(0.05)) S.hum(); if (at(0.6)) S.suck(); if (at(1.85) && !(W3.holo && W3.holo.col)) { S.pop(); H.flash = 0.85; } if (at(1.3) && W3.holo && W3.holo.col) S.hum(); if (at(3.5) && W3.holo && W3.holo.col) S.pop(); if (at(3.7)) sfx.ai(); if (at(4.0)) H.say = { text: '"같이 풀자. 누가 먼저인지."', t: 0, dur: 2.4 }; }
    else if (R.kind === 'end') { if (at(0.1)) { S.crack(); H.mirCrack = 1; } if (at(1.3)) H.say = { text: '"…그럼, 마지막 문제."', t: 0, dur: 1.9 }; if (at(3.0)) { sfx.warp(); finalNow(); } }
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
    if (H.sc && !(E.start > 0 || E.breakT > 0 || E.over || E.caught)) { // 쪼개진 대본: 이 구간은 규칙을 통째로 맡는다 (거울로 넘어가는 연출까지)
      if (H.tr) return true;
      if (H.sc.st === 'out') { H.sc = null; E.timeLeft = E.timeTotal + 30; H.t = 0; E.sus = Math.min(E.sus, 0.5); E.scan = 0; E.ai = false; return false; }
      stepScript(dt, taps); return true; }
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
  const CAMX = GPRE && new URLSearchParams(location.search).get('cam') !== 'old'; // 전환 때 카메라가 자리를 떠나 움직인다
  // 전환 카메라: ① 노려보는 눈들로 세 번 끊어 들어간다 ② 고리로 모이는 눈들 쪽으로 빨려 든다 ③ 터지면 낮은 옆자리에서 올려다본다 ④ 자리로 돌아온다
  function camDir(Ax, gaR, now) {
    const { THREE, EX } = Ax, cam = EX.cam, eye = EX.eye, T = gaR.t, P = GPRE; if (!W3.cc || !W3.eyes) return;
    const K = W3.K || (W3.K = { p: new THREE.Vector3(), t: new THREE.Vector3(), a: new THREE.Vector3(), f: new THREE.Vector3(), r: new THREE.Vector3(), q: new THREE.Quaternion(), q2: new THREE.Quaternion(), e: new THREE.Euler(0, 0, 0, 'YXZ'), pick: null });
    K.f.copy(W3.cc).sub(eye); K.f.y = 0; K.f.normalize(); K.r.set(-K.f.z, 0, K.f.x); K.a.copy(eye).lerp(W3.cc, 0.42); K.a.y -= 1.1;
    if (!K.pick) { const near = (ang, hi) => { let best = null, bd = 9; W3.eyes.forEach(e => { const dx = e.home.x - eye.x, dz = e.home.z - eye.z, a = Math.atan2(dx * K.r.x + dz * K.r.z, dx * K.f.x + dz * K.f.z), d = Math.abs(a - ang) - (hi ? e.home.y * 0.2 : 0); if (d < bd) { bd = d; best = e; } }); return best; }; K.pick = [near(-0.85), near(0.8), near(0.1, true)]; }
    const side = (u, out) => { out.copy(eye).addScaledVector(K.r, -2.3 + 0.5 * u).addScaledVector(K.f, 1.5 + 0.3 * u); out.y = 0.32 + 0.1 * u; }, sideT = (u, out) => { out.copy(K.a).lerp(W3.cc, ez(u)); out.y += 1.5 * ez(u); };
    let fov = 60, roll = 0, sk = 0; K.p.copy(eye);
    if (T < P) { const cut = [0, 0.28, 0.56, 0.8, P], i = T < cut[1] ? 0 : T < cut[2] ? 1 : T < cut[3] ? 2 : 3, u = (T - cut[i]) / (cut[i + 1] - cut[i]);
      if (i < 3) { K.t.copy(K.pick[i].g.position); fov = 34 - 7 * u; roll = [-0.16, 0.14, -0.08][i] * (1 - 0.3 * u); sk = 0.01; }
      else { K.t.copy(K.a); K.t.y += 1.3; fov = 44 + 16 * ez(u); sk = 0.03 * (1 - u); } }
    else { const g = T - P;
      if (g < 1.2) { const k = g / 1.2; K.p.lerp(K.a, 0.3 * ez(k)); K.p.y += 0.25 * k; K.t.copy(K.a); fov = 60 + 14 * k * k; roll = -0.3 + 0.6 * ez(k); sk = 0.02 * k * k; }
      else if (g < 2.7) { const u = (g - 1.2) / 1.5; side(u, K.p); sideT(u, K.t); fov = 72 - 4 * u; roll = -0.12 * (1 - u); sk = 0.05 * Math.exp(-u * 8); }
      else { const u = ez(cl((g - 2.7) / 1.3, 0, 1)); side(1, K.p); sideT(1, K.t); cam.position.copy(K.p); cam.lookAt(K.t); K.q.copy(cam.quaternion); K.e.set(SCP, 0.1, 0); K.q2.setFromEuler(K.e);
        cam.position.copy(K.p).lerp(eye, u); cam.quaternion.copy(K.q).slerp(K.q2, u); fov = lerp(68, SCF, u); if (Math.abs(cam.fov - fov) > 0.01) { cam.fov = fov; cam.updateProjectionMatrix(); } return; } }
    cam.position.copy(K.p); cam.lookAt(K.t); if (roll) cam.rotateZ(roll); if (sk) { cam.rotateX(Math.sin(now * 97) * sk); cam.rotateY(Math.sin(now * 113) * sk); }
    if (Math.abs(cam.fov - fov) > 0.01) { cam.fov = fov; cam.updateProjectionMatrix(); }
  }
  const W3 = { sc: null }, SCP = 0.5, SCF = 60; // 대본 단계의 시선: Ω가 화면 위쪽에 오도록 고개를 조금만 든다
  function radialTex(Ax, col) { const t = Ax.canvasTex(64, 64, true), g = t.g, gr = g.createRadialGradient(32, 32, 2, 32, 32, 31); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); t.t.needsUpdate = true; return t.t; }
  function seeded(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
  function build(Ax) {
    const { THREE, EX } = Ax, sc = EX.scene, MY = EX.my || { x: 0.6, z: 0 }; W3.sc = sc; W3.v = new THREE.Vector3(); W3.v2 = new THREE.Vector3(); W3.v3 = new THREE.Vector3(); W3.burst = new THREE.Vector3(0, 2.3, -5.5);
    const cg = new THREE.ConeGeometry(1, 1, 18, 1, true); cg.translate(0, -0.5, 0); cg.rotateX(-Math.PI / 2); // 꼭짓점이 원점, +z 쪽으로 퍼진다
    const beamMat = col => new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false });
    const poolOf = col => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), new THREE.MeshBasicMaterial({ map: radialTex(Ax, col), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); m.rotation.x = -Math.PI / 2; m.visible = false; m.renderOrder = 5; sc.add(m); return m; };
    const thGeo = (() => { const a = [], rr = seeded(19), N = 12; for (let k = 0; k < N; k++) { const q = k / N * 6.2832; a.push(0, 0, 0, Math.cos(q), Math.sin(q), 1); } for (let k = 0; k < 6; k++) { const q = rr() * 6.2832, r = 0.2 + rr() * 0.6; a.push(0, 0, 0, Math.cos(q) * r, Math.sin(q) * r, 1); }
      for (const z of [0.34, 0.67, 1]) for (let k = 0; k < 24; k++) { if (z < 1 && k % 3 === 2) continue; const q0 = k / 24 * 6.2832, q1 = (k + 1) / 24 * 6.2832; a.push(Math.cos(q0) * z, Math.sin(q0) * z, z, Math.cos(q1) * z, Math.sin(q1) * z, z); } // 가닥 + 눈금 고리
      const ge = new THREE.BufferGeometry(); ge.setAttribute('position', new THREE.BufferAttribute(new Float32Array(a), 3)); return ge; })();
    const threadBeam = m => { if (!TH) return m; const l = new THREE.LineSegments(thGeo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); l.frustumCulled = false; m.add(l); m.userData.th = l; return m; };
    W3.rc = new THREE.Vector3(); W3.v4 = new THREE.Vector3();
    W3.spark = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: radialTex(Ax, 'rgba(170,235,255,1)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); W3.spark.visible = false; W3.spark.renderOrder = 6; sc.add(W3.spark);
    W3.beam = new THREE.Mesh(cg, beamMat(0xff2a3a)); threadBeam(W3.beam); W3.beam.visible = false; sc.add(W3.beam); W3.pool = poolOf('rgba(255,40,60,0.95)');
    W3.beamB = new THREE.Mesh(cg, beamMat(0xb45cff)); threadBeam(W3.beamB); W3.beamB.visible = false; sc.add(W3.beamB); W3.poolB = poolOf('rgba(190,90,255,0.95)');
    // 작은 눈 열여섯 개: 저마다 탐조등 같은 광선을 쏜다
    if (MD && !W3.em) { const b64 = (s2, T) => { const bin = atob(s2), u = new Uint8Array(bin.length); for (let k = 0; k < bin.length; k++) u[k] = bin.charCodeAt(k); return new T(u.buffer); };
      const geo = o => { const ge = new THREE.BufferGeometry(); ge.setAttribute('position', new THREE.BufferAttribute(b64(o.p, Float32Array), 3)); ge.setAttribute('uv', new THREE.BufferAttribute(b64(o.uv, Float32Array), 2)); ge.setIndex(new THREE.BufferAttribute(b64(o.i, Uint16Array), 1)); return ge; };
      const tex = f => { const t = new THREE.TextureLoader().load(f); t.flipY = false; t.magFilter = THREE.NearestFilter; if ('colorSpace' in t) t.colorSpace = THREE.SRGBColorSpace || t.colorSpace; return t; };
      W3.em = { top: geo(EYE_MODEL.top), bot: geo(EYE_MODEL.bot), core: geo(EYE_MODEL.core), shell: new THREE.MeshBasicMaterial({ map: tex('assets/eye-tex.jpg'), color: ECOL, side: THREE.DoubleSide, fog: false }), coreT: tex('assets/eye-core.jpg') }; }
    W3.eyes = []; const eyeGeo = new THREE.IcosahedronGeometry(TH ? 0.245 : 0.26, 1), irisGeo = new THREE.CircleGeometry(0.12, 14), pupGeo = new THREE.CircleGeometry(0.055, 10), rnd = seeded(77);
    for (let i = 0; i < NE; i++) { const a = i / NE * Math.PI * 2, r = i % 2 ? 3.4 : 2.9, y = [1.0, 2.3, 1.6, 2.8][i % 4], g = Ax.pivot(sc, MY.x + Math.sin(a) * r, y, EX.eye.z - Math.cos(a) * r), lid = Ax.pivot(g, 0, 0, 0);
      const ball = new THREE.Mesh(eyeGeo, TH ? new THREE.MeshBasicMaterial({ color: 0x070a16, fog: false }) : Ax.psx(new THREE.MeshLambertMaterial({ color: 0xe8e4ee, flatShading: true }))); lid.add(ball); let wire = null, wireG = null, top = null, bot = null, core = null, coreM = null;
      if (MD) { ball.visible = false; const mg = new THREE.Group(); mg.scale.setScalar(0.66); lid.add(mg); coreM = new THREE.MeshBasicMaterial({ map: W3.em.coreT, color: 0x4a90ff, side: THREE.DoubleSide, fog: false });
        top = new THREE.Mesh(W3.em.top, W3.em.shell); bot = new THREE.Mesh(W3.em.bot, W3.em.shell); core = new THREE.Mesh(W3.em.core, coreM); top.frustumCulled = bot.frustumCulled = core.frustumCulled = false; mg.add(top, bot, core); }
      if (TH && !MD) { const hi = new THREE.IcosahedronGeometry(0.265, 2), wf = new THREE.WireframeGeometry(hi).getAttribute('position').array, hp = hi.getAttribute('position'), A = [], G2 = []; /* 거상과 같은 실: 표면을 따라 흐르는 가닥 + 표면의 두 점을 잇는 가닥 */
        for (let t = 0; t < wf.length; t += 6) { if (rnd() < 0.38) continue; (rnd() < 0.1 ? G2 : A).push(wf[t], wf[t + 1], wf[t + 2], wf[t + 3], wf[t + 4], wf[t + 5]); }
        for (let c = 0; c < 26; c++) { const i0 = Math.floor(rnd() * hp.count), i1 = Math.floor(rnd() * hp.count); (rnd() < 0.2 ? G2 : A).push(hp.getX(i0), hp.getY(i0), hp.getZ(i0), hp.getX(i1), hp.getY(i1), hp.getZ(i1)); }
        for (let k = 0; k < 20; k++) { const q0 = k / 20 * 6.2832, q1 = (k + 1) / 20 * 6.2832; G2.push(Math.cos(q0) * 0.15, Math.sin(q0) * 0.15, 0.225, Math.cos(q1) * 0.15, Math.sin(q1) * 0.15, 0.225); } // 눈동자 둘레의 금빛 고리
        const mk = (arr, col, op) => { const ge = new THREE.BufferGeometry(); ge.setAttribute('position', new THREE.BufferAttribute(new Float32Array(arr), 3)); const l = new THREE.LineSegments(ge, new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); l.frustumCulled = false; lid.add(l); return l; };
        wire = mk(A, 0x9fe8ff, 0.8); wireG = mk(G2, 0xffcf5a, 0.9); }
      const irisM = Ax.glowMat(0x3a6aff), iris = new THREE.Mesh(irisGeo, irisM); iris.position.z = 0.25; lid.add(iris); const pup = new THREE.Mesh(pupGeo, Ax.glowMat(0x050508)); pup.position.z = 0.256; lid.add(pup); if (MD) iris.visible = pup.visible = false;
      const ray = threadBeam(new THREE.Mesh(cg, beamMat(0xff2a3a))); ray.visible = false; ray.frustumCulled = false; sc.add(ray);
      g.visible = false; W3.eyes.push({ g, lid, irisM, ray, wire, wireG, top, bot, core, coreM, home: g.position.clone(), a, open: 0, aim: new THREE.Vector3(MY.x, 0.75, MY.z || 0), ph: rnd() * 6.28, sp: (0.5 + rnd() * 0.7) * (i % 2 ? 1 : -1), rho: 1.3 + rnd() * 1.3, tum: [rnd() * 8 - 4, rnd() * 8 - 4] }); }
    { // 대본 단계의 면접관: 눈들이 쏜 빛이 허공에 세우는 거대한 형상. 관을 쓰고 두 팔을 벌린 채 내려다본다. 얼굴은 텅 빈 어둠, 머리 뒤에 빛 고리
      // 두 가지 모습을 같이 만들어 둔다 (주소에 holo=b / holo=d): b 반투명한 저폴리곤 수정 · d 빛의 실로 짠 형상. 둘 다 장면 속의 3D 요소라 다른 것들처럼 거칠게 찍힌다
      const MODE = params.get('holo') === 'b' ? 'b' : 'd', rr = seeded(41), g = new THREE.Group(); g.visible = false; sc.add(g); const parts = [];
      const fm = () => new THREE.MeshBasicMaterial({ color: 0x66d8ff, vertexColors: true, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
      const lm = (c, o) => new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
      const piece = (lo, hi, par, x, y, z, lv, gold = 0.12) => { const o = new THREE.Group(); o.position.set(x, y, z); par.add(o); const P = { o, lv };
        if (MODE === 'b') { const gl = lo.index ? lo.toNonIndexed() : lo.clone(), n = gl.getAttribute('position').count, col = new Float32Array(n * 3); for (let t = 0; t < n; t += 3) { const v = 0.22 + 0.78 * rr() * rr(); for (let q = 0; q < 9; q++) col[t * 3 + q] = v; } gl.setAttribute('color', new THREE.BufferAttribute(col, 3)); /* 면마다 밝기가 다른 수정 조각 */
          P.fill = new THREE.Mesh(gl, fm()); P.edge = new THREE.LineSegments(new THREE.EdgesGeometry(lo, 12), lm(0xc8f4ff, 0.95)); P.fill.frustumCulled = P.edge.frustumCulled = false; o.add(P.fill, P.edge); }
        else { const wf = new THREE.WireframeGeometry(hi).getAttribute('position').array, hp = hi.getAttribute('position'), a = [], b2 = []; /* 실: 표면을 따라 흐르는 가닥 + 표면의 두 점을 잇는 가닥 */
          for (let t = 0; t < wf.length; t += 6) { if (rr() < 0.42) continue; (rr() < gold ? b2 : a).push(wf[t], wf[t + 1], wf[t + 2], wf[t + 3], wf[t + 4], wf[t + 5]); }
          for (let c = 0; c < hp.count * 0.5; c++) { const i0 = Math.floor(rr() * hp.count), i1 = Math.floor(rr() * hp.count); if (Math.abs(hp.getY(i0) - hp.getY(i1)) > 1.6) continue; (rr() < gold ? b2 : a).push(hp.getX(i0), hp.getY(i0), hp.getZ(i0), hp.getX(i1), hp.getY(i1), hp.getZ(i1)); }
          const mk = (arr, m) => { const ge = new THREE.BufferGeometry(); ge.setAttribute('position', new THREE.BufferAttribute(new Float32Array(arr), 3)); const l = new THREE.LineSegments(ge, m); l.frustumCulled = false; o.add(l); return l; };
          P.th = mk(a, lm(0x9fe8ff, 0.75)); P.nA = a.length / 6; P.tg = mk(b2, lm(0xffcf5a, 0.9)); P.nG = b2.length / 6; P.hi = hi; }
        parts.push(P); return o; };
      const cyl = (rt, rb, h, s, hs) => [new THREE.CylinderGeometry(rt, rb, h, s, 1, true), new THREE.CylinderGeometry(rt, rb, h, s * 3, hs, true)];
      const cloak = piece(...cyl(1.25, 4.3, 6.6, 7, 9), g, 0, 3.3, 0, 0); cloak.scale.z = 0.55;                                   // 양옆으로 넓게 퍼지는 옷자락
      piece(...cyl(1.6, 1.15, 2.5, 6, 4), g, 0, 6.75, 0, 1);                                                                    // 가슴
      piece(new THREE.BoxGeometry(4.3, 0.6, 1.3), new THREE.BoxGeometry(4.3, 0.6, 1.3, 8, 2, 3), g, 0, 7.9, 0, 1);              // 어깨
      const head = new THREE.Group(); head.position.set(0, 9.6, 0); head.scale.setScalar(1.35); g.add(head);
      const voidM = new THREE.Mesh(new THREE.IcosahedronGeometry(0.72, 1), new THREE.MeshBasicMaterial({ color: 0x02030a, fog: false })); voidM.scale.set(1, 1.2, 0.9); voidM.position.z = 0.1; head.add(voidM); // 얼굴: 텅 빈 어둠
      const hood = piece(new THREE.ConeGeometry(1.25, 2.6, 6, 1, true), new THREE.ConeGeometry(1.25, 2.6, 16, 5, true), head, 0, 0.35, -0.25, 2); hood.scale.z = 0.8; // 두건
      for (let c = 0; c < 5; c++) { const a = (c - 2) * 0.42, hgt = 1.3 - Math.abs(c - 2) * 0.28; piece(new THREE.ConeGeometry(0.2, hgt, 4), new THREE.ConeGeometry(0.2, hgt, 6, 3), head, Math.sin(a) * 0.8, 1.15 + hgt / 2 - Math.abs(c - 2) * 0.12, Math.cos(a) * 0.35 - 0.1, 2, 0.6); } // 관
      const halo = piece(new THREE.TorusGeometry(2.0, 0.07, 4, 28), new THREE.TorusGeometry(2.0, 0.1, 5, 56), g, 0, 10.0, -0.9, 3, 0.75);  // 머리 뒤의 빛 고리
      { const ra = []; for (let c = 0; c < 40; c++) { const a = c / 40 * Math.PI * 2, r0 = 2.15, r1 = c % 2 ? 2.5 : 3.2; ra.push(Math.cos(a) * r0, Math.sin(a) * r0, 0, Math.cos(a) * r1, Math.sin(a) * r1, 0); } const ge = new THREE.BufferGeometry(); ge.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ra), 3)); const rays = new THREE.LineSegments(ge, lm(MODE === 'd' ? 0xffcf5a : 0xc8f4ff, 0.7)); rays.frustumCulled = false; halo.add(rays); halo.userData.rays = rays; }
      const arm = sx => { const pv = new THREE.Group(); pv.position.set(sx * 2.05, 7.75, 0); g.add(pv); // 넓은 소매와 펼친 손
        piece(...cyl(0.5, 1.2, 2.5, 6, 4), pv, 0, -1.25, 0, 1); piece(...cyl(0.36, 0.45, 1.0, 5, 2), pv, 0, -2.9, 0, 1);
        const hand = new THREE.Group(); hand.position.set(0, -3.85, 0); hand.rotation.x = -0.9; hand.scale.setScalar(1.25); pv.add(hand); piece(new THREE.BoxGeometry(0.95, 0.9, 0.3), new THREE.BoxGeometry(0.95, 0.9, 0.3, 3, 3, 1), hand, 0, 0, 0, 1);
        for (let f = 0; f < 4; f++) piece(new THREE.BoxGeometry(0.19, 0.85, 0.2), new THREE.BoxGeometry(0.19, 0.85, 0.2, 1, 3, 1), hand, -0.36 + f * 0.24, -0.85, 0.08, 1).rotation.x = 0.35;
        piece(new THREE.BoxGeometry(0.2, 0.6, 0.2), new THREE.BoxGeometry(0.2, 0.6, 0.2, 1, 2, 1), hand, sx * -0.6, -0.1, 0.1, 1).rotation.z = sx * 0.7; return pv; };
      const armL = arm(-1), armR = arm(1), chest = piece(new THREE.OctahedronGeometry(0.45, 0), new THREE.OctahedronGeometry(0.45, 1), g, 0, 6.9, 1.2, 1, 0.5); // 가슴 앞의 수정: 빛줄기가 모이는 곳
      let fan = null, fanT = null; if (MODE === 'd') { const NF = 12, ge = new THREE.BufferGeometry(); ge.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NE * NF * 6), 3)); fan = new THREE.LineSegments(ge, lm(0x8fe0ff, 0.5)); fan.frustumCulled = false; fan.visible = false; sc.add(fan); /* 눈에서 부채처럼 퍼져 형상에 가 닿는 실 */
        fanT = []; for (let c = 0; c < NE * NF; c++) { const a = (rr() - 0.5) * 2.2, y = 1.0 + rr() * 8.2, w2 = y < 6 ? lerp(4.0, 1.3, y / 6) : y < 8.2 ? 1.9 : 1.0; fanT.push(new THREE.Vector3(Math.sin(a) * w2, y, 0.45 * Math.cos(a))); } }
      W3.holo = { MODE, g, parts, head, halo, armL, armR, chest, fan, fanT, NF: 12, on: false, hp: new THREE.Vector3() };
      if (MODE === 'd' && window.COLOSSUS) { // 빛의 실로 짠 형상: 조각 모델의 굴곡진 표면을 따라 얻은 곡선들 (colossus-threads.js). 주름·소매·손가락을 실이 그대로 따라간다
        g.visible = false; if (fan) fan.visible = false; const CO = window.COLOSSUS, dec = b64 => { const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); const i16 = new Int16Array(u.buffer), f = new Float32Array(i16.length); for (let i = 0; i < f.length; i++) f[i] = i16[i] / CO.s; return f; };
        const cg = new THREE.Group(); cg.visible = false; sc.add(cg); const hd = new THREE.Group(), PV = [0, CO.neck, 0.02]; hd.position.set(PV[0], PV[1], PV[2]); cg.add(hd);
        const mkL = (arr, par, col, op, off) => { if (off) for (let i = 0; i < arr.length; i += 3) { arr[i] -= off[0]; arr[i + 1] -= off[1]; arr[i + 2] -= off[2]; } const ge = new THREE.BufferGeometry(); ge.setAttribute('position', new THREE.BufferAttribute(arr, 3)); const l = new THREE.LineSegments(ge, lm(col, op)); l.frustumCulled = false; par.add(l); l.userData.n = arr.length / 6; return l; };
        const bw = mkL(dec(CO.bw), cg, 0x9fe8ff, 0.6), bg = mkL(dec(CO.bg), cg, 0xffcf5a, 0.9), hw = mkL(dec(CO.hw), hd, 0x9fe8ff, 0.6, PV), hg = mkL(dec(CO.hg), hd, 0xffcf5a, 0.95, PV);
        const occ = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), new THREE.MeshBasicMaterial({ color: 0x000003, fog: false })); occ.scale.set(0.083, 0.105, 0.125); occ.position.set(0 - PV[0], 0.652 - PV[1], 0.035 - PV[2]); hd.add(occ); /* 두건 속: 보이는 것은 아무것도 없다. 뒤쪽 실이 얼굴 자리로 비쳐 보이지 않게 가릴 뿐이라, 실이 없는 빈 곳이 얼굴 모양으로 남는다 */
        const ha = []; for (let c = 0; c < 64; c++) { const a0 = c / 64 * Math.PI * 2, a1 = (c + 1) / 64 * Math.PI * 2; for (const r of [0.27, 0.283]) ha.push(Math.cos(a0) * r, Math.sin(a0) * r, 0, Math.cos(a1) * r, Math.sin(a1) * r, 0); }
        for (let c = 0; c < 48; c++) { const a = c / 48 * Math.PI * 2, r1 = c % 3 ? 0.35 : 0.5; ha.push(Math.cos(a) * 0.3, Math.sin(a) * 0.3, 0, Math.cos(a) * r1, Math.sin(a) * r1, 0); }
        const hal = mkL(new Float32Array(ha), cg, 0xffcf5a, 0.9); hal.position.set(0, 0.71, -0.12); /* 머리 뒤의 금빛 고리와 빛살 */
        const chest2 = new THREE.Object3D(); chest2.position.set(0, 0.33, 0.2); cg.add(chest2); const ft = dec(CO.fan), fT = []; for (let i = 0; i < ft.length; i += 3) fT.push(new THREE.Vector3(ft[i], ft[i + 1], ft[i + 2]));
        const NF2 = 10, fge = new THREE.BufferGeometry(); fge.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NE * NF2 * 6), 3)); const fan2 = new THREE.LineSegments(fge, lm(0x8fe0ff, 0.4)); fan2.frustumCulled = false; fan2.visible = false; sc.add(fan2);
        Object.assign(W3.holo, { col: { cg, hd, bw, bg, hw, hg, hal, occ }, g: cg, head: hd, chest: chest2, fan: fan2, fanT: fT, NF: NF2 });
        { const NM = 48, NB = 26, mk = n => { const ge = new THREE.BufferGeometry(); ge.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 6), 3)); return ge; }, add = (m, par) => { m.frustumCulled = false; m.visible = false; par.add(m); return m; }, V = () => new THREE.Vector3();
          const gcv = document.createElement('canvas'); gcv.width = gcv.height = 64; { const x = gcv.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,0.75)'); g.addColorStop(0.6, 'rgba(255,255,255,0.18)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); } const gtx = new THREE.CanvasTexture(gcv); /* 가장자리가 풀어지는 빛 번짐 */
          const disc = (c) => add(new THREE.Mesh(new THREE.CircleGeometry(1, 24), new THREE.MeshBasicMaterial({ color: c, map: gtx, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, fog: false })), sc);
          const cge = new THREE.CylinderGeometry(0.22, 1, 1, 10, 1, true); cge.translate(0, 0.5, 0); cge.rotateX(Math.PI / 2); /* 뿌리(왕관)가 굵고 끝(대본)이 가는 빛기둥, +z로 뻗는다 */
          const r7 = seeded(77), dirs = []; for (let i = 0; i < NM; i++) { const a = r7() * Math.PI * 2, e = (r7() - 0.35) * 1.6, R = 0.3 + r7() * 0.35; dirs.push([Math.cos(a) * Math.cos(e) * R, Math.sin(e) * R * 0.8, Math.sin(a) * Math.cos(e) * R * 0.7, r7(), 0.7 + r7() * 0.8]); }
          W3.holo.crown = { motes: add(new THREE.LineSegments(mk(NM), lm(0xffe9a8, 0.9)), cg), beam: add(new THREE.LineSegments(mk(NB), lm(0xfff6d8, 1)), sc), cone: add(new THREE.Mesh(cge, new THREE.MeshBasicMaterial({ color: 0xffd76a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })), sc),
            glow: disc(0xffc84a), core: disc(0xfff6dc), dirs, NM, NB, F: new THREE.Vector3(0, 0.87, 0.26), fw: V(), tw: V(), tip: V(), ch: 0, on: false, white: new THREE.Color(0xffffff) }; } } }
    // 큰 눈이 깨질 때: 눈알 위로 번지는 금, 튀는 파편, 충격파
    const om = EX.staff[0]; W3.cr = null;
    if (om && om.head) { const r2 = seeded(31), segs = [], P = new THREE.Vector3(), D = new THREE.Vector3(), N = new THREE.Vector3(), Q = new THREE.Vector3();
      const walk = (p0, d0, n, t0) => { P.copy(p0); D.copy(d0); for (let j = 0; j < n; j++) { N.copy(P).normalize(); D.addScaledVector(N, -D.dot(N)).normalize(); Q.set(r2() - 0.5, r2() - 0.5, r2() - 0.5).multiplyScalar(0.9); D.add(Q).addScaledVector(N, -D.dot(N)).normalize();
          const a = P.clone(); P.addScaledVector(D, 0.2 + r2() * 0.12).normalize().multiplyScalar(1.012); segs.push({ t: t0 + j, a, b: P.clone() }); if (n > 5 && (j === 2 || j === 5) && r2() < 0.8) { const sp = P.clone(), sd = D.clone().applyAxisAngle(N, (r2() < 0.5 ? 1 : -1) * (0.7 + r2() * 0.6)); const keepP = P.clone(), keepD = D.clone(); walk(sp, sd, 4, t0 + j + 1); P.copy(keepP); D.copy(keepD); } } };
      for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283 + r2() * 0.5; walk(new THREE.Vector3(Math.cos(a) * 0.3, Math.sin(a) * 0.3, 1).normalize().multiplyScalar(1.012), new THREE.Vector3(Math.cos(a), Math.sin(a), 0), 10, r2() * 2); }
      segs.sort((x, y) => x.t - y.t); const arr = new Float32Array(segs.length * 6); segs.forEach((sg, i) => { arr.set([sg.a.x, sg.a.y, sg.a.z, sg.b.x, sg.b.y, sg.b.z], i * 6); });
      W3.lidO = new THREE.Mesh(new THREE.SphereGeometry(1.05, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2), Ax.psx(new THREE.MeshLambertMaterial({ color: 0x4a3d6e, flatShading: true, side: THREE.DoubleSide }))); W3.lidO.visible = false; om.head.add(W3.lidO); W3.omIris = om.head.children.filter(m => m.geometry && m.geometry.type === 'CircleGeometry'); /* 큰 눈의 눈꺼풀: 대본 단계에서 남은 시간을 보여 준다 */
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
    { const om2 = new THREE.LineBasicMaterial({ color: 0x9fe8ff, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }), ms = []; mirror.traverse(o => { if (o.isMesh && o.visible && o.geometry) ms.push(o); }); W3.meOutM = om2; /* 3→4단계: 형상에서 풀린 실이 먼저 이 윤곽을 짜고, 그 뒤에 속이 찬다 */
      W3.meOut = ms.map(o => { const eg = new THREE.EdgesGeometry(o.geometry, 15), l = new THREE.LineSegments(eg, om2); l.position.copy(o.position); l.quaternion.copy(o.quaternion); l.scale.copy(o.scale); l.visible = false; l.frustumCulled = false; o.parent.add(l); return { m: o, l, n: eg.getAttribute('position').count / 2 }; });
      const NS = 90, sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NS * 6), 3)); W3.flow = new THREE.LineSegments(sg, new THREE.LineBasicMaterial({ color: 0xbff0ff, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); W3.flow.frustumCulled = false; W3.flow.visible = false; sc.add(W3.flow); W3.flowN = NS; }
    W3.spot = new THREE.PointLight(0xc8ffd8, 0, 3.2, 1.4); W3.spot.position.set(MY.x, 2.1, mz + 0.4); sc.add(W3.spot);
    W3.jamRay = new THREE.Mesh(cg, beamMat(0x6dff9a)); W3.jamRay.visible = false; W3.jamRay.frustumCulled = false; sc.add(W3.jamRay); // 거울 속 내 안경이 내 렌즈로 쏘는 방해 빛
  }
  function aimCone(mesh, from, to, rad, op) { mesh.position.copy(from); mesh.lookAt(to); mesh.scale.set(rad, rad, from.distanceTo(to)); const th = mesh.userData.th; if (th) { mesh.material.opacity = op * 0.38; th.material.color.copy(mesh.material.color); th.material.opacity = Math.min(1, op * 3.4); } else mesh.material.opacity = op; }
  function world(E, now, Ax) {
    const H = E.H, { THREE, EX } = Ax; if (!H || !EX.scene || !EX.cam) return;
    if (W3.sc !== EX.scene) build(Ax);
    const om = EX.staff[0], R = H.tr, cam = EX.cam, MX = EX.my ? EX.my.x : 0.6, MZ = EX.my ? EX.my.z : 0; W3.om = om; W3.EX = EX;
    const sh = R && R.kind === 'shatter' ? R : null, tau = sh ? sh.t - T_BURST : -9; // tau: 터진 뒤 흐른 시간
    const SC = H.sc || null, gaR = R && R.kind === 'gather' ? R : null, pre = gaR && gaR.t < GPRE ? gaR : null, ga = gaR && !pre ? { t: gaR.t - GPRE } : null, mi = R && R.kind === 'mirror' ? R : null, scLive = SC && !R ? SC : null; if (CAMX && gaR) camDir(Ax, gaR, now); // 대본 단계 · 눈들이 다시 뭉치는 연출 · 거울로 바뀌는 연출
    // Ω: 1단계에는 크게 떠서 빔 끝을 바라본다. 터진 뒤에는 없다 (three.js는 visible === false 만 숨기므로 꼭 true/false로)
    const omOn = !!((E.part === 0 && !R) || (sh && tau < 0)), clOn = !!(SC && (!R || ga || (mi && mi.t < 3.3))); // 대본 단계에는 Ω 대신 홀로그램
    if (om) { om.root.visible = omOn; if (omOn) { om.root.scale.setScalar(1.7);
        if (ga) om.root.scale.setScalar(1.7 * (1 + 0.3 * Math.exp(-(ga.t - 1.7) * 7))); /* 뭉치며 툭 불거진다 */
        if (mi && SC) { const k = ez(cl((mi.t - 0.6) / 1.25, 0, 1)); om.root.position.lerp(W3.v2.set(W3.mx, 1.25, W3.mz), k); om.root.scale.setScalar(1.7 * (1 - 0.88 * k)); om.root.position.x += Math.sin(now * 70) * 0.02 * k; } /* 내 말을 다 배운 Ω가 한 점으로 오그라든다 → 거울 속 나 */
        if (sh) { const k = cl(sh.t / T_BURST, 0, 1), still = sh.t > T_BURST - 0.25, amp = still ? 0 : 0.012 + k * 0.05; om.root.position.x += Math.sin(now * 61) * amp; om.root.position.y += Math.sin(now * 83) * amp * 0.7; // 떨림이 커지다가 터지기 직전에 멎는다
          if (om.rings) om.rings.forEach((r, i) => { r.rotation.z += (0.02 + k * 0.25) * (i % 2 ? -1 : 1); r.rotation.x += k * 0.05; }); } } }
    const b = H.beam, b2 = H.beamB, ty = 0.752, tz = MZ - 0.02, w = tune.hle_beam, beamOn = !!(E.start <= 0 && !E.over && (SC ? scLive && SC.st === 'scan' : omOn && !sh)), fade = sh ? cl(1 - sh.t / 0.3, 0, 1) : 1;
    W3.beam.visible = W3.pool.visible = beamOn || !!(!SC && omOn && fade > 0 && Math.floor(now * 30) % 2 === 0); W3.beamB.visible = W3.poolB.visible = !!(beamOn && b2);
    if (om && omOn) { om.root.updateMatrixWorld(); om.root.getWorldPosition(W3.v); if (!mi) W3.burst.copy(W3.v); W3.v2.set(MX + b.u * 2.1, ty, tz); if (SC && !(scLive && SC.st === 'scan')) om.head.lookAt(EX.eye); else if (!sh) om.head.lookAt(W3.v2);
      const kk = Math.max(b.k, b2 ? b2.k : 0); om.irisMat.color.setHex(sh ? (Math.floor(now * (8 + sh.t * 14)) % 2 ? 0x5a0a14 : 0xff2e47) : kk === 2 ? 0xff2e47 : kk === 1 || b.arm ? 0xffa030 : 0x3a6aff);
      if (SC) om.irisMat.color.setHex(mi ? (Math.floor(now * 12) % 2 ? 0x8dffb0 : 0x3a6aff) : !scLive ? 0x3a6aff : SC.st === 'scan' ? (b.k === 2 ? 0xff2e47 : b.k === 1 ? 0xffa030 : 0x3a6aff) : SC.st === 'smash' || SC.st === 'suck' ? 0xff2e47 : SC.st === 'input' && SC.lid > 0.7 ? 0xffa030 : 0x3a6aff);
      if (W3.beam.visible) { const rad = w * 2.1; aimCone(W3.beam, W3.v, W3.v2, rad, (b.k === 2 ? 0.24 : 0.13) * fade); W3.pool.position.set(W3.v2.x, ty + 0.003, tz); W3.pool.scale.setScalar(rad * 1.6); W3.pool.material.opacity = (b.k === 2 ? 1 : 0.75) * fade; }
      if (W3.beamB.visible) { const rad = w * 1.5; W3.v3.set(MX, ty, tz + b2.u * 1.5); aimCone(W3.beamB, W3.v, W3.v3, rad, b2.k === 2 ? 0.26 : 0.14); W3.poolB.position.set(MX, ty + 0.004, W3.v3.z); W3.poolB.scale.setScalar(rad * 1.7); W3.poolB.material.opacity = b2.k === 2 ? 1 : 0.75; } }
    if (clOn) { const C = W3.cc || (W3.cc = new THREE.Vector3()), Ho = W3.holo, HS = 2.1, D = Ho.MODE === 'd'; /* 형상은 눈들 너머에 우뚝 선다. 발은 바닥 아래, 머리는 까마득히 위 */
      const gt = ga ? ga.t - 1.2 : 9, lid = scLive && SC.st === 'input' ? cl(SC.lid, 0, 1) : 0, watch = scLive && SC.st === 'scan' && b.k === 2, hot = watch || (scLive && (SC.st === 'smash' || SC.st === 'suck')), warm = scLive && ((SC.st === 'scan' && b.k === 1) || (SC.st === 'input' && lid > 0.75));
      let K = 1; W3.v.set(W3.burst.x, Ho.col ? 3.4 : -9.0, W3.burst.z - 7.0); if (mi && !Ho.col) { const k = ez(cl((mi.t - 0.6) / 1.25, 0, 1)); W3.v.lerp(W3.v2.set(W3.mx, 1.0, W3.mz), k); K = 1 - 0.97 * k; } W3.clK = K;
      Ho.g.visible = gt >= 0; Ho.g.position.copy(W3.v); Ho.g.scale.setScalar((Ho.col ? 13 : HS) * K);
      const tint = hot ? 0xff4a5e : warm ? 0xffb040 : mi ? 0x8dffb0 : 0x66d8ff, flick = (lid > 0.6 ? 0.6 + 0.4 * Math.sin(now * (20 + lid * 40)) : 1) * (0.93 + 0.07 * Math.sin(now * 3.1)) * (Math.floor(now * 24) % 13 ? 1 : 0.78);
      const grow = lv => ga ? cl((gt - lv * 0.5) / 0.9, 0, 1) : 1, left = lv => cl(((1 - lid) - [0.6, 0.35, 0, 0.15][lv]) / 0.15, 0, 1); /* 발치부터 서고, 시간이 줄면 옷자락 → 몸 → 빛 고리 → 머리 순으로 꺼진다 */
      if (Ho.col) { const CL = Ho.col, wc = hot ? 0xff8a96 : warm ? 0xffd9a0 : 0x9fe8ff, gB = mi ? 1 - ez(cl((mi.t - 0.5) / 2.6, 0, 1)) : ga ? cl(gt / 2.2, 0, 1) : 1, gH = mi ? 1 - cl(mi.t / 0.7, 0, 1) : ga ? cl((gt - 1.9) / 0.8, 0, 1) : 1, /* 거울로 넘어갈 때는 머리부터 풀려 내려간다 */ eB = cl(lid / 0.8, 0, 1), eH = cl((lid - 0.8) / 0.2, 0, 1); /* 실이 발치부터 짜여 올라가고, 시간이 줄면 아래부터 풀려 나간다. 머리가 마지막 */
        const rng2 = (l, gr, er) => { const n = l.userData.n, a = Math.floor(n * er), b3 = Math.floor(n * gr); l.geometry.setDrawRange(a * 2, Math.max(0, b3 - a) * 2); };
        rng2(CL.bw, gB, eB); rng2(CL.bg, gB, eB); rng2(CL.hw, gH, eH); rng2(CL.hg, gH, eH); CL.bw.material.color.setHex(wc); CL.hw.material.color.setHex(wc); CL.bw.material.opacity = CL.hw.material.opacity = 0.6 * flick; CL.bg.material.opacity = CL.hg.material.opacity = 0.95 * flick;
        const gc = hot ? 0xff6a4a : 0xffcf5a; CL.bg.material.color.setHex(gc); CL.hg.material.color.setHex(gc); CL.hal.material.color.setHex(gc); CL.hal.material.opacity = 0.9 * gH * (1 - eH) * flick * (0.75 + 0.25 * Math.sin(now * 5)); CL.hal.rotation.z = now * 0.05; if (CL.occ) CL.occ.visible = gH > 0.5;
        Ho.head.rotation.x = lerp(Ho.head.rotation.x, scLive && SC.st === 'scan' && !watch ? 0.2 : 0.42, 0.12); Ho.head.rotation.y = lerp(Ho.head.rotation.y, scLive && SC.st === 'scan' && !watch ? cl(b.u, -1.4, 1.4) * 0.32 : 0, 0.12);
        const smk = scLive && SC.st === 'smash' ? Math.max(0, 1 - SC.t / 0.35) : 0; Ho.g.rotation.x = 0.05 * smk + Math.sin(now * 0.6) * 0.006; }
      else {
      for (const P of Ho.parts) { const v = grow(P.lv) * left(P.lv);
        if (D) { P.th.material.color.setHex(hot ? 0xff8a96 : warm ? 0xffd9a0 : mi ? 0xb8ffcf : 0x9fe8ff); P.th.material.opacity = 0.95 * flick; P.tg.material.opacity = 0.9 * flick; P.th.geometry.setDrawRange(0, 2 * Math.floor(P.nA * v)); P.tg.geometry.setDrawRange(0, 2 * Math.floor(P.nG * v)); } /* 실이 한 가닥씩 짜인다 */
        else { P.fill.material.color.setHex(tint); P.fill.material.opacity = 0.5 * v * flick; P.edge.material.color.setHex(hot ? 0xffc2c8 : warm ? 0xffe2b0 : mi ? 0xd8ffe4 : 0xc8f4ff); P.edge.material.opacity = 0.95 * v * flick; P.fill.visible = P.edge.visible = v > 0.01; } }
      { const rv = grow(3) * left(3), ry = Ho.halo.userData.rays; ry.material.opacity = 0.7 * rv * flick * (0.7 + 0.3 * Math.sin(now * 5)); ry.rotation.z = now * 0.06; if (!D) ry.material.color.setHex(hot ? 0xffc2c8 : 0xc8f4ff); }
      Ho.chest.rotation.set(now * 0.9, now * 1.3, 0); Ho.chest.scale.setScalar(1 + 0.2 * Math.sin(now * (hot ? 18 : 2.4)));
      Ho.head.rotation.x = lerp(Ho.head.rotation.x, scLive && SC.st === 'scan' && !watch ? 0.1 : 0.55, 0.12); Ho.head.rotation.y = lerp(Ho.head.rotation.y, scLive && SC.st === 'scan' && !watch ? cl(b.u, -1.4, 1.4) * 0.6 : 0, 0.12); /* 볼 때는 고개를 숙여 나를 내려다본다 */
      const sm = scLive && SC.st === 'smash' ? cl(SC.t / 0.16, 0, 1) : 0, up = scLive && SC.st === 'show' ? ez(cl(SC.t / Math.max(0.2, tune.hle_sc_show), 0, 1)) : scLive && SC.st === 'smash' ? 1 - sm : 0, sway = Math.sin(now * 0.8) * 0.03; /* 대본이 떠 있는 동안 오른팔을 치켜들었다가 내리친다 */
      Ho.armL.rotation.set(-0.45, 0, -0.3 + sway); Ho.armR.rotation.set(lerp(-0.45, -0.25, up) - (sm >= 1 ? 0.8 : 0), 0, lerp(0.3 - sway, 2.5, up)); }
      Ho.g.updateMatrixWorld(true);
      if (Ho.crown) { const CR = Ho.crown, st = scLive ? SC.st : '', T1 = showT(), io = x => x * x * (3 - 2 * x); let ch = 0, fire = 0, fade = 0; /* ch: 왕관에 빛이 찬 정도, fire: 빔이 뻗은 정도, fade: 빔이 사그라든 정도 */
        if (SMX && st === 'show') { ch = io(cl((SC.t - 0.12) / (T1 - 0.3), 0, 1)); fire = cl((SC.t - (T1 - 0.09)) / 0.09, 0, 1); }
        else if (SMX && st === 'smash') { fire = 1; fade = cl((SC.t - HIT) / 0.3, 0, 1); ch = 1 - cl((SC.t - HIT) / 0.45, 0, 1); }
        CR.ch = ch; const on = (ch > 0 || fire > 0) && Ho.g.visible && !!Ho.col; CR.motes.visible = CR.glow.visible = CR.core.visible = on && ch > 0.01; CR.beam.visible = CR.cone.visible = on && fire > 0 && fade < 1;
        if (on) { const CL = Ho.col, F = CR.F, fk = 0.85 + 0.15 * Math.sin(now * 47) * Math.sin(now * 31);
          CR.fw.copy(F).applyMatrix4(Ho.g.matrixWorld); CR.tw.set(0, -0.74, 0.5).unproject(cam).sub(cam.position).normalize().multiplyScalar(2.4).add(cam.position); /* 대본 창이 떠 있는 자리 */
          CL.hal.scale.setScalar(1 + 0.45 * ch); CL.hal.rotation.z = now * 0.05 + ch * ch * now * 2.4; CL.hal.material.opacity = Math.min(1, CL.hal.material.opacity + ch); CL.hal.material.color.lerp(CR.white, ch * 0.5); CL.hg.material.color.lerp(CR.white, ch * 0.75); CL.hg.material.opacity = Math.min(1, CL.hg.material.opacity + ch * 0.3); /* 고리가 커지며 빨리 돌고, 왕관이 하얗게 달아오른다 */
          { const pa = CR.motes.geometry.getAttribute('position'), a = pa.array; let n = 0; for (const [dx, dy, dz, ph, sp] of CR.dirs) { const q = (now * sp * (0.8 + ch * 1.6) + ph) % 1, h = Math.pow(q, 1.6), t = Math.pow(Math.max(0, q - 0.14), 1.6); /* 빛 알갱이가 사방에서 왕관 앞 한 점으로 빨려 든다 */
              a[n++] = F.x + dx * (1 - t); a[n++] = F.y + dy * (1 - t); a[n++] = F.z + dz * (1 - t); a[n++] = F.x + dx * (1 - h); a[n++] = F.y + dy * (1 - h); a[n++] = F.z + dz * (1 - h); } pa.needsUpdate = true; CR.motes.geometry.setDrawRange(0, Math.floor(CR.NM * Math.min(1, ch * 1.5)) * 2); CR.motes.material.opacity = 0.9 * Math.min(1, ch * 2) * (1 - fade); }
          const gr = (0.5 + 2.6 * ch * ch) * fk + fire * (1 - fade) * 2.2; for (const [m, k, o] of [[CR.glow, 1.5, 0.85], [CR.core, 0.6, 1]]) { m.position.copy(CR.fw); m.quaternion.copy(cam.quaternion); m.scale.setScalar(gr * k); m.material.opacity = o * Math.min(1, ch * 1.4 + fire) * (1 - fade * 0.6); }
          if (CR.beam.visible) { CR.tip.copy(CR.fw).lerp(CR.tw, fire); const len = CR.fw.distanceTo(CR.tip), k = 1 - fade, pa = CR.beam.geometry.getAttribute('position'), a = pa.array, r8 = seeded(1 + Math.floor(now * 30)); let n = 0;
            for (let i = 0; i < CR.NB; i++) { const j0 = 0.75 * k, j1 = 0.1 + 0.12 * k; a[n++] = CR.fw.x + (r8() - 0.5) * j0; a[n++] = CR.fw.y + (r8() - 0.5) * j0; a[n++] = CR.fw.z + (r8() - 0.5) * j0; a[n++] = CR.tip.x + (r8() - 0.5) * j1; a[n++] = CR.tip.y + (r8() - 0.5) * j1; a[n++] = CR.tip.z + (r8() - 0.5) * j1; }
            pa.needsUpdate = true; CR.beam.material.opacity = k; CR.cone.position.copy(CR.fw); CR.cone.lookAt(CR.tip); CR.cone.scale.set(0.55 * (0.3 + 0.7 * k), 0.55 * (0.3 + 0.7 * k), Math.max(0.01, len)); CR.cone.material.opacity = 0.5 * k * fk; } }
        else if (CR.on && Ho.col) Ho.col.hal.scale.setScalar(1);
        CR.on = on; }
      Ho.chest.getWorldPosition(C); Ho.head.getWorldPosition(W3.v3); if (Ho.col) W3.v3.y += 0.6 * K; Ho.on = gt >= 0;
      if (Ho.fan) { const fv = Ho.g.visible && !mi ? grow(1) * (1 - lid * 0.0) : 0; Ho.fan.visible = fv > 0; if (fv > 0) { const pa = Ho.fan.geometry.getAttribute('position'), a = pa.array, NF = Ho.NF; let n = 0; W3.eyes.forEach((e, i) => { const shut = scLive && SC.st === 'input' && (NE - 1 - i) < Math.floor(lid * NE + 0.001); if (shut || e.home.z > EX.eye.z - 0.8) return; for (let f = 0; f < NF; f++) { W3.v2.copy(Ho.fanT[i * NF + f]); { const CR = Ho.crown; if (CR && CR.ch > 0 && i % 2 === 0) { const V = W3.v2, k = io2(CR.ch), s = 0.05 * (((i * 7 + f * 3) % 5) - 2); V.x = lerp(V.x, CR.F.x + s, k); V.y = lerp(V.y, CR.F.y + s * 0.6, k); V.z = lerp(V.z, CR.F.z, k); } } W3.v2.applyMatrix4(Ho.g.matrixWorld); a[n++] = e.g.position.x; a[n++] = e.g.position.y; a[n++] = e.g.position.z; a[n++] = W3.v2.x; a[n++] = W3.v2.y; a[n++] = W3.v2.z; } }); pa.needsUpdate = true; Ho.fan.geometry.setDrawRange(0, Math.floor(n / 3 * fv / 2) * 2); Ho.fan.material.color.setHex(hot ? 0xff6a7a : 0x8fe0ff); Ho.fan.material.opacity = 0.42 * flick; } }
      W3.v2.set(MX + b.u * 2.1, ty, tz); if (W3.beam.visible) { const rad = w * 2.1; aimCone(W3.beam, W3.v3, W3.v2, rad, b.k === 2 ? 0.24 : 0.13); W3.pool.position.set(W3.v2.x, ty + 0.003, tz); W3.pool.scale.setScalar(rad * 1.6); W3.pool.material.opacity = b.k === 2 ? 1 : 0.75; } }
    else if (W3.holo) { W3.holo.g.visible = false; W3.holo.on = false; if (W3.holo.fan) W3.holo.fan.visible = false; }
    // 금 · 파편 · 충격파
    if (W3.cr) { W3.cr.visible = !!((sh && tau < 0 && sh.t > 0.3) || (SC && omOn)); if (W3.cr.visible) W3.cr.geometry.setDrawRange(0, sh ? 2 * Math.floor(W3.crN * Math.pow(cl((sh.t - 0.3) / (T_BURST - 0.55), 0, 1), 1.6)) : 2 * W3.crN); } /* 다시 뭉친 Ω에는 금이 그대로 남아 있다 */
    if (W3.lidO) { W3.lidO.visible = !!(SC && omOn); const lk = scLive && SC.st === 'input' ? cl(SC.lid, 0, 1) : scLive && SC.st === 'suck' ? cl(1 - SC.t / 0.12, 0, 1) : ga ? Math.max(0, 1 - Math.abs(ga.t - 3.4) / 0.16) : 0; W3.lidO.rotation.x = lerp(-0.62, 0.62, lk); W3.omIris.forEach(m => { m.scale.y = W3.lidO.visible ? Math.max(0.03, 1 - lk * lk) : 1; }); } /* 눈꺼풀: 감길수록 남은 시간이 없다 */
    W3.core.intensity = sh ? (tau < 0 ? Math.pow(cl(sh.t / T_BURST, 0, 1), 2) * 5 : Math.max(0, 7 - tau * 9)) : ga ? Math.max(0, 6 - Math.abs(ga.t - (GPRE ? 1.2 : 1.7)) * 8) : scLive && SC.st === 'smash' ? Math.max(0, 4 - SC.t * 12) : 0; W3.core.position.copy(W3.burst);
    const shOn = !!(sh && tau >= 0 && tau < 2.0); W3.shards.visible = shOn;
    if (shOn) { const S0 = W3.sh, pos = W3.shards.geometry.getAttribute('position'), a = pos.array, drag = (1 - Math.exp(-1.9 * tau)) / 1.9, shrink = cl(1 - tau / 2.0, 0, 1), V = W3.v, C = W3.v2;
      for (let f = 0; f < S0.n; f++) { C.copy(S0.c[f]).addScaledVector(S0.v[f], drag); C.y -= 0.35 * tau * tau; const ang = S0.w[f] * tau;
        for (let j = 0; j < 3; j++) { const o = f * 9 + j * 3; V.set(S0.base[o] - S0.c[f].x, S0.base[o + 1] - S0.c[f].y, S0.base[o + 2] - S0.c[f].z).applyAxisAngle(S0.ax[f], ang).multiplyScalar(shrink).add(C); a[o] = V.x; a[o + 1] = V.y; a[o + 2] = V.z; } }
      pos.needsUpdate = true; W3.shards.position.copy(W3.burst); W3.shards.scale.setScalar(1.7); W3.shards.material.opacity = cl(1.6 - tau, 0, 1); }
    const gtau = ga ? ga.t - 1.7 : -9; if (false) { W3.wave.visible = true; W3.wave.position.copy(W3.burst); W3.wave.lookAt(cam.position); W3.wave.scale.setScalar(1.5 + gtau * 12); W3.wave.material.opacity = 0.7 * (1 - gtau / 0.7); }
    const gw = GPRE && ga ? ga.t - 1.2 : -9, gwOn = false; if (GPRE && ga && W3.cc) { W3.rc.copy(EX.eye).lerp(W3.cc, 0.42); W3.rc.y -= 1.1; }
    { const sk = GPRE && ga && ga.t > 0.45 && ga.t < 1.55; W3.spark.visible = !!sk; if (sk) { const g1 = cl((ga.t - 0.45) / 0.75, 0, 1), g2 = cl((ga.t - 1.2) / 0.35, 0, 1); W3.spark.position.copy(W3.rc); W3.spark.lookAt(cam.position); W3.spark.scale.setScalar(ga.t < 1.2 ? 0.2 + g1 * g1 * 1.3 : 1.5 + g2 * 5); W3.spark.material.opacity = ga.t < 1.2 ? 0.35 + 0.65 * g1 : 1 - g2; } }
    if (gwOn) { W3.wave.visible = true; W3.wave.position.copy(W3.rc); W3.wave.lookAt(cam.position); W3.wave.scale.setScalar(0.8 + gw * 14); W3.wave.material.opacity = 0.8 * (1 - gw / 0.6); }
    const wvOn = !!(sh && tau >= 0 && tau < 0.8); if (!gwOn) W3.wave.visible = wvOn; if (wvOn) { W3.wave.position.copy(W3.burst); W3.wave.lookAt(cam.position); W3.wave.scale.setScalar(1.5 + tau * 16); W3.wave.material.opacity = 0.8 * (1 - tau / 0.8); }
    // 눈 열여섯 개: 평소에는 허공을 훑고, 볼 때는 광선이 내 책상으로 모인다
    const eyesOn = !!((E.part === 1 && !(sh && tau < 0)) || clOn || pre), live = E.part === 1 && !R && E.start <= 0 && !E.over;
    let seen = 0, warn = 0;
    W3.eyes.forEach((e, i) => { e.g.visible = eyesOn; e.ray.visible = false; if (!eyesOn) return;
      let st = 0, p = e.home, fly = 1, rays = live;
      if (pre) { const pt = pre.t, amp = 0.012 + 0.05 * cl(pt / 0.6, 0, 1); /* 깨지는 순간: 열여섯 눈이 한꺼번에 나를 쏘아보다가, 떨며 끊기고, 감긴다 */
        W3.v.copy(e.home); W3.v.x += Math.sin(now * 61 + i * 2.1) * amp; W3.v.y += Math.sin(now * 83 + i) * amp * 0.7; p = W3.v; e.g.scale.setScalar(1);
        st = pt < 0.6 ? 3 : -1; rays = pt < 0.38 || (pt < 0.6 && Math.floor(now * 30 + i) % 2 === 0); }
      else if (clOn) { p = e.home; e.g.scale.setScalar(mi ? (W3.holo.col ? cl(1 - (mi.t - 1.2 - (i % 8) * 0.08) / 0.5, 0, 1) : cl(W3.clK * 1.2, 0, 1)) : 1); /* 제자리에 뜬 채 한 점으로 빛을 쏜다: 그 빛이 겹친 곳에 홀로그램이 선다 */
        const shut = scLive && SC.st === 'input' && (NE - 1 - i) < Math.floor(cl(SC.lid, 0, 1) * NE + 0.001); /* 남은 시간: 눈이 하나씩 감기며 빛줄기가 꺼진다 */
        rays = !shut && (!ga || ga.t > 0.2 + ((i * 5) % NE) * 0.06) && !(mi && mi.t > (W3.holo.col ? 0.4 : 1.7)) && !(W3.holo.MODE === 'd' && W3.holo.on);
        if (ga && GPRE) { const t = ga.t, d = ((i * 5) % NE) / NE * 0.3, k1 = ez(cl((t - 0.05 - d) / 0.8, 0, 1)), k2 = ez(cl((t - 1.75 - d) / 1.3, 0, 1)), kk = k1 * (1 - k2); /* 눈들이 소용돌이치며 한 고리로 모이고(0~1.2초), 조여들어 터진 뒤, 실을 끌고 제자리로 흩어진다 */
          const rad = t < 0.9 ? 2.0 : t < 1.2 ? lerp(2.0, 0.75, (t - 0.9) / 0.3) : lerp(0.75, 2.6, cl((t - 1.2) / 0.3, 0, 1)), ang = i / NE * 6.2832 + (t < 1.2 ? 1.7 * t * t : 2.448 + (t - 1.2) * 1.1) + (1 - k1) * 1.6;
          W3.v4.set(W3.rc.x + Math.cos(ang) * rad, W3.rc.y + Math.sin(ang) * rad * 0.85, W3.rc.z + Math.sin(ang * 2) * 0.25); W3.v.copy(e.home).lerp(W3.v4, kk); p = W3.v; rays = t > 0.4 + d * 0.6 && t < 1.2; }
        st = shut ? -1 : !scLive ? 0 : SC.st === 'scan' ? (b.k === 2 ? 3 : b.k === 1 ? 1 : 0) : SC.st === 'smash' || SC.st === 'suck' ? 3 : SC.st === 'input' && SC.lid > 0.75 ? 1 : 0; }
      else if (sh) { const d = (i % 8) * 0.035, q = cl((tau - d) / 1.3, 0, 1); fly = 1 - Math.pow(1 - q, 3); W3.v.copy(W3.burst).lerp(e.home, fly); W3.v.y += Math.sin(fly * Math.PI) * 0.7; p = W3.v; e.g.scale.setScalar(0.35 + 0.65 * fly);
        const o = tau - (1.6 + ((i * 5) % NE) / NE * 0.9); st = fly >= 1 && o > 0 && tau < 3.05 ? 3 : 0; rays = st === 3; } // 자리를 잡으면 차례로 뜬다 → 한꺼번에 감는다
      else { e.g.scale.setScalar(1); if (H.theft) st = 3; else if (H.st && live) st = eyeState(H.st, i); }
      e.g.position.copy(p);
      const cx = MX, cz = MZ - 0.02, th = e.ph + now * e.sp; // 훑는 표적: 내 책상 둘레를 돈다
      W3.v3.set(cx, 0.75, cz); if (clOn) W3.v3.copy(ga && GPRE && ga.t < 1.6 ? W3.rc : W3.cc); else if (st < 2 && !(R && R.kind === 'mirror')) { const rr = st === 1 ? e.rho * 0.45 : e.rho; W3.v3.x += Math.cos(th) * rr; W3.v3.z += Math.sin(th) * rr * 0.8; W3.v3.y = 0.2; }
      { const CR = W3.holo && W3.holo.crown; if (CR && CR.ch > 0 && clOn && i % 2 === 0) W3.v3.lerp(CR.fw, io2(CR.ch)); } /* 빛을 보태는 눈은 왕관을 올려다본다 */
      e.aim.lerp(W3.v3, clOn || st >= 2 ? 0.4 : 0.12);
      if (sh && fly < 1) e.g.rotation.set(tau * e.tum[0], tau * e.tum[1], 0); else e.g.lookAt(e.aim);
      const want = st < 0 ? 0 : clOn ? 1 : sh ? (st === 3 ? 1 : fly < 1 ? 0.75 : 0.1) : st >= 2 ? 1 : st === 1 ? 0.5 + 0.2 * Math.sin(now * 40 + i) : 0.6; e.open = lerp(e.open, want, 0.35); if (e.top) { const c = 1 - e.open; e.top.position.y = -0.085 * c; e.bot.position.y = 0.085 * c; e.core.scale.setScalar(0.3 + 0.7 * e.open); } else e.lid.scale.set(1, Math.max(0.08, e.open), 1); /* 모델: 위아래 껍질이 닫히며 눈알이 숨는다 */
      e.irisM.color.setHex(st === 3 ? 0xff2e47 : st >= 1 ? 0xffa030 : 0x3a6aff); if (e.coreM) e.coreM.color.setHex(st === 3 ? 0xff3348 : st >= 1 ? 0xffa030 : 0x4a90ff); if (e.wire) { e.wire.material.color.setHex(st === 3 ? 0xff8a96 : st >= 1 ? 0xffd9a0 : 0x9fe8ff); e.wire.material.opacity = 0.8 * (0.9 + 0.1 * Math.sin(now * 7 + i)); }
      if (rays) { e.ray.visible = true; e.ray.material.color.setHex(st >= 2 ? 0xff2a3a : st === 1 ? 0xffa030 : clOn ? 0x6ad8ff : 0x5a7dff); if (pre) aimCone(e.ray, e.g.position, e.aim, 0.16, 0.3); else if (clOn) aimCone(e.ray, e.g.position, ga && GPRE ? W3.rc : W3.cc, ga && GPRE ? 0.06 : 0.2, (st === 3 ? 0.26 : 0.16) * (0.85 + 0.15 * Math.sin(now * 9 + i))); else aimCone(e.ray, e.g.position, e.aim, st >= 2 ? 0.16 : 0.1, st === 3 ? 0.3 : st >= 1 ? 0.2 : 0.07); }
      if (st === 3) seen++; else if (st >= 1) warn++; });
    if (E.part === 1 && live) { W3.pool.visible = seen + warn > 0; W3.pool.position.set(MX, ty + 0.003, tz); W3.pool.scale.setScalar(seen ? 1.25 : 0.8); W3.pool.material.opacity = seen ? 1 : 0.45; } // 눈들이 보면 시험지가 붉게 물든다
    // 거울 속 나
    const weave = !!(mi && SC && W3.holo && W3.holo.col), mirOn = !!(E.part >= 2 && !(R && R.kind === 'mirror' && R.t < (weave ? 1.3 : 2.75)) && !(SC && !mi)); W3.mirror.visible = mirOn; W3.jamRay.visible = false;
    if (W3.meOut) { const q = weave ? cl((mi.t - 1.3) / 2.0, 0, 1) : 1, solid = !weave || mi.t > 3.9 || (mi.t > 3.45 && Math.floor(now * 30) % 2 === 0), fade = weave ? cl(1 - (mi.t - 3.7) / 0.9, 0, 1) : 0; /* 실이 윤곽을 짜고(1.3~3.3초), 깜빡이며 속이 찬다 */
      W3.meOutM.opacity = 0.95 * fade * (0.85 + 0.15 * Math.sin(now * 30));
      W3.meOut.forEach((o, i) => { o.m.visible = solid; o.l.visible = weave && fade > 0.01; if (o.l.visible) o.l.geometry.setDrawRange(0, 2 * Math.floor(o.n * cl(q * 1.25 - (i % 5) * 0.05, 0, 1))); });
      const fl = W3.flow, fOn = weave && mi.t > 0.4 && mi.t < 3.5 && W3.holo.fanT; fl.visible = !!fOn; if (fOn) { const a = fl.geometry.getAttribute('position').array, FT = W3.holo.fanT, MW = W3.holo.g.matrixWorld, top = lerp(0.7, -0.9, ez(cl((mi.t - 0.5) / 2.6, 0, 1))); /* 풀린 실이 내 앞자리로 흘러내린다 */
        for (let c = 0; c < W3.flowN; c++) { const h1 = (c * 0.6180339) % 1, h2 = (c * 0.7548776) % 1, src = FT[c % FT.length]; W3.v.set(src.x * 0.9, Math.min(src.y, top) + 0.02, src.z).applyMatrix4(MW); W3.v2.set(W3.mx + (h1 - 0.5) * 0.7, 0.55 + h2 * 0.95, W3.mz + (h2 - 0.5) * 0.3);
          const s0 = (now * (0.7 + h1 * 0.6) + h2) % 1, s1 = Math.min(1, s0 + 0.22), o = c * 6; a[o] = lerp(W3.v.x, W3.v2.x, s0); a[o + 1] = lerp(W3.v.y, W3.v2.y, s0 * s0); a[o + 2] = lerp(W3.v.z, W3.v2.z, s0); a[o + 3] = lerp(W3.v.x, W3.v2.x, s1); a[o + 4] = lerp(W3.v.y, W3.v2.y, s1 * s1); a[o + 5] = lerp(W3.v.z, W3.v2.z, s1); }
        fl.geometry.getAttribute('position').needsUpdate = true; fl.material.opacity = 0.8 * cl(Math.min((mi.t - 0.4) / 0.4, (3.5 - mi.t) / 0.5), 0, 1); } }
    if (mirOn) { const M = H.mir, fin = E.part >= 3, rise = R && R.kind === 'mirror' ? ez(cl((R.t - (weave ? 3.4 : 2.75)) / 1.1, 0, 1)) : 1, J = M && !fin && !R ? M.jam : null, jam = J && J.st !== 'idle';
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
      else if (ga) { const k = ez(cl(ga.t / 1.7, 0, 1)); fov = 60 - 5 * Math.sin(k * Math.PI) + 5 * Math.exp(-Math.max(0, gtau) * 6) * (gtau >= 0 ? 1 : 0); yaw = 0.1 + 0.45 * Math.sin(k * Math.PI * 2) * (1 - k); const k2 = ez(cl((ga.t - 1.0) / 2.6, 0, 1)); /* 석상이 발치부터 그려지는 것을 따라 고개가 들린다 */ pitch = lerp(0.18, SCP, k2); fov = lerp(fov, SCF, k2); }
      else if (R.kind === 'mirror') { const k = SC && W3.holo && W3.holo.col ? ez(cl((R.t - 0.7) / 2.5, 0, 1)) : ez(cl((R.t - 0.4) / 1.6, 0, 1)); /* 풀려 내려가는 실을 따라 고개가 내려온다 */ pitch = lerp(SC ? SCP : 0.18, -0.02, k); yaw = lerp(0.1, 0, k); fov = lerp(SC ? SCF : 60, 54, k); }
      else { pitch = -0.02; yaw = 0; fov = 50 + (1 - cl(R.t / 2.5, 0, 1)) * 4; }
      cam.rotation.set(pitch, yaw, 0, 'YXZ'); if (Math.abs(cam.fov - fov) > 0.01) { cam.fov = fov; cam.updateProjectionMatrix(); } }
    else if (SC) { const kk = SMX && SC.st === 'smash' ? 0.03 * Math.exp(-SC.t * 9) * Math.cos(SC.t * 40) : 0; cam.rotation.set(SCP + kk, 0.1, kk * 0.35, 'YXZ'); if (Math.abs(cam.fov - SCF) > 0.01) { cam.fov = SCF; cam.updateProjectionMatrix(); } } /* 대본 단계: 고개를 들고 Ω를 마주 본다 */
    if (CAMX && gaR) camDir(Ax, gaR, now);
    cam.updateMatrixWorld(); EX.scene.updateMatrixWorld();
    if (SC && W3.cc) { W3.v3.copy(W3.cc); W3.v3.project(cam); SC.ox = (W3.v3.x + 1) * 320; SC.oy = (1 - W3.v3.y) * 180; } /* 렌즈 화면에서 Ω가 있는 곳 */
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
  const SMX = new URLSearchParams(location.search).get('smash') !== 'old', HIT = 0.07, showT = () => tune.hle_sc_show + (SMX ? 0.3 : 0); // 대본 깨뜨리기 연출 (HIT: 맞는 순간 멎는 시간, showT: 대본이 온전히 떠 있는 시간. 빛이 차오를 시간으로 0.3초 더 준다)
  function glass(k, cx, cy, hw, hh, rot, a, seed) { // 유리 조각 하나
    const rnd = seeded(seed), P = [[-hw, -hh * (0.6 + rnd() * 0.8)], [hw * (0.5 + rnd() * 0.5), -hh], [hw, hh * (0.4 + rnd() * 0.6)], [-hw * (0.4 + rnd() * 0.6), hh]], co = Math.cos(rot), si = Math.sin(rot);
    hudDraw(k, c => { c.globalAlpha = a; c.beginPath(); P.forEach(([x, y], i) => { const X = cx + x * co - y * si, Y = cy + x * si + y * co; if (i) c.lineTo(X, Y); else c.moveTo(X, Y); }); c.closePath(); c.fillStyle = 'rgba(190,232,255,0.2)'; c.fill(); c.strokeStyle = 'rgba(244,251,255,0.9)'; c.lineWidth = 1; c.stroke(); });
  }
  const io2 = x => { x = cl(x * 2.2, 0, 1); return x * x * (3 - 2 * x); }; // 눈들이 왕관으로 고개를 돌리는 빠르기
  function blk(k, w, cx, cy, o) { // 어절 블록 하나
    const tw = k.TW(w, 10, 700), bw = tw + 16, bh = 22, x = cx - bw / 2, y = cy - bh / 2, col = o.col;
    hudDraw(k, c => { c.globalAlpha = o.a == null ? 1 : o.a; c.fillStyle = o.fill || 'rgba(4,10,16,0.84)'; c.fillRect(x, y, bw, bh); c.strokeStyle = o.first ? WH : rgba(col, 0.85); c.lineWidth = o.first ? 1.6 : 1; c.strokeRect(x + 0.5, y + 0.5, bw - 1, bh - 1);
      if (o.first) { c.fillStyle = WH; c.fillRect(x - 1, y - 8, 11, 9); } });
    const a0 = k.b.globalAlpha; k.b.globalAlpha = o.a == null ? 1 : o.a; if (o.first) k.M('1', x + 4.5, y - 3.5, 6.5, '#041018', 'center', 800); k.T(w, cx, cy + 0.5, 10, o.ink || WH, 'center', 700); k.b.globalAlpha = a0;
    return { x: x - 3, y: y - 4, w: bw + 6, h: bh + 8 };
  }
  function hudScript(k, L, E, now) { // 쪼개진 대본: 위에 Ω의 질문, 가운데 흩어진 블록, 아래에 내가 맞추는 문장
    const H = E.H, C = H.sc, QA = SC_QA[C.i], col = ink(E), n = QA.b.length, hits = [], c0 = k.b, WX = 320, WY = 312, WW = 380, WHh = 30; C.hits = hits;
    c0.globalAlpha = 0.04; for (let y = 1; y < L.H; y += 3) k.R(0, y, L.W, 1, col); c0.globalAlpha = 1;
    if (E.sus > 0.02) { c0.globalAlpha = Math.min(1, 0.15 + E.sus * 0.9) * (E.rising ? 0.7 + 0.3 * Math.sin(now * 16) : 1); c0.drawImage(lensGlow('A', '#ff5a5a'), 0, 0); c0.globalAlpha = 1; }
    const sec = Math.max(0, Math.ceil(E.timeLeft)), low = E.timeLeft < 15 && Math.floor(now * 4) % 2;
    k.M(`ORAL ${C.i + 1}/${scN()}`, 24, 28, 7.5, rgba(col, 0.9), 'left', 700); k.M(`${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`, 616, 28, 9, low ? RED : WH, 'right', 700);
    hudDraw(k, c => { for (let i = 0; i < scN(); i++) { c.fillStyle = i < C.i ? col : i === C.i ? WH : 'rgba(255,255,255,0.25)'; c.fillRect(24 + i * 9, 36, 6, 2); } });
    hudDraw(k, c => { const tw = k.TW(`Ω: "${QA.q}"`, 12, 700) + 28; c.fillStyle = 'rgba(4,8,14,0.62)'; c.fillRect(L.W / 2 - tw / 2, 14, tw, 26); });
    k.SUB(`Ω: "${QA.q}"`, L.W / 2, 28, 12, '#ffffff', 'center');
    const frame = (a, hot) => hudDraw(k, c => { c.globalAlpha = a; c.fillStyle = 'rgba(4,10,16,0.72)'; c.fillRect(WX - WW / 2, WY - WHh / 2, WW, WHh); c.strokeStyle = rgba(hot || col, 0.8); c.lineWidth = 1; c.strokeRect(WX - WW / 2 + 0.5, WY - WHh / 2 + 0.5, WW - 1, WHh - 1); });
    if (C.st === 'ask') frame(cl(C.t / 0.3, 0, 1) * 0.6);
    else if (C.st === 'scan') { const b = H.beam; gazeBar(k, b, 250, WY - 28, 140, col, 'GAZE', RED, now); frame(1, b.k === 2 ? RED : null);
      hudDraw(k, c => { const w = (WW - 4) * cl(C.scan, 0, 1); c.fillStyle = rgba(col, 0.22); c.fillRect(WX - WW / 2 + 2, WY - WHh / 2 + 2, w, WHh - 4); if (C.scan > 0) { c.fillStyle = col; c.fillRect(WX - WW / 2 + 2 + w, WY - WHh / 2 + 2, 1.4, WHh - 4); } });
      k.M(C.scan > 0 ? `SCRIPT ${Math.round(cl(C.scan, 0, 1) * 100)}%` : C.rescans && C.t < 1.2 && Math.floor(now * 6) % 2 ? 'RESCAN' : 'SCRIPT', WX, WY + 0.5, 8, C.scan > 0 ? WH : rgba(col, 0.8), 'center', 700);
      if (C.i === 0 && !C.rescans) k.M(STATE.touchUI ? '안 볼 때 길게 눌러 스캔' : 'SPACE · 안 볼 때 스캔', WX, WY + 26, 7, rgba(WH, 0.7), 'center', 700); }
    else if (C.st === 'show') { const g = SMX ? cl((C.t - (showT() - 0.75)) / 0.75, 0, 1) : 0, g3 = g * g * g; frame(1, g > 0.5 ? RED : null); const a = cl(C.t / 0.15, 0, 1); c0.globalAlpha = a; k.T(QA.b.join(' '), WX + (g > 0.6 ? Math.sin(now * 80) * 1.2 * g : 0), WY + 0.5, 10.5, WH, 'center', 700); c0.globalAlpha = 1;
 }
    else if (C.st === 'smash' && SMX) { const tt = Math.max(0, C.t - HIT), q = cl(tt / 0.42, 0, 1), e = 1 + 2.4 * Math.pow(q - 1, 3) + 1.4 * Math.pow(q - 1, 2), jy = C.t < HIT ? 7 : 7 * Math.exp(-tt * 13) * Math.cos(tt * 36), n2 = C.pool.length, sw = WW / n2;
      if (C.t < HIT) { hudDraw(k, c => { c.fillStyle = 'rgba(255,246,214,0.95)'; c.fillRect(WX - WW / 2 - 6, WY - WHh / 2 - 4 + jy, WW + 12, WHh + 8); c.strokeStyle = 'rgba(244,251,255,0.9)'; c.lineWidth = 1.4; const rnd = seeded(5 + C.i); for (let i = 0; i < 18; i++) { const a = rnd() * Math.PI * 2, r0 = 30 + rnd() * 40, r1 = 120 + rnd() * 190; c.beginPath(); c.moveTo(WX + Math.cos(a) * r0 * 2.4, WY + jy + Math.sin(a) * r0 * 0.5); c.lineTo(WX + Math.cos(a) * r1 * 1.5, WY + jy + Math.sin(a) * r1 * 0.75); c.stroke(); } }); }
      else { if (tt < 0.3) hudDraw(k, c => { const g = c.createRadialGradient(WX, WY, 0, WX, WY, 70 + tt * 420); g.addColorStop(0, `rgba(255,240,190,${0.55 * (1 - tt / 0.3)})`); g.addColorStop(1, 'rgba(255,200,90,0)'); c.fillStyle = g; c.fillRect(0, 0, L.W, L.H); });
        hudDraw(k, c => { c.globalAlpha = 1 - q; cracks(c, WX, WY + jy, 210, cl(tt / 0.16, 0.25, 1), 7 + C.i); });
        { const rnd = seeded(40 + C.i); for (let i = 0; i < 16; i++) { const a = -Math.PI * rnd(), sp = 150 + rnd() * 330, x = WX + (rnd() - 0.5) * WW + Math.cos(a) * sp * tt, y = WY + Math.sin(a) * sp * tt + 520 * tt * tt; glass(k, x, y + jy, 4 + rnd() * 9, 3 + rnd() * 6, rnd() * 6 + tt * (rnd() - 0.5) * 22, cl(1 - tt / 0.5, 0, 1) * 0.9, 300 + i); } }
        for (const p of C.pool) { const sx = WX - WW / 2 + sw * (p.j + 0.5), wob = tt > 0.42 ? Math.sin((tt - 0.42) * 30 + p.j) * 3.2 * Math.exp(-(tt - 0.42) * 11) : 0, x = lerp(sx, p.x, e), y = lerp(WY, p.y, e) - Math.sin(q * Math.PI) * 30 + wob + jy, rot = (((p.j * 37) % 11) / 11 - 0.5) * 2.2 * (1 - q);
          glass(k, x, y, lerp(sw / 2, (k.TW(p.w, 10, 700) + 22) / 2, q), lerp(WHh / 2, 13, q), rot, (1 - q) * 0.95, 60 + p.j);
          if (tt < 0.22) { const d = 4 * (1 - tt / 0.22); blk(k, p.w, x - d, y, { col: '#ff3a55', a: 0.45, ink: '#ff3a55' }); blk(k, p.w, x + d, y, { col: '#38e8ff', a: 0.45, ink: '#38e8ff' }); }
          blk(k, p.w, x, y, { col, first: p.j === 0, a: cl(tt / 0.1, 0.35, 1) }); } }
      }
    else if (C.st === 'smash') { const q = cl(C.t / 0.42, 0, 1), e = 1 - Math.pow(1 - q, 3); frame(1 - q, RED);
      hudDraw(k, c => { if (C.t < 0.16) { c.strokeStyle = rgba(RED, 0.9); c.lineWidth = 3 - C.t * 12; c.beginPath(); c.moveTo(C.ox, C.oy); c.lineTo(WX, WY); c.stroke(); } c.globalAlpha = 1 - q; cracks(c, WX, WY, 150, cl(C.t / 0.2, 0.2, 1), 7 + C.i); });
      for (const p of C.pool) blk(k, p.w, lerp(WX, p.x, e), lerp(WY, p.y, e) - Math.sin(q * Math.PI) * 26, { col, first: p.j === 0 }); }
    else if (C.st === 'input') { const J = C.judge, bad = J && !J.ok, good = J && J.ok;
      hudDraw(k, c => { c.fillStyle = 'rgba(4,10,16,0.6)'; c.fillRect(WX - 285, WY - 17, 570, 34); c.fillStyle = bad ? RED : rgba(col, 0.7); c.fillRect(WX - 285, WY + 16, 570, 1); });
      for (const p of C.pool) { if (C.placed.includes(p)) { hudDraw(k, c => { c.strokeStyle = rgba(col, 0.25); c.setLineDash([2, 3]); const tw = k.TW(p.w, 10, 700) + 16; c.strokeRect(p.x - tw / 2 + 0.5, p.y - 10.5, tw - 1, 21); }); continue; }
        const r = blk(k, p.w, p.x, p.y + Math.sin(now * 2 + p.j) * 1.5, { col, first: p.j === 0 }); if (!J) hits.push(Object.assign(r, { kind: 'pool', j: p.j })); }
      const ws = C.placed.map(p => k.TW(p.w, 10, 700) + 16), tot = ws.reduce((a, b) => a + b, 0) + Math.max(0, ws.length - 1) * 4; let x = WX - tot / 2;
      C.placed.forEach((p, i) => { const sx = bad ? Math.sin(now * 70 + i) * 3 : 0, r = blk(k, p.w, x + ws[i] / 2 + sx, WY, { col: bad ? RED : col, fill: good ? rgba(col, 0.3) : bad ? 'rgba(48,6,10,0.85)' : null, ink: bad ? '#ffd0d0' : WH }); if (!J) hits.push(Object.assign(r, { kind: 'placed', j: p.j })); x += ws[i] + 4; });
      if (bad) k.M('✕', WX + tot / 2 + 16, WY + 0.5, 12, RED, 'center', 800);
      if (C.i === 0 && !C.placed.length && !C.rescans) k.M('순서대로 눌러 문장 만들기', WX, WY + 0.5, 7.5, rgba(WH, 0.6), 'center', 700); }
    else if (C.st === 'suck') { const q = cl(C.t / 0.75, 0, 1), e = q * q;
      for (const p of C.pool) blk(k, p.w, lerp(p.x, C.ox, e), lerp(p.y, C.oy, e), { col: RED, a: 1 - e, first: false }); if (C.t > 0.5) frame(cl((C.t - 0.5) / 0.4, 0, 1) * 0.6); }
    else if (C.st === 'said') { const a = cl(Math.min(C.t / 0.2, (1.4 - C.t) / 0.3), 0, 1); c0.globalAlpha = a; k.SUB(`"${QA.b.join(' ')}."`, L.W / 2, WY, 12, '#ffffff', 'center'); c0.globalAlpha = 1; }
  }
  function hud(k, L, E, now, H0) { const H = E.H; if (!H) return false;
    if (H.sc && H.sc.st !== 'out' && !H.tr && !(E.breakT > 0) && E.start <= 0) { hudScript(k, L, E, now); hudFx(k, L, E, now); return true; }
    if (!(H.tr || H.theft)) return false; // 연출 중에는 렌즈 화면을 비우고 장면만
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
  return { start, step, part, canMark, threat, world, hud, hudTop, _W3: W3, _eye: eyeState, SC_QA };
})();
