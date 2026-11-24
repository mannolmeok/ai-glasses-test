// PROTOTYPE - NOT FOR PRODUCTION
// 타이틀 시안 3번 '렌즈 반사 클로즈업' (테스트판 v3). art.js의 drawTitle · drawTitleOut 을 이 파일의 것으로 바꿔 끼운다.
// 배경: 그림을 움직이는 10초 고리 영상으로 (640x360 점 그림, 64색). 오른쪽 렌즈 속 감독관이 다가와 내려다보다 물러나고, 고개가 조금 움찔한다.
// HUD: 시험 중 '중고 AI 안경'(3단계) HUD와 같은 모양 — 갈무리 글자 + 그림자, 초록 단색, 렌즈 스캔라인, 가끔 밀리는 화면.
//      의심 게이지 · 감독관 레이더 · 감독관 상태 줄이 영상 속 감독관과의 거리를 따라 움직인다. 시작 버튼은 4단계 'AI 분석' 창 모양을 초록으로.
// 제목: 기존 타이틀 글꼴(Black Han Sans) 그대로, 기존 타이틀처럼 빨강·파랑 어긋남 + 짙은 초록 번짐 + 가끔 흔들림, 글자 안에 HUD 스캔라인.
// 영상을 못 틀면(절전 모드 등) 첫 장면에서 멈춘 그림 위로 HUD만 움직인다. 시험 시작을 누르면 왼쪽 렌즈 안으로 들어간다.
'use strict';
(function () {
  if (typeof drawTitle !== 'function') return;
  const OLD_TITLE = drawTitle, OLD_OUT = typeof drawTitleOut === 'function' ? drawTitleOut : null; // 그림을 못 받으면 예전 타이틀로
  const W = 640, H = 360;
  const G1 = '#74ff8e', G_DK = '#0a4018', G_HI = '#c8ffd8', CREAM = '#f4ecd6', RED = '#ff5a5a', AMBER = '#ffcf5a', CALM = '#9dff8a', PANEL = 'rgba(4,22,12,0.62)';
  const BHS = '"Black Han Sans","Do Hyeon","Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",sans-serif'; // 기존 타이틀 글꼴
  const PXF_ = '"Galmuri11","Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",sans-serif';
  const Q = new URLSearchParams(location.search);
  const FIX_T = Q.has('tt') ? Number(Q.get('tt')) : null; // check only: 타이틀 연출의 그 순간에 멈춰 본다 (초)
  const SYNC = FIX_T != null || Q.has('manual'); // check only: 영상을 틀지 않고 그 순간의 장면으로 맞춘다 (화면 저장용)
  const LOOP = 235 / 24, V0 = 1.4; // 고리 영상 길이(초) · 켜지는 연출이 끝나고 영상이 움직이기 시작하는 때

  // ---- 배경: 고리 영상과 그 첫 장면 그림 ----
  const poster = new Image(); let posterBad = false; poster.onerror = () => { posterBad = true; }; poster.src = 'assets/title/lens-loop-poster.png?v=1';
  const vid = document.createElement('video'); let vidBad = false;
  vid.muted = true; vid.defaultMuted = true; vid.loop = true; vid.playsInline = true; vid.preload = 'auto';
  for (const a of ['muted', 'playsinline', 'webkit-playsinline']) vid.setAttribute(a, '');
  vid.style.cssText = 'position:fixed;left:0;top:0;width:2px;height:2px;opacity:0.01;pointer-events:none;z-index:-1';
  vid.addEventListener('error', () => { vidBad = true; });
  vid.src = 'assets/title/lens-loop.mp4?v=1';
  (document.body || document.documentElement).appendChild(vid); // 화면에 붙어 있어야 아이폰에서도 장면이 넘어간다 (2px, 거의 투명)
  window.__lensVid = vid; // check only: 화면 저장 때 장면이 맞춰졌는지 본다
  const loaded = im => im.complete && im.naturalWidth > 0;
  const vidReady = () => !vidBad && vid.readyState >= 2;
  let playReq = false, blocked = false, lastUse = 0;
  for (const ev of ['pointerdown', 'keydown', 'touchstart']) addEventListener(ev, () => { blocked = false; }, true); // 자동 재생이 막혔으면 손이 닿을 때 다시
  function play() {
    lastUse = performance.now();
    if (SYNC || vidBad || blocked || playReq || !vid.paused) return;
    playReq = true; let pr = null; try { pr = vid.play(); } catch (e) { }
    if (pr && pr.then) pr.then(() => { playReq = false; }, () => { playReq = false; blocked = true; }); else playReq = false;
  }
  function seek(v) { if (vidBad || vid.readyState < 1) return; if (Math.abs(vid.currentTime - v) > 0.02 && !vid.seeking) { try { vid.currentTime = v; } catch (e) { } } }
  function rewind() { if (SYNC || vidBad) return; try { vid.pause(); vid.currentTime = 0; } catch (e) { } }
  setInterval(() => { if (!vid.paused && performance.now() - lastUse > 700) vid.pause(); }, 400); // 타이틀을 벗어나면 영상을 멈춘다

  const fontOk = () => !document.fonts || (document.fonts.check(`400 60px ${BHS}`, 'AI 안경으로 살아남기') && document.fonts.check(`12px ${PXF_}`, '석차표 시험 시작'));
  const TT = { S: 0, title: null, rank: null, f: false };
  if (document.fonts) Promise.all([document.fonts.load(`400 60px ${BHS}`, 'AI 안경으로 살아남기 전국 석차표'), document.fonts.load(`700 12px ${PXF_}`, '석차표 시험 시작 이어서 하기 돌아가기 감독관 레이더 의심')]).then(() => { TT.S = 0; }, () => { });

  // ---- 그림 속 자리 (640x360) ----
  const LENS_L = [[73.7, 140.3], [95.7, 131.0], [122.7, 131.0], [195.0, 141.3], [204.3, 145.0], [218.7, 158.3], [215.3, 172.7], [198.0, 220.0], [190.7, 232.7], [179.3, 244.0], [163.0, 247.7], [123.7, 246.7], [87.0, 238.3], [73.3, 224.3], [69.0, 190.3]];
  const DIVE_C = [142, 189]; // 시험 시작 때 들어가는 왼쪽 렌즈 가운데
  // 영상 속 감독관과의 거리 (0.25초마다, 멀리 0 → 바로 앞 1) · 안경이 위아래로 움찔한 칸 수. 영상에서 재어 둔 값
  const PROX = [0, 0, .1, .24, .37, .45, .49, .56, .6, .69, .78, .84, .91, .96, .99, 1, 1, 1, 1, 1, .99, .99, .99, .95, .87, .76, .68, .64, .53, .42, .39, .29, .2, .16, .1, .05, .02, 0, 0, 0];
  const DY = [0, 0, 0, 2, 2, 0, -1, 1, 1, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 3, 4, 4, 3, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const wrap = v => ((v % LOOP) + LOOP) % LOOP;
  const curve = (A, v) => { v = wrap(v); const x = v / 0.25, i = Math.min(A.length - 1, Math.floor(x)), f = Math.min(1, x - i), a = A[i], z = i + 1 < A.length ? A[i + 1] : A[0]; return a + (z - a) * f; };
  const ST_WORD = { back: '등 돌림', come: '다가오는 중', watch: '주시 중', go: '멀어지는 중' }, ST_COL = { back: CALM, come: AMBER, watch: RED, go: AMBER };
  function story(v) { // 영상 시각 → 감독관 상태 (가까움, 다가오는 중인가, 의심도)
    const p = curve(PROX, v), up = curve(PROX, v + 0.3) > p + 0.015, sus = 0.07 + 0.71 * Math.pow(curve(PROX, v - 0.5), 1.15);
    return { p, up, sus, st: p >= 0.85 ? 'watch' : p < 0.12 ? 'back' : up ? 'come' : 'go' };
  }

  const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
  const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  const canvasOf = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
  const ctx2 = c => { const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return g; };
  const path = (g, P) => { g.beginPath(); g.moveTo(P[0][0], P[0][1]); for (let i = 1; i < P.length; i++) g.lineTo(P[i][0], P[i][1]); g.closePath(); };
  function crisp(c, thr = 128) { const g = c.getContext('2d'), id = g.getImageData(0, 0, c.width, c.height), d = id.data; for (let i = 3; i < d.length; i += 4) d[i] = d[i] >= thr ? 255 : 0; g.putImageData(id, 0, 0); return c; }
  const tint = (src, col) => { const c = canvasOf(src.width, src.height), g = ctx2(c); g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, c.width, c.height); return c; };
  function polyMask(P) { const c = canvasOf(W, H), g = ctx2(c); g.fillStyle = '#ffffff'; path(g, P); g.fill(); return crisp(c); }
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);
  function fitInk(g, str, font, box) { // 글자의 실제 잉크 상자를 box에 맞출 배율
    g.font = font; const m = g.measureText(str);
    return { sx: box.w / (m.actualBoundingBoxLeft + m.actualBoundingBoxRight), sy: box.h / (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent), iw: m.actualBoundingBoxLeft + m.actualBoundingBoxRight, ox: m.actualBoundingBoxLeft, oy: m.actualBoundingBoxDescent };
  }
  const FL = [1, 0, 1, 0, 1, 1];
  const fl = (t, t0) => t < t0 ? 0 : t < t0 + 0.24 ? FL[Math.floor((t - t0) / 0.04)] : 1; // HUD가 켜질 때 몇 번 깜빡인다

  // ---- 미리 그려 두는 점 그림 (화면 1칸 = 점 하나) ----
  const SPR = { ok: false };
  function build() {
    SPR.mL = polyMask(LENS_L);
    const dk = tint(SPR.mL, 'rgba(3,10,7,0.96)'), dg = ctx2(dk); dg.globalCompositeOperation = 'source-atop'; dg.fillStyle = 'rgba(200,232,215,0.10)'; // 꺼진 렌즈: 어두운 유리 + 비스듬한 반사 두 줄
    for (const [a, b] of [[60, 74], [92, 98]]) { dg.beginPath(); dg.moveTo(a, 120); dg.lineTo(b, 120); dg.lineTo(b + 130, 260); dg.lineTo(a + 130, 260); dg.closePath(); dg.fill(); }
    SPR.dark = dk;
    const sp = canvasOf(W, H), sg = sp.getContext('2d'), sid = sg.createImageData(W, H), sd = sid.data; // 렌즈가 꺼지면 얼굴의 초록빛도 죽는다
    for (let y = 150; y < 300; y++) for (let x = 70; x < 280; x++) {
      let k = 0; for (const [cx, cy, r, s] of [[230, 224, 40, 0.75], [150, 262, 72, 0.5]]) { const q = Math.hypot(x - cx, y - cy) / r; if (q < 1) k = Math.max(k, s * (1 - q)); }
      if (k > BAYER[(y & 3) * 4 + (x & 3)]) sd[(y * W + x) * 4 + 3] = 150;
    }
    sg.putImageData(sid, 0, 0); SPR.spill = sp;
    const dc = canvasOf(W, H), d2 = ctx2(dc); // 제목 둘레 장식 선 (점선으로 끊어지며 흐려진다)
    const seg = (x0, x1, y, h, a0, a1) => { const n = Math.max(1, Math.round((x1 - x0) / 6)); for (let i = 0; i < n; i++) { d2.globalAlpha = a0 + (a1 - a0) * (i / Math.max(1, n - 1)); d2.fillStyle = G1; d2.fillRect(Math.round(x0 + (x1 - x0) * i / n), y, Math.ceil((x1 - x0) / n), h); } };
    seg(462, 556, 84, 1, 0.95, 0.15); seg(366, 437, 99, 2, 0.1, 1); seg(388, 446, 105, 1, 0.1, 0.9); seg(360, 431, 112, 2, 0.1, 1);
    seg(428, 579, 205, 1, 0.1, 1); d2.globalAlpha = 1; d2.fillStyle = G1; d2.fillRect(579, 204, 2, 1); d2.fillRect(581, 203, 2, 1);
    for (let i = 0; i < 5; i++) for (let r = 0; r < 5; r++) d2.fillRect(585 + i * 5 + ((4 - r) * 0.6 | 0), 203 + r, 3, 1);
    d2.globalAlpha = 0.85; d2.fillRect(618, 206, 8, 1);
    const [x, y, w, h] = DECO; SPR.deco = canvasOf(w, h); ctx2(SPR.deco).drawImage(dc, x, y, w, h, 0, 0, w, h); // 그린 자리만 잘라 둔다 (매 장면 작은 그림 하나만 놓게)
    SPR.scanTmp = canvasOf(W, H); SPR.ok = true;
  }
  const DECO = [356, 82, 274, 130];
  const deco = (b, a) => { const [x, y, w, h] = DECO; b.globalAlpha = a; b.drawImage(SPR.deco, x, y, w, h); };

  // ---- 제목: 기존 타이틀 글꼴을 화면 해상도로 한 번 그려 둔다 ----
  const TBOX = { x: 344, y: 72, w: 292, h: 130 }, RBOX = { x: 460, y: 12, w: 176, h: 42 };
  function hudWords(S, A, words) { // 빨강·파랑 어긋남 + 짙은 초록 번짐(기존 타이틀 그대로) + 글자 안쪽 HUD 스캔라인 (렌즈 스캔라인과 같은 줄)
    const c = canvasOf(A.w * S, A.h * S), g = c.getContext('2d'), m = canvasOf(A.w * S, A.h * S), mg = m.getContext('2d'), font = `400 100px ${BHS}`;
    const put = (ctx, str, box, right, col, dx, glow) => {
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); const f = fitInk(ctx, str, font, box), sx = right ? f.sy : f.sx, x0 = right ? box.x + box.w - f.iw * sx : box.x;
      ctx.setTransform(S, 0, 0, S, -A.x * S, -A.y * S); ctx.translate(x0 + dx, box.y + box.h); ctx.scale(sx, f.sy);
      ctx.font = font; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = col; if (glow) { ctx.shadowColor = glow; ctx.shadowBlur = 4 * S; }
      ctx.fillText(str, f.ox, -f.oy); ctx.restore();
    };
    for (const [str, box, right] of words) { put(g, str, box, right, 'rgba(255,60,60,0.45)', 2.5); put(g, str, box, right, 'rgba(60,160,255,0.4)', -2); }
    for (const [str, box, right, col] of words) put(mg, str, box, right, col, 0, G_DK);
    mg.globalCompositeOperation = 'source-atop'; mg.fillStyle = 'rgba(0,0,0,0.22)';
    for (let y = ((1 - A.y) % 3 + 3) % 3; y < A.h; y += 3) mg.fillRect(0, y * S, A.w * S, S);
    mg.globalCompositeOperation = 'source-over'; g.drawImage(m, 0, 0); return c;
  }
  function titleArt(S) {
    const f = fontOk();
    if (TT.S !== S || TT.f !== f || !TT.title) {
      TT.S = S; TT.f = f;
      TT.title = hudWords(S, TBOX, [['AI', { x: 404, y: 80, w: 85, h: 56 }, true, G1], ['안경으로', { x: 493, y: 92, w: 129, h: 38 }, false, CREAM], ['살아남기', { x: 418, y: 138, w: 209, h: 56 }, false, CREAM]]);
      TT.rank = hudWords(S, RBOX, [['전국 석차표', { x: 470, y: 18, w: 151, h: 30 }, false, CREAM]]);
    }
    return TT;
  }
  const hash = n => { const s = Math.sin(n * 12.9898) * 43758.5453; return s - Math.floor(s); };
  function art(k, c, A, a, jit, tm) { // 미리 그린 글자를 1:1로 놓는다. 가끔 한 줄 띠가 옆으로 밀린다 (3단계 HUD의 화면 밀림처럼)
    const b = k.b, S = TT.S, slot = Math.floor(tm * 9), on = hash(slot * 3.1) < 0.06;
    b.globalAlpha = a;
    if (!on) { b.drawImage(c, A.x + jit, A.y, A.w, A.h); return; }
    const gy = Math.floor(hash(slot * 7.7) * (A.h - 12)) + 2, gh = 3 + Math.floor(hash(slot * 1.3) * 7), sh = (hash(slot * 5.9) < 0.5 ? -1 : 1) * (3 + Math.floor(hash(slot * 2.2) * 4));
    for (const [y0, y1, dx] of [[0, gy, 0], [gy, gy + gh, sh], [gy + gh, A.h, 0]]) if (y1 > y0) b.drawImage(c, 0, y0 * S, A.w * S, (y1 - y0) * S, A.x + jit + dx, A.y + y0, A.w, y1 - y0);
  }

  // ---- 켜질 때 (0~2.7초): 검은 화면 → 그림이 밝아짐 → 왼쪽 렌즈가 스캔 줄과 함께 켜짐 → HUD가 깜빡이며 켜짐 → 제목이 찍히고 흔들림 → 버튼 → 석차표 줄 ----
  function timeline(t) {
    const P = {};
    P.black = 1 - smooth(0.2, 0.85, t);
    P.power = clamp01((t - 0.95) / 0.45);
    P.logo = clamp01((t - 1.35) / 0.26);
    P.shake = t > 1.61 && t < 1.86 ? Math.round(Math.sin(t * 97) * 2 * (1 - (t - 1.61) / 0.25)) : 0;
    P.btn = t < 1.95 ? 0 : t < 2.35 ? (Math.floor((t - 1.95) * 20) % 2 ? 0.2 : 1) : 1;
    P.tick = smooth(2.25, 2.7, t);
    P.jit = (t * 0.29) % 1 < 0.035 ? Math.round(Math.sin(t * 90) * 3) : 0; // 기존 타이틀처럼 가끔 옆으로 흔들림
    return P;
  }

  // ---- 그리기: 배경·렌즈·스캔라인은 640x360 한 장(LAY)에 점으로 그리고 한 번에 키운다. 글자와 HUD는 화면 해상도로 그 위에 ----
  const LAY = canvasOf(W, H), lg = ctx2(LAY);
  function scanLine(y) { // 왼쪽 렌즈 안에만 보이는 스캔 줄
    y = Math.round(y); const g2 = ctx2(SPR.scanTmp);
    g2.globalCompositeOperation = 'source-over'; g2.clearRect(0, 0, W, H);
    g2.globalAlpha = 0.95; g2.fillStyle = G_HI; g2.fillRect(60, y, 170, 1); g2.fillStyle = G1;
    for (let i = 1; i <= 3; i++) { g2.globalAlpha = 0.55 - i * 0.14; g2.fillRect(60, y - i, 170, 1); } g2.globalAlpha = 1;
    g2.globalCompositeOperation = 'destination-in'; g2.drawImage(SPR.mL, 0, 0); g2.globalCompositeOperation = 'source-over';
    lg.drawImage(SPR.scanTmp, 0, 0);
  }
  const VC = canvasOf(W, H), vg = ctx2(VC), RVFC = 'requestVideoFrameCallback' in vid; let vcSrc = null, vcDirty = true;
  if (RVFC) { const cb = () => { vcDirty = true; vid.requestVideoFrameCallback(cb); }; vid.requestVideoFrameCallback(cb); }
  function frameNow() { // 영상의 새 장면이 왔을 때만 점 그림 한 장으로 옮겨 둔다 (초당 24장)
    const src = vidReady() ? vid : poster;
    if (src !== vcSrc || vcDirty || SYNC || !RVFC) { vg.drawImage(src, 0, 0, W, H); vcSrc = src; vcDirty = false; }
    return VC;
  }
  function plate(k, P, v, rk, lines) { // 배경 한 장: 영상(또는 첫 장면) → 석차표면 어둡게 → 렌즈 켜짐/움찔 → 렌즈 스캔라인(3단계 HUD와 같은 초록 줄)
    lg.globalCompositeOperation = 'source-over'; lg.globalAlpha = 1;
    lg.drawImage(frameNow(), 0, 0);
    if (rk > 0) { lg.globalAlpha = Math.round(0.55 * rk * 8) / 8; lg.fillStyle = '#000000'; lg.fillRect(0, 0, W, H); lg.globalAlpha = 1; }
    if (P) {
      if (P.power < 1) { const y = Math.round(128 + 124 * P.power); if (y < H) lg.drawImage(SPR.dark, 0, y, W, H - y, 0, y, W, H - y); if (P.power > 0) scanLine(y); } // 켜지는 중: 스캔 줄 아래는 아직 꺼진 유리
      else if (v >= 3.3 && v < 3.62 && Math.floor((v - 3.3) / 0.04) % 2 === 0) { lg.drawImage(SPR.dark, 0, 0); lg.drawImage(SPR.spill, 0, 0); } // 감독관이 내려다보는 순간 렌즈가 움찔 꺼졌다 켜진다
    }
    if (lines) { lg.globalAlpha = 0.08; lg.fillStyle = G1; for (let y = 1; y < H; y += 3) lg.fillRect(0, y, W, 1); lg.globalAlpha = 1; }
    const b = k.b; b.save(); b.imageSmoothingEnabled = false; b.globalAlpha = 1; b.drawImage(LAY, 0, 0, W, H); b.restore();
  }
  function hud(k, t, tm, s, a, clock) { // 3단계 '중고 AI 안경' HUD 그대로: 왼쪽 위 상태, 위 가운데 의심, 오른쪽 위 시계, 왼쪽 아래 감독관 레이더(4단계 모양)
    const b = k.b, M = k.M, R = k.R, sp = Math.round(s.sus * 100), stc = ST_COL[s.st];
    let al = a * fl(t, 1.05);
    if (al > 0) {
      const LX = 40; // 왼쪽 위 소리 버튼 자리만큼 비켜 둔다
      b.globalAlpha = al; M('LENS-OS 0.9b', LX, 24, 9, G1, 'left', 700); M('BAT ▮▮▮ 82%', LX, 37, 9, G1, 'left', 700);
      const n = Math.max(0, Math.min(3, Math.floor((t - 1.15) / 0.12) + 1)); // 부팅 줄이 한 줄씩 찍힌다
      if (n > 0) M('초점 ......... 고정', LX, 55, 7.5, G1, 'left', 700);
      if (n > 1) M('정답 ......... 2번 79%', LX, 66, 7.5, G1, 'left', 700);
      if (n > 2) { const w = M('감독관 ....... ', LX, 77, 7.5, G1, 'left', 700); if (!(s.st === 'watch' && Math.floor(tm * 4) % 2)) M(ST_WORD[s.st], LX + w, 77, 7.5, stc, 'left', 700); }
    }
    al = a * fl(t, 1.2);
    if (al > 0) { // 의심 칸 8개: 60%를 넘은 칸은 빨강, 오르는 중이면 '의심' 글자도 빨강. 켜질 때는 칸이 한 번 다 차 본다
      const N = 8, bx = W / 2 - 44, y0 = 24, test = t < 1.62, on = test ? Math.round(N * clamp01((t - 1.2) / 0.3)) : Math.round(s.sus * N);
      b.globalAlpha = al; M('의심', bx - 8, y0, 9, !test && s.up && s.p > 0.1 ? RED : G1, 'right', 700);
      for (let i = 0; i < N; i++) { b.globalAlpha = al * (i < on ? 1 : 0.3); R(bx + i * 9, y0 - 5, 6, 10, !test && i < on && sp >= 60 ? RED : G1); }
      b.globalAlpha = al; M(`${test ? 0 : sp}%`, bx + N * 9 + 4, y0, 9, G1, 'left', 700);
    }
    al = a * fl(t, 1.28);
    if (al > 0) { b.globalAlpha = al; M(clock, W - 26, 26, 18, G1, 'right', 700); M('1교시 · 시험 대기', W - 26, 42, 8, G1, 'right', 700); }
    al = a * fl(t, 1.36);
    if (al > 0) { // 감독관 레이더: 영상 속 감독관이 다가오면 점이 나(▲) 쪽으로 내려온다
      const cx = 58, cy = 262, r = 28, an = tm * 2.2;
      b.save(); b.globalAlpha = al; b.fillStyle = PANEL; b.beginPath(); b.arc(cx, cy, r, 0, 7); b.fill(); b.strokeStyle = G1; b.lineWidth = 1; b.stroke();
      b.globalAlpha = al * 0.4; b.beginPath(); b.arc(cx, cy, 15, 0, 7); b.stroke();
      b.beginPath(); b.moveTo(cx, cy); b.arc(cx, cy, r, an - 0.5, an); b.closePath(); b.fillStyle = G1; b.globalAlpha = al * 0.18; b.fill(); b.restore();
      b.globalAlpha = al; k.poly([[cx, cy + 6], [cx - 4, cy + 13], [cx + 4, cy + 13]], '#ffffff');
      const x = cx + 7 - 4 * s.p, y = cy - r + 6 + (r - 10) * s.p;
      k.disc(x, y, 3, stc); if (s.st === 'watch' && Math.floor(tm * 4) % 2 === 0) k.ring(x, y, 5, stc);
      k.T('감독관 레이더', cx, cy + r + 9, 7, '#ffffff', 'center', 500);
    }
    b.globalAlpha = 1;
  }
  function startPanel(k, label, a, tm) { // 시작 버튼: 4단계 'AI 분석' 창 모양 (얇은 테두리, 어두운 바탕, 왼쪽 굵은 줄) 을 초록으로
    const b = k.b, px = 452, py = 226, pw = 169, ph = 40, on = Math.floor(tm * 2) % 2 === 0;
    b.save(); b.globalAlpha = a; b.fillStyle = on ? 'rgba(10,44,22,0.72)' : PANEL; b.fillRect(px, py, pw, ph); b.strokeStyle = G1; b.lineWidth = 1; b.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1); b.fillStyle = G1; b.fillRect(px, py, 2, ph); b.restore();
    b.globalAlpha = a; k.T('응시 준비', px + 9, py + 9, 7.5, G1, 'left', 700); k.T('ENTER', px + pw - 7, py + 9, 6.5, '#cfe9d8', 'right', 500);
    k.T(`▶ ${label}`, px + 9, py + 24, 13, '#ffffff', 'left', 700); if (on) k.T('READY', px + pw - 7, py + 24, 9, G1, 'right', 700);
    b.globalAlpha = a * 0.3; k.R(px + 9, py + 33, pw - 18, 2, '#ffffff'); b.globalAlpha = a; k.R(px + 9, py + 33, pw - 18, 2, G1);
    const span = pw - 18, hx = ((tm * 70) % (span + 24)) - 24, x0 = Math.max(0, hx), x1 = Math.min(span, hx + 24); if (x1 > x0) k.R(px + 9 + x0, py + 33, x1 - x0, 2, G_HI); // 다 찬 막대 위로 밝은 마디가 흐른다
    b.globalAlpha = 1;
  }
  const NB = { x: 452, y: 272, w: 169, h: 20 }; // 새로 하기 버튼 (저장이 있을 때만, 시작 창 바로 아래)
  let NB_ON = false; // 이번 장면에 '새로 하기' 버튼이 떠 있는가 (누른 자리 판정용)
  function newButton(k, arm, a, tm) { // 테두리만 있는 작은 HUD 버튼. 한 번 누르면 3초 동안 빨갛게 '한 번 더'를 기다린다
    const b = k.b, { x, y, w, h } = NB, on = arm > 0, blink = on && Math.floor(tm * 4) % 2 === 0;
    b.save(); b.globalAlpha = a; b.fillStyle = on ? 'rgba(60,8,10,0.78)' : 'rgba(4,22,12,0.45)'; b.fillRect(x, y, w, h);
    b.globalAlpha = a * (on ? (blink ? 1 : 0.6) : 0.7); b.strokeStyle = on ? RED : G1; b.lineWidth = 1; b.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); b.restore();
    b.globalAlpha = a;
    if (on) { k.T(`한 번 더 누르면 처음부터 · ${Math.ceil(arm)}`, x + 9, y + h / 2, 8.5, '#ffd6da', 'left', 700); k.M('저장만 지워요 · 석차표 기록은 남아요', x + w, y + h + 9, 7, CREAM, 'right', 500); }
    else { k.T('↺ 새로 하기', x + 9, y + h / 2, 8.5, G1, 'left', 700); k.T('N', x + w - 7, y + h / 2, 6.5, '#cfe9d8', 'right', 500); }
    b.globalAlpha = 1;
  }
  const TWID = new Map();
  function ticker(k, str, a, tm) { // 화면 맨 아래 흐르는 석차 줄 (기존 타이틀과 같은 모양): 누르면 석차표가 열린다
    const b = k.b, ty = 323, tl = 24, tr = W - 24, lab = '석차표', lw = k.TW(lab, 9, 700) + 12;
    b.globalAlpha = a * 0.4; k.R(tl, ty, tr - tl, 1, G1); b.globalAlpha = a;
    k.R(tl, ty + 4, lw, 15, G1); k.T(lab, tl + lw / 2, ty + 11.5, 9, '#06200e', 'center', 700);
    const key = str + '|' + (k.S || HUD_SCALE); let sw = TWID.get(key);
    if (sw == null) { sw = Math.max(40, k.M(str, -5000, -5000, 9, G1, 'left', 700)); if (TWID.size > 20) TWID.clear(); TWID.set(key, sw); } // 한 바퀴 길이는 한 번만 잰다
    const x0 = tl + lw + 8, off = (tm * 26) % sw;
    b.save(); b.beginPath(); b.rect(x0, ty + 2, tr - x0, 20); b.clip(); for (let x = x0 - off; x < tr; x += sw) k.M(str, x, ty + 11.5, 9, G1, 'left', 700); b.restore();
    b.globalAlpha = 1;
  }
  function rankPanel(k, RK, rk) { // 석차표: 화면 오른쪽 HUD 창 (4단계 'AI 분석' 창과 같은 모양)
    const a = clamp01((rk - 0.35) / 0.65), btns = []; if (a <= 0) return btns;
    const b = k.b, M = k.M, R = k.R;
    art(k, TT.rank, RBOX, a, 0, 0);
    const rows = RK.rows, total = RK.total || rows.length, mineI = rows.findIndex(r => r.me), rankOf = i => rows[i].rank || i + 1, per = 10, pages = Math.max(1, Math.ceil(rows.length / per)), page = Math.max(0, Math.min(pages - 1, RK.page || 0));
    const stats = RK.old ? [`시즌 1 · 보관된 기록 ${total.toLocaleString()}개`] : [RK.online ? `응시자 ${total.toLocaleString()}명` : `이 기기의 기록 ${total}개`, mineI >= 0 ? `내 석차 ${rankOf(mineI)}등` : '내 석차 미정'].concat(RK.online && RK.runs > 0 ? [`누적 응시 ${RK.runs.toLocaleString()}회`] : []);
    b.globalAlpha = a; M(stats.join(' · '), 621, 60, 8, G1, 'right', 700);
    const x0 = 356, x1 = 622, y0 = 70, y1 = 298;
    b.save(); b.globalAlpha = a; b.fillStyle = 'rgba(4,22,12,0.78)'; b.fillRect(x0, y0, x1 - x0, y1 - y0); b.strokeStyle = G1; b.lineWidth = 1; b.strokeRect(x0 + 0.5, y0 + 0.5, x1 - x0 - 1, y1 - y0 - 1); b.fillStyle = G1; b.fillRect(x0, y0, 2, y1 - y0); b.restore();
    b.globalAlpha = a; k.T(RK.old ? '지난 시즌 석차' : '전국 석차', x0 + 10, y0 + 9, 7.5, RK.old ? CREAM : G1, 'left', 700);
    if (RK.canOld) { k.T(RK.old ? '◂ 이번 시즌' : '지난 시즌 ▸', x1 - 8, y0 + 9, 7, '#cfe9d8', 'right', 700); if (rk >= 1) btns.push({ x: x1 - 84, y: y0 - 4, w: 88, h: 24, key: 'rank:season' }); } // 석차표 시즌 전환 (게임 본체가 rank:season 을 받는다)
    else k.T(RK.online ? 'ONLINE' : 'LOCAL', x1 - 8, y0 + 9, 6.5, '#cfe9d8', 'right', 500);
    const lh = 18, rx = x0 + 12, rw = x1 - x0 - 24, show = Math.floor(a * 13), list = rows.slice(page * per, page * per + per);
    const row = (i, r, y, inv) => { const nm = [...r.name].slice(0, 8).join('');
      if (inv) { R(rx - 4, y - 8, rw + 8, 16, G1); k.T(`${rankOf(i)}등`, rx, y, 9, '#06200e', 'left', 700); k.T(nm, rx + 44, y, 9, '#06200e', 'left', 700); k.T(fmtRunT(r.t), rx + rw, y, 9, '#06200e', 'right', 700); return; }
      M(`${rankOf(i)}등`, rx, y, 9, G1, 'left', 700); M(nm, rx + 44, y, 9, i === mineI ? '#ffffff' : G1, 'left', 700); M(fmtRunT(r.t), rx + rw, y, 9, G1, 'right', 700); };
    list.forEach((r, i) => { if (i < show) row(page * per + i, r, y0 + 26 + i * lh, false); });
    if (!rows.length && show > 2 && RK.old) M(RK.wait ? '불러오는 중…' : '보관된 기록이 없습니다', (x0 + x1) / 2, (y0 + y1) / 2, 9, G1, 'center', 700);
    else if (!rows.length && show > 2) { M('아직 기록이 없습니다', (x0 + x1) / 2, (y0 + y1) / 2 - 8, 9, G1, 'center', 700); M('엔딩을 보면 석차표에 오릅니다', (x0 + x1) / 2, (y0 + y1) / 2 + 10, 8, CREAM, 'center', 700); }
    if (mineI >= 0 && show > 11) { if (mineI >= page * per + per) { b.globalAlpha = a * 0.5; M('⋮', rx + 6, y1 - 30, 8, G1, 'left', 700); b.globalAlpha = a; } row(mineI, rows[mineI], y1 - 17, true); }
    if (rk >= 1) { const py = y1 + 13; b.globalAlpha = a * (page > 0 ? 1 : 0.35); M('▲ 위로', x0, py, 9, G1, 'left', 700); b.globalAlpha = a * (page < pages - 1 ? 1 : 0.35); M('아래로 ▼', x1, py, 9, G1, 'right', 700); b.globalAlpha = a;
      if (rows.length) M(`${page * per + 1}~${Math.min(rows.length, page * per + per)}등 / ${(RK.listed != null ? RK.listed : total).toLocaleString()}명`, (x0 + x1) / 2, py, 8, G1, 'center', 700);
      btns.push({ x: x0 - 10, y: py - 12, w: (x1 - x0) / 3, h: 24, key: 'rank:up' }, { x: x1 - (x1 - x0) / 3 + 10, y: py - 12, w: (x1 - x0) / 3, h: 24, key: 'rank:down' }); }
    b.globalAlpha = 1;
    return btns;
  }
  function shift(k, tm) { // 3단계 HUD처럼 가끔 화면이 밀린다 (맨 위에)
    const b = k.b, gl = (tm * 0.37) % 1; if (gl < 0.045) { b.globalAlpha = 0.35; k.R(0, 80 + Math.floor(((tm * 7.3) % 1) * 200), W, 5, G1); k.R(0, 150 + Math.floor(((tm * 3.1) % 1) * 150), W, 2, G1); b.globalAlpha = 1; }
  }
  const pad2 = n => String(n).padStart(2, '0');
  const clockStr = () => { if (SYNC) return '08:40'; const d = new Date(); return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; };

  // ---- 타이틀 ----
  let T0 = 0, lastNow = -9, firstSeen = -1, curV = 0;
  const ready = () => loaded(poster) && (fontOk() || (firstSeen >= 0 && lastNow - firstSeen > 2.5));
  function lensTitle(k, L, now, hasSave, info) {
    if (posterBad) return OLD_TITLE(k, L, now, hasSave, Object.assign({}, info, { best: null })); // 테스트판 타이틀에는 '내 최고 기록' 줄을 띄우지 않는다
    const b = k.b, S = k.S || HUD_SCALE, RK = info.rank || { k: 0, rows: [] }, rk = RK.k, btns = [];
    if (now - lastNow > 0.5 || now < lastNow) { T0 = now; rewind(); } lastNow = now; if (firstSeen < 0) firstSeen = now;
    const ok = ready(); if (!ok) T0 = now; // 그림과 글꼴이 오기 전에는 켜지는 연출을 시작하지 않는다
    if (ok && !SPR.ok) build();
    if (!ok) { b.save(); b.globalAlpha = 1; b.fillStyle = '#000000'; b.fillRect(0, 0, W, H); b.restore(); }
    else {
      const t = FIX_T != null ? FIX_T : now - T0, tm = FIX_T != null ? FIX_T : now, P = timeline(t);
      let v = t < V0 ? 0 : wrap(t - V0);
      if (SYNC) seek(v); else if (t >= V0) { play(); if (vidReady() && !vid.paused) v = vid.currentTime; }
      curV = v;
      const bare = Q.get('hud') === '0'; // check only: 배경만
      plate(k, bare ? null : P, v, bare ? 0 : rk, !bare);
      if (bare) return [];
      const s = story(v), A = titleArt(S);
      hud(k, t, tm, s, 1 - 0.35 * rk, clockStr());
      const ua = 1 - clamp01(rk * 2.4); // 석차표를 열면 제목·버튼·줄은 걷힌다
      if (P.logo > 0 && ua > 0) {
        const e = 1 - Math.pow(1 - P.logo, 3), sc = 1 + 0.24 * (1 - e), al = Math.round(Math.min(1, P.logo * 1.6) * ua * 4) / 4;
        b.save(); if (sc !== 1 || P.shake) { b.translate(495 + P.shake, 146); b.scale(sc, sc); b.translate(-495, -146); }
        deco(b, al); art(k, A.title, TBOX, al, P.logo >= 1 ? P.jit : 0, tm); b.restore();
      }
      if (ua > 0 && rk <= 0 && P.logo >= 1) {
        if (info.ios) { b.globalAlpha = 0.85 * ua; k.M('아이폰은 공유 → "홈 화면에 추가"로 열면 전체 화면', 621, hasSave ? 312 : 282, 7.5, CREAM, 'right', 500); }
        b.globalAlpha = 1;
      }
      if (P.btn > 0 && ua > 0) startPanel(k, hasSave ? '이어서 하기' : '시험 시작', P.btn * ua, tm);
      NB_ON = hasSave && P.btn > 0 && ua > 0 && rk <= 0;
      if (NB_ON) { newButton(k, STATE.newArm || 0, P.btn * ua, tm); btns.push({ x: NB.x - 4, y: NB.y - 4, w: NB.w + 8, h: NB.h + 8, key: 'new' }); } // 저장이 있으면 '새로 하기'도 (시작·이어서 하기도 버튼을 눌러야 한다)
      if (P.tick > 0 && ua > 0) {
        const rows = RK.rows || [], str = rows.length ? rows.slice(0, 10).map((r, i) => `${i + 1}등 ${r.name} ${fmtRunT(r.t)}`).join('   ·   ') + '   ·   ' : '아직 기록이 없습니다 · 엔딩을 보면 석차표에 오릅니다   ·   ';
        ticker(k, str, Math.round(P.tick * ua * 4) / 4, tm);
      }
      if (rk > 0) {
        btns.push(...rankPanel(k, RK, rk));
        if (rk >= 0.5) { b.globalAlpha = clamp01((rk - 0.5) * 2); k.M('◀ 돌아가기', W / 2, 334.5, 9, '#ffffff', 'center', 700); b.globalAlpha = 1; } // 아래 띠를 다시 누르면 닫힌다
        if (rk >= 1) btns.push({ x: 0, y: 320, w: W, h: H - 320, key: 'rank:close' });
      }
      shift(k, tm);
      if (P.black > 0) { b.globalAlpha = Math.ceil(P.black * 4) / 4; b.fillStyle = '#000000'; b.fillRect(0, 0, W, H); b.globalAlpha = 1; } // 네 단계로 밝아진다
    }
    b.globalAlpha = 1; b.textAlign = 'left';
    if (rk <= 0) { btns.push({ x: 0, y: 322, w: W, h: H - 322, key: 'rank:open' }); btns.push({ x: 446, y: 220, w: 181, h: 50, key: 'start' }); } // 시작은 버튼을 눌러야 (빈 곳을 누르면 소리만 켜진다)
    return btns;
  }

  // ---- 시험 시작: 왼쪽 렌즈 안으로 들어가며 시험장이 드러난다 (a: 1 → 0, 0.9초) ----
  function lensTitleOut(k, L, now, a) {
    if (!loaded(poster) || !SPR.ok) { if (OLD_OUT) OLD_OUT(k, L, now, a); return; }
    const b = k.b, p = 1 - a, z = 1 + 11 * Math.pow(p, 2.2), fade = 1 - smooth(0.42, 0.9, p), ua = 1 - smooth(0, 0.16, p);
    if (!SYNC && a > 0.03) play(); else if (!SYNC && !vid.paused) vid.pause();
    const v = !SYNC && vidReady() && !vid.paused ? vid.currentTime : curV, cx = DIVE_C[0], cy = DIVE_C[1] + curve(DY, v);
    b.save(); b.imageSmoothingEnabled = false;
    if (fade > 0) { b.globalAlpha = Math.ceil(fade * 6) / 6; b.translate(cx, cy); b.scale(z, z); b.translate(-cx, -cy); b.drawImage(vidReady() ? vid : poster, 0, 0, W, H); }
    b.restore();
    if (ua > 0 && TT.title) { b.save(); deco(b, ua); art(k, TT.title, TBOX, ua, 0, now); b.restore(); }
    const f = Math.max(0, 1 - Math.abs(p - 0.6) / 0.17); if (f > 0) { b.save(); b.globalCompositeOperation = 'lighter'; b.globalAlpha = Math.round(0.28 * f * 8) / 8; b.fillStyle = G1; b.fillRect(0, 0, W, H); b.restore(); }
    b.globalAlpha = 1;
  }

  // 타이틀이 떠 있는 동안에는 뒤의 3D 시험장을 그리지 않는다 (그림이 화면을 다 덮는다): 버벅임을 줄인다
  if (typeof scenes !== 'undefined' && scenes.title && typeof WORLD !== 'undefined' && WORLD.renderExam) {
    const origDraw = scenes.title.draw;
    scenes.title.draw = function (B) {
      if (posterBad || !loaded(poster) || Q.get('hud') === '0') return origDraw.call(this, B);
      const r = WORLD.renderExam; WORLD.renderExam = function () { };
      try { return origDraw.call(this, B); } finally { WORLD.renderExam = r; }
    };
  }
  // 타이틀 배경음 (파일 없이 소리를 만들어 낸다): 시험 직전의 조용한 긴장. 낮은 음 위에 단조 화음이 한 음씩, 벽시계 초침.
  // 영상 속 감독관이 다가오면 빨라지고 심장 소리가 붙고, 지켜볼 때는 불안한 음이 얹힌다. 물러나면 다시 잦아든다. 브라우저 규칙상 화면을 한 번 누른 뒤부터 난다
  const BG = { t: 0, i: 0 }, BG_CH = [[110, 220, 261.6, 329.6], [110, 220, 261.6, 329.6], [87.3, 174.6, 220, 261.6], [98, 196, 246.9, 293.7]];
  function titleBgm(dt) {
    if (typeof audio === 'undefined' || !audio || muted || audio.ac.state !== 'running' || (CONFIG.sound && CONFIG.sound.music === false) || (STATE.rank && STATE.rank.open)) return;
    const s = story(curV), step = 60 / (74 + 30 * s.p) / 2;
    BG.t += dt; if (BG.t < step) return; BG.t = Math.min(BG.t - step, step);
    const i = BG.i++ % 32, ch = BG_CH[i >> 3], k = i % 8, near = s.p > 0.5;
    if (k === 0) { toneAt(ch[0], step * 7, 'sine', 0.085); toneAt(ch[0] * 2, step * 6, 'triangle', 0.02); }
    toneAt(ch[[1, 2, 3, 2, 1, 3, 2, 3][k]] * (near && k % 4 === 3 ? 2 : 1), step * 1.9, 'triangle', 0.034 + 0.014 * s.p);
    if (k % 2 === 0) toneAt(k % 4 === 0 ? 2400 : 1900, 0.012, 'square', 0.009); // 초침
    if (near && (k === 0 || k === 4)) { toneAt(82.4, 0.11, 'sine', 0.11 * s.p); toneAt(82.4, 0.1, 'sine', 0.08 * s.p, 0.17); } // 심장
    if (s.st === 'watch' && k === 4) toneAt(466.2, step * 3, 'square', 0.011);
  }
  // 시작 소리: 눌렀다는 '딸깍' 세 음 + 안경 HUD가 꺼지며 시험장으로 넘어가는 낮은 '치익'
  const startSnd = () => { try { toneAt(660, 0.05, 'square', 0.07); toneAt(990, 0.06, 'square', 0.07, 0.05); toneAt(1320, 0.12, 'triangle', 0.06, 0.1); noiseAt(0.28, 0.03, 0.12, 700, 0.7); } catch (_) { } };
  // ---- 새로 하기: 게임 본체는 그대로 두고 여기서 받는다. 두 번 눌러야 저장을 지우고(지우기 전 한 벌은 남김) 바로 튜토리얼로. 석차표 기록은 남는다 ----
  addEventListener('pointerdown', e => {
    if (typeof scene === 'undefined' || scene !== 'title' || !NB_ON || e.target !== canvas) return;
    const [x, y] = toBuf(e); if (x < NB.x - 4 || x > NB.x + NB.w + 4 || y < NB.y - 4 || y > NB.y + NB.h + 4) return;
    e.stopImmediatePropagation(); e.preventDefault(); startAudio(); STATE.newTap = true; // 이 손가락은 '이어서 하기'로 넘기지 않는다
  }, true);
  if (typeof scenes !== 'undefined' && scenes.title) {
    const tUpd = scenes.title.update;
    scenes.title.update = function (dt) {
      STATE.newArm = Math.max(0, (STATE.newArm || 0) - dt);
      const RK = STATE.rank, busy = RK && (RK.open || RK.k > 0), tap = STATE.newTap; STATE.newTap = false;
      if (G.stats.exams > 0 && !busy && (tap || pressed('KeyN'))) {
        takeTaps(); takeReleases();
        if (STATE.newArm > 0) { STATE.newArm = 0; backupSave(); wipe(); titleExam(); sfx.buy(); const T0 = STATE.titleE; STATE.titleE = null; leaveTitle(T0); }
        else { STATE.newArm = 3; sfx.no(); }
        return;
      }
      if (STATE.newArm > 0 && pressed('Escape')) { STATE.newArm = 0; return; }
      if (typeof window.__music === 'function') window.__music(() => titleBgm(dt)); else titleBgm(dt); // 배경음으로 친다 (효과음만 껐을 때도 난다)
      const was = scene, r = tUpd.call(this, dt);
      if (was === 'title' && scene !== 'title') startSnd(); // 시험 시작 · 이어서 하기를 누른 소리
      return r;
    };
  }
  window.drawTitle = lensTitle;
  window.drawTitleOut = lensTitleOut;
})();
