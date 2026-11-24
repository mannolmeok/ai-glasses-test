// PROTOTYPE - NOT FOR PRODUCTION
// 타이틀 시안 3번 '렌즈 반사 클로즈업' (테스트판, 도트판). art.js의 drawTitle · drawTitleOut 을 이 파일의 것으로 바꿔 끼운다.
// 그림·글자·선을 전부 640x360 한 장(게임 화면 1칸 = 점 하나)에 그린 뒤 번지지 않게 키운다. 작은 글자는 게임의 도트 글꼴(갈무리11),
// 제목은 기존 타이틀 글꼴(Black Han Sans)을 점으로 찍은 것. 'AI'는 기존 타이틀처럼 초록 + 빨강·파랑 어긋남 + 가끔 흔들림.
// 움직임: 오른쪽 렌즈 속 감독관이 다가오면 왼쪽 렌즈 화면이 꺼졌다 켜지고, 보기 ②가 깜빡이고, 땀방울이 흘러내린다.
// 시험 시작을 누르면 왼쪽 렌즈 안으로 들어간다. 타이틀이 떠 있는 동안 뒤의 3D 시험장은 그리지 않는다 (그림이 다 덮으므로).
'use strict';
(function () {
  if (typeof drawTitle !== 'function') return;
  const OLD_TITLE = drawTitle, OLD_OUT = typeof drawTitleOut === 'function' ? drawTitleOut : null; // 그림을 못 받으면 예전 타이틀로
  const W = 640, H = 360;
  const G1 = '#74ff8e', G_DK = '#0a4018', G_HI = '#c8ffd8', CREAM = '#f4ecd6', INK = '#f2f5ee', DARK = '#050806';
  const PX = '"Galmuri11","Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",sans-serif'; // 게임의 도트 글꼴: 12px의 배수에서 점이 또렷하다
  const BHS = '"Black Han Sans","Do Hyeon","Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",sans-serif'; // 기존 타이틀 글꼴
  const Q = new URLSearchParams(location.search);
  const FIX_T = Q.has('tt') ? Number(Q.get('tt')) : null; // check only: 타이틀 연출의 그 순간에 멈춰 본다 (초)

  const plate = new Image(); let plateBad = false; plate.onerror = () => { plateBad = true; }; plate.src = 'assets/title/lens-plate-px.png?v=2';
  const loaded = im => im.complete && im.naturalWidth > 0;
  const fontOk = () => !document.fonts || (document.fonts.check(`400 60px ${BHS}`, 'AI 안경으로 살아남기') && document.fonts.check(`12px ${PX}`, '석차표 시험 시작'));
  if (document.fonts) Promise.all([document.fonts.load(`400 60px ${BHS}`, 'AI 안경으로 살아남기 전국 석차표'), document.fonts.load(`12px ${PX}`, '석차표 시험 시작 이어서 하기 돌아가기')]).then(() => { SPR.ok = false; }, () => { });

  // ---- 그림 속 자리 (640x360) ----
  const LENS_L = [[73.7, 140.3], [95.7, 131.0], [122.7, 131.0], [195.0, 141.3], [204.3, 145.0], [218.7, 158.3], [215.3, 172.7], [198.0, 220.0], [190.7, 232.7], [179.3, 244.0], [163.0, 247.7], [123.7, 246.7], [87.0, 238.3], [73.3, 224.3], [69.0, 190.3]];
  const LENS_R = [[367.0, 165.7], [343.3, 235.0], [332.7, 246.7], [314.7, 250.0], [269.3, 245.0], [261.3, 234.7], [258.7, 201.7], [262.0, 175.7], [266.0, 162.3], [282.3, 148.7], [315.3, 147.7], [353.7, 152.3]];
  const ROW2 = [[108.8, 163.1], [189.4, 175.6], [188.1, 197.5], [105.0, 184.8]]; // 왼쪽 렌즈 속 보기 ② 줄
  const SKIN = [[20, 55], [120, 55], [120, 104], [100, 104.5], [82.5, 106.5], [61, 121.5], [43.5, 108.5], [20, 108]]; // 땀방울이 보이는 곳 (안경테 뒤로 숨는다)
  const ZOOM_C = [311, 190], DIVE_C = [142, 189], DROP_AT = [61, 88];
  const RB = [255, 145, 116, 108]; // 오른쪽 렌즈를 담는 칸 (x, y, w, h)
  const BRK_R = [[270, 170, 1, 1], [354, 162, -1, 1], [332, 234, -1, -1]]; // 오른쪽 렌즈 속 추적 괄호 (시안 그대로 셋)

  const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
  const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  const canvasOf = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
  const ctx2 = c => { const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return g; };
  const path = (g, P) => { g.beginPath(); g.moveTo(P[0][0], P[0][1]); for (let i = 1; i < P.length; i++) g.lineTo(P[i][0], P[i][1]); g.closePath(); };
  function crisp(c, thr = 128) { // 반투명 가장자리를 없애 점만 남긴다
    const g = c.getContext('2d'), id = g.getImageData(0, 0, c.width, c.height), d = id.data;
    for (let i = 3; i < d.length; i += 4) d[i] = d[i] >= thr ? 255 : 0;
    g.putImageData(id, 0, 0); return c;
  }
  const tint = (src, col) => { const c = canvasOf(src.width, src.height), g = ctx2(c); g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, c.width, c.height); return c; };
  function polyMask(P) { const c = canvasOf(W, H), g = ctx2(c); g.fillStyle = '#ffffff'; path(g, P); g.fill(); return crisp(c); }
  function outlined(mask, col, edge, shadow) { // 점 글자에 1칸 테두리(edge)와 1칸 그림자(shadow). 글자는 (1,1)에서 시작
    const c = canvasOf(mask.width + 3, mask.height + 3), g = ctx2(c);
    if (shadow) g.drawImage(tint(mask, shadow), 2, 2);
    if (edge) { const e = tint(mask, edge); for (const [dx, dy] of [[0, 1], [2, 1], [1, 0], [1, 2], [0, 0], [2, 0], [0, 2], [2, 2]]) g.drawImage(e, dx, dy); }
    g.drawImage(tint(mask, col), 1, 1); return c;
  }
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16); // 점 무늬로 어둡게 할 때 쓰는 4x4 순서

  // ---- 미리 그려 두는 것들 ----
  const SPR = { ok: false, txt: new Map() };
  function pxText(str, size, col, edge = DARK, bold = false) { // 도트 글꼴 한 줄 (size는 12의 배수, bold면 획을 한 칸 두껍게). c.base: 위에서 글자 바닥선까지
    const key = str + '|' + size + '|' + col + '|' + edge + '|' + bold; let c = SPR.txt.get(key); if (c) return c;
    const mg = canvasOf(4, 4).getContext('2d'); mg.font = `${size}px ${PX}`; const w = Math.ceil(mg.measureText(str).width) + 2, h = Math.ceil(size * 1.3), base = Math.round(size * 1.05);
    const t = canvasOf(w + (bold ? 1 : 0), h), g = t.getContext('2d'); g.font = `${size}px ${PX}`; g.textBaseline = 'alphabetic'; g.fillStyle = '#ffffff'; g.fillText(str, 1, base); if (bold) g.fillText(str, 2, base);
    c = outlined(crisp(t), col, edge, null); c.base = base + 1; c.tw = w - 2; if (SPR.txt.size > 400) SPR.txt.clear(); SPR.txt.set(key, c); return c;
  }
  const putText = (c, x, baseY, align = 'left') => lg.drawImage(c, Math.round(align === 'right' ? x - c.tw : align === 'center' ? x - c.tw / 2 : x) - 2, Math.round(baseY - c.base));
  function fitInk(g, str, font, box) { // 글자의 실제 잉크 상자를 box에 맞출 배율
    g.font = font; const m = g.measureText(str);
    return { sx: box.w / (m.actualBoundingBoxLeft + m.actualBoundingBoxRight), sy: box.h / (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent), iw: m.actualBoundingBoxLeft + m.actualBoundingBoxRight, ox: m.actualBoundingBoxLeft, oy: m.actualBoundingBoxDescent };
  }
  function bhsMask(words) { // 제목 글꼴을 화면 1칸 = 점 하나로 찍은 모양 (화면 크기 캔버스)
    const c = canvasOf(W, H), g = c.getContext('2d');
    for (const [str, box, right] of words) {
      const font = `400 100px ${BHS}`, f = fitInk(g, str, font, box), sx = right ? f.sy : f.sx, x0 = right ? box.x + box.w - f.iw * sx : box.x;
      g.save(); g.translate(x0, box.y + box.h); g.scale(sx, f.sy); g.font = font; g.textBaseline = 'alphabetic'; g.fillStyle = '#ffffff'; g.fillText(str, f.ox, -f.oy); g.restore();
    }
    return crisp(c);
  }
  function wear(c, seed, n) { // 닳은 자국: 글자 안쪽 몇 칸을 비운다
    let s = seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647, g = c.getContext('2d'), id = g.getImageData(0, 0, c.width, c.height), d = id.data, Wc = c.width;
    for (let i = 0, k = 0; i < n * 60 && k < n; i++) { const x = 1 + Math.floor(rnd() * (Wc - 2)), y = 1 + Math.floor(rnd() * (c.height - 2)), p = (y * Wc + x) * 4;
      if (d[p + 3] && d[p - 1] && d[p + 7] && d[p + 3 - Wc * 4] && d[p + 3 + Wc * 4]) { d[p + 3] = 0; k++; } }
    g.putImageData(id, 0, 0); return c;
  }
  function build() {
    // 렌즈 모양
    SPR.mL = polyMask(LENS_L); SPR.mR = polyMask(LENS_R); SPR.mSkin = polyMask(SKIN);
    const row = polyMask(ROW2), rg = ctx2(row); rg.globalCompositeOperation = 'destination-in'; rg.drawImage(SPR.mL, 0, 0); SPR.row2 = tint(row, G1);
    // 꺼진 렌즈: 어두운 유리 + 비스듬한 반사 두 줄
    const dk = tint(SPR.mL, 'rgba(3,10,7,0.96)'), dg = ctx2(dk); dg.globalCompositeOperation = 'source-atop'; dg.fillStyle = 'rgba(200,232,215,0.10)';
    for (const [a, b] of [[60, 74], [92, 98]]) { dg.beginPath(); dg.moveTo(a, 120); dg.lineTo(b, 120); dg.lineTo(b + 130, 260); dg.lineTo(a + 130, 260); dg.closePath(); dg.fill(); }
    SPR.dark = dk;
    // 렌즈 빛이 꺼지면 얼굴에 비치던 초록빛도 죽는다: 점 무늬로 어둡게
    const sp = canvasOf(W, H), sg = sp.getContext('2d'), sid = sg.createImageData(W, H), sd = sid.data;
    for (let y = 150; y < 300; y++) for (let x = 70; x < 280; x++) {
      let k = 0; for (const [cx, cy, r, s] of [[230, 224, 40, 0.75], [150, 262, 72, 0.5]]) { const q = Math.hypot(x - cx, y - cy) / r; if (q < 1) k = Math.max(k, s * (1 - q)); }
      if (k > BAYER[(y & 3) * 4 + (x & 3)]) sd[(y * W + x) * 4 + 3] = 150;
    }
    sg.putImageData(sid, 0, 0); SPR.spill = sp;
    // 땀방울 (점 그림)
    const art = ['....o...', '....o...', '...oo...', '...oo...', '..oho...', '..ofo...', '.ohffo..', '.offfo..', 'ohfffso.', 'offffso.', 'offffso.', '.offso..', '..ooo...'];
    const col = { o: 'rgba(226,240,238,0.85)', f: 'rgba(255,255,255,0.20)', h: '#ffffff', s: 'rgba(40,24,18,0.35)' }, dc = canvasOf(8, art.length), dx = ctx2(dc);
    art.forEach((r, y) => [...r].forEach((ch, x) => { if (col[ch]) { dx.fillStyle = col[ch]; dx.fillRect(x, y, 1, 1); } }));
    SPR.drop = dc;
    // 테두리 (화면 가장자리 선·모서리 괄호, 아래 석차표 띠)
    const fr = canvasOf(W, H), f = ctx2(fr);
    const R = (x, y, w, h, a, c = G1) => { f.globalAlpha = a; f.fillStyle = c; f.fillRect(x, y, w, h); };
    const dashes = (x, y, n) => { f.globalAlpha = 1; f.fillStyle = G1; for (let i = 0; i < n; i++) for (let r = 0; r < 5; r++) f.fillRect(x + i * 8 + (4 - r), y + r, 5, 1); };
    R(7, 7, 626, 1, 0.5); R(7, 7, 22, 2, 1, G_HI); R(611, 7, 22, 2, 1, G_HI); R(7, 7, 1, 49, 0.8); R(632, 7, 1, 49, 0.8);
    R(320, 3, 1, 11, 1); for (const d of [-16, -8, 8, 16]) R(320 + d, Math.abs(d) > 8 ? 7 : 5, 1, Math.abs(d) > 8 ? 3 : 5, 0.6); R(94, 6, 2, 3, 1);
    R(7, 328, 626, 1, 0.45); R(320, 325, 1, 7, 0.9); dashes(21, 336, 5); R(85, 339, 86, 1, 0.65); R(469, 339, 112, 1, 0.65); dashes(585, 336, 5);
    R(7, 349, 626, 1, 0.5); R(7, 348, 22, 2, 1, G_HI); R(611, 348, 22, 2, 1, G_HI); R(7, 326, 1, 24, 0.8); R(632, 326, 1, 24, 0.8); R(320, 349, 1, 6, 1);
    SPR.frame = fr;
    // 제목: 안경으로 · 살아남기 (크림색 점 글자, 1칸 테두리와 그림자) / AI (기존 타이틀처럼 초록, 빨강·파랑 어긋남, 짙은 초록 테두리)
    SPR.words = outlined(wear(bhsMask([['안경으로', { x: 493, y: 92, w: 129, h: 38 }], ['살아남기', { x: 418, y: 138, w: 209, h: 56 }]]), 9137, 46), CREAM, DARK, 'rgba(0,0,0,0.6)');
    const ai = bhsMask([['AI', { x: 404, y: 80, w: 85, h: 56 }, true]]);
    const ac = canvasOf(W + 8, H + 4), a = ctx2(ac);
    a.globalAlpha = 0.45; a.drawImage(tint(ai, 'rgb(255,60,60)'), 4 + 2, 1); a.globalAlpha = 0.4; a.drawImage(tint(ai, 'rgb(60,160,255)'), 4 - 2, 1); a.globalAlpha = 1;
    const e = tint(ai, G_DK); for (const [ex, ey] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) a.drawImage(e, 4 + ex, 1 + ey);
    a.drawImage(tint(ai, G1), 4, 1);
    const hi = tint(ai, G_HI), hg = ctx2(hi); hg.globalCompositeOperation = 'destination-in'; hg.fillStyle = '#ffffff'; hg.fillRect(0, 80, W, 9); a.globalAlpha = 0.5; a.drawImage(hi, 4, 1); a.globalAlpha = 1; // 윗줄 몇 칸을 밝게
    SPR.ai = ac;
    // 제목 둘레 장식 선 (점선으로 끊어지며 흐려진다)
    const dc2 = canvasOf(W, H), d2 = ctx2(dc2);
    const seg = (x0, x1, y, h, a0, a1) => { const n = Math.max(1, Math.round((x1 - x0) / 6)); for (let i = 0; i < n; i++) { d2.globalAlpha = a0 + (a1 - a0) * (i / Math.max(1, n - 1)); d2.fillStyle = G1; d2.fillRect(Math.round(x0 + (x1 - x0) * i / n), y, Math.ceil((x1 - x0) / n), h); } };
    seg(462, 556, 84, 1, 0.95, 0.15);
    seg(366, 437, 99, 2, 0.1, 1); seg(388, 446, 105, 1, 0.1, 0.9); seg(360, 431, 112, 2, 0.1, 1);
    seg(428, 579, 205, 1, 0.1, 1); d2.globalAlpha = 1; d2.fillStyle = G1; d2.fillRect(579, 204, 2, 1); d2.fillRect(581, 203, 2, 1);
    for (let i = 0; i < 5; i++) for (let r = 0; r < 5; r++) d2.fillRect(585 + i * 5 + ((4 - r) * 0.6 | 0), 203 + r, 3, 1);
    d2.globalAlpha = 0.85; d2.fillRect(618, 206, 8, 1);
    SPR.deco = dc2;
    // 석차표 제목
    SPR.rankTitle = outlined(bhsMask([['전국 석차표', { x: 470, y: 18, w: 151, h: 30 }]]), CREAM, DARK, 'rgba(0,0,0,0.6)');
    SPR.scanTmp = canvasOf(W, H); SPR.tick = null; SPR.ok = true;
  }

  // ---- 시간표 ----
  // 켜질 때 (0~2.7초): 검은 화면 → 그림이 밝아짐 → 왼쪽 렌즈가 스캔 줄과 함께 켜짐 → 제목이 찍히고 흔들림 → 버튼 깜빡 → 석차표 줄
  // 그 뒤 10초마다: 감독관이 6초에 걸쳐 다가옴 → 왼쪽 렌즈 꺼짐 → 감독관이 멀어짐 → 다시 켜짐. 다가오는 동안 땀방울이 흘러내림
  function timeline(t) {
    const P = {};
    P.black = 1 - smooth(0.2, 0.85, t);
    P.power = clamp01((t - 0.95) / 0.45);
    P.logo = clamp01((t - 1.35) / 0.26);
    P.shake = t > 1.61 && t < 1.86 ? Math.round(Math.sin(t * 97) * 2 * (1 - (t - 1.61) / 0.25)) : 0;
    P.frame = smooth(1.3, 1.75, t);
    P.btn = t < 1.95 ? 0 : t < 2.35 ? (Math.floor((t - 1.95) * 20) % 2 ? 0.2 : 1) : 1;
    P.tick = smooth(2.25, 2.7, t);
    P.jit = (t * 0.29) % 1 < 0.035 ? Math.round(Math.sin(t * 90) * 3) : 0; // 기존 타이틀처럼 가끔 옆으로 흔들림 (AI만)
    P.zoom = 1; P.off = 0; P.scan = -1; P.drop = { y: 0, a: 1 };
    const u = t < 2.7 ? -1 : (t - 2.7) % 10;
    if (u >= 0) {
      P.zoom = 1 + 0.32 * (u < 6 ? smooth(0, 6, u) : u < 7.3 ? 1 : 1 - smooth(7.3, 8.5, u));
      const flick = (a, b) => u >= a && u < b ? Math.floor((u - a) / 0.035) % 2 : -1;
      P.off = u >= 6 && u < 8.5 ? 1 : 0;
      const f1 = flick(6, 6.14), f2 = flick(8.5, 8.64);
      if (f1 >= 0) P.off = f1 ? 0 : 1;
      if (f2 >= 0) P.off = f2 ? 1 : 0;
      if (u >= 8.64 && u < 9.1) P.scan = (u - 8.64) / 0.46;
      if (u >= 5.2 && u < 7.6) P.drop = { y: Math.round(24 * Math.pow((u - 5.2) / 2.4, 1.8)), a: 1 };
      else if (u >= 7.6 && u < 8.8) P.drop = { y: 0, a: 0 };
      else if (u >= 8.8 && u < 9.6) P.drop = { y: 0, a: Math.ceil(smooth(8.8, 9.6, u) * 4) / 4 };
    }
    return P;
  }

  // ---- 한 장(640x360)에 그리기 ----
  const LAY = canvasOf(W, H), lg = ctx2(LAY), TMP = canvasOf(RB[2], RB[3]), tg = ctx2(TMP), DT = canvasOf(8, 14), dtg = ctx2(DT);
  function scanLine(y) { // 왼쪽 렌즈 안에만 보이는 스캔 줄 (밝은 한 줄 + 위로 흐려지는 세 줄)
    y = Math.round(y); const g2 = ctx2(SPR.scanTmp);
    g2.globalCompositeOperation = 'source-over'; g2.clearRect(0, 0, W, H);
    g2.globalAlpha = 0.95; g2.fillStyle = G_HI; g2.fillRect(60, y, 170, 1); g2.fillStyle = G1;
    for (let i = 1; i <= 3; i++) { g2.globalAlpha = 0.55 - i * 0.14; g2.fillRect(60, y - i, 170, 1); } g2.globalAlpha = 1;
    g2.globalCompositeOperation = 'destination-in'; g2.drawImage(SPR.mL, 0, 0); g2.globalCompositeOperation = 'source-over';
    lg.drawImage(SPR.scanTmp, 0, 0);
  }
  function lenses(P, t) {
    if (P.zoom > 1.0005) { // 오른쪽 렌즈: 렌즈 안만 키워서 감독관이 다가오는 것처럼. 가까울수록 어둡게
      const [x, y, w, h] = RB, z = P.zoom, sx = ZOOM_C[0] + (x - ZOOM_C[0]) / z, sy = ZOOM_C[1] + (y - ZOOM_C[1]) / z;
      tg.globalCompositeOperation = 'source-over'; tg.globalAlpha = 1; tg.clearRect(0, 0, w, h); tg.drawImage(plate, sx, sy, w / z, h / z, 0, 0, w, h);
      tg.globalAlpha = Math.round(0.34 * (z - 1) / 0.32 * 8) / 8; tg.fillStyle = '#010604'; tg.fillRect(0, 0, w, h); tg.globalAlpha = 1;
      tg.globalCompositeOperation = 'destination-in'; tg.drawImage(SPR.mR, x, y, w, h, 0, 0, w, h); tg.globalCompositeOperation = 'source-over';
      lg.drawImage(TMP, x, y);
    }
    const scrOn = P.power >= 1 && !P.off;
    if (scrOn) {
      const e = 1 + (P.zoom - 1) * 0.7; lg.fillStyle = G1; // 오른쪽 렌즈 속 추적 괄호 (감독관이 가까울수록 벌어진다)
      for (const [x, y, sx, sy] of BRK_R) { const X = Math.round(ZOOM_C[0] + (x - ZOOM_C[0]) * e), Y = Math.round(ZOOM_C[1] + (y - ZOOM_C[1]) * e); lg.fillRect(sx > 0 ? X : X - 6, Y, 7, 1); lg.fillRect(X, sy > 0 ? Y : Y - 5, 1, 6); }
      const k = 0.1 + 0.3 * Math.pow(Math.max(0, Math.sin(t * Math.PI * 2 / 1.3)), 3); // 보기 ② 깜빡
      lg.globalCompositeOperation = 'lighter'; lg.globalAlpha = Math.round(k * 10) / 10; lg.drawImage(SPR.row2, 0, 0); lg.globalAlpha = 1; lg.globalCompositeOperation = 'source-over';
    }
    if (P.power < 1) { const y = Math.round(128 + 124 * P.power); if (y < H) lg.drawImage(SPR.dark, 0, y, W, H - y, 0, y, W, H - y); if (P.power > 0) scanLine(y); } // 켜지는 중: 스캔 줄 아래는 아직 꺼진 유리
    else if (P.off) { lg.drawImage(SPR.dark, 0, 0); lg.drawImage(SPR.spill, 0, 0); }
    if (P.scan >= 0) scanLine(128 + 124 * P.scan);
    if (P.drop.a > 0) { // 땀방울: 안경테 위 피부에서만 보이고, 흘러내리면 테 뒤로 숨는다
      const [x, y] = DROP_AT, yy = y + P.drop.y; dtg.globalCompositeOperation = 'source-over'; dtg.clearRect(0, 0, 8, 14); dtg.drawImage(SPR.drop, 0, 0);
      dtg.globalCompositeOperation = 'destination-in'; dtg.drawImage(SPR.mSkin, x, yy, 8, 14, 0, 0, 8, 14); dtg.globalCompositeOperation = 'source-over';
      lg.globalAlpha = P.drop.a; lg.drawImage(DT, x, yy); lg.globalAlpha = 1;
    }
  }
  function startButton(label, a, t) { // 시험 시작: 모서리 괄호 + ▶ + 도트 글자 (24px = 점 두 칸)
    const tx = pxText(label, 24, INK, DARK, true), x1 = 593, tw = tx.tw, x0 = Math.min(452, x1 - 18 - tw - 30), y0 = 226, y1 = 262;
    lg.globalAlpha = a; lg.fillStyle = G1;
    for (const [x, y, sx, sy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]) { lg.fillRect(sx > 0 ? x : x - 7, sy > 0 ? y : y - 1, 8, 2); lg.fillRect(sx > 0 ? x : x - 1, sy > 0 ? y : y - 6, 2, 7); }
    const ux0 = x0 + 10, ux1 = x1 - 10; for (let x = ux0; x < ux1; x += 4) { const q = 1 - Math.abs((x - (ux0 + ux1) / 2) / ((ux1 - ux0) / 2)); lg.globalAlpha = a * Math.round((0.15 + 0.85 * q) * 6) / 6; lg.fillRect(x, y1 + 3, 3, 1); }
    lg.globalAlpha = a * (Math.sin(t * 4.2) > -0.4 ? 1 : 0.7); const ax = x1 - 18 - tw - 24; // ▶ 점 그림
    for (let r = 0; r < 17; r++) { const w = Math.round(14 * (1 - Math.abs(r - 8) / 8.5)); if (w > 0) { lg.fillStyle = G1; lg.fillRect(ax, 236 + r, w, 1); lg.fillStyle = G_HI; lg.fillRect(ax, 236 + r, 1, 1); } }
    lg.globalAlpha = a; putText(tx, x1 - 18 - tw, 255); lg.globalAlpha = 1;
  }
  function ticker(str, a, t) { // 석차표 줄: '석차표'는 서 있고, 기록은 점 단위로 흐른다
    lg.globalAlpha = a; putText(pxText('석차표', 12, INK), 190, 344);
    if (!SPR.tick || SPR.tickStr !== str) { SPR.tick = pxText(str, 12, INK); SPR.tickStr = str; }
    const s = SPR.tick, sw = s.tw, wx = 244, ww = 212, off = Math.floor(t * 24) % sw;
    if (!SPR.tWin) { // 흐르는 창: 양 끝 12칸은 점 무늬로 지워 끊긴 글자가 덜 보이게
      SPR.tWin = canvasOf(ww, 18); const m = canvasOf(ww, 18), mg = m.getContext('2d'), id = mg.createImageData(ww, 18), d = id.data;
      for (let y = 0; y < 18; y++) for (let x = 0; x < ww; x++) { const e = Math.min(x, ww - 1 - x) / 12; if (e < 1 && e < BAYER[(y & 3) * 4 + (x & 3)]) d[(y * ww + x) * 4 + 3] = 255; }
      mg.putImageData(id, 0, 0); SPR.tFade = m;
    }
    const g = ctx2(SPR.tWin); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, ww, 18);
    for (let x = -off; x < ww; x += sw) g.drawImage(s, x - 2, 344 - 330 - s.base);
    g.globalCompositeOperation = 'destination-out'; g.drawImage(SPR.tFade, 0, 0); g.globalCompositeOperation = 'source-over';
    lg.drawImage(SPR.tWin, wx, 330); lg.globalAlpha = 1;
  }
  function rankPanel(RK, rk) { // 석차표: 화면 오른쪽에 펼쳐진다 (도트 글꼴 12px)
    const a = clamp01((rk - 0.35) / 0.65), btns = []; if (a <= 0) return btns;
    lg.globalAlpha = a; lg.drawImage(SPR.rankTitle, -1, -1);
    const rows = RK.rows, total = RK.total || rows.length, mineI = rows.findIndex(r => r.me), rankOf = i => rows[i].rank || i + 1, per = 10, pages = Math.max(1, Math.ceil(rows.length / per)), page = Math.max(0, Math.min(pages - 1, RK.page || 0));
    const stats = [RK.online ? `응시자 ${total.toLocaleString()}명` : `이 기기의 기록 ${total}개`, mineI >= 0 ? `내 석차 ${rankOf(mineI)}등` : '내 석차 미정'].concat(RK.online && RK.runs > 0 ? [`누적 응시 ${RK.runs.toLocaleString()}회`] : []);
    const T = (s, x, y, col, align, edge) => putText(pxText(s, 12, col, edge === undefined ? DARK : edge), x, y, align);
    T(stats.join(' · '), 621, 62, G1, 'right');
    const x0 = 356, x1 = 622, y0 = 70, y1 = 298;
    lg.globalAlpha = a * 0.78; lg.fillStyle = '#02100a'; lg.fillRect(x0, y0, x1 - x0, y1 - y0); lg.globalAlpha = a; lg.fillStyle = G1;
    for (const [x, y, sx, sy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]) { lg.fillRect(sx > 0 ? x : x - 7, sy > 0 ? y : y - 1, 8, 2); lg.fillRect(sx > 0 ? x : x - 1, sy > 0 ? y : y - 6, 2, 7); }
    const lh = 19, rx = x0 + 12, rw = x1 - x0 - 24, show = Math.floor(a * 13), list = rows.slice(page * per, page * per + per);
    const row = (i, r, y, inv) => { if (inv) { lg.fillStyle = G1; lg.fillRect(rx - 4, y - 14, rw + 8, 18); } const col = inv ? '#06200e' : G1, ed = inv ? null : DARK, nm = [...r.name].slice(0, 8).join('');
      T(`${rankOf(i)}등`, rx, y, col, 'left', ed); T(nm, rx + 44, y, col, 'left', ed); T(fmtRunT(r.t), rx + rw, y, col, 'right', ed); };
    list.forEach((r, i) => { if (i < show) row(page * per + i, r, y0 + 22 + i * lh, false); });
    if (!rows.length && show > 2) { T('아직 기록이 없습니다', (x0 + x1) / 2, (y0 + y1) / 2 - 2, G1, 'center'); T('엔딩을 보면 석차표에 오릅니다', (x0 + x1) / 2, (y0 + y1) / 2 + 18, '#d8f8e0', 'center'); }
    if (mineI >= 0 && show > 11) row(mineI, rows[mineI], y1 - 8, true);
    if (rk >= 1) { const py = y1 + 18; lg.globalAlpha = a * (page > 0 ? 1 : 0.35); T('▲ 위로', x0, py, G1, 'left'); lg.globalAlpha = a * (page < pages - 1 ? 1 : 0.35); T('아래로 ▼', x1, py, G1, 'right'); lg.globalAlpha = a;
      if (rows.length) T(`${page * per + 1}~${Math.min(rows.length, page * per + per)}등 / ${(RK.listed != null ? RK.listed : total).toLocaleString()}명`, (x0 + x1) / 2, py, G1, 'center');
      btns.push({ x: x0 - 10, y: py - 16, w: (x1 - x0) / 3, h: 24, key: 'rank:up' }, { x: x1 - (x1 - x0) / 3 + 10, y: py - 16, w: (x1 - x0) / 3, h: 24, key: 'rank:down' }); }
    lg.globalAlpha = 1;
    return btns;
  }

  // ---- 타이틀 ----
  let T0 = 0, lastNow = -9, firstSeen = -1;
  const ready = () => loaded(plate) && (fontOk() || (firstSeen >= 0 && lastNow - firstSeen > 2.5));
  function lensTitle(k, L, now, hasSave, info) {
    if (Q.get('hud') === '0') return []; // check only: 배경만
    if (plateBad) return OLD_TITLE(k, L, now, hasSave, info);
    const b = k.b, RK = info.rank || { k: 0, rows: [] }, rk = RK.k, btns = [];
    if (now - lastNow > 0.5 || now < lastNow) T0 = now; lastNow = now; if (firstSeen < 0) firstSeen = now;
    const ok = ready(); if (!ok) T0 = now; // 그림과 글꼴이 오기 전에는 켜지는 연출을 시작하지 않는다
    if (ok && !SPR.ok) build();
    lg.globalAlpha = 1; lg.globalCompositeOperation = 'source-over'; lg.fillStyle = '#000000'; lg.fillRect(0, 0, W, H);
    if (ok) {
      const t = FIX_T != null ? FIX_T : now - T0, P = timeline(t);
      lg.drawImage(plate, 0, 0);
      lenses(P, t);
      if (rk > 0) { lg.globalAlpha = Math.round(0.55 * rk * 8) / 8; lg.fillStyle = '#000000'; lg.fillRect(0, 0, W, H); lg.globalAlpha = 1; }
      lg.globalAlpha = Math.round(P.frame * 4) / 4; lg.drawImage(SPR.frame, 0, 0); lg.globalAlpha = 1;
      const ua = 1 - clamp01(rk * 2.4); // 석차표를 열면 제목·버튼·줄은 걷힌다
      if (P.logo > 0 && ua > 0) {
        const e = 1 - Math.pow(1 - P.logo, 3), sc = 1 + 0.24 * (1 - e), cx = 495, cy = 146;
        lg.save(); lg.globalAlpha = Math.round(Math.min(1, P.logo * 1.6) * ua * 4) / 4; lg.translate(cx + P.shake, cy); lg.scale(sc, sc); lg.translate(-cx, -cy);
        lg.drawImage(SPR.deco, 0, 0); lg.drawImage(SPR.words, -1, -1); lg.drawImage(SPR.ai, -4 + (P.logo >= 1 ? P.jit : 0), -1); lg.restore();
      }
      if (ua > 0 && rk <= 0 && P.logo >= 1) {
        if (info.best) putText(pxText(`내 최고 기록 ${info.best}`, 12, CREAM), 621, 218, 'right');
        if (info.ios) { lg.globalAlpha = 0.8; putText(pxText('아이폰은 공유 → "홈 화면에 추가"로 열면 전체 화면', 12, CREAM), 621, 306, 'right'); lg.globalAlpha = 1; }
      }
      if (P.btn > 0 && ua > 0) startButton(hasSave ? '이어서 하기' : '시험 시작', P.btn * ua, t);
      if (P.tick > 0 && ua > 0) {
        const rows = RK.rows || [], str = rows.length ? rows.slice(0, 10).map((r, i) => `${i + 1}등 ${r.name} ${fmtRunT(r.t)}`).join('   ·   ') + '   ·   ' : '아직 기록이 없습니다 · 엔딩을 보면 석차표에 오릅니다   ·   ';
        ticker(str, Math.round(P.tick * ua * 4) / 4, t);
      }
      if (rk > 0) {
        btns.push(...rankPanel(RK, rk));
        if (rk >= 0.5) { lg.globalAlpha = clamp01((rk - 0.5) * 2); putText(pxText('◀ 돌아가기', 12, INK), 320, 344, 'center'); lg.globalAlpha = 1; } // 아래 띠를 다시 누르면 닫힌다
        if (rk >= 1) btns.push({ x: 0, y: 320, w: W, h: H - 320, key: 'rank:close' });
      }
      if (P.black > 0) { lg.globalAlpha = Math.ceil(P.black * 4) / 4; lg.fillStyle = '#000000'; lg.fillRect(0, 0, W, H); lg.globalAlpha = 1; } // 네 단계로 밝아진다
    }
    b.save(); b.imageSmoothingEnabled = false; b.drawImage(LAY, 0, 0, W, H); b.restore(); b.imageSmoothingEnabled = false; b.textAlign = 'left';
    if (rk <= 0) { btns.push({ x: 0, y: 322, w: W, h: H - 322, key: 'rank:open' }); btns.push({ x: 0, y: 0, w: W, h: H, key: 'start' }); }
    return btns;
  }

  // ---- 시험 시작: 왼쪽 렌즈 안으로 들어가며 시험장이 드러난다 (a: 1 → 0, 0.9초) ----
  function lensTitleOut(k, L, now, a) {
    if (!loaded(plate) || !SPR.ok) { if (OLD_OUT) OLD_OUT(k, L, now, a); return; }
    const b = k.b, p = 1 - a, z = 1 + 11 * Math.pow(p, 2.2), fade = 1 - smooth(0.42, 0.9, p), ua = 1 - smooth(0, 0.16, p);
    b.save(); b.imageSmoothingEnabled = false;
    if (fade > 0) { b.save(); b.globalAlpha = Math.ceil(fade * 6) / 6; b.translate(DIVE_C[0], DIVE_C[1]); b.scale(z, z); b.translate(-DIVE_C[0], -DIVE_C[1]); b.drawImage(plate, 0, 0, W, H); b.restore(); }
    if (ua > 0) { lg.globalAlpha = 1; lg.clearRect(0, 0, W, H); lg.drawImage(SPR.frame, 0, 0); lg.drawImage(SPR.deco, 0, 0); lg.drawImage(SPR.words, -1, -1); lg.drawImage(SPR.ai, -4, -1); b.globalAlpha = ua; b.drawImage(LAY, 0, 0, W, H); }
    const fl = Math.max(0, 1 - Math.abs(p - 0.6) / 0.17); if (fl > 0) { b.globalCompositeOperation = 'lighter'; b.globalAlpha = Math.round(0.28 * fl * 8) / 8; b.fillStyle = G1; b.fillRect(0, 0, W, H); }
    b.restore(); b.imageSmoothingEnabled = false;
  }

  // 타이틀이 떠 있는 동안에는 뒤의 3D 시험장을 그리지 않는다 (그림이 화면을 다 덮는다): 버벅임을 줄인다
  if (typeof scenes !== 'undefined' && scenes.title && typeof WORLD !== 'undefined' && WORLD.renderExam) {
    const origDraw = scenes.title.draw;
    scenes.title.draw = function (B) {
      if (plateBad || !loaded(plate) || Q.get('hud') === '0') return origDraw.call(this, B);
      const r = WORLD.renderExam; WORLD.renderExam = function () { };
      try { return origDraw.call(this, B); } finally { WORLD.renderExam = r; }
    };
  }
  window.drawTitle = lensTitle;
  window.drawTitleOut = lensTitleOut;
})();
