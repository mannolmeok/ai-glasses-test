// PROTOTYPE - NOT FOR PRODUCTION
// Question: 감독관 눈치를 보며 AI 안경으로 스캔하는 긴장감이, 장비와 시험이 함께 커지는 성장과 맞물려 엔딩까지 재밌나?
// Date: 2026-11-17
// 시험 중 안경 HUD(3D 화면 위에 겹치는 640x360 도트 층: 시계, 스캔 진행, 렌즈 가장자리 경고, 안내, 적발)와
// 3D 시험지·태블릿·노트북 화면에 그리는 그림(문제, 보기, 마킹, 안경이 비추는 AR: 지운 오답·AI 답·초점 틀),
// 마주 앉는 시험(면접·테이스팅)에서 안경이 띄우는 AR 카드.
'use strict';

const EXAM_LAYOUT = { W: 640, H: 360, zone: 0.17, clock: [592, 40], hintY: 22 };

// ---- 시험지 (3D 종이·태블릿에 붙는 그림) ----
const PAPER_W = 720, PAPER_H = 1000;
const PAPER_ROW = i => 548 + i * 106;
function paperRowAt(py) { for (let i = 0; i < 4; i++) if (py > PAPER_ROW(i) - 76 && py < PAPER_ROW(i) + 30) return i; return -1; }
function wrapCanvas(g, str, maxW) {
  const out = []; let cur = '';
  for (const w of String(str).split(' ')) {
    const t = cur ? cur + ' ' + w : w;
    if (g.measureText(t).width <= maxW) { cur = t; continue; }
    if (cur) out.push(cur);
    if (g.measureText(w).width <= maxW) { cur = w; continue; }
    let part = ''; for (const ch of w) { if (g.measureText(part + ch).width > maxW) { out.push(part); part = ch; } else part += ch; } cur = part;
  }
  if (cur) out.push(cur);
  return out;
}
const TABLET_BAR = { sat: '#2b4c9a', usmle: '#34343e', calbar: '#5a1f2a' };
function glyphCanvas(g, seed, x, y, s, col, lw) { // 외계 문자 한 자를 캔버스에
  g.strokeStyle = col; g.fillStyle = col; g.lineWidth = lw; g.lineCap = 'square';
  for (const [x0, y0, x1, y1] of glyph(seed)) {
    if (x0 === x1 && y0 === y1) g.fillRect(x + x0 * s - lw, y + y0 * s - lw, lw * 2, lw * 2);
    else { g.beginPath(); g.moveTo(x + x0 * s, y + y0 * s); g.lineTo(x + x1 * s, y + y1 * s); g.stroke(); }
  }
}
function glyphRow(g, seed, n, x, y, s, col, lw) { alienWord(seed, n).forEach((gl, i) => glyphCanvas(g, gl, x + i * (s * 1.25), y, s, col, lw)); }
function drawCallHud(k, L, E, now) { // [저승] 부른 횟수만큼 이름이 겹쳐 들린다. 감독관 동선 AI가 있으면 어느 쪽에서 부르는지도 (시험지 밖 가장자리에만)
  const C = E.call; if (!C || C.phase !== 'call' || C.n < 1) return;
  const since = C.k - C.at[C.n - 1], a = Math.min(1, since / 0.15) * (1 - Math.max(0, Math.min(1, (since - 1.1) / 0.6)) * 0.5), txt = Array(C.n).fill('김수험…').join(' ');
  const dir = C.ok.length === 1 && C.ok[0] === 'front' ? 'front' : C.yaw > 0 ? 'left' : 'right'; // 부르는 쪽 가장자리에 뜬다: 그쪽을 봐야 한다
  k.b.globalAlpha = 0.45 + 0.55 * a; const sz = 10 + C.n * 1.5, col = C.n >= 3 ? '#ff9a9a' : '#cfd8ff';
  if (dir === 'left') k.SUB('‹ ' + txt, 14, 150, sz, col, 'left'); else if (dir === 'right') k.SUB(txt + ' ›', L.W - 14, 150, sz, col, 'right'); else k.SUB('˄ ' + txt + ' ˄', L.W / 2, 40, sz, col, 'center');
  k.b.globalAlpha = 1;
}
function captchaIcon(g, id, cx, cy, s) { // 로봇 확인 그림 6종 (신호등·자동차·나무·버스·자전거·소화전)
  const u = s / 20, R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(cx + x * u, cy + y * u, w * u, h * u); };
  const C = (x, y, r, c) => { g.fillStyle = c; g.beginPath(); g.arc(cx + x * u, cy + y * u, r * u, 0, 7); g.fill(); };
  if (id === 0) { R(-4, -9, 8, 18, '#26262e'); C(0, -5, 2.4, '#e8453e'); C(0, 0, 2.4, '#f2c13a'); C(0, 5, 2.4, '#4ac24a'); R(-1, 9, 2, 3, '#26262e'); }
  else if (id === 1) { R(-9, -1, 18, 6, '#d6403a'); R(-5, -5, 10, 4, '#d6403a'); R(-4, -4, 3, 3, '#bfe8ff'); R(1, -4, 3, 3, '#bfe8ff'); C(-5, 5, 2.6, '#1c1c22'); C(5, 5, 2.6, '#1c1c22'); }
  else if (id === 2) { R(-1.5, 2, 3, 8, '#7a4a2a'); C(0, -3, 7, '#3f9a3a'); C(-3, -5, 3, '#55b04a'); }
  else if (id === 3) { R(-10, -6, 20, 11, '#f2b23a'); for (let i = 0; i < 4; i++) R(-8.5 + i * 4.4, -4.5, 3.4, 3.4, '#bfe8ff'); C(-6, 5.5, 2.4, '#1c1c22'); C(6, 5.5, 2.4, '#1c1c22'); }
  else if (id === 4) { g.strokeStyle = '#26262e'; g.lineWidth = 1.6 * u; for (const sx of [-5.5, 5.5]) { g.beginPath(); g.arc(cx + sx * u, cy + 3 * u, 4.2 * u, 0, 7); g.stroke(); }
    g.beginPath(); g.moveTo(cx - 5.5 * u, cy + 3 * u); g.lineTo(cx - 1 * u, cy - 3 * u); g.lineTo(cx + 5.5 * u, cy + 3 * u); g.moveTo(cx - 1 * u, cy - 3 * u); g.lineTo(cx + 3 * u, cy - 3 * u); g.stroke(); }
  else { R(-4, -4, 8, 13, '#d6403a'); R(-5, -6, 10, 3, '#b8302a'); R(-2, -9, 4, 3, '#b8302a'); R(-7, -1, 3, 3, '#b8302a'); R(4, -1, 3, 3, '#b8302a'); R(-5, 8, 10, 2, '#8a2a24'); }
}
function drawPaperTexture(g, E, now) { if (E.T.mech.includes('mirror')) { g.save(); g.translate(PAPER_W, 0); g.scale(-1, 1); drawPaperTexture0(g, E, now); g.restore(); } else drawPaperTexture0(g, E, now); } // 거울 나라: 시험지가 좌우로 뒤집힌다
function drawPassage(g, E, q, ink, cyan, bg) { // 긴 지문(LEET): 위에는 지문 한 쪽, 아래에는 물음. 스캔은 줄을 훑고 절반에서 쪽을 넘기며, 다 읽은 뒤에는 둘째 쪽에 머문다
  const F = FONT_BODY, read = !!(E.ai || E.fb || q.pre), s = read ? 1 : Math.max(0, Math.min(1, E.scan || 0)), scanning = !read && s > 0.001;
  const pg = s < 0.5 ? 0 : 1, loc = pg ? (s - 0.5) * 2 : s * 2, x0 = 52, top = 206, lh = 28;
  g.textAlign = 'left'; g.font = `600 21px ${F}`;
  const ls = wrapCanvas(g, q.passage[pg], PAPER_W - 170), upto = scanning ? loc * ls.length : 0;
  ls.forEach((ln, i) => { const y = top + i * lh, w = g.measureText(ln).width;
    if (i < Math.floor(upto)) { g.fillStyle = 'rgba(47,211,221,0.2)'; g.fillRect(x0 - 4, y - 21, w + 8, 27); g.fillStyle = cyan; g.fillRect(x0 - 4, y + 6, w + 8, 2); }
    else if (scanning && i === Math.floor(upto)) { const f = upto - i; g.fillStyle = 'rgba(47,211,221,0.34)'; g.fillRect(x0 - 4, y - 21, (w + 8) * f, 27); g.fillStyle = cyan; g.fillRect(x0 - 4 + (w + 8) * f, y - 23, 3, 31); }
    g.fillStyle = ink; g.fillText(ln, x0, y); });
  if (scanning) { const notes = pg ? ['반론', '쟁점', '→ 결론'] : ['전제', '근거', '구별']; g.font = `800 19px ${F}`; g.fillStyle = cyan; notes.forEach((nt, j) => { const at = Math.floor((j + 0.6) * ls.length / 3); if (at < upto) { const y = top + at * lh; g.fillText(nt, PAPER_W - 104, y); g.fillRect(PAPER_W - 112, y - 18, 2, 24); } }); }
  g.textAlign = 'right'; g.fillStyle = '#6c6a80'; g.font = `700 18px ${F}`; g.fillText(`지문 ${pg + 1} / 2`, PAPER_W - 44, 432);
  if (scanning && pg === 1 && loc < 0.14) { const f = loc / 0.14, x = PAPER_W * (1 - f), gr = g.createLinearGradient(x - 90, 0, x + 30, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.6, 'rgba(0,0,0,0.22)'); gr.addColorStop(1, 'rgba(255,255,255,0.9)'); g.fillStyle = gr; g.fillRect(x - 90, 178, 120, 264); g.fillStyle = bg; g.fillRect(x + 30, 178, PAPER_W, 264); } // 쪽 넘김: 지문 칸만 오른쪽에서 왼쪽으로 넘어간다
  let size = 26; g.textAlign = 'left'; g.fillStyle = ink; g.font = `800 ${size}px ${F}`; const stem = `${E.qi + 1}. ${q.q}`; while (g.measureText(stem).width > PAPER_W - 100 && size > 20) { size -= 1; g.font = `800 ${size}px ${F}`; }
  g.fillText(stem, x0, 468);
}
function drawPaperTexture0(g, E, now) {
  const F = FONT_BODY, tier = E.T, q = E.qs[Math.min(E.qi, E.qs.length - 1)], tablet = tier.device === 'tablet';
  const head = [tier.head[0], tier.parts ? tier.parts[E.part] : tier.head[1]];
  const ink = '#2a2838', cyan = '#2fd3dd', bg = tablet ? '#fbfcfe' : '#f6f2e6';
  g.textBaseline = 'alphabetic'; g.fillStyle = bg; g.fillRect(0, 0, PAPER_W, PAPER_H);
  if (tablet) { g.fillStyle = TABLET_BAR[tier.id] || '#2b4c9a'; g.fillRect(0, 0, PAPER_W, 150); }
  g.fillStyle = tablet ? '#ffffff' : ink; g.textAlign = 'center';
  let hs = 30; g.font = `800 ${hs}px ${F}`; while (g.measureText(head[0]).width > PAPER_W - 80 && hs > 20) { hs -= 2; g.font = `800 ${hs}px ${F}`; }
  g.fillText(head[0], PAPER_W / 2, 62);
  g.font = `800 30px ${F}`; const sw = g.measureText(head[1]).width + 48;
  g.lineWidth = 3; g.strokeStyle = tablet ? '#ffffff' : ink; g.strokeRect(PAPER_W / 2 - sw / 2, 86, sw, 52); g.fillText(head[1], PAPER_W / 2, 123);
  g.font = `700 24px ${F}`; g.textAlign = 'right'; g.fillStyle = tablet ? '#c8d4f0' : '#6c6a80'; g.fillText(`${E.qi + 1} / ${E.qs.length}`, PAPER_W - 44, 123);
  g.fillStyle = ink; if (!tablet) { g.fillRect(40, 164, PAPER_W - 80, 4); g.fillRect(40, 172, PAPER_W - 80, 1); }
  if (E.breakT > 0) { g.textAlign = 'center'; g.fillStyle = '#6c6a80'; g.font = `800 44px ${F}`; g.fillText('쉬는 시간', PAPER_W / 2, 420); return; }
  const long = !!q.passage; if (long) drawPassage(g, E, q, ink, cyan, bg); // 긴 지문: 지문 한 쪽과 물음이 늘 함께 있다. 아래 보기는 다른 시험과 같다
  // 문제: 길면 글자를 줄여서
  g.textAlign = 'left'; g.fillStyle = ink;
  const room = q.kind === 'captcha' ? 70 : q.kind === 'alien' ? 150 : q.kind === 'listen' ? 120 : 260;
  let size = 50, lines = [];
  if (!long) for (;;) { g.font = `800 ${size}px ${F}`; lines = wrapCanvas(g, `${E.qi + 1}. ${q.q}`, PAPER_W - 110); if (lines.length * (size + 14) <= room || size <= (q.kind === 'captcha' ? 38 : 28)) break; size -= 4; }
  if (!long) lines.slice(0, 6).forEach((ln, i) => g.fillText(ln, 56, 236 + i * (size + 14)));
  const below = 236 + lines.length * (size + 14);
  if (q.kind === 'captcha') { // 3x3 칸
    const cell = 66, x0 = PAPER_W / 2 - cell * 1.5, y0 = Math.max(262, below - 26);
    for (let i = 0; i < 9; i++) { const cx = x0 + (i % 3) * cell, cy = y0 + Math.floor(i / 3) * cell; g.fillStyle = '#e8ecf2'; g.fillRect(cx + 2, cy + 2, cell - 4, cell - 4); captchaIcon(g, q.grid[i], cx + cell / 2, cy + cell / 2, 50); }
    g.strokeStyle = '#8a92a0'; g.lineWidth = 2; g.strokeRect(x0, y0, cell * 3, cell * 3);
  } else if (q.kind === 'alien') { // 외계어 번역문
    glyphRow(g, q.seed, 9, 60, below - 20, 36, '#5a4a8a', 3);
  } else if (q.kind === 'listen') { // 방송 듣기: 사진 자리와 스피커
    g.fillStyle = '#d8d4c8'; g.fillRect(56, below - 30, 220, 140); g.fillStyle = '#8a8676'; g.font = `800 28px ${F}`; g.textAlign = 'center'; g.fillText('사진', 166, below + 50); g.textAlign = 'left';
    g.fillStyle = ink; g.fillRect(320, below + 10, 28, 40); g.beginPath(); g.moveTo(348, below + 10); g.lineTo(380, below - 14); g.lineTo(380, below + 74); g.lineTo(348, below + 50); g.fill();
    g.strokeStyle = ink; g.lineWidth = 5; for (let i = 0; i < 3; i++) { if (Math.floor(now * 3) % 3 < i) continue; g.beginPath(); g.arc(384, below + 30, 22 + i * 18, -0.7, 0.7); g.stroke(); }
  }
  if (q.kind === 'essay') { // 서술형: 보기 대신 답안 칸. 옮겨 쓴 줄이 손글씨로 채워진다
    const bx = 50, by = Math.max(below + 6, 430), bw = PAPER_W - 100, bh = 930 - by, n = q.lines.length, lh = Math.min(104, (bh - 20) / n), es = E.es && E.es.q === q ? E.es : { done: 0, w: 0 };
    g.fillStyle = '#fbf9f1'; g.fillRect(bx, by, bw, bh); g.lineWidth = 3; g.strokeStyle = ink; g.strokeRect(bx, by, bw, bh);
    g.fillStyle = '#6c6a80'; g.font = `700 22px ${F}`; g.textAlign = 'right'; g.fillText(`답안 ${es.done} / ${n}줄`, bx + bw - 12, by - 12); g.textAlign = 'left';
    for (let i = 0; i < n; i++) { const y = by + 14 + (i + 1) * lh - 22; g.fillStyle = '#c8c2b0'; g.fillRect(bx + 16, y + 12, bw - 32, 2);
      const full = i < es.done || E.answers[E.qi] != null, part = i === es.done && es.w > 0; if (!full && !part) continue;
      const str = full ? q.lines[i] : q.lines[i].slice(0, Math.ceil(q.lines[i].length * es.w)); let fs = 40; g.font = `italic 600 ${fs}px ${F}`; while (g.measureText(q.lines[i]).width > bw - 44 && fs > 24) { fs -= 2; g.font = `italic 600 ${fs}px ${F}`; }
      g.fillStyle = '#1c2a6a'; g.fillText(str, bx + 22, y); }
    g.textAlign = 'center'; g.font = `700 24px ${F}`; g.fillStyle = '#6c6a80'; g.fillText(`- ${E.qi + 1} -`, PAPER_W / 2, PAPER_H - 26);
    return;
  }
  // 보기
  let cs = 54; g.font = `700 ${cs}px ${F}`;
  const text = c => (q.kind === 'alien' ? '' : String(c));
  const widest = Math.max(...q.choices.map(c => g.measureText(text(c)).width));
  if (widest > PAPER_W - 230) { cs = Math.max(28, Math.floor(cs * (PAPER_W - 230) / widest)); }
  q.choices.forEach((t, i) => {
    const y = PAPER_ROW(i), marked = E.answers[E.qi] === i;
    g.lineWidth = 3; g.strokeStyle = ink;
    if (tablet) { g.strokeRect(66, y - 44, 52, 52); if (marked) { g.fillStyle = '#1f3d7a'; g.fillRect(66, y - 44, 52, 52); } }
    else { g.beginPath(); g.arc(92, y - 18, 25, 0, 7); g.stroke(); if (marked) { g.fillStyle = '#1c1c26'; g.beginPath(); g.arc(92, y - 18, 25, 0, 7); g.fill(); } }
    g.fillStyle = marked ? '#f6f2e6' : ink; g.textAlign = 'center'; g.font = `800 30px ${F}`; g.fillText(tablet ? 'ABCD'[i] : String(i + 1), 92, y - 7);
    g.fillStyle = ink; g.textAlign = 'left';
    if (q.kind === 'alien') glyphRow(g, t, 5, 144, y - 48, 40, '#3a2a6a', 3);
    else { g.font = `700 ${cs}px ${F}`; g.fillText(text(t), 140, y); }
  });
  g.textAlign = 'center'; g.font = `700 24px ${F}`; g.fillStyle = '#6c6a80'; g.fillText(`- ${E.qi + 1} -`, PAPER_W / 2, PAPER_H - 26);
  if (E.start > 0) return;
  if (q.final && E.ai) { // 마지막 문제: 모든 보기에 AI 100%, 화면이 깨진다
    for (let i = 0; i < 4; i++) {
      const y = PAPER_ROW(i), jx = Math.round(Math.sin(now * 31 + i * 2.1) * 7), jy = Math.round(Math.sin(now * 23 + i) * 3);
      g.lineWidth = 6; g.strokeStyle = i % 2 ? '#ff3a8a' : cyan; g.strokeRect(46 + jx, y - 70 + jy, PAPER_W - 92, 92);
      g.fillStyle = '#ff3a8a'; g.textAlign = 'right'; g.font = `800 40px ${F}`; g.fillText('AI 100%', PAPER_W - 58 + jx, y - 8 + jy);
      g.fillStyle = cyan; g.fillText('AI 100%', PAPER_W - 62 - jx, y - 8);
    }
    for (let i = 0; i < 9; i++) { const h = Math.abs(Math.sin(i * 12.9898 + Math.floor(now * 14) * 78.233) * 43758.5453) % 1; g.globalAlpha = 0.5; g.fillStyle = i % 3 ? cyan : '#ff3a8a'; g.fillRect(0, Math.floor(h * PAPER_H), PAPER_W, 3 + Math.floor(((h * 7) % 1) * 14)); } g.globalAlpha = 1;
    return;
  }
  if (E.clear && !E.fb && q.answer >= 0 && q.kind !== 'alien') { // 계단을 뛰고 와서 머리가 맑다: AI 없이도 답이 보인다 (연필로 친 동그라미)
    const y = PAPER_ROW(q.answer); g.font = `700 ${cs}px ${F}`; const w = g.measureText(text(q.choices[q.answer])).width;
    g.save(); g.translate(140 + w / 2 - 20, y - 22); g.rotate(-0.04); g.strokeStyle = 'rgba(40,52,90,0.75)'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.ellipse(0, 0, w / 2 + 62, 44, 0, 0.25, 6.7); g.stroke(); g.restore();
  }
  if (E.dead || E.intro) return; // 장비가 먹통이거나 입실 검사 중: 시험지 위에 아무것도 뜨지 않는다
  if (!E.ar) return; // 안경 전 단계: 시험지 위에는 아무것도 뜨지 않는다 (답은 소매 속 액정에)
  // 안경이 종이 위에 비추는 AR. 장비 단계마다 모양이 다르다 (hudStage)
  const st = hudStage(E), col = HUD_INK[st] || cyan, row = i => PAPER_ROW(i), tw = i => { g.font = `700 ${cs}px ${F}`; return q.kind === 'alien' ? 300 : g.measureText(text(q.choices[i])).width; };
  const strikes = Math.min(2, q.pre ? 2 : Math.floor(E.scan * 3 + 1e-6)), picked = E.ai && !E.fb, scanning = (E.holding || E.scan > 0) && !E.ai && !E.fb;
  if (st === 'brain') { // 뇌 임플란트: 표시가 없다. 정답만 환하고 나머지는 흐려진다
    if (picked) for (let i = 0; i < 4; i++) {
      const y = row(i);
      if (i !== q.aiPick) { g.globalAlpha = 0.72; g.fillStyle = bg; g.fillRect(40, y - 72, PAPER_W - 80, 98); g.globalAlpha = 1; }
      else { const gr = g.createRadialGradient(PAPER_W / 2 - 60, y - 26, 20, PAPER_W / 2 - 60, y - 26, 330); gr.addColorStop(0, 'rgba(255,205,90,0.55)'); gr.addColorStop(1, 'rgba(255,205,90,0)'); g.fillStyle = gr; g.fillRect(20, y - 90, PAPER_W - 40, 130); }
    }
    else for (let j = 0; j < strikes; j++) { const y = row(q.elim[j]); g.globalAlpha = 0.5; g.fillStyle = bg; g.fillRect(40, y - 72, PAPER_W - 80, 98); g.globalAlpha = 1; }
  } else if (st === 'contact') { // 콘택트렌즈: 보기 옆 작은 빛 고리 하나
    for (let j = 0; j < strikes; j++) { const i = q.elim[j], y = row(i); g.globalAlpha = 0.55; g.fillStyle = col; g.fillRect(132, y - 22, tw(i) + 16, 3); g.globalAlpha = 1; }
    if (picked) { const y = row(q.aiPick) - 22; g.strokeStyle = col; g.lineWidth = 12; g.globalAlpha = 0.25; g.beginPath(); g.arc(76, y, 30, 0, 7); g.stroke(); g.globalAlpha = 1; g.lineWidth = 5; g.beginPath(); g.arc(76, y, 30, 0, 7); g.stroke();
      g.fillStyle = '#1e6a80'; g.textAlign = 'left'; g.font = `700 26px ${F}`; g.fillText(String(q.conf), 150 + tw(q.aiPick), y + 14); }
    if (scanning) { g.fillStyle = col; g.globalAlpha = 0.7; for (let i = 0; i < 4; i++) { const on = Math.floor(now * 8) % 4 === i; g.beginPath(); g.arc(76, row(i) - 22, on ? 9 : 5, 0, 7); g.fill(); } g.globalAlpha = 1; }
  } else {
    for (let j = 0; j < strikes; j++) {
      const i = q.elim[j], y = row(i), w = tw(i);
      if (st !== 'proto') { g.globalAlpha = 0.35; g.fillStyle = st === 'mil' ? '#3a2a08' : st === 'used' ? '#0c3016' : '#0f3238'; g.fillRect(56, y - 60, w + 112, 76); g.globalAlpha = 1; }
      g.fillStyle = col; g.fillRect(132, y - 24, w + 16, st === 'proto' ? 4 : 7);
    }
    if (picked) {
      const y = row(q.aiPick);
      if (st === 'proto') { // 시제품: 보기마다 확신도 막대, 고른 보기에 밑줄
        const cf = choiceConf(q);
        for (let i = 0; i < 4; i++) { const yy = row(i) - (q.passage ? 56 : 26), on = i === q.aiPick; g.globalAlpha = 1; g.fillStyle = '#9aa0ac'; g.fillRect(PAPER_W - 250, yy, 130, 8); g.fillStyle = on ? '#0f95a8' : '#4a5060'; g.fillRect(PAPER_W - 250, yy, Math.round(130 * cf[i] / 100), 8); // 긴 지문의 보기는 길어서 막대를 보기 위 빈 줄로
          g.textAlign = 'right'; g.font = `${on ? 800 : 700} ${on ? 34 : 26}px ${F}`; g.fillStyle = on ? '#0c6f7e' : '#4a5060'; g.fillText(cf[i] + '%', PAPER_W - 44, yy + 14); }
        g.globalAlpha = 1; g.fillStyle = '#18a6ba'; g.fillRect(126, y + 10, tw(q.aiPick) + 28, 6);
      } else if (st === 'mil') { // 군용: 표적 꺾쇠
        const x0 = 46, x1 = PAPER_W - 46, y0 = y - 70, y1 = y + 22, Lc = 40; g.fillStyle = col;
        for (const [cx, cy, sx, sy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]) { g.fillRect(sx > 0 ? cx : cx - Lc, cy - (sy > 0 ? 0 : 6), Lc, 6); g.fillRect(cx - (sx > 0 ? 0 : 6), sy > 0 ? cy : cy - Lc, 6, Lc); }
        g.fillStyle = '#b06a00'; g.textAlign = 'right'; g.font = `800 ${q.passage ? 26 : 32}px ${F}`; g.fillText(`TGT ${q.aiPick + 1} · CONF ${q.conf}`, PAPER_W - 62, y - (q.passage ? 44 : 10)); // 긴 지문의 보기는 길어서 표시를 보기 위로
      } else { // 중고: 굵은 초록 상자
        g.lineWidth = 7; g.strokeStyle = col; g.strokeRect(46, y - 70, PAPER_W - 92, 92);
        const ly = y - (q.passage ? 40 : 8); g.fillStyle = 'rgba(255,60,60,0.45)'; g.textAlign = 'right'; g.font = `800 ${q.passage ? 30 : 40}px ${F}`; g.fillText(`AI ▶ ${q.aiPick + 1}  ${q.conf}%`, PAPER_W - 58, ly); // 긴 지문의 보기는 길어서 표시를 보기 위로
        g.fillStyle = '#1f9a3a'; g.fillText(`AI ▶ ${q.aiPick + 1}  ${q.conf}%`, PAPER_W - 62, ly);
      }
    }
    if (scanning) {
      const x0 = 36, y0 = 186, x1 = PAPER_W - 36, y1 = PAPER_ROW(3) + 44, t = st === 'proto' ? 3 : 6, jam = (E.jam || 1) > 1, L = jam ? 22 : 46; // [변호사시험 3교시] 전파 방해: 모서리가 끊기고 스캔 줄이 회색으로 덜컥덜컥 기어간다
      g.fillStyle = jam ? '#8a96a2' : col;
      for (const [cx, cy, sx, sy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]) {
        g.fillRect(sx > 0 ? cx : cx - L, cy - (sy > 0 ? 0 : t), L, t); g.fillRect(cx - (sx > 0 ? 0 : t), sy > 0 ? cy : cy - L, t, L);
      }
      if (E.holding) { const span = y1 - y0, yy = jam ? Math.floor(((now * 95) % span) / 24) * 24 : (now * 520) % span; g.globalAlpha = jam ? 0.75 : 0.6; g.fillRect(x0 + (jam ? Math.round(Math.sin(now * 31) * 4) : 0), y0 + yy, x1 - x0, st === 'proto' ? 2 : 4); g.globalAlpha = 1; }
    }
  }
  if (E.pulse && E.T.pulse === 'screen' && (E.pulse.warn > 0 || E.pulse.active > 0)) { // 화면 검사: 태블릿 화면이 깜빡인다
    g.globalAlpha = E.pulse.active > 0 ? 0.35 : 0.12; g.fillStyle = '#ff3048'; g.fillRect(0, 0, PAPER_W, PAPER_H); g.globalAlpha = 1;
    g.fillStyle = '#ff3048'; g.textAlign = 'center'; g.font = `800 34px ${F}`; g.fillText('SCREEN CHECK', PAPER_W / 2, 196);
  }
}

