// PROTOTYPE - NOT FOR PRODUCTION
// Question: 감독관 눈치를 보며 AI 안경으로 스캔하는 긴장감이, 장비와 시험이 함께 커지는 성장과 맞물려 엔딩까지 재밌나?
// Date: 2026-11-17
// 2D 층: 도트 도구(사각형만 씀), 안경테, 장비 아이콘·대리 응시 봇(패널용), 결과·타이틀·엔딩 화면.
// 세상은 world3d.js(3D), 시험 중 안경 HUD는 exam-art.js. 이 층은 640x360 버퍼에 그리고 3D 위에 겹친다.
'use strict';

const PIXEL_LOOK = (new URLSearchParams(location.search).get('look') || CONFIG.look) === 'pixel';
const PXF = 'px2'; // 안경이 띄우는 글씨는 픽셀 글꼴(갈무리11), 큰 제목(타이틀·석차표·일시정지·적발)만 Black Han Sans 그대로
const FONT_BODY = '"Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR","Noto Sans CJK KR","NanumGothic",sans-serif'; // 시험지·칠판처럼 인쇄된 글자
const FONT_SUB = '"Pretendard","Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",sans-serif'; // 자막
const FONT_KO = (PIXEL_LOOK || PXF ? '"Galmuri11",' : CONFIG.hud_font === 'dohyeon' ? '"Do Hyeon",' : CONFIG.hud_font === 'pretendard' ? '"Pretendard",' : '') + '"Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR","Noto Sans CJK KR","NanumGothic",sans-serif';
const PAL = {
  ol: '#1c1726', white: '#ffffff', dark: '#0d0b13',
  skin: '#f3caa1', skin2: '#d9a57c',
  paper: '#fbf9f1', paper2: '#e2dcc8', ink: '#2a2838', ink2: '#6c6a80',
  desk: '#c98e59', desk2: '#b07645', desk3: '#93603a', deskHi: '#e2ab76',
  uni: '#4c6194', uni2: '#3b4c77', chair: '#7a5a3c', chair2: '#5e4430',
  warn: '#f6a234', bad: '#ea4540', good: '#62d84a', gold: '#f5cc4a',
  rim: '#2a2434', rim2: '#5a5168',
  hud: '#45e5ee', hud2: '#2a8f9a', hud3: '#0f3238',
};

// ---- 화면 배치: 가로 한 가지 (모바일도 가로로 돌려서). 안경테 모양만 여기, 시험 화면 배치는 exam-art.js ----
const LAYOUTS = {
  land: {
    W: 640, H: 360,
    lenses: [{ cx: 165, cy: 184, aL: 163, aR: 225, b: 181 }, { cx: 475, cy: 184, aL: 225, aR: 163, b: 181 }], bridge: [284, 72],
  },
};

// ---- 도트 도구 ----
const TEXT_CACHE = new Map();
if (document.fonts) { for (const f of PIXEL_LOOK || PXF ? ['400 12px Galmuri11', '700 12px Galmuri11'] : ['400 12px "Do Hyeon"', '400 12px Pretendard', '600 12px Pretendard', '700 12px Pretendard', '800 12px Pretendard']) document.fonts.load(f); document.fonts.ready.then(() => TEXT_CACHE.clear()); } // 픽셀 글꼴이 오면 그려 둔 글자를 다시 만든다
let HUD_SCALE = 1; // HUD 층을 화면 실제 픽셀 수로 그리는 배율 (game.js fit()이 정한다)
function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function mix(h1, h2, k) { const a = hexRgb(h1), z = hexRgb(h2); return '#' + a.map((v, i) => Math.round(v + (z[i] - v) * k).toString(16).padStart(2, '0')).join(''); }

