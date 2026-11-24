// PROTOTYPE - NOT FOR PRODUCTION
// Question: 감독관 눈치를 보며 AI 안경으로 스캔하는 긴장감이, 장비와 시험이 함께 커지는 성장과 맞물려 엔딩까지 재밌나?
// Date: 2026-11-23
// 해외 마지막 시험(월가 투자은행 최종 면접)의 3페이즈 보스전. 렌즈 화면·규칙·3D 연출을 이 파일이 맡는다.
//   1페이즈 프롬프터 속사: 면접관이 고개를 숙인 틈에 안경이 띄운 답변 한 문장(블록 8~12개)을 와다다 쳐 낸다. 못 끝내면 말이 끊기고, 보는 중에 누르면 '들킨 입력'
//   전환: 전무가 일어나 "숫자로 얘기해 보죠." → 조명이 죽고 벽이 시세판으로 켜지며 카메라가 옆으로 빠진다
//   2페이즈 리듬 면접: 박자에 맞춰 내려오는 노트를 판정선에서. 맞췄나 / 못 맞췄나 둘 중 하나. 면접관이 보는 구간(빨간 띠)은 누르지 않는다
//   전환: 음악이 끊기고 내가 일어나 발표 화면 앞에 선다 → 카메라가 면접관들 등 뒤로 돈다
//   3페이즈 질문 공방: 짧은 발표 뒤 질문이 사방에서 생긴다. 안경이 질문을 하나씩 읽어 답변 블록을 만든다.
//                     답변과 질문을 짝지어(어느 쪽을 먼저 눌러도 됨) 질문의 시간이 다 하기 전에 지운다. 함정 질문에는 아무것도 붙이지 않는다
// game.js가 E.boss === 'ibank'일 때 step·hud·world·place를 부른다. 판정 값은 config.js의 ib_* 에 있다.
'use strict';

