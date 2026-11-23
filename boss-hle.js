// PROTOTYPE - NOT FOR PRODUCTION
// Question: 감독관 눈치를 보며 AI 안경으로 스캔하는 긴장감이, 장비와 시험이 함께 커지는 성장과 맞물려 엔딩까지 재밌나?
// Date: 2026-11-23
// 외계 마지막 시험(인류의 마지막 시험)의 최종 보스 Ω. 스캔·마킹 규칙은 game.js 그대로 쓰고, 감시 패턴·연출만 이 파일이 맡는다.
//   1단계 관찰: 하늘을 덮은 거대한 눈. 붉은 시선 빔이 좌우로 쓸고 지나간다. 빔이 내 책상에 있는 동안 스캔하면 들킨다 (빔 빛이 시험지 위로 지나간다)
//   전환: 눈에 금이 가고 산산조각 → 작은 눈 열여섯 개가 사방으로 흩어져 나를 둘러싼다
//   2단계 학습: 눈의 폭풍. 고리 · 좌우 교대 · 일제 개안 · 두 바퀴. 하나라도 붉게 열려 있으면 보고 있는 것. 중간에 Ω가 렌즈를 두 단계 빼앗는다 (화면이 깨지고 낮은 단계로)
//   전환: 모든 눈이 한 점으로 빨려 들어가 꺼진다 → 정적 → 그 자리에 '안경 쓴 나'가 앉아 있다
//   3단계 예측: 거울 속 나와 동시에 푼다. 내가 먼저 다 풀어야 이긴다 (읽지 않은 답은 낼 수 없다). 가끔 고개를 들어 나를 본다
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
  };

  // ---- 시작 · 단계 ----
  function start(E) {
    E.H = { t: 0, tr: null, flash: 0, crack: 0, say: null, beam: { u: -1.05, dir: 1, st: 'move', t: 0, dur: 0, feint: false, focus: false, arm: false, k: 0 }, st: null, theft: null, mir: null, eyesOut: 0, stolen: false };
    E.staff.forEach(s => { s.bossCtl = true; s.phase = 'stand'; s.t = 0; s.dur = 1; });
    const J = Number(params.get('hleph') || 0); // check only: 바로 2·3·최종 단계부터
    for (let p = 1; p <= Math.min(3, J - 1); p++) { E.qs.forEach((q, i) => { if (E.answers[i] == null) { E.answers[i] = q.answer; E.via[i] = 'ai'; } }); closePart(); beginPart(p, false); E.breakT = 0; if (E.H.tr) E.H.tr = null; if (p === 1) E.H.eyesOut = 1; if (p === 3) finalNow(); }
    if (J >= 2) { E.start = 0.6; E.H.tr = null; }
    if (J >= 3) { E.H.stolen = true; const cur = ORDER.indexOf(hudStage(E)); E.omegaDown = 2; E.stageForce = ORDER[Math.min(ORDER.length - 1, Math.max(0, cur) + 2)]; } // 2단계에서 렌즈를 빼앗긴 상태로
  }
  function part(p) {
    const E0 = E, H = E0.H; if (!H) return;
    E0.noStartLine = true; H.t = 0;
    if (p === 1) { H.tr = { kind: 'shatter', t: 0, dur: 3.8 }; E0.breakT = 3.8; H.st = { t: 0, ev: [], end: 1.2, last: '', n: 0 }; }
    else if (p === 2) { const T = E0.T, more = makeQuestions(rng, T, 3, E0.used); E0.qs = E0.qs.concat(more).slice(0, Math.round(tune.hle_race_q)); assignAI(E0.qs, false);
      H.tr = { kind: 'mirror', t: 0, dur: 5.8 }; E0.breakT = 5.8; H.mir = null; }
    else if (p === 3) { if (G.ended) { E0.over = true; E0.all = true; E0.endT = 0; return; } E0.qs = E0.qs.filter(q => q.final).slice(-1); if (!E0.qs.length) { E0.over = true; E0.all = true; return; }
      H.tr = { kind: 'end', t: 0, dur: 3.2 }; E0.breakT = 3.2; }
  }
  function finalNow() { E.qi = 0; E.finalQ = true; E.sus = 0; E.staff.forEach(s => { s.phase = 'stand'; s.asleep = true; s.away = true; }); }
  function canMark(i, how) { // 3단계: 거울 속 나와의 경주에서는 안경이 읽은 문제만 낸다
    if (E.H && E.part === 2 && !E.ai && how !== 'auto') { sfx.no(); E.H.nope = 0.6; return false; }
    return true;
  }

  // ---- 1단계: 거대한 눈의 시선 빔 ----
  function stepBeam(dt) {
    const H = E.H, b = H.beam, prog = cl(H.t / 60, 0, 1), sp = lerp(0.55, 0.95, prog), w = tune.hle_beam;
    b.t += dt;
    if (b.st === 'move') {
      const before = b.u; b.u += b.dir * sp * dt;
      if (b.feint && Math.abs(b.u) <= 0.5 && Math.abs(before) > 0.5) { b.st = 'peek'; b.t = 0; b.dur = 0.55; }
      else if (b.focus && Math.sign(b.u) !== Math.sign(before)) { b.st = 'focus'; b.t = 0; b.dur = between(1.3, 1.8); b.u = 0; }
      else if ((b.dir > 0 && b.u >= 1.05) || (b.dir < 0 && b.u <= -1.05)) { b.u = cl(b.u, -1.05, 1.05); b.st = 'rest'; b.t = 0; b.dur = between(0.35, 0.8) * lerp(1, 0.7, prog); }
    } else if (b.t >= b.dur) {
      if (b.st === 'rest') { b.dir = -b.dir; b.feint = H.t > 4 && rng() < 0.28; b.focus = !b.feint && H.t > 8 && rng() < 0.24; b.arm = b.focus; if (b.focus) S.hum(); }
      else if (b.st === 'peek') { b.dir = -b.dir; b.feint = false; }
      else if (b.st === 'focus') { b.focus = false; b.arm = false; }
      b.st = 'move'; b.t = 0;
    }
    const on = Math.abs(b.u) < w, near = !on && Math.abs(b.u) < w + 0.5 && (b.st === 'peek' || (b.st === 'move' && b.dir * -b.u > 0) || (b.st === 'rest' && false));
    b.k = on ? 2 : near ? 1 : 0; return b.k;
  }

  // ---- 2단계: 눈의 폭풍 ----
  function addPattern(st) {
    const kinds = ['ring', 'alt', 'all', 'twice'], pick = st.n < 3 ? ['ring', 'alt', 'all'][st.n] : (() => { let k; do k = kinds[Math.floor(rng() * kinds.length)]; while (k === st.last); return k; })();
    const T0 = st.end, ev = st.ev, sp = lerp(1, 0.8, cl(st.n / 8, 0, 1)); let end = T0;
    if (pick === 'ring') { const s0 = Math.floor(rng() * NE), step = 0.1 * sp; for (let j = 0; j < NE; j++) { const t1 = T0 + 0.6 + j * step; ev.push({ e: (s0 + j) % NE, t0: t1 - 0.35, t1, t2: t1 + 0.45 }); } end = T0 + 0.6 + NE * step + 0.45 + 2.0 * sp; }
    else if (pick === 'alt') { let t = T0 + 0.4; for (let r = 0; r < 3; r++) { const side = r % 2; for (let e = 0; e < NE; e++) { const a = e / NE; if ((side === 0) === (a > 0.5)) ev.push({ e, t0: t - 0.4, t1: t, t2: t + 1.0 * sp }); } t += (1.0 + 0.35) * sp; } end = t + 2.4 * sp; }
    else if (pick === 'all') { for (let e = 0; e < NE; e++) ev.push({ e, t0: T0 + 0.6, t1: T0 + 0.95, t2: T0 + 2.15 }); end = T0 + 2.15 + 2.6 * sp; }
    else { const s0 = Math.floor(rng() * NE); let t = T0 + 0.6; for (let j = 0; j < NE * 2; j++) { const step = lerp(0.12, 0.06, j / (NE * 2)) * sp; ev.push({ e: (s0 + j) % NE, t0: t - 0.3, t1: t, t2: t + 0.35 }); t += step; } end = t + 0.35 + 2.2 * sp; }
    st.end = end; st.last = pick; st.n++;
  }
  function eyeState(st, e) { // 0 감김 · 1 들썩(예고) · 2 열림(아직 초점 전) · 3 나를 봄
    let s = 0; for (const v of st.ev) { if (v.e !== e || st.t < v.t0 || st.t >= v.t2) continue; s = Math.max(s, st.t < v.t1 ? 1 : st.t < v.t1 + 0.12 ? 2 : 3); } return s;
  }
  function stepStorm(dt) {
    const H = E.H, st = H.st; st.t += dt;
    while (st.end < st.t + 4) addPattern(st);
    st.ev = st.ev.filter(v => v.t2 > st.t - 0.5);
    let k = 0; for (let e = 0; e < NE; e++) { const s = eyeState(st, e); if (s === 3) k = 2; else if (s && k < 1) k = 1; }
    if (st.ev.some(v => Math.abs(v.t1 - st.t) < dt / 2 + 1e-6 || (v.t1 <= st.t && v.t1 > st.t - dt))) S.blink();
    return k;
  }

  // ---- 3단계: 거울 속 나 ----
  function newMirror() {
    const lv = Math.max(3, G.gear.lens - (E.omegaDown || 0)), base = (scanSecondsAt(lv) + 0.95) * tune.hle_mirror;
    return { done: 0, prog: 0, per: E.qs.map((_, i) => base * (1 - 0.035 * i) * between(0.9, 1.1)), st: 'solve', t: 0, next: between(2.6, 3.6), scr: 0 };
  }
  function stepMirror(dt) {
    const H = E.H, M = H.mir || (H.mir = newMirror()); M.t += dt;
    if (E.answers.filter(a => a != null).length >= E.qs.length) return 0; // 내가 다 냈으면 거기서 멈춘다
    if (M.st === 'solve') { M.prog += dt / M.per[Math.min(M.done, M.per.length - 1)]; M.next -= dt; M.scr -= dt; if (M.scr <= 0) { M.scr = 0.28; S.scratch(); }
      if (M.prog >= 1) { M.prog = 0; M.done++; S.tick(); if (M.done >= E.qs.length) { lose(); return 0; } }
      if (M.next <= 0) { M.st = 'tell'; M.t = 0; } }
    else if (M.st === 'tell' && M.t >= 0.45) { M.st = 'look'; M.t = 0; }
    else if (M.st === 'look' && M.t >= 1.0) { M.st = 'solve'; M.t = 0; M.next = between(2.6, 4.0); }
    return M.st === 'look' ? 2 : M.st === 'tell' ? 1 : 0;
  }
  function lose() { const H = E.H; H.lost = true; E.forceFail = true; E.over = true; E.all = false; E.endT = -1.3; E.endLine = '거울 속 나: "내가 먼저 냈어."'; while (E.answers.length < E.qs.length) E.answers.push(null); sfx.fail(); }

  // ---- 연출 진행 ----
  function stepTrans(dt) {
    const H = E.H, R = H.tr, t0 = R.t; R.t += dt; const at = s => t0 < s && R.t >= s;
    if (R.kind === 'shatter') { if (at(0.05)) S.hum(); if (at(0.55)) S.crack(); if (at(0.85)) S.crack(); if (at(1.15)) { S.shatter(); H.flash = 1; H.eyesOut = 0.001; } if (R.t > 1.15) H.eyesOut = cl((R.t - 1.15) / 1.3, 0, 1); }
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
    if (E.part === 0) k = stepBeam(dt);
    else if (E.part === 1) { k = stepStorm(dt); if (!H.stolen && (E.qi >= 2 || H.t > 26)) { H.stolen = true; H.theft = { t: 0 }; const sh = 2.2; H.st.ev.forEach(v => { if (v.t1 > H.st.t) { v.t0 += sh; v.t1 += sh; v.t2 += sh; } }); H.st.end += sh; return true; } }
    else if (E.part === 2) k = stepMirror(dt);
    const s = E.staff[0]; if (s) { s.phase = k === 2 ? 'watch' : k === 1 ? 'tell' : 'stand'; s.asleep = false; s.away = false; }
    return false;
  }

  // ---- 3D: 눈 · 빔 · 거울 속 나 ----
  const W3 = { sc: null };
  function radialTex(Ax, col) { const t = Ax.canvasTex(64, 64, true), g = t.g, gr = g.createRadialGradient(32, 32, 2, 32, 32, 31); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); t.t.needsUpdate = true; return t.t; }
  function build(Ax) {
    const { THREE, EX } = Ax, sc = EX.scene, MY = EX.my || { x: 0.6, z: 0 }; W3.sc = sc; W3.v = new THREE.Vector3(); W3.v2 = new THREE.Vector3();
    const cg = new THREE.ConeGeometry(1, 1, 18, 1, true); cg.translate(0, -0.5, 0); cg.rotateX(-Math.PI / 2); // 꼭짓점이 원점, +z 쪽으로 퍼진다
    W3.beam = new THREE.Mesh(cg, new THREE.MeshBasicMaterial({ color: 0xff2a3a, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false })); W3.beam.visible = false; sc.add(W3.beam);
    W3.pool = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), new THREE.MeshBasicMaterial({ map: radialTex(Ax, 'rgba(255,40,60,0.95)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); W3.pool.rotation.x = -Math.PI / 2; W3.pool.visible = false; W3.pool.renderOrder = 5; sc.add(W3.pool);
    W3.eyes = []; const eyeGeo = new THREE.IcosahedronGeometry(0.26, 1), irisGeo = new THREE.CircleGeometry(0.12, 14), pupGeo = new THREE.CircleGeometry(0.055, 10);
    for (let i = 0; i < NE; i++) { const a = i / NE * Math.PI * 2, r = i % 2 ? 3.4 : 2.9, y = [1.0, 2.3, 1.6, 2.8][i % 4], g = Ax.pivot(sc, MY.x + Math.sin(a) * r, y, EX.eye.z - Math.cos(a) * r), lid = Ax.pivot(g, 0, 0, 0);
      const ball = new THREE.Mesh(eyeGeo, Ax.psx(new THREE.MeshLambertMaterial({ color: 0xe8e4ee, flatShading: true }))); lid.add(ball);
      const irisM = Ax.glowMat(0x3a6aff), iris = new THREE.Mesh(irisGeo, irisM); iris.position.z = 0.25; lid.add(iris); const pup = new THREE.Mesh(pupGeo, Ax.glowMat(0x050508)); pup.position.z = 0.256; lid.add(pup);
      g.visible = false; W3.eyes.push({ g, lid, irisM, home: g.position.clone(), a, open: 0 }); }
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
  }
  function world(E, now, Ax) {
    const H = E.H, { THREE, EX } = Ax; if (!H || !EX.scene || !EX.cam) return;
    if (W3.sc !== EX.scene) build(Ax);
    const om = EX.staff[0], R = H.tr, cam = EX.cam, MX = EX.my ? EX.my.x : 0.6; W3.om = om; W3.EX = EX;
    // Ω: 1단계에는 크게 떠서 빔 끝을 바라본다. 깨진 뒤에는 없다
    const omOn = !!((E.part === 0 && !R) || (R && R.kind === 'shatter' && R.t < 1.15)); // 단계 번호는 연출이 시작될 때 이미 넘어가 있다 (three.js는 visible === false 만 숨기므로 꼭 true/false로)
    if (om) { om.root.visible = omOn; if (omOn) { om.root.scale.setScalar(1.7); const shake = R && R.kind === 'shatter' ? (R.t - 0.4) * 0.06 : 0; if (shake > 0) om.root.position.x += Math.sin(now * 70) * shake; } }
    const b = H.beam, tx = MX + b.u * 2.1, ty = 0.752, tz = (EX.my ? EX.my.z : 0) - 0.02, beamOn = !!(omOn && !(R && R.t > 0.4) && E.start <= 0 && !E.over);
    W3.beam.visible = W3.pool.visible = beamOn;
    if (om && omOn) { om.root.updateMatrixWorld(); om.root.getWorldPosition(W3.v); W3.v2.set(tx, ty, tz); om.head.lookAt(W3.v2); om.irisMat.color.setHex(b.k === 2 ? 0xff2e47 : b.k === 1 || b.arm ? 0xffa030 : 0x3a6aff);
      if (beamOn) { const L = W3.v.distanceTo(W3.v2), rad = tune.hle_beam * 2.1; W3.beam.position.copy(W3.v); W3.beam.lookAt(W3.v2); W3.beam.scale.set(rad, rad, L); W3.beam.material.opacity = b.k === 2 ? 0.22 : 0.12;
        W3.pool.position.set(tx, ty + 0.003, tz); W3.pool.scale.setScalar(rad * 1.6); W3.pool.material.opacity = b.k === 2 ? 1 : 0.75; } }
    // 눈 열여섯 개
    const eyesOn = (E.part === 1 && !(R && R.kind === 'shatter' && R.t < 1.15)) || (R && R.kind === 'mirror' && R.t < 1.9);
    W3.eyes.forEach((e, i) => { e.g.visible = !!eyesOn; if (!eyesOn) return;
      let st = 0; if (R && R.kind === 'mirror') st = 3; else if (R && R.kind === 'shatter') st = R.t < 3.0 ? 3 : 0; else if (H.theft) st = 3; else if (H.st && E.part === 1 && !R) st = eyeState(H.st, i);
      const want = st >= 2 ? 1 : st === 1 ? 0.35 + 0.15 * Math.sin(now * 40 + i) : 0.12; e.open = lerp(e.open, want, 0.35);
      let p = e.home; if (R && R.kind === 'shatter') { const k = ez(cl((R.t - 1.15) / 1.3, 0, 1)); W3.v.set(0, 2.3, -5.5).lerp(e.home, k); p = W3.v; }
      if (R && R.kind === 'mirror') { const k = ez(cl((R.t - 0.6) / 1.25, 0, 1)); W3.v.copy(e.home).lerp(W3.v2.set(W3.mx, 1.25, W3.mz), k); p = W3.v; e.g.scale.setScalar(1 - 0.85 * k); } else e.g.scale.setScalar(1);
      e.g.position.copy(p); e.g.lookAt(EX.eye); e.lid.scale.set(1, Math.max(0.08, e.open), 1);
      e.irisM.color.setHex(st === 3 ? 0xff2e47 : st >= 1 ? 0xffa030 : 0x3a6aff); });
    // 거울 속 나
    const mirOn = !!(E.part >= 2 && !(R && R.kind === 'mirror' && R.t < 2.75)); W3.mirror.visible = mirOn;
    if (mirOn) { const M = H.mir, fin = E.part >= 3, rise = R && R.kind === 'mirror' ? ez(cl((R.t - 2.75) / 1.1, 0, 1)) : 1;
      W3.spot.intensity = 2.4 * rise; const look = fin || (M && (M.st === 'look' || (M.st === 'tell' && M.t > 0.2))) || (R && R.kind === 'mirror' && R.t < 4.4) || (R && R.kind === 'end' && R.t > 0.6);
      const writing = !look && !fin && (!R || R.t > 4.6), hp = look ? (fin ? -0.04 : 0.0) : 0.5;
      Ax.poseModel(W3.me, { x: W3.mx, y: 0, z: W3.mz, yaw: 0, sit: 1, now, phase: 'stand', headPitch: hp, moving: false, walk: 0 });
      if (writing) W3.me.arms[1].rotation.x = -0.95 + Math.sin(now * 13) * 0.07;
      const crack = H.mirCrack > 0 || fin, fl = Math.floor(now * 14) % 3 === 0;
      W3.lensL.color.setHex(crack ? (fl ? 0x2a3a30 : 0x8dffb0) : R && R.kind === 'mirror' && R.t < 3.7 ? 0x1a2a20 : 0x8dffb0); W3.lensR.color.setHex(crack ? 0x101410 : look ? 0x3dff7a : 0x0e3a1e); W3.bars.color.setHex(crack ? 0x203020 : 0x5dff8a);
    } else W3.spot.intensity = 0;
    // 카메라: 연출 중에는 그쪽을 보게 한다. 3단계는 앞을 보면 거울 속 나와 눈높이가 맞는다
    if (E.part >= 2 && EX.views && EX.views.front && EX.views.front.pitch > 0.05) EX.views = Object.assign({}, EX.views, { front: { yaw: 0.0, pitch: -0.02, fov: 54 } });
    if (R) { let yaw = 0.1, pitch = 0.18, fov = 60;
      if (R.kind === 'shatter') { const k = cl((R.t - 1.2) / 2.2, 0, 1); yaw = 0.1 + Math.sin(k * Math.PI * 2) * 1.05 * (1 - k * 0.3); pitch = 0.18 - Math.sin(k * Math.PI) * 0.1; fov = 60 + Math.sin(cl(R.t / 1.15, 0, 1) * Math.PI) * -8; }
      else if (R.kind === 'mirror') { const k = ez(cl((R.t - 0.4) / 1.6, 0, 1)); pitch = lerp(0.18, -0.02, k); yaw = lerp(0.1, 0, k); fov = lerp(60, 54, k); }
      else { pitch = -0.02; yaw = 0; fov = 50 + (1 - cl(R.t / 2.5, 0, 1)) * 4; }
      cam.rotation.set(pitch, yaw, 0, 'YXZ'); if (Math.abs(cam.fov - fov) > 0.01) { cam.fov = fov; cam.updateProjectionMatrix(); } }
    // 화면 위 자리: 눈(깨질 때 금)과 거울 속 나의 머리
    cam.updateMatrixWorld(); EX.scene.updateMatrixWorld();
    const pr = o => { o.getWorldPosition(W3.v); W3.v.project(cam); return W3.v.z > 1 ? null : { x: (W3.v.x + 1) / 2 * 640, y: (1 - W3.v.y) / 2 * 360 }; };
    H.omScr = om && omOn ? pr(om.head) : null; H.mirScr = mirOn ? pr(W3.me.head) : null;
  }

  // ---- 렌즈 화면 ----
  function cracks(c, cx, cy, r, k, seed) { // 한 점에서 퍼지는 금
    let s = seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    c.lineWidth = 1.2; for (let i = 0; i < 9; i++) { let a = rnd() * Math.PI * 2, x = cx, y = cy; c.strokeStyle = 'rgba(255,255,255,0.85)'; c.beginPath(); c.moveTo(x, y);
      const n = 5; for (let j = 0; j < n; j++) { a += (rnd() - 0.5) * 0.9; const L = r * k / n * (0.6 + rnd()); x += Math.cos(a) * L; y += Math.sin(a) * L; c.lineTo(x, y); } c.stroke(); }
    c.strokeStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.arc(cx, cy, r * k * 0.25, 0, 7); c.stroke();
  }
  function hudFx(k, L, E, now) { // 섬광 · 금 · 자막 (연출 중에도 그린다)
    const H = E.H, R = H.tr;
    if (R && R.kind === 'shatter' && R.t > 0.5 && R.t < 1.2 && H.omScr) hudDraw(k, c => cracks(c, H.omScr.x, H.omScr.y, 120, cl((R.t - 0.5) / 0.6, 0, 1), 7));
    if (H.crack > 0) hudDraw(k, c => { c.globalAlpha = Math.min(1, H.crack * 1.4); cracks(c, 220, 140, 260, 1, 11); cracks(c, 470, 230, 200, 1, 29); c.globalAlpha = 1; });
    if (H.flash > 0) { k.b.globalAlpha = Math.min(1, H.flash); k.R(0, 0, L.W, L.H, '#ffffff'); k.b.globalAlpha = 1; }
    if (H.say) { const a = Math.min(1, (H.say.dur - H.say.t) / 0.4, H.say.t / 0.2); k.b.globalAlpha = cl(a, 0, 1); k.SUB(H.say.text, L.W / 2, L.H - 30, 12, '#ffffff', 'center'); k.b.globalAlpha = 1; }
  }
  function hud(k, L, E, now, H0) { const H = E.H; if (!H || !(H.tr || H.theft)) return false; // 연출 중에는 렌즈 화면을 비우고 장면만
    if (H.theft && H.theft.t > 0.55) return false;
    if (H.theft) { k.b.globalAlpha = 0.6 + 0.4 * Math.sin(now * 50); k.b.drawImage(lensGlow('A', '#ff5a5a'), 0, 0); k.b.globalAlpha = 1; }
    hudFx(k, L, E, now); return true; }
  function hudTop(k, L, E, now) {
    const H = E.H; if (!H) return; const col = ink(E), live = E.start <= 0 && !E.over && !E.caught && !(E.breakT > 0);
    if (live && E.part === 0) { const b = H.beam, x0 = 250, w = 140, y = 62, cx = x0 + w / 2, bw = tune.hle_beam / 1.1 * (w / 2) * 2; // 시선 빔이 어디 있나: 가운데 꺾쇠가 내 자리
      hudDraw(k, c => { c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(x0, y, w, 1); for (const f of [0, 0.25, 0.75, 1]) c.fillRect(x0 + w * f - 0.5, y - 2, 1, 5);
        const bx = cx + (b.u / 1.1) * (w / 2) - bw / 2; c.fillStyle = b.k === 2 ? RED : b.k === 1 ? AMB : rgba(RED, 0.65); c.fillRect(Math.max(x0 - 6, bx), y - 2.5, bw, 6);
        const mc = b.k === 2 ? RED : b.k === 1 ? AMB : col; c.fillStyle = mc; c.beginPath(); c.moveTo(cx, y + 4); c.lineTo(cx - 4, y + 10); c.lineTo(cx + 4, y + 10); c.closePath(); c.fill(); });
      k.M('GAZE', x0 - 8, y + 0.5, 6.5, rgba(col, 0.85), 'right', 700); if (b.arm && Math.floor(now * 6) % 2) k.M('LOCK', x0 + w + 8, y + 0.5, 6.5, AMB, 'left', 700); }
    if (live && E.part === 1 && H.st) { const cx = 586, cy = 238, r = 30; // 눈 레이더: 위쪽이 내 앞
      hudDraw(k, c => { c.fillStyle = 'rgba(3,6,10,0.45)'; c.beginPath(); c.arc(cx, cy, r + 9, 0, 7); c.fill(); c.strokeStyle = rgba(col, 0.45); c.lineWidth = 1; c.beginPath(); c.arc(cx, cy, r, 0, 7); c.stroke(); c.strokeStyle = rgba(col, 0.2); c.beginPath(); c.arc(cx, cy, r * 0.5, 0, 7); c.stroke();
        c.fillStyle = col; c.beginPath(); c.moveTo(cx, cy - 5); c.lineTo(cx - 3.5, cy + 3); c.lineTo(cx + 3.5, cy + 3); c.closePath(); c.fill();
        for (let e = 0; e < NE; e++) { const s = eyeState(H.st, e), a = e / NE * Math.PI * 2, x = cx + Math.sin(a) * r, y = cy - Math.cos(a) * r;
          if (s === 3) { c.fillStyle = RED; c.beginPath(); c.arc(x, y, 3.2, 0, 7); c.fill(); c.strokeStyle = rgba(RED, 0.6); c.beginPath(); c.arc(x, y, 5.5, 0, 7); c.stroke(); }
          else if (s >= 1) { c.fillStyle = Math.floor(now * 12) % 2 ? AMB : rgba(AMB, 0.4); c.beginPath(); c.arc(x, y, 2.4, 0, 7); c.fill(); }
          else { c.fillStyle = rgba(col, 0.4); c.beginPath(); c.arc(x, y, 1.5, 0, 7); c.fill(); } } });
      k.M('EYES', cx, cy - r - 14, 6.5, rgba(col, 0.85), 'center', 700); }
    if (live && E.part === 2 && H.mir) { const M = H.mir, n = E.qs.length, x0 = 520, y0 = 222, gap = 11; // 경주: 위는 거울 속 나, 아래는 나
      const mine = E.answers.filter(a => a != null).length;
      hudDraw(k, c => { c.fillStyle = 'rgba(3,6,10,0.5)'; c.fillRect(x0 - 40, y0 - 18, 140, 52);
        for (let i = 0; i < n; i++) { const x = x0 + i * gap; c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 1; c.strokeRect(x - 3.5, y0 - 3.5, 7, 7); if (i < M.done) { c.fillStyle = WH; c.fillRect(x - 3.5, y0 - 3.5, 7, 7); } else if (i === M.done) { c.fillStyle = WH; c.fillRect(x - 3.5, y0 + 3.5 - 7 * M.prog, 7, 7 * M.prog); }
          c.strokeStyle = rgba(col, 0.8); c.strokeRect(x - 3.5, y0 + 14 - 3.5, 7, 7); if (i < mine) { c.fillStyle = col; c.fillRect(x - 3.5, y0 + 14 - 3.5, 7, 7); } } });
      k.M('거울', x0 - 12, y0, 7, WH, 'right', 700); k.M('나', x0 - 12, y0 + 14, 7, col, 'right', 700);
      if (M.st !== 'solve') k.M(M.st === 'look' ? 'EYES ON' : '…', x0 + (n - 1) * gap / 2, y0 - 12, 6.5, M.st === 'look' ? RED : AMB, 'center', 700);
      if (H.nope > 0) k.SUB('(읽지 않은 문제는 낼 수 없다)', L.W / 2, L.H - 56, 10, '#ffd0d0', 'center'); }
    hudFx(k, L, E, now);
  }
  return { start, step, part, canMark, world, hud, hudTop, _W3: W3, _eye: eyeState };
})();