// ---- 재시험 출석 통보: 성적 통지표와 같은 종이에 찍혀 온다 ----
function drawNoticePaper(g, A) {
  const F = FONT_BODY, ink = '#22212c', sub = '#5a586a', line = '#3a3948', red = '#c8242a', W = PAPER_W, H = PAPER_H;
  g.setTransform(1, 0, 0, 1, 0, 0); g.textBaseline = 'alphabetic'; g.fillStyle = '#f3f2ec'; g.fillRect(0, 0, W, H);
  g.save(); g.globalAlpha = 0.045; g.fillStyle = '#2b5f8a'; g.font = `800 30px ${F}`; g.textAlign = 'center'; g.translate(W / 2, H / 2); g.rotate(-0.5);
  for (let yy = -700; yy <= 700; yy += 78) for (let xx = -700; xx <= 700; xx += 300) g.fillText('시험관리위원회', xx + (Math.round(yy / 78) % 2) * 150, yy);
  g.restore();
  g.strokeStyle = line; g.lineWidth = 4; g.strokeRect(26, 26, W - 52, H - 52); g.lineWidth = 1.5; g.strokeRect(34, 34, W - 68, H - 68);
  g.fillStyle = sub; g.textAlign = 'left'; g.font = `700 17px ${F}`; g.fillText(`시험관리위원회 제 2026-조사-${String(417 + A.tier * 13).padStart(4, '0')} 호`, 52, 66);
  g.fillStyle = ink; g.textAlign = 'center'; g.font = `800 50px ${F}`; g.fillText('재시험 출석 통보', W / 2, 170); g.fillRect(W / 2 - 200, 186, 400, 3); g.fillRect(W / 2 - 200, 192, 400, 1);
  const rows = [['수험번호', String(31000000 + A.tier * 1234567), ink], ['성 명', '김 수 험', ink], ['대상 시험', `${A.tierName} (득점 100)`, ink], ['사 유', '고득점자 답안 재검증', red]];
  rows.forEach(([a, b, col], i) => { const y = 236 + i * 56; g.fillStyle = '#e2e3e0'; g.fillRect(56, y, 150, 56); g.lineWidth = 1.5; g.strokeRect(56, y, 150, 56); g.strokeRect(206, y, W - 262, 56);
    g.fillStyle = ink; g.textAlign = 'center'; g.font = `700 22px ${F}`; g.fillText(a, 131, y + 36); g.fillStyle = col; g.textAlign = 'left'; let fs = 24; g.font = `800 ${fs}px ${F}`; while (g.measureText(b).width > W - 300 && fs > 14) { fs--; g.font = `800 ${fs}px ${F}`; } g.fillText(b, 224, y + 37); });
  g.lineWidth = 3; g.strokeRect(56, 236, W - 112, 224);
  g.fillStyle = ink; g.textAlign = 'left'; g.font = `500 25px ${F}`;
  ['귀하는 답안 재검증 대상으로 선정되었습니다.', '조사관 입회하에 같은 과목 재시험에', '응시하시기 바랍니다.'].forEach((s, i) => g.fillText(s, 64, 520 + i * 40));
  g.font = `800 25px ${F}`; g.fillText('전자기기와 안경류는 입실 전 제출합니다.', 64, 660);
  g.font = `500 25px ${F}`; g.fillText('5문항 중 3문항 이상 맞히면 재검증을 마칩니다.', 64, 712); g.fillStyle = red; g.font = `800 25px ${F}`; g.fillText('미달하면 합격을 취소하고 고발합니다.', 64, 752);
  g.fillStyle = ink; g.textAlign = 'center'; g.font = `800 34px ${F}`; g.fillText('시험관리위원회 조사국장', W / 2 - 30, 870);
  g.save(); g.translate(W - 120, 858); g.rotate(-0.06); g.globalAlpha = 0.86; g.strokeStyle = red; g.lineWidth = 5; g.strokeRect(-44, -44, 88, 88); g.fillStyle = red; g.font = `800 28px ${F}`; g.fillText('조 사', 0, -6); g.fillText('국 장', 0, 28); g.restore();
  g.save(); g.translate(W - 128, 98); g.rotate(0.12); g.globalAlpha = 0.88; g.strokeStyle = red; g.lineWidth = 6; g.strokeRect(-88, -28, 176, 56); g.fillStyle = red; g.font = `800 32px ${F}`; g.textAlign = 'center'; g.fillText('출석 요구', 0, 12); g.restore();
}
// ---- 재시험 문제지: 조사실 책상 위 종이 한 장 (600x800) ----
function wrapChars(g, str, maxW) { const out = []; let cur = ''; for (const ch of String(str)) { if (g.measureText(cur + ch).width > maxW && cur) { out.push(cur); cur = ch === ' ' ? '' : ch; } else cur += ch; } if (cur) out.push(cur); return out; }
function drawProbePaper(g, P) {
  const F = FONT_BODY, W = 600, H = 800, ink = '#22212c', q = P.qs[Math.min(P.qi, P.qs.length - 1)];
  g.setTransform(1, 0, 0, 1, 0, 0); g.textBaseline = 'alphabetic'; g.fillStyle = '#f3f1e8'; g.fillRect(0, 0, W, H);
  g.fillStyle = ink; g.textAlign = 'center'; g.font = `700 22px ${F}`; g.fillText(`${P.T.name} · 재시험`, W / 2, 46); g.fillRect(40, 62, W - 80, 3);
  g.textAlign = 'right'; g.font = `700 20px ${F}`; g.fillText(`${Math.min(P.qi + 1, P.qs.length)} / ${P.qs.length}`, W - 40, 46);
  if (q.no) { g.textAlign = 'left'; g.fillStyle = '#7a7686'; g.font = `700 19px ${F}`; g.fillText(`그날 시험지 ${q.no}`, 40, 92); g.fillStyle = ink; } // 시험에서 본 바로 그 문제: 번호까지 같다 (답을 외워 두면 산다)
  const marks = ['①', '②', '③', '④'];
  if (q.kind === 'alien') { // 외계 문자 문제: 안경 없이는 그저 무늬. 시험 때 고른 모양을 기억해야 한다
    let y = (q.no ? 104 : 84) + 34; g.textAlign = 'left'; g.font = `700 30px ${F}`; for (const ln of wrapChars(g, `${P.qi + 1}. ${q.q}`, W - 80)) { g.fillText(ln, 40, y); y += 40; }
    glyphRow(g, q.seed, 9, 44, y - 6, 40, '#5a4a8a', 3); y += 82; P.rects = [];
    q.choices.forEach((c, i) => { const y0 = y + i * 100, bh = 84; P.rects.push([(y0 - 4) / H, (y0 + bh + 4) / H]);
      if (P.mark && P.mark.c === i) { g.fillStyle = 'rgba(40,40,60,0.12)'; g.fillRect(30, y0, W - 60, bh); }
      g.fillStyle = ink; g.font = `500 38px ${F}`; g.fillText(marks[i], 44, y0 + 56); glyphRow(g, c, 5, 108, y0 + 16, 50, '#3a2a6a', 3.5);
      if (P.mark && P.mark.c === i) { g.strokeStyle = '#1a1a22'; g.lineWidth = 5; g.beginPath(); g.ellipse(62, y0 + 44, 27, 25, -0.2, 0, 7); g.stroke(); } });
  } else {
  let fs = 40, ql, cl;
  for (; fs >= 22; fs -= 2) { g.font = `700 ${fs}px ${F}`; ql = wrapChars(g, `${P.qi + 1}. ${q.q}`, W - 80); g.font = `500 ${fs}px ${F}`; cl = q.choices.map(c => wrapChars(g, c, W - 150));
    if (ql.length * fs * 1.3 + cl.reduce((p, c) => p + c.length * fs * 1.25 + fs * 0.9, 0) < H - 150 - (q.no ? 24 : 0)) break; }
  let y = (q.no ? 108 : 84) + fs; g.textAlign = 'left'; g.font = `700 ${fs}px ${F}`; for (const ln of ql) { g.fillText(ln, 40, y); y += fs * 1.3; }
  y += fs * 0.5; P.rects = [];
  cl.forEach((lines, i) => { const y0 = y - fs, bh = lines.length * fs * 1.25 + fs * 0.5; P.rects.push([(y0 - fs * 0.2) / H, (y0 + bh + fs * 0.2) / H]);
    if (P.mark && P.mark.c === i) { g.fillStyle = 'rgba(40,40,60,0.12)'; g.fillRect(30, y0, W - 60, bh); }
    g.fillStyle = ink; g.font = `500 ${fs}px ${F}`; g.fillText(marks[i], 44, y + fs * 0.1); lines.forEach((ln, j) => g.fillText(ln, 44 + fs * 1.5, y + fs * 0.1 + j * fs * 1.25));
    if (P.mark && P.mark.c === i) { g.strokeStyle = '#1a1a22'; g.lineWidth = 5; g.beginPath(); g.ellipse(44 + fs * 0.5, y - fs * 0.22, fs * 0.72, fs * 0.66, -0.2, 0, 7); g.stroke(); }
    y += bh + fs * 0.4; });
  }
  if (P.phase === 'pass' || P.phase === 'fail') { const ok = P.phase === 'pass', col = ok ? '#1c5a9a' : '#c8242a'; g.save(); g.translate(W / 2 + 60, H - 190); g.rotate(-0.16); g.globalAlpha = 0.9; g.fillStyle = 'rgba(243,241,232,0.8)'; g.fillRect(-170, -52, 340, 104); g.strokeStyle = col; g.lineWidth = 9; g.strokeRect(-170, -52, 340, 104); g.fillStyle = col; g.font = `800 66px ${F}`; g.textAlign = 'center'; g.fillText(ok ? '이상 없음' : '합격 취소', 0, 24); g.restore(); }
}
function drawProbeHud(k, L, P, now, spot) { // 조사실: 초록 HUD 없이 맨눈. 시계와 문항 수만 흰 글씨
  const b = k.b, W = L.W, H = L.H, R = k.R, t = P.t;
  let gr = b.createRadialGradient(W / 2, H * 0.42, 110, W / 2, H * 0.42, 420); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.62)'); b.fillStyle = gr; b.fillRect(0, 0, W, H);
  if (P.phase === 'in') {
    const a = Math.max(0, 1 - t / 1.5) * (Math.floor(now * 22) % 3 ? 1 : 0.55); // 안경을 벗는 순간: 초록 화면이 지직거리며 꺼진다
    if (a > 0) { b.globalAlpha = 0.6 * a; R(0, 0, W, H, '#061e0e'); b.globalAlpha = 0.16 * a; for (let y = 0; y < H; y += 1.5) R(0, y, W, 0.5, '#000000'); b.globalAlpha = a; b.font = `400 12.5px ${BOOT_FONT}`; b.textAlign = 'left'; b.fillStyle = '#74ff8e'; ['LENS-OS 0.9b', '착용 ......... 해제됨', '전원 ......... 강제 종료'].forEach((ln, i) => b.fillText(ln, 65, 60 + i * 15.6)); b.globalAlpha = 1; b.drawImage(rimFor('land'), 0, 0); }
    if (t > 0.3 && t < 2.3) k.SUB('조사관: 안경은 여기 두시죠.', W / 2, H - 34, 13);
    else if (t >= 2.3) k.SUB('(안경이 없다. 글자가 그냥 글자다)', W / 2, H - 34, 12, '#e8e4da');
  } else if (P.phase === 'play') {
    const s = Math.max(0, Math.ceil(P.left)), low = P.left < 10;
    k.SUB(`${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`, W - 24, 24, 17, low && Math.floor(now * 4) % 2 ? '#ff6a6a' : '#ffffff', 'right');
    k.SUB(`재시험 ${Math.min(P.qi + 1, P.qs.length)} / ${P.qs.length} · 3개 이상`, W - 24, 42, 9, '#ffffff', 'right');
    if (P.qi === 0 && !P.mark) k.SUB('보기를 눌러 답하기 [1~4]', W / 2, H - 14, 9, '#e8e4da');
  } else if (P.phase === 'judge') k.SUB('(조사관이 답안지를 넘겨 본다)', W / 2, H - 34, 12, '#e8e4da');
  else if (P.phase === 'pass') { if (t > 0.5) k.SUB('조사관: …실력이셨군요. 돌아가셔도 됩니다.', W / 2, H - 34, 13); }
  else if (P.phase === 'fail') {
    if (t < 1.6) k.SUB(`조사관: ${P.correct}개. 합격선에 못 미치네요.`, W / 2, H - 34, 13);
    if (t > 2.0) { const red = Math.floor(now / 0.32) % 2; // 경광등
      gr = b.createLinearGradient(0, 0, W * 0.55, 0); gr.addColorStop(0, red ? 'rgba(255,40,40,0.5)' : 'rgba(40,90,255,0.2)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); b.fillStyle = gr; b.fillRect(0, 0, W, H);
      gr = b.createLinearGradient(W, 0, W * 0.45, 0); gr.addColorStop(0, red ? 'rgba(255,40,40,0.2)' : 'rgba(40,90,255,0.5)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); b.fillStyle = gr; b.fillRect(0, 0, W, H); }
    if (spot && t > 2.1) { const [sx, sy] = spot, a = Math.min(1, (t - 2.1) / 0.3) * (0.85 + Math.sin(now * 30) * 0.05); // 손전등이 내 얼굴을 비춘다
      gr = b.createRadialGradient(sx, sy, 2, sx, sy, 190); gr.addColorStop(0, `rgba(255,252,230,${0.95 * a})`); gr.addColorStop(0.12, `rgba(255,248,210,${0.5 * a})`); gr.addColorStop(1, 'rgba(255,248,210,0)'); b.fillStyle = gr; b.fillRect(0, 0, W, H); }
    if (t > 2.6 && t < 5.4) k.SUB('경찰입니다. 같이 가시죠.', W / 2, H - 34, 14);
    const off = Math.max(0, Math.min(1, (t - 5.0) / 0.9));
    if (off > 0) { const h = H / 2 * Math.min(1, off * 1.6), w2 = off > 0.62 ? W / 2 * Math.min(1, (off - 0.62) / 0.3) : 0; R(0, 0, W, h, '#000000'); R(0, H - h, W, h, '#000000'); R(0, 0, w2, H, '#000000'); R(W - w2, 0, w2, H, '#000000'); if (off > 0.55 && off < 0.98) { b.globalAlpha = 0.9; R(w2, H / 2 - 1, W - w2 * 2, 2, '#f4f4f0'); b.globalAlpha = 1; } }
  }
}

// ---- 성적 통지표: 시험이 끝나면 책상 위 시험지가 채점된 종이로 바뀐다 ----
function drawResultPaper(g, Rz) { // 기관에서 발급한 공문서처럼: 문서번호, 인적 사항 표, 성적 표, 문항별 채점표, 발급 문구, 직인
  const F = FONT_BODY, ink = '#22212c', sub = '#5a586a', line = '#3a3948', red = '#c8242a', W = PAPER_W, H = PAPER_H, t = CONFIG.tiers[Rz.tier] || {};
  const fit = (str, x, y, maxW, size, weight = 700, min = 14) => { g.font = `${weight} ${size}px ${F}`; while (g.measureText(str).width > maxW && size > min) { size -= 1; g.font = `${weight} ${size}px ${F}`; } g.fillText(str, x, y); };
  g.textBaseline = 'alphabetic'; g.fillStyle = '#f3f2ec'; g.fillRect(0, 0, W, H);
  g.save(); g.globalAlpha = 0.045; g.fillStyle = '#2b5f8a'; g.font = `800 30px ${F}`; g.textAlign = 'center'; g.translate(W / 2, H / 2); g.rotate(-0.5); // 바탕 무늬: 비스듬히 깔린 기관명
  for (let yy = -700; yy <= 700; yy += 78) for (let xx = -700; xx <= 700; xx += 300) g.fillText('시험관리위원회', xx + (Math.round(yy / 78) % 2) * 150, yy);
  g.restore();
  g.save(); g.globalAlpha = 0.07; g.strokeStyle = '#2b5f8a'; g.lineWidth = 2; for (let r = 60; r <= 200; r += 14) { g.beginPath(); g.arc(W / 2, 520, r, 0, 7); g.stroke(); } g.restore(); // 가운데 은은한 동심원
  g.strokeStyle = line; g.lineWidth = 4; g.strokeRect(26, 26, W - 52, H - 52); g.lineWidth = 1.5; g.strokeRect(34, 34, W - 68, H - 68);
  const day = new Date(2026, 10, 19 + Rz.tier * 9 + 3), no = `제 2026-${String(1000 + Rz.tier * 137).padStart(5, '0')} 호`;
  g.fillStyle = sub; g.textAlign = 'left'; g.font = `700 17px ${F}`; g.fillText(no, 52, 66); g.textAlign = 'right'; g.fillText('(수험생 보관용)', W - 52, 66);
  g.fillStyle = ink; g.textAlign = 'center'; fit(`2026년도 ${Rz.tierName}`, W / 2, 112, W - 140, 26, 700, 18);
  g.font = `800 52px ${F}`; g.fillText('성 적 통 지 표', W / 2, 172); g.fillRect(W / 2 - 170, 186, 340, 3); g.fillRect(W / 2 - 170, 192, 340, 1);
  const table = (x, y, cols, rows, rh, head) => { // 칸 너비 배열과 줄 배열로 표를 그린다
    const tw = cols.reduce((p, c) => p + c, 0); g.lineWidth = 1.5; g.strokeStyle = line;
    rows.forEach((r, j) => { let cx = x; r.forEach((cell, i) => { const hd = head(i, j); if (hd) { g.fillStyle = '#e2e3e0'; g.fillRect(cx, y + j * rh, cols[i], rh); }
      g.strokeRect(cx, y + j * rh, cols[i], rh); g.fillStyle = cell && cell.col || ink; g.textAlign = 'center'; fit(String(cell && cell.t != null ? cell.t : cell), cx + cols[i] / 2, y + j * rh + rh / 2 + (cell && cell.s ? cell.s * 0.36 : 8), cols[i] - 12, cell && cell.s || (hd ? 19 : 22), hd ? 700 : (cell && cell.w) || 700); cx += cols[i]; }); });
    g.lineWidth = 3; g.strokeRect(x, y, tw, rows.length * rh);
  };
  const X0 = 56, TW = W - 112;
  table(X0, 214, [110, 194, 110, 194], [['수험번호', String(31000000 + Rz.tier * 1234567), '성 명', '김 수 험'], ['시 험 명', Rz.tierName, '응시 영역', t.subject || '-']], 44, i => i % 2 === 0);
  const verdict = Rz.caught ? '무효' : Rz.passed ? '합격' : Rz.stamp === '합격 취소' ? '취소' : '불합격', vcol = Rz.passed && !Rz.caught ? '#1c5a9a' : red;
  g.fillStyle = ink; g.textAlign = 'left'; g.font = `800 21px ${F}`; g.fillText('1. 성적', X0, 336);
  table(X0, 348, [152, 96, 96, 110, 78, 76], [['구 분', '문항 수', '정답 수', '합격 기준', '득 점', '판 정'], [t.subject || '-', Rz.qn, Rz.caught ? '-' : +(+Rz.correct || 0).toFixed(1), `${Rz.pass}점 이상`, { t: Rz.caught ? 0 : Rz.score, s: 30, w: 800 }, { t: verdict, col: vcol, w: 800 }]], 50, (i, j) => j === 0);
  g.fillStyle = ink; g.textAlign = 'left'; g.font = `800 21px ${F}`; g.fillText('2. 문항별 채점 결과', X0, 486); g.fillStyle = sub; g.font = `700 15px ${F}`; g.textAlign = 'right'; g.fillText('○ 정답  × 오답  - 무응답', X0 + TW, 486);
  const n = Rz.marks.length, per = n > 24 ? 12 : n > 10 ? Math.ceil(n / Math.ceil(n / 12)) : Math.max(n, 5), rows = Math.ceil(n / per), cw = TW / per, rh = rows > 2 ? 30 : 36; let y = 498;
  for (let r = 0; r < rows; r++) { g.fillStyle = '#e2e3e0'; g.fillRect(X0, y, TW, rh); g.lineWidth = 1.5; g.strokeStyle = line;
    for (let c = 0; c < per; c++) { const i = r * per + c, cx = X0 + c * cw; g.strokeRect(cx, y, cw, rh); g.strokeRect(cx, y + rh, cw, rh + 6); if (i >= n) continue; const m = Rz.marks[i];
      g.fillStyle = sub; g.textAlign = 'center'; g.font = `700 17px ${F}`; g.fillText(String(i + 1), cx + cw / 2, y + rh / 2 + 6);
      const ok = m.r === 'O' && !Rz.caught, bad = m.r === 'X' || Rz.caught; g.fillStyle = ok ? ink : bad ? red : sub; g.font = `800 ${rh > 30 ? 26 : 22}px ${F}`; g.fillText(ok ? '○' : bad ? '×' : '-', cx + cw / 2, y + rh + (rh + 6) / 2 + 9);
      if (m.via === 'ai' || m.via === 'auto') { g.globalAlpha = 0.55; g.fillStyle = '#4a6a8a'; g.fillRect(cx + cw / 2 - 12, y + rh * 2 + 1, 24, 2.5); g.globalAlpha = 1; } } // 연필 밑줄: AI가 고른 답 (내가 표시해 둔 것)
    y += rh * 2 + 6; }
  g.lineWidth = 3; g.strokeStyle = line; g.strokeRect(X0, 498, TW, y - 498);
  y = Math.max(y + 52, 700); g.fillStyle = ink; g.textAlign = 'center'; g.font = `700 22px ${F}`;
  if (Rz.caught) { g.fillText('위 사람은 시험 중 부정행위가 적발되어 해당 시험을 무효로 처리하고', W / 2, y); g.fillText('관계 규정에 따라 이를 통지합니다.', W / 2, y + 32); }
  else { fit(`위 사람은 ${Rz.tierName}에 응시하여`, W / 2, y, TW - 20, 22, 700, 16); g.font = `700 22px ${F}`; g.fillText('위와 같은 성적을 취득하였음을 통지합니다.', W / 2, y + 32); }
  g.font = `700 21px ${F}`; g.fillText(`${day.getFullYear()}년 ${day.getMonth() + 1}월 ${day.getDate()}일`, W / 2, y + 84);
  g.font = `800 31px ${F}`; g.fillText('시 험 관 리 위 원 회 위 원 장', W / 2 - 34, y + 142);
  g.save(); g.translate(W / 2 + 232, y + 130); g.rotate(0.04); g.globalAlpha = 0.82; g.strokeStyle = red; g.fillStyle = red; g.lineWidth = 5; g.strokeRect(-41, -41, 82, 82); g.lineWidth = 1.5; g.strokeRect(-35, -35, 70, 70); // 직인
  g.font = `800 25px ${F}`; g.textAlign = 'center'; [['위', -17, -6], ['원', 17, -6], ['장', -17, 26], ['인', 17, 26]].forEach(([ch, dx, dy]) => g.fillText(ch, dx, dy)); g.restore();
  g.save(); g.translate(W - 170, Math.max(y - 78, 630)); g.rotate(-0.2); g.globalAlpha = 0.8; const st = Rz.stamp, good = Rz.passed && !Rz.caught, sc = good ? red : '#3a3a48'; g.strokeStyle = sc; g.fillStyle = sc; g.textAlign = 'center'; // 판정 도장
  if (st.length <= 2) { g.lineWidth = 7; g.beginPath(); g.arc(0, 0, 58, 0, 7); g.stroke(); g.lineWidth = 2; g.beginPath(); g.arc(0, 0, 49, 0, 7); g.stroke(); g.font = `800 46px ${F}`; g.fillText(st, 0, 17); }
  else { const sw = st.length > 4 ? 250 : 200; g.lineWidth = 7; g.strokeRect(-sw / 2, -40, sw, 80); g.lineWidth = 2; g.strokeRect(-sw / 2 + 8, -32, sw - 16, 64); g.font = `800 ${st.length > 4 ? 40 : 46}px ${F}`; g.fillText(st, 0, 16); }
  g.restore(); g.globalAlpha = 1;
  g.fillStyle = ink; for (let i = 0, x = 56; x < 250; i++) { const w = 1 + ((i * 7 + Rz.tier * 3) % 4); g.fillRect(x, H - 92, w, 34); x += w + 1 + ((i * 5) % 3); } // 바코드
  g.fillStyle = sub; g.textAlign = 'left'; g.font = `700 13px ${F}`; g.fillText(String(31000000 + Rz.tier * 1234567) + '-' + String(2026000 + Rz.tier * 137), 56, H - 44);
  g.textAlign = 'right'; g.font = `700 13px ${F}`; g.fillText('※ 재발급되지 않으며, 위·변조 시 법령에 따라 처벌받습니다.', W - 52, H - 64); g.fillText('※ 상금은 등록된 계좌로 입금됩니다.', W - 52, H - 44);
}

// ---- 토플 홈에디션: 고시원 노트북 화면 ----
const SCREEN_W = 990, SCREEN_H = 600;
const SCREEN_ROW = i => 170 + i * 108;
function screenRowAt(px, py) { if (px < 500) return -1; for (let i = 0; i < 4; i++) if (Math.abs(py - SCREEN_ROW(i)) < 52) return i; return -1; }
function drawScreenTexture(g, E, now) {
  const F = FONT_BODY, q = E.qs[Math.min(E.qi, E.qs.length - 1)], cyan = '#2fd3dd';
  if (q && q.kind === 'speak') { // AI 면접: 화면 속 면접관이 상황을 읽어 주고, 내 얼굴이 작은 창으로 보인다
    const sp = E.sp && E.sp.q === q ? E.sp : { t: 0, said: 0 }, pr = tune.aiiv_present, th = pr + tune.aiiv_think, gz = E.gaze || 0, bad = gz >= tune.gaze_warn;
    g.textBaseline = 'alphabetic'; g.fillStyle = '#111318'; g.fillRect(0, 0, SCREEN_W, SCREEN_H);
    g.fillStyle = '#1e2a44'; g.fillRect(0, 0, SCREEN_W, 74); g.fillStyle = '#e9ecf3'; g.font = `800 30px ${F}`; g.textAlign = 'left'; g.fillText('AI 역량검사  |  상황 면접', 28, 48);
    g.textAlign = 'right'; g.fillText(`${E.qi + 1} / ${E.qs.length} 문항`, SCREEN_W - 28, 48);
    g.fillStyle = '#1e2a44'; g.beginPath(); g.arc(120, 190, 78, 0, 7); g.fill(); g.lineWidth = 6; g.strokeStyle = '#5fb0ff'; g.stroke();
    g.fillStyle = '#5fb0ff'; const blink = Math.floor(now * 0.7) % 5 === 0 ? 4 : 22; g.fillRect(84, 180 - blink / 2, 22, blink); g.fillRect(134, 180 - blink / 2, 22, blink);
    g.fillStyle = '#e9ecf3'; g.textAlign = 'left'; let size = 40, lines; for (;;) { g.font = `800 ${size}px ${F}`; lines = wrapCanvas(g, q.q, 720); if (lines.length * (size + 12) <= 230 || size <= 26) break; size -= 4; }
    lines.forEach((ln, i) => g.fillText(ln, 230, 150 + i * (size + 12)));
    g.fillStyle = '#f0c53a'; g.font = `800 30px ${F}`; g.fillText(E.start > 0 ? '곧 시작합니다' : sp.t < pr ? '상황을 듣고 있습니다' : sp.t < th ? `생각할 시간 ${Math.ceil(th - sp.t)}초` : '답변을 말해 주세요', 230, 360);
    g.fillStyle = '#3b332b'; g.fillRect(720, 300, 230, 140); g.lineWidth = 6; g.strokeStyle = bad ? '#e23b3b' : '#5fb0ff'; g.strokeRect(720, 300, 230, 140);
    g.fillStyle = '#d9b08c'; g.fillRect(807, 316, 56, 62); g.fillStyle = '#3a4a6a'; g.fillRect(785, 378, 100, 62);
    g.fillStyle = '#1b1d26'; const dy = E.holding ? 14 : 0; g.fillRect(817, 336 + dy, 12, 8); g.fillRect(841, 336 + dy, 12, 8); // 대본을 볼 때는 눈이 아래로 내려간다
    g.fillStyle = bad ? '#e23b3b' : '#9aa6bd'; g.font = `800 24px ${F}`; g.fillText(bad ? '화면을 봐 주세요' : gz > 0 ? '시선 이탈 감지' : '시선 정상', 230, 420);
    return;
  }
  g.textBaseline = 'alphabetic'; g.fillStyle = '#f4f6fa'; g.fillRect(0, 0, SCREEN_W, SCREEN_H);
  g.fillStyle = '#1d3557'; g.fillRect(0, 0, SCREEN_W, 74);
  g.fillStyle = '#ffffff'; g.font = `800 30px ${F}`; g.textAlign = 'left'; g.fillText('TOEFL iBT  |  Reading', 28, 48);
  g.textAlign = 'center'; g.fillText(`Question ${E.qi + 1} of ${E.qs.length}`, SCREEN_W / 2 + 60, 48);
  const sec = Math.max(0, Math.ceil(E.timeLeft)); g.textAlign = 'right'; g.fillText(`${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`, SCREEN_W - 28, 48);
  g.fillStyle = '#dfe4ec'; g.fillRect(488, 92, 4, SCREEN_H - 120);
  g.fillStyle = '#c8ced8'; for (let i = 0; i < 7; i++) g.fillRect(36, 330 + i * 34, 400 - (i * 53) % 140, 14); // 지문(흐릿한 줄)
  g.fillStyle = '#1d2433'; g.textAlign = 'left';
  let size = 44, lines; for (;;) { g.font = `800 ${size}px ${F}`; lines = wrapCanvas(g, q.q, 420); if (lines.length * (size + 12) <= 200 || size <= 26) break; size -= 4; }
  lines.forEach((ln, i) => g.fillText(ln, 36, 140 + i * (size + 12)));
  q.choices.forEach((t, i) => {
    const y = SCREEN_ROW(i), marked = E.answers[E.qi] === i;
    g.strokeStyle = '#1d3557'; g.lineWidth = 3; g.beginPath(); g.arc(540, y, 20, 0, 7); g.stroke();
    if (marked) { g.fillStyle = '#1d3557'; g.beginPath(); g.arc(540, y, 12, 0, 7); g.fill(); }
    g.fillStyle = '#1d2433'; g.font = `700 40px ${F}`; g.fillText(String(t), 580, y + 14);
  });
  if (E.start > 0) return;
  const strikes = Math.min(2, q.pre ? 2 : Math.floor(E.scan * 3 + 1e-6));
  for (let j = 0; j < strikes; j++) { const y = SCREEN_ROW(q.elim[j]); g.fillStyle = cyan; g.fillRect(574, y - 4, 360, 6); }
  if (E.ai && !E.fb) { const y = SCREEN_ROW(q.aiPick); g.lineWidth = 6; g.strokeStyle = cyan; g.strokeRect(506, y - 48, SCREEN_W - 530, 96); g.fillStyle = cyan; g.textAlign = 'right'; g.font = `800 32px ${F}`; g.fillText(`AI ${q.conf}%`, SCREEN_W - 36, y - 18); }
  if ((E.holding || E.scan > 0) && !E.ai && !E.fb) { g.fillStyle = cyan; g.globalAlpha = 0.7; g.fillRect(500, 112 + ((now * 380) % 440), SCREEN_W - 520, 4); g.globalAlpha = 1; g.lineWidth = 4; g.strokeStyle = cyan; g.strokeRect(500, 110, SCREEN_W - 520, 446); }
}

// ---- 마주 앉는 시험: 안경이 띄우는 AR 카드 (문제·보기 넷) ----
function arCardRect(E, k) {
  const q = E.qs[Math.min(E.qi, E.qs.length - 1)], lines = q ? (q.kind === 'speak' && E.T.mech.includes('gaze') ? ['내 AI의 대본'] : wrapKit(k, q.q, 560, 12)) : [''];
  const sp = q && q.kind === 'speak', h = 16 + lines.length * 16 + (sp ? q.lines.length * 15 + 8 : 40), w = 584, x = (640 - w) / 2, y = (sp ? 353 : 346) - h;
  return { x, y, w, h, lines };
}
function wrapKit(k, str, maxW, size) {
  const out = []; let cur = '';
  for (const w of String(str).split(' ')) { const t = cur ? cur + ' ' + w : w; if (k.TW(t, size, 800) <= maxW || !cur) cur = t; else { out.push(cur); cur = w; } }
  if (cur) out.push(cur); return out.slice(0, 3);
}
function wrapSent(k, str, maxW, size, each) { // 자막 줄바꿈: 문장 끝(. ? !)에서 끊는다 (each: 짧아도 문장마다 줄을 바꾼다). 한 문장이 한 줄보다 길 때만 그 문장을 두 줄 길이가 비슷해지는 곳에서 나눈다
  const s = String(str), tw = t => k.TW(t, size, 800); if (!each && tw(s) <= maxW) return [s];
  const out = []; let cur = '';
  for (const sen of s.replace(/([.?!])\s+/g, '$1\n').split('\n')) { const t = cur ? cur + ' ' + sen : sen;
    if (!each && tw(t) <= maxW) { cur = t; continue; } if (cur) out.push(cur);
    if (tw(sen) <= maxW) { cur = sen; continue; }
    const w = sen.split(' '); let best = 1, bw = Infinity; for (let i = 1; i < w.length; i++) { const m = Math.max(tw(w.slice(0, i).join(' ')), tw(w.slice(i).join(' '))); if (m < bw) { bw = m; best = i; } }
    out.push(w.slice(0, best).join(' ')); cur = w.slice(best).join(' '); }
  if (cur) out.push(cur); return out;
}
function drawArCard(k, L, E, now, H) {
  const { R, T } = k, C = PAL, q = E.qs[Math.min(E.qi, E.qs.length - 1)];
  E.arRows = [];
  if (!q || E.breakT > 0) return;
  const c = arCardRect(E, k);
  k.b.globalAlpha = 0.78; R(c.x, c.y, c.w, c.h, '#06161a'); k.b.globalAlpha = 1; k.frame(c.x, c.y, c.w, c.h, H.c, 1);
  R(c.x, c.y, 10, 2, H.c); R(c.x, c.y, 2, 10, H.c); R(c.x + c.w - 10, c.y + c.h - 2, 10, 2, H.c); R(c.x + c.w - 2, c.y + c.h - 10, 2, 10, H.c);
  if (q.kind === 'wine') { const red = q.color === 'red'; R(c.x + 10, c.y + 8, 8, 10, red ? '#8a1a2a' : '#e8d070'); k.frame(c.x + 9, c.y + 7, 10, 12, '#dfe8f2', 1); }
  c.lines.forEach((ln, i) => T(ln, c.x + (q.kind === 'wine' ? 26 : 12), c.y + 14 + i * 16, 12, C.white, 'left', 800));
  if (q.kind === 'speak') { // 면접: 읽은 데까지만 글자가 보이고, 말한 부분은 흐려진다
    const sp = E.sp && E.sp.q === q ? E.sp : { read: 0, said: 0, stam: 0, um: false }, y0 = c.y + 14 + c.lines.length * 16 + 4, x0 = c.x + 22, cl = (v, i) => Math.max(0, Math.min(1, v - i));
    q.lines.forEach((ln, i) => { const y = y0 + i * 15, n = Math.round(ln.length * cl(sp.read, i)), ns = Math.min(n, Math.round(ln.length * cl(sp.said, i))), w1 = k.TW(ln.slice(0, ns), 12, 800), w2 = k.TW(ln.slice(ns, n), 12, 800);
      R(c.x + 12, y - 4, 3, 9, n >= ln.length ? H.c : '#2a3a40');
      if (ns > 0) T(ln.slice(0, ns), x0, y, 12, '#5a8a74', 'left', 800);
      if (n > ns) T(ln.slice(ns, n), x0 + w1, y, 12, H.c, 'left', 800);
      if (n < ln.length) T('·'.repeat(ln.length - n), x0 + w1 + w2 + (n ? 3 : 0), y, 12, '#34504a', 'left', 800); });
    if (E.T.mech.includes('gaze')) { // AI 면접: 시선 이탈 다섯 칸과 지금 단계
      const lim = tune.gaze_limit + G.gear.gazefix * 0.5, gzv = E.gaze || 0, t0 = sp.t || 0, pr = tune.aiiv_present, th2 = pr + tune.aiiv_think;
      T('시선 이탈', c.x + c.w - 250, c.y + 14, 10, gzv >= tune.gaze_warn ? C.bad : '#8fa0b8', 'left', 800);
      for (let i = 0; i < 5; i++) R(c.x + c.w - 198 + i * 12, c.y + 10, 10, 8, gzv > i * lim / 5 ? (i >= 3 ? C.bad : i >= 2 ? '#f0c53a' : H.c) : '#2a3a40');
      if (t0 < pr) { k.b.globalAlpha = 0.85; R(c.x + 10, y0 - 6, 300, q.lines.length * 15 + 4, '#06161a'); k.b.globalAlpha = 1; T('대본 작성 중…', x0, y0 + 8, 12, '#5a8a74', 'left', 800); }
    }
    const left = Math.max(0, Math.min(1, 1 - sp.stam / tune.speak_stam)); T('유창함', c.x + c.w - 100, c.y + 14, 10, '#8fa0b8', 'left', 800);
    for (let i = 0; i < 6; i++) R(c.x + c.w - 62 + i * 8, c.y + 10, 6, 8, i < Math.ceil(left * 6 - 1e-6) ? (left < 0.34 ? C.bad : H.c) : '#2a3a40');
    const li = Math.min(q.lines.length - 1, Math.floor(sp.said + 1e-6)), said = q.lines[li].slice(0, Math.round(q.lines[li].length * cl(sp.said, li))), full = sp.said >= li + 1 - 1e-6 && li > 0 ? q.lines[li] : said;
    if (!E.fb && E.start <= 0) { if (sp.um) k.SUB(`"${said || ''}… 어…"`, 320, c.y - 16, 13); else if (said) k.SUB(`"${said}"`, 320, c.y - 16, 13); }
    if (E.holding && !E.fb && E.start <= 0) { k.b.globalAlpha = 0.6; R(c.x + 4, c.y + 4 + ((now * 90) % (c.h - 8)), c.w - 8, 1, H.c); k.b.globalAlpha = 1; }
    return;
  }
  const bw = Math.floor((c.w - 24 - 18) / 4), by = c.y + c.h - 34;
  const strikes = E.start > 0 ? 0 : Math.min(2, q.pre ? 2 : Math.floor(E.scan * 4 + 1e-6)), struck = q.elim.slice(0, strikes);
  drawAnswerPanel(k, L, E, now, q);
  q.choices.forEach((t, i) => {
    const bx = c.x + 12 + i * (bw + 6), marked = E.answers[E.qi] === i, ai = E.ai && !E.fb && q.aiPick === i, gone = struck.includes(i);
    R(bx, by, bw, 26, marked ? H.c : ai ? '#0f3a40' : '#141a24'); k.frame(bx, by, bw, 26, ai ? H.c : gone ? '#2a3a40' : '#4a5a6a', ai ? 2 : 1);
    let size = 11; while (k.TW(t, size, 800) > bw - 22 && size > 8) size--;
    T(String(i + 1), bx + 8, by + 13, 10, marked ? C.dark : '#8fa0b8', 'center', 800);
    T(t, bx + 16, by + 13, size, marked ? C.dark : gone ? '#4a5a62' : C.white, 'left', 800);
    if (gone) R(bx + 14, by + 13, Math.min(bw - 18, k.TW(t, size, 800) + 4), 2, H.c);
    if (ai) { k.TO(`AI ${q.conf}%`, bx + bw - 2, by - 8, 10, H.c, 'right', '#06161a'); }
    E.arRows.push({ x: bx, y: by, w: bw, h: 26, i });
  });
  if ((E.holding || E.scan > 0) && !E.ai && !E.fb && E.start <= 0) { k.b.globalAlpha = 0.6; R(c.x + 4, c.y + 4 + ((now * 90) % (c.h - 8)), c.w - 8, 1, H.c); k.b.globalAlpha = 1; }
}
function arRowAt(E, x, y) { for (const r of E.arRows || []) if (x >= r.x && x <= r.x + r.w && y >= r.y - 4 && y <= r.y + r.h + 4) return r.i; return -1; }

// ---- 렌즈 가장자리 빛 (경고·의심도용, 방향·색마다 한 번 계산) ----
const GLOW_CACHE = {};
function lensGlow(side, hex) {
  const id = side + hex;
  if (GLOW_CACHE[id]) return GLOW_CACHE[id];
  const L = LAYOUTS.land, c = document.createElement('canvas'); c.width = L.W; c.height = L.H;
  const g = c.getContext('2d'), img = g.createImageData(L.W, L.H), d = img.data, [r, gg, bb] = hexRgb(hex);
  for (let y = 0; y < L.H; y++) for (let x = 0; x < L.W; x++) {
    if (side === 'L' && x > L.W * 0.4) continue;
    if (side === 'R' && x < L.W * 0.6) continue;
    if (side === 'T' && y > L.H * 0.4) continue;
    const f = lensF(L.lenses, x + 0.5, y + 0.5);
    if (f >= 1 || f < 0.6) continue;
    const a = (f - 0.6) / 0.4, i = (y * L.W + x) * 4;
    if (((x + y) & 1) && a < 0.55) continue;
    d[i] = r; d[i + 1] = gg; d[i + 2] = bb; d[i + 3] = Math.round(255 * Math.min(1, a * 1.15));
  }
  g.putImageData(img, 0, 0);
  return (GLOW_CACHE[id] = c);
}

// ---- 장비 단계별 HUD: 장비가 바뀌면 화면이 바뀐다 ----
// case(필통 속 폰) · eraser(지우개 액정): 맨눈이라 HUD가 없다. used(중고 안경)부터 안경 HUD.
function hudStage(E) { if (E.stageForce) return E.stageForce; const lv = E.gear.lens; if (!E.ar) return lv >= 1 ? 'eraser' : 'case'; return lv >= 7 ? 'brain' : lv >= 6 ? 'contact' : lv >= 5 ? 'mil' : lv >= 4 ? 'proto' : 'used'; }
const HUD_INK = { used: '#74ff8e', proto: '#7fe9ff', mil: '#ffb23a', contact: '#7fe9ff', brain: '#ffd678' };
function choiceConf(q) { // 보기 네 개의 확신도 (고른 보기는 q.conf, 나머지는 남은 몫을 나눈다)
  const rest = 100 - q.conf, w = [0, 1, 2, 3].map(i => i === q.aiPick ? 0 : (q.elim.includes(i) ? 1 : 3) + ((i * 7 + q.aiPick * 3) % 3)), sum = w.reduce((a, b) => a + b, 0) || 1;
  const out = w.map(v => Math.floor(rest * v / sum)); out[q.aiPick] = q.conf; return out;
}
function drawStageHud(k, L, E, now, ST, INK, sec, pl, live, q) {
  const { R, T } = k, M = k.M, W = L.W, HH = L.H, tier = E.T, C = PAL;
  const mm = String(Math.floor(sec / 60)).padStart(2, '0'), ss = String(sec % 60).padStart(2, '0'), qn = Math.min(E.qi + 1, E.qs.length), qt = E.qs.length, q2 = n => String(n).padStart(2, '0');
  const eyeM = tier.mech.includes('eyeline'), SL = eyeM ? '시선' : '의심', sus = Math.max(0, Math.min(1, eyeM ? 1 - (E.eye == null ? 1 : E.eye) : E.sus)), sp = Math.round(sus * 100), low = E.timeLeft < 10 && Math.floor(now * 4) % 2, part = tier.parts ? ` · ${tier.parts[E.part]}` : ''; // [AI 대면 면접] 의심 칸 자리에 시선 게이지
  const frac = E.timeTotal ? Math.max(0, Math.min(1, E.timeLeft / E.timeTotal)) : 1, picked = E.ai && !E.fb && q, scanning = E.scan > 0 && !E.ai && !E.fb;
  if (ST === 'case' || ST === 'eraser') { // 맨눈: 남은 시간과 문항 번호만. 의심은 화면 가장자리가 붉어지는 것뿐
    k.SUB(E.finalQ ? '--:--' : `${Math.floor(sec / 60)}:${ss}`, W - 18, 20, 14, low ? '#ff6a6a' : '#ffffff', 'right');
    k.SUB(`${qn} / ${qt}${part}`, W - 18, 36, 9, '#e8e4da', 'right');
  } else if (ST === 'used') { // 중고 AI 안경: 단색 초록, 굵은 글자, 죽은 화소, 가끔 밀리는 화면
    const x0 = 62, y0 = 40;
    M('LENS-OS 0.9b', x0, y0, 9, INK, 'left', 700); const bat = Math.round(frac * 100), cells = Math.ceil(frac * 3);
    M(`BAT ${'▮'.repeat(cells)}${'▯'.repeat(3 - cells)} ${bat}%`, x0, y0 + 13, 9, bat < 20 && Math.floor(now * 3) % 2 ? '#ff5a5a' : INK, 'left', 700);
    M(E.finalQ ? '--:--' : `${mm}:${ss}`, W - x0, y0 + 2, 18, low ? '#ff5a5a' : INK, 'right', 700); M(`Q ${q2(qn)}/${q2(qt)}${part}`, W - x0, y0 + 18, 8, INK, 'right', 700);
    const n = 8, on = Math.round(sus * n), bx = W / 2 - 44;
    M(SL, bx - 8, y0, 9, E.rising ? '#ff5a5a' : INK, 'right', 700); for (let i = 0; i < n; i++) { k.b.globalAlpha = i < on ? 1 : 0.3; R(bx + i * 9, y0 - 5, 6, 10, i < on && sp >= 60 ? '#ff5a5a' : INK); } k.b.globalAlpha = 1; M(`${sp}%`, bx + n * 9 + 4, y0, 9, INK, 'left', 700);
    const gl = (now * 0.37) % 1; if (gl < 0.045) { k.b.globalAlpha = 0.35; R(0, 80 + Math.floor(((now * 7.3) % 1) * 200), W, 5, INK); R(0, 150 + Math.floor(((now * 3.1) % 1) * 150), W, 2, INK); k.b.globalAlpha = 1; } // 화면 밀림
  } else if (ST === 'proto') { // 시제품 안경: 얇은 선, 흰색과 하늘색
    const x0 = 40, y0 = 30, ink = '#ffffff';
    k.disc(x0, y0, 2.5, INK); M(`Lens Pro · ${CONFIG.models[E.gear.model] ? CONFIG.models[E.gear.model].name : 'AI'} 연결됨`, x0 + 8, y0 + 0.5, 7.5, ink, 'left', 500);
    M(E.finalQ ? '--:--' : `${Math.floor(sec / 60)}:${ss}`, W - x0, y0 + 2, 16, low ? '#ff6a6a' : ink, 'right', 500); M(`${qn} / ${qt}${part}`, W - x0, y0 + 17, 7.5, '#dfe6ee', 'right', 500);
    const bw = 130, bx = W / 2 - bw / 2;
    M(SL, bx - 8, y0, 7.5, ink, 'right', 500); k.b.globalAlpha = 0.35; R(bx, y0 - 1, bw, 1.5, ink); k.b.globalAlpha = 1; R(bx, y0 - 1, Math.round(bw * sus), 1.5, sp >= 60 ? '#ff6a6a' : '#ffcf5a'); M(`${sp}%`, bx + bw + 8, y0, 7.5, E.rising ? '#ff6a6a' : ink, 'left', 500);
  } else if (ST === 'mil') { // 군용 정찰 렌즈: 호박색 전술 화면. 감독관을 표적으로 잡고, 답은 어디를 봐도 떠 있다
    k.b.globalAlpha = 0.55; for (const [cx, cy, sx, sy] of [[0, 0, 1, 1], [W, 0, -1, 1], [0, HH, 1, -1], [W, HH, -1, -1]]) k.poly([[cx, cy], [cx + sx * 70, cy], [cx, cy + sy * 70]], '#000000'); k.b.globalAlpha = 1;
    const off = E.view === 'left' ? 2 : E.view === 'right' ? -2 : 0, dirs = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE', 'S'];
    for (let i = -2; i <= 2; i++) { const d = dirs[(4 + i - off + 8) % 8]; M(d, W / 2 + i * 56, 20, 8, i === 0 ? '#ffffff' : INK, 'center', 700); if (i < 2) M('·', W / 2 + i * 56 + 28, 20, 8, INK, 'center', 700); }
    R(W / 2 - 140, 28, 280, 1, INK); R(W / 2, 28, 1, 5, '#ffffff');
    if (!(eyeM && (E.ivLook || 0) > 0.3)) { k.ring(W / 2, HH / 2, 14, INK); R(W / 2 - 1, HH / 2 - 1, 2, 2, INK); } // [AI 대면 면접] 대본 창을 볼 때는 가운데 조준점을 치운다 (글자와 겹침)
    const tx = 30, ty = 96, th = 150; k.frame(tx, ty, 7, th, INK, 1); R(tx + 1, ty + th - Math.round((th - 2) * sus) - 1, 5, Math.round((th - 2) * sus), sp >= 60 ? '#ff5a5a' : INK);
    M(eyeM ? 'GAZE' : 'THREAT', tx + 12, ty + th - 14, 7.5, E.rising ? '#ff5a5a' : INK, 'left', 700); M(`${sp}%`, tx + 12, ty + th - 4, 9, E.rising ? '#ff5a5a' : INK, 'left', 700);
    if (live && E.layout === 'room' && WORLD.staffRects) WORLD.staffRects().forEach((r, n) => { // 표적 꺾쇠
      const s = E.staff[r.i]; if (!s || r.h < 30) return; const col = s.phase === 'watch' ? '#ff5a5a' : INK, x0 = Math.round(r.x), y0 = Math.round(r.y), x1 = Math.round(r.x + r.w), y1 = Math.round(Math.min(HH - 6, r.y + r.h)), l = 10;
      for (const [cx, cy, sx, sy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]) { R(sx > 0 ? cx : cx - l, sy > 0 ? cy : cy - 1.5, l, 1.5, col); R(sx > 0 ? cx : cx - 1.5, sy > 0 ? cy : cy - l, 1.5, l, col); }
      const lx = x1 + 6 < W - 110 ? x1 + 6 : x0 - 6, al = x1 + 6 < W - 110 ? 'left' : 'right';
      M(`TGT-${q2(n + 1)} ${s.name || '감독관'}`, lx, y0 + 6, 7.5, col, al, 700); M((s.phase === 'watch' ? '주시 중' : s.phase === 'tell' ? '돌아보는 중' : s.phase === 'emp' ? 'EMP 조준' : s.phase === 'walk' ? '이동 중' : '등 돌림') + (s.dur > 0 && s.phase !== 'walk' ? ` ${Math.max(0, s.dur - s.t).toFixed(1)}s` : ''), lx, y0 + 17, 7.5, col, al, 500);
    });
    const g1 = '#9dff8a', gx = 30, gy = HH - 46;
    if (picked) { M('정답 추정', gx, gy, 7.5, '#c8f4d8', 'left', 500); const w1 = M(`ANS ${q.aiPick + 1}`, gx, gy + 18, 19, g1, 'left', 700); M(`CONF ${q.conf}`, gx + w1 + 8, gy + 20, 10, g1, 'left', 700); }
    else if (scanning) { M(`SCAN ${Math.round(E.scan * 100)}%`, gx, gy + 10, 10, g1, 'left', 700); k.b.globalAlpha = 0.35; R(gx, gy + 20, 110, 3, '#f4f1e8'); k.b.globalAlpha = 1; R(gx, gy + 20, Math.round(110 * E.scan), 3, g1); }
    M(E.finalQ ? 'T---:--' : `T-${mm}:${ss}`, W - 30, HH - 34, 17, low ? '#ff5a5a' : INK, 'right', 700); M(`Q ${q2(qn)}/${q2(qt)}${part}`, W - 30, HH - 19, 7.5, INK, 'right', 500);
  } else if (ST === 'contact') { // 콘택트렌즈: 시야 가장자리의 얇은 호 두 개 (예전의 9초마다 어두워지던 눈 깜빡임은 눈이 아파 뺐다)
    const b = k.b, S = k.S || HUD_SCALE;
    { const arc = (y0, cy, f, col) => { b.save(); b.setTransform(S, 0, 0, S, 0, 0); b.lineWidth = 1.5; b.strokeStyle = 'rgba(255,255,255,0.3)'; b.beginPath(); b.moveTo(W * 0.2, y0); b.quadraticCurveTo(W / 2, cy, W * 0.8, y0); b.stroke();
        b.beginPath(); b.rect(W * 0.2, 0, W * 0.6 * f, HH); b.clip(); b.strokeStyle = col; b.beginPath(); b.moveTo(W * 0.2, y0); b.quadraticCurveTo(W / 2, cy, W * 0.8, y0); b.stroke(); b.restore(); };
      arc(46, -6, frac, low ? '#ff6a6a' : '#ffffff'); arc(HH - 40, HH + 8, sus, sp >= 60 ? '#ff6a6a' : '#ffcf5a');
      const along = (str, y0, cy, tm, size, col, dy) => { // 호를 따라 휘어지는 글자: 계기 눈금처럼 호에 붙어 읽힌다
        b.save(); b.setTransform(S, 0, 0, S, 0, 0); b.font = `700 ${size}px "Galmuri11","SF Mono","Menlo","Consolas","Roboto Mono",sans-serif`; b.textAlign = 'center'; b.textBaseline = 'middle';
        const ws = [...str].map(ch => b.measureText(ch).width + 0.6), tot = ws.reduce((x, y) => x + y, 0); let t = tm - tot / 2 / (W * 0.6);
        [...str].forEach((ch, i) => { const tc = t + ws[i] / 2 / (W * 0.6), x = W * (0.2 + 0.6 * tc), y = (1 - tc) * (1 - tc) * y0 + 2 * (1 - tc) * tc * cy + tc * tc * y0, ang = Math.atan2(2 * (cy - y0) * (1 - 2 * tc), W * 0.6);
          b.save(); b.translate(x, y + dy); b.rotate(ang); b.fillStyle = 'rgba(0,0,0,0.55)'; b.fillText(ch, 0.8, 0.8); b.fillStyle = col; b.fillText(ch, 0, 0); b.restore(); t += ws[i] / (W * 0.6); });
        b.restore(); };
      along(E.finalQ ? '--:--' : `${mm}:${ss}`, 46, -6, 0.5, 17, low ? '#ff6a6a' : '#ffffff', 21);                       // 위 호 = 남은 시간. 숫자가 호 안쪽에 크게
      along(`${q2(qn)} / ${q2(qt)}`, 46, -6, 0.87, 10, '#e8e4da', 13); along('TIME', 46, -6, 0.12, 9, 'rgba(255,255,255,0.75)', 13);
      if (pl >= 3 && live && E.layout === 'room') { // 후방 카메라: 따로 된 네모 칸 대신, 위 호의 시계 양옆에 마디 둘 (왼쪽 뒤 · 오른쪽 뒤). 비면 빈 고리, 있으면 흰색, 돌아보려 하면 노랑, 보고 있으면 빨강
        const back = E.staff.filter(s => !s.fixed && !s.out && !(s.blink > 0) && s.phase !== 'help' && s.u < 0.37);
        for (const [sd, tm] of [['L', 0.355], ['R', 0.645]]) {
          const ss = back.filter(s => s.side === sd), w = ss.some(s => s.phase === 'watch') ? 'watch' : ss.some(s => s.phase === 'tell') ? 'tell' : ss.length ? 'on' : 'off';
          const x = W * (0.2 + 0.6 * tm), y = (1 - tm) * (1 - tm) * 46 + 2 * (1 - tm) * tm * -6 + tm * tm * 46, c1 = w === 'watch' ? '#ff5a5a' : w === 'tell' ? '#ffcf5a' : '#ffffff';
          b.save(); b.setTransform(S, 0, 0, S, 0, 0);
          if (w === 'watch' || w === 'tell') { const gr = b.createRadialGradient(x, y, 2, x, y, 18); gr.addColorStop(0, w === 'watch' ? 'rgba(255,90,90,0.6)' : 'rgba(255,207,90,0.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); b.fillStyle = gr; b.fillRect(x - 18, y - 18, 36, 36); }
          b.beginPath(); b.arc(x, y, 5.5, 0, 7); b.fillStyle = w === 'off' ? 'rgba(8,10,14,0.9)' : c1; b.fill(); b.lineWidth = 1.5; b.strokeStyle = w === 'off' ? 'rgba(255,255,255,0.6)' : c1; b.stroke();
          if (w === 'watch') { b.beginPath(); b.arc(x, y, 9, 0, 7); b.lineWidth = 1.2; b.stroke(); }
          b.restore(); along('후방', 46, -6, tm, 8, w === 'off' ? 'rgba(255,255,255,0.65)' : c1, 14); } }
      if (!E.caught && !E.result && !(E.start > 0)) along(`${SL} ${sp}%`, HH - 40, HH + 8, 0.5, 13, sp >= 60 ? '#ff6a6a' : sp >= 30 ? '#ffcf5a' : '#ffffff', -13);     // 아래 호 = 의심도. 호 바로 위에 (적발 화면에서는 사유와 겹치지 않게 지운다)
      if (E.result || E.start > 0) { /* 결과 화면의 아래 메뉴(재응시·다음 시험·귀가), 시작 안내 방송의 둘째 줄(장비 메모)과 겹치지 않게 호 위 글씨는 비운다 */ } else if (eyeM) { const A = E.iv; if (A && A.q === q && A.t >= A.ask) along(`대답 ${Math.round(A.wi / A.words.length * 100)}%`, HH - 40, HH + 8, 0.13, 9, 'rgba(255,255,255,0.75)', -11); }
      else along(picked ? `ANS ${q.aiPick + 1}` : scanning ? `SCAN ${Math.round(E.scan * 100)}%` : 'READY', HH - 40, HH + 8, 0.13, 9, picked ? '#8dffa8' : 'rgba(255,255,255,0.75)', -11); }
  } else if (ST === 'brain') { // 뇌 임플란트: 숫자도 틀도 없다. 속마음 한 줄과 심장 박동선
    M(E.finalQ ? '시간이 느껴지지 않는다' : sec > 5 ? `${sec}초쯤 남았다는 느낌` : '거의 끝났다는 느낌', W - 22, 20, 9, low ? '#ff9a9a' : '#ffd678', 'right', 700); // 생각 기록과 같은 글씨: 금색이 지금 값, 흐린 흰색이 딸린 줄
    k.b.globalAlpha = 0.6; M(`${qn}번째 문제${part}`, W - 22, 33, 7.5, '#ffffff', 'right', 700); k.b.globalAlpha = 1;
    const y = HH - 12, sp2 = 60 + sus * 240, px = (now * sp2) % (W + 60) - 30; k.b.globalAlpha = 0.35 + sus * 0.5; R(0, y, W, 1, '#ff5a5a');
    k.poly([[px - 12, y], [px - 6, y - 8 - sus * 8], [px - 3, y], [px, y + 9 + sus * 6], [px + 4, y - 4], [px + 8, y], [px + 8, y + 1.5], [px - 12, y + 1.5]], '#ff5a5a'); k.b.globalAlpha = 1;
    if (live && picked && !E.finalQ) k.SUB(q.conf >= 70 ? `…${q.aiPick + 1}번이다. 왜인지는 모르겠다.` : `…${q.aiPick + 1}번인 것 같다.`, W / 2, HH - 34, 13, '#ffffff', 'center');
    else if (live && scanning) k.SUB('…'.repeat(1 + Math.floor(E.scan * 3)), W / 2, HH - 34, 13, '#ffffff', 'center');
    if (live && scanning && !E.rising && !E.staff.some(s => s.phase === 'watch' || s.phase === 'tell' || omenOf(s) > 0)) { // 안전할 때: 금빛 줄이 시야를 훑어 내린다
      const yy = 30 + ((now * 150) % (HH - 70)); k.b.globalAlpha = 0.16; R(0, yy - 7, W, 7, '#ffd678'); k.b.globalAlpha = 0.75; R(0, yy, W, 1.2, '#ffe9a8'); k.b.globalAlpha = 1; }
  }
}
// ---- 장비 단계별로 더 붙는 화면: 안경이 좋아질수록 보여 주는 것이 늘어난다 (전부 실제 값만 보여 준다) ----
function staffWord(s) { return s.out ? '자리 비움' : s.phase === 'watch' ? '주시 중' : s.phase === 'tell' ? '돌아보는 중' : s.phase === 'check' ? '검사 중' : s.phase === 'help' ? '다른 자리' : s.phase === 'peek' ? '안 보임' : s.phase === 'emp' ? 'EMP 조준' : s.phase === 'walk' ? '이동 중' : '등 돌림'; }
function staffCol(s) { return s.out || s.phase === 'help' ? '#9aa0aa' : s.phase === 'watch' ? '#ff5a5a' : s.phase === 'tell' || s.phase === 'check' || s.phase === 'peek' ? '#ffcf5a' : s.phase === 'emp' ? '#7fe9ff' : '#9dff8a'; }
function hudDraw(k, fn) { const b = k.b; b.save(); try { fn(b); } catch (_) { } b.restore(); } // 그리다 실패해도 게임은 멈추지 않는다
function rrect(b, x, y, w, h, r) { b.beginPath(); b.moveTo(x + r, y); b.arcTo(x + w, y, x + w, y + h, r); b.arcTo(x + w, y + h, x, y + h, r); b.arcTo(x, y + h, x, y, r); b.arcTo(x, y, x + w, y, r); b.closePath(); }
const NEURO = (() => { const out = []; let s = 7; const r = () => { s = (Math.imul(s, 1103515245) + 12345) >>> 0; return (s >>> 8) / 16777216; }; for (let i = 0; i < 11; i++) out.push([8 + r() * 96, 78 + i * 22 + r() * 10]); return out; })();
function drawStageFx(k, L, E, now, ST, INK, live, q) {
  if (!live || E.finalQ || (q && q.kind === 'speak')) return;
  const { R } = k, M = k.M, T = k.T, W = L.W, HH = L.H, b = k.b, picked = E.ai && !E.fb && q && q.aiPick != null, scanning = E.scan > 0 && !E.ai && !E.fb, room = E.layout === 'room';
  const mdl = CONFIG.models[E.gear.model] ? CONFIG.models[E.gear.model].name : 'AI', st = E.staff.filter(s => s.type !== 'webcam'), pct = Math.round(E.scan * 100);
  const left = s => s.dur > 0 && (s.phase === 'stand' || s.phase === 'watch' || s.phase === 'tell') ? Math.max(0, s.dur - s.t) : null, frac = s => { const l = left(s); return l == null ? 0 : Math.min(1, l / s.dur); };
  const nElim = picked ? 2 : scanning ? Math.min(2, Math.floor(E.scan * 3 + 1e-6)) : 0, elim = q && q.elim ? q.elim.slice(0, nElim) : [];
  if (ST === 'used') { // 중고: 왼쪽 아래에 한 줄. 느리고 투박하다
    M(scanning ? `READ ${'▮'.repeat(Math.round(E.scan * 6))}${'▯'.repeat(6 - Math.round(E.scan * 6))}` : picked ? 'READ OK' : 'READY', 62, HH - 44, 9, INK, 'left', 700);
    M(mdl, 62, HH - 31, 7.5, INK, 'left', 700);
  } else if (ST === 'proto') { // 시제품: 얇은 선의 분석 창과 감독관 레이더. 글자에 그림자를 쓰지 않아 번지지 않는다
    const px = W - 174, py = 94, pw = 138, ph = 58;
    hudDraw(k, c => { c.fillStyle = 'rgba(10,28,44,0.5)'; c.fillRect(px, py, pw, ph); c.strokeStyle = INK; c.lineWidth = 1; c.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1); c.fillStyle = INK; c.fillRect(px, py, 2, ph); });
    T('AI 분석', px + 9, py + 9, 7.5, INK, 'left', 700); T(mdl, px + pw - 7, py + 9, 6.5, '#cfe9f2', 'right', 500);
    if (picked) { T(`정답 ${q.aiPick + 1}번`, px + 9, py + 27, 13, '#ffffff', 'left', 700); T(`${q.conf}%`, px + pw - 7, py + 27, 11, INK, 'right', 700); }
    else if (scanning) T(`읽는 중 ${pct}%`, px + 9, py + 27, 10, '#ffffff', 'left', 700); else T('대기 중', px + 9, py + 27, 10, '#cfe9f2', 'left', 500);
    b.globalAlpha = 0.3; R(px + 9, py + 39, pw - 18, 2, '#ffffff'); b.globalAlpha = 1; R(px + 9, py + 39, Math.round((pw - 18) * (picked ? q.conf / 100 : E.scan)), 2, INK);
    for (let i = 0; i < 4; i++) { const x = px + 9 + i * 16, y = py + 48, out = elim.includes(i), hit = picked && i === q.aiPick; hudDraw(k, c => { c.beginPath(); c.arc(x + 4, y, 4.5, 0, 7); if (hit) { c.fillStyle = INK; c.fill(); } else { c.strokeStyle = out ? 'rgba(255,255,255,0.3)' : '#ffffff'; c.lineWidth = 1; c.stroke(); if (out) { c.beginPath(); c.moveTo(x, y - 4); c.lineTo(x + 8, y + 4); c.stroke(); } } }); }
    if (room) { const cx = 74, cy = HH - 84, r = 30; hudDraw(k, c => { c.fillStyle = 'rgba(10,28,44,0.5)'; c.beginPath(); c.arc(cx, cy, r, 0, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke(); c.globalAlpha = 0.4; c.beginPath(); c.arc(cx, cy, 15, 0, 7); c.stroke(); const a = now * 2.2; c.beginPath(); c.moveTo(cx, cy); c.arc(cx, cy, r, a - 0.5, a); c.closePath(); c.fillStyle = INK; c.globalAlpha = 0.18; c.fill(); });
      k.poly([[cx, cy + 6], [cx - 4, cy + 13], [cx + 4, cy + 13]], '#ffffff');
      for (const s of st) { if (s.out) continue; const x = cx + (s.fixed ? 0 : s.side === 'L' ? -13 : 13), y = Math.max(cy - r + 4, Math.min(cy + r - 4, cy + 10 - ((s.fixed ? 1 : s.u) - 0.37) * 48)), c = staffCol(s); k.disc(x, y, 3, c); if (s.phase === 'watch') k.ring(x, y, 5, c); }
      T('감독관 레이더', cx, cy + r + 9, 7, '#ffffff', 'center', 500); }
  } else if (ST === 'mil') { // 군용: 전술 지도(시야 부채꼴), 표적마다 남은 시간 막대, 스캔 가능 창
    b.globalAlpha = 0.06; for (let x = 80; x < W; x += 80) R(x, 0, 1, HH, INK); for (let y = 60; y < HH; y += 60) R(0, y, W, 1, INK); b.globalAlpha = 1;
    hudDraw(k, c => { c.strokeStyle = INK; c.lineWidth = 1.5; c.globalAlpha = 0.8; for (let i = 0; i < 4; i++) { const a = now * 0.8 + i * Math.PI / 2; c.beginPath(); c.arc(W / 2, HH / 2, 22, a, a + 0.7); c.stroke(); } });
    if (room) { const mx = W - 148, my = 92, mw = 118, mh = 92; hudDraw(k, c => { c.fillStyle = 'rgba(24,12,0,0.55)'; c.fillRect(mx, my, mw, mh); c.strokeStyle = INK; c.lineWidth = 1; c.strokeRect(mx + 0.5, my + 0.5, mw - 1, mh - 1);
        c.fillStyle = 'rgba(255,178,58,0.28)'; for (let r = 0; r < 5; r++) for (let cl = 0; cl < 4; cl++) c.fillRect(mx + 30 + cl * 17, my + 14 + r * 15, 9, 5);
        const meX = mx + 30 + 17 + 4, meY = my + 14 + 3 * 15 + 2;
        for (const s of st) { if (s.out) continue; const x = s.fixed ? mx + mw / 2 : s.side === 'L' ? mx + 16 : mx + mw - 16, y = s.fixed ? my + 8 : my + mh - 10 - Math.max(0, Math.min(1, s.u)) * (mh - 22), col = staffCol(s), hot = s.phase === 'watch' || s.phase === 'tell' || s.phase === 'check';
          const a = hot ? Math.atan2(meY - y, meX - x) : (s.fixed ? Math.PI / 2 : s.dir > 0 ? -Math.PI / 2 : Math.PI / 2) + (s.away ? (s.side === 'L' ? -0.9 : 0.9) : 0), len = hot ? 46 : 22;
          c.globalAlpha = hot ? 0.5 : 0.22; c.fillStyle = col; c.beginPath(); c.moveTo(x, y); c.arc(x, y, len, a - 0.38, a + 0.38); c.closePath(); c.fill(); c.globalAlpha = 1; c.beginPath(); c.arc(x, y, 3, 0, 7); c.fill(); }
        c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(meX, meY - 4); c.lineTo(meX - 4, meY + 3); c.lineTo(meX + 4, meY + 3); c.closePath(); c.fill(); });
      T('TAC MAP', mx + 5, my - 6, 7, INK, 'left', 700);
      if (WORLD.staffRects) WORLD.staffRects().forEach(r => { const s = E.staff[r.i]; if (!s || r.h < 30 || left(s) == null) return; const col = s.phase === 'watch' ? '#ff5a5a' : INK, x1 = Math.round(r.x + r.w), x0 = Math.round(r.x), lx = x1 + 6 < W - 110 ? x1 + 6 : x0 - 66, y = Math.round(r.y) + 26; b.globalAlpha = 0.35; R(lx, y, 60, 3, '#ffffff'); b.globalAlpha = 1; R(lx, y, Math.round(60 * frac(s)), 3, col); });
      const busy = st.filter(s => !s.out && (s.phase === 'watch' || s.phase === 'tell' || s.phase === 'check' || s.phase === 'peek')), stand = st.filter(s => !s.out && s.phase === 'stand' && s.dur > 0), eta = stand.length ? Math.min(...stand.map(s => Math.max(0, s.dur - s.t))) : null, etaF = stand.length ? Math.min(...stand.map(frac)) : 1;
      const bw = 128, bx = W - 30 - bw, by = HH - 74, ok = !busy.length, c1 = ok ? '#9dff8a' : '#ff5a5a';
      hudDraw(k, c => { c.fillStyle = 'rgba(8,16,8,0.6)'; c.fillRect(bx, by, bw, 24); c.strokeStyle = c1; c.lineWidth = 1; c.strokeRect(bx + 0.5, by + 0.5, bw - 1, 23); c.fillStyle = c1; c.globalAlpha = ok ? 0.85 : (Math.floor(now * 5) % 2 ? 0.85 : 0.3); c.fillRect(bx + 3, by + 18, Math.round((bw - 6) * (ok ? etaF : 1)), 3); });
      T(ok ? (eta != null ? `SCAN OK  ${eta.toFixed(1)}s` : 'SCAN OK') : 'HOLD · 주시 중', bx + bw / 2, by + 9, 9, c1, 'center', 700); }
    T(`AI ${mdl}`, 30, 86, 7, INK, 'left', 500);
  } else if (ST === 'contact') { // 콘택트렌즈: 테가 없고, 둥근 창과 고리로 보여 준다
    const px = W - 168, py = 92, pw = 140, ph = 84, gx = px + 36, gy = py + 46, conf = picked ? q.conf / 100 : E.scan;
    hudDraw(k, c => { rrect(c, px, py, pw, ph, 16); c.fillStyle = 'rgba(8,44,52,0.42)'; c.fill(); c.strokeStyle = 'rgba(127,233,255,0.9)'; c.lineWidth = 1.2; c.stroke();
      c.lineCap = 'round'; c.lineWidth = 5; c.strokeStyle = 'rgba(255,255,255,0.22)'; c.beginPath(); c.arc(gx, gy, 22, 0, 7); c.stroke(); c.strokeStyle = INK; c.beginPath(); c.arc(gx, gy, 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * conf); c.stroke();
      for (let i = 0; i < 4; i++) { const x = px + 76 + i * 15, y = py + 62, out = elim.includes(i), hit = picked && i === q.aiPick; c.beginPath(); c.arc(x, y, 5.5, 0, 7); c.lineWidth = 1.2; if (hit) { c.fillStyle = INK; c.fill(); } else { c.strokeStyle = out ? 'rgba(255,255,255,0.25)' : '#ffffff'; c.stroke(); } } });
    T(picked ? String(q.aiPick + 1) : scanning ? `${pct}` : '·', gx, gy, picked ? 20 : 11, '#ffffff', 'center', 700);
    T('풀이', px + 72, py + 16, 7.5, INK, 'left', 700); T(picked ? `${q.conf}% 확신` : scanning ? '읽는 중' : '문제를 보면 시작', px + 72, py + 31, 8, '#ffffff', 'left', 700); T(elim.length ? `${elim.map(i => i + 1).join(', ')}번 제외` : mdl, px + 72, py + 45, 6.5, '#d6f4f8', 'left', 500);
    if (room) { st.slice(0, 5).forEach((s, i) => { const x = 30, y = 138 + i * 40, c1 = staffCol(s), f = frac(s), l = left(s);
        hudDraw(k, c => { c.fillStyle = 'rgba(8,44,52,0.45)'; c.beginPath(); c.arc(x, y, 14, 0, 7); c.fill(); c.lineCap = 'round'; c.lineWidth = 3; c.strokeStyle = 'rgba(255,255,255,0.2)'; c.beginPath(); c.arc(x, y, 14, 0, 7); c.stroke(); c.strokeStyle = c1; c.beginPath(); c.arc(x, y, 14, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (l == null ? 1 : f)); c.stroke();
          rrect(c, x + 19, y - 9, 74, 18, 9); c.fillStyle = 'rgba(8,44,52,0.42)'; c.fill(); });
        T(l == null ? '–' : l.toFixed(0), x, y, 9, '#ffffff', 'center', 700); T(staffWord(s), x + 26, y, 7, c1, 'left', 700); });
      if (WORLD.staffRects) WORLD.staffRects().forEach(r => { const s = E.staff[r.i]; if (!s || r.h < 24) return; const c1 = staffCol(s), h = Math.min(HH - 6 - r.y, r.h); if (h < 8 || r.w < 4) return; hudDraw(k, c => { c.strokeStyle = c1; c.lineWidth = 1.2; c.setLineDash([4, 4]); c.globalAlpha = 0.85; c.beginPath(); c.ellipse(r.x + r.w / 2, r.y + h / 2, r.w / 2 + 4, h / 2 + 4, 0, 0, 7); c.stroke(); }); }); }
  } else if (ST === 'brain') { // 뇌 임플란트: 양옆에 신경망이 켜지고, 생각이 줄지어 지나간다. 위에는 시험 전체의 답
    const G1 = '#ffd678', V1 = '#c9a0ff', n = E.qs.length, bw = Math.min(24, Math.floor((W - 200) / n)), x0 = W / 2 - n * bw / 2, y0 = 38, ph = picked ? 1 : scanning ? E.scan : 0;
    { const yc = y0 + 7, cx = i => x0 + i * bw + bw / 2; // 답안 줄: 네모 칸 대신 양옆 신경망과 같은 마디와 선. 푼 문제는 금색 마디에 고른 번호, 지금 문제는 깜빡이는 고리
      hudDraw(k, c => { c.strokeStyle = 'rgba(255,214,120,0.45)'; c.lineWidth = 1; c.beginPath(); c.moveTo(cx(0), yc); c.lineTo(cx(n - 1), yc); c.stroke();
        for (let i = 0; i < n; i++) { const a = E.answers[i], cur = i === E.qi, x = cx(i);
          if (a != null && i < E.qi) { c.fillStyle = 'rgba(255,214,120,0.22)'; c.beginPath(); c.arc(x, yc, 9.5, 0, 7); c.fill(); c.fillStyle = G1; c.beginPath(); c.arc(x, yc, 6.5, 0, 7); c.fill(); }
          else if (cur) { c.fillStyle = 'rgba(26,16,40,0.85)'; c.beginPath(); c.arc(x, yc, 7.5, 0, 7); c.fill(); c.strokeStyle = Math.floor(now * 3) % 2 ? '#ffffff' : G1; c.lineWidth = 1.6; c.beginPath(); c.arc(x, yc, 7.5, 0, 7); c.stroke(); c.strokeStyle = 'rgba(255,214,120,0.45)'; c.lineWidth = 1; }
          else { c.fillStyle = 'rgba(201,160,255,0.7)'; c.beginPath(); c.arc(x, yc, 2.2, 0, 7); c.fill(); } } });
      for (let i = 0; i < n; i++) { const a = E.answers[i], cur = i === E.qi; if (a != null && i < E.qi) T(String(a + 1), cx(i), yc + 0.5, 8, '#2a1c00', 'center', 800); else if (cur && picked) T(String(q.aiPick + 1), cx(i), yc + 0.5, 8, '#ffffff', 'center', 800); } }
    b.globalAlpha = 0.22 + 0.08 * Math.sin(now * 5); b.drawImage(lensGlow('A', '#b07aff'), 0, 0); b.globalAlpha = 1;
    hudDraw(k, c => { for (const side of [0, 1]) { const P = NEURO.map(([x, y]) => [side ? W - x : x, y]), lit = i => (i + 1) / P.length <= ph + 0.001 || Math.sin(now * 2 + i * 1.7 + side) > 0.93;
        c.lineWidth = 1; for (let i = 0; i < P.length; i++) for (const j of [i + 1, i + 2]) { if (j >= P.length) continue; const on = lit(i) && lit(j); c.strokeStyle = on ? G1 : V1; c.globalAlpha = on ? 0.85 : 0.28; c.beginPath(); c.moveTo(P[i][0], P[i][1]); c.lineTo(P[j][0], P[j][1]); c.stroke();
          if (on || scanning) { const f = (now * 1.6 + i * 0.37 + j * 0.11) % 1; c.globalAlpha = 0.9; c.fillStyle = '#ffffff'; c.fillRect(P[i][0] + (P[j][0] - P[i][0]) * f - 1, P[i][1] + (P[j][1] - P[i][1]) * f - 1, 2, 2); } }
        for (let i = 0; i < P.length; i++) { const on = lit(i); c.globalAlpha = on ? 1 : 0.5; c.fillStyle = on ? G1 : V1; c.beginPath(); c.arc(P[i][0], P[i][1], on ? 3.5 : 2.2, 0, 7); c.fill(); if (on) { c.globalAlpha = 0.25; c.beginPath(); c.arc(P[i][0], P[i][1], 7, 0, 7); c.fill(); } } }
      if (picked) { const f = (now * 0.9) % 1; c.globalAlpha = 0.5 * (1 - f); c.strokeStyle = G1; c.lineWidth = 2; c.beginPath(); c.arc(W / 2, HH / 2, 40 + f * 150, 0, 7); c.stroke(); } });
    const log = []; if (scanning || picked) { log.push(`문제 ${E.qi + 1} 인식`); if (ph > 0.2) log.push('조건 추출'); elim.forEach(i => log.push(`보기 ${i + 1}번 소거`)); if (picked) log.push(`결론 ${q.aiPick + 1}번 · ${q.conf}%`); }
    log.forEach((ln, i) => { b.globalAlpha = i === log.length - 1 ? 1 : 0.6; M(ln, 120, HH - 118 + i * 12, 7.5, i === log.length - 1 ? G1 : '#ffffff', 'left', 700); }); b.globalAlpha = 1;
    if (scanning) { const y = HH / 2, w = Math.round((W / 2 - 170) * E.scan); b.globalAlpha = 0.6; R(116, y, w, 1, G1); R(W - 116 - w, y, w, 1, G1); b.globalAlpha = 1; }
  }
}
// ---- [AI 대면 면접 · 눈 맞춤 줄다리기] 대본 창은 왼쪽 허공에 떠 있다 (3D 공간에 고정된, 살짝 굽은 창). 꾹 누르면 고개가 그쪽으로 돌아가야 읽힌다 ----
// 창은 내 눈에서 0.85m, 왼쪽 50° 쪽에서 나를 마주 본다. 렌즈가 그 자리에 그려 주는 것이라 앞을 볼 때는 화면 왼쪽 끝에 비스듬히 흐릿하게 걸쳐 보인다
const EYE_HEAD = /[?&]ivlook=head/.test(location.search); // (비교용) t76~t78: 고개를 돌려 3D 공간의 대본 창을 본다. 기본은 시선만 옮겨 렌즈 속 대본을 확대
const EYEP = { cv: null, key: '', PSI: 0.78, // PSI: 창 방향(왼쪽 각도). t76~t77은 0.87(50°), t78부터 0.78(45°)로 살짝 오른쪽
   D: 0.85, M: 0.0027, RC: 1.5, DY: -0.01, N: 28 };
function eyePanelArt(A, q, ST, INK, teach, pw, ph) { // 창 그림을 따로 그려 둔다 (안경 단계 모양 그대로). 내용이 바뀔 때만 다시 그린다
  const S = Math.min(4, (HUD_SCALE || 1) * 1.5), key = [ST, q.q, A.wi, teach ? 1 : 0, pw, ph, S, STATE.touchUI ? 1 : 0].join('|');
  if (EYEP.cv && EYEP.key === key) return EYEP.cv;
  const cv = EYEP.cv || (EYEP.cv = document.createElement('canvas')); cv.width = Math.ceil(pw * S); cv.height = Math.ceil(ph * S);
  const c = cv.getContext('2d'); c.setTransform(S, 0, 0, S, 0, 0); c.clearRect(0, 0, pw, ph); const k2 = makeKit(c); k2.S = S;
  const ink = INK || '#7fe9ff', mono = ST === 'used' || ST === 'mil', n = q.lines.length;
  if (ST === 'contact') { rrect(c, 1, 1, pw - 2, ph - 2, 14); c.fillStyle = 'rgba(8,44,52,0.72)'; c.fill(); c.strokeStyle = 'rgba(127,233,255,0.95)'; c.lineWidth = 1.4; c.stroke(); }
  else if (ST === 'mil') { c.fillStyle = 'rgba(40,26,6,0.74)'; c.fillRect(0, 0, pw, ph); c.strokeStyle = ink; c.lineWidth = 1; c.strokeRect(0.5, 0.5, pw - 1, ph - 1); c.fillStyle = ink; c.fillRect(0, 0, pw, 2); }
  else if (ST === 'proto') panelBox(k2, 0, 0, pw, ph, ink, '');
  else if (ST === 'used') { c.fillStyle = 'rgba(4,16,8,0.5)'; c.fillRect(0, 0, pw, ph); c.fillStyle = ink; for (const [x, y, w, h] of [[0, 0, 12, 1.5], [0, 0, 1.5, 12], [pw - 12, ph - 1.5, 12, 1.5], [pw - 1.5, ph - 12, 1.5, 12]]) c.fillRect(x, y, w, h); }
  else if (ST !== 'brain') { c.fillStyle = 'rgba(6,22,26,0.7)'; c.fillRect(0, 0, pw, ph); }
  const title = ST === 'mil' ? 'SCRIPT · LIVE' : ST === 'used' ? 'SCRIPT' : ST === 'brain' ? '떠오르는 말' : '내 AI의 대본';
  (mono ? k2.M : k2.T)(title, 12, 13, 7.5, ink, 'left', 700);
  for (let li = 0; li < n; li++) { let x = 12; const y = 34 + li * 22;
    A.words.forEach((o, i) => { if (o.li !== li) return; const col = i < A.wi ? 'rgba(170,220,205,0.42)' : i === A.wi ? ink : ST === 'brain' ? '#ffe9b8' : '#f0f4f2'; (mono ? k2.M : k2.T)(o.w, x, y, 10.5, col, 'left', 700); x += k2.TW(o.w, 10.5, 700) + 4; }); }
  if (teach) (mono ? k2.M : k2.T)(STATE.touchUI ? '손을 떼면 면접관 눈을 본다' : '스페이스를 떼면 면접관 눈을 본다', 12, ph - 11, 8, 'rgba(240,244,242,0.75)', 'left', 500);
  EYEP.key = key; return cv;
}
function eyePanelWarp(k, cv, pw, ph, a) { // 굽은 창을 세로 띠로 잘라, 띠마다 3D 자리에 맞춰 그린다 (가까운 쪽은 크게, 먼 쪽은 작게)
  const eye = typeof WORLD !== 'undefined' && WORLD.exEye ? WORLD.exEye() : null; if (!eye) return null;
  const P = EYEP, f = [-Math.sin(P.PSI), -Math.cos(P.PSI)], r = [Math.cos(P.PSI), -Math.sin(P.PSI)], hw = pw * P.M / 2, hh = ph * P.M / 2, yc = eye.y + P.DY, pts = [];
  for (let j = 0; j <= P.N; j++) { const th = (j / P.N * 2 - 1) * hw / P.RC, side = Math.sin(th) * P.RC, near = P.RC * (1 - Math.cos(th)); // 가장자리일수록 나를 향해 조금 굽는다
    const X = eye.x + f[0] * (P.D - near) + r[0] * side, Z = eye.z + f[1] * (P.D - near) + r[1] * side, t = WORLD.projEx(X, yc + hh, Z), bt = WORLD.projEx(X, yc - hh, Z); pts.push(t && bt ? [t[0], t[1], bt[0], bt[1]] : null); }
  hudDraw(k, c => { c.imageSmoothingEnabled = true; c.globalAlpha = a; const sw = cv.width / P.N;
    for (let j = 0; j < P.N; j++) { const p0 = pts[j], p1 = pts[j + 1]; if (!p0 || !p1) continue; const x0 = (p0[0] + p0[2]) / 2, x1 = (p1[0] + p1[2]) / 2; if (x1 <= x0 || x1 < -20 || x0 > 660) continue;
      const y0 = (p0[1] + p1[1]) / 2, y1 = (p0[3] + p1[3]) / 2; c.drawImage(cv, j * sw, 0, sw, cv.height, x0, y0, x1 - x0 + 0.6, y1 - y0); } });
  const e = pts[P.N]; return e ? { x: (e[0] + e[2]) / 2, y: (e[1] + e[3]) / 2, top: e[1], bot: e[3] } : null; // 창 오른쪽 끝(앞을 볼 때 보이는 쪽)
}
function eyePanelFlat(k, cv, x0, y0, w, h, a) { // 렌즈 속 대본 창: 왼쪽 끝이 조금 크고 가운데가 살짝 오목하게 (세로 띠로 잘라 그린다)
  const N = 24, sw = cv.width / N;
  hudDraw(k, c => { c.imageSmoothingEnabled = true; c.globalAlpha = a;
    for (let j = 0; j < N; j++) { const um = (j + 0.5) / N, hh = h * (1.07 - 0.1 * um) * (1 + 0.05 * (2 * um - 1) * (2 * um - 1));
      c.drawImage(cv, j * sw, 0, sw, cv.height, x0 + j / N * w, y0 + (h - hh) / 2, w / N + 0.6, hh); } });
}
function drawEyeline(k, L, E, now, q, ST, INK) {
  const A = E.iv, W = L.W, HH = L.H, b = k.b, ev = E.ivEv || { ph: 'idle', t: 0 }; if (!A || A.q !== q) return;
  const lk = Math.max(0, Math.min(1, E.ivLook || 0)), look = lk * lk * (3 - 2 * lk), ink = INK || '#7fe9ff', mono = ST === 'used' || ST === 'mil';
  const asking = A.t < A.ask, teach = !G.hints.eyeline && !asking, n = q.lines.length, pw = 268, ph = 40 + n * 22 + (teach ? 14 : 0);
  if (asking) { const lines = wrapSent(k, 'AI 면접관: ' + q.q, 500, 13, true).slice(0, 3), y0 = HH - 134 + (2 - lines.length) * (lines.length > 2 ? 19 : 10); lines.forEach((ln, i) => k.SUB(ln, W / 2, y0 + i * 19, 13, '#ffe9b0', 'center')); } // 면접관이 질문하는 동안: 자막 두 줄 (바로 아래 줄은 직전 답의 점수 알림 자리라 비워 둔다)
  const sm = (e0, e1, v) => { const t = Math.max(0, Math.min(1, (v - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
  let edge = null;
  if (!asking && EYE_HEAD) edge = eyePanelWarp(k, eyePanelArt(A, q, ST, INK, teach, pw, ph), pw, ph, 0.16 + 0.84 * sm(0.15, 0.75, look)); // (비교용) 왼쪽 허공의 3D 대본 창
  else if (!asking) { // 기본: 렌즈 왼쪽 끝의 작은 대본 창 → 꾹 누르면 시선이 옮겨 가며 창이 커진다 (고개는 그대로, 화면도 대본 쪽으로 살짝 확대)
    const r0 = { x: ST === 'mil' ? 46 : 16, y: ST === 'mil' ? 110 : 124, w: 128 }, r1 = { x: ST === 'mil' ? 66 : 22, y: 70, w: 286 };
    const w = r0.w + (r1.w - r0.w) * look, h = ph * w / pw, x0 = r0.x + (r1.x - r0.x) * look, y0 = r0.y + (r1.y - r0.y) * look;
    if (look > 0.01) { b.globalAlpha = 0.16 * look; k.R(0, 0, W, HH, '#000000'); b.globalAlpha = 1; } // 초점이 대본으로 옮겨 간다: 바깥은 살짝 어둡게
    const done = E.fb ? 1 - sm(0, 0.3, E.fb.t) : 1; // 답이 끝나면 대본 창은 접힌다 (그동안 면접관이 평가 창을 띄운다)
    if (done > 0.01) eyePanelFlat(k, eyePanelArt(A, q, ST, INK, teach, pw, ph), x0, y0, w, h, (0.42 + 0.58 * sm(0.1, 0.7, look)) * done); edge = { x: x0 + w, y: y0 + h / 2 }; }
  if (!asking && !edge) { // 3D가 없을 때(그래픽 꺼짐): 예전처럼 화면 왼쪽에서 밀려 들어온다
    const px = Math.round(-pw - 12 + (pw + 40) * look); if (look > 0.02) { b.globalAlpha = Math.min(1, look * 1.4); b.drawImage(eyePanelArt(A, q, ST, INK, teach, pw, ph), px, 70, pw, ph); b.globalAlpha = 1; } }
  if (teach && look < 0.3) { const ex = ST === 'mil' ? 46 : 20, ey = ST === 'mil' ? 200 : 232; // 처음엔 왼쪽 아래(대본 창 쪽)에 조작 안내. 군용은 왼쪽 GAZE 막대·글씨를 비켜서
    k.SUB(STATE.touchUI ? '◀ 꾹 누르면 왼쪽 대본을 본다' : '◀ 스페이스 꾹: 왼쪽 대본을 본다', ex, ey, 10, '#ffffff', 'left'); k.SUB('보는 동안 말이 나간다', ex + 12, ey + 17, 8.5, '#d8e8e4', 'left'); }
  if (!asking && A.wi > 0 && !E.fb) { const li = A.words[A.wi - 1].li, said = A.words.filter((o, i) => o.li === li && i < A.wi).map(o => o.w).join(' '); k.SUB(`"${said}${A.pause > tune.iv_stall ? '… 어…' : ''}"`, W / 2, HH - 86, 13, '#ffffff', 'center'); } // 내가 하는 말 (기본 자막 자리)
  if (ev.ph === 'warn') { b.globalAlpha = 0.32 * Math.min(1, ev.t / 0.25); b.drawImage(lensGlow('A', '#ffcf5a'), 0, 0); b.globalAlpha = 1; } // 표정 분석 예고: 렌즈 둘레가 은은하게 노랗게 (깜빡이지 않게)
  else if (ev.ph === 'on') { const y = Math.round(((ev.t / Math.max(0.1, ev.dur)) * 2 % 1) * HH); // 분석 중: 붉은 선이 내 얼굴(화면)을 위아래로 두 번 훑는다
    b.globalAlpha = 0.16; k.R(0, y - 12, W, 24, '#ff3a4a'); b.globalAlpha = 0.8; k.R(0, y, W, 1.5, '#ff7a86'); b.globalAlpha = 0.4; b.drawImage(lensGlow('A', '#ff3a4a'), 0, 0); b.globalAlpha = 1; }
}
// ---- [AI 대면 면접] 평가 창: 답이 끝나면 홀로그램 면접관의 바이저가 빛을 쏘아 오른쪽 허공에 평가 창을 띄운다 ----
// 창은 시험장 공간(면접관 옆)에 붙어 있다. 렌즈 HUD가 아니라 면접관이 띄운 홀로그램이라 렌즈 단계와 상관없이 같은 모양
function drawHoloScore(k, L, E, now) {
  const r = E.ivLast; if (!r || !r.win || E.caught || E.result || typeof WORLD === 'undefined' || !WORLD.projEx) return;
  if (r.at == null) r.at = now; const age = now - r.at, LIFE = 3.0; if (age > LIFE) return;
  const P = WORLD.projEx(0.42, 1.32, -0.55), V = WORLD.projEx(0.13, 1.555, -0.36); if (!P || !V) return;
  const ok = r.score >= 0.6, col = ok ? '#9ff5d8' : '#ff7a86', sc = Math.round(r.score * 100), b = k.b, cl = (v) => Math.max(0, Math.min(1, v)), sm = (v) => { v = cl(v); return v * v * (3 - 2 * v); };
  const W0 = 168, H0 = 100, open = sm((age - 0.12) / 0.3) * (1 - sm((age - (LIFE - 0.25)) / 0.25)), h = Math.max(1, H0 * open);
  let x = Math.round(P[0]), y = Math.round(P[1] - h / 2); if (x + W0 > L.W - 8) x = L.W - 8 - W0;
  const beam = cl(1 - (age - 0.35) / 0.5) * 0.55 + 0.12 * open; // 바이저에서 창 왼쪽 끝으로 뻗는 빛 (처음에 진하고 곧 옅어진다)
  hudDraw(k, c => { c.globalCompositeOperation = 'lighter';
    if (beam > 0.01) { const g = c.createLinearGradient(V[0], V[1], x, y + h / 2); g.addColorStop(0, `rgba(159,245,216,${(0.5 * beam).toFixed(3)})`); g.addColorStop(1, `rgba(159,245,216,${(0.14 * beam).toFixed(3)})`);
      c.fillStyle = g; c.beginPath(); c.moveTo(V[0], V[1] - 1.5); c.lineTo(x, y); c.lineTo(x, y + h); c.lineTo(V[0], V[1] + 1.5); c.closePath(); c.fill(); }
    if (open < 0.02) return;
    c.fillStyle = ok ? 'rgba(60,170,150,0.16)' : 'rgba(190,60,80,0.18)'; c.fillRect(x, y, W0, h);
    const frame = (dx, cc, a) => { c.strokeStyle = cc; c.globalAlpha = a; c.lineWidth = 1; c.strokeRect(x + 0.5 + dx, y + 0.5, W0 - 1, h - 1); }; // 색 어긋남: 빨강·파랑 테두리를 1칸씩 비켜서
    frame(-1.2, '#ff3a5a', 0.45); frame(1.2, '#3a78ff', 0.45); frame(0, col, 0.9); c.globalAlpha = 1;
    c.fillStyle = col; for (const [cx, cy, sx, sy] of [[x, y, 1, 1], [x + W0, y, -1, 1], [x, y + h, 1, -1], [x + W0, y + h, -1, -1]]) { c.fillRect(cx - (sx < 0 ? 8 : 0), cy - (sy < 0 ? 2 : 0), 8, 2); c.fillRect(cx - (sx < 0 ? 2 : 0), cy - (sy < 0 ? 8 : 0), 2, 8); } });
  if (open < 0.6) return;
  b.save(); b.beginPath(); b.rect(x, y, W0, h); b.clip(); const a = sm((open - 0.6) / 0.4); b.globalAlpha = a;
  const cnt = Math.round(sc * sm((age - 0.35) / 0.55)); // 점수가 0부터 빠르게 차오른다
  k.M(`AI 평가 · ${String((r.qi || 0) + 1).padStart(2, '0')}/${String(E.qs.length).padStart(2, '0')}`, x + 10, y + 12, 7.5, col, 'left', 700);
  k.M(ok ? '통과' : '미달', x + W0 - 10, y + 12, 7.5, ok ? '#ffffff' : '#ff9aa4', 'right', 800);
  for (const [dx, cc, al] of [[-1.5, '#ff3a5a', 0.45], [1.5, '#3a78ff', 0.45], [0, '#ffffff', 1]]) { b.globalAlpha = a * al; k.T(String(cnt), x + 12 + dx, y + 40, 30, cc, 'left', 800); }
  b.globalAlpha = a; const nw = k.TW(String(cnt), 30, 800); k.T('점', x + 16 + nw, y + 44, 12, col, 'left', 700);
  for (let i = 0; i < 10; i++) { b.globalAlpha = a * (i < Math.round(cnt / 10) ? 0.95 : 0.22); k.R(x + 12 + i * 14.6, y + 62, 11, 5, col); } b.globalAlpha = a;
  const lines = Object.keys(r.why || {}).filter(key => typeof r.why[key] === 'string' || r.why[key] > 0).map(key => typeof r.why[key] === 'string' ? `${key} ${r.why[key]}` : `${key} -${r.why[key]}`);
  k.T(lines.length ? lines.join(' · ') : '감점 없음', x + 12, y + 84, 9.5, lines.length ? '#d8fff6' : col, 'left', 700);
  b.globalAlpha = a * 0.28; for (let yy = y + 2; yy < y + h; yy += 3) k.R(x, yy, W0, 1, '#000000'); // 홀로그램 가로 줄무늬 (타이틀 글자처럼)
  b.restore();
}
// ---- 면접(새 방식): A·B·C 순서 입력. 면접관이 안 볼 때만 누른다 ----
function drawAbc(k, L, E, now, q) { // 창도 숫자도 없다. 안경이 띄운 블록 세 줄이 허공에서 내려오고, 누를 때마다 한 어절씩 자막으로 말이 나간다
  const sq = E.sq; if (!sq || sq.q !== q) return; const W = L.W, HH = L.H, b = k.b, n = sq.seq.length, blind = E.staff.some(s => s.fixed && s.phase === 'watch'), tell = E.staff.some(s => s.fixed && s.phase === 'tell');
  const INK = blind ? '#ff5a5a' : tell ? '#ffcf5a' : '#7fe9ff', lw = 46, gap = 12, rows = 7, rh = 30, x0 = W - 44 - (lw * 3 + gap * 2), hitY = HH - 112, lx = i => x0 + i * (lw + gap), slide = sq.ok > 0 ? (sq.ok / 0.12) * rh : 0;
  const asking = sq.t < (sq.wait || 0); // 질문을 말하는 동안은 블록도 받침도 없다
  hudDraw(k, c => { if (asking) return;
    for (let i = 0; i < 3; i++) { const cx = lx(i) + lw / 2, gr = c.createLinearGradient(0, hitY - rows * rh, 0, hitY + 10); gr.addColorStop(0, 'rgba(127,233,255,0)'); gr.addColorStop(1, blind ? 'rgba(255,90,90,0.5)' : 'rgba(127,233,255,0.5)'); c.strokeStyle = gr; c.lineWidth = 1; c.setLineDash([2, 5]); c.beginPath(); c.moveTo(cx, hitY - rows * rh); c.lineTo(cx, hitY + 8); c.stroke(); c.setLineDash([]);
      c.strokeStyle = INK; c.globalAlpha = 0.8; c.lineWidth = 1.2; c.beginPath(); c.moveTo(lx(i), hitY + 12); c.lineTo(lx(i), hitY + 17); c.lineTo(lx(i) + lw, hitY + 17); c.lineTo(lx(i) + lw, hitY + 12); c.stroke(); c.globalAlpha = 1; } // 받침: 여기 닿은 블록을 누른다
    for (let r = rows - 1; r >= 0; r--) { const v = sq.seq[sq.i + r]; if (v == null) continue; const yy = hitY - 14 - r * rh - slide, cur = r === 0, a = blind ? 0.35 : cur ? 1 : Math.max(0.18, 0.8 - r * 0.12), x = lx(v);
      c.globalAlpha = a * (cur ? 0.55 : 0.2); c.fillStyle = INK; c.fillRect(x, yy, lw, 18); c.globalAlpha = a; c.strokeStyle = cur && !blind ? '#ffffff' : INK; c.lineWidth = cur ? 1.6 : 1; c.strokeRect(x + 0.5, yy + 0.5, lw - 1, 17);
      c.fillStyle = cur && !blind ? '#ffffff' : INK; c.fillRect(x + 4, yy + 4, 3, 3); c.fillRect(x + 10, yy + 4, lw - 28 - (r * 5) % 12, 1); c.fillRect(x + 10, yy + 8, lw - 20 - (r * 7) % 14, 1); c.fillRect(x + 4, yy + 12, lw - 14, 1); // 블록 안의 가는 줄: 데이터 조각처럼
      if (cur && !blind) { c.globalAlpha = 0.35 + 0.25 * Math.sin(now * 10); c.strokeStyle = '#ffffff'; c.strokeRect(x - 2.5, yy - 2.5, lw + 5, 23); } c.globalAlpha = 1; }
    const tf = Math.max(0, 1 - sq.t / sq.lim), bw = 220; c.globalAlpha = 0.3; c.fillStyle = '#ffffff'; c.fillRect(W / 2 - bw / 2, HH - 22, bw, 1.5); c.globalAlpha = 0.9; c.fillStyle = tf < 0.25 ? '#ff6a6a' : '#ffffff'; c.fillRect(W / 2 - bw / 2, HH - 22, bw * tf, 1.5); c.globalAlpha = 1; }); // 남은 시간: 자막 아래의 가는 선 하나
  E.abcRects = asking ? [] : [0, 1, 2].map(i => ({ i, x: lx(i) - gap / 2, y: hitY - rows * rh, w: lw + gap, h: rows * rh + 60 }));
  if (!asking) for (let i = 0; i < 3; i++) k.M(['A', 'S', 'D'][i], lx(i) + lw / 2, hitY + 26, 7, INK, 'center', 500);
  if (sq.bad > 0) { b.globalAlpha = Math.min(0.3, sq.bad); k.R(0, 0, W, HH, '#ff2020'); b.globalAlpha = 1; }
  let left = sq.i, line = []; for (const g of sq.groups) { if (left <= g.length) { line = g.slice(0, left); break; } left -= g.length; line = g; } // 지금 말하고 있는 줄에서, 누른 만큼의 어절
  const text = line.join(' ') + (sq.rush > 0 ? '— 어, 그' : ''); if (sq.i > 0 || sq.rush > 0) k.SUB(text, W / 2, HH - 40, 14, sq.rush > 0 ? '#ffd0d0' : '#ffffff', 'center');
  if (sq.t < (sq.wait || 0) + 3.2 || sq.i === 0) k.SUB(`${E.T.staff[0].name}: "${asking ? String(q.q).slice(0, Math.ceil(String(q.q).length * sq.t / sq.wait)) : q.q}"`, W / 2, 40, 11, '#ffffff', 'center');
}
// ---- 면접 × 리듬 (B안 · 한 마디 호흡) 화면 시안. 주소에 ?rh=1|2|3 을 붙이면 박자 표시만 미리 본다 (조작은 아직 지금 방식) ----
function drawRhythmPreview(k, L, E, now, v, q) {
  const W = L.W, HH = L.H, b = k.b, R = k.R, M = k.M, T = k.T, t = now * 1.6, beat = t % 4, bar = Math.floor(t / 4), look = bar % 3 === 2, nextLook = (bar + 1) % 3 === 2, C1 = '#7fe9ff', G1 = '#8dffa8', RD = '#ff6a6a';
  const lines = q.lines || [], ln = lines[bar % Math.max(1, lines.length)] || '', phase = look ? '쉬기' : beat < 2 ? '꾹 · 읽기' : '뗌 · 말하기', pc = look ? RD : beat < 2 ? C1 : G1, hit = !look && (beat % 2) < 0.22;
  if (v === '1') { // 위쪽 박자 띠: 네 칸이 왼쪽에서 오른쪽으로 찬다. 다음 마디가 옆에 미리 보인다
    const x0 = W / 2 - 150, y0 = 78, cw = 62, drawBar = (x, lk, a, cur) => { for (let i = 0; i < 4; i++) { const c = lk ? RD : i < 2 ? C1 : G1; b.globalAlpha = a * 0.45; R(x + i * (cw + 4), y0, cw, 20, '#061018'); b.globalAlpha = a * 0.4; R(x + i * (cw + 4), y0, cw, 20, c); if (cur && i < Math.floor(beat) + 1) { b.globalAlpha = a; R(x + i * (cw + 4), y0, i === Math.floor(beat) ? Math.round(cw * (beat % 1)) : cw, 20, c); } b.globalAlpha = 1; } };
    drawBar(x0, look, 1, true); b.globalAlpha = 0.6; drawBar(x0 + 4 * (cw + 4) + 14, nextLook, 0.5, false); b.globalAlpha = 1;
    M(look ? '쉬기' : '꾹 · 대본 읽기', x0 + cw + 2, y0 + 10.5, 8, '#ffffff', 'center', 700); M(look ? '면접관이 본다' : '뗌 · 말하기', x0 + 3 * cw + 6, y0 + 10.5, 8, '#ffffff', 'center', 700);
    R(x0 + Math.round((beat / 4) * (4 * cw + 12)), y0 - 5, 2, 30, '#ffffff'); M(nextLook ? '다음 마디: 쉬기' : '다음 마디', x0 + 4 * (cw + 4) + 14, y0 - 9, 7, nextLook ? RD : '#ffffff', 'left', 700);
    if (hit) M('딱!', W / 2, y0 + 38, 14, '#ffffff', 'center', 700);
  } else if (v === '2') { // 면접관 얼굴 둘레의 박자 고리: 네 조각이 시계 방향으로 찬다
    const cx = W / 2, cy = 128, r = 58; hudDraw(k, c => { c.lineWidth = 7; for (let i = 0; i < 4; i++) { const a0 = -Math.PI / 2 + i * Math.PI / 2 + 0.06, a1 = a0 + Math.PI / 2 - 0.12, col = look ? RD : i < 2 ? C1 : G1; c.strokeStyle = col; c.globalAlpha = 0.25; c.beginPath(); c.arc(cx, cy, r, a0, a1); c.stroke(); if (i <= Math.floor(beat)) { c.globalAlpha = 1; c.beginPath(); c.arc(cx, cy, r, a0, i === Math.floor(beat) ? a0 + (a1 - a0) * (beat % 1) : a1); c.stroke(); } }
      const ha = -Math.PI / 2 + beat / 4 * Math.PI * 2; c.globalAlpha = 1; c.fillStyle = '#ffffff'; c.beginPath(); c.arc(cx + Math.cos(ha) * r, cy + Math.sin(ha) * r, 5, 0, 7); c.fill(); if (hit) { c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.globalAlpha = 0.7; c.beginPath(); c.arc(cx, cy, r + 10 + (beat % 2) * 40, 0, 7); c.stroke(); } });
    M(phase, cx, cy + r + 16, 11, pc, 'center', 700); if (nextLook && !look) M('다음 마디는 쉬기', cx, cy + r + 30, 7.5, RD, 'center', 700);
  } else { // 노래방 자막: 대본 한 줄이 박자에 맞춰 차오른다. 아래 점 네 개가 박자
    const y = HH - 96, size = 15, tw = k.TW(ln, size, 700) + 8, x = W / 2 - tw / 2, f = look ? 0 : Math.min(1, beat / 2), sf = look ? 0 : Math.max(0, Math.min(1, (beat - 2) / 2));
    b.globalAlpha = 0.6; R(x - 16, y - 20, tw + 32, 58, '#061018'); b.globalAlpha = 1; k.frame(x - 16, y - 20, tw + 32, 58, pc, 1);
    M(ln, x, y, size, '#5a6a78', 'left', 700);
    b.save(); b.beginPath(); b.rect(x - 6, y - 16, (tw + 8) * f, 32); b.clip(); M(ln, x, y, size, C1, 'left', 700); b.restore();
    b.save(); b.beginPath(); b.rect(x - 6, y - 16, (tw + 8) * sf, 32); b.clip(); M(ln, x, y, size, G1, 'left', 700); b.restore();
    for (let i = 0; i < 4; i++) { const on = i <= Math.floor(beat), c = look ? RD : i < 2 ? C1 : G1; b.globalAlpha = on ? 1 : 0.3; k.disc(W / 2 - 36 + i * 24, y + 24, i === Math.floor(beat) ? 6 : 4, c); } b.globalAlpha = 1;
    M(look ? '면접관이 본다 · 이번 마디는 쉬기' : beat < 2 ? '꾹 눌러 읽기' : '손 떼고 말하기', W / 2, y - 32, 9, pc, 'center', 700);
  }
}
// ---- 실험 중인 새 시험들의 화면 효과 ----
function drawLabFx(k, L, E, now, live) {
  const Mm = E.T.mech, W = L.W, HH = L.H, b = k.b, R = k.R, M = k.M, S = k.S || HUD_SCALE;
  const meter = (label, v, col, x = 24, y = HH - 96, w = 110) => { M(label, x, y - 9, 8, '#ffffff', 'left', 700); b.globalAlpha = 0.35; R(x, y, w, 4, '#ffffff'); b.globalAlpha = 1; R(x, y, Math.round(w * Math.max(0, Math.min(1, v))), 4, col); };
  if (Mm.includes('bolt')) { const z = { t: 0.5 - (E.boltFlash || 0) }, flashOn = E.boltFlash > 0, tell = !flashOn && E.boltT != null && E.boltT < 0.9;
    b.globalAlpha = flashOn ? 0 : tell ? 0.5 + 0.08 * Math.sin(now * 40) : 0.46; R(0, 0, W, HH, '#05060f'); b.globalAlpha = 1;
    if (flashOn) { b.globalAlpha = Math.max(0, 0.85 - z.t * 1.6); R(0, 0, W, HH, '#ffffff'); b.globalAlpha = 1; }
    if (live && tell) k.SUB('(우르릉…)', W / 2, HH - 70, 12, '#ffffff', 'center'); }
  if (Mm.includes('helmet')) { const f = E.fog || 0; b.save(); b.setTransform(S, 0, 0, S, 0, 0); const gr = b.createRadialGradient(W / 2, HH * 0.56, Math.max(10, 190 * (1 - f)), W / 2, HH * 0.56, 430); gr.addColorStop(0, `rgba(236,240,244,${0.9 * f * f})`); gr.addColorStop(1, `rgba(236,240,244,${Math.min(0.96, 0.22 + f * 0.8)})`); b.fillStyle = gr; b.fillRect(0, 0, W, HH); b.restore();
    b.globalAlpha = 0.9; for (const [x, w] of [[0, 26], [W - 26, 26]]) R(x, 0, w, HH, '#1a1410'); R(0, 0, W, 16, '#1a1410'); R(0, HH - 14, W, 14, '#1a1410'); b.globalAlpha = 1; // 헬멧 테두리
    if (live) meter(`헬멧 김 서림 ${Math.round(f * 100)}%`, f, f > 0.6 ? '#ff6a6a' : '#ffffff'); }
  if (Mm.includes('breath')) { b.globalAlpha = 0.2; R(0, 0, W, HH, '#0a6a8a'); b.globalAlpha = 0.07; for (let i = 0; i < 6; i++) R(0, Math.round((now * 14 + i * 60) % HH), W, 10, '#bff4ff'); b.globalAlpha = 1;
    const n = E.breathing ? 14 : E.holding ? 5 : E.gasp > 0 ? 26 : 2; for (let i = 0; i < n; i++) { const h = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1, x = (E.gasp > 0 ? W / 2 - 120 + h * 240 : 60 + h * (W - 120)), y = HH - ((now * (40 + h * 60) + h * 400) % (HH + 40)); b.globalAlpha = 0.55; k.ring(x, y, 3 + Math.round(h * 4), '#e8fbff'); } b.globalAlpha = 1;
    const br = E.breath == null ? 1 : E.breath;
    if (br < 0.5) { const d = (0.5 - br) * 2; b.save(); b.setTransform(S, 0, 0, S, 0, 0); const gr = b.createRadialGradient(W / 2, HH * 0.55, Math.max(30, 270 * (1 - d * 0.75)), W / 2, HH * 0.55, 390); gr.addColorStop(0, 'rgba(2,10,22,0)'); gr.addColorStop(1, `rgba(2,10,22,${Math.min(0.97, 0.45 + d * 0.6)})`); b.fillStyle = gr; b.fillRect(0, 0, W, HH); b.restore(); } // 숨이 모자라면 시야가 가장자리부터 좁아진다
    if (live) { const BR = BREATH_BTN, on = !!E.breathing, low = br < 0.3;
      meter(E.gasp > 0 ? '허우적거리는 중' : on ? '숨 쉬는 중' : `숨 ${Math.round(br * 100)}%`, br, low ? '#ff6a6a' : '#8fe6ff', BR.x + 2, BR.y - 8, BR.w - 4);
      b.globalAlpha = on ? 0.9 : 0.6; R(BR.x, BR.y, BR.w, BR.h, on ? '#1d6f8c' : '#06202c'); b.globalAlpha = 1; k.frame(BR.x, BR.y, BR.w, BR.h, low && Math.floor(now * 5) % 2 ? '#ff6a6a' : '#8fe6ff', 1);
      M(STATE.touchUI ? '숨쉬기' : '숨쉬기  B', BR.x + BR.w / 2, BR.y + BR.h / 2 + 0.5, 9, '#ffffff', 'center', 700); } }
  if (Mm.includes('signal')) drawSeaSignal(k, L, E, now, live, meter); // [용궁] 물속 신호
  if (E.emp) drawEmpStatus(k, L, E, now, live, meter); // [변호사시험 3교시] EMP 총
  if (Mm.includes('dream')) { const t = E.dreamT == null ? 9 : E.dreamT, near = t < 1.4; b.globalAlpha = 0.14 + (near ? 0.16 : 0); R(0, 0, W, HH, '#b48aff'); b.globalAlpha = 1;
    if (near) for (let y = 0; y < HH; y += 6) { b.globalAlpha = 0.25; R(Math.round(Math.sin(now * 9 + y * 0.12) * 10), y, W, 2, '#ffffff'); } b.globalAlpha = 1;
    if (live && near) k.SUB('(화면이 일렁인다…)', W / 2, HH - 70, 12, '#ffffff', 'center'); }
  if (Mm.includes('loop') && live) { const x = 120, w = W - 240, y = 66, T0 = E.timeTotal || 60, t = E.partT || 0; b.globalAlpha = 0.45; R(x, y, w, 5, '#0a0c0e'); b.globalAlpha = 1;
    for (const a of E.loopLog || []) for (const v of a) { const px = x + Math.round(w * Math.min(1, v / T0)), ww = Math.max(3, Math.round(w * 2.4 / T0)); b.globalAlpha = 0.8; R(px - ww / 2, y - 3, ww, 11, '#ff5a5a'); b.globalAlpha = 1; }
    R(x + Math.round(w * Math.min(1, t / T0)) - 1, y - 6, 2, 17, '#ffffff'); M(`${E.part + 1}회차 · 빨간 때는 감독관이 기억한다`, x, y - 12, 7.5, '#ffffff', 'left', 500);
    const pv = E.loopPrev && E.loopPrev[E.qi]; if (pv != null && !E.fb) M(`지난번에 고른 답: ${pv + 1}번`, x + w, y - 12, 7.5, '#ffe08a', 'right', 700); }
  if (Mm.includes('mirror') && live) M('좌우 반전', W / 2, 30, 8, '#ffffff', 'center', 700);
  if (Mm.includes('telepathy') && live) { const on = E.ai && !E.fb; if (on) { const rd = E.mindRead, c = rd ? '#ff6a6a' : '#e0c8ff'; b.globalAlpha = 0.6; R(W / 2 - 96, 50, 192, 20, '#1a1028'); b.globalAlpha = 1; k.frame(W / 2 - 96, 50, 192, 20, c, 1); M(rd ? '생각을 읽히는 중!' : '답을 떠올리는 중 · 보이면 읽힌다', W / 2, 60.5, 8, c, 'center', 700); } }
  if (Mm.includes('warp') && live) { const w = E.warp || 1, c = w > 1.4 ? '#ff6a6a' : w < 0.8 ? '#8fe6ff' : '#ffffff'; M(`시간 ×${w.toFixed(1)}`, W / 2, 30, 11, c, 'center', 700); if (w > 1.4) { b.globalAlpha = 0.1; R(0, 0, W, HH, '#ff5a3a'); b.globalAlpha = 1; } else if (w < 0.8) { b.globalAlpha = 0.12; R(0, 0, W, HH, '#3a8aff'); b.globalAlpha = 1; } }
  if (E.hz && live) { const h = E.hz, w = h.phase === 'warn', on = h.phase === 'on' || h.phase === 'grab';
    if (h.kind === 'lift') { if (w) k.SUB('(시험지가 떠오르려 한다…)', W / 2, HH - 70, 12, '#ffffff', 'center'); else if (on) { b.globalAlpha = 0.12; R(0, 0, W, HH, '#8fd0ff'); b.globalAlpha = 1; M(h.phase === 'grab' ? '잡는 중…' : STATE.touchUI ? '시험지가 떠올랐다 · 손을 뗐다가 다시 눌러 잡기' : '시험지가 떠올랐다 · 스페이스를 뗐다가 다시 눌러 잡기', W / 2, 80, 10, '#ffffff', 'center', 700); } }
    else if (h.kind === 'dead') { if (w || on) { b.globalAlpha = w ? 0.1 + 0.08 * Math.sin(now * 22) : 0.2; R(0, 0, W, HH, '#c8743a'); b.globalAlpha = 1; } if (w) k.SUB('(모래폭풍이 몰려온다…)', W / 2, HH - 70, 12, '#ffffff', 'center'); }
    else if (h.kind === 'watch') { if (w) M(h.wt, W / 2, 80, 10, '#ffe08a', 'center', 700); else if (on) { b.globalAlpha = 0.1; R(0, 0, W, HH, '#ff5a3a'); b.globalAlpha = 1; M(h.ot, W / 2, 80, 10, '#ff6a6a', 'center', 700); } }
    else if (h.kind === 'sweep' && (w || on)) { const u = w ? 0.5 * (1 - h.t / h.warn) : 0.5 + 0.5 * (1 - h.t / h.dur), x = Math.round(W * u); b.globalAlpha = 0.16; R(x - 14, 0, 28, HH, '#ff3a3a'); b.globalAlpha = 0.9; R(x - 1, 0, 2, HH, '#ff4a4a'); b.globalAlpha = 1; M(on ? '전수 스캔 통과 중' : '전수 스캔이 다가온다', W / 2, 80, 10, on ? '#ff6a6a' : '#ffe08a', 'center', 700); } }
  if (Mm.includes('telepathy') && live && E.noise != null) { const x = 20, y = HH - 96, w = 92, v = E.noise, c = v > 0.7 ? '#ff6a6a' : '#e0c8ff'; b.globalAlpha = 0.55; R(x, y, w, 7, '#1a1028'); b.globalAlpha = 1; R(x, y, Math.round(w * v), 7, c); k.frame(x, y, w, 7, c, 1); M('생각 소음', x, y - 7, 7.5, '#ffffff', 'left', 700); }
  if (Mm.includes('spin') && live) { const r = E.roll || 0, cx = 70, cy = HH - 90; b.globalAlpha = 0.5; k.disc(cx, cy, 24, '#061018'); b.globalAlpha = 1; k.ring(cx, cy, 24, '#ffffff'); k.line(cx - Math.cos(r) * 20, cy - Math.sin(r) * 20, cx + Math.cos(r) * 20, cy + Math.sin(r) * 20, Math.abs(r) > 0.25 ? '#ff6a6a' : '#9dff8a', 2); M(`기울기 ${Math.round(Math.abs(r) * 57)}°`, cx, cy + 34, 7.5, '#ffffff', 'center', 700); }
  if (E.labSay && !E.caught) k.SUB(E.labSay.text, W / 2, HH - 94, 12, '#ffffff', 'center');
}
// ---- 대응책에 당한 화면: 먹통이 된 안경, 재난문자·EMP·눈 피로의 화면 효과, 입실 검사 장면 ----
function drawDeadHud(k, L, E, now, ST, sec) {
  const W = L.W, HH = L.H, b = k.b, low = E.timeLeft < 10 && Math.floor(now * 4) % 2;
  b.globalAlpha = 0.22; k.R(0, 0, W, HH, '#000000'); b.globalAlpha = 1;
  for (let i = 0; i < 5; i++) { const h = Math.abs(Math.sin(i * 12.9898 + Math.floor(now * 9) * 78.233) * 43758.5453) % 1; b.globalAlpha = 0.18; k.R(0, Math.floor(h * HH), W, 1, '#c9d4e0'); } b.globalAlpha = 1;
  k.SUB(E.finalQ ? '--:--' : `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`, W - 62, 44, 13, low ? '#ff6a6a' : '#ffffff', 'right'); k.SUB(`${Math.min(E.qi + 1, E.qs.length)} / ${E.qs.length}`, W - 62, 60, 9, '#e8e4da', 'right');
  if (ST === 'brain') { k.SUB('…머릿속이 조용하다.', W / 2, 60, 11, '#f0ece2', 'center'); return; }
  if (Math.floor(now * 1.5) % 2 === 0) k.M(E.dead === 'water' ? '침수 감지 · 전원 차단' : E.dead === 'storm' ? '모래폭풍 · 전원 차단' : E.dead === 'bolt' ? '낙뢰 · 재부팅 중' : '— NO SIGNAL —', W / 2, 44, 10, '#ff6a6a', 'center', 700);
}
function drawCounterFx(k, L, E, now, live) {
  const W = L.W, HH = L.H, b = k.b, T = E.T, p = E.pulse;
  if (E.wetT > 0 && E.ar) { const a = Math.min(1, E.wetT / 2); for (let i = 0; i < 9; i++) { const x = 60 + ((i * 197) % (W - 120)), y = 50 + ((i * 131) % (HH - 110)) + (8 - E.wetT) * (3 + i % 4); b.globalAlpha = 0.28 * a; k.disc(x, y, 5 + i % 4, '#cfeaff'); b.globalAlpha = 0.5 * a; k.disc(x - 1.5, y - 1.5, 1.5, '#ffffff'); } b.globalAlpha = 1; } // 렌즈의 물방울
  if (live && p && T.pulse === 'alert' && p.warn > 0) { const on = Math.floor(now * 7) % 2; b.globalAlpha = on ? 0.3 : 0.12; k.R(0, 0, 46, HH, '#ffcf5a'); k.R(W - 46, 0, 46, HH, '#ffcf5a'); b.globalAlpha = 1; k.SUB('(교실 여기저기서 재난문자 경보음이 울린다)', W / 2, HH - 48, 11, '#ffffff', 'center'); }
  if (live && E.cover) { const L0 = E.cover === 'L', x0 = L0 ? 0 : W - 92; b.globalAlpha = 0.5; k.R(L0 ? 0 : W - 130, 0, 130, HH, '#000000'); b.globalAlpha = 1; // 귀 가리기: 그쪽 화면 가장자리에 손이 올라온다
    k.R(x0, 70, 92, 190, '#d98a55'); k.R(x0 + (L0 ? 92 : -14), 96, 14, 150, '#d98a55'); for (let i = 0; i < 4; i++) k.R(x0 + (L0 ? 20 : 8), 92 + i * 42, 64, 3, '#b56f3f'); k.SUB('귀 가리는 중 · 받아 적기 멈춤', W / 2, HH - 48, 11, '#ffffff', 'center'); }
  else if (live && typeof earCheck === 'function' && earCheck()) { const s0 = earCheck(), L0 = s0.side === 'L', on = Math.floor(now * 6) % 2; b.globalAlpha = on ? 0.45 : 0.2; k.R(L0 ? 0 : W - 40, 0, 40, HH, '#ff5a5a'); b.globalAlpha = 1; k.SUB(`${L0 ? '◀ 왼쪽' : '오른쪽 ▶'}에서 귀 확인`, W / 2, HH - 48, 12, '#ffd0d0', 'center'); }
  if (live && E.family && E.family.phase !== 'idle') { const f = E.family, inn = f.phase === 'in'; // 가족 난입: 왼쪽에 방문이 열리고 사람이 서 있다
    k.R(0, 40, inn ? 96 : 26, HH - 80, '#ffe2a8'); if (inn) { k.R(30, 96, 40, 40, '#3a2a22'); k.R(34, 104, 32, 30, '#f0c7a0'); k.R(22, 136, 56, 110, '#c85a6a'); k.R(28, 150, 44, 70, '#f4efe6'); k.R(8, 176, 30, 8, '#e9e2d0'); k.R(12, 168, 8, 8, '#e8453e'); k.R(22, 168, 8, 8, '#f0a030'); k.R(38, 246, 12, 34, '#2b2f3d'); k.R(52, 246, 12, 34, '#2b2f3d');
      b.globalAlpha = 0.9; k.R(W / 2 - 150, 52, 300, 22, '#b3261e'); b.globalAlpha = 1; k.T('웹캠에 다른 사람이 잡혔다', W / 2, 63, 11, '#ffffff', 'center', 800); if (f.shoo > 0) { k.R(W / 2 - 60, 80, 120, 4, '#3a3548'); k.R(W / 2 - 60, 80, Math.round(120 * Math.min(1, f.shoo / 0.7)), 4, '#8dffa8'); } } }
  if (live && p && T.pulse === 'emp') {
    if (p.warn > 0) k.SUB('(천장 장치가 윙— 하고 충전된다)', W / 2, HH - 48, 11, '#ffffff', 'center');
    if (p.active > 0) { const f = 1 - p.active / 0.6, S = k.S || HUD_SCALE; b.save(); b.setTransform(S, 0, 0, S, 0, 0); b.globalAlpha = 0.25 * (1 - f); b.fillStyle = '#9fd0ff'; b.fillRect(0, 0, W, HH); b.globalAlpha = 0.9 * (1 - f); b.strokeStyle = '#cfe6ff'; b.lineWidth = 5; b.beginPath(); b.arc(W / 2, HH * 0.3, 20 + f * W * 0.75, 0, 7); b.stroke(); b.lineWidth = 1.5; b.beginPath(); b.arc(W / 2, HH * 0.3, 60 + f * W * 0.85, 0, 7); b.stroke(); b.restore(); b.globalAlpha = 1 - f; k.R(0, HH * 0.42, W, 4, '#ffffff'); k.R(0, HH * 0.66, W, 2, '#ffffff'); b.globalAlpha = 1; }
  }
  if (live && T.mech.includes('fatigue')) { const f = Math.min(1, E.part * 0.4) * (typeof gearCut === 'function' ? gearCut(E.gear.eyedrop) : 1); // 눈 피로: 블록이 쌓일수록 눈꺼풀이 내려오고, 저절로 깜빡인다
    if (f > 0.02) { const lid = f * 46, gap = 8 - f * 4, bl = (now % gap) < 0.16; let gr = b.createLinearGradient(0, 0, 0, lid * 1.6); gr.addColorStop(0, 'rgba(0,0,0,0.95)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); b.fillStyle = gr; b.fillRect(0, 0, W, lid * 1.6);
      gr = b.createLinearGradient(0, HH - lid * 1.4, 0, HH); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.95)'); b.fillStyle = gr; b.fillRect(0, HH - lid * 1.4, W, lid * 1.4);
      b.globalAlpha = 0.1 * f; k.R(0, 0, W, HH, '#7a1e1e'); b.globalAlpha = 1; if (E.qi === 0 && E.timeLeft > E.timeTotal - 3) k.SUB('…눈이 뻑뻑하다.', W / 2, HH - 70, 11, '#ffffff', 'center'); } }
}
function drawIntro(k, L, E, now) { // 입실 검사 장면의 자막과 화면 효과
  const I = E.intro, W = L.W, HH = L.H, b = k.b, t = I.t, who = E.T.staff[0].name, say = s => k.SUB(`${who}: "${s}"`, W / 2, HH - 48, 12, '#ffffff', 'center'), me = s => k.SUB(s, W / 2, HH - 48, 12, '#ffffff', 'center');
  if (I.kind === 'metal') { if (t > 1.5 && t < 2.3) { b.globalAlpha = Math.floor(now * 10) % 2 ? 0.22 : 0.08; k.R(0, 0, W, HH, '#ff2020'); b.globalAlpha = 1; k.M('삑—!', W / 2, 60, 16, '#ff6a6a', 'center', 700); } if (t < 1.5) say('소지품 검사하겠습니다.'); else say('…주머니에 뭐 있습니까? 일단 앉으세요.'); }
  else if (I.kind === 'water') { if (t < 3.5) say('안경은 전부 물에 담갔다가 돌려드립니다.'); else me(I.ok ? '(방수 덕에 멀쩡하다.)' : '(…안경이 켜지지 않는다.)'); }
  else if (I.kind === 'sticker') {
    const cam = E.gear.lens < tune.glass_level; // 옷과 스티커는 3D 장면에서 그린다 (world3d)
    if (t < 3.0) say('단추마다 스티커 붙이겠습니다. 떼면 퇴실입니다.'); else me(cam ? '(단추 카메라가 가려졌다.)' : '(안경이라 상관없다.)');
  }
}
// ---- 면접: 화면 왼쪽에 뜨는 AI 답변. 면접관이 안 볼 때 왼쪽을 누르고 있어야 한 문장씩 읽힌다 ----
function panelBox(k, x, y, w, h, col, title) { const b = k.b; b.globalAlpha = 0.72; k.R(x, y, w, h, '#08141c'); b.globalAlpha = 1; k.R(x, y, 2, h, col); k.M(title, x + 10, y + 11, 7.5, col, 'left', 700); }
function redact(k, x, y, w, a = 0.4) { k.b.globalAlpha = a; k.R(x, y - 3, w, 6, '#c9d4e0'); k.b.globalAlpha = 1; }
function drawAnswerPanel(k, L, E, now, q) {
  if (E.start > 0 || E.fb || !q.choices) return;
  const C1 = '#7fe9ff', x = 22, y = 64, w = 214, read = E.ai ? 4 : Math.floor(E.scan * 4 + 1e-6), blind = !E.ai && E.staff.some(s => s.fixed && s.phase === 'watch');
  const ch = i => `‘${q.choices[i]}’`, sents = [`${ch(q.elim[0])}는 답이 아닙니다.`, `${ch(q.elim[1])}도 아닙니다.`, `핵심은 ${ch(q.aiPick)}입니다.`, `그렇게 또박또박 답하세요. (확신 ${q.conf}%)`];
  const rows = sents.map(s => wrapKit(k, s, w - 30, 10).slice(0, 2)), h = 26 + rows.reduce((p, r) => p + r.length * 13 + 6, 0) + 8;
  panelBox(k, x, y, w, h, C1, blind ? 'AI 답변 · 면접관이 보는 중' : `AI 답변 · 4문장 중 ${read} 읽음`);
  let yy = y + 28;
  rows.forEach((ls, i) => { const done = i < read, cur = i === read && !blind;
    ls.forEach((ln, j) => { if (done && !blind) k.T((j === 0 ? '✓ ' : '   ') + ln, x + 10, yy, 10, i === 2 ? '#ffffff' : '#8fd8a8', 'left', i === 2 ? 800 : 700); else redact(k, x + 10, yy, Math.min(w - 24, k.TW(ln, 10, 700) + 12), cur ? 0.55 : 0.28); yy += 13; });
    if (cur) k.R(x + 10, yy - 5, Math.round((w - 24) * ((E.scan * 4) % 1)), 1.5, C1); yy += 6; });
  if (!E.ai && !blind && E.holding) { k.b.globalAlpha = 0.25; k.R(0, 0, 60, L.H, C1); k.b.globalAlpha = 1; k.M('◀ 읽는 중', 8, L.H / 2, 8, '#ffffff', 'left', 700); }
}
// ---- 서술형: 모범 답안 한 줄 읽고(위험), 그 줄을 옮겨 쓴다(안전) ----
function drawEssayPanel(k, L, E, now, q) {
  const es = E.es && E.es.q === q ? E.es : { done: 0, r: 0, w: 0, mem: 0 }, C1 = '#7fe9ff', x = 16, y = 66, w = 178, n = q.lines.length, h = 30 + n * 15 + 16;
  panelBox(k, x, y, w, h, C1, `${hudStage(E) === 'case' ? '필통 폰' : hudStage(E) === 'eraser' ? '지우개 액정' : 'AI'} 모범 답안 · ${Math.min(n, es.done + 1)} / ${n}줄`);
  q.lines.forEach((ln, i) => { const yy = y + 28 + i * 15;
    if (i < es.done) k.T('✓ ' + ln, x + 10, yy, 9, '#8fd8a8', 'left', 700);
    else if (i === es.done && es.mem > 0) k.T(ln, x + 10, yy, 9.5, '#ffffff', 'left', 800);
    else { redact(k, x + 10, yy, Math.min(w - 24, k.TW(ln, 9, 700) + 10), i === es.done ? 0.55 : 0.28); if (i === es.done && es.r > 0) k.R(x + 10, yy + 6, Math.round((w - 24) * es.r), 1.5, C1); } });
  const my = y + h - 10; k.M('기억', x + 10, my, 7, '#ffffff', 'left', 500); k.b.globalAlpha = 0.3; k.R(x + 34, my - 1.5, w - 46, 3, '#ffffff'); k.b.globalAlpha = 1; k.R(x + 34, my - 1.5, Math.round((w - 46) * Math.max(0, es.mem) / tune.essay_mem), 3, es.mem < 1.5 ? '#ff6a6a' : '#ffcf5a');
  if (E.holding) k.SUB(es.mem > 0 ? '옮겨 쓰는 중' : '읽는 중…', L.W / 2, L.H - 26, 10, es.mem > 0 ? '#8dffa8' : '#ffcf7a', 'center'); else if (es.erase > 0) k.SUB('급히 지우는 중…', L.W / 2, L.H - 26, 10, '#ff9a9a', 'center');
  { const tot = Math.round(clamp((es.done + es.w) / n, 0, 1) * 100), bx = L.W / 2 - 80; k.b.globalAlpha = 0.35; k.R(bx, 62, 160, 3, '#ffffff'); k.b.globalAlpha = 1; k.R(bx, 62, Math.round(160 * tot / 100), 3, tot >= 60 ? '#8dffa8' : '#ffcf5a'); k.M(`분량 ${tot}%`, bx + 164, 63.5, 7, '#ffffff', 'left', 500); } // 채운 분량이 곧 점수
}
// ---- LEET 쉬는 시간: 계단 질주 ----
function drawStairsHud(k, L, E, now) {
  const S = E.stairs, W = L.W, HH = L.H, M = k.M, R = k.R, b = k.b;
  if (S.phase === 'intro') {
    k.SUB(S.t < 2.2 ? '쉬는 시간이다.' : '…계단이 있다. 한번 뛰어 볼까?', W / 2, HH - 48, 13, '#ffffff', 'center');
    if (S.t > 2.2) { const tx = '왼쪽·오른쪽을 번갈아 빠르게 누르기 (← →)', tw = k.TW(tx, 11, 700) + 20; b.globalAlpha = 0.5; R(W / 2 - tw / 2, 47, tw, 18, '#0a0c0e'); b.globalAlpha = 1; k.T(tx, W / 2, 56, 11, '#f4f1e8', 'center', 700); }
  } else if (S.phase === 'run') {
    const next = S.last === 'L' ? 'R' : 'L', f = Math.max(0, S.left / tune.stairs_time), bw = 200;
    M(`${S.steps} 계단`, W / 2, 30, 15, '#ffffff', 'center', 700); b.globalAlpha = 0.35; R(W / 2 - bw / 2, 44, bw, 3, '#f4f1e8'); b.globalAlpha = 1; R(W / 2 - bw / 2, 44, Math.round(bw * f), 3, f < 0.25 ? '#ff6a6a' : '#f4f1e8');
    for (const [side, x, al] of [['L', 40, 'left'], ['R', W - 40, 'right']]) { const on = next === side; b.globalAlpha = on ? 1 : 0.4; M(side === 'L' ? '◀ 왼발' : '오른발 ▶', x, HH - 40, on ? 14 : 11, S.stumble > 0 && !on ? '#ff6a6a' : '#ffffff', al, 700); b.globalAlpha = 1; }
    const sp = Math.min(1, S.steps / Math.max(1, tune.stairs_need)); b.globalAlpha = 0.12 * sp; R(0, 0, 70, HH, '#ffffff'); R(W - 70, 0, 70, HH, '#ffffff'); b.globalAlpha = 1; // 빨라질수록 양옆이 하얗게 흐른다
  } else {
    const a = Math.min(1, S.t / 0.4); if (S.result === 'clear') { b.globalAlpha = 0.5 * (1 - Math.min(1, S.t / 1.6)); R(0, 0, W, HH, '#ffffff'); b.globalAlpha = 1; }
    b.globalAlpha = a; k.SUB(S.result === 'clear' ? '머리가 맑아졌다…!' : S.result === 'tired' ? '…숨만 차다. 들어가자.' : '…그냥 들어가자.', W / 2, HH - 48, 14, '#ffffff', 'center'); b.globalAlpha = 1;
  }
}
// ---- 책상 위 소품의 화면: 필통 속 폰(260x104) · 지우개 액정(128x64) ----
function drawGadgetScreen(g, E, now, kind) {
  { const cw = kind === 'case' ? 260 : 128, chh = kind === 'case' ? 104 : 64, big = kind === 'case' ? 30 : 17, alert = E.pulse && E.T.pulse === 'alert' && E.pulse.warn > 0 && kind === 'case';
    if (alert) { g.fillStyle = Math.floor(now * 8) % 2 ? '#c8242a' : '#7a1016'; g.fillRect(0, 0, cw, chh); g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.font = `800 30px ${FONT_BODY}`; g.fillText('긴급재난문자', cw / 2, 62); return; }
    if (E.dead) { g.fillStyle = E.dead === 'sticker' ? '#e8802a' : '#060608'; g.fillRect(0, 0, cw, chh); g.fillStyle = E.dead === 'sticker' ? '#4a2400' : '#3a3a44'; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.font = `800 ${big}px ${FONT_BODY}`; g.fillText(E.dead === 'sticker' ? '카메라 가려짐' : '전원 꺼짐', cw / 2, chh / 2 + big * 0.35); return; } }
  const F = FONT_BODY, q = E.qs[Math.min(E.qi, E.qs.length - 1)], picked = E.ai && !E.fb && q, scanning = E.scan > 0 && !E.ai && !E.fb;
  g.textBaseline = 'alphabetic';
  if (kind === 'case') {
    const w = 260, h = 104; g.fillStyle = '#17212b'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#f1ecdc'; g.fillRect(8, 12, 62, 80); g.fillStyle = '#8a8676'; for (let i = 0; i < 5; i++) g.fillRect(14, 30 + i * 12, 40 - (i % 2) * 10, 3); // 찍어 보낸 사진
    if (Math.floor(now * 2) % 2) { g.fillStyle = '#ff4a4a'; g.beginPath(); g.arc(16, 20, 3, 0, 7); g.fill(); } g.fillStyle = '#c02a2a'; g.font = `800 9px ${F}`; g.textAlign = 'left'; g.fillText('REC', 22, 23);
    g.fillStyle = '#7fb8e8'; g.font = `700 15px ${F}`; g.fillText('답안봇', 82, 24);
    if (picked) { g.fillStyle = '#ffffff'; g.font = `800 50px ${F}`; g.fillText(`${q.aiPick + 1}번`, 80, 72); g.fillStyle = '#bfe0ff'; g.font = `700 17px ${F}`; g.fillText(`확신 ${q.conf}%`, 82, 94); }
    else if (scanning) { g.fillStyle = '#c9d4e0'; g.font = `700 20px ${F}`; g.fillText(`읽는 중… ${Math.round(E.scan * 100)}%`, 82, 52); g.fillStyle = '#3a4656'; g.fillRect(82, 62, 164, 7); g.fillStyle = '#5eb5f7'; g.fillRect(82, 62, Math.round(164 * E.scan), 7);
      const st = Math.min(2, Math.floor(E.scan * 3 + 1e-6)); if (st > 0) { g.fillStyle = '#9fc4e0'; g.font = `700 17px ${F}`; g.fillText(`${q.elim.slice(0, st).map(i => i + 1).join('·')}번 아님`, 82, 92); } }
    else { g.fillStyle = '#5a6a7c'; g.font = `700 17px ${F}`; g.fillText('대기 중', 82, 58); }
    g.globalAlpha = 0.12; g.fillStyle = '#000000'; for (let y = 0; y < h; y += 3) g.fillRect(0, y, w, 1); g.globalAlpha = 1;
  } else {
    const w = 128, h = 64, on = picked || scanning; g.fillStyle = on ? '#9fb08c' : '#69735e'; g.fillRect(0, 0, w, h); if (!on) return;
    g.fillStyle = '#1c2416'; g.textAlign = 'left';
    if (picked) { g.font = `800 58px "SF Mono","Menlo","Consolas",monospace`; g.fillText(String(q.aiPick + 1), 10, 54); g.font = `800 24px "SF Mono","Menlo","Consolas",monospace`; g.textAlign = 'right'; g.fillText(`${q.conf}%`, 122, 30); for (let i = 0; i < 5; i++) { g.globalAlpha = i < Math.round(q.conf / 20) ? 1 : 0.25; g.fillRect(60 + i * 13, 40, 9, 14); } g.globalAlpha = 1; }
    else { for (let i = 0; i < 8; i++) { g.globalAlpha = i < Math.round(E.scan * 8) ? 1 : 0.22; g.fillRect(10 + i * 14, 12, 10, 18); } g.globalAlpha = 1; const st = Math.min(2, Math.floor(E.scan * 3 + 1e-6)); if (st > 0) { g.font = `800 20px "SF Mono","Menlo","Consolas",monospace`; g.fillText(q.elim.slice(0, st).map(i => 'x' + (i + 1)).join(' '), 10, 54); } }
  }
}

// ---- 시험 중 안경 HUD ----
function drawExamHud(k, L, E, now, H) {
  if (E.boss && window.BOSS && BOSS[E.boss].hud && BOSS[E.boss].hud(k, L, E, now, H)) { drawExamOverlays(k, L, E, now, H); return; } // 보스전이 렌즈 화면을 통째로 그리는 구간
  const X = EXAM_LAYOUT, C = PAL, { R, T, TO } = k, tier = E.T;
  const live = E.start <= 0 && !E.over && !E.caught && !(E.breakT > 0), onPaper = E.view === 'paper' && E.viewT >= 1, VF = CONFIG.hud_style === 'viewfinder';
  const q = E.qs[Math.min(E.qi, E.qs.length - 1)];
  const ST0 = hudStage(E), away = E.intro && E.intro.kind === 'water' && E.intro.t > 1.0 && E.intro.t < 3.9, deadHud = !!E.dead && ['used', 'proto', 'mil', 'contact', 'brain'].includes(ST0); // 안경을 뺏긴 동안은 맨눈
  const ST = away ? 'none' : ST0, INK = HUD_INK[ST] || H.c;
  if (ST === 'used' || ST === 'mil' || ST === 'proto') { k.b.globalAlpha = ST === 'used' ? 0.1 : ST === 'mil' ? 0.07 : 0.03; for (let y = 1; y < L.H; y += 3) R(0, y, L.W, 1, INK); k.b.globalAlpha = 1; } // 렌즈 스캔라인: 싼 안경일수록 짙다
  if (E.pulse && (E.pulse.warn > 0 || E.pulse.active > 0) && E.pulseCut > 0) { // 탐지 전파·드론: 렌즈에 잡음
    const strong = E.pulse.active > 0, n = strong ? 26 : 9;
    for (let i = 0; i < n; i++) {
      const hsh = Math.abs(Math.sin(i * 12.9898 + Math.floor(now * 30) * 78.233) * 43758.5453) % 1;
      k.b.globalAlpha = (strong ? 0.5 : 0.25) * Math.min(1, E.pulseCut * 1.5);
      R(Math.floor(((hsh * 13) % 1) * L.W), Math.floor(hsh * L.H), 30 + Math.floor(((hsh * 7) % 1) * (L.W * 0.6)), 1, strong ? C.bad : H.c);
    }
    k.b.globalAlpha = 1;
  }
  drawLabFx(k, L, E, now, live);
  const pl = (E.omegaDown || 0) >= 2 ? 0 : E.gear.predict; // 시선 예측 (Ω는 중반부터 이것도 끈다): 그쪽 렌즈 가장자리가 경고 (3단계부터 쳐다볼 때도 빨갛게)
  if (pl >= 3 && live && E.layout === 'room' && ST0 !== 'contact') { // 후방 카메라: 등 뒤 감독관을 위쪽 작은 화면에 (콘택트렌즈는 위 호의 마디로 따로 그린다)
    const back = E.staff.filter(s => !s.fixed && !s.out && !(s.blink > 0) && s.phase !== 'help' && s.u < 0.37), bx = L.W / 2 - 46, by = ST0 === 'mil' ? 36 : ST0 === 'brain' ? 58 : ST0 === 'contact' ? 11 : 8;
    if (ST0 === 'brain') { const w0 = back.find(x => x.phase === 'watch') || back.find(x => x.phase === 'tell') || back[0]; if (w0) k.SUB(w0.phase === 'watch' ? `등 뒤 ${w0.side === 'L' ? '왼쪽' : '오른쪽'}에서 보고 있다는 느낌` : `등 뒤 ${w0.side === 'L' ? '왼쪽' : '오른쪽'}에 인기척`, 22, 20, 10, w0.phase === 'watch' ? '#ff9a9a' : w0.phase === 'tell' ? '#ffcf5a' : '#f0ece2', 'left'); } else {
    if (ST0 === 'contact') hudDraw(k, c => { rrect(c, bx, by, 92, 18, 9); c.fillStyle = 'rgba(8,10,14,0.92)'; c.fill(); c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 1.5; c.stroke(); }); // 콘택트렌즈: 위 호의 한가운데에 얹힌 둥근 마디처럼
    else { k.b.globalAlpha = 0.5; R(bx, by, 92, 18, '#0a0a0e'); k.b.globalAlpha = 0.85; k.frame(bx, by, 92, 18, '#ffffff', 1); k.b.globalAlpha = 1; }
    k.M('후방', bx + 46, by + 9.5, 7.5, '#ffffff', 'center', 700);
    for (const s of back) { const col = s.phase === 'watch' ? C.bad : s.phase === 'tell' ? C.warn : '#c9c4d8', x = s.side === 'L' ? bx + 14 : bx + 78; k.disc(x, by + 9, 4, col); if (s.phase === 'watch') k.ring(x, by + 9, 6, C.bad); } }
  }
  if (ST0 === 'brain' && live && !E.boss) for (const sd of ['L', 'R']) { const o = Math.max(0, ...E.staff.filter(s => s.side === sd).map(omenOf)); // 뉴럴링코 '예감': 곧 돌아볼 쪽부터 시야가 붉게 조여 온다
    if (o > 0) { const beat = 0.8 + 0.2 * Math.sin(now * 12.6), reach = L.W * (0.16 + 0.26 * o) * beat, x0 = sd === 'L' ? 0 : L.W;
      hudDraw(k, c => { const g = c.createLinearGradient(x0, 0, sd === 'L' ? reach : L.W - reach, 0); g.addColorStop(0, `rgba(150,8,30,${(0.35 + 0.5 * o) * beat})`); g.addColorStop(0.55, `rgba(150,8,30,${0.22 * o})`); g.addColorStop(1, 'rgba(150,8,30,0)'); c.fillStyle = g; c.fillRect(sd === 'L' ? 0 : L.W - reach, 0, reach, L.H); });
      k.b.globalAlpha = 0.3 + 0.7 * o; k.b.drawImage(lensGlow(sd, '#ff3a52'), 0, 0); k.b.globalAlpha = 1; } }
  if (pl > 0 && live && E.layout === 'room') {
    for (const sd of ['L', 'R']) {
      const st = E.staff.filter(s => s.side === sd && s.phase !== 'cross' && !s.out && !(s.blink > 0) && !s.fixed);
      if (pl >= 3 && st.some(s => s.phase === 'watch')) { k.b.globalAlpha = 0.75; k.b.drawImage(lensGlow(sd, C.bad), 0, 0); }
      else if (st.some(s => s.phase === 'tell' || (s.phase === 'check' && s.check && s.check.stage === 'go'))) { k.b.globalAlpha = Math.floor(now * 6) % 2 ? 0.85 : 0.45; k.b.drawImage(lensGlow(sd, C.warn), 0, 0); }
      k.b.globalAlpha = 1;
    }
    const fx = E.staff.filter(s => s.fixed && s.type !== 'webcam');
    if (fx.some(s => s.phase === 'tell')) { k.b.globalAlpha = Math.floor(now * 6) % 2 ? 0.8 : 0.4; k.b.drawImage(lensGlow('T', C.warn), 0, 0); k.b.globalAlpha = 1; }
  }
  const sv = E.T.mech.includes('eyeline') ? Math.max(0, (0.75 - (E.eye == null ? 1 : E.eye)) / 0.75) : E.sus; // [AI 대면 면접] 시선 게이지가 차면 렌즈 둘레가 붉어진다
  if (sv > 0.02 || E.rising) { // 의심도: 렌즈 둘레가 붉어지고, 보는 중에 스캔하면 깜빡인다
    const base = Math.min(0.85, 0.12 + sv * 0.9), a = E.rising ? Math.min(1, base + 0.35 + 0.3 * Math.sin(now * 16)) : base;
    k.b.globalAlpha = Math.max(0, a); k.b.drawImage(lensGlow('A', C.bad), 0, 0); k.b.globalAlpha = 1;
  }
  const RHV = typeof params !== 'undefined' && params.get('rh');
  if (E.T.mech.includes('eyeline')) { if (live && q && q.kind === 'speak') drawEyeline(k, L, E, now, q, ST0, INK); drawHoloScore(k, L, E, now); } else // [AI 대면 면접] 눈 맞춤 줄다리기는 왼쪽 허공의 대본 창 + 자막
  if ((E.layout === 'table' || (E.qs[Math.min(E.qi, E.qs.length - 1)] || {}).kind === 'speak') && !E.result && RHV !== '3' && !(typeof IVABC !== 'undefined' && IVABC && E.sq && q && E.sq.q === q)) drawArCard(k, L, E, now, H);
  if (typeof IVABC !== 'undefined' && IVABC && live && q && q.kind === 'speak' && E.sq) drawAbc(k, L, E, now, q);
  if (RHV && live && q && q.kind === 'speak') drawRhythmPreview(k, L, E, now, RHV, q);
  if (q && q.kind === 'essay' && live && E.view === 'paper' && !E.result) drawEssayPanel(k, L, E, now, q);
  if (E.finalQ) { // 마지막 문제: 렌즈가 깨진다
    const n = Math.round(6 + E.glitch * 26);
    for (let i = 0; i < n; i++) { const h = Math.abs(Math.sin(i * 12.9898 + Math.floor(now * 18) * 78.233) * 43758.5453) % 1; k.b.globalAlpha = 0.25 + E.glitch * 0.4; R(Math.floor(((h * 13) % 1) * L.W) - 60, Math.floor(h * L.H), 60 + Math.floor(((h * 7) % 1) * 260), 1 + Math.floor(((h * 5) % 1) * 3), i % 3 === 0 ? '#ff3a8a' : i % 3 === 1 ? H.c : '#ffffff'); }
    k.b.globalAlpha = 1;
    if (E.ai && Math.floor(now * 3) % 2) T('ERR: 응답자 확인 불가', L.W / 2 + Math.round(Math.sin(now * 40) * 3), 52, 11, '#ff3a8a', 'center', 800);
  }
  if (E.ar && ST !== 'brain' && ST !== 'mil' && E.layout !== 'table' && live && (onPaper || E.layout !== 'room') && E.scan > 0 && !E.ai && !E.fb) { // 스캔 진행 막대 (1/3, 2/3 눈금)
    const thin = ST === 'proto' || ST === 'contact', bw = thin ? 160 : 240, bx = L.W / 2 - bw / 2, by = 76, bh = thin ? 2 : 3;
    k.b.globalAlpha = 0.45; R(bx - 1, by - 1, bw + 2, bh + 2, '#0a0c0e'); k.b.globalAlpha = 1; R(bx, by, Math.round(bw * E.scan), bh, INK);
    for (const f of [1 / 3, 2 / 3]) R(bx + Math.round(bw * f) - 1, by - 2, 1, bh + 4, '#f4f1e8');
  }
  // 시험마다 다른 장치: 꼭 필요할 때만
  if (live && q && q.kind === 'listen' && !E.ai && !E.fb) {
    if (E.gear.earbud > 0) { // 이어폰이 없으면 아무 표시도 없다: 방송만 들린다
      for (let i = 0; i < 10; i++) R(30 + i * 4, L.H - 62 - (4 + Math.abs(Math.sin(now * 9 + i * 1.7)) * 12) / 2, 2, 4 + Math.abs(Math.sin(now * 9 + i * 1.7)) * 12, '#ffffff');
      k.SUB(`(이어폰) 받아쓰는 중 ${Math.round(E.listen * 100)}%`, 80, L.H - 62, 10, '#ffffff', 'left'); }
  }
  const cam = E.staff.find(s => s.type === 'webcam');
  if (cam && live) { // 원격 감독 웹캠 불
    const on = cam.phase === 'watch', tell = cam.phase === 'tell', blink = Math.floor(now * 8) % 2;
    const col = on ? C.bad : tell ? (blink ? C.warn : '#5a3a1a') : '#3a3340';
    k.disc(L.W / 2 - 30, 54, 3.5, col); k.M(on ? '웹캠 LIVE' : tell ? '웹캠 ...' : '웹캠 꺼짐', L.W / 2 - 22, 54.5, 9, on ? '#ff6a6a' : tell ? '#ffcf5a' : '#e8e4da', 'left', 700);
  }
  const chk = E.staff.find(s => s.phase === 'check' && s.check && s.check.stage === 'at');
  if (chk && live) { // 감독관이 내 책상 앞에
    const off = E.gear.autooff > 0;
    k.b.globalAlpha = 0.35; R(0, 0, L.W, 26, '#1a0608'); k.b.globalAlpha = 1;
    if (off) k.SUB(E.gear.autooff >= 2 ? '(렌즈가 스스로 꺼졌다 · 스캔 멈춤)' : '(렌즈가 스스로 꺼졌다)', L.W / 2, L.H - 70, 10, '#e8e4da', 'center');
  }
  if (tier.mech.includes('human') && live) { // 인간 인증: AI 의심도
    const x = 24, y = 300, w = 120;
    k.M(`AI 감지 ${Math.round(E.aiSus * 100)}%`, x, y - 9, 8, E.aiSus > 0.6 ? '#ff6a6a' : '#ffffff', 'left', 700);
    k.b.globalAlpha = 0.3; R(x, y, w, 2, '#ffffff'); k.b.globalAlpha = 1; R(x, y, Math.round(w * E.aiSus), 2, E.aiSus > 0.6 ? '#ff6a6a' : '#ffcf5a');
  }
  if (live && E.call) drawCallHud(k, L, E, now); // [저승] 내 이름을 부르는 속삭임
  if (live && E.staff.some(s => s.phase === 'peek' && s.peek.stage === 'sneak') && E.gear.predict >= 2) { k.b.globalAlpha = Math.floor(now * 8) % 2 ? 0.9 : 0.4; TO('발소리가 사라졌다…', L.W / 2, 96, 12, C.warn); k.b.globalAlpha = 1; }
  if (live && E.mole && E.mole.phase === 'tell') { k.b.globalAlpha = Math.floor(now * 8) % 2 ? 0.9 : 0.4; TO('앞자리 의자가 들썩인다…', L.W / 2, 96, 12, C.warn); k.b.globalAlpha = 1; } // 비밀 감독관이 돌아보기 직전
  if (live && E.mole && E.gear.predict >= 4 && WORLD.moleRect) { const r0 = WORLD.moleRect(), r = r0 && r0.h > 30 && r0.y + r0.h > 20 && r0.y < L.H - 20 ? r0 : null, m = E.mole; // 감독관 동선 AI: 들썩인 뒤 언제 돌아볼지를 센다. 앞을 볼 때는 앞자리 사람에게 붙고, 시험지를 볼 때는 화면 위쪽에 붙는다
    const col = m.phase === 'look' ? '#ff5a5a' : m.phase === 'tell' ? '#ffcf5a' : '#7fe9ff', txt = m.phase === 'look' ? '주시 중' : m.phase === 'tell' ? `돌아봄까지 ${Math.max(0, m.t).toFixed(1)}초` : '움직임 없음', f = m.phase === 'tell' ? clamp(1 - m.t / (m.tell || 2), 0, 1) : m.phase === 'look' ? 1 : 0;
    if (r) { const lx = Math.max(8, r.x - 120), ly = r.y + 4, q0 = 9;
      hudDraw(k, c => { c.strokeStyle = col; c.lineWidth = 1.5; c.beginPath(); for (const [cx, cy, dx, dy] of [[r.x, r.y, 1, 1], [r.x + r.w, r.y, -1, 1], [r.x, r.y + r.h, 1, -1], [r.x + r.w, r.y + r.h, -1, -1]]) { c.moveTo(cx + dx * q0, cy); c.lineTo(cx, cy); c.lineTo(cx, cy + dy * q0); } c.stroke();
        c.globalAlpha = 0.6; c.beginPath(); c.moveTo(r.x, r.y + 12); c.lineTo(lx + 108, ly + 8); c.stroke(); c.globalAlpha = 1; c.fillStyle = 'rgba(6,20,26,0.82)'; c.fillRect(lx, ly, 108, 38); c.fillStyle = col; c.fillRect(lx, ly, 2, 38);
        if (f > 0) { c.globalAlpha = 0.3; c.fillStyle = '#ffffff'; c.fillRect(lx + 8, ly + 30, 92, 3); c.globalAlpha = 1; c.fillStyle = col; c.fillRect(lx + 8, ly + 30, 92 * f, 3); } });
      k.M('앞자리 분석', lx + 8, ly + 9, 7.5, col, 'left', 700); k.M(txt, lx + 8, ly + 21, 9, '#ffffff', 'left', 700); }
    else if (m.phase !== 'idle') { const st1 = hudStage(E), look = m.phase === 'look', sec = Math.max(0, m.t).toFixed(1), W0 = L.W; // 시험지를 보는 중: 안경 단계마다 그 화면의 말투와 자리에 맞춰, 시험지 바깥에 띄운다
      if (st1 === 'brain') { k.T(look ? '앞자리가 나를 보고 있다는 느낌' : `앞자리가 ${sec}초 뒤 돌아본다는 느낌`, W0 - 11, 47, 9.5, look ? '#ff8a8a' : '#ffd678', 'right', 700); } // 뉴럴링코: 창 없이 직감 한 줄
      else if (st1 === 'contact') { const x = 30, y = 96; // 콘택트렌즈: 감독관 표시와 같은 둥근 고리 + 알약
        hudDraw(k, c => { c.fillStyle = 'rgba(8,44,52,0.45)'; c.beginPath(); c.arc(x, y, 14, 0, 7); c.fill(); c.lineCap = 'round'; c.lineWidth = 3; c.strokeStyle = 'rgba(255,255,255,0.2)'; c.beginPath(); c.arc(x, y, 14, 0, 7); c.stroke(); c.strokeStyle = col; c.beginPath(); c.arc(x, y, 14, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * f); c.stroke(); rrect(c, x + 19, y - 9, 84, 18, 9); c.fillStyle = 'rgba(8,44,52,0.42)'; c.fill(); });
        k.T(look ? '!' : sec, x, y, 9, '#ffffff', 'center', 700); k.T(look ? '앞자리 주시 중' : '앞자리 돌아봄', x + 26, y, 7, col, 'left', 700); }
      else if (st1 === 'mil') { const x = W0 - 148, y = 190, w = 116, h = 30; // 군용 렌즈: 전술 지도 아래에 표적 항목 하나로
        hudDraw(k, c => { c.fillStyle = 'rgba(40,26,6,0.6)'; c.fillRect(x, y, w, h); c.strokeStyle = col; c.lineWidth = 1; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); c.fillStyle = col; c.fillRect(x, y, w, 2); c.globalAlpha = 0.3; c.fillRect(x + 6, y + 23, w - 12, 3); c.globalAlpha = 1; c.fillRect(x + 6, y + 23, (w - 12) * f, 3); });
        k.M('TGT-F 앞자리', x + 6, y + 9, 7, col, 'left', 700); k.M(look ? 'EYES ON' : `TURN T-${sec}`, x + w - 6, y + 9, 8.5, '#ffffff', 'right', 700); }
      else if (st1 === 'proto') { const x = W0 - 172, y = 158, w = 135; panelBox(k, x, y, w, 40, col, '앞자리 분석'); k.T(txt, x + 10, y + 27, 9.5, '#ffffff', 'left', 800); hudDraw(k, c => { c.globalAlpha = 0.3; c.fillStyle = '#ffffff'; c.fillRect(x + 10, y + 34, w - 20, 2); c.globalAlpha = 1; c.fillStyle = col; c.fillRect(x + 10, y + 34, (w - 20) * f, 2); }); } // 시제품: AI 분석 창 바로 아래에 같은 모양의 창
      else { const n = Math.round(f * 5); k.M(`앞자리 ${'▮'.repeat(n)}${'▯'.repeat(5 - n)} ${look ? '주시 중' : sec + '초'}`, 61, 66, 9, col, 'left', 700); } } } // 중고 안경: 배터리 줄 아래에 같은 글씨로 한 줄
  if (live && E.T.mech.includes('lookcount')) { const n = E.looks || 0, lim = E.T.lookLimit || 10, hot = n >= lim - 2, tw = 118; k.b.globalAlpha = 0.8; k.R(26, 64, tw, 18, hot ? '#5a1014' : '#0a0a0e'); k.b.globalAlpha = 1; k.M(`시선 이탈 ${n} / ${lim}`, 26 + tw / 2, 73.5, 9.5, hot ? '#ff8a8a' : '#ffffff', 'center', 700); } // 홈에디션: 감독 프로그램이 화면 밖을 본 횟수를 센다 // 시선 예측 2단계부터 경고
  // 떠다니는 안내 글자는 쓰지 않는다: 소리와 화면 속 움직임으로 안다
  if (E.say && !E.caught && !E.over) { const a = E.say.t < 2.4 ? 1 : Math.max(0, (3 - E.say.t) / 0.6); k.b.globalAlpha = a; const tw = k.TW(E.say.text, 11, 800) + 24; k.b.globalAlpha = a * 0.78; k.R(L.W / 2 - tw / 2, L.H - 96, tw, 20, '#0a0a0e'); k.b.globalAlpha = a; k.T(E.say.text, L.W / 2, L.H - 86, 11, E.say.col || '#ffffff', 'center', 800); k.b.globalAlpha = 1; } // 사건 알림: 검은 띠 위의 한 줄
  if (false && E.flash) { const a = E.flash.t < 1.2 ? 1 : (1.6 - E.flash.t) / 0.4; k.b.globalAlpha = a; TO(E.flash.text, L.W / 2, 96, 14, E.flash.col || C.warn); k.b.globalAlpha = 1; }
  const sec = Math.max(0, Math.ceil(E.timeLeft));
  if (deadHud) drawDeadHud(k, L, E, now, ST, sec); else if (ST !== 'none') { drawStageHud(k, L, E, now, ST, INK, sec, pl, live, q); drawStageFx(k, L, E, now, ST, INK, live, q); }
  drawCounterFx(k, L, E, now, live);
  if (live && E.ai && !E.fb && E.gear.earbud > 0 && !E.dead && q && !q.final && q.kind !== 'essay' && Math.floor(now * 0.8) % 3 !== 2) k.SUB(`(이어폰) “…${q.aiPick + 1}번…”`, L.W / 2, L.H - 70, 10, '#e8e4da', 'center'); // AI 이어폰: 어디를 보고 있어도 답이 들린다
  if (E.runShown) T(fmtRun(E.runShown), 48, 40, 10, H.c2, 'left', 700);
  if (ST === 'used') k.b.drawImage(rimFor('land'), 0, 0); else if (ST === 'proto') k.b.drawImage(rimFor('land', 1.16), 0, 0); // 안경테: 중고는 두껍고 시제품은 얇다. 렌즈·임플란트는 테가 없다
  if (E.boss && window.BOSS && BOSS[E.boss].hudTop) BOSS[E.boss].hudTop(k, L, E, now, H); // 보스전이 렌즈 화면 위에 덧그리는 것
  drawExamOverlays(k, L, E, now, H);
}

function drawExamOverlays(k, L, E, now, H) {
  const { R, T, TO } = k, C = PAL, X = EXAM_LAYOUT, tier = E.T;
  if (E.result || E.intro) return; // 결과는 책상 위 성적 통지표로 본다. 입실 검사 중에는 그 장면의 자막만
  if (E.guide && !E.caught && !E.over && E.start <= 0) { // 첫 시험 조작 안내: 누를 자리에 손가락과 고리, 아래에 자막
    const gd = E.guide, b = k.b, W = L.W, HH = L.H, u = (now % 1.6) / 1.6;
    const spot = (x, y, arrow) => { // 시안 B의 치수 그대로: 지름 73의 흰 고리(굵기 5) + 바깥으로 10짜리 옅은 흰 테. 움직임 없음
      b.save(); b.strokeStyle = 'rgba(255,255,255,0.25)'; b.lineWidth = 10.5; b.beginPath(); b.arc(x, y, 36.7 + 5.25, 0, 7); b.stroke();
      b.strokeStyle = '#ffffff'; b.lineWidth = 5.2; b.beginPath(); b.arc(x, y, 34.1, 0, 7); b.stroke(); b.restore();
      if (arrow) k.SUB(arrow, x, y + 1, 31, '#ffffff', 'center'); };
    const cap = str => k.SUB(str, W / 2, HH - 30, 22, '#ffffff', 'center');
    if (gd.k === 'hold') { if (!gd.on) { b.save(); b.shadowColor = 'rgba(0,0,0,0.55)'; b.shadowBlur = 4 * HUD_SCALE; spot(372, 196, null); b.restore(); } /* 가운데에서 살짝 오른쪽. 흰 시험지 위라 이 고리에만 옅은 그림자 */ cap('책상을 꾹 누르면 카메라가 문제를 읽는다'); }
    else if (gd.k === 'up') { spot(W / 2, 43, '↑'); cap('화면 위쪽을 누르면 정면을 본다'); }
    else if (gd.k === 'sides') { spot(51, 173, '←'); spot(W - 51, 173, '→'); cap('양옆을 누르면 그쪽으로 고개를 돌린다'); }
    else if (gd.k === 'end') cap('감독관이 볼 때는 손을 뗀다. 이제 시작!');
  }
  if (E.hint && !E.caught && !E.over) {
    const tw = k.TW(E.hint, 12, 800) + 20, y = X.hintY + 34;
    if (CONFIG.hud_style === 'viewfinder') { k.b.globalAlpha = 0.5; R(L.W / 2 - tw / 2, y - 9, tw, 18, '#0a0c0e'); k.b.globalAlpha = 1; T(E.hint, L.W / 2, y, 11, '#f4f1e8', 'center', 700); }
    else { R(L.W / 2 - tw / 2, y - 10, tw, 20, C.white); k.frame(L.W / 2 - tw / 2, y - 10, tw, 20, C.ol, 1); T(E.hint, L.W / 2, y, 12, C.ink, 'center', 800); }
  }
  if (E.showZones && !E.guide && !(E.tier === 0 && G.stats.exams === 0) && (E.view === 'front' || E.view === 'paper') && !E.caught && !E.over && E.start <= 0 && E.layout === 'room') {
    const zw = Math.round(L.W * X.zone);
    if (CONFIG.hud_style === 'viewfinder') { if (Math.floor(now * 2) % 2 === 0) { k.M('◀ HOLD', 24, L.H / 2, 9, '#f4f1e8', 'left', 700); k.M('HOLD ▶', L.W - 24, L.H / 2, 9, '#f4f1e8', 'right', 700); } }
    else { k.b.globalAlpha = 0.14; R(0, 0, zw, L.H, C.white); R(L.W - zw, 0, zw, L.H, C.white); k.b.globalAlpha = 1;
    if (Math.floor(now * 2) % 2 === 0) { TO('<', zw / 2 + 8, L.H / 2, 22, C.white); TO('>', L.W - zw / 2 - 8, L.H / 2, 22, C.white); } }
  }
  if (E.clear && E.qi === 0 && E.start <= 0 && !E.fb && !E.over && !E.caught) k.SUB('…글이 한눈에 들어온다.', L.W / 2, L.H - 48, 12, C.white, 'center');
  if (E.breakT > 0 && !E.caught && !E.boss && !(E.evict && E.evict.end && E.evict.t < E.evict.end)) { // 쉬는 시간 종소리 뒤의 안내 방송 (앞자리가 끌려 나가는 동안은 조용히)
    
    k.SUB(`${tier.staff[0].name}: "쉬는 시간입니다. 다음은 ${tier.parts[E.part]}."`, L.W / 2, L.H - 48, 12, C.white, 'center', 800);
  }
  if (E.start > 0 && !E.noStartLine) { // 감독관의 안내 방송 (자막)
    const notes = (E.startNotes || []).map(n => n.text), who = tier.staff[0].name;
    const l1 = `${who}: "${tier.parts ? tier.parts[E.part] + ', ' : ''}${tier.name}${tier.boss ? '. 마지막 관문입니다' : ''}. 지금부터 시작합니다."`, l2 = notes.length ? `"${notes.join(' · ')}"` : '';
    
    let s1 = 12; while (k.TW(l1, s1, 800) > L.W - 40 && s1 > 9) s1--; k.SUB(l1, L.W / 2, L.H - 48, s1, C.white, 'center', 800);
    if (l2) { let s2 = 11; while (k.TW(l2, s2, 700) > L.W - 40 && s2 > 8) s2--; T(l2, L.W / 2, L.H - 30, s2, '#d8d3e6', 'center', 700); }
  }
  if (E.over && !E.caught) { const es = (typeof END_SAY !== 'undefined' && END_SAY[tier.id]) || ['답안지 걷겠습니다.', '시험 종료. 필기구 내려놓으세요.']; k.SUB(E.endLine || `${tier.staff[0].name}: "${E.all ? es[0] : es[1]}"`, L.W / 2, L.H - 48, 12, C.white, 'center', 800); } // 면접·구술은 시험마다 맞는 마지막 말 (END_SAY)
  if (E.caught) { // 적발: 타이틀과 같은 안경 화면이 빨갛게 바뀐다
    const who = E.caughtBy || tier.staff[0];
    const why = { peek: '책상 밑에서 올려다보던 눈과 마주침', emp: 'EMP에 기기가 드러남', cctv: 'CCTV에 찍힘', pulse: 'AI 탐지 전파에 걸림', drone: '드론 전파에 걸림', screen: '화면 검사에 걸림', check: '책상 앞 검사에 걸림',
      webcam: '웹캠에 찍힘', looks: '시선 이탈 횟수 초과', ear: '귀의 이어폰을 들킴', mole: '앞자리 비밀 감독관과 눈이 마주침', mirror: '거울에 비친 감독관에게 들킴', sweep: '전수 스캔에 걸림', noise: '생각이 새어 나감', drone: '드론에 찍힘', loop: '지난 회차와 같은 때에 숙임', breath: '숨이 막혀 허우적거림', mind: '떠올린 답을 읽힘', gaze: '시선 이탈 5초', eyeline: '대본만 너무 오래 봄 · 시선 이탈', ai: 'AI 사용이 감지됨', omega: 'Ω가 스캔 박자를 읽음', call: '세 번 부를 때까지 돌아보지 않음', ghost: '물이 떨어지는 쪽을 올려다봄' }[E.caughtHow] || `${who.name}에게 걸림`;
    drawLensScreen(k, L, now, { col: '#ff5a5a', glow: '#4a0a0a', tint: '#28060a', big: '적발', lines: ['LENS-OS 0.9b', `${who.name} ....... 정면 주시`, '장비 ......... 노출됨', '연결 ......... 끊김'], sub: E.T.mech.includes('tutorial') ? '혼나고 끝 (모의고사라 다행)' : '이번 시험 0점 처리' });
    k.SUB(`${who.name}: ${CAUGHT_LINE[who.type] || CAUGHT_LINE.dean}`, L.W / 2, L.H - 62, 13, '#ffffff', 'center');
    k.SUB(why, L.W / 2, L.H - 42, 9, '#e8e4da', 'center');
  }
}

// [블랙홀] 시공간 요동 연출 (시험지 텍스처 위에 덧그린다)
// 떨림: 글자 줄이 미세하게 흔들린다 · 섞임: 가운데로 빨려 들듯 일그러지고(중력 렌즈) 검은 원과 빛 고리가 떴다가, 새 순서로 돌아온다
// 낡은 표시: 섞이기 전 AI가 가리키던 번호 자리에 점선 고리 잔상이 잠깐 남았다가 사라진다 (지금 그 자리는 다른 보기)
const BH_FX = {};
function bhCanvas(key) { if (!BH_FX[key]) { const c = document.createElement('canvas'); c.width = PAPER_W; c.height = PAPER_H; BH_FX[key] = c; } return BH_FX[key]; }
function bhPaperFx(g, E, now) {
  const b = E.bh; if (!b || !g.canvas) return;
  const top = 182, bot = PAPER_H - 52, cx = PAPER_W / 2, cy = (PAPER_ROW(0) + PAPER_ROW(3)) / 2 - 40, bg = E.T.device === 'tablet' ? '#fbfcfe' : '#f6f2e6';
  if (b.phase === 'tell') { // 예고: 떨림 (이전 순서 모습을 남겨 둔다)
    const old = bhCanvas('old'), oc = old.getContext('2d'); oc.clearRect(0, 0, PAPER_W, PAPER_H); oc.drawImage(g.canvas, 0, 0);
    const amp = 1 + 4 * Math.min(1, b.k / Math.max(0.1, tune.reshuffle_tell));
    g.fillStyle = bg; g.fillRect(0, top, PAPER_W, bot - top);
    for (let y = top; y < bot; y += 16) { const dx = Math.sin(now * 53 + y * 0.17) * amp, dy = Math.sin(now * 37 + y * 0.09) * amp * 0.35; g.drawImage(old, 0, y, PAPER_W, 16, dx, y + dy, PAPER_W, 16); }
  } else if (b.phase === 'warp') { // 섞임: 중력 렌즈처럼 일그러진다. 가장 일그러질 때 이전 순서 → 새 순서로 바뀐다
    const p = Math.min(1, b.k / Math.max(0.1, tune.reshuffle_warp)), s = Math.sin(Math.PI * p), cur = bhCanvas('cur'), cc = cur.getContext('2d');
    cc.clearRect(0, 0, PAPER_W, PAPER_H); cc.drawImage(g.canvas, 0, 0);
    const src = p < 0.5 ? bhCanvas('old') : cur;
    g.fillStyle = bg; g.fillRect(0, top, PAPER_W, bot - top);
    for (let y = top; y < bot; y += 5) {
      const d = (y - cy) / 240, pull = s * 0.62 * Math.exp(-d * d * 1.4), yy = cy + (y - cy) * (1 - pull * 0.55), w = PAPER_W * (1 - pull * 0.45), dx = Math.sin(y * 0.045 + now * 8) * 16 * s * (1 - pull);
      g.drawImage(src, 0, y, PAPER_W, 5, cx - w / 2 + dx, yy, w, 5 * (1 - pull * 0.55) + 0.6);
    }
    const r = 30 + 150 * s; g.save();
    const gr = g.createRadialGradient(cx, cy, 0, cx, cy, r); gr.addColorStop(0, `rgba(6,4,14,${0.9 * s})`); gr.addColorStop(0.55, `rgba(6,4,14,${0.6 * s})`); gr.addColorStop(1, 'rgba(6,4,14,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill();
    g.strokeStyle = `rgba(255,212,140,${0.85 * s})`; g.lineWidth = 4; g.beginPath(); g.ellipse(cx, cy, r * 0.8, r * 0.28, -0.18, 0, 7); g.stroke();
    g.strokeStyle = `rgba(255,240,210,${0.5 * s})`; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, r * 0.52, 0, 7); g.stroke(); g.restore();
  }
  if (b.stale && b.staleT > 0 && b.phase !== 'warp' && E.ar && !E.ai && !E.fb && !E.dead) { // 낡은 AI 표시의 잔상
    const a = Math.min(1, b.staleT / 0.6), y = PAPER_ROW(b.stale.row) - 18, jx = Math.sin(now * 41) * 3;
    g.save(); g.globalAlpha = 0.7 * a; g.setLineDash([9, 7]); g.strokeStyle = '#6a4ab0'; g.lineWidth = 4; g.beginPath(); g.arc(92 + jx, y, 36, 0, 7); g.stroke(); g.setLineDash([]);
    g.lineWidth = 5; g.beginPath(); g.moveTo(66 + jx, y + 26); g.lineTo(118 + jx, y - 26); g.stroke(); g.restore();
  }
}
{ const draw0 = drawPaperTexture; drawPaperTexture = function (g, E, now) { draw0(g, E, now); if (E && E.bh && E.T && E.T.mech.includes('reshuffle')) bhPaperFx(g, E, now); }; } // [블랙홀] 원래 시험지 그리기 뒤에 덧그린다


// [변호사시험 3교시] AI 감독관의 EMP 총: 겨누는 동안은 충전, 맞은 뒤에는 전파 방해. 렌즈 단계마다 그 화면의 말투와 자리로, 시험지 바깥에 작게 (용궁 신호 표시와 같은 자리)
// 맞는 순간은 파동이 로봇 쪽에서 렌즈를 한 번 훑고 지나가고, 방해 중에는 옅은 잡음 줄이 천천히 흐른다 (번쩍이거나 깜빡이지 않게)
function drawEmpStatus(k, L, E, now, live, meter) {
  const m = E.emp, W0 = L.W, HH = L.H, b = k.b, st = hudStage(E), s = typeof empBot === 'function' ? empBot() : null, S = k.S || HUD_SCALE; if (!m) return;
  const aim = m.phase === 'aim', jam = m.jamT > 0;
  if (m.phase === 'fire' && m.hit) { const f = clamp((m.k - tune.emp_travel) / 0.55, 0, 1); if (f < 1) { // 맞는 순간: 렌즈가 한 번 하얗게 질리고, 충격파 고리가 퍼지며, 잡음이 튄다 (한 번뿐, 되풀이해 깜빡이지 않는다)
      b.save(); b.setTransform(S, 0, 0, S, 0, 0); b.globalAlpha = 0.3 * (1 - f) * (1 - f); b.fillStyle = '#e4faff'; b.fillRect(0, 0, W0, HH);
      b.strokeStyle = '#bff4ff'; b.globalAlpha = 0.85 * (1 - f); b.lineWidth = 7 * (1 - f) + 1; b.beginPath(); b.arc(W0 / 2, HH / 2, 30 + f * W0 * 0.7, 0, 7); b.stroke();
      b.globalAlpha = 0.5 * (1 - f); b.lineWidth = 2; b.beginPath(); b.arc(W0 / 2, HH / 2, 12 + f * W0 * 0.45, 0, 7); b.stroke(); b.restore();
      for (let i = 0; i < 14; i++) { const h = Math.abs(Math.sin(i * 12.9898 + Math.floor(now * 24) * 78.233) * 43758.5453) % 1; b.globalAlpha = 0.35 * (1 - f); k.R(Math.floor(((h * 13) % 1) * W0) - 40, Math.floor(h * HH), 80 + Math.floor(((h * 7) % 1) * 260), i % 3 === 0 ? 2 : 1, i % 2 ? '#bfefff' : '#ffffff'); } b.globalAlpha = 1; } }
  if (jam) { const fade = Math.min(1, m.jamT / 0.6); // 방해 중: 렌즈 가장자리에 정전기 띠가 남고, 옅은 잡음 줄이 천천히 흐른다
    b.globalAlpha = (0.3 + 0.08 * Math.sin(now * 3)) * fade; b.drawImage(lensGlow('A', '#8fdcff'), 0, 0); b.globalAlpha = 1;
    for (let i = 0; i < 7; i++) { const y = Math.round((i * 53 + now * 36) % HH); b.globalAlpha = 0.12 * fade; k.R(0, y, W0, 1, '#bfefff'); } b.globalAlpha = 1; }
  if (!live || !(aim || jam)) return;
  const dir = s ? (s.side === 'L' ? '◀' : '▶') : '', col = jam ? '#ff6a6a' : '#7fe9ff', v = aim ? clamp(m.k / tune.emp_aim, 0, 1) : clamp(m.jamT / tune.emp_jam, 0, 1), n = Math.round(v * 5);
  if (st === 'brain') { k.T(jam ? '머릿속이 지직거린다는 느낌' : `${s && s.side === 'L' ? '왼쪽' : '오른쪽'}에서 전기가 모인다는 느낌`, W0 - 11, 47, 9.5, jam ? '#ff8a8a' : '#bfe8ff', 'right', 700); return; } // 뉴럴링코: 창 없이 직감 한 줄
  if (st === 'contact') { const x = 30, y = 96; // 콘택트렌즈: 감독관 고리와 같은 둥근 고리 + 알약
    hudDraw(k, c => { c.fillStyle = 'rgba(8,44,52,0.45)'; c.beginPath(); c.arc(x, y, 14, 0, 7); c.fill(); c.lineCap = 'round'; c.lineWidth = 3; c.strokeStyle = 'rgba(255,255,255,0.2)'; c.beginPath(); c.arc(x, y, 14, 0, 7); c.stroke(); c.strokeStyle = col; c.beginPath(); c.arc(x, y, 14, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * v); c.stroke(); rrect(c, x + 19, y - 9, 62, 18, 9); c.fillStyle = 'rgba(8,44,52,0.42)'; c.fill(); });
    k.T(jam ? 'JAM' : 'EMP', x, y, 7, '#ffffff', 'center', 700); k.T(jam ? '전파 방해' : `충전 ${dir}`, x + 26, y, 7, col, 'left', 700); return; }
  if (st === 'mil') { const x = W0 - 148, y = 190, w = 116, h = 30; // 군용 렌즈: 전술 지도 아래 위협 항목 하나
    hudDraw(k, c => { c.fillStyle = 'rgba(40,26,6,0.6)'; c.fillRect(x, y, w, h); c.strokeStyle = col; c.lineWidth = 1; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); c.fillStyle = col; c.fillRect(x, y, w, 2); c.globalAlpha = 0.3; c.fillRect(x + 6, y + 23, w - 12, 3); c.globalAlpha = 1; c.fillRect(x + 6, y + 23, (w - 12) * v, 3); });
    k.M(jam ? 'JAM' : `EMP ${dir}`, x + 6, y + 9, 7, col, 'left', 700); k.M(jam ? `${m.jamT.toFixed(1)}s` : `T-${Math.max(0, tune.emp_aim - m.k).toFixed(1)}`, x + w - 6, y + 9, 8.5, '#ffffff', 'right', 700); return; }
  if (st === 'proto') { const x = W0 - 172, y = 158, w = 135; // 시제품: AI 분석 창 아래 같은 모양 창 (이름표와 막대만)
    panelBox(k, x, y, w, 24, col, jam ? '전파 방해' : `EMP ${dir}`); b.globalAlpha = 0.3; k.R(x + 10, y + 18, w - 20, 2, '#ffffff'); b.globalAlpha = 1; k.R(x + 10, y + 18, Math.round((w - 20) * v), 2, col); return; }
  if (st === 'used') { k.M(`${jam ? 'JAM' : 'EMP'} ${'▮'.repeat(n)}${'▯'.repeat(5 - n)}${jam ? '' : ' ' + dir}`, 61, 66, 9, col, 'left', 700); return; } // 중고 안경: 배터리 줄 아래 같은 글씨로 한 줄
  meter(jam ? '전파 방해' : `EMP ${dir}`, v, col, 24, HH - 126); // 필통 폰·지우개 액정: 막대 하나
}
// [용궁] 물속 신호 표시: 렌즈 단계마다 그 화면의 말투와 자리로, 시험지 바깥에 작게. 끊기면 빨강, 약하면 노랑, 좋으면 하늘색
function drawSeaSignal(k, L, E, now, live, meter) {
  if (!live || E.sigV == null) return;
  const st = hudStage(E), v = E.sigV, r = E.sigRate || 0, S = E.sig || {}, dead = r === 0, cur = S.left > 0, soon = !cur && S.next < 1.6, W0 = L.W;
  const col = dead ? '#ff6a6a' : r < 1 ? '#ffcf5a' : '#7fe9ff', pct = Math.round(v * 100), n = Math.round(v * 5);
  if (st === 'brain') { // 뉴럴링코: 창 없이 직감 한 줄
    k.T(dead ? '신호가 닿지 않는다는 느낌' : cur ? '물살에 신호가 흩어진다는 느낌' : soon ? '곧 물살이 밀려온다는 느낌' : r >= 1 ? '신호가 또렷하게 닿는다는 느낌' : '신호가 흐릿하게 닿는다는 느낌', W0 - 11, 47, 9.5, dead ? '#ff8a8a' : cur || soon ? '#ffd678' : '#bfe8ff', 'right', 700); return; }
  if (st === 'contact') { const x = 30, y = 96; // 콘택트렌즈: 감독관 고리와 같은 둥근 고리 + 알약
    hudDraw(k, c => { c.fillStyle = 'rgba(8,44,52,0.45)'; c.beginPath(); c.arc(x, y, 14, 0, 7); c.fill(); c.lineCap = 'round'; c.lineWidth = 3; c.strokeStyle = 'rgba(255,255,255,0.2)'; c.beginPath(); c.arc(x, y, 14, 0, 7); c.stroke(); c.strokeStyle = col; c.beginPath(); c.arc(x, y, 14, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * v); c.stroke(); rrect(c, x + 19, y - 9, 84, 18, 9); c.fillStyle = 'rgba(8,44,52,0.42)'; c.fill(); });
    k.T(dead ? '×' : String(pct), x, y, 9, '#ffffff', 'center', 700); k.T(dead ? '신호 끊김' : cur ? '물살 · 약함' : '부표 신호', x + 26, y, 7, col, 'left', 700); return; }
  if (st === 'mil') { const x = W0 - 148, y = 190, w = 116, h = 30; // 군용 렌즈: 전술 지도 아래 통신 항목 하나 (해류 예보 포함)
    hudDraw(k, c => { c.fillStyle = 'rgba(40,26,6,0.6)'; c.fillRect(x, y, w, h); c.strokeStyle = col; c.lineWidth = 1; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); c.fillStyle = col; c.fillRect(x, y, w, 2); c.globalAlpha = 0.3; c.fillRect(x + 6, y + 23, w - 12, 3); c.globalAlpha = 1; c.fillRect(x + 6, y + 23, (w - 12) * v, 3); });
    k.M(cur ? 'LINK · CURRENT' : soon ? `LINK · CUR T-${Math.max(0, S.next).toFixed(1)}` : 'LINK · BUOY', x + 6, y + 9, 7, col, 'left', 700); k.M(dead ? 'LOST' : pct + '%', x + w - 6, y + 9, 8.5, '#ffffff', 'right', 700); return; }
  if (st === 'proto') { const x = W0 - 172, y = 158, w = 135; // 시제품: AI 분석 창 아래 같은 모양 창
    panelBox(k, x, y, w, 40, col, '부표 신호'); k.T(dead ? '끊김 · 수신 대기' : `${pct}% · 스캔 ${Math.round(r * 100)}%`, x + 10, y + 27, 9.5, '#ffffff', 'left', 800);
    hudDraw(k, c => { for (let i = 0; i < 5; i++) { c.globalAlpha = i < n ? 1 : 0.25; c.fillStyle = col; c.fillRect(x + w - 40 + i * 6, y + 30 - i * 3, 4, 6 + i * 3); } c.globalAlpha = 1; }); return; }
  if (st === 'used') { k.M(`SIG ${'▮'.repeat(n)}${'▯'.repeat(5 - n)} ${dead ? 'LOST' : pct + '%'}`, 61, 66, 9, col, 'left', 700); return; } // 중고 안경: 배터리 줄 아래 같은 글씨로 한 줄
  meter(dead ? '신호 끊김' : `신호 ${pct}%`, v, col, 24, L.H - 126); // 필통 폰·지우개 액정: 숨 막대 위에 막대 하나
}