function makeKit(b) {
  const K = { b };
  K.R = (x, y, w, h, c) => { b.fillStyle = c; b.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  K.disc = (cx, cy, r, c) => {
    b.fillStyle = c; cx = Math.round(cx); cy = Math.round(cy); r = Math.round(r);
    for (let dy = -r; dy <= r; dy++) { const w = Math.floor(Math.sqrt(r * r - dy * dy + r * 0.6)); b.fillRect(cx - w, cy + dy, w * 2 + 1, 1); }
  };
  K.ring = (cx, cy, r, c) => {
    b.fillStyle = c; cx = Math.round(cx); cy = Math.round(cy); r = Math.round(r);
    let x = r, y = 0, e = 1 - r;
    while (x >= y) {
      for (const [p, q] of [[x, y], [y, x], [-y, x], [-x, y], [-x, -y], [-y, -x], [y, -x], [x, -y]]) b.fillRect(cx + p, cy + q, 1, 1);
      y++; if (e < 0) e += 2 * y + 1; else { x--; e += 2 * (y - x) + 1; }
    }
  };
  K.poly = (pts, c) => {
    b.fillStyle = c;
    let y0 = Infinity, y1 = -Infinity;
    for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
    y0 = Math.ceil(y0); y1 = Math.floor(y1);
    for (let y = y0; y <= y1; y++) {
      let xl = Infinity, xr = -Infinity; const yc = y + 0.5;
      for (let i = 0; i < pts.length; i++) {
        const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
        if ((yc >= ay && yc < by) || (yc >= by && yc < ay)) { const x = ax + (yc - ay) * (bx - ax) / (by - ay); xl = Math.min(xl, x); xr = Math.max(xr, x); }
      }
      if (xl <= xr) b.fillRect(Math.round(xl), y, Math.max(1, Math.round(xr) - Math.round(xl)), 1);
    }
  };
  K.line = (x0, y0, x1, y1, c, t = 1) => {
    b.fillStyle = c; x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let e = dx + dy; const o = t >> 1;
    for (let n = 0; n < 3000; n++) {
      b.fillRect(x0 - o, y0 - o, t, t);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; }
    }
  };
  K.polyEdge = (pts, c) => { for (let i = 0; i < pts.length; i++) { const a = pts[i], z = pts[(i + 1) % pts.length]; K.line(a[0], a[1], z[0], z[1], c, 1); } };
  K.frame = (x, y, w, h, c, t = 1) => { K.R(x, y, w, t, c); K.R(x, y + h - t, w, t, c); K.R(x, y, t, h, c); K.R(x + w - t, y, t, h, c); };
  K.dither = (hex, alpha) => {
    const p = document.createElement('canvas'); p.width = 2; p.height = 2;
    const g = p.getContext('2d'); g.globalAlpha = alpha; g.fillStyle = hex; g.fillRect(0, 0, 1, 1); g.fillRect(1, 1, 1, 1);
    return b.createPattern(p, 'repeat');
  };
  // 글자: 시스템 한글 글꼴을 버퍼 크기로 찍고 반투명 경계를 잘라 도트 글자로
  K.T = (str, x, y, size, col, align = 'left', weight = 700) => {
    str = String(str);
    const S = K.S || HUD_SCALE, key = str + '|' + size + '|' + col + '|' + weight + '|' + S;
    let c = TEXT_CACHE.get(key);
    if (!c) { // 화면 실제 해상도로 찍어서 글자가 깨지지 않게 (S = 화면 배율)
      const m = document.createElement('canvas'), g = m.getContext('2d');
      const f = `${weight} ${size * S}px ${FONT_KO}`; g.font = f;
      const w = Math.max(1, Math.ceil(g.measureText(str).width) + 4 * S), h = Math.ceil(size * 1.5 * S);
      m.width = w; m.height = h;
      g.font = f; g.textBaseline = 'middle'; g.fillStyle = col; g.fillText(str, 2 * S, h / 2);
      c = m; if (TEXT_CACHE.size > 900) TEXT_CACHE.clear(); TEXT_CACHE.set(key, c);
    }
    const w = c.width / S, h = c.height / S, r = v => Math.round(v * S) / S;
    const dx = align === 'center' ? x - w / 2 : align === 'right' ? x - w + 2 : x - 2;
    b.drawImage(c, r(dx), r(y - h / 2), w, h);
    return w - 4;
  };
  K.SUB = (str, x, y, size, col = '#ffffff', align = 'center') => { // 영상 자막처럼: 띠 없이 흰 글자에 검은 테두리와 그림자
    if (CONFIG.sub_style !== 'film') { const S0 = K.S || HUD_SCALE, W0 = b.canvas.width / S0; b.globalAlpha = 0.6; K.R(0, y - 14, W0, 28, '#000000'); b.globalAlpha = 1; return K.T(str, x, y, size, col, align, 800); } // 지금 사이트와 같은 검은 띠 자막
    str = String(str); size += 2;
    const S = K.S || HUD_SCALE, key = 'sub|' + str + '|' + size + '|' + col + '|' + S;
    let c = TEXT_CACHE.get(key);
    if (!c) {
      const m = document.createElement('canvas'), g = m.getContext('2d'), f = `600 ${size * S}px ${FONT_SUB}`; g.font = f;
      const pad = 6 * S, w = Math.max(1, Math.ceil(g.measureText(str).width) + pad * 2), h = Math.ceil(size * 1.7 * S);
      m.width = w; m.height = h; g.font = f; g.textBaseline = 'middle'; g.lineJoin = 'round';
      g.shadowColor = 'rgba(0,0,0,0.75)'; g.shadowBlur = 4 * S; g.shadowOffsetY = 1.2 * S;
      g.strokeStyle = 'rgba(0,0,0,0.9)'; g.lineWidth = 2.4 * S; g.strokeText(str, pad, h / 2);
      g.shadowColor = 'transparent'; g.fillStyle = col; g.fillText(str, pad, h / 2);
      c = m; if (TEXT_CACHE.size > 900) TEXT_CACHE.clear(); TEXT_CACHE.set(key, c);
    }
    const w = c.width / S, h = c.height / S;
    b.drawImage(c, Math.round((align === 'center' ? x - w / 2 : align === 'right' ? x - w + 6 : x - 6) * S) / S, Math.round((y - h / 2) * S) / S, w, h);
    return w - 12;
  };
  K.M = (str, x, y, size, col, align = 'left', weight = 700) => { // 뷰파인더 글자: 고정폭 숫자·영문 + 그림자
    str = String(str);
    const S = K.S || HUD_SCALE, key = 'm|' + str + '|' + size + '|' + col + '|' + weight + '|' + S;
    let c = TEXT_CACHE.get(key);
    if (!c) {
      const m = document.createElement('canvas'), g = m.getContext('2d'), f = `${weight} ${size * S}px ${PXF ? '"Galmuri11",' : ''}"SF Mono","Menlo","Consolas","Roboto Mono","D2Coding",${FONT_KO}`; g.font = f;
      const pad = 4 * S, w = Math.max(1, Math.ceil(g.measureText(str).width) + pad * 2), h = Math.ceil(size * 1.7 * S);
      m.width = w; m.height = h; g.font = f; g.textBaseline = 'middle';
      g.shadowColor = 'rgba(0,0,0,0.85)'; g.shadowBlur = 2.5 * S; g.shadowOffsetY = 0.8 * S; g.fillStyle = col; g.fillText(str, pad, h / 2); g.fillText(str, pad, h / 2);
      c = m; if (TEXT_CACHE.size > 900) TEXT_CACHE.clear(); TEXT_CACHE.set(key, c);
    }
    const w = c.width / S, h = c.height / S, dx = align === 'center' ? x - w / 2 : align === 'right' ? x - w + 4 : x - 4;
    b.drawImage(c, Math.round(dx * S) / S, Math.round((y - h / 2) * S) / S, w, h);
    return w - 8;
  };
  K.TW = (str, size, weight = 700) => { // 글자 폭만 잼
    const g = K._m || (K._m = document.createElement('canvas').getContext('2d'));
    g.font = `${weight} ${size}px ${FONT_KO}`; return Math.ceil(g.measureText(String(str)).width);
  };
  K.TO = (str, x, y, size, col, align = 'center', oc = PAL.ol) => {
    for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [1, -1], [-1, 1], [0, 2], [1, 2], [-1, 2]]) K.T(str, x + ox, y + oy, size, oc, align, 800);
    return K.T(str, x, y, size, col, align, 800);
  };
  K.glyphAt = (seed, x, y, s, col) => {
    for (const [x0, y0, x1, y1] of glyph(seed)) {
      if (x0 === x1 && y0 === y1) K.R(x + x0 * s - 1, y + y0 * s - 1, 2, 2, col);
      else K.line(x + x0 * s, y + y0 * s, x + x1 * s, y + y1 * s, col, 2);
    }
  };
  K.alienRow = (seed, n, x, y, s, col) => { alienWord(seed, n).forEach((g, i) => K.glyphAt(g, x + i * (s + 5), y, s, col)); };
  K.shape = (id, cx, cy, s, col) => { // 외계 신호 모양 6종
    const r = Math.round(s / 2);
    if (id === 0) { K.ring(cx, cy, r, col); K.ring(cx, cy, r - 1, col); }
    else if (id === 1) K.poly([[cx, cy - r], [cx + r, cy + r], [cx - r, cy + r]], col);
    else if (id === 2) { K.frame(cx - r, cy - r, r * 2, r * 2, col, 2); }
    else if (id === 3) K.poly([[cx, cy - r], [cx + r, cy], [cx, cy + r], [cx - r, cy]], col);
    else if (id === 4) { K.R(cx - r, cy - 1, r * 2, 3, col); K.R(cx - 1, cy - r, 3, r * 2, col); }
    else { for (let i = -1; i <= 1; i++) K.R(cx - r, cy + i * Math.round(r * 0.7) - 1, r * 2, 2, col); }
  };
  K.button = (x, y, w, h, label, hot, col = PAL.hud) => {
    K.R(x, y + 2, w, h, PAL.dark); K.R(x, y, w, h, hot ? col : '#26212f'); K.frame(x, y, w, h, hot ? PAL.white : col, 1);
    K.T(label, x + w / 2, y + h / 2, 12, hot ? PAL.dark : PAL.white, 'center', 800);
    return { x, y, w, h };
  };
  return K;
}

// ---- 안경테 (배치마다 한 번 계산) ----
function lensF(lenses, x, y) {
  let f = Infinity;
  for (const L of lenses) {
    const ax = x < L.cx ? L.aL : L.aR, dx = (x - L.cx) / ax, dy = (y - L.cy) / L.b;
    f = Math.min(f, dx * dx * dx * dx + dy * dy * dy * dy);
  }
  return f;
}
const RIM_CACHE = {};
function rimFor(key, grow = 1) { // grow: 렌즈를 키우면 테가 얇아진다
  const ck = key + '|' + grow; if (RIM_CACHE[ck]) return RIM_CACHE[ck];
  const L = LAYOUTS[key], c = document.createElement('canvas'); c.width = L.W; c.height = L.H;
  const g = c.getContext('2d'), id = g.createImageData(L.W, L.H), d = id.data;
  const c1 = hexRgb(PAL.rim2), c2 = hexRgb(PAL.rim), c3 = hexRgb(PAL.dark);
  for (let y = 0; y < L.H; y++) for (let x = 0; x < L.W; x++) {
    const f = lensF(L.lenses, x + 0.5, y + 0.5) / grow;
    if (f < 1) continue;
    const cc = f < 1.03 ? c1 : f < 1.13 ? c2 : c3, i = (y * L.W + x) * 4;
    d[i] = cc[0]; d[i + 1] = cc[1]; d[i + 2] = cc[2]; d[i + 3] = 255;
  }
  g.putImageData(id, 0, 0);
  const [bx, bw] = L.bridge;
  g.fillStyle = PAL.rim; g.fillRect(bx, 0, bw, 12); g.fillRect(bx + 8, 12, bw - 16, 4);
  g.fillStyle = PAL.rim2; g.fillRect(bx + 8, 15, bw - 16, 1); g.fillRect(bx + 2, 2, bw - 4, 1);
  return (RIM_CACHE[ck] = c);
}

// ---- 대리 응시 봇 ----
function drawBot(k, x, y, t, i) {
  const { R } = k, C = PAL, bob = (Math.floor(t * 3 + i) % 2);
  R(x - 9, y + 6, 18, 9, C.ol); R(x - 8, y + 7, 16, 7, '#8a5a32'); R(x - 6, y + 5, 9, 3, C.paper);
  R(x - 7, y - 8 + bob, 14, 13, C.ol); R(x - 6, y - 7 + bob, 12, 11, '#9aa3b8'); R(x - 5, y - 6 + bob, 10, 6, '#13202e');
  R(x - 4, y - 4 + bob, 2, 2, '#7ff6ff'); R(x + 2, y - 4 + bob, 2, 2, '#7ff6ff'); R(x - 1, y - 11 + bob, 2, 4, C.ol); R(x - 2, y - 13 + bob, 4, 2, PAL.bad);
  const arm = Math.floor(t * 8 + i) % 2;
  R(x + 5, y + 2 + arm, 4, 2, '#6c7590'); R(x + 3 - arm, y + 4, 2, 3, '#f2c13a');
}

