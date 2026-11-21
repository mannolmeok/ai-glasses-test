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
function drawPaperTexture(g, E, now) {
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
  // 문제: 길면 글자를 줄여서
  g.textAlign = 'left'; g.fillStyle = ink;
  const room = q.kind === 'captcha' ? 70 : q.kind === 'alien' ? 150 : q.kind === 'listen' ? 120 : 260;
  let size = 50, lines = [];
  for (;;) { g.font = `800 ${size}px ${F}`; lines = wrapCanvas(g, `${E.qi + 1}. ${q.q}`, PAPER_W - 110); if (lines.length * (size + 14) <= room || size <= (q.kind === 'captcha' ? 38 : 28)) break; size -= 4; }
  lines.slice(0, 6).forEach((ln, i) => g.fillText(ln, 56, 236 + i * (size + 14)));
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
        for (let i = 0; i < 4; i++) { const yy = row(i) - 26, on = i === q.aiPick; g.globalAlpha = 1; g.fillStyle = '#9aa0ac'; g.fillRect(PAPER_W - 250, yy, 130, 8); g.fillStyle = on ? '#0f95a8' : '#4a5060'; g.fillRect(PAPER_W - 250, yy, Math.round(130 * cf[i] / 100), 8);
          g.textAlign = 'right'; g.font = `${on ? 800 : 700} ${on ? 34 : 26}px ${F}`; g.fillStyle = on ? '#0c6f7e' : '#4a5060'; g.fillText(cf[i] + '%', PAPER_W - 44, yy + 14); }
        g.globalAlpha = 1; g.fillStyle = '#18a6ba'; g.fillRect(126, y + 10, tw(q.aiPick) + 28, 6);
      } else if (st === 'mil') { // 군용: 표적 꺾쇠
        const x0 = 46, x1 = PAPER_W - 46, y0 = y - 70, y1 = y + 22, Lc = 40; g.fillStyle = col;
        for (const [cx, cy, sx, sy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]) { g.fillRect(sx > 0 ? cx : cx - Lc, cy - (sy > 0 ? 0 : 6), Lc, 6); g.fillRect(cx - (sx > 0 ? 0 : 6), sy > 0 ? cy : cy - Lc, 6, Lc); }
        g.fillStyle = '#b06a00'; g.textAlign = 'right'; g.font = `800 32px ${F}`; g.fillText(`TGT ${q.aiPick + 1} · CONF ${q.conf}`, PAPER_W - 62, y - 10);
      } else { // 중고: 굵은 초록 상자
        g.lineWidth = 7; g.strokeStyle = col; g.strokeRect(46, y - 70, PAPER_W - 92, 92);
        g.fillStyle = 'rgba(255,60,60,0.45)'; g.textAlign = 'right'; g.font = `800 40px ${F}`; g.fillText(`AI ▶ ${q.aiPick + 1}  ${q.conf}%`, PAPER_W - 58, y - 8);
        g.fillStyle = '#1f9a3a'; g.fillText(`AI ▶ ${q.aiPick + 1}  ${q.conf}%`, PAPER_W - 62, y - 8);
      }
    }
    if (scanning) {
      const x0 = 36, y0 = 186, x1 = PAPER_W - 36, y1 = PAPER_ROW(3) + 44, L = 46, t = st === 'proto' ? 3 : 6;
      g.fillStyle = col;
      for (const [cx, cy, sx, sy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]) {
        g.fillRect(sx > 0 ? cx : cx - L, cy - (sy > 0 ? 0 : t), L, t); g.fillRect(cx - (sx > 0 ? 0 : t), sy > 0 ? cy : cy - L, t, L);
      }
      if (E.holding) { g.globalAlpha = 0.6; g.fillRect(x0, y0 + ((now * 520) % (y1 - y0)), x1 - x0, st === 'proto' ? 2 : 4); g.globalAlpha = 1; }
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
  let fs = 40, ql, cl; const marks = ['①', '②', '③', '④'];
  for (; fs >= 22; fs -= 2) { g.font = `700 ${fs}px ${F}`; ql = wrapChars(g, `${P.qi + 1}. ${q.q}`, W - 80); g.font = `500 ${fs}px ${F}`; cl = q.choices.map(c => wrapChars(g, c, W - 150));
    if (ql.length * fs * 1.3 + cl.reduce((p, c) => p + c.length * fs * 1.25 + fs * 0.9, 0) < H - 150) break; }
  let y = 84 + fs; g.textAlign = 'left'; g.font = `700 ${fs}px ${F}`; for (const ln of ql) { g.fillText(ln, 40, y); y += fs * 1.3; }
  y += fs * 0.5; P.rects = [];
  cl.forEach((lines, i) => { const y0 = y - fs, bh = lines.length * fs * 1.25 + fs * 0.5; P.rects.push([(y0 - fs * 0.2) / H, (y0 + bh + fs * 0.2) / H]);
    if (P.mark && P.mark.c === i) { g.fillStyle = 'rgba(40,40,60,0.12)'; g.fillRect(30, y0, W - 60, bh); }
    g.fillStyle = ink; g.font = `500 ${fs}px ${F}`; g.fillText(marks[i], 44, y + fs * 0.1); lines.forEach((ln, j) => g.fillText(ln, 44 + fs * 1.5, y + fs * 0.1 + j * fs * 1.25));
    if (P.mark && P.mark.c === i) { g.strokeStyle = '#1a1a22'; g.lineWidth = 5; g.beginPath(); g.ellipse(44 + fs * 0.5, y - fs * 0.22, fs * 0.72, fs * 0.66, -0.2, 0, 7); g.stroke(); }
    y += bh + fs * 0.4; });
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
  table(X0, 348, [152, 96, 96, 110, 78, 76], [['구 분', '문항 수', '정답 수', '합격 기준', '득 점', '판 정'], [t.subject || '-', Rz.qn, Rz.caught ? '-' : Rz.correct, `${Rz.pass}점 이상`, { t: Rz.caught ? 0 : Rz.score, s: 30, w: 800 }, { t: verdict, col: vcol, w: 800 }]], 50, (i, j) => j === 0);
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
  const q = E.qs[Math.min(E.qi, E.qs.length - 1)], lines = q ? wrapKit(k, q.q, 560, 12) : [''];
  const h = 16 + lines.length * 16 + 40, w = 584, x = (640 - w) / 2, y = 346 - h;
  return { x, y, w, h, lines };
}
function wrapKit(k, str, maxW, size) {
  const out = []; let cur = '';
  for (const w of String(str).split(' ')) { const t = cur ? cur + ' ' + w : w; if (k.TW(t, size, 800) <= maxW || !cur) cur = t; else { out.push(cur); cur = w; } }
  if (cur) out.push(cur); return out.slice(0, 3);
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
  const sus = Math.max(0, Math.min(1, E.sus)), sp = Math.round(sus * 100), low = E.timeLeft < 10 && Math.floor(now * 4) % 2, part = tier.parts ? ` · ${tier.parts[E.part]}` : '';
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
    M('의심', bx - 8, y0, 9, E.rising ? '#ff5a5a' : INK, 'right', 700); for (let i = 0; i < n; i++) { k.b.globalAlpha = i < on ? 1 : 0.3; R(bx + i * 9, y0 - 5, 6, 10, i < on && sp >= 60 ? '#ff5a5a' : INK); } k.b.globalAlpha = 1; M(`${sp}%`, bx + n * 9 + 4, y0, 9, INK, 'left', 700);
    R(430, 124, 2, 2, '#000000'); R(434, 128, 2, 2, '#ff3ad0'); R(150, 300, 2, 2, '#000000'); // 죽은 화소
    const gl = (now * 0.37) % 1; if (gl < 0.045) { k.b.globalAlpha = 0.35; R(0, 80 + Math.floor(((now * 7.3) % 1) * 200), W, 5, INK); R(0, 150 + Math.floor(((now * 3.1) % 1) * 150), W, 2, INK); k.b.globalAlpha = 1; } // 화면 밀림
  } else if (ST === 'proto') { // 시제품 안경: 얇은 선, 흰색과 하늘색
    const x0 = 40, y0 = 30, ink = '#ffffff';
    k.disc(x0, y0, 2.5, INK); M(`Lens Pro · ${CONFIG.models[E.gear.model] ? CONFIG.models[E.gear.model].name : 'AI'} 연결됨`, x0 + 8, y0 + 0.5, 7.5, ink, 'left', 500);
    M(E.finalQ ? '--:--' : `${Math.floor(sec / 60)}:${ss}`, W - x0, y0 + 2, 16, low ? '#ff6a6a' : ink, 'right', 500); M(`${qn} / ${qt}${part}`, W - x0, y0 + 17, 7.5, '#dfe6ee', 'right', 500);
    const bw = 130, bx = W / 2 - bw / 2;
    M('의심', bx - 8, y0, 7.5, ink, 'right', 500); k.b.globalAlpha = 0.35; R(bx, y0 - 1, bw, 1.5, ink); k.b.globalAlpha = 1; R(bx, y0 - 1, Math.round(bw * sus), 1.5, sp >= 60 ? '#ff6a6a' : '#ffcf5a'); M(`${sp}%`, bx + bw + 8, y0, 7.5, E.rising ? '#ff6a6a' : ink, 'left', 500);
  } else if (ST === 'mil') { // 군용 정찰 렌즈: 호박색 전술 화면. 감독관을 표적으로 잡고, 답은 어디를 봐도 떠 있다
    k.b.globalAlpha = 0.55; for (const [cx, cy, sx, sy] of [[0, 0, 1, 1], [W, 0, -1, 1], [0, HH, 1, -1], [W, HH, -1, -1]]) k.poly([[cx, cy], [cx + sx * 70, cy], [cx, cy + sy * 70]], '#000000'); k.b.globalAlpha = 1;
    const off = E.view === 'left' ? 2 : E.view === 'right' ? -2 : 0, dirs = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE', 'S'];
    for (let i = -2; i <= 2; i++) { const d = dirs[(4 + i - off + 8) % 8]; M(d, W / 2 + i * 56, 20, 8, i === 0 ? '#ffffff' : INK, 'center', 700); if (i < 2) M('·', W / 2 + i * 56 + 28, 20, 8, INK, 'center', 700); }
    R(W / 2 - 140, 28, 280, 1, INK); R(W / 2, 28, 1, 5, '#ffffff');
    k.ring(W / 2, HH / 2, 14, INK); R(W / 2 - 1, HH / 2 - 1, 2, 2, INK);
    const tx = 30, ty = 96, th = 150; k.frame(tx, ty, 7, th, INK, 1); R(tx + 1, ty + th - Math.round((th - 2) * sus) - 1, 5, Math.round((th - 2) * sus), sp >= 60 ? '#ff5a5a' : INK);
    M('THREAT', tx + 12, ty + th - 14, 7.5, E.rising ? '#ff5a5a' : INK, 'left', 700); M(`${sp}%`, tx + 12, ty + th - 4, 9, E.rising ? '#ff5a5a' : INK, 'left', 700);
    if (live && E.layout === 'room' && WORLD.staffRects) WORLD.staffRects().forEach((r, n) => { // 표적 꺾쇠
      const s = E.staff[r.i]; if (!s || r.h < 30) return; const col = s.phase === 'watch' ? '#ff5a5a' : INK, x0 = Math.round(r.x), y0 = Math.round(r.y), x1 = Math.round(r.x + r.w), y1 = Math.round(Math.min(HH - 6, r.y + r.h)), l = 10;
      for (const [cx, cy, sx, sy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]) { R(sx > 0 ? cx : cx - l, sy > 0 ? cy : cy - 1.5, l, 1.5, col); R(sx > 0 ? cx : cx - 1.5, sy > 0 ? cy : cy - l, 1.5, l, col); }
      const lx = x1 + 6 < W - 110 ? x1 + 6 : x0 - 6, al = x1 + 6 < W - 110 ? 'left' : 'right';
      M(`TGT-${q2(n + 1)} ${s.name || '감독관'}`, lx, y0 + 6, 7.5, col, al, 700); M(s.phase === 'watch' ? '주시 중' : s.phase === 'tell' ? '돌아보는 중' : '등 돌림', lx, y0 + 17, 7.5, col, al, 500);
    });
    const g1 = '#9dff8a', gx = 30, gy = HH - 46;
    if (picked) { M('정답 추정', gx, gy, 7.5, '#c8f4d8', 'left', 500); const w1 = M(`ANS ${q.aiPick + 1}`, gx, gy + 18, 19, g1, 'left', 700); M(`CONF ${q.conf}`, gx + w1 + 8, gy + 20, 10, g1, 'left', 700); }
    else if (scanning) { M(`SCAN ${Math.round(E.scan * 100)}%`, gx, gy + 10, 10, g1, 'left', 700); k.b.globalAlpha = 0.35; R(gx, gy + 20, 110, 3, '#f4f1e8'); k.b.globalAlpha = 1; R(gx, gy + 20, Math.round(110 * E.scan), 3, g1); }
    M(E.finalQ ? 'T---:--' : `T-${mm}:${ss}`, W - 30, HH - 34, 17, low ? '#ff5a5a' : INK, 'right', 700); M(`Q ${q2(qn)}/${q2(qt)}${part}`, W - 30, HH - 19, 7.5, INK, 'right', 500);
  } else if (ST === 'contact') { // 콘택트렌즈: 시야 가장자리의 얇은 호 두 개. 깜빡이면 잠깐 꺼진다
    const b = k.b, S = k.S || HUD_SCALE, blink = (now % 9) > 8.86;
    if (blink) { b.globalAlpha = 0.3; R(0, 0, W, HH, '#000000'); b.globalAlpha = 1; }
    else { const arc = (y0, cy, f, col) => { b.save(); b.setTransform(S, 0, 0, S, 0, 0); b.lineWidth = 1.5; b.strokeStyle = 'rgba(255,255,255,0.3)'; b.beginPath(); b.moveTo(W * 0.2, y0); b.quadraticCurveTo(W / 2, cy, W * 0.8, y0); b.stroke();
        b.beginPath(); b.rect(W * 0.2, 0, W * 0.6 * f, HH); b.clip(); b.strokeStyle = col; b.beginPath(); b.moveTo(W * 0.2, y0); b.quadraticCurveTo(W / 2, cy, W * 0.8, y0); b.stroke(); b.restore(); };
      arc(46, -6, frac, low ? '#ff6a6a' : '#ffffff'); arc(HH - 40, HH + 8, sus, sp >= 60 ? '#ff6a6a' : '#ffcf5a');
      M(E.finalQ ? '--:--' : `${Math.floor(sec / 60)}:${ss}`, W / 2, 12, 7.5, low ? '#ff6a6a' : '#ffffff', 'center', 500); M(`${qn}/${qt}`, W / 2, HH - 8, 7, '#e8e4da', 'center', 500); }
  } else if (ST === 'brain') { // 뇌 임플란트: 숫자도 틀도 없다. 속마음 한 줄과 심장 박동선
    k.SUB(E.finalQ ? '시간이 느껴지지 않는다' : sec > 5 ? `${sec}초쯤 남았다는 느낌` : '거의 끝났다는 느낌', W - 22, 20, 10, low ? '#ff9a9a' : '#f0ece2', 'right');
    k.SUB(`${qn}번째 문제${part}`, W - 22, 34, 8, '#d8d4c8', 'right');
    const y = HH - 12, sp2 = 60 + sus * 240, px = (now * sp2) % (W + 60) - 30; k.b.globalAlpha = 0.35 + sus * 0.5; R(0, y, W, 1, '#ff5a5a');
    k.poly([[px - 12, y], [px - 6, y - 8 - sus * 8], [px - 3, y], [px, y + 9 + sus * 6], [px + 4, y - 4], [px + 8, y], [px + 8, y + 1.5], [px - 12, y + 1.5]], '#ff5a5a'); k.b.globalAlpha = 1;
    if (live && picked && !E.finalQ) k.SUB(q.conf >= 70 ? `…${q.aiPick + 1}번이다. 왜인지는 모르겠다.` : `…${q.aiPick + 1}번인 것 같다.`, W / 2, HH - 34, 13, '#ffffff', 'center');
    else if (live && scanning) k.SUB('…'.repeat(1 + Math.floor(E.scan * 3)), W / 2, HH - 34, 13, '#ffffff', 'center');
  }
}
// ---- 대응책에 당한 화면: 먹통이 된 안경, 재난문자·EMP·눈 피로의 화면 효과, 입실 검사 장면 ----
function drawDeadHud(k, L, E, now, ST, sec) {
  const W = L.W, HH = L.H, b = k.b, low = E.timeLeft < 10 && Math.floor(now * 4) % 2;
  b.globalAlpha = 0.22; k.R(0, 0, W, HH, '#000000'); b.globalAlpha = 1;
  for (let i = 0; i < 5; i++) { const h = Math.abs(Math.sin(i * 12.9898 + Math.floor(now * 9) * 78.233) * 43758.5453) % 1; b.globalAlpha = 0.18; k.R(0, Math.floor(h * HH), W, 1, '#c9d4e0'); } b.globalAlpha = 1;
  k.SUB(E.finalQ ? '--:--' : `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`, W - 62, 44, 13, low ? '#ff6a6a' : '#ffffff', 'right'); k.SUB(`${Math.min(E.qi + 1, E.qs.length)} / ${E.qs.length}`, W - 62, 60, 9, '#e8e4da', 'right');
  if (ST === 'brain') { k.SUB('…머릿속이 조용하다.', W / 2, 60, 11, '#f0ece2', 'center'); return; }
  if (Math.floor(now * 1.5) % 2 === 0) k.M(E.dead === 'water' ? '침수 감지 · 전원 차단' : '— NO SIGNAL —', W / 2, 44, 10, '#ff6a6a', 'center', 700);
}
function drawCounterFx(k, L, E, now, live) {
  const W = L.W, HH = L.H, b = k.b, T = E.T, p = E.pulse;
  if (E.wetT > 0 && E.ar) { const a = Math.min(1, E.wetT / 2); for (let i = 0; i < 9; i++) { const x = 60 + ((i * 197) % (W - 120)), y = 50 + ((i * 131) % (HH - 110)) + (8 - E.wetT) * (3 + i % 4); b.globalAlpha = 0.28 * a; k.disc(x, y, 5 + i % 4, '#cfeaff'); b.globalAlpha = 0.5 * a; k.disc(x - 1.5, y - 1.5, 1.5, '#ffffff'); } b.globalAlpha = 1; } // 렌즈의 물방울
  if (live && p && T.pulse === 'alert' && p.warn > 0) { const on = Math.floor(now * 7) % 2; b.globalAlpha = on ? 0.3 : 0.12; k.R(0, 0, 46, HH, '#ffcf5a'); k.R(W - 46, 0, 46, HH, '#ffcf5a'); b.globalAlpha = 1; k.SUB('(교실 여기저기서 재난문자 경보음이 울린다)', W / 2, HH - 48, 11, '#ffffff', 'center'); }
  if (live && p && T.pulse === 'emp') {
    if (p.warn > 0) k.SUB('(천장 장치가 윙— 하고 충전된다)', W / 2, HH - 48, 11, '#ffffff', 'center');
    if (p.active > 0) { const f = 1 - p.active / 0.6, S = k.S || HUD_SCALE; b.save(); b.setTransform(S, 0, 0, S, 0, 0); b.globalAlpha = 0.25 * (1 - f); b.fillStyle = '#9fd0ff'; b.fillRect(0, 0, W, HH); b.globalAlpha = 0.9 * (1 - f); b.strokeStyle = '#cfe6ff'; b.lineWidth = 5; b.beginPath(); b.arc(W / 2, HH * 0.3, 20 + f * W * 0.75, 0, 7); b.stroke(); b.lineWidth = 1.5; b.beginPath(); b.arc(W / 2, HH * 0.3, 60 + f * W * 0.85, 0, 7); b.stroke(); b.restore(); b.globalAlpha = 1 - f; k.R(0, HH * 0.42, W, 4, '#ffffff'); k.R(0, HH * 0.66, W, 2, '#ffffff'); b.globalAlpha = 1; }
  }
  if (live && T.mech.includes('fatigue')) { const f = Math.min(1, E.part * 0.4) * (typeof gearCut === 'function' ? gearCut(E.gear.eyedrop) : 1); // 눈 피로: 블록이 쌓일수록 눈꺼풀이 내려오고, 저절로 깜빡인다
    if (f > 0.02) { const lid = f * 46, gap = 8 - f * 4, bl = (now % gap) < 0.16; let gr = b.createLinearGradient(0, 0, 0, lid * 1.6); gr.addColorStop(0, 'rgba(0,0,0,0.95)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); b.fillStyle = gr; b.fillRect(0, 0, W, lid * 1.6);
      gr = b.createLinearGradient(0, HH - lid * 1.4, 0, HH); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.95)'); b.fillStyle = gr; b.fillRect(0, HH - lid * 1.4, W, lid * 1.4);
      b.globalAlpha = 0.1 * f; k.R(0, 0, W, HH, '#7a1e1e'); b.globalAlpha = 1; if (bl) k.R(0, 0, W, HH, '#000000'); if (E.qi === 0 && E.timeLeft > E.timeTotal - 3) k.SUB('…눈이 뻑뻑하다.', W / 2, HH - 70, 11, '#ffffff', 'center'); } }
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
  if (E.holding) k.SUB(es.mem > 0 ? '옮겨 쓰는 중' : '읽는 중…', L.W / 2, L.H - 26, 10, es.mem > 0 ? '#8dffa8' : '#ffcf7a', 'center');
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
  const pl = E.gear.predict; // 시선 예측: 그쪽 렌즈 가장자리가 경고 (3단계부터 쳐다볼 때도 빨갛게)
  if (pl >= 3 && live && E.layout === 'room') { // 후방 카메라: 등 뒤 감독관을 위쪽 작은 화면에
    const back = E.staff.filter(s => !s.fixed && !s.out && !(s.blink > 0) && s.phase !== 'help' && s.u < 0.37), bx = L.W / 2 - 46, by = 8;
    k.b.globalAlpha = 0.5; R(bx, by, 92, 18, '#0a0a0e'); k.b.globalAlpha = 0.85; k.frame(bx, by, 92, 18, '#ffffff', 1); k.b.globalAlpha = 1;
    k.M('후방', bx + 46, by + 9.5, 7.5, '#ffffff', 'center', 700);
    for (const s of back) { const col = s.phase === 'watch' ? C.bad : s.phase === 'tell' ? C.warn : '#c9c4d8', x = s.side === 'L' ? bx + 14 : bx + 78; k.disc(x, by + 9, 4, col); if (s.phase === 'watch') k.ring(x, by + 9, 6, C.bad); }
  }
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
  if (E.sus > 0.02 || E.rising) { // 의심도: 렌즈 둘레가 붉어지고, 보는 중에 스캔하면 깜빡인다
    const base = Math.min(0.85, 0.12 + E.sus * 0.9), a = E.rising ? Math.min(1, base + 0.35 + 0.3 * Math.sin(now * 16)) : base;
    k.b.globalAlpha = Math.max(0, a); k.b.drawImage(lensGlow('A', C.bad), 0, 0); k.b.globalAlpha = 1;
  }
  if (E.layout === 'table' && !E.result) drawArCard(k, L, E, now, H);
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
  if (live && E.staff.some(s => s.phase === 'peek' && s.peek.stage === 'sneak') && E.gear.predict >= 2) { k.b.globalAlpha = Math.floor(now * 8) % 2 ? 0.9 : 0.4; TO('발소리가 사라졌다…', L.W / 2, 96, 12, C.warn); k.b.globalAlpha = 1; } // 시선 예측 2단계부터 경고
  // 떠다니는 안내 글자는 쓰지 않는다: 소리와 화면 속 움직임으로 안다
  if (false && E.flash) { const a = E.flash.t < 1.2 ? 1 : (1.6 - E.flash.t) / 0.4; k.b.globalAlpha = a; TO(E.flash.text, L.W / 2, 96, 14, E.flash.col || C.warn); k.b.globalAlpha = 1; }
  const sec = Math.max(0, Math.ceil(E.timeLeft));
  if (deadHud) drawDeadHud(k, L, E, now, ST, sec); else if (ST !== 'none') drawStageHud(k, L, E, now, ST, INK, sec, pl, live, q);
  drawCounterFx(k, L, E, now, live);
  if (live && E.ai && !E.fb && E.gear.earbud > 0 && !E.dead && q && !q.final && q.kind !== 'essay' && Math.floor(now * 0.8) % 3 !== 2) k.SUB(`(이어폰) “…${q.aiPick + 1}번…”`, L.W / 2, L.H - 70, 10, '#e8e4da', 'center'); // AI 이어폰: 어디를 보고 있어도 답이 들린다
  if (E.runShown) T(fmtRun(E.runShown), 48, 40, 10, H.c2, 'left', 700);
  if (ST === 'used') k.b.drawImage(rimFor('land'), 0, 0); else if (ST === 'proto') k.b.drawImage(rimFor('land', 1.16), 0, 0); // 안경테: 중고는 두껍고 시제품은 얇다. 렌즈·임플란트는 테가 없다
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
  if (E.breakT > 0 && !E.caught) { // 쉬는 시간 종소리 뒤의 안내 방송
    
    k.SUB(`${tier.staff[0].name}: "쉬는 시간입니다. 다음은 ${tier.parts[E.part]}."`, L.W / 2, L.H - 48, 12, C.white, 'center', 800);
  }
  if (E.start > 0) { // 감독관의 안내 방송 (자막)
    const notes = (E.startNotes || []).map(n => n.text), who = tier.staff[0].name;
    const l1 = `${who}: "${tier.parts ? tier.parts[E.part] + ', ' : ''}${tier.name}${tier.boss ? '. 마지막 관문입니다' : ''}. 지금부터 시작합니다."`, l2 = notes.length ? `"${notes.join(' · ')}"` : '';
    
    let s1 = 12; while (k.TW(l1, s1, 800) > L.W - 40 && s1 > 9) s1--; k.SUB(l1, L.W / 2, L.H - 48, s1, C.white, 'center', 800);
    if (l2) { let s2 = 11; while (k.TW(l2, s2, 700) > L.W - 40 && s2 > 8) s2--; T(l2, L.W / 2, L.H - 30, s2, '#d8d3e6', 'center', 700); }
  }
  if (E.over && !E.caught) {  k.SUB(`${tier.staff[0].name}: "${E.all ? '답안지 걷겠습니다.' : '시험 종료. 필기구 내려놓으세요.'}"`, L.W / 2, L.H - 48, 12, C.white, 'center', 800); }
  if (E.caught) { // 적발: 타이틀과 같은 안경 화면이 빨갛게 바뀐다
    const who = E.caughtBy || tier.staff[0];
    const why = { peek: '책상 밑에서 올려다보던 눈과 마주침', alert: '재난문자에 폰이 울림', emp: 'EMP에 기기가 드러남', cctv: 'CCTV에 찍힘', pulse: 'AI 탐지 전파에 걸림', drone: '드론 전파에 걸림', screen: '화면 검사에 걸림', check: '책상 앞 검사에 걸림',
      webcam: '웹캠에 찍힘', ai: 'AI 사용이 감지됨', omega: 'Ω가 스캔 박자를 읽음' }[E.caughtHow] || `${who.name}에게 걸림`;
    drawLensScreen(k, L, now, { col: '#ff5a5a', glow: '#4a0a0a', tint: '#28060a', big: '적발', lines: ['LENS-OS 0.9b', `${who.name} ....... 정면 주시`, '장비 ......... 노출됨', '연결 ......... 끊김'], sub: E.T.mech.includes('tutorial') ? '혼나고 끝 (모의고사라 다행)' : '이번 시험 0점 처리' });
    k.SUB(`${who.name}: ${E.caughtHow === 'alert' ? '"방금 울린 거, 수험생 폰이죠?"' : CAUGHT_LINE[who.type] || CAUGHT_LINE.dean}`, L.W / 2, L.H - 62, 13, '#ffffff', 'center');
    k.SUB(why, L.W / 2, L.H - 42, 9, '#e8e4da', 'center');
  }
}