window.BOSS = window.BOSS || {};
BOSS.ibank = (() => {
  const lerp = (a, b, k) => a + (b - a) * k, ez = k => k * k * (3 - 2 * k), cl = (v, a, b) => Math.max(a, Math.min(b, v));
  const KEYS = [['KeyA', 'KeyJ', 'ArrowLeft', 'Digit1'], ['KeyS', 'KeyK', 'ArrowDown', 'Digit2'], ['KeyD', 'KeyL', 'ArrowRight', 'Digit3']];
  const NAMES = ['프롬프터 속사', '리듬 면접', '질문 공방'];
  const INKS = { used: '#74ff8e', proto: '#7fe9ff', mil: '#ffb23a', contact: '#7fe9ff', brain: '#ffd678' };
  const RED = '#ff5a5a', AMB = '#ffcf5a', WH = '#f4f8ff';
  const IB_QA = [ // [안경이 붙이는 꼬리표, 질문, 안경이 만든 답]
    ['DCF', '할인율 근거는?', 'WACC 8.2% · 베타 1.1'], ['EBITDA', '3년 차 EBITDA는?', '420억 · 마진 18%'], ['부채', '부채 비율이 왜 이렇게 높죠?', '인수 금융 · 2년 내 상환'],
    ['IRR', '목표 수익률은?', 'IRR 24% · 5년 회수'], ['밸류', '너무 비싸게 사는 거 아닌가요?', '동종 PER 대비 15% 할인'], ['시너지', '시너지는 어디서 나오죠?', '물류 통합 · 연 80억 절감'],
    ['금리', '금리가 오르면요?', '변동금리 60% 헤지'], ['환율', '환율 위험은?', '달러 매출로 자연 헤지'], ['엑시트', '회수 계획은?', '4년 차 상장 · 차선은 매각'],
    ['리스크', '가장 큰 위험은?', '핵심 인력 이탈 · 잔류 보너스'], ['경쟁', '경쟁사가 따라오면요?', '특허 12건 · 3년 독점'], ['성장', '성장률 근거는?', '시장 연 9% · 점유율 확대'],
    ['현금', '운전자본은 충분합니까?', '6개월치 현금 확보'], ['규제', '규제 걸릴 건 없나요?', '사전 심사 통과'], ['LBO', '레버리지 몇 배죠?', '순차입 4.5배 → 3배'],
    ['배당', '배당은 언제부터?', '2년 차 · 배당성향 30%'], ['인력', '인수 뒤 구조조정은?', '중복 부서만 · 자연 감소'], ['ESG', 'ESG 등급은요?', 'A 등급 · 탄소 감축안'],
  ];
  const IB_TRAP = ['그거 AI가 한 말 아니에요?', '지금 어디 보고 읽어요?', '안경 잠깐 벗어 볼래요?', '외워 온 거죠?'];
  const SPEECH = [[0.3, 1.9, '이번 인수의 핵심은 물류 통합입니다.'], [2.0, 3.4, '5년 안에 IRR 24%를 만들겠습니다.'], [3.5, 4.6, '…질문 받겠습니다.']];
  const CH = [[110, 261.6, 329.6], [87.3, 220, 261.6], [130.8, 329.6, 392], [98, 246.9, 293.7]]; // Am · F · C · G
  const SLOTS = [[112, 72], [320, 50], [528, 72], [100, 146], [540, 146], [122, 220], [518, 220]]; // 질문이 뜨는 자리 (640x360)

  function ink(E) { return INKS[typeof hudStage === 'function' ? hudStage(E) : 'contact'] || '#7fe9ff'; }
  function rgba(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; }
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  // ---- 소리: 리듬 면접의 곡은 게임 안에서 합성한다 (킥·스네어·하이햇·베이스·화음) ----
  function A() { return typeof audio !== 'undefined' && audio && !muted ? audio : null; }
  function kickAt(d, vol = 0.42) { const a = A(); if (!a) return; try { const t = a.ac.currentTime + Math.max(0, d), o = a.ac.createOscillator(), g = a.ac.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(44, t + 0.13); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.24); o.connect(g); g.connect(a.out); o.start(t); o.stop(t + 0.26); } catch (_) { } }
  const snareAt = d => { noiseAt(0.13, 0.08, d, 1900, 0.8); toneAt(196, 0.06, 'triangle', 0.05, d); };
  const hatAt = d => noiseAt(0.03, 0.022, d, 8200, 1);
  const crashAt = (d, v = 0.07) => noiseAt(1.0, v, d, 5200, 0.45);
  const S = {
    hit: (l, n) => toneAt([880, 1046, 1318][l] * (1 + Math.min(n, 24) * 0.006), 0.035, 'square', 0.03),
    bad: () => { toneAt(170, 0.07, 'square', 0.05); toneAt(150, 0.08, 'square', 0.04, 0.05); },
    drop: () => { toneAt(320, 0.1, 'triangle', 0.06); toneAt(210, 0.16, 'triangle', 0.05, 0.08); },
    seen: () => { noiseAt(0.07, 0.12, 0, 3200, 1.2); toneAt(240, 0.16, 'square', 0.07, 0.04); toneAt(180, 0.2, 'square', 0.07, 0.16); },
    pop: () => toneAt(640, 0.05, 'triangle', 0.05),
    read: () => { toneAt(1500, 0.025, 'square', 0.03); toneAt(1900, 0.03, 'square', 0.025, 0.03); },
    sent: () => { toneAt(1175, 0.05, 'sine', 0.07); toneAt(1568, 0.08, 'sine', 0.06, 0.05); },
    pick: () => toneAt(980, 0.03, 'square', 0.035),
    lapse: () => { toneAt(260, 0.18, 'sawtooth', 0.05); toneAt(200, 0.2, 'sawtooth', 0.04, 0.1); },
    power: () => { [220, 330, 440, 660, 880].forEach((f, i) => toneAt(f, 0.07, 'square', 0.03, i * 0.05)); },
    chair: () => { noiseAt(0.35, 0.05, 0, 500, 0.7); toneAt(120, 0.2, 'sawtooth', 0.03, 0.05); },
    thunk: () => { toneAt(60, 0.4, 'sine', 0.2); noiseAt(0.15, 0.05, 0, 300, 0.8); },
  };

  // ---- 시작 ----
  function start(E) {
    E.B = { ph: 0, st: 'play', tr: null, flash: 0, heads: [], res: [], shield: 0, p1: newP1(E), p2: null, p3: null, zones: [], hits: [] };
    E.timeLeft = E.timeTotal = tune.ib1_time;
    E.staff.forEach(s => { s.bossCtl = true; s.phase = 'stand'; s.t = 0; s.dur = 1; });
    const J = Number(params.get('ibph') || 0); // check only: 바로 2·3페이즈부터
    if (J >= 2) { const B = E.B; B.res[0] = { score: 1, ok: true }; E.done.push({ r: 'O' }, { r: 'O' }); B.ph = 1; B.p2 = newP2(); E.quiet = true;
      if (J >= 3) { B.res[1] = { score: 1, ok: true }; E.done.push({ r: 'O' }, { r: 'O' }); B.ph = 2; B.p3 = newP3(); } }
  }

  // ---- 1페이즈: 프롬프터 속사 ----
  // 면접관이 고개를 숙이면(틈) 안경이 답변 한 문장을 통째로 띄운다. 고개를 들기 전에 그 문장의 블록을 와다다 다 쳐 낸다.
  // 못 끝낸 블록은 '말이 끊긴' 것(놓침). 보는 동안 누르면 들킨 입력. gz.ph: watch(본다) → idle(틈) → tell(고개 드는 중, 아직 칠 수 있다) → watch
  const TELL1 = 0.45;
  function newP1(E) {
    const NS = Math.round(tune.ib1_sent), pool = [].concat(...E.qs.filter(q => q.lines).map(q => q.lines.join(' ').split(' '))); if (!pool.length) pool.push('…');
    const sents = []; let pi = 0, N = 0;
    for (let si = 0; si < NS; si++) { const n = Math.round(lerp(8, 12, si / Math.max(1, NS - 1))), bl = [];
      while (bl.length < n) { const m = bl.length, r = rng(); let v;
        if (r < 0.14 && m + 3 <= n) { (rng() < 0.5 ? [0, 1, 2] : [2, 1, 0]).forEach(l => bl.push({ lane: l })); continue; } // 계단
        v = Math.floor(rng() * 3); if (m >= 2 && bl[m - 1].lane === v && bl[m - 2].lane === v) continue; bl.push({ lane: v }); }
      bl.forEach(x => { x.w = pool[pi++ % pool.length]; }); sents.push(bl); N += n; }
    return { t: 0, sents, NS, N, si: -1, stack: [], hit: 0, miss: 0, drop: 0, seen: 0, strikes: 0, combo: 0, gz: { who: 0, ph: 'watch', t: 0, dur: 1.3 }, gap: 1, fx: [], shake: 0, said: [], saidT: 9, cut: 0, slide: 0 };
  }
  function acc1(P) { return P.hit / Math.max(1, P.hit + P.miss + P.drop + 3 * P.seen); }
  function lanesPressed(taps, zones) {
    const out = []; for (let l = 0; l < 3; l++) if (KEYS[l].some(c => pressed(c))) out.push(l);
    for (const [x, y] of taps) { const z = zones.find(z => x >= z.x0 && x < z.x1 && y >= z.y0 && y <= z.y1); if (z) out.push(z.i); }
    return out;
  }
  function expose(how) { // 보는 중에 눌렀다: 페이즈마다 세 번이면 적발
    const B = E.B, P = B.ph === 0 ? B.p1 : B.p2, who = B.ph === 0 ? P.gz.who : P.win ? P.win.who : 0;
    if (B.ph === 1 && B.shield > 0) { B.shield = 0; B.shieldT = 0.8; S.seen(); return; } // 1페이즈를 95% 넘게 끝낸 보상: 한 번은 봐준다
    P.seen++; P.strikes++; B.flash = 0.5; S.seen(); E.source = { how: 'watch', by: E.staff[Math.max(0, who)] };
    E.sus = cl(P.strikes / tune.ib_strikes, 0, 1);
    if (P.strikes >= tune.ib_strikes) { E.sus = 1; E.staff.forEach((s, i) => { s.phase = i === Math.max(0, who) ? 'watch' : 'stand'; }); getCaught(); }
  }
  function stepP1(dt, taps) {
    const B = E.B, P = B.p1, g = P.gz; P.t += dt; g.t += dt; E.timeLeft = E.timeTotal;
    if (g.ph === 'watch' && g.t >= g.dur) { // 고개를 숙인다: 다음 문장이 통째로 뜬다
      if (P.si + 1 >= P.NS) { endPhase(0, acc1(P), 0.5); return; }
      P.si++; P.stack = P.sents[P.si].slice(); P.said = []; P.cut = 0; g.ph = 'idle'; g.t = 0; g.dur = P.stack.length * tune.ib1_rate * lerp(1, 0.82, P.si / P.NS) + 0.3; P.gap = g.dur + TELL1; S.pop(); }
    else if (g.ph === 'idle') { if (!P.stack.length && g.dur - g.t > 0.25) g.t = g.dur - 0.25; // 다 쳤으면 곧 고개를 든다 (빨리 칠수록 판이 빨리 돈다)
      if (g.t >= g.dur) { g.ph = 'tell'; g.t = 0; g.dur = TELL1; g.who = (g.who + 1 + Math.floor(rng() * 2)) % 3; } }
    else if (g.ph === 'tell' && g.t >= g.dur) { g.ph = 'watch'; g.t = 0; g.dur = between(1.0, 1.7);
      if (P.stack.length) { P.drop += P.stack.length; P.combo = 0; P.cut = 1.4; P.stack = []; S.drop(); } } // 말이 끊겼다
    E.staff.forEach((s, i) => { const on = i === g.who && g.ph !== 'idle'; s.phase = on ? g.ph : 'stand'; s.t = on ? g.t : 0; s.dur = on ? g.dur : 1; });
    for (const l of lanesPressed(taps, B.zones)) {
      if (g.ph === 'watch') { expose(); if (E.caught) return; continue; }
      const cur = P.stack[0]; if (!cur) continue;
      if (cur.lane === l) { P.stack.shift(); P.hit++; P.combo++; P.slide = 1; P.fx.push({ k: 'hit', lane: l, t: 0 }); P.said.push(cur.w); P.saidT = 0; S.hit(l, P.combo); G.hints.iv = true; }
      else { P.miss++; P.combo = 0; P.shake = 0.2; P.fx.push({ k: 'bad', lane: l, t: 0 }); S.bad(); }
    }
    P.slide = Math.max(0, P.slide - dt / 0.07); P.shake = Math.max(0, P.shake - dt); P.saidT += dt; P.cut = Math.max(0, P.cut - dt);
    P.fx = P.fx.filter(f => (f.t += dt) < 0.5);
  }

  // ---- 2페이즈: 리듬 면접 ----
  function newP2() {
    const secs = [{ bpm: 96, bars: 8, win: [[5, 1]] }, { bpm: 120, bars: 12, win: [[2, 1], [6, 1], [9, 2]] }, { bpm: 144, bars: 14, win: [[1, 1], [4, 2], [8, 1], [11, 2]] }];
    const beats = [], notes = [], wins = [], barStart = []; let t = 0, abs = 0;
    for (let k = 0; k < 4; k++) { beats.push({ t, sec: -1, bar: -1, k, bpm: 96, abs: -1 }); t += 60 / 96; } // 한 마디 세기
    secs.forEach((Sx, si) => { barStart[si] = []; const bl = 60 / Sx.bpm; for (let bar = 0; bar < Sx.bars; bar++) { barStart[si][bar] = t; for (let k = 0; k < 4; k++) { beats.push({ t, sec: si, bar, k, bpm: Sx.bpm, abs }); t += bl; } abs++; } barStart[si][Sx.bars] = t; });
    const end = t;
    let last = [-1, -1]; const lane = () => { for (let n = 0; n < 9; n++) { const v = Math.floor(rng() * 3); if (!(v === last[0] && v === last[1])) { last = [v, last[0]]; return v; } } last = [(last[0] + 1) % 3, last[0]]; return last[0]; };
    const add = tt => notes.push({ t: tt, lane: lane(), red: false, hit: false, gone: false });
    for (const b of beats) { if (b.sec < 0) continue; const bl = 60 / b.bpm, lastBar = b.bar === secs[b.sec].bars - 1, r = rng();
      if (lastBar && b.k === 3) continue; // 구간 끝 마디의 마지막 박은 쉰다 (빨라지기 전 숨)
      if (b.sec === 0) { if (r < 0.88) add(b.t); if (b.k === 2 && rng() < 0.3) add(b.t + bl / 2); }
      else if (b.sec === 1) { if (r < 0.58) add(b.t); else if (r < 0.88) { add(b.t); add(b.t + bl / 2); } }
      else { if (r < 0.75) add(b.t); if (rng() < 0.66) add(b.t + bl / 2); } }
    secs.forEach((Sx, si) => Sx.win.forEach(([bar, len]) => wins.push({ t0: barStart[si][bar], t1: barStart[si][Math.min(Sx.bars, bar + len)], who: Math.floor(rng() * 3), tell: 60 / Sx.bpm })));
    for (const n of notes) n.red = wins.some(w => n.t >= w.t0 - 1e-6 && n.t < w.t1 - 1e-6);
    return { t: 0, beats, notes, wins, end, sched: 0, hit: 0, miss: 0, off: 0, strikes: 0, seen: 0, combo: 0, best: 0, normal: notes.filter(n => !n.red).length, fx: [], lastBeat: -9, beatK: 0, sec: -1, bpm: 96, win: null, tellWin: null, secFlash: 0 };
  }
  function acc2(P, fin) { return P.hit / Math.max(1, (fin ? P.normal : P.hit + P.miss) + P.off); }
  function musicBeat(b, d) {
    const bl = 60 / b.bpm, on = CONFIG.sound.music;
    if (b.sec < 0) { toneAt(b.k === 0 ? 1760 : 1320, 0.03, 'square', 0.04, d); return; }
    if (!on) { toneAt(b.k === 0 ? 1500 : 1200, 0.02, 'square', 0.025, d); return; } // 음악을 꺼 두었으면 박자 소리만
    const ch = CH[b.abs % 4];
    if (b.sec >= 1 || b.k % 2 === 0) kickAt(d, b.sec === 2 ? 0.46 : 0.4);
    if (b.k % 2 === 1) snareAt(d);
    if (b.sec >= 1) hatAt(d + bl / 2); if (b.sec === 2) hatAt(d);
    toneAt(ch[0], bl * 0.42, 'sawtooth', 0.045, d); toneAt(ch[0] * (b.k % 2 ? 2 : 1), bl * 0.38, 'sawtooth', 0.035, d + bl / 2);
    if (b.k === 0) { [ch[1], ch[2], ch[1] * 2].forEach(f => toneAt(f, bl * 0.9, 'triangle', 0.03, d)); if (b.bar === 0) crashAt(d); }
  }
  function stepP2(dt, taps) {
    const B = E.B, P = B.p2, W = tune.ib2_window; P.t += dt;
    while (P.sched < P.beats.length && P.beats[P.sched].t <= P.t + 0.1) { const b = P.beats[P.sched++]; musicBeat(b, b.t - P.t); }
    for (const b of P.beats) { if (b.t > P.t) break; if (b.t > P.lastBeat) { P.lastBeat = b.t; P.beatK = b.k; if (b.sec !== P.sec) { P.sec = b.sec; if (b.sec > 0) P.secFlash = 1; } P.bpm = b.bpm; } }
    P.win = P.wins.find(w => P.t >= w.t0 && P.t < w.t1) || null; P.tellWin = P.win ? null : P.wins.find(w => P.t >= w.t0 - w.tell && P.t < w.t0) || null;
    E.staff.forEach((s, i) => { s.phase = P.win && P.win.who === i ? 'watch' : P.tellWin && P.tellWin.who === i ? 'tell' : 'stand'; });
    for (const n of P.notes) { if (n.hit || n.gone || n.t > P.t - W) continue; n.gone = true; if (!n.red) { P.miss++; P.combo = 0; P.fx.push({ k: 'miss', lane: n.lane, t: 0 }); } } // 판정선을 지나간 노트
    for (const l of lanesPressed(taps, B.zones)) {
      if (P.win) { expose(); if (E.caught) return; continue; } // 면접관이 보는 동안은 누르지 않는다
      let best = null; for (const n of P.notes) { if (n.lane !== l || n.hit || n.gone) continue; const d = Math.abs(n.t - P.t); if (d <= W && (!best || d < Math.abs(best.t - P.t))) best = n; if (n.t > P.t + W) break; }
      if (best && best.red) { best.gone = true; expose(); if (E.caught) return; continue; }
      if (best) { best.hit = true; P.hit++; P.combo++; P.best = Math.max(P.best, P.combo); P.fx.push({ k: 'hit', lane: l, t: 0 }); S.hit(l, 0); }
      else { P.off++; P.combo = 0; P.fx.push({ k: 'off', lane: l, t: 0 }); } // 박자에 안 맞았다
    }
    P.secFlash = Math.max(0, P.secFlash - dt * 2); P.fx = P.fx.filter(f => (f.t += dt) < 0.4); if (B.shieldT > 0) B.shieldT -= dt;
    if (P.t > P.end + 1.2) { crashAt(0, 0.09); endPhase(1, acc2(P, true), 1); }
  }

  // ---- 3페이즈: 질문 공방 ----
  function newP3() {
    const N = Math.round(tune.ib3_q), nTrap = Math.max(1, Math.round(N / 6)), pool = shuffle(IB_QA.slice()), traps = shuffle(IB_TRAP.slice()), trapAt = new Set();
    while (trapAt.size < nTrap) trapAt.add(3 + Math.floor(rng() * Math.max(1, N - 3)));
    const qs = []; let pi = 0, ti = 0, t = 0.4;
    for (let i = 0; i < N; i++) { const tr = trapAt.has(i), it = tr ? null : pool[pi++ % pool.length];
      qs.push({ id: i, trap: tr, tag: tr ? '' : it[0], q: tr ? traps[ti++ % traps.length] : it[1], a: tr ? '' : it[2], at: t, life: tune.ib3_life * lerp(1, 0.72, i / N) * (tr ? 0.7 : 1), who: Math.floor(rng() * 3), slot: -1, born: 0, scanned: false, st: 'wait', shake: 0 });
      t += i > 2 && rng() < 0.22 ? 0.3 : lerp(2.9, 1.35, i / N) * between(0.85, 1.15); }
    return { t: 0, intro: 4.8, qs, next: 0, tray: [], scanning: null, sel: null, done: 0, lapsed: 0, wrong: 0, strikes: 0, real: N - nTrap, fx: [], raise: [-9, -9, -9], said: null };
  }
  function liveQs(P) { return P.qs.filter(q => q.st === 'live'); }
  function strike3(P, why) { P.strikes++; E.B.flash = 0.5; S.lapse(); E.sus = cl(P.strikes / tune.ib_strikes, 0, 1); if (P.strikes >= tune.ib_strikes) endPhase(2, P.done / Math.max(1, P.real), 0, true); }
  function pair(P, chip, q) {
    P.sel = null;
    if (q.trap || chip.tag !== q.tag) { P.wrong++; q.shake = 0.35; chip.shake = 0.35; P.fx.push({ k: 'wrong', q: q.id, t: 0 }); strike3(P, 'wrong'); return; }
    P.done++; q.st = 'done'; P.tray = P.tray.filter(c => c !== chip); P.fx.push({ k: 'sent', q: q.id, x: chip.x + 58, y: chip.y, t: 0 }); P.said = { text: chip.a, t: 0 }; S.sent();
  }
  function stepP3(dt, taps) {
    const B = E.B, P = B.p3; P.t += dt; const T = P.t - P.intro;
    if (T < 0) return; // 발표 중
    while (P.next < P.qs.length && P.qs[P.next].at <= T) { const q = P.qs[P.next], used = new Set(liveQs(P).map(x => x.slot)), free = SLOTS.map((_, i) => i).filter(i => !used.has(i));
      if (!free.length) { q.at = T + 0.3; break; }
      q.slot = free[Math.floor(rng() * free.length)]; q.st = 'live'; q.born = T; P.raise[q.who] = P.t; P.next++; S.pop(); }
    if (!P.scanning) { const nq = liveQs(P).find(q => !q.scanned && (q.trap || P.tray.length < 5)); if (nq) P.scanning = { q: nq, t: 0 }; } // 안경은 한 번에 한 질문만 읽는다
    if (P.scanning) { const s = P.scanning; s.t += dt; if (s.q.st !== 'live') P.scanning = null; else if (s.t >= tune.ib3_scan) { s.q.scanned = true; if (!s.q.trap) P.tray.push({ id: s.q.id, tag: s.q.tag, a: s.q.a, born: P.t, x: null, y: 318, shake: 0 }); S.read(); P.scanning = null; } }
    for (const q of liveQs(P)) { q.shake = Math.max(0, q.shake - dt); if (T - q.born >= q.life) { q.st = 'gone'; if (P.sel && P.sel.id === q.id && P.sel.kind === 'q') P.sel = null;
      if (!q.trap) { P.lapsed++; P.tray = P.tray.filter(c => c.id !== q.id); P.fx.push({ k: 'lapse', q: q.id, t: 0 }); strike3(P, 'lapse'); if (E.over) return; } } }
    for (const c of P.tray) c.shake = Math.max(0, c.shake - dt);
    for (const [x, y] of taps) { const h = (B.hits || []).find(r => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h); if (!h) continue;
      if (h.kind === 'a') { const chip = P.tray.find(c => c.id === h.id); if (!chip) continue;
        if (P.sel && P.sel.kind === 'q') { const q = P.qs[P.sel.id]; if (q && q.st === 'live') { pair(P, chip, q); if (E.over) return; continue; } }
        P.sel = P.sel && P.sel.kind === 'a' && P.sel.id === chip.id ? null : { kind: 'a', id: chip.id }; S.pick(); }
      else { const q = P.qs[h.id]; if (!q || q.st !== 'live') continue;
        if (P.sel && P.sel.kind === 'a') { const chip = P.tray.find(c => c.id === P.sel.id); if (chip) { pair(P, chip, q); if (E.over) return; continue; } }
        P.sel = P.sel && P.sel.kind === 'q' && P.sel.id === q.id ? null : { kind: 'q', id: q.id }; S.pick(); } }
    if (P.said) { P.said.t += dt; if (P.said.t > 1.6) P.said = null; }
    P.fx = P.fx.filter(f => (f.t += dt) < 0.6);
    if (P.next >= P.qs.length && !liveQs(P).length) endPhase(2, P.done / Math.max(1, P.real), 1);
  }

  // ---- 페이즈 끝 · 전환 ----
  function endPhase(ph, score, left, lost) {
    const B = E.B; if (B.res[ph]) return;
    const need = [tune.ib1_acc, tune.ib2_pass, 0][ph], ok = !lost && (ph === 2 ? B.p3.strikes < tune.ib_strikes : score >= need - 1e-9);
    B.res[ph] = { score, ok }; E.done.push(...(ok ? (score >= 0.95 ? [{ r: 'O' }, { r: 'O' }] : [{ r: 'O' }, { r: 'X', part: 0.5 }]) : [{ r: 'X' }, { r: 'X' }]));
    E.leftSum += cl(left || 0, 0, 1) * E.timeTotal / 3;
    events.push({ type: 'bossPhase', boss: 'ibank', ph, score: +score.toFixed(3), ok });
    if (!ok) { while (E.done.length < 6) E.done.push({ r: '-' }); E.forceFail = true; E.over = true; E.all = false; E.endT = -1.1; E.quiet = false; E.endLine = `${E.T.staff[0].name}: "여기까지 하죠."`; sfx.fail(); return; }
    if (ph === 0) { B.shield = score >= 0.95 ? 1 : 0; B.tr = { kind: 12, t: 0, dur: 3.6 }; B.p2 = newP2(); S.chair(); }
    else if (ph === 1) { B.tr = { kind: 23, t: 0, dur: 3.0 }; B.p3 = newP3(); }
    else { E.over = true; E.all = true; E.endT = -1.4; E.endLine = `${E.T.staff[0].name}: "…좋습니다. 다음 주에 연락드리죠."`; }
  }
  function stepTrans(dt) {
    const B = E.B, R = B.tr, t0 = R.t; R.t += dt; const at = s => t0 < s && R.t >= s;
    if (R.kind === 12) { E.staff.forEach(s => { s.phase = 'stand'; }); E.quiet = R.t > 0.9;
      if (at(0.95)) S.thunk(); if (at(1.25)) S.power(); if (at(2.9)) { kickAt(0, 0.5); crashAt(0, 0.05); } }
    else { E.staff.forEach(s => { s.phase = 'stand'; }); if (at(0.05)) crashAt(0, 0.1); if (at(0.5)) S.chair(); }
    if (R.t >= R.dur) { B.tr = null; B.ph = R.kind === 12 ? 1 : 2; E.quiet = true; }
  }
  function step(dt, taps) {
    const B = E.B; if (!B) return false;
    B.flash = Math.max(0, B.flash - dt);
    if (E.start > 0) { E.start -= dt; return true; }
    if (B.tr) { stepTrans(dt); return true; }
    if (B.ph === 0) stepP1(dt, taps); else if (B.ph === 1) stepP2(dt, taps); else stepP3(dt, taps);
    return true;
  }

  // ---- 면접관 자세: 2페이즈는 박자에 고개를 끄덕이고, 3페이즈는 서 있는 나를 본다 ----
  function nod(P) { return P ? Math.exp(-Math.max(0, P.t - P.lastBeat) * 7) : 0; }
  function place(s, i, E, p) {
    const B = E.B; if (!B || !s.fixed) return p;
    const at = (x, z) => Math.atan2(x - p.x, z - p.z);
    if (B.tr && B.tr.kind === 12 && i === 0) { const t = B.tr.t, up = ez(cl(t / 0.55, 0, 1)) * (1 - ez(cl((t - 2.5) / 0.5, 0, 1))); return Object.assign({}, p, { sit: 1 - up, seated: up < 0.5, yaw: at(0, 0.9), headPitch: 0.05 }); }
    if (B.ph === 1 || (B.tr && B.tr.kind === 23)) { const P = B.p2, k = nod(P); return Object.assign({}, p, { yaw: at(0, 0.9), headPitch: s.phase === 'watch' ? -0.02 : s.phase === 'tell' ? 0.05 : 0.06 + k * 0.22 }); }
    if (B.ph === 2) { const P = B.p3; const ask = !!P && P.t - P.raise[i] < 0.7; return Object.assign({}, p, { yaw: at(-0.55, 1.38) + (ask ? Math.sin((P.t - P.raise[i]) * 18) * 0.06 : 0), headPitch: ask ? -0.2 : -0.12 }); } // 묻는 사람은 고개를 들썩인다
    return p;
  }

  // ---- 3D: 카메라 · 나 · 시세판 · 발표 화면 ----
  const W3 = { sc: null };
  const FP = { yaw: -0.12, pitch: -0.07, fov: 62 }, P2C = { p: [2.1, 0.95, 0.85], t: [-0.4, 1.06, -0.9], fov: 58 }, P3C = { p: [0.3, 1.84, -2.14], t: [-0.25, 1.22, 1.3], fov: 54 };
  const TICK = ['MSFT ▲0.92', 'NVDA ▲4.82', 'GS ▼1.05', 'JPM ▲0.37', 'TSLA ▼3.10', 'AAPL ▲1.24', 'MS ▲1.47', 'BAC ▲0.18', 'XOM ▲0.81', 'META ▼0.64', 'AMZN ▲2.11', 'KO ▼0.22', 'C ▲0.55', 'WFC ▼0.41'];
  function tickerTex(Ax, seed) {
    const t = Ax.canvasTex(1024, 64, false), g = t.g; g.fillStyle = '#020406'; g.fillRect(0, 0, 1024, 64);
    g.font = `700 40px "SF Mono","Menlo","Consolas","DejaVu Sans Mono",monospace`; g.textBaseline = 'middle'; let x = 10, i = seed;
    while (x < 1024) { const s = TICK[i++ % TICK.length], up = s.includes('▲'); g.fillStyle = up ? '#3dff8a' : '#ff4a5a'; g.fillText(s, x, 34); x += g.measureText(s).width + 44; }
    t.t.wrapS = Ax.THREE.RepeatWrapping; t.t.needsUpdate = true; return t;
  }
  function slideTex(g, n) { // 발표 화면: 표지 → 그래프 → 숫자 하나 → 질의응답
    const F = typeof FONT_BODY !== 'undefined' ? FONT_BODY : 'sans-serif';
    g.fillStyle = '#0c1730'; g.fillRect(0, 0, 512, 288); g.fillStyle = '#e8eef8'; g.textBaseline = 'middle';
    if (n === 0) { g.fillStyle = '#3a7bff'; g.fillRect(40, 120, 6, 52); g.fillStyle = '#e8eef8'; g.font = `800 34px ${F}`; g.fillText('PROJECT HARBOR', 60, 132); g.font = `600 20px ${F}`; g.fillStyle = '#a8b8d8'; g.fillText('물류 통합 인수 제안', 62, 164); }
    else if (n === 1) { g.font = `700 20px ${F}`; g.fillText('EBITDA 전망 (억 원)', 40, 40); [180, 230, 290, 350, 420].forEach((v, i) => { g.fillStyle = i === 4 ? '#3dff8a' : '#3a7bff'; g.fillRect(70 + i * 82, 250 - v * 0.45, 50, v * 0.45); }); g.fillStyle = '#a8b8d8'; g.font = `600 16px ${F}`; g.fillText('+18% / 년', 380, 70); }
    else if (n === 2) { g.font = `800 72px ${F}`; g.fillText('IRR 24%', 90, 130); g.font = `600 20px ${F}`; g.fillStyle = '#a8b8d8'; g.fillText('5년 회수 · 상장 또는 매각', 96, 196); }
    else { g.font = `800 64px ${F}`; g.fillText('Q & A', 160, 130); g.font = `600 18px ${F}`; g.fillStyle = '#a8b8d8'; g.fillText('감사합니다', 206, 190); }
  }
  function build(Ax) {
    const { THREE, EX } = Ax, sc = EX.scene; W3.sc = sc; W3.lights = []; sc.traverse(o => { if (o.isLight) W3.lights.push([o, o.intensity]); });
    const me = Ax.makeHuman({ top: 0x262c40, sleeve: 0x262c40, leg: 0x1c1f2a, shirt: 0xf2f2ee, tie: 0x8a2a2a, hair: 'spiky', hairC: 0x1f1a1c, skin: 0xd9a57c });
    me.cone.visible = false; sc.add(me.root); me.root.visible = false; W3.me = me; me.yaw = Math.PI;
    W3.lens = []; for (const sx of [-1, 1]) { Ax.bx(me.head, 0.075, 0.05, 0.012, 0x15151a, sx * 0.05, 0.02, 0.112); const m = Ax.glowMat(0x7fe9ff); Ax.bx(me.head, 0.062, 0.036, 0.006, 0, sx * 0.05, 0.02, 0.12, m); W3.lens.push(m); }
    const chair = Ax.pivot(sc, 0, 0, 0.98); Ax.bx(chair, 0.46, 0.06, 0.44, 0x2a1a12, 0, 0.46, 0); Ax.bx(chair, 0.44, 0.62, 0.06, 0x2a1a12, 0, 0.8, 0.22); for (const [x, z] of [[-0.19, -0.18], [0.19, -0.18], [-0.19, 0.18], [0.19, 0.18]]) Ax.bx(chair, 0.04, 0.44, 0.04, 0x15100c, x, 0.22, z);
    W3.rows = [];
    const rowAt = (x, y, z, len, ry, i) => { const tt = tickerTex(Ax, i * 5), tex = tt.t; tex.repeat.set(len / 4.2, 1); const m = new THREE.MeshBasicMaterial({ map: tex, fog: false, color: 0x000000 });
      const mesh = Ax.plane(sc, len, 0.2, m, x, y, z, 0, ry); mesh.visible = false; W3.rows.push({ mesh, m, tex, sp: (0.04 + (i % 4) * 0.012) * (i % 2 ? -1 : 1), y }); };
    for (let i = 0; i < 8; i++) rowAt(0, 2.62 - i * 0.23, -2.33, 5.1, 0, i);
    for (let i = 0; i < 8; i++) rowAt(-2.53, 2.62 - i * 0.23, -0.05, 4.5, Math.PI / 2, i + 8);
    W3.tl = new THREE.PointLight(0x40ff90, 0, 6, 1.6); W3.tl.position.set(-1.4, 2.0, -1.6); sc.add(W3.tl);
    W3.key = new THREE.PointLight(0xbfd8ff, 0, 7, 1.4); W3.key.position.set(1.6, 2.3, 0.4); sc.add(W3.key); // 2·3페이즈 인물 조명
    const front = Ax.pivot(sc, 0, 0, 0); Ax.bx(front, 5.2, 2.8, 0.1, 0x2a3040, 0, 1.4, 2.25); Ax.bx(front, 5.2, 0.9, 0.06, 0x1a2030, 0, 0.45, 2.19); front.visible = false; W3.front = front;
    W3.slide = Ax.canvasTex(512, 288, true); W3.slideN = -1; const sm = new THREE.MeshBasicMaterial({ map: W3.slide.t, fog: false });
    W3.screen = Ax.plane(sc, 2.1, 1.18, sm, 0.42, 1.72, 2.17, 0, Math.PI); W3.screen.visible = false;
    W3.sl = new THREE.PointLight(0x8fb8ff, 0, 5, 1.5); W3.sl.position.set(0.3, 1.8, 1.7); sc.add(W3.sl);
    W3.v = new THREE.Vector3(); W3.camT = new THREE.Vector3();
  }
  function camPose(B, now) {
    const fpT = [Math.sin(-FP.yaw) * 2, 1.17 + Math.sin(FP.pitch) * 2, 0.9 - Math.cos(FP.yaw) * 2], fp = { p: [0, 1.17, 0.9], t: fpT, fov: FP.fov };
    const mix = (a, b, k, bump) => ({ p: a.p.map((v, i) => lerp(v, b.p[i], k) + (i === 1 && bump ? Math.sin(k * Math.PI) * bump : 0)), t: a.t.map((v, i) => lerp(v, b.t[i], k)), fov: lerp(a.fov, b.fov, k) });
    if (B.tr && B.tr.kind === 12) return mix(fp, P2C, ez(cl((B.tr.t - 1.35) / 1.7, 0, 1)), 0.12);
    if (B.tr && B.tr.kind === 23) { const k = ez(cl((B.tr.t - 0.35) / 2.4, 0, 1)), c = [2.1, 2.0, -1.55], q = (a, m, b) => (1 - k) * (1 - k) * a + 2 * (1 - k) * k * m + k * k * b;
      return { p: P2C.p.map((v, i) => q(v, c[i], P3C.p[i])), t: P2C.t.map((v, i) => lerp(v, P3C.t[i], k)), fov: lerp(P2C.fov, P3C.fov, k) }; }
    if (B.ph === 1) { const k = nod(B.p2); return { p: [P2C.p[0] + Math.sin(now * 0.4) * 0.03, P2C.p[1] + Math.sin(now * 0.7) * 0.01, P2C.p[2]], t: P2C.t, fov: P2C.fov - k * 0.9 }; }
    if (B.ph === 2) { const P = B.p3, k = P ? ez(cl(P.t / P.intro, 0, 1)) : 1; return { p: [P3C.p[0], P3C.p[1], P3C.p[2] + (1 - k) * -0.25], t: P3C.t, fov: P3C.fov + (1 - k) * 4 }; }
    return fp;
  }
  function world(E, now, Ax) {
    const B = E.B, { THREE, EX } = Ax; if (!B || !EX.scene || !EX.cam) return;
    if (W3.sc !== EX.scene) build(Ax);
    const cam = EX.cam, pose = camPose(B, now), col = ink(E), stage = B.tr ? (B.tr.kind === 12 ? 1 : 2) : B.ph;
    cam.position.set(pose.p[0], pose.p[1], pose.p[2]); W3.camT.set(pose.t[0], pose.t[1], pose.t[2]); cam.up.set(0, 1, 0); cam.lookAt(W3.camT);
    if (Math.abs(cam.fov - pose.fov) > 0.01) { cam.fov = pose.fov; cam.updateProjectionMatrix(); }
    const away = Math.hypot(pose.p[0], pose.p[1] - 1.17, pose.p[2] - 0.9);
    // 나: 1인칭을 벗어나면 보인다. 3페이즈는 일어나 발표 화면 앞으로
    const me = W3.me; me.root.visible = away > 0.35; W3.lens.forEach(m => m.color.set(col));
    if (me.root.visible) {
      let x = 0, z = 0.92, sit = 1, moving = false, yaw = Math.PI, raise = false, hp = 0.05;
      if (B.tr && B.tr.kind === 23) { const t = B.tr.t, up = cl((t - 0.45) / 0.45, 0, 1), w = cl((t - 0.9) / 1.4, 0, 1); sit = 1 - up; x = lerp(0, -0.55, ez(w)); z = lerp(0.92, 1.38, ez(w)); moving = w > 0 && w < 1; yaw = moving ? Math.atan2(-0.55, 0.46) : Math.PI; }
      else if (B.ph === 2) { sit = 0; x = -0.55; z = 1.38; yaw = Math.atan2(0 - x, -0.95 - z); const P = B.p3; raise = !!P && P.t > 0.3 && P.t < P.intro - 0.6 && Math.floor(P.t / 1.4) % 2 === 0; hp = -0.05; }
      else if (B.ph === 1) hp = 0.04 + nod(B.p2) * 0.12;
      Ax.poseModel(me, { x, y: 0, z, yaw, sit, now, phase: 'stand', headPitch: hp, moving, walk: now, raise });
    }
    // 시세판: 1→2 전환에서 위에서부터 줄줄이 켜지고, 박자마다 깜빡인다. 2→3 전환에서 아래부터 꺼진다
    const P2 = B.p2, pulse = P2 ? nod(P2) : 0;
    W3.rows.forEach((r, i) => { const j = i % 8; let on = 0;
      if (B.tr && B.tr.kind === 12) on = B.tr.t > 1.25 + j * 0.09 ? 1 : 0; else if (B.tr && B.tr.kind === 23) on = B.tr.t < 0.55 - (7 - j) * 0.06 ? 1 : 0; else if (B.ph === 1) on = 1; // 전환 중에는 페이즈 번호가 아직 앞 페이즈다
      r.mesh.visible = on > 0; if (!on) return; r.tex.offset.x = (r.tex.offset.x + r.sp * 0.016) % 1;
      const fl = (B.tr && B.tr.kind === 12 && B.tr.t < 1.45 + j * 0.09) ? (Math.floor(now * 30) % 2 ? 0.4 : 1) : 1; r.m.color.setScalar(fl * (0.62 + 0.3 * pulse + 0.5 * (P2 ? P2.secFlash : 0))); });
    W3.tl.intensity = stage === 1 ? 1.8 + 2.4 * pulse : 0;
    const dim = B.tr && B.tr.kind === 12 ? lerp(1, 0.6, ez(cl((B.tr.t - 0.9) / 0.5, 0, 1))) : B.tr && B.tr.kind === 23 ? lerp(0.6, 1, ez(cl(B.tr.t / 1.2, 0, 1))) : B.ph === 1 ? 0.6 : 1;
    W3.key.intensity = stage === 1 ? 2.2 : stage === 2 ? 2.6 : 0; if (stage === 2) W3.key.position.set(-0.4, 2.4, 0.4); else W3.key.position.set(1.6, 2.3, 0.4);
    W3.lights.forEach(([l, v]) => { l.intensity = v * dim; });
    const showFront = B.ph === 2 || (B.tr && B.tr.kind === 23 && B.tr.t > 0.4); W3.front.visible = W3.screen.visible = !!showFront;
    if (showFront) { const P = B.p3, n = !P || P.t >= P.intro - 0.5 ? 3 : Math.min(2, Math.floor(P.t / 1.5)); if (n !== W3.slideN) { W3.slideN = n; slideTex(W3.slide.g, n); W3.slide.t.needsUpdate = true; }
      const drop = B.tr && B.tr.kind === 23 ? 1 - ez(cl((B.tr.t - 0.6) / 1.4, 0, 1)) : 0; W3.screen.position.y = 1.72 + drop * 1.4; W3.sl.intensity = 1.4 * (1 - drop); } else W3.sl.intensity = 0;
    if (stage > 0) EX.staff.forEach(m => { if (m && m.cone) m.cone.visible = false; });
    if (EX.chairs) EX.chairs.forEach(ch => { const lo = B.ph === 2 || (B.tr && B.tr.kind === 23 && B.tr.t > 1.2) ? 0.42 : 1; ch.scale.y = 0.9 * lo; ch.position.y = 0.45 + 0.45 * lo; }); // 3페이즈: 등 뒤에서 머리가 보이게 등받이를 낮춘다
    // 면접관 머리(와 3페이즈의 내 머리)가 화면에서 있는 자리: 렌즈 화면이 표적을 그린다
    cam.updateMatrixWorld(); EX.scene.updateMatrixWorld();
    const pr = (o, h) => { o.getWorldPosition(W3.v); W3.v.y += h || 0; const d = W3.v.distanceTo(cam.position); W3.v.project(cam); return W3.v.z > 1 ? null : { x: (W3.v.x + 1) / 2 * 640, y: (1 - W3.v.y) / 2 * 360, s: 0.16 / Math.max(0.2, d) / Math.tan(cam.fov * Math.PI / 360) * 180 }; };
    B.heads = EX.staff.map(m => m && m.head && m.root.visible ? pr(m.head, 0.02) : null); B.meHead = me.root.visible ? pr(me.head, 0.02) : null;
  }

  // ---- 렌즈 화면 ----
  function brk(c, x, y, w, h, l, col, lw = 1) { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); for (const [cx, cy, dx, dy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]]) { c.moveTo(cx + dx * l, cy); c.lineTo(cx, cy); c.lineTo(cx, cy + dy * l); } c.stroke(); }
  function dia(c, x, y, r, fill, stroke) { c.beginPath(); c.moveTo(x, y - r); c.lineTo(x + r, y); c.lineTo(x, y + r); c.lineTo(x - r, y); c.closePath(); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = 1; c.stroke(); } }
  function head(k, E, ph, col) { // 왼쪽 위: 어느 페이즈인지 (세 칸 중 지금 칸만 밝게) + 이름
    const c = k.b, x = 24, y = 22;
    hudDraw(k, c => { const g = c.createRadialGradient(70, 50, 10, 70, 50, 150); g.addColorStop(0, 'rgba(2,6,10,0.55)'); g.addColorStop(1, 'rgba(2,6,10,0)'); c.fillStyle = g; c.fillRect(0, 0, 230, 140);
      const g2 = c.createRadialGradient(590, 40, 8, 590, 40, 110); g2.addColorStop(0, 'rgba(2,6,10,0.5)'); g2.addColorStop(1, 'rgba(2,6,10,0)'); c.fillStyle = g2; c.fillRect(470, 0, 170, 110); }); k.M('IV-ASSIST', x, y, 7, rgba(col, 0.85), 'left', 700);
    for (let i = 0; i < 3; i++) { c.fillStyle = i === ph ? col : i < ph ? rgba(col, 0.45) : 'rgba(255,255,255,0.18)'; c.fillRect(x + 54 + i * 15, y - 1.5, 12, 3); }
    k.T(NAMES[ph], x, y + 13, 10, WH, 'left', 800);
  }
  function strikesUi(k, n, x, y, col, lab) { const c = k.b; k.M(lab, x - 38, y, 7, rgba(col, 0.85), 'right', 700); for (let i = 0; i < tune.ib_strikes; i++) dia(c, x - 28 + i * 12, y, 3.6, i < n ? RED : null, i < n ? RED : 'rgba(255,255,255,0.55)'); }
  function meter(k, x, y, w, v, need, col, lab) { const c = k.b, none = v == null; if (none) v = 1; const ok = v >= need;
    k.M(lab, x, y, 7, rgba(col, 0.85), 'left', 700);
    const big = none ? '--.-' : (v * 100).toFixed(1); const tw = k.M(big, x, y + 17, 18, ok ? WH : '#ffb0a8', 'left', 700); k.M('%', x + tw + 2, y + 20, 9, rgba(WH, 0.8), 'left', 700);
    c.fillStyle = 'rgba(255,255,255,0.22)'; c.fillRect(x, y + 32, w, 1.5); c.fillStyle = ok ? col : RED; c.fillRect(x, y + 32, w * cl(v, 0, 1), 1.5);
    const nx = x + w * need; c.fillStyle = WH; c.fillRect(nx - 0.5, y + 28, 1, 9); k.M(String(Math.round(need * 100)), nx, y + 43, 6.5, rgba(WH, 0.75), 'center', 700); }
  function glow(k, E, now) { const B = E.B, P = B.ph === 0 ? B.p1 : B.ph === 1 ? B.p2 : B.p3, n = P ? P.strikes : 0, a = 0.05 + n / tune.ib_strikes * 0.55 + B.flash * 1.2; if (a > 0.02 && typeof lensGlow === 'function') { k.b.globalAlpha = Math.min(1, a); k.b.drawImage(lensGlow('A', RED), 0, 0); k.b.globalAlpha = 1; } }
  function eyesOn(k, E, now, col) { // 고개를 드는(노란) · 보는(빨간) 면접관의 얼굴에 표적
    const B = E.B, c = k.b;
    E.staff.forEach((s, i) => { const h = B.heads[i]; if (!h || (s.phase !== 'tell' && s.phase !== 'watch')) return;
      const w = s.phase === 'watch', r = Math.max(14, h.s * 1.25) * (w ? 1 : 1 + 0.5 * (1 - cl((s.t || 0) / (s.dur || 0.5), 0, 1))), cc = w ? RED : AMB;
      brk(c, h.x - r, h.y - r, r * 2, r * 2, 6, cc, 1.4); if (w) { c.strokeStyle = rgba(RED, 0.35); c.lineWidth = 1; c.beginPath(); c.moveTo(h.x - r - 6, h.y); c.lineTo(h.x - r + 2, h.y); c.moveTo(h.x + r - 2, h.y); c.lineTo(h.x + r + 6, h.y); c.stroke(); }
      k.M(w ? 'EYES ON' : 'TURNING', h.x, h.y - r - 7, 6.5, cc, 'center', 700); });
  }
  function hudP1(k, L, E, now, col) { // 프롬프터: 안경이 눈앞에 띄운 대본 한 줄. 맨 왼쪽(커서) 블록부터 친다
    const B = E.B, P = B.p1, c = k.b, g = P.gz, watched = g.ph === 'watch', live = E.start <= 0 && !E.over && !E.caught, tch = !!STATE.touchUI;
    const X0 = 70, X1 = 570, Y = 244, CH = 24, CX = X0 + 26, lc = watched ? RED : col;
    B.zones = [{ i: 0, x0: 0, x1: 640 / 3, y0: 0, y1: 360 }, { i: 1, x0: 640 / 3, x1: 1280 / 3, y0: 0, y1: 360 }, { i: 2, x0: 1280 / 3, x1: 640, y0: 0, y1: 360 }];
    head(k, E, 0, col); meter(k, 24, 52, 118, P.hit + P.miss + P.drop + P.seen ? acc1(P) : null, tune.ib1_acc, col, 'ACC');
    k.M(`LINE ${String(Math.max(1, P.si + 1)).padStart(2, '0')}/${P.NS}`, 24, 106, 7.5, rgba(WH, 0.85), 'left', 700); if (P.drop) k.M(`CUT ${P.drop}`, 92, 106, 7.5, AMB, 'left', 700);
    if (P.combo >= 10) k.M(`×${P.combo}`, 616, 28, 15, WH, 'right', 700);
    strikesUi(k, P.strikes, 616, 48, col, 'EXPOSED');
    const chips = []; let x = CX + (P.shake > 0 ? Math.sin(now * 90) * 3 * (P.shake / 0.2) : 0);
    for (let i = 0; i < P.stack.length; i++) { const w = Math.max(30, k.TW(P.stack[i].w, 9, 700) + 14); if (i === 0) x += P.slide * 14; if (x + w > X1 - 6) break; chips.push({ b: P.stack[i], x, w, i }); x += w + 5; }
    hudDraw(k, c => {
      c.fillStyle = watched ? 'rgba(30,4,8,0.5)' : 'rgba(3,8,12,0.5)'; c.fillRect(X0, Y - 18, X1 - X0, CH + 24); brk(c, X0 - 4, Y - 22, X1 - X0 + 8, CH + 32, 8, rgba(lc, 0.9), 1.2);
      c.fillStyle = rgba(lc, 0.9); c.fillRect(X0 + 12, Y - 14, 1.5, CH + 16); // 커서
      const hf = P.fx.find(f => f.k === 'hit' && f.t < 0.14); if (hf) { c.fillStyle = rgba(WH, 0.45 * (1 - hf.t / 0.14)); c.fillRect(X0 + 4, Y - 16, 60, CH + 20); }
      for (const ch of chips) { const cur = ch.i === 0, a = cur ? 1 : Math.max(0.35, 0.9 - ch.i * 0.07); c.globalAlpha = a;
        c.fillStyle = rgba(col, cur ? 0.3 : 0.12); c.fillRect(ch.x, Y, ch.w, CH); c.strokeStyle = cur ? WH : rgba(col, 0.8); c.lineWidth = cur ? 1.4 : 0.9; c.strokeRect(ch.x + 0.5, Y + 0.5, ch.w - 1, CH - 1);
        for (let l = 0; l < 3; l++) { const dx = ch.x + ch.w / 2 - 14 + l * 10; if (l === ch.b.lane) { c.fillStyle = cur ? WH : col; c.fillRect(dx, Y - 11, 8, 6); } else { c.strokeStyle = 'rgba(255,255,255,0.4)'; c.lineWidth = 0.8; c.strokeRect(dx + 0.5, Y - 10.5, 7, 5); } } // 어느 칸인가: 왼쪽 · 가운데 · 오른쪽
        c.globalAlpha = 1; }
      if (!watched && P.si >= 0) { const left = g.ph === 'tell' ? g.dur - g.t : g.dur - g.t + TELL1, kx = cl(left / P.gap, 0, 1); // 고개를 들 때까지 남은 시간
        c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(X0, Y + CH + 12, X1 - X0, 2); c.fillStyle = g.ph === 'tell' ? (Math.floor(now * 12) % 2 ? RED : AMB) : col; c.fillRect(X0, Y + CH + 12, (X1 - X0) * kx, 2); }
      for (let i = 0; i < 3; i++) { const zx = 640 / 3 * i + 640 / 6, f = P.fx.find(f => f.lane === i && f.t < 0.16), cc = f && f.k === 'bad' ? RED : f ? WH : rgba(lc, 0.55); c.fillStyle = cc; c.fillRect(zx - 9, 336, 18, f ? 3 : 1.5); }
    });
    for (const ch of chips) { k.b.globalAlpha = ch.i === 0 ? 1 : Math.max(0.4, 0.9 - ch.i * 0.07); k.T(ch.b.w, ch.x + ch.w / 2, Y + CH / 2 + 0.5, 9, ch.i === 0 ? WH : rgba(WH, 0.9), 'center', 700); } k.b.globalAlpha = 1;
    if (!tch) for (let i = 0; i < 3; i++) k.M('ASD'[i], 640 / 3 * i + 640 / 6, 346, 7, rgba(WH, 0.55), 'center', 700);
    if (watched && live) k.M(P.si < 0 ? 'STANDBY' : 'LOCK · 손 떼기', (X0 + X1) / 2, Y + CH / 2 - 4, 9, RED, 'center', 700);
    else if (!P.stack.length && live && P.si >= 0) k.M('LINE CLEAR', (X0 + X1) / 2, Y + CH / 2 - 4, 9, col, 'center', 700);
    if (live) eyesOn(k, E, now, col);
    if (live && P.cut > 0) k.SUB('"어… 그러니까…"', L.W / 2, 204, 11, '#ffd0d0', 'center');
    else if (live && P.said.length && P.saidT < 1.6) k.SUB(P.said.slice(-7).join(' '), L.W / 2, 204, 11, '#ffffff', 'center');
  }
  function hudP2(k, L, E, now, col) {
    const B = E.B, P = B.p2, c = k.b, live = !E.over && !E.caught && !B.tr, VX = 320, VY = 64, J = 300, LX = [185, 275, 365, 455], D = 3.1, lead = cl(1.55 * 96 / P.bpm, 1.05, 1.6), tch = !!STATE.touchUI;
    B.zones = [{ i: 0, x0: 0, x1: 640 / 3, y0: 0, y1: 360 }, { i: 1, x0: 640 / 3, x1: 1280 / 3, y0: 0, y1: 360 }, { i: 2, x0: 1280 / 3, x1: 640, y0: 0, y1: 360 }];
    const yAt = z => VY + (J - VY) / (1 + Math.max(0, z) * D), xAt = (xj, y) => VX + (xj - VX) * (y - VY) / (J - VY), yTop = yAt(1), watched = !!P.win;
    head(k, E, 1, col); meter(k, 24, 52, 118, P.hit + P.miss + P.off ? acc2(P, false) : null, tune.ib2_pass, col, 'SYNC'); if (P.combo >= 8) k.M(`STREAK ${P.combo}`, 24, 106, 7.5, rgba(WH, 0.85), 'left', 700);
    k.M(`♩${P.bpm}`, 616, 28, 16, WH, 'right', 700);
    for (let i = 0; i < 3; i++) { c.fillStyle = i === P.sec ? col : i < P.sec ? rgba(col, 0.45) : 'rgba(255,255,255,0.2)'; c.fillRect(556 + i * 21, 42, 17, 2.5); }
    strikesUi(k, P.strikes, 616, 58, col, 'EXPOSED'); if (B.shield > 0 || B.shieldT > 0) k.M(B.shield > 0 ? 'GUARD ◆' : 'GUARD ◇', 616, 72, 7, B.shield > 0 ? col : AMB, 'right', 700);
    hudDraw(k, c => {
      const seg = (z0, z1, fill) => { const y0 = yAt(z1), y1 = yAt(z0); c.beginPath(); c.moveTo(xAt(LX[0], y0), y0); c.lineTo(xAt(LX[3], y0), y0); c.lineTo(xAt(LX[3], y1), y1); c.lineTo(xAt(LX[0], y1), y1); c.closePath(); c.fillStyle = fill; c.fill(); };
      seg(0, 1, 'rgba(3,8,12,0.22)');
      for (const w of P.wins) { const z0 = (w.t0 - P.t) / lead, z1 = (w.t1 - P.t) / lead; if (z1 < 0 || z0 > 1) continue; seg(Math.max(0, z0), Math.min(1, z1), rgba(RED, 0.13)); } // 면접관이 볼 구간: 빨간 띠가 내려온다
      for (const b of P.beats) { const z = (b.t - P.t) / lead; if (z < 0) continue; if (z > 1) break; const y = yAt(z); c.fillStyle = rgba(WH, b.k === 0 ? 0.28 : 0.1); c.fillRect(xAt(LX[0], y), y, xAt(LX[3], y) - xAt(LX[0], y), b.k === 0 ? 1.2 : 0.8); }
      for (let i = 0; i < 4; i++) { const g = c.createLinearGradient(0, yTop, 0, J); g.addColorStop(0, rgba(col, 0)); g.addColorStop(1, rgba(watched ? RED : col, i === 0 || i === 3 ? 0.75 : 0.35)); c.strokeStyle = g; c.lineWidth = i === 0 || i === 3 ? 1.2 : 0.8; c.beginPath(); c.moveTo(xAt(LX[i], yTop), yTop); c.lineTo(LX[i], J + 10); c.stroke(); }
      for (const n of P.notes) { const tau = n.t - P.t; if (tau > lead) break; if (n.hit || tau < -0.3) continue; if (n.gone && n.red) continue;
        const y = tau >= 0 ? yAt(tau / lead) : J + (-tau) * 140, f = (y - VY) / (J - VY), x0 = xAt(LX[n.lane], y), x1 = xAt(LX[n.lane + 1], y), w = (x1 - x0) * 0.82, h = 3 + 6 * f, x = (x0 + x1) / 2 - w / 2;
        c.globalAlpha = tau < 0 ? Math.max(0, 1 + tau / 0.3) * 0.5 : Math.min(1, 0.35 + f);
        if (n.red) { c.strokeStyle = RED; c.lineWidth = 1.2; c.strokeRect(x, y - h / 2, w, h); c.save(); c.beginPath(); c.rect(x, y - h / 2, w, h); c.clip(); c.strokeStyle = rgba(RED, 0.7); c.lineWidth = 1; c.beginPath(); for (let s = -h; s < w; s += 5) { c.moveTo(x + s, y + h / 2); c.lineTo(x + s + h, y - h / 2); } c.stroke(); c.restore(); }
        else { c.fillStyle = n.gone ? 'rgba(150,160,170,0.6)' : rgba(col, 0.85); c.fillRect(x, y - h / 2, w, h); c.fillStyle = WH; c.fillRect(x, y - h / 2, w, Math.max(1, h * 0.25)); }
        c.globalAlpha = 1; }
      for (let i = 0; i < 3; i++) { const x0 = LX[i] + 7, w = LX[i + 1] - LX[i] - 14, f = P.fx.filter(f => f.lane === i).pop(), hitF = f && f.k === 'hit' ? 1 - f.t / 0.25 : 0, bad = f && (f.k === 'miss' || f.k === 'off') && f.t < 0.25;
        const cc = bad ? RED : watched ? RED : hitF > 0 ? WH : col; brk(c, x0, J - 8, w, 16, 7, cc, 1.5);
        if (hitF > 0) { c.fillStyle = rgba(WH, 0.35 * hitF); c.fillRect(x0, J - 8, w, 16); const g = c.createLinearGradient(0, J - 120, 0, J); g.addColorStop(0, rgba(col, 0)); g.addColorStop(1, rgba(col, 0.4 * hitF)); c.fillStyle = g; c.fillRect(x0 + 4, J - 120, w - 8, 112); }
        if (bad) { c.strokeStyle = rgba(RED, 0.9); c.lineWidth = 1.4; c.beginPath(); c.moveTo(x0 + w / 2 - 4, J - 4); c.lineTo(x0 + w / 2 + 4, J + 4); c.moveTo(x0 + w / 2 + 4, J - 4); c.lineTo(x0 + w / 2 - 4, J + 4); c.stroke(); }
        if (tch) { c.fillStyle = rgba(cc, 0.6); c.beginPath(); c.arc(x0 + w / 2, J + 20, 2.2, 0, 7); c.fill(); } }
    });
    if (!tch) for (let i = 0; i < 3; i++) k.M('ASD'[i], (LX[i] + LX[i + 1]) / 2, J + 22, 7, rgba(WH, 0.6), 'center', 700);
    if (watched && live) k.M('EYES ON · HOLD', VX, J + 38, 7.5, RED, 'center', 700);
    if (live) eyesOn(k, E, now, col);
    if (P.t < 2.4 && live) k.M(['4', '3', '2', '1'][Math.min(3, Math.floor(P.t / 0.625))], VX, 150, 22, rgba(WH, 0.85), 'center', 700); // 한 마디 세기
  }
  function hudP3(k, L, E, now, col) {
    const B = E.B, P = B.p3, c = k.b, live = !E.over && !E.caught && !B.tr, T = P.t - P.intro, hits = []; B.hits = hits;
    head(k, E, 2, col); k.M(`ANSWERED ${String(P.done).padStart(2, '0')}/${P.real}`, 24, 54, 7.5, rgba(WH, 0.85), 'left', 700);
    strikesUi(k, P.strikes, 616, 28, col, 'MISSED');
    if (T < 0) { const s = SPEECH.find(([a, b]) => P.t >= a && P.t < b); if (s) k.SUB(s[2], L.W / 2, L.H - 30, 12, '#ffffff', 'center'); return; }
    const lq = liveQs(P), sel = P.sel;
    hudDraw(k, c => { // 질문: 묻는 면접관 머리까지 가는 가는 선 + 남은 시간 막대. 안경이 읽은 질문에만 꼬리표
      for (const q of lq) { const [sx, sy] = SLOTS[q.slot], hd = B.heads[q.who]; if (!hd) continue; c.strokeStyle = rgba(q.trap && q.scanned ? RED : col, 0.35); c.lineWidth = 0.8; c.setLineDash([2, 3]); c.beginPath(); c.moveTo(sx, sy + 14); c.lineTo(hd.x, hd.y - 8); c.stroke(); c.setLineDash([]); }
    });
    for (const q of lq) { const [sx, sy] = SLOTS[q.slot], age = T - q.born, pop = cl(age / 0.18, 0, 1), left = cl(1 - age / q.life, 0, 1), selQ = sel && sel.kind === 'q' && sel.id === q.id, scanning = P.scanning && P.scanning.q === q;
      const tw = k.TW(q.q, 9, 700), w = Math.max(116, tw + (q.scanned ? 52 : 22)), h = 28, x = sx - w / 2 + (q.shake > 0 ? Math.sin(now * 80) * 3 : 0), y = sy - h / 2, warn = left < 0.3, cc = q.trap && q.scanned ? RED : selQ ? WH : col;
      hudDraw(k, c => { c.globalAlpha = pop; c.fillStyle = q.trap && q.scanned ? 'rgba(40,6,10,0.78)' : 'rgba(4,10,16,0.8)'; c.fillRect(x, y, w, h); c.strokeStyle = rgba(cc, selQ ? 1 : 0.7); c.lineWidth = selQ ? 1.6 : 1; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
        if (selQ) brk(c, x - 4, y - 4, w + 8, h + 8, 6, WH, 1.2);
        c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(x + 1, y + h - 3, w - 2, 2); c.fillStyle = warn ? (Math.floor(now * 8) % 2 ? RED : AMB) : rgba(col, 0.9); c.fillRect(x + 1, y + h - 3, (w - 2) * left, 2);
        if (scanning) { const sx2 = x + (w - 2) * (P.scanning.t / tune.ib3_scan); c.fillStyle = rgba(col, 0.25); c.fillRect(x + 1, y + 1, sx2 - x, h - 4); c.fillStyle = col; c.fillRect(sx2, y + 1, 1.2, h - 4); }
        c.globalAlpha = 1; });
      k.b.globalAlpha = pop;
      if (q.scanned) { const tg = q.trap ? '✕' : q.tag, tw2 = Math.max(22, k.TW(tg, 7, 800) + 10); k.b.fillStyle = q.trap ? RED : col; k.b.fillRect(x + 6, y + 6, tw2, 13); k.M(tg, x + 6 + tw2 / 2, y + 12.5, 7, '#041018', 'center', 800); k.T(q.q, x + tw2 + 12, y + 12.5, 9, q.trap ? '#ffd0d0' : WH, 'left', 700); }
      else { k.T(q.q, x + 11, y + 12.5, 9, rgba(WH, 0.9), 'left', 700); if (scanning) k.M('SCAN', x + w - 6, y - 5, 6, col, 'right', 700); }
      k.b.globalAlpha = 1; hits.push({ kind: 'q', id: q.id, x: x - 4, y: y - 4, w: w + 8, h: h + 8 }); }
    const n = P.tray.length, cw = 114, gap = 6, x0 = L.W / 2 - (n * cw + (n - 1) * gap) / 2;
    P.tray.forEach((ch, i) => { const tx = x0 + i * (cw + gap); ch.x = ch.x == null ? tx : lerp(ch.x, tx, 0.3); const age = P.t - ch.born, pop = cl(age / 0.2, 0, 1), x = ch.x + (ch.shake > 0 ? Math.sin(now * 80) * 3 : 0), y = 312 + (1 - pop) * 14, selA = sel && sel.kind === 'a' && sel.id === ch.id;
      hudDraw(k, c => { c.globalAlpha = pop; c.fillStyle = selA ? rgba(col, 0.28) : 'rgba(4,10,16,0.82)'; c.fillRect(x, y, cw, 34); c.strokeStyle = selA ? WH : rgba(col, 0.8); c.lineWidth = selA ? 1.6 : 1; c.strokeRect(x + 0.5, y + 0.5, cw - 1, 33); if (selA) brk(c, x - 4, y - 4, cw + 8, 42, 6, WH, 1.2); c.globalAlpha = 1; });
      k.b.globalAlpha = pop; k.M(ch.tag, x + 7, y + 9, 7, col, 'left', 800); k.T(ch.a, x + 7, y + 23, 8, WH, 'left', 700); k.b.globalAlpha = 1;
      hits.push({ kind: 'a', id: ch.id, x: x - 3, y: y - 4, w: cw + 6, h: 44 }); });
    if (!n && live) k.M('AI · 질문을 읽는 중', L.W / 2, 330, 7.5, rgba(col, 0.7), 'center', 700);
    for (const f of P.fx) { if (f.k !== 'sent' || f.t > 0.35) continue; const q = P.qs[f.q], s = SLOTS[q.slot]; if (!s) continue; const k2 = cl(f.t / 0.2, 0, 1), a = 1 - f.t / 0.35; hudDraw(k, c => { c.strokeStyle = rgba(WH, a); c.lineWidth = 1.4; c.beginPath(); c.moveTo(f.x, f.y); c.lineTo(lerp(f.x, s[0], k2), lerp(f.y, s[1], k2)); c.stroke(); c.strokeStyle = rgba(col, a * 0.8); c.strokeRect(s[0] - 60 - f.t * 40, s[1] - 14 - f.t * 14, 120 + f.t * 80, 28 + f.t * 28); }); } // 답이 질문으로 날아가 꽂힌다
    if (P.said && live) k.SUB(P.said.text + '입니다.', L.W / 2, 290, 10, '#ffffff', 'center');
  }
  function hud(k, L, E, now, H) {
    const B = E.B; if (!B) return false; const col = ink(E), c = k.b;
    c.globalAlpha = 0.04; for (let y = 1; y < L.H; y += 3) k.R(0, y, L.W, 1, col); c.globalAlpha = 1; // 렌즈 결
    glow(k, E, now);
    if (B.tr) { const R = B.tr;
      if (R.kind === 12 && R.t > 0.25 && R.t < 2.4) k.SUB(`${E.T.staff[0].name}: "숫자로 얘기해 보죠."`, L.W / 2, L.H - 30, 12, '#ffffff', 'center');
      if (R.kind === 12 && R.t > 2.6) { c.globalAlpha = cl((R.t - 2.6) / 0.6, 0, 1); hudP2(k, L, E, now, col); c.globalAlpha = 1; }
      return true; }
    if (B.ph === 0) hudP1(k, L, E, now, col); else if (B.ph === 1) hudP2(k, L, E, now, col); else hudP3(k, L, E, now, col);
    return true;
  }
  return { start, step, hud, world, place, newP2, newP3, endPhase, liveQs, IB_QA };
})();