// ---- 장비 그림 (상점 아이콘·허브 진열·HUD 공용) ----
function drawGear(k, id, cx, cy, s, lv) {
  const { R, disc, ring, line, poly } = k, C = PAL, u = s / 24;
  const X = v => Math.round(cx + v * u), Y = v => Math.round(cy + v * u), S = v => Math.max(1, Math.round(v * u));
  if (id === 'lens' && lv === 1) { // 지우개 액정: 흰 지우개에 파란 종이 띠, 그 위의 작은 화면
    R(X(-11), Y(-6), S(22), S(12), C.ol); R(X(-10), Y(-5), S(6), S(10), '#f4f1e8'); R(X(-4), Y(-5), S(14), S(10), '#2b5f8a');
    R(X(-2), Y(-3), S(10), S(6), '#0b0b0e'); R(X(1), Y(-2), S(4), S(1), '#7dffb0'); R(X(1), Y(0), S(4), S(1), '#7dffb0'); R(X(1), Y(2), S(4), S(1), '#7dffb0'); R(X(1), Y(-1), S(1), S(1), '#7dffb0'); R(X(4), Y(1), S(1), S(1), '#7dffb0');
  } else if (id === 'lens' && lv === 2) { // 초소형 카메라: 셔츠 단추, 가운데 구멍이 렌즈
    disc(X(0), Y(0), S(10), C.ol); disc(X(0), Y(0), S(9), '#e9e4d6'); disc(X(0), Y(0), S(6), '#cfc8b4');
    disc(X(0), Y(0), S(4), C.ol); disc(X(0), Y(0), S(3), '#16202c'); disc(X(1), Y(-1), S(1), '#7fd6ff');
    for (const [hx, hy] of [[-5, -5], [5, -5], [-5, 5], [5, 5]]) R(X(hx), Y(hy), S(1), S(1), C.ol);
  } else if (id === 'lens' || id === 'stealth') {
    const tint = id === 'stealth' ? '#6b4fa0' : ['#bfe8ff', '#9fe0ff', '#7fd6ff', '#5fe0e8', '#45e5ee'][Math.min(4, Math.floor(lv / 2))];
    for (const sx of [-6, 6]) { disc(X(sx), Y(0), S(6), C.ol); disc(X(sx), Y(0), S(5), tint); R(X(sx - 3), Y(-3), S(2), S(1), C.white); }
    R(X(-1), Y(-1), S(2), S(1), C.ol); R(X(-12), Y(-2), S(2), S(1), C.ol); R(X(11), Y(-2), S(2), S(1), C.ol);
    if (id === 'stealth') { R(X(-9), Y(-9), S(1), S(3), C.white); R(X(-10), Y(-8), S(3), S(1), C.white); }
  } else if (id === 'model') {
    R(X(-8), Y(-8), S(16), S(16), C.ol); R(X(-7), Y(-7), S(14), S(14), '#203040');
    for (let i = -6; i <= 6; i += 4) { R(X(i), Y(-10), S(1), S(2), C.gold); R(X(i), Y(9), S(1), S(2), C.gold); R(X(-10), Y(i), S(2), S(1), C.gold); R(X(9), Y(i), S(2), S(1), C.gold); }
    k.T('AI', X(0), Y(0), Math.max(8, S(8)), '#7ff6ff', 'center', 800);
  } else if (id === 'predict') {
    poly([[X(-10), Y(0)], [X(0), Y(-6)], [X(10), Y(0)], [X(0), Y(6)]], C.ol); poly([[X(-8), Y(0)], [X(0), Y(-5)], [X(8), Y(0)], [X(0), Y(5)]], '#fdfdf2');
    disc(X(0), Y(0), S(3), '#2a8f9a'); R(X(-1), Y(-1), S(1), S(1), C.white);
    line(X(4), Y(-10), X(10), Y(-10), C.warn, S(1)); line(X(10), Y(-10), X(10), Y(-5), C.warn, S(1));
  } else if (id === 'watch') {
    R(X(-4), Y(-11), S(8), S(22), C.ol); R(X(-3), Y(-11), S(6), S(22), '#3a3248');
    R(X(-7), Y(-6), S(14), S(12), C.ol); R(X(-6), Y(-5), S(12), S(10), '#0c2228'); k.T('AI', X(0), Y(0), Math.max(7, S(7)), '#7ff6ff', 'center', 800);
  } else if (id === 'earbud') {
    disc(X(-2), Y(-3), S(7), C.ol); disc(X(-2), Y(-3), S(6), '#f4f4f6'); R(X(-1), Y(2), S(4), S(9), C.ol); R(X(0), Y(2), S(2), S(8), '#e2e2ea');
    disc(X(-3), Y(-4), S(2), '#45e5ee');
    for (let i = 0; i < 3; i++) ring(X(4), Y(-4), S(8 + i * 3), i === 1 ? '#45e5ee' : '#2a8f9a');
    R(X(4), Y(-14), S(10), S(22), 'rgba(0,0,0,0)');
  } else if (id === 'bot') {
    drawBot(k, X(0), Y(-2), 0, 0);
  } else if (id === 'autoscan') {
    R(X(-10), Y(-8), S(20), S(16), C.ol); R(X(-9), Y(-7), S(18), S(14), '#1f6b3a');
    line(X(-7), Y(-4), X(-2), Y(-4), C.gold, S(1)); line(X(-2), Y(-4), X(-2), Y(3), C.gold, S(1)); line(X(2), Y(-5), X(7), Y(4), C.gold, S(1));
    R(X(1), Y(-2), S(6), S(5), '#111'); R(X(-9), Y(1), S(18), S(1), '#7ff6ff');
  } else if (id === 'wide') { // 광각 렌즈: 넓적한 렌즈 두 개
    for (const sx of [-6, 6]) { R(X(sx - 6), Y(-4), S(12), S(9), C.ol); R(X(sx - 5), Y(-3), S(10), S(7), '#7fd6ff'); R(X(sx - 4), Y(-2), S(3), S(1), C.white); }
    R(X(-1), Y(-1), S(2), S(1), C.ol); line(X(-11), Y(7), X(11), Y(7), '#45e5ee', S(1));
  } else if (id === 'coach') { // AI 면접 코치: 태블릿과 말풍선
    R(X(-9), Y(-6), S(14), S(16), C.ol); R(X(-8), Y(-5), S(12), S(14), '#2f7a5a'); R(X(-6), Y(-2), S(8), S(1), '#c9f6e0'); R(X(-6), Y(1), S(6), S(1), '#c9f6e0');
    R(X(2), Y(-11), S(10), S(7), C.ol); R(X(3), Y(-10), S(8), S(5), C.white); R(X(4), Y(-4), S(2), S(2), C.white);
  } else if (id === 'cctvjam' || id === 'jammer') {
    if (id === 'cctvjam') { R(X(-9), Y(-5), S(16), S(9), C.ol); R(X(-8), Y(-4), S(14), S(7), '#d4d6de'); R(X(6), Y(-3), S(5), S(5), '#9b9eac'); R(X(-6), Y(-2), S(3), S(3), C.bad); }
    else { R(X(-7), Y(-2), S(14), S(11), C.ol); R(X(-6), Y(-1), S(12), S(9), '#3a3f4a'); line(X(0), Y(-2), X(0), Y(-11), C.ol, S(2)); disc(X(0), Y(-11), S(2), C.bad); ring(X(0), Y(-11), S(5), '#45e5ee'); }
    line(X(-11), Y(9), X(11), Y(-9), C.bad, S(2));
  } else if (id === 'deepcam') { // 딥페이크 웹캠: 카메라와 웃는 얼굴 사진
    R(X(-9), Y(-7), S(18), S(13), C.ol); R(X(-8), Y(-6), S(16), S(11), '#f3caa1'); R(X(-4), Y(-3), S(2), S(2), C.ol); R(X(2), Y(-3), S(2), S(2), C.ol); R(X(-3), Y(1), S(6), S(1), C.ol);
    R(X(-3), Y(7), S(6), S(3), C.ol); disc(X(7), Y(-7), S(2), C.good);
  } else if (id === 'autooff') { // 자동 소등 칩
    R(X(-7), Y(-7), S(14), S(14), C.ol); R(X(-6), Y(-6), S(12), S(12), '#3a1f6b'); disc(X(0), Y(0), S(3), C.gold); line(X(-9), Y(9), X(9), Y(-9), C.ol, S(2));
  } else if (id === 'glasscase') {
    R(X(-10), Y(-5), S(20), S(11), C.ol); R(X(-9), Y(-4), S(18), S(9), '#7a5a3a'); R(X(-9), Y(0), S(18), S(1), '#5a4028'); R(X(-1), Y(-1), S(2), S(3), C.gold);
  } else if (id === 'gazefix') {
    disc(X(0), Y(0), S(9), C.ol); disc(X(0), Y(0), S(8), '#e8eef4'); disc(X(0), Y(0), S(4), '#2a8f9a'); disc(X(0), Y(0), S(2), C.ol); R(X(-2), Y(-2), S(1), S(1), C.white);
  } else if (id === 'eyedrop') {
    R(X(-4), Y(-4), S(8), S(13), C.ol); R(X(-3), Y(-3), S(6), S(11), '#f4f4f8'); R(X(-2), Y(-9), S(4), S(5), '#2a8af0'); R(X(-3), Y(1), S(6), S(3), '#2a8af0'); R(X(6), Y(4), S(2), S(3), '#7fd6ff');
  } else if (id === 'calccover') {
    R(X(-7), Y(-10), S(14), S(20), C.ol); R(X(-6), Y(-9), S(12), S(18), '#2a2c34'); R(X(-4), Y(-7), S(8), S(4), '#9ae0a0');
    for (let i = 0; i < 9; i++) R(X(-4 + (i % 3) * 3), Y(-1 + Math.floor(i / 3) * 3), S(2), S(2), '#c9c4d8');
  } else if (id === 'screenfilm') {
    R(X(-10), Y(-7), S(20), S(13), C.ol); R(X(-9), Y(-6), S(18), S(11), '#1c2230'); line(X(-7), Y(3), X(1), Y(-5), '#7fd6ff', S(1)); line(X(-2), Y(4), X(7), Y(-5), '#7fd6ff', S(1)); R(X(-4), Y(7), S(8), S(2), C.ol);
  } else if (id === 'taste') { // 와인잔
    poly([[X(-6), Y(-9)], [X(6), Y(-9)], [X(3), Y(0)], [X(-3), Y(0)]], C.ol); poly([[X(-4), Y(-5)], [X(4), Y(-5)], [X(2), Y(-1)], [X(-2), Y(-1)]], '#8a1a2a');
    R(X(-1), Y(0), S(2), S(7), C.ol); R(X(-5), Y(7), S(10), S(2), C.ol); disc(X(7), Y(4), S(2), '#ff5a8a');
  } else if (id === 'thirdeye') {
    for (const [ex, ey] of [[-6, 3], [6, 3], [0, -6]]) { disc(X(ex), Y(ey), S(4), C.ol); disc(X(ex), Y(ey), S(3), '#7ad06a'); disc(X(ex), Y(ey), S(1), C.ol); }
  } else if (id === 'candle') {
    R(X(-3), Y(-2), S(6), S(12), C.ol); R(X(-2), Y(-1), S(4), S(10), '#f4efe0'); poly([[X(0), Y(-11)], [X(3), Y(-4)], [X(-3), Y(-4)]], C.warn); R(X(-1), Y(-6), S(2), S(2), C.gold); R(X(-6), Y(10), S(12), S(2), C.ol);
  } else if (id === 'clone') {
    for (const [ox, c] of [[-6, '#5a4a8a'], [0, '#8a6cd6'], [6, '#c9b8ff']]) { disc(X(ox), Y(-4), S(4), C.ol); disc(X(ox), Y(-4), S(3), c); R(X(ox - 4), Y(1), S(8), S(9), C.ol); R(X(ox - 3), Y(2), S(6), S(8), c); }
  } else if (id === 'humanmod') { // 하트 달린 칩
    R(X(-8), Y(-7), S(16), S(14), C.ol); R(X(-7), Y(-6), S(14), S(12), '#6b1f3a'); disc(X(-2), Y(-1), S(2), '#ff8aa8'); disc(X(2), Y(-1), S(2), '#ff8aa8'); poly([[X(-5), Y(0)], [X(5), Y(0)], [X(0), Y(5)]], '#ff8aa8');
  } else if (id === 'offbeat') { // 메트로놈
    poly([[X(-3), Y(-10)], [X(3), Y(-10)], [X(8), Y(10)], [X(-8), Y(10)]], C.ol); poly([[X(-2), Y(-8)], [X(2), Y(-8)], [X(6), Y(8)], [X(-6), Y(8)]], '#5a3a24'); line(X(0), Y(6), X(5), Y(-7), '#e8e8e8', S(1)); disc(X(4), Y(-4), S(2), C.gold);
  } else { R(X(-7), Y(-7), S(14), S(14), C.ol); R(X(-6), Y(-6), S(12), S(12), '#3a3248'); }
}

