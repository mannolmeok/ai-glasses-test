// PROTOTYPE - NOT FOR PRODUCTION
// 타이틀 시안 3번 '렌즈 반사 클로즈업' (테스트판). art.js의 drawTitle · drawTitleOut 을 이 파일의 것으로 바꿔 끼운다.
// 배경은 그림 한 장(assets/title/lens-plate.jpg). 로고·버튼·석차표 줄·테두리는 코드로 그린다.
// 움직임: 오른쪽 렌즈 속 감독관이 다가오고(렌즈 안만 확대), 가까워지면 왼쪽 렌즈 화면이 꺼졌다가 멀어지면 다시 켜진다.
// 켜져 있는 동안 보기 ②가 깜빡이고, 감독관이 다가올 때 땀방울이 흘러내린다. 시험 시작을 누르면 왼쪽 렌즈 안으로 들어간다.
'use strict';
(function () {
  if (typeof drawTitle !== 'function') return;
  const OLD_TITLE = drawTitle, OLD_OUT = typeof drawTitleOut === 'function' ? drawTitleOut : null; // 그림을 못 받으면 예전 타이틀로
  const W = 640, H = 360;
  const MINT = '#6ef7a6', MINT_HI = '#a6fbd3', CREAM = '#f7f0dd', INK = '#f3f6ef';
  const SANS = '"Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR","Noto Sans CJK KR","NanumGothic",sans-serif';
  const BHS = '"Black Han Sans","Do Hyeon",' + SANS;
  const Q = new URLSearchParams(location.search);
  const FIX_T = Q.has('tt') ? Number(Q.get('tt')) : null; // check only: 타이틀 연출의 그 순간에 멈춰 본다 (초)

  const plate = new Image(); let plateBad = false; plate.onerror = () => { plateBad = true; }; plate.src = 'assets/title/lens-plate.jpg?v=1';
  const drop = new Image(); drop.src = 'assets/title/lens-drop.png?v=1';
  const loaded = im => im.complete && im.naturalWidth > 0;
  const fontOk = () => !document.fonts || document.fonts.check(`400 60px ${BHS}`, 'AI 안경으로 살아남기');
  if (document.fonts) document.fonts.load(`400 60px ${BHS}`, 'AI 안경으로 살아남기 전국 석차표').then(() => { CACHE.logo = null; CACHE.rank = null; }, () => { });

  // ---- 그림 속 자리 (640x360 기준, 배경 그림에서 잰 값) ----
  const LENS_L = [[73.7, 140.3], [95.7, 131.0], [122.7, 131.0], [195.0, 141.3], [204.3, 145.0], [218.7, 158.3], [215.3, 172.7], [198.0, 220.0], [190.7, 232.7], [179.3, 244.0], [163.0, 247.7], [123.7, 246.7], [87.0, 238.3], [73.3, 224.3], [69.0, 190.3]];
  const LENS_R = [[367.0, 165.7], [343.3, 235.0], [332.7, 246.7], [314.7, 250.0], [269.3, 245.0], [261.3, 234.7], [258.7, 201.7], [262.0, 175.7], [266.0, 162.3], [282.3, 148.7], [315.3, 147.7], [353.7, 152.3]];
  const ROW2 = [[108.8, 163.1], [189.4, 175.6], [188.1, 197.5], [105.0, 184.8]]; // 왼쪽 렌즈 속 보기 ② 줄
  const ZOOM_C = [311, 190]; // 오른쪽 렌즈 속 감독관 (가슴께): 여기를 중심으로 다가온다
  const DIVE_C = [142, 189]; // 왼쪽 렌즈 가운데: 시험 시작 때 이 안으로 들어간다
  const DROP_AT = [57.6, 71.9, 14.05, 40.5]; // 땀방울 (x, y, w, h)
  const SKIN = [[20, 55], [120, 55], [120, 104], [100, 104.5], [82.5, 106.5], [61, 121.5], [43.5, 108.5], [20, 108]]; // 땀방울이 보이는 곳: 안경테 위 피부 (흘러내리면 테 뒤로 숨는다)
  const BRK_R = [[269.5, 169.5, 1, 1], [354.5, 162, -1, 1], [332.5, 234.5, -1, -1]]; // 오른쪽 렌즈 속 추적 괄호 (시안 그대로 셋)

  const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
  const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  const path = (g, P) => { g.beginPath(); g.moveTo(P[0][0], P[0][1]); for (let i = 1; i < P.length; i++) g.lineTo(P[i][0], P[i][1]); g.closePath(); };
  const CACHE = { S: 0, frame: null, logo: null, rank: null, tick: null, tickStr: '' };
  let T0 = 0, lastNow = -9, firstSeen = -1; // 타이틀이 뜬 때 (다시 뜨면 켜지는 연출부터)
  const canvasOf = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
  const silhouette = (src, col) => { const c = canvasOf(src.width, src.height), g = c.getContext('2d'); g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, c.width, c.height); return c; }; // 그림자용: 같은 모양을 한 색으로

  // ---- 시간표 ----
  // 켜질 때 (0~2.7초): 검은 화면 → 그림이 밝아짐 → 왼쪽 렌즈가 스캔 줄과 함께 켜짐 → 로고가 찍히고 흔들림 → 버튼 깜빡 → 석차표 줄
  // 그 뒤 10초마다: 감독관이 6초에 걸쳐 다가옴 → 왼쪽 렌즈 꺼짐 → 감독관이 멀어짐 → 다시 켜짐. 다가오는 동안 땀방울이 흘러내림
  function timeline(t) {
    const P = {};
    P.black = 1 - smooth(0.2, 0.85, t);
    P.power = clamp01((t - 0.95) / 0.45);
    P.logo = clamp01((t - 1.35) / 0.26);
    P.shake = t > 1.61 && t < 1.86 ? Math.sin(t * 97) * 1.7 * (1 - (t - 1.61) / 0.25) : 0;
    P.frame = smooth(1.3, 1.75, t);
    P.btn = t < 1.95 ? 0 : t < 2.35 ? (Math.floor((t - 1.95) * 20) % 2 ? 0.2 : 1) : 1;
    P.tick = smooth(2.25, 2.7, t);
    P.zoom = 1; P.off = 0; P.scan = -1; P.drop = { y: 0, a: 1, s: 1 };
    const u = t < 2.7 ? -1 : (t - 2.7) % 10;
    if (u >= 0) {
      P.zoom = 1 + 0.32 * (u < 6 ? smooth(0, 6, u) : u < 7.3 ? 1 : 1 - smooth(7.3, 8.5, u));
      const flick = (a, b) => u >= a && u < b ? Math.floor((u - a) / 0.035) % 2 : -1;
      P.off = u >= 6 && u < 8.5 ? 1 : 0;
      const f1 = flick(6, 6.14), f2 = flick(8.5, 8.64);
      if (f1 >= 0) P.off = f1 ? 0 : 1;
      if (f2 >= 0) P.off = f2 ? 1 : 0;
      if (u >= 8.64 && u < 9.1) P.scan = (u - 8.64) / 0.46;
      if (u >= 5.2 && u < 7.6) { const k = (u - 5.2) / 2.4; P.drop = { y: 15 * Math.pow(k, 1.8), a: 1 - smooth(7.3, 7.6, u), s: 1 + 0.12 * k }; }
      else if (u >= 7.6 && u < 8.8) P.drop = { y: 0, a: 0, s: 1 };
      else if (u >= 8.8 && u < 9.6) { const k = smooth(8.8, 9.6, u); P.drop = { y: 0, a: k, s: 0.82 + 0.18 * k }; }
    }
    return P;
  }

  // ---- 테두리 (화면 가장자리의 가는 선과 모서리 괄호, 아래 석차표 띠) ----
  function buildFrame(S) {
    const c = canvasOf(W * S, H * S), g = c.getContext('2d'); g.scale(S, S);
    g.shadowColor = 'rgba(110,247,166,0.55)'; g.shadowBlur = 3 * S;
    const R = (x, y, w, h, a, col = MINT) => { g.globalAlpha = a; g.fillStyle = col; g.fillRect(x, y, w, h); };
    const dashes = (x, y, n) => { g.fillStyle = MINT; g.globalAlpha = 0.95; for (let i = 0; i < n; i++) { const x0 = x + i * 7.6; g.beginPath(); g.moveTo(x0 + 2.4, y); g.lineTo(x0 + 7.4, y); g.lineTo(x0 + 5, y + 5.6); g.lineTo(x0, y + 5.6); g.closePath(); g.fill(); } };
    // 위
    R(7, 7.4, 626, 0.8, 0.5);
    R(7, 7, 21.6, 1.6, 1, MINT_HI); R(611.4, 7, 21.6, 1.6, 1, MINT_HI);
    R(7, 7, 1.2, 49, 0.75); R(631.8, 7, 1.2, 49, 0.75);
    R(319.4, 3, 1.2, 11.5, 0.9); for (const d of [-16, -8, 8, 16]) R(320 + d - 0.4, Math.abs(d) > 8 ? 6.5 : 5, 0.8, Math.abs(d) > 8 ? 3 : 5, 0.55);
    R(94.4, 6.6, 2, 2.2, 0.9);
    // 아래: 석차표 띠
    R(7, 328.2, 626, 0.8, 0.42); R(319.6, 325.5, 0.8, 6, 0.8);
    dashes(21.4, 336.4, 5); R(84.8, 338.6, 86.6, 0.9, 0.6);
    R(469, 338.6, 112, 0.9, 0.6); dashes(584.6, 336.4, 5);
    R(7, 349.4, 626, 0.8, 0.5);
    R(7, 348.8, 21.6, 1.6, 1, MINT_HI); R(611.4, 348.8, 21.6, 1.6, 1, MINT_HI);
    R(7, 326, 1.2, 24.4, 0.75); R(631.8, 326, 1.2, 24.4, 0.75);
    R(319.4, 349.4, 1.2, 6, 0.9);
    return c;
  }

  // ---- 로고: AI(초록, 기울임, 빛) + 안경으로·살아남기(크림색, 닳은 도트 글자) + 장식 선 ----
  const LG = { x: 356, y: 70, w: 279, h: 152 }; // 로고가 들어가는 칸 (화면 기준)
  function fitInk(g, str, font, box) { // 글자의 실제 잉크 상자를 box에 꼭 맞춰 그릴 배율과 자리
    g.font = font; const m = g.measureText(str);
    const l = m.actualBoundingBoxLeft, r = m.actualBoundingBoxRight, a = m.actualBoundingBoxAscent, d = m.actualBoundingBoxDescent;
    return { sx: box.w / (l + r), sy: box.h / (a + d), ox: l, oy: d };
  }
  function grunge(g, w, h, seed) { // 닳은 인쇄 느낌: 군데군데 긁히고 바랜 자국 (같은 seed면 늘 같은 모양)
    let s = seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    g.save(); g.globalCompositeOperation = 'source-atop';
    for (let i = 0; i < 10; i++) { g.fillStyle = `rgba(150,138,112,${0.18 + rnd() * 0.16})`; g.fillRect(Math.floor(rnd() * w), Math.floor(rnd() * h), 3 + Math.floor(rnd() * 8), 2 + Math.floor(rnd() * 4)); } // 바랜 얼룩
    g.fillStyle = 'rgba(140,128,100,0.45)'; for (let i = 0; i < w * h * 0.012; i++) g.fillRect(Math.floor(rnd() * w), Math.floor(rnd() * h), 1, 1);
    g.globalCompositeOperation = 'destination-out'; g.globalAlpha = 0.8;
    for (let i = 0; i < w * h * 0.006; i++) g.fillRect(Math.floor(rnd() * w), Math.floor(rnd() * h), 1, 1);
    for (let i = 0; i < 16; i++) g.fillRect(Math.floor(rnd() * w), Math.floor(rnd() * h), 2 + Math.floor(rnd() * 6), 1); // 긁힘
    g.restore();
  }
  function creamWords(words, seed) { // 크림색 글자를 화면 1칸 해상도로 찍는다 (키우면 도트 계단이 보인다)
    const c = canvasOf(LG.w, LG.h), g = c.getContext('2d');
    for (const [str, box] of words) {
      const font = `400 100px ${BHS}`, f = fitInk(g, str, font, box);
      g.save(); g.translate(box.x - LG.x, box.y + box.h - LG.y); g.scale(f.sx, f.sy); g.font = font; g.textBaseline = 'alphabetic'; g.fillStyle = CREAM; g.fillText(str, f.ox, -f.oy); g.restore();
    }
    grunge(g, LG.w, LG.h, seed);
    return c;
  }
  function buildLogo(S, words) {
    const c = canvasOf(LG.w * S, LG.h * S), g = c.getContext('2d');
    g.scale(S, S); g.translate(-LG.x, -LG.y);
    const glowLine = (x0, x1, y, h, a0, a1, a2) => { const gr = g.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, `rgba(110,247,166,${a0})`); gr.addColorStop(0.55, `rgba(150,251,200,${a1})`); gr.addColorStop(1, `rgba(110,247,166,${a2})`); g.fillStyle = gr; g.fillRect(x0, y, x1 - x0, h); };
    g.save(); g.shadowColor = 'rgba(110,247,166,0.8)'; g.shadowBlur = 4 * S;
    glowLine(462, 556, 83.6, 1, 0, 0.95, 0.15); // AI 위를 지나는 선
    glowLine(368, 437, 98.4, 1.6, 0, 0.95, 1); glowLine(390, 446, 105.4, 1.1, 0, 0.8, 0.9); glowLine(362, 432, 112.4, 1.6, 0, 0.9, 1); // AI 왼쪽 빠른 줄
    glowLine(428, 579, 205.4, 1, 0, 0.9, 0.95); // 로고 아래 선
    g.fillStyle = MINT; g.beginPath(); g.moveTo(578.6, 205.4); g.lineTo(583.6, 203.4); g.lineTo(583.6, 204.4); g.lineTo(579.4, 206.4); g.closePath(); g.fill();
    for (let i = 0; i < 5; i++) { const x0 = 584.6 + i * 5.3; g.beginPath(); g.moveTo(x0 + 2, 202.9); g.lineTo(x0 + 5.6, 202.9); g.lineTo(x0 + 3.6, 207.9); g.lineTo(x0, 207.9); g.closePath(); g.fill(); }
    g.globalAlpha = 0.85; g.fillRect(618.6, 206.2, 7.4, 0.9); g.globalAlpha = 1;
    g.restore();
    // 크림색 글자: 1칸 해상도 그림을 그대로 키운다 (번지지 않게). 아래에 그림자 한 칸
    g.save(); g.imageSmoothingEnabled = false;
    g.globalAlpha = 0.55; g.drawImage(silhouette(words, '#000000'), LG.x + 1, LG.y + 1.2, LG.w, LG.h); g.globalAlpha = 1;
    g.drawImage(words, LG.x, LG.y, LG.w, LG.h); g.restore();
    // AI: 기울인 굵은 글자, 위가 밝은 초록, 빛 번짐
    const box = { x: 410, y: 80.2, w: 79.3, h: 56 }, sk = 0.25, font = `400 100px ${BHS}`;
    g.save(); const f = fitInk(g, 'AI', font, { w: box.w - box.h * sk, h: box.h });
    g.translate(box.x, box.y + box.h); g.transform(1, 0, -sk, 1, 0, 0); g.scale(f.sx, f.sy); g.font = font; g.textBaseline = 'alphabetic';
    const ih = box.h / f.sy, gr = g.createLinearGradient(0, -ih, 0, 0); gr.addColorStop(0, '#8dfcc2'); gr.addColorStop(0.42, '#4ff096'); gr.addColorStop(1, '#1db463'); g.fillStyle = gr;
    g.shadowColor = 'rgba(60,240,140,0.9)'; g.shadowBlur = 14 * S; g.fillText('AI', f.ox, -f.oy); g.shadowColor = 'rgba(120,255,180,0.7)'; g.shadowBlur = 5 * S; g.fillText('AI', f.ox, -f.oy); g.shadowBlur = 0; g.fillText('AI', f.ox, -f.oy); g.restore();
    return c;
  }
  function logo(S) {
    if (!CACHE.logo) CACHE.logo = buildLogo(S, creamWords([['안경으로', { x: 493.3, y: 92.4, w: 128.4, h: 37.4 }], ['살아남기', { x: 418.1, y: 138.1, w: 208.8, h: 55.7 }]], 9137));
    return CACHE.logo;
  }
  function rankTitle(S) { // 석차표를 열면 로고 자리에 같은 글자로
    if (!CACHE.rank) { const words = creamWords([['전국 석차표', { x: 470, y: 70, w: 151, h: 30 }]], 5521); const c = canvasOf(LG.w * S, LG.h * S), g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.scale(S, S); g.globalAlpha = 0.55; g.drawImage(silhouette(words, '#000000'), 1, 1.2, LG.w, LG.h); g.globalAlpha = 1; g.drawImage(words, 0, 0, LG.w, LG.h); CACHE.rank = c; }
    return CACHE.rank;
  }

  // ---- 렌즈 ----
  function darkGlass(b, P, a, below) { // 꺼진 렌즈: 어두운 유리 + 비스듬한 반사. below: 이 높이 아래만 (켜지는 스캔)
    if (a <= 0) return;
    b.save(); path(b, P); b.clip(); if (below != null) { b.beginPath(); b.rect(0, below, W, H); b.clip(); }
    b.globalAlpha = 0.96 * a; b.fillStyle = '#030a07'; b.fillRect(60, 120, 170, 140);
    const gr = b.createLinearGradient(70, 130, 170, 250); gr.addColorStop(0, 'rgba(200,230,215,0.10)'); gr.addColorStop(0.35, 'rgba(200,230,215,0.02)'); gr.addColorStop(0.5, 'rgba(200,230,215,0.07)'); gr.addColorStop(1, 'rgba(200,230,215,0)');
    b.globalAlpha = a; b.fillStyle = gr; b.fillRect(60, 120, 170, 140); b.restore();
  }
  function scanBar(b, P, y) { // 렌즈가 켜질 때 위에서 아래로 지나가는 초록 줄
    b.save(); path(b, P); b.clip();
    const gr = b.createLinearGradient(0, y - 12, 0, y); gr.addColorStop(0, 'rgba(110,247,166,0)'); gr.addColorStop(1, 'rgba(160,255,205,0.55)');
    b.fillStyle = gr; b.fillRect(60, y - 12, 170, 12); b.fillStyle = 'rgba(200,255,225,0.95)'; b.fillRect(60, y - 0.8, 170, 1.4); b.restore();
  }
  function lenses(b, P, t) {
    // 오른쪽 렌즈: 렌즈 안만 키워서 감독관이 다가오는 것처럼. 가까울수록 어둡게
    if (P.zoom > 1.0005) {
      b.save(); path(b, LENS_R); b.clip(); b.translate(ZOOM_C[0], ZOOM_C[1]); b.scale(P.zoom, P.zoom); b.translate(-ZOOM_C[0], -ZOOM_C[1]); b.drawImage(plate, 0, 0, W, H); b.restore();
      b.save(); path(b, LENS_R); b.clip(); b.globalAlpha = 0.32 * (P.zoom - 1) / 0.32; b.fillStyle = '#010604'; b.fillRect(255, 144, 116, 110); b.restore();
    }
    const scrOn = P.power >= 1 && !P.off, e = 1 + (P.zoom - 1) * 0.7;
    if (scrOn) { b.save(); b.fillStyle = MINT; b.shadowColor = 'rgba(110,247,166,0.7)'; b.shadowBlur = 3 * (CACHE.S || 1); b.globalAlpha = 0.95;
    for (const [x, y, sx, sy] of BRK_R) { const X = ZOOM_C[0] + (x - ZOOM_C[0]) * e, Y = ZOOM_C[1] + (y - ZOOM_C[1]) * e; b.fillRect(sx > 0 ? X : X - 7, sy > 0 ? Y : Y - 1.2, 7, 1.2); b.fillRect(sx > 0 ? X : X - 1.2, sy > 0 ? Y : Y - 6.5, 1.2, 6.5); }
    b.restore(); }
    // 왼쪽 렌즈: 켜져 있으면 보기 ②가 깜빡, 꺼지면 어두운 유리
    if (scrOn) { const k = 0.08 + 0.24 * Math.pow(Math.max(0, Math.sin(t * Math.PI * 2 / 1.3)), 3); b.save(); path(b, LENS_L); b.clip(); b.globalCompositeOperation = 'lighter'; b.globalAlpha = k; path(b, ROW2); b.fillStyle = MINT; b.fill(); b.restore(); }
    if (P.power < 1) { const y = 128 + 124 * P.power; darkGlass(b, LENS_L, 1, y); if (P.power > 0) scanBar(b, LENS_L, y); }
    else if (P.off) { darkGlass(b, LENS_L, 1, null); b.save(); for (const [x, y, r, k] of [[230, 224, 40, 0.55], [150, 262, 72, 0.32]]) { const sp = b.createRadialGradient(x, y, 4, x, y, r); sp.addColorStop(0, `rgba(0,0,0,${k})`); sp.addColorStop(1, 'rgba(0,0,0,0)'); b.fillStyle = sp; b.fillRect(x - r, y - r, r * 2, r * 2); } b.restore(); } // 렌즈 빛이 꺼지면 얼굴에 비치던 초록빛도 죽는다
    if (P.scan >= 0) scanBar(b, LENS_L, 128 + 124 * P.scan);
    // 땀방울
    if (loaded(drop) && P.drop.a > 0) { const [x, y, w, h] = DROP_AT; b.save(); path(b, SKIN); b.clip(); b.globalAlpha = P.drop.a; b.drawImage(drop, x - P.drop.y * 0.12, y + P.drop.y, w, h * P.drop.s); b.restore(); }
  }

  // ---- 시험 시작 버튼 · 석차표 줄 ----
  function startButton(b, label, a, t) {
    b.save(); b.globalAlpha = a; b.font = `800 21px ${SANS}`; b.textBaseline = 'alphabetic';
    const m = b.measureText(label), tw = m.actualBoundingBoxLeft + m.actualBoundingBoxRight, x1 = 593.3, x0 = Math.min(452.4, x1 - 17.6 - tw - 25 - 16.4), y0 = 227.6, y1 = 261;
    const tx = x1 - 17.6 - tw, base = 251.7 - m.actualBoundingBoxDescent;
    b.shadowColor = 'rgba(110,247,166,0.7)'; b.shadowBlur = 3 * (CACHE.S || 1); b.fillStyle = MINT;
    for (const [x, y, sx, sy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]) { b.fillRect(sx > 0 ? x : x - 7.5, sy > 0 ? y : y - 1.3, 7.5, 1.3); b.fillRect(sx > 0 ? x : x - 1.3, sy > 0 ? y : y - 6.5, 1.3, 6.5); }
    const gr = b.createLinearGradient(x0 + 10, 0, x1 - 8, 0); gr.addColorStop(0, 'rgba(110,247,166,0)'); gr.addColorStop(0.5, 'rgba(160,255,205,0.95)'); gr.addColorStop(1, 'rgba(110,247,166,0)'); b.fillStyle = gr; b.fillRect(x0 + 10, 262.6, x1 - x0 - 18, 1);
    const tri = 0.86 + 0.14 * (0.5 + 0.5 * Math.sin(t * 4.2)); b.globalAlpha = a * tri; b.fillStyle = '#7dfab0'; b.shadowColor = 'rgba(110,247,166,0.95)'; b.shadowBlur = 8 * (CACHE.S || 1);
    const ax = tx - 25.3; b.beginPath(); b.moveTo(ax, 234.8); b.lineTo(ax + 15.2, 243); b.lineTo(ax, 251.2); b.closePath(); b.fill();
    b.globalAlpha = a; b.shadowColor = 'rgba(0,0,0,0.6)'; b.shadowBlur = 2 * (CACHE.S || 1); b.fillStyle = INK; b.fillText(label, tx + m.actualBoundingBoxLeft, base);
    b.restore();
  }
  function ticker(b, S, str, a, t) { // 석차표 줄: '석차표' 글자는 서 있고, 기록은 흐른다. 양 끝은 흐리게
    b.save(); b.globalAlpha = a; b.font = `600 13.5px ${SANS}`; b.textBaseline = 'alphabetic'; b.fillStyle = INK; b.shadowColor = 'rgba(0,0,0,0.7)'; b.shadowBlur = 2 * S;
    b.fillText('석차표', 192, 343.4); b.restore();
    const wx = 246, ww = 210, wh = 18;
    if (CACHE.tickStr !== str || !CACHE.tick || CACHE.tick.S !== S) { // 흐르는 글자 한 줄을 미리 찍어 둔다
      const mg = canvasOf(4, 4).getContext('2d'); mg.font = `600 ${13.5 * S}px ${SANS}`;
      const sw = Math.ceil(mg.measureText(str).width) + 1, c = canvasOf(sw, wh * S), g = c.getContext('2d');
      g.font = `600 ${13.5 * S}px ${SANS}`; g.textBaseline = 'alphabetic'; g.fillStyle = INK; g.shadowColor = 'rgba(0,0,0,0.7)'; g.shadowBlur = 2 * S; g.fillText(str, 0, 13.4 * S);
      CACHE.tick = { c, S, sw: sw / S, win: canvasOf(ww * S, wh * S) }; CACHE.tickStr = str;
    }
    const T = CACHE.tick, g = T.win.getContext('2d'), off = (t * 24) % T.sw;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, T.win.width, T.win.height);
    for (let x = -off; x < ww; x += T.sw) g.drawImage(T.c, Math.round(x * S), 0);
    g.globalCompositeOperation = 'destination-in'; const gr = g.createLinearGradient(0, 0, ww * S, 0);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.14, 'rgba(0,0,0,1)'); gr.addColorStop(0.88, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, ww * S, wh * S);
    b.save(); b.globalAlpha = a; b.imageSmoothingEnabled = true; b.drawImage(T.win, wx, 330, ww, wh); b.restore();
  }

  // ---- 석차표 (줄을 누르면 화면 오른쪽에 펼쳐진다) ----
  function rankPanel(b, RK, rk, now) {
    const a = clamp01((rk - 0.35) / 0.65); if (a <= 0) return [];
    const btns = [], bf = sz => `400 ${sz * BOOT_K}px ${BOOT_FONT}`, G1 = '#74ff8e';
    const text = (s, x, y, f, col, align, glow) => { b.font = f; b.textAlign = align; b.textBaseline = 'alphabetic'; b.shadowColor = glow || 'transparent'; b.shadowBlur = glow ? 4 * (CACHE.S || 1) : 0; b.fillStyle = col; b.fillText(s, x, y); b.shadowBlur = 0; };
    b.save(); b.globalAlpha = a;
    b.imageSmoothingEnabled = true; b.drawImage(rankTitle(CACHE.S), LG.x, LG.y - 30 - 22, LG.w, LG.h);
    const rows = RK.rows, total = RK.total || rows.length, mineI = rows.findIndex(r => r.me), rankOf = i => rows[i].rank || i + 1, per = 10, pages = Math.max(1, Math.ceil(rows.length / per)), page = Math.max(0, Math.min(pages - 1, RK.page || 0));
    const stats = [RK.online ? `응시자 ${total.toLocaleString()}명` : `이 기기의 기록 ${total}개`, mineI >= 0 ? `내 석차 ${rankOf(mineI)}등` : '내 석차 미정'].concat(RK.online && RK.runs > 0 ? [`누적 응시 ${RK.runs.toLocaleString()}회`] : []);
    text(stats.join('  ·  '), 621, 62, bf(13), G1, 'right', '#0a4018');
    const x0 = 356, x1 = 622, y0 = 70, y1 = 298; // 판
    b.globalAlpha = a * 0.72; b.fillStyle = '#02100a'; b.fillRect(x0, y0, x1 - x0, y1 - y0); b.globalAlpha = a; b.fillStyle = MINT;
    for (const [x, y, sx, sy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]) { b.fillRect(sx > 0 ? x : x - 8, sy > 0 ? y : y - 1.3, 8, 1.3); b.fillRect(sx > 0 ? x : x - 1.3, sy > 0 ? y : y - 7, 1.3, 7); }
    const lh = 18.6, rx = x0 + 12, rw = x1 - x0 - 24, show = Math.floor(clamp01((rk - 0.35) / 0.65) * 13), list = rows.slice(page * per, page * per + per);
    const row = (i, r, y, inv) => { if (inv) { b.fillStyle = G1; b.fillRect(rx - 4, y - 14.5, rw + 8, 19); } const col = inv ? '#06200e' : G1, gl = inv ? null : '#0a4018', nm = [...r.name].slice(0, 8).join('');
      text(`${rankOf(i)}등`, rx, y, bf(15.5), col, 'left', gl); text(nm, rx + 46, y, bf(15.5), col, 'left', gl); text(fmtRunT(r.t), rx + rw, y, bf(15.5), col, 'right', gl); };
    list.forEach((r, i) => { if (i < show) row(page * per + i, r, y0 + 21 + i * lh, false); });
    if (!rows.length && show > 2) { text('아직 기록이 없습니다', (x0 + x1) / 2, (y0 + y1) / 2 - 4, bf(15.5), G1, 'center', '#0a4018'); text('엔딩을 보면 석차표에 오릅니다', (x0 + x1) / 2, (y0 + y1) / 2 + 17, bf(12.5), '#d8f8e0', 'center', '#0a4018'); }
    if (mineI >= 0 && show > 11) row(mineI, rows[mineI], y1 - 9, true);
    if (rk >= 1) { const py = y1 + 14; b.globalAlpha = a * (page > 0 ? 1 : 0.35); text('▲ 위로', x0, py, bf(12), G1, 'left', '#0a4018'); b.globalAlpha = a * (page < pages - 1 ? 1 : 0.35); text('아래로 ▼', x1, py, bf(12), G1, 'right', '#0a4018'); b.globalAlpha = a;
      text(rows.length ? `${page * per + 1}~${Math.min(rows.length, page * per + per)}등 / ${(RK.listed != null ? RK.listed : total).toLocaleString()}명` : '', (x0 + x1) / 2, py, bf(12), G1, 'center', '#0a4018');
      btns.push({ x: x0 - 10, y: py - 16, w: (x1 - x0) / 3, h: 26, key: 'rank:up' }, { x: x1 - (x1 - x0) / 3 + 10, y: py - 16, w: (x1 - x0) / 3, h: 26, key: 'rank:down' }); }
    b.restore();
    return btns;
  }

  // ---- 타이틀 ----
  function lensTitle(k, L, now, hasSave, info) {
    if (Q.get('hud') === '0') return []; // check only: 배경만
    if (plateBad) return OLD_TITLE(k, L, now, hasSave, info);
    const b = k.b, S = k.S || HUD_SCALE, RK = info.rank || { k: 0, rows: [] }, rk = RK.k;
    if (CACHE.S !== S) { CACHE.S = S; CACHE.frame = null; CACHE.logo = null; CACHE.rank = null; CACHE.tick = null; }
    if (now - lastNow > 0.5 || now < lastNow) T0 = now; lastNow = now;
    if (firstSeen < 0) firstSeen = now;
    const ready = loaded(plate) && (fontOk() || now - firstSeen > 2.5);
    if (!ready) T0 = now; // 그림과 글꼴이 오기 전에는 켜지는 연출을 시작하지 않는다
    const t = FIX_T != null ? FIX_T : now - T0, P = timeline(t), btns = [];
    b.save(); b.fillStyle = '#000000'; b.fillRect(0, 0, W, H);
    if (ready) {
      b.imageSmoothingEnabled = true; b.imageSmoothingQuality = 'high';
      b.drawImage(plate, 0, 0, W, H);
      lenses(b, P, t);
      if (rk > 0) { b.globalAlpha = 0.5 * rk; b.fillStyle = '#000000'; b.fillRect(0, 0, W, H); b.globalAlpha = 1; }
      if (!CACHE.frame) CACHE.frame = buildFrame(S);
      b.globalAlpha = P.frame; b.drawImage(CACHE.frame, 0, 0, W, H); b.globalAlpha = 1;
      const ua = 1 - clamp01(rk * 2.4); // 석차표를 열면 로고·버튼·줄은 걷힌다
      if (P.logo > 0 && ua > 0) {
        const lo = logo(S), e = 1 - Math.pow(1 - P.logo, 3), sc = 1 + 0.24 * (1 - e), cx = LG.x + LG.w / 2, cy = LG.y + LG.h / 2;
        b.save(); b.globalAlpha = Math.min(1, P.logo * 1.6) * ua; b.translate(cx + P.shake, cy + P.shake * 0.4); b.scale(sc, sc); b.drawImage(lo, -LG.w / 2, -LG.h / 2, LG.w, LG.h); b.restore();
      }
      if (ua > 0 && rk <= 0 && P.logo >= 1) {
        b.save(); b.font = `500 10.5px ${SANS}`; b.textAlign = 'right'; b.textBaseline = 'alphabetic'; b.fillStyle = 'rgba(247,240,221,0.85)'; b.shadowColor = 'rgba(0,0,0,0.7)'; b.shadowBlur = 2 * S;
        if (info.best) b.fillText(`내 최고 기록 ${info.best}`, 621, 220);
        if (info.ios) { b.font = `500 9.5px ${SANS}`; b.fillStyle = 'rgba(247,240,221,0.7)'; b.fillText('아이폰은 공유 → "홈 화면에 추가"로 열면 전체 화면', 621, 300); }
        b.restore();
      }
      if (P.btn > 0 && ua > 0) startButton(b, hasSave ? '이어서 하기' : '시험 시작', P.btn * ua, t);
      if (P.tick > 0 && ua > 0) {
        const rows = RK.rows || [], str = rows.length ? rows.slice(0, 10).map((r, i) => `${i + 1}등 ${r.name} ${fmtRunT(r.t)}`).join('   ·   ') + '   ·   ' : '아직 기록이 없습니다 · 엔딩을 보면 석차표에 오릅니다   ·   ';
        ticker(b, S, str, P.tick * ua, t);
      }
      if (rk > 0) {
        btns.push(...rankPanel(b, RK, rk, now));
        if (rk >= 0.5) closeLabel(b, clamp01((rk - 0.5) * 2), S);
        if (rk >= 1) btns.push({ x: 0, y: 320, w: W, h: H - 320, key: 'rank:close' });
      }
      if (P.black > 0) { b.globalAlpha = P.black; b.fillStyle = '#000000'; b.fillRect(0, 0, W, H); b.globalAlpha = 1; }
    }
    b.restore(); b.imageSmoothingEnabled = false; b.textAlign = 'left';
    if (rk <= 0) { btns.push({ x: 0, y: 322, w: W, h: H - 322, key: 'rank:open' }); btns.push({ x: 0, y: 0, w: W, h: H, key: 'start' }); }
    return btns;
  }
  function closeLabel(b, a, S) { // 석차표를 열면 아래 띠의 글자가 '돌아가기'로 바뀐다 (같은 띠를 다시 누르면 닫힌다)
    b.save(); b.globalAlpha = a; b.font = `600 13.5px ${SANS}`; b.textAlign = 'center'; b.textBaseline = 'alphabetic'; b.shadowColor = 'rgba(0,0,0,0.7)'; b.shadowBlur = 2 * S;
    b.fillStyle = INK; b.fillText('돌아가기', 326, 343.4); b.fillStyle = MINT; b.beginPath(); b.moveTo(287, 339.2); b.lineTo(294.5, 335); b.lineTo(294.5, 343.4); b.closePath(); b.fill(); b.restore();
  }
  // ---- 시험 시작: 왼쪽 렌즈 안으로 들어가며 시험장이 드러난다 (a: 1 → 0, 0.9초) ----
  function lensTitleOut(k, L, now, a) {
    if (!loaded(plate)) { if (OLD_OUT) OLD_OUT(k, L, now, a); return; }
    const b = k.b, p = 1 - a, z = 1 + 11 * Math.pow(p, 2.2), fade = 1 - smooth(0.42, 0.9, p);
    b.save(); b.imageSmoothingEnabled = true;
    if (fade > 0) { b.save(); b.globalAlpha = fade; b.translate(DIVE_C[0], DIVE_C[1]); b.scale(z, z); b.translate(-DIVE_C[0], -DIVE_C[1]); b.drawImage(plate, 0, 0, W, H); b.restore(); }
    const ua = 1 - smooth(0, 0.16, p);
    if (ua > 0) { b.globalAlpha = ua; if (CACHE.frame) b.drawImage(CACHE.frame, 0, 0, W, H); if (CACHE.logo) b.drawImage(CACHE.logo, LG.x, LG.y, LG.w, LG.h); }
    const fl = Math.max(0, 1 - Math.abs(p - 0.6) / 0.17); if (fl > 0) { b.globalCompositeOperation = 'lighter'; b.globalAlpha = 0.28 * fl; b.fillStyle = MINT; b.fillRect(0, 0, W, H); b.globalCompositeOperation = 'source-over'; }
    b.restore(); b.imageSmoothingEnabled = false;
  }

  window.drawTitle = lensTitle;
  window.drawTitleOut = lensTitleOut;
})();