// ======================= 공용 판 =======================
function plate(k, x, y, w, h, H) {
  k.b.globalAlpha = 0.74; k.R(x, y, w, h, PAL.dark); k.b.globalAlpha = 1;
  k.frame(x, y, w, h, H.c3, 1); k.R(x, y, 6, 1, H.c); k.R(x, y, 1, 6, H.c);
}

// ======================= 결과 · 허브 · 타이틀 · 엔딩 · figures =======================
function drawResultHud(k, L, Rz, now, H) { // 결과 화면: 위에는 연동해 둔 AI(답안봇)의 문자 알림, 아래에는 자막 글씨의 다음 할 일
  const { R, T } = k, C = PAL, b = k.b, W = L.W, blink = Math.floor(now * 2) % 2 === 0;
  if (Rz.shownAt == null || now < Rz.shownAt) Rz.shownAt = now;
  const a = Math.min(1, (now - Rz.shownAt) / 0.35), e = 1 - (1 - a) * (1 - a), cw = 300, ch = 62, cx = W / 2 - cw / 2, cy = -ch + (ch + 16) * e;
  let gr = b.createLinearGradient(0, 0, 0, L.H); gr.addColorStop(0, 'rgba(0,0,0,0.28)'); gr.addColorStop(0.35, 'rgba(0,0,0,0)'); gr.addColorStop(0.65, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.6)'); b.fillStyle = gr; b.fillRect(0, 0, W, L.H);
  const rr = (x, y, w, h, r, col) => { b.fillStyle = col; b.beginPath(); if (b.roundRect) b.roundRect(x, y, w, h, r); else b.rect(x, y, w, h); b.fill(); };
  rr(cx + 1, cy + 4, cw, ch, 12, 'rgba(0,0,0,0.35)'); rr(cx, cy, cw, ch, 12, 'rgba(28,30,38,0.94)'); rr(cx + 11, cy + 10, 24, 24, 6, '#5eb5f7');
  T('답안봇', cx + 45, cy + 14, 8.5, '#9aa3b4', 'left', 700); T('지금', cx + cw - 12, cy + 14, 8.5, '#9aa3b4', 'right', 700);
  const good = Rz.passed && !Rz.caught, col = Rz.caught ? '#ff8a8a' : good ? '#8dffa8' : '#ffcf7a';
  const head = Rz.caught ? '적발 · 퇴실' : Rz.audited ? '가채점은 합격인데...' : `가채점 ${Rz.score}점 · `, tail = Rz.caught || Rz.audited ? '' : Rz.passed ? '합격 예상' : '불합격 예상';
  const hw = k.TW(head, 14, 800); T(head, cx + 45, cy + 31, 14, Rz.caught ? col : '#ffffff', 'left', 800); if (tail) T(tail, cx + 45 + hw, cy + 31, 14, col, 'left', 800);
  T(Rz.caught ? '이번 시험은 무효 처리돼요.' : `정답 ${+(+Rz.correct || 0).toFixed(1)}/${Rz.qn} · 합격선 ${Rz.pass}점. 통지표는 우편으로 갑니다.`, cx + 45, cy + 48, 9.5, '#c9d0dc', 'left', 700);
  // 아래: 다음에 할 일 (자막 글씨)
  const defs = [[Rz.canRetry ? '재응시' : '응시료 부족', 'R', 'retry', Rz.canRetry]];
  if (Rz.next != null) defs.push([Rz.final ? '엔딩' : Rz.canNext ? '다음 시험' : '응시료 부족', 'N', 'next', Rz.final || Rz.canNext]);
  defs.push(['귀가', 'Enter', 'hub', true]);
  const btns = [], gap = 118, x0 = W / 2 - gap * (defs.length - 1) / 2, y = L.H - 30;
  defs.forEach(([label, keyName, key, ok], i) => { const x = x0 + i * gap, focus = ok && key === Rz.focus;
    const w = k.SUB(label, x - 8, y, focus ? 13 : 12, !ok ? '#8a8698' : focus ? '#ffffff' : '#d8d4c8', 'center'); k.M(keyName, x - 8 + w / 2 + 6, y + 1, 7, !ok ? '#8a8698' : '#c9c4d8', 'left', 500);
    if (focus) R(x - 8 - w / 2, y + 11, w, 1.5, blink ? '#ffffff' : 'rgba(255,255,255,0.5)');
    if (ok) btns.push({ x: x - gap / 2 + 4, y: y - 18, w: gap - 8, h: 36, key }); });
  return btns;
}
function drawResults(k, L, Rz, now, H) {
  const extras = (Rz.perfect && Rz.jack !== false ? 1 : 0) + (Rz.coach > 1 ? 1 : 0) + (Rz.bonus > 0 ? 1 : 0);
  const { R, T, TO } = k, C = PAL, w = Math.min(L.W - 40, 420), x = (L.W - w) / 2;
  const h = 138 + (Rz.fee > 0 ? 18 : 0) + 19 + (extras ? 16 : 0) + 16 + (Rz.tut ? 0 : 16) + (Rz.unlock ? 16 : 0) + 50, y = Math.round((L.H - h) / 2);
  k.b.globalAlpha = 0.6; R(0, 0, L.W, L.H, PAL.dark); k.b.globalAlpha = 1;
  const edge = Rz.caught || Rz.audited ? C.bad : Rz.perfect ? C.gold : Rz.passed ? C.good : C.warn;
  R(x, y + 3, w, h, PAL.dark); R(x, y, w, h, '#1d1926'); k.frame(x, y, w, h, edge, 2);
  TO(Rz.audited ? '전수조사: 합격 취소' : Rz.caught ? '적발!' : Rz.perfect ? '수석 합격!' : Rz.passed ? '합격!' : '불합격', L.W / 2, y + 26, Rz.audited ? 22 : 28, edge);
  T(Rz.tierName, L.W / 2, y + 52, 12, '#c9c4d8', 'center', 700);
  // 채점표: 문항마다 O·X, 파란 밑줄은 AI가 고른 답
  const n = Rz.marks.length, cw = Math.min(30, Math.floor((w - 40) / n)), mx = L.W / 2 - (n * cw) / 2, my = y + 86;
  Rz.marks.forEach((m, i) => {
    const cx = mx + i * cw + cw / 2;
    T(String(i + 1), cx, my - 15, 9, '#8f89a3', 'center', 700);
    const col = Rz.caught || m.r === '-' ? '#6b6680' : m.r === 'O' ? C.good : C.bad;
    TO(m.r, cx, my, 16, col, 'center');
    if (m.via === 'ai' || m.via === 'auto') R(cx - 6, my + 12, 12, 2, H.c);
  });
  T(Rz.caught ? '적발 · 0점 처리' : `정답 ${+(+Rz.correct || 0).toFixed(1)}/${Rz.qn} · ${Rz.score}점 (합격선 ${Rz.pass}점)`, L.W / 2, y + 116, 13, C.white, 'center', 800);
  let ly = y + 138;
  if (Rz.fee > 0) { T(`응시료 -${won(Rz.fee)}원`, L.W / 2, ly, 11, '#d6a0a0', 'center', 700); ly += 18; }
  T(Rz.reward > 0 ? `${Rz.pay} +${won(Rz.reward)}원` : '보상 없음', L.W / 2, ly, 15, Rz.reward > 0 ? C.gold : '#8f89a3', 'center', 800); ly += 19;
  const extra = [];
  if (Rz.perfect && Rz.jack !== false) extra.push(`만점 x${tune.jackpot_mult}`);
  if (Rz.coach > 1) extra.push(`면접 x${Rz.coach.toFixed(2)}`);
  if (Rz.bonus > 0) extra.push(`시간 x${(1 + Rz.bonus).toFixed(2)}`);
  if (extra.length) { T(extra.join(' · '), L.W / 2, ly, 11, H.c, 'center', 700); ly += 16; }
  T(`직접 고른 답 ${Rz.self} · AI가 고른 답 ${Rz.ai}`, L.W / 2, ly, 11, '#c9c4d8', 'center', 700); ly += 16;
  if (!Rz.tut) { const d = Math.round((Rz.heat - Rz.heat0) * 100), hc = Rz.audited || Rz.heat >= 0.66 ? C.bad : Rz.heat >= 0.33 ? C.warn : '#8f89a3';
    T(Rz.audited ? '점수가 너무 완벽했다. 가끔은 일부러 틀려야 한다' : `전수조사 의심 ${Math.round(Rz.heat * 100)}% (${d >= 0 ? '+' : ''}${d}%)${Rz.perfect ? ' · 만점은 눈에 띈다' : ''}`, L.W / 2, ly, 11, hc, 'center', 800); ly += 16; }
  if (Rz.unlock) { let us = 12; while (k.TW(Rz.unlock, us, 800) > w - 20 && us > 9) us--; T(Rz.unlock, L.W / 2, ly, us, H.c, 'center', 800); }
  const btns = [], by = y + h - 38, gap = 8;
  const defs = [[Rz.canRetry ? 'R 다시 응시' : '응시료 부족', 'retry', Rz.canRetry]];
  if (Rz.next != null) defs.push([Rz.final ? 'N 엔딩 보기' : Rz.canNext ? 'N 다음 시험' : '응시료 부족', 'next', Rz.final || Rz.canNext]);
  defs.push(['Enter 고시원으로', 'hub', true]);
  const bw = Math.floor((w - 24 - gap * (defs.length - 1)) / defs.length);
  defs.forEach(([label, key, ok], i) => { const b = k.button(x + 12 + i * (bw + gap), by, bw, 26, label, ok && key === Rz.focus, ok ? PAL.hud : '#5a5468'); if (ok) btns.push({ ...b, key }); });
  return btns;
}

const BOOT_K = PXF ? 0.8 : 1, TITLE_K = PXF === 'px' ? 0.82 : 1;
const TITLE_FONT = (PXF === 'px' ? '"Galmuri11",' : '') + '"Black Han Sans","Do Hyeon",' + FONT_KO, BOOT_FONT = (PXF ? '"Galmuri11",' : '') + '"VT323","SF Mono","Menlo","Consolas",monospace,' + FONT_KO;
if (document.fonts) { document.fonts.load('400 40px "Black Han Sans"', 'AI 안경으로 살아남기 적발 일시정지 AI는 답을 알려 줍니다. 어디에 쓸지는 알려 주지 않습니다. 전국 석차표 응시자 이름 등록'); document.fonts.load('400 16px "VT323"', 'LENS-OS 0.9b ENTER'); }
function drawTitle(k, L, now, hasSave, info) { // 타이틀: 첫 시험장의 내 책상을 안경 너머로 본다. 초점이 잡히고 답이 뜬 순간 (시안 F 그대로)
  const { R } = k, b = k.b, W = L.W, HH = L.H, G1 = '#74ff8e', RK = info.rank || { k: 0, rows: [] }, rk = RK.k, mix = (p, q) => p + (q - p) * rk;
  if (new URLSearchParams(location.search).get('hud') === '0') return []; // check only: 배경만
  const fx = mix(165, 55), fy = mix(132, 46), fw = mix(210, 315), fh = mix(150, 257); // 초점 틀: 보기 네 개가 있는 자리. 석차표일 때는 왼쪽 위까지 커진다
  const wc = typeof worldCanvas !== 'undefined' && worldCanvas; // 초점 밖은 흐리고 어둡게: 3D 화면을 흐리게 다시 그리고, 초점 안만 뚫어 둔다
  if (wc && wc.width && 'filter' in b) { try { b.save(); b.filter = 'blur(2.5px) brightness(0.6)'; b.drawImage(wc, 0, 0, W, HH); b.restore(); if (rk <= 0) b.clearRect(fx, fy, fw, fh); } catch (e) { b.restore(); } }
  else { b.globalAlpha = 0.4; R(0, 0, W, fy, '#000000'); R(0, fy + fh, W, HH - fy - fh, '#000000'); R(0, fy, fx, fh, '#000000'); R(fx + fw, fy, W - fx - fw, fh, '#000000'); b.globalAlpha = 1; }
  b.globalAlpha = 0.38; R(0, 0, W, HH, '#061e0e'); b.globalAlpha = 1;
  if (rk > 0) { b.globalAlpha = 0.72 * rk; R(fx, fy, fw, fh, '#04160a'); b.globalAlpha = 1; } // 석차표: 틀 안을 어둡게 깔고 순위 줄을 쓴다
  b.globalAlpha = 0.13; for (let y = 0; y < HH; y += 1.5) R(0, y, W, 0.5, '#000000'); b.globalAlpha = 1;
  const pulse = rk > 0 ? 0 : Math.max(0, 0.3 - (now % 3.6)) / 0.3, gx = pulse * 26, gy = pulse * 18, l = 20, x0 = fx - gx, y0 = fy - gy, x1 = fx + fw + gx, y1 = fy + fh + gy; // 3.6초마다 초점을 다시 잡는다
  for (const [cx, cy, sx, sy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]) { R(sx > 0 ? cx : cx - l, sy > 0 ? cy : cy - 2, l, 2, G1); R(sx > 0 ? cx : cx - 2, sy > 0 ? cy : cy - l, 2, l, G1); }
  const text = (str, x, y, font, col, align, glow) => { b.font = font; b.textAlign = align; b.textBaseline = 'alphabetic'; b.shadowColor = glow || 'transparent'; b.shadowBlur = glow ? 4 * (k.S || HUD_SCALE) : 0; b.fillStyle = col; b.fillText(str, x, y); b.shadowBlur = 0; b.shadowColor = 'transparent'; };
  const moving = rk > 0 && rk < 1, half = rk >= 0.5, bf = sz => `400 ${sz * BOOT_K}px ${BOOT_FONT}`;
  const scr = (str, salt) => !moving ? str : [...str].map((ch, i) => ch === ' ' ? ' ' : (Math.abs(Math.sin((i + 1) * 12.9898 + salt * 7.13 + Math.floor(now * 30) * 78.233) * 43758.5453) % 1) < 0.25 + Math.abs(rk - 0.5) * 1.5 ? ch : '▓░▒#'[(i + Math.floor(now * 30)) % 4]).join(''); // 글자가 지지직 흐트러졌다 맞춰진다
  if (rk < 1) { b.globalAlpha = 1 - Math.min(1, rk * 2.5); const n = Math.min(4, 1 + Math.floor((now % 14) / 0.4)); // 왼쪽 위 부팅 줄: 석차표로 바뀌면 사라진다
    ['LENS-OS 0.9b', '초점 ......... 고정', '정답 ......... 수신', '감독관 ....... 등 돌림'].slice(0, n).forEach((ln, i) => text(ln, 65, 60 + i * 15.6, bf(12.5), G1, 'left', '#0a4018')); b.globalAlpha = 1; }
  const tx = W - 65, tf = `400 ${46 * TITLE_K}px ${TITLE_FONT}`, jit = (now * 0.29) % 1 < 0.035 ? Math.round(Math.sin(now * 90) * 3) : 0;
  (half ? [['전국', 106], ['석차표', 156]] : [['AI 안경으로', 106], ['살아남기', 156]]).forEach(([str, y], q) => { const s2 = scr(str, q); text(s2, tx + 2.5 + jit, y, tf, 'rgba(255,60,60,0.45)', 'right'); text(s2, tx - 2 + jit, y, tf, 'rgba(60,160,255,0.4)', 'right'); text(s2, tx + jit, y, tf, G1, 'right', '#0a4018'); });
  const rows = RK.rows, total = RK.total || rows.length, mineI = rows.findIndex(r => r.me), rankOf = i => rows[i].rank || i + 1, per = 10, pages = Math.max(1, Math.ceil(rows.length / per)), page = Math.max(0, Math.min(pages - 1, RK.page || 0)), btns = [];
  if (half) { text(scr(RK.online ? `응시자 ${total.toLocaleString()}명` : `이 기기의 기록 ${total}개`, 3), tx, 178, bf(14), G1, 'right', '#0a4018'); text(scr(mineI >= 0 ? `내 석차 ${rankOf(mineI)}등` : '내 석차 미정', 4), tx, 194, bf(14), G1, 'right', '#0a4018'); if (RK.online && RK.runs > 0) text(scr(`누적 응시 ${RK.runs.toLocaleString()}회`, 5), tx, 210, bf(14), G1, 'right', '#0a4018'); }
  else if (info && info.best) text(scr(`내 최고 기록 ${info.best}`, 3), tx, 180, bf(11), '#d8f8e0', 'right', '#0a4018');
  if (rk > 0) { // 석차표 줄: 위에서부터 한 줄씩 채워진다
    const lh = 21.6, rx = fx + 13, rw = fw - 26, show = Math.floor(Math.max(0, (rk - 0.35) / 0.65) * 13), list = rows.slice(page * per, page * per + per);
    const row = (i, r, y, inv) => { if (inv) { R(rx - 3, y - 15.5, rw + 6, 20.5, G1); } const col = inv ? '#06200e' : G1, gl = inv ? null : '#0a4018', nm = [...r.name].slice(0, 8).join('');
      text(scr(`${rankOf(i)}등`, i), rx, y, bf(16.5), col, 'left', gl); text(scr(nm, i + 20), rx + 48, y, bf(16.5), col, 'left', gl); text(scr(fmtRunT(r.t), i + 40), rx + rw, y, bf(16.5), col, 'right', gl); };
    list.forEach((r, i) => { if (i < show) row(page * per + i, r, fy + 26 + i * lh, false); });
    if (!rows.length && show > 2) { text('아직 기록이 없습니다', fx + fw / 2, fy + fh / 2 - 6, bf(16.5), G1, 'center', '#0a4018'); text('엔딩을 보면 석차표에 오릅니다', fx + fw / 2, fy + fh / 2 + 16, bf(13), '#d8f8e0', 'center', '#0a4018'); }
    if (mineI >= 0 && show > 11) { b.globalAlpha = 0.5; text(':', rx, fy + 26 + 10 * lh - 6, bf(13), G1, 'left'); b.globalAlpha = 1; row(mineI, rows[mineI], fy + fh - 9, true); }
    if (rk >= 1) { const py = fy + fh + 15; b.globalAlpha = page > 0 ? 1 : 0.35; text('▲ 위로', fx, py, bf(12), G1, 'left', '#0a4018'); b.globalAlpha = page < pages - 1 ? 1 : 0.35; text('아래로 ▼', fx + fw, py, bf(12), G1, 'right', '#0a4018'); b.globalAlpha = 1;
      text(rows.length ? `${page * per + 1}~${Math.min(rows.length, page * per + per)}등 / ${(RK.listed != null ? RK.listed : total).toLocaleString()}명` : '', fx + fw / 2, py, bf(12), G1, 'center', '#0a4018');
      btns.push({ x: fx - 10, y: py - 16, w: fw / 3, h: 26, key: 'rank:up' }, { x: fx + fw * 2 / 3 + 10, y: py - 16, w: fw / 3, h: 26, key: 'rank:down' });
      if (RK.canOld) { const lab = RK.old ? '◀ 이번 시즌' : '지난 시즌 ▶'; text(lab, fx + fw, fy - 8, bf(12), '#d8f8e0', 'right', '#0a4018'); b.font = bf(12); const lw = b.measureText(lab).width; btns.push({ x: fx + fw - lw - 10, y: fy - 24, w: lw + 20, h: 24, key: 'rank:season' }); if (RK.old) text('시즌 1 · 보관된 기록', fx, fy - 8, bf(12), '#ffe98a', 'left', '#0a4018'); } }
  }
  if (info && info.ios && rk <= 0) text('아이폰은 공유 → "홈 화면에 추가"로 열면 전체 화면', tx, HH - 104, bf(10), '#d8f8e0', 'right', '#0a4018');
  const label = scr(half ? '◀ 돌아가기 [ESC]' : hasSave ? '▶ 이어서 하기 [ENTER]' : '▶ 시험 시작 [ENTER]', 9); b.font = bf(16); const bw = Math.ceil(b.measureText(label).width) + 30, bh = 28, bx = tx - bw, by = HH - 60 - bh, on = Math.floor(now * 2) % 2 === 0;
  b.globalAlpha = on ? 0.16 : 0.06; R(bx, by, bw, bh, G1); b.globalAlpha = 1; k.frame(bx, by, bw, bh, G1, 1.5); text(label, bx + bw / 2, by + bh / 2 + 5, bf(16), G1, 'center', 'rgba(116,255,142,0.5)');
  if (rk < 1) { // 화면 맨 아래 흐르는 석차 줄: 누르면 석차표로 바뀐다
    const ty = HH - 37, th = 20, tl = 30, tr = W - 30; b.globalAlpha = (1 - rk) * 0.4; R(tl, ty, tr - tl, 1, G1); b.globalAlpha = 1 - rk;
    b.font = bf(13); const lab = '석차표', lw = Math.ceil(b.measureText(lab).width) + 10; R(tl, ty + 4, lw, 15, G1); text(lab, tl + lw / 2, ty + 15.5, bf(13), '#06200e', 'center');
    const str = rows.length ? rows.slice(0, 10).map((r, i) => `${i + 1}등 ${r.name} ${fmtRunT(r.t)}`).join('   ·   ') + '   ·   ' : '아직 기록이 없습니다 · 엔딩을 보면 석차표에 오릅니다   ·   ';
    const sw = b.measureText(str).width, off = (now * 26) % sw; b.save(); b.beginPath(); b.rect(tl + lw + 8, ty, tr - tl - lw - 8, th); b.clip(); for (let x = tl + lw + 8 - off; x < tr; x += sw) text(str, x, ty + 15.5, bf(13), G1, 'left', '#0a4018'); b.restore(); b.globalAlpha = 1;
    if (rk <= 0) btns.push({ x: 0, y: ty - 6, w: W, h: HH - ty + 6, key: 'rank:open' });
  }
  b.textAlign = 'left'; b.drawImage(rimFor('land'), 0, 0);
  if (rk >= 1) btns.push({ x: bx, y: by, w: bw, h: bh, key: 'rank:close' }); else if (rk <= 0) btns.push({ x: 0, y: 0, w: W, h: HH, key: 'start' });
  return btns;
}
function drawRankIn(k, L, now, RI, rows, total, online) { // 엔딩 뒤 이름 입력(시안 B): 석차표에서 내 자리가 벌어지고, 그 줄에 이름을 써 넣는다
  const { R } = k, b = k.b, W = L.W, HH = L.H, G1 = '#74ff8e', bf = sz => `400 ${sz * BOOT_K}px ${BOOT_FONT}`, btns = [];
  const text = (str, x, y, font, col, align, glow) => { b.font = font; b.textAlign = align; b.textBaseline = 'alphabetic'; b.shadowColor = glow || 'transparent'; b.shadowBlur = glow ? 4 * (k.S || HUD_SCALE) : 0; b.fillStyle = col; b.fillText(str, x, y); b.shadowBlur = 0; b.shadowColor = 'transparent'; };
  b.globalAlpha = 0.74; R(0, 0, W, HH, '#061e0e'); b.globalAlpha = 0.13; for (let y = 0; y < HH; y += 1.5) R(0, y, W, 0.5, '#000000'); b.globalAlpha = 1;
  const tf = `400 ${30 * TITLE_K}px ${TITLE_FONT}`; text('전국 석차표', W / 2 + 2, 52, tf, 'rgba(255,60,60,0.45)', 'center'); text('전국 석차표', W / 2 - 1.5, 52, tf, 'rgba(60,160,255,0.4)', 'center'); text('전국 석차표', W / 2, 52, tf, G1, 'center', '#0a4018');
  const mi = rows.findIndex(r => r.me), rankOf = i => rows[i].rank || i + 1, type = RI.phase === 'type', myRank = mi >= 0 ? rankOf(mi) : 0;
  text(type ? `${myRank}등으로 진입! 이름을 남기세요` : RI.phase === 'send' ? '전송 중…' : `${myRank}등 · ${RI.msg || '등록되었습니다'}`, W / 2, 76, bf(15), '#ffe98a', 'center', '#0a4018');
  const x0 = 165, x1 = W - 165, lh = 23, from = Math.max(0, Math.min(mi - 3, rows.length - 6)), list = rows.slice(from, from + 6), y0 = 108;
  list.forEach((r, j) => { const i = from + j, y = y0 + j * lh, inv = r.me; if (inv) R(x0 - 7, y - 16.5, x1 - x0 + 14, 22, G1); const col = inv ? '#06200e' : G1, gl = inv ? null : '#0a4018';
    const nm = inv ? (type ? RI.name : (RI.name || r.name)) : r.name; text(`${rankOf(i)}등`, x0, y, bf(16.5), col, 'left', gl); text(nm, x0 + 50, y, bf(16.5), col, 'left', gl); text(fmtRunT(r.t), x1, y, bf(16.5), col, 'right', gl);
    if (inv && type) { b.font = bf(16.5); const cx = x0 + 50 + b.measureText(nm).width + 2; if (Math.floor(now * 2) % 2 === 0) R(cx, y - 13, 7, 15, '#06200e'); if (!nm) { b.globalAlpha = 0.55; text('여기를 눌러 이름 입력 (8자까지)', x0 + 64, y, bf(14), '#06200e', 'left'); b.globalAlpha = 1; } } });
  text(online ? `응시자 ${total.toLocaleString()}명` : '이 기기의 기록에 남습니다', W / 2, y0 + 6 * lh + 6, bf(12), '#d8f8e0', 'center', '#0a4018');
  const by = HH - 84, bh = 26, defs = type ? [['등록 [ENTER]', 'rin:ok', true], ['이름 없이 넘기기', 'rin:skip', false]] : RI.phase === 'done' ? [['▶ 계속하기 [ENTER]', 'rin:go', true]] : [];
  b.font = bf(15); const ws = defs.map(d => Math.ceil(b.measureText(d[0]).width) + 30), tot = ws.reduce((p, c) => p + c, 0) + 12 * Math.max(0, defs.length - 1); let bx = W / 2 - tot / 2;
  defs.forEach(([lab, key, fill], i) => { if (fill) R(bx, by, ws[i], bh, G1); else { b.globalAlpha = 0.08; R(bx, by, ws[i], bh, G1); b.globalAlpha = 1; } k.frame(bx, by, ws[i], bh, G1, 1.5); text(lab, bx + ws[i] / 2, by + 18, bf(15), fill ? '#06200e' : G1, 'center', fill ? null : '#0a4018'); btns.push({ x: bx, y: by, w: ws[i], h: bh, key }); bx += ws[i] + 12; });
  b.textAlign = 'left'; b.drawImage(rimFor('land'), 0, 0);
  return btns;
}
function fmtRunT(sec) { sec = Math.max(0, Math.floor(sec)); const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60; return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`; }
function drawLensScreen(k, L, now, o) { // 타이틀과 같은 안경 화면: 적발(빨강) · 일시정지(초록). o: col, glow, tint, lines, big, y
  const b = k.b, W = L.W, HH = L.H, R = k.R;
  const text = (str, x, y, font, col, align, glow) => { b.font = font; b.textAlign = align; b.textBaseline = 'alphabetic'; b.shadowColor = glow || 'transparent'; b.shadowBlur = glow ? 4 * (k.S || HUD_SCALE) : 0; b.fillStyle = col; b.fillText(str, x, y); b.shadowBlur = 0; b.shadowColor = 'transparent'; };
  b.globalAlpha = 0.55; R(0, 0, W, HH, o.tint); b.globalAlpha = 0.13; for (let y = 0; y < HH; y += 1.5) R(0, y, W, 0.5, '#000000'); b.globalAlpha = 1;
  o.lines.forEach((ln, i) => text(ln, 65, 60 + i * 15.6, `400 ${12.5 * BOOT_K}px ${BOOT_FONT}`, o.col, 'left', o.glow));
  const jit = (now * 0.29) % 1 < 0.05 ? Math.round(Math.sin(now * 90) * 3) : 0, f = `400 ${75 * TITLE_K}px ${TITLE_FONT}`, y = o.y || 178;
  text(o.big, W / 2 + 2.5 + jit, y, f, 'rgba(255,60,60,0.45)', 'center'); text(o.big, W / 2 - 2 + jit, y, f, 'rgba(60,160,255,0.4)', 'center'); text(o.big, W / 2 + jit, y, f, o.col, 'center', o.glow);
  b.globalAlpha = 0.35; R(0, 165, W, 5, o.col); b.globalAlpha = 0.3; R(0, 260, W, 2, o.col); b.globalAlpha = 1;
  if (o.sub) text(o.sub, W / 2, y + 62, `400 ${13 * BOOT_K}px ${BOOT_FONT}`, o.col, 'center', o.glow);
  b.textAlign = 'left'; b.drawImage(rimFor('land'), 0, 0);
}
function drawTitleOut(k, L, now, a) { // 타이틀에서 시험으로: 안경 화면이 지직거리며 꺼진다 (a: 1 → 0)
  const b = k.b, G1 = '#74ff8e'; b.globalAlpha = Math.min(1, a * 1.4); b.drawImage(rimFor('land'), 0, 0);
  b.globalAlpha = 0.45 * a; k.R(0, 0, L.W, L.H, '#04140a');
  for (let i = 0; i < 14; i++) { const h = Math.abs(Math.sin(i * 12.9898 + Math.floor(now * 24) * 78.233) * 43758.5453) % 1; b.globalAlpha = 0.5 * a; k.R(0, Math.floor(h * L.H), L.W, 1 + Math.floor(((h * 7) % 1) * 4), G1); }
  b.globalAlpha = a; if (a > 0.35) k.M('LENS-OS ... 신호 끊김', 62, 44, 8.5, G1, 'left', 700); b.globalAlpha = 1;
}

const END_SHOTS = [ // 엔딩 앞 장면: CCTV에 찍힌 세상
  { kind: 'doctor', cam: 'CAM 02 · 종합병원 진료실', cap: '"잠시만요. 안경이... AI가 응답을 안 하네요."' },
  { kind: 'court', cam: 'CAM 05 · 지방법원 301호 법정', cap: '"재판장님, 배터리가 없어서... 휴정을 요청합니다."' },
  { kind: 'school', cam: 'CAM 11 · 고등학교 2학년 3반', cap: '"선생님, 그걸 왜 외워요? 안경이 풀어 주는데."' },
];
const END_T = { shot0: 1.4, shotLen: 4, me: 13.4, line1: 17.4, line2: 19.2, stats: 23 };
function endShotAt(t) { const i = Math.floor((t - END_T.shot0) / END_T.shotLen); return t < END_T.me ? END_SHOTS[Math.max(0, Math.min(END_SHOTS.length - 1, i))] : null; }
function drawEnding(k, L, G, now, H, info) {
  const { R, T, TO } = k, C = PAL, cx = L.W / 2, t = info.t, st = G.stats, E2 = END_T;
  if (!info.world) R(0, 0, L.W, L.H, '#07060d'); // 3D를 못 쓰면 검은 바탕
  const fade = (t0, t1) => Math.max(0, Math.min(1, (t - t0) / 0.8)) * (t1 ? Math.max(0, Math.min(1, (t1 - t) / 0.8)) : 1);
  const line = (str, y, size, col, a) => { if (a <= 0) return; k.b.globalAlpha = a; T(str, cx, y, size, col, 'center', 800); k.b.globalAlpha = 1; };
  const shot = endShotAt(t);
  if (shot) { // CCTV 화면: 녹화 표시, 카메라 이름, 시각, 자막
    const i = END_SHOTS.indexOf(shot), lt = t - E2.shot0 - i * E2.shotLen, sec = 7 + Math.floor(now) % 50;
    k.b.globalAlpha = 0.08; for (let y = 0; y < L.H; y += 3) R(0, y, L.W, 1, '#000000'); k.b.globalAlpha = 1;
    if (Math.floor(now * 2) % 2) k.disc(24, 20, 4, C.bad); TO('REC', 34, 20, 11, C.white, 'left', '#101010');
    TO(shot.cam, 24, 38, 10, C.white, 'left', '#101010'); TO(`2031-03-${14 + i} 10:4${i}:${String(sec).padStart(2, '0')}`, L.W - 24, 20, 10, C.white, 'right', '#101010');
    if (lt > 0.6) k.SUB(shot.cap, cx, L.H - 34, 15, '#ffffff', 'center'); // 영상 자막처럼: 검은 띠 없이 흰 글자에 테두리와 그림자
    if (lt < 0.25 || lt > E2.shotLen - 0.2) { k.b.globalAlpha = 0.85; R(0, 0, L.W, L.H, '#000000'); k.b.globalAlpha = 1; } // 화면 전환
  }
  if (t < 1.4) { k.b.globalAlpha = Math.max(0, 1 - t / 1.4); R(0, 0, L.W, L.H, '#ffffff'); k.b.globalAlpha = 1; } // 하얗게 날아간 화면이 걷힌다
  const G1 = '#74ff8e', b = k.b, W = L.W, HH = L.H;
  const text = (str, x, y, font, col, align, glow) => { b.font = font; b.textAlign = align; b.textBaseline = 'alphabetic'; b.shadowColor = glow || 'transparent'; b.shadowBlur = glow ? 4 * (k.S || HUD_SCALE) : 0; b.fillStyle = col; b.fillText(str, x, y); b.shadowBlur = 0; b.shadowColor = 'transparent'; };
  const lens = al => { b.globalAlpha = 0.74 * al; R(0, 0, W, HH, '#061e0e'); b.globalAlpha = 0.13 * al; for (let y = 0; y < HH; y += 1.5) R(0, y, W, 0.5, '#000000'); b.globalAlpha = 1; };
  if (t < E2.stats) {
    if (!shot && t > E2.line1 - 1) { // 엔딩 문구: 타이틀과 같은 안경 화면. 끝나면 화면이 꺼진다
      const al = Math.min(1, (t - (E2.line1 - 1)) / 0.8), off = Math.max(0, Math.min(1, (t - (E2.stats - 1.1)) / 0.9));
      lens(al); const n = Math.floor((t - (E2.line1 - 0.8)) / 0.5);
      ['LENS-OS 0.9b', '시험 ......... 전부 통과', '사용자 ....... 확인 불가', '전원 ......... 끄는 중'].slice(0, Math.max(0, Math.min(4, n))).forEach((ln, i) => text(ln, 65, 60 + i * 15.6, `400 ${12.5 * BOOT_K}px ${BOOT_FONT}`, G1, 'left', '#0a4018'));
      const big = (str, y, a2) => { if (a2 <= 0) return; b.globalAlpha = a2; if (PXF) { const f2 = `400 22px ${BOOT_FONT}`; text(str, W / 2, y + (y > 180 ? -6 : 0), f2, G1, 'center', 'rgba(116,255,142,0.55)'); if (y > 180 && Math.floor(now * 2) % 2 === 0) { b.font = f2; const hw = b.measureText(str).width / 2; R(W / 2 + hw + 4, y - 24, 11, 20, G1); } b.globalAlpha = 1; return; } const f = `400 ${31 * TITLE_K}px ${TITLE_FONT}`; text(str, W / 2 + 2, y, f, 'rgba(255,60,60,0.45)', 'center'); text(str, W / 2 - 1.5, y, f, 'rgba(60,160,255,0.4)', 'center'); text(str, W / 2, y, f, G1, 'center', '#0a4018'); b.globalAlpha = 1; };
      big('AI는 답을 알려 줍니다.', 168, fade(E2.line1, 0)); big('어디에 쓸지는 알려 주지 않습니다.', 210, fade(E2.line2, 0));
      b.textAlign = 'left'; b.drawImage(rimFor('land'), 0, 0);
      if (off > 0) { const h = HH / 2 * Math.min(1, off * 1.6), w2 = off > 0.62 ? W / 2 * Math.min(1, (off - 0.62) / 0.3) : 0; R(0, 0, W, h, '#000000'); R(0, HH - h, W, h, '#000000'); R(0, 0, w2, HH, '#000000'); R(W - w2, 0, w2, HH, '#000000'); // 브라운관처럼 가운데 한 줄로 접혔다가 점이 되어 꺼진다
        if (off > 0.55 && off < 0.98) { b.globalAlpha = 0.9; R(w2, HH / 2 - 1, W - w2 * 2, 2, '#eafff0'); b.globalAlpha = 1; } }
    }
    return [];
  }
  const a = Math.min(1, (t - E2.stats) / 0.8); // 종료 기록: 같은 안경 화면에 줄줄이
  R(0, 0, W, HH, '#000000'); b.globalAlpha = a; R(0, 0, W, HH, '#04140a'); lens(a); b.globalAlpha = a;
  const tf = `400 ${30 * TITLE_K}px ${TITLE_FONT}`; text('AI 안경으로 살아남기', W / 2 + 2, 66, tf, 'rgba(255,60,60,0.45)', 'center'); text('AI 안경으로 살아남기', W / 2 - 1.5, 66, tf, 'rgba(60,160,255,0.4)', 'center'); text('AI 안경으로 살아남기', W / 2, 66, tf, G1, 'center', '#0a4018');
  const bf = sz => `400 ${sz * BOOT_K}px ${BOOT_FONT}`, lx = W / 2 - 150, rx = W / 2 + 150; let y = 92;
  const row = (l, v, col) => { text(l, lx, y, bf(13), G1, 'left', '#0a4018'); text(v, rx, y, bf(13), col || G1, 'right', '#0a4018'); y += 16; };
  row('타임어택', info.time + (info.rank ? `  (내 기록 ${info.rank}위${info.rank === 1 ? ' · 신기록' : ''})` : ''), '#eafff0');
  for (const sp of info.splits) row(`  ${sp.name}`, sp.time);
  row('시험 응시', `${st.exams}번`); row('적발', `${st.caught}번`); row('직접 고른 답', `${st.selfQ}개`); row('AI가 고른 답', `${st.aiQ}개`, '#eafff0');
  info.records.slice(0, 2).forEach((r, i) => row(i ? '' : '내 기록 (이 기기)', `${i + 1}. ${r.name}  ${r.time}`, r.me ? '#ffe98a' : G1));
  text('이 게임은 AI와 함께 만들었습니다.', W / 2, y + 6, bf(11), '#9ad8a8', 'center', '#0a4018');
  const defs = [[info.named ? '▶ 계속하기 [ENTER]' : '▶ 석차표에 등록 [ENTER]', 'continue'], [info.named ? '석차표 보기 [N]' : '이름 남기기 [N]', 'name'], ['새 타임어택 [X]', 'wipe']], by = HH - 78, btns = []; b.font = bf(13);
  const ws = defs.map(d => Math.ceil(b.measureText(d[0]).width) + 22), tot = ws.reduce((p, c) => p + c, 0) + 12 * 2; let bx = W / 2 - tot / 2;
  defs.forEach(([lab, key], i) => { const on = i === 0 && Math.floor(now * 2) % 2 === 0; b.globalAlpha = a * (on ? 0.22 : 0.06); R(bx, by, ws[i], 24, G1); b.globalAlpha = a * (i === 0 ? 1 : 0.6); k.frame(bx, by, ws[i], 24, key === 'wipe' ? '#ffb86a' : G1, 1.5); b.globalAlpha = a; text(lab, bx + ws[i] / 2, by + 16.5, bf(13), key === 'wipe' ? '#ffb86a' : G1, 'center', '#0a4018'); btns.push({ x: bx, y: by, w: ws[i], h: 24, key }); bx += ws[i] + 12; });
  b.globalAlpha = 1; b.textAlign = 'left'; b.drawImage(rimFor('land'), 0, 0);
  return btns;
}
