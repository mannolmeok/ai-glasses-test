// PROTOTYPE - NOT FOR PRODUCTION
// 테스트판 편의 기능. 게임 본체 파일(game.js · art.js · exam-art.js)은 고치지 않고, 그 함수들을 감싸서 덧붙인다.
//  1) 시험·고시원 화면 왼쪽 위 작은 버튼 둘(소리 · 일시정지). 결과 화면은 소리만. 소리 끔은 이 기기에 기억한다
//  2) 뒤로 가기: 게임 중에는 일시정지 창을 열고, 창에서 다시 누르면 닫는다. 타이틀에서는 원래대로 사이트를 나간다
//  3) 일시정지 창: 계속하기 · 소리 · 타이틀로. 시험 중에 타이틀로 가려면 두 번 눌러야 하고, 그 시험은 포기(점수 없음, 낸 응시료는 그대로)
//  4) PC(키보드·마우스)에서는 첫 시험 조작 안내와 힌트를 '화면 어디를 누르기' 대신 '어느 키'로 보여 준다
//  5) 자막 글꼴은 그대로 두고, 게임 화면 점 칸으로 찍어 테두리·그림자까지 점으로 그린다 (HUD의 도트 느낌과 맞춘다)
'use strict';
(function () {
  if (typeof scenes === 'undefined' || typeof makeKit !== 'function' || !scenes.pause) return;
  const Q = new URLSearchParams(location.search);

  // ---- 5) 점 자막 ----
  function subPixel(str, size, col, g) { // 자막 글꼴을 점 칸(g = 화면 1칸에 점 몇 개)으로 찍고, 점 하나 굵기 검은 테두리 + 아래 그림자
    const px = Math.round(size * g), pad = 3, f = `700 ${px}px ${FONT_SUB}`, m = document.createElement('canvas'), mg = m.getContext('2d'); mg.font = f;
    const tw = Math.ceil(mg.measureText(str).width), h = Math.ceil(px * 1.45);
    m.width = tw + pad * 2; m.height = h + pad * 2; mg.font = f; mg.textBaseline = 'middle'; mg.fillStyle = '#ffffff'; mg.fillText(str, pad, pad + h / 2);
    const id = mg.getImageData(0, 0, m.width, m.height), d = id.data, thr = g === 1 ? 100 : 110; // 반투명 가장자리를 없애 점만 남긴다 (가는 획이 끊기지 않게 문턱은 낮게)
    for (let i = 3; i < d.length; i += 4) d[i] = d[i] >= thr ? 255 : 0;
    mg.putImageData(id, 0, 0);
    const tint = c2 => { const t = document.createElement('canvas'); t.width = m.width; t.height = m.height; const tg = t.getContext('2d'); tg.drawImage(m, 0, 0); tg.globalCompositeOperation = 'source-in'; tg.fillStyle = c2; tg.fillRect(0, 0, t.width, t.height); return t; };
    const o = document.createElement('canvas'); o.width = m.width; o.height = m.height; const og = o.getContext('2d');
    og.globalAlpha = 0.55; og.drawImage(tint('#000000'), 0, 2); og.globalAlpha = 1;
    const e = tint('#0b0a10'); for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [1, -1], [-1, 1]]) og.drawImage(e, dx, dy);
    og.drawImage(tint(col), 0, 0); o.pad = pad; return o;
  }
  function pixelSub(K) {
    if (!K || K.__px) return K; K.__px = true;
    const orig = K.SUB, b = K.b;
    K.SUB = function (str, x, y, size, col = '#ffffff', align = 'center') {
      if (CONFIG.sub_style !== 'film') return orig(str, x, y, size, col, align); // 검은 띠 자막은 원래대로 (도트 글꼴)
      str = String(str); size += 2;
      const S = K.S || HUD_SCALE, dp = Math.max(1, Math.round(S / 2)), g = S / dp, key = 'subpx|' + str + '|' + size + '|' + col + '|' + S; // 점 하나 = 화면 픽셀 dp개 (게임 화면 점의 반: 도트 느낌은 나고 한글 받침이 뭉개지지 않는 크기)
      let c = TEXT_CACHE.get(key);
      if (!c) { c = subPixel(str, size, col, g); if (TEXT_CACHE.size > 900) TEXT_CACHE.clear(); TEXT_CACHE.set(key, c); }
      const w = c.width / g, h = c.height / g, pd = c.pad / g, q = v => Math.round(v * g) / g; // 점 칸에 맞춰 놓아야 점이 고르게 보인다
      const sm = b.imageSmoothingEnabled; b.imageSmoothingEnabled = false;
      b.drawImage(c, q(align === 'center' ? x - w / 2 : align === 'right' ? x - w + pd : x - pd), q(y - h / 2), w, h);
      b.imageSmoothingEnabled = sm;
      return w - pd * 2;
    };
    return K;
  }
  const origMakeKit = makeKit;
  window.makeKit = function (b) { return pixelSub(origMakeKit(b)); };
  if (typeof BUF !== 'undefined' && BUF) pixelSub(BUF.k);
  if (typeof KITS !== 'undefined') for (const id in KITS) pixelSub(KITS[id]);

  // ---- 1) 소리 끔 기억 ----
  const MK = 'ai-glasses-muted';
  try { if (localStorage.getItem(MK) === '1') muted = true; } catch (_) { }
  const origSetMuted = setMuted;
  window.setMuted = function (m) { origSetMuted(m); try { localStorage.setItem(MK, m ? '1' : '0'); } catch (_) { } };

  // ---- 3) 일시정지 창 ----
  function openPause(from) { if (scene === 'pause' || (from !== 'play' && from !== 'hub')) return; STATE.pauseFrom = from; STATE.pauseArm = 0; ptrs.clear(); scene = 'pause'; }
  function resumePause() { scene = STATE.pauseFrom === 'hub' ? 'hub' : 'play'; STATE.pauseFrom = null; STATE.pauseArm = 0; ptrs.clear(); }
  function toTitle(forfeit) { // 시험 중이었다면 그 시험은 포기: 점수 없음, 낸 응시료는 돌아오지 않는다
    if (forfeit) { G.stats.forfeits = (G.stats.forfeits || 0) + 1; events.push({ type: 'forfeit', tier: E ? E.tier : -1 }); }
    E = null; STATE.titleE = null; STATE.pauseFrom = null; STATE.pauseArm = 0; STATE.titleOut = 0; if (STATE.rank) { STATE.rank.open = false; STATE.rank.k = 0; }
    ptrs.clear(); releases = []; save(); scene = 'title'; sfx.flip();
  }
  scenes.pause.update = function (dt) {
    takeReleases(); const taps = takeTaps();
    STATE.pauseArm = Math.max(0, (STATE.pauseArm || 0) - dt);
    if (needRotate()) return; // 세로로 들고 있는 동안은 멈춰 둔다
    let key = null; for (const [x, y] of taps) { const hb = hitBtn(BTNS, x, y); key = hb ? hb.key : 'resume'; } // 빈 곳을 누르면 계속
    if (pressed('KeyP') || pressed('Escape') || pressed('Enter')) key = 'resume'; else if (pressed('KeyT')) key = 'title';
    const exam = STATE.pauseFrom !== 'hub';
    if (key === 'resume') resumePause();
    else if (key === 'sound') { setMuted(!muted); if (!muted) sfx.flip(); }
    else if (key === 'title') { if (exam && !(STATE.pauseArm > 0)) { STATE.pauseArm = 3; sfx.no(); } else toTitle(exam); }
  };
  scenes.pause.draw = function (B) {
    const exam = STATE.pauseFrom !== 'hub';
    if (exam) { WORLD.renderExam(E, now); drawExamHud(B.k, B.L, E, now, hudSet()); } else scenes.hub.draw(B);
    BTNS = drawPauseMenu(B.k, B.L, now, { exam, muted, arm: STATE.pauseArm || 0, touch: STATE.touchUI, hover: STATE.hover });
  };
  function drawPauseMenu(k, L, now, o) { // 기존 초록 일시정지 화면 위에 버튼 셋
    const b = k.b, W = L.W, R = k.R, G1 = '#74ff8e', RD = '#ff6a6a', btns = [];
    drawLensScreen(k, L, now, { col: G1, glow: '#0a4018', tint: '#061e0e', big: '일시정지', y: 150, lines: o.exam ? ['LENS-OS 0.9b', '시험 ......... 멈춤', '감독관 ....... 멈춤'] : ['LENS-OS 0.9b', '고시원 ....... 멈춤'] });
    const text = (str, x, y, size, col, glow) => { b.font = `400 ${size * BOOT_K}px ${BOOT_FONT}`; b.textAlign = 'center'; b.textBaseline = 'alphabetic'; b.shadowColor = glow || 'transparent'; b.shadowBlur = glow ? 4 * (k.S || HUD_SCALE) : 0; b.fillStyle = col; b.fillText(str, x, y); b.shadowBlur = 0; b.shadowColor = 'transparent'; };
    const armed = o.exam && o.arm > 0, defs = [['▶ 계속하기', 'P', 'resume'], [o.muted ? '소리 켜기' : '소리 끄기', 'M', 'sound'], [armed ? '한 번 더: 시험 포기' : '타이틀로', 'T', 'title']];
    const bw = 150, bh = 30, gap = 12, x0 = W / 2 - (bw * 3 + gap * 2) / 2, by = 196;
    defs.forEach(([label, keyName, key], i) => {
      const bx = x0 + i * (bw + gap), red = key === 'title' && armed, col = red ? RD : G1, hot = !!o.hover && o.hover[0] >= bx && o.hover[0] <= bx + bw && o.hover[1] >= by && o.hover[1] <= by + bh;
      b.globalAlpha = red ? 0.24 : hot ? 0.2 : 0.08; R(bx, by, bw, bh, col); b.globalAlpha = 1; k.frame(bx, by, bw, bh, col, 1.5);
      text(label, bx + bw / 2 - (o.touch ? 0 : 6), by + bh / 2 + 5, 15, col, red ? 'rgba(255,90,90,0.45)' : 'rgba(116,255,142,0.45)');
      if (!o.touch) k.M(keyName, bx + bw - 11, by + bh / 2 + 0.5, 7.5, red ? '#ffb0b0' : '#c8ffd8', 'center', 700);
      btns.push({ x: bx, y: by, w: bw, h: bh, key });
    });
    if (armed) { b.globalAlpha = 0.72; R(W / 2 - 190, by + bh + 9, 380, 18, '#1a0606'); b.globalAlpha = 1; text(`이번 시험은 0점 처리되고, 낸 응시료는 돌아오지 않아요 · ${Math.ceil(o.arm)}`, W / 2, by + bh + 22, 11, '#ffb0b0', null); }
    text(o.touch ? '빈 곳을 누르면 계속' : '빈 곳 클릭 · P · Esc로 계속', W / 2, 286, 10.5, G1, '#0a4018');
    b.textAlign = 'left';
    return btns;
  }
  const hubUpd = scenes.hub.update; // 고시원도 P로 (방에서는 Esc로도) 멈춘다. 다가간 화면에서 Esc는 원래대로 '뒤로'
  scenes.hub.update = function (dt) {
    const hv = STATE.hv;
    if (!dlgOpen() && hv && !hv.tip && (pressed('KeyP') || (hv.view === 'room' && pressed('Escape')))) { takeTaps(); openPause('hub'); return; }
    return hubUpd.call(this, dt);
  };

  // ---- 1) 왼쪽 위 버튼 ----
  const cornerX0 = n => scene === 'play' && E && E.boss === 'ibank' ? 640 - 4 - (n * 26 - 4) : 4; // 보통은 왼쪽 위. 그 자리에 글자가 있는 보스전(면접)만 오른쪽 위
  function cornerKeys() {
    if (!WORLD.ok || dlgOpen() || Q.get('hud') === '0') return [];
    if (scene === 'play') return E && !E.over && !E.caught ? ['sound', 'pause'] : ['sound'];
    return scene === 'hub' ? ['sound', 'pause'] : scene === 'results' ? ['sound'] : [];
  }
  addEventListener('pointerdown', e => { // 게임보다 먼저 받는다: 이 버튼을 누른 손가락은 시험 조작(왼쪽 보기)으로 넘기지 않는다
    armBack();
    if (e.target !== canvas) return;
    const [x, y] = toBuf(e), keys = cornerKeys(), x0 = cornerX0(keys.length);
    for (let i = 0; i < keys.length; i++) {
      const id = keys[i], bx = x0 + i * 26; if (x < bx - 4 || x >= bx + 26 || y >= 32) continue; // 누르는 칸은 그림보다 넉넉하게
      e.stopImmediatePropagation(); e.preventDefault(); startAudio(); if (!Q.get('touch')) STATE.touchUI = e.pointerType !== 'mouse';
      if (id === 'sound') { setMuted(!muted); if (!muted) sfx.flip(); } else openPause(scene);
      return;
    }
  }, true);
  for (const name of ['play', 'hub', 'results']) {
    const d = scenes[name].draw;
    scenes[name].draw = function (B) { const r = d.call(this, B); const ck = cornerKeys(); if (ck.length) drawCorner(B.k, ck, muted, STATE.hover, STATE.touchUI); return r; };
  }
  function drawCorner(k, keys, mu, hover, touch) { // 점 그림 아이콘 (스피커 · 일시정지)
    const R = k.R, b = k.b, INK = '#f4f1e8', x0 = cornerX0(keys.length), right = x0 > 320;
    keys.forEach((id, i) => {
      const x = x0 + i * 26, y = 4, hot = !!hover && hover[1] < 32 && hover[0] >= x - 4 && hover[0] < x + 26;
      b.globalAlpha = hot ? 0.85 : 0.6; R(x, y, 22, 22, '#08090d'); b.globalAlpha = hot ? 0.95 : 0.5; k.frame(x, y, 22, 22, '#ffffff', 1); b.globalAlpha = 1;
      if (id === 'sound') {
        R(x + 4, y + 8, 3, 6, INK); R(x + 7, y + 7, 1, 8, INK); R(x + 8, y + 6, 1, 10, INK); R(x + 9, y + 5, 1, 12, INK);
        if (mu) for (let j = 0; j < 6; j++) { R(x + 12 + j, y + 8 + j, 2, 1, '#ff6a6a'); R(x + 17 - j, y + 8 + j, 2, 1, '#ff6a6a'); }
        else { R(x + 12, y + 9, 1, 4, INK); R(x + 11, y + 8, 1, 1, INK); R(x + 11, y + 13, 1, 1, INK); R(x + 15, y + 7, 1, 8, INK); R(x + 14, y + 6, 1, 1, INK); R(x + 14, y + 15, 1, 1, INK); }
      } else { R(x + 7, y + 6, 3, 10, INK); R(x + 12, y + 6, 3, 10, INK); }
      if (hot && !touch) { const lab = id === 'sound' ? (mu ? '소리 켜기 · M' : '소리 끄기 · M') : '일시정지 · P', w = k.TW(lab, 9, 700) + 12, lx = right ? x0 - 4 - w : x0 + keys.length * 26; b.globalAlpha = 0.78; R(lx, y + 3, w, 16, '#08090d'); b.globalAlpha = 1; k.T(lab, lx + w / 2, y + 11, 9, '#ffffff', 'center', 700); }
    });
  }

  // ---- 2) 뒤로 가기 ----
  let backArmed = false; // 뒤로 가기를 한 번 받아 둘 칸 (같은 주소를 하나 더 쌓아 둔다)
  function armBack() { if (backArmed || window.GAME_CLOCK || Q.get('manual')) return; try { history.pushState({ glassBack: 1 }, '', location.href); backArmed = true; } catch (_) { } }
  addEventListener('keydown', armBack, true);
  addEventListener('popstate', () => {
    if (!backArmed) return; backArmed = false;
    if (scene === 'title') { history.back(); return; } // 타이틀에서는 원래대로 나간다
    if (dlgOpen()) closeDialog(); else if (scene === 'pause') resumePause(); else if (scene === 'play' && E && !E.over && !E.caught) openPause('play'); else if (scene === 'hub') openPause('hub');
    armBack();
  });

  // ---- 4) PC에서는 키로 안내 ----
  const PC_HINT = {
    '서술형: 꾹 눌러 읽고 옮겨 쓰기 · 손을 떼면 지워진다 · 볼 때는 멈추기': '서술형: Space를 꾹 눌러 읽고 옮겨 쓰기 · 떼면 지워진다 · 볼 때는 멈추기',
    '화면 아무 데나 꾹 누르고 있으면 대본을 읽는다 · LIVE일 때는 떼기': 'Space를 꾹 누르고 있으면 대본을 읽는다 · LIVE일 때는 떼기',
    '화면 왼쪽(문 쪽)을 꾹 눌러 내보내기': '← 키를 꾹 눌러 내보내기 (문 쪽)',
    '왼쪽 화면을 눌러 귀 가리기': '← 키를 눌러 귀 가리기', '오른쪽 화면을 눌러 귀 가리기': '→ 키를 눌러 귀 가리기',
    '화면 왼쪽을 꾹: 대본 읽기 · 오래 보면 탈락': '← 키를 꾹: 대본 읽기 · 오래 보면 탈락',
    '가운데를 꾹: 대본 읽기 · 5초 넘게 보면 탈락': 'Space를 꾹: 대본 읽기 · 5초 넘게 보면 탈락',
    '화면 왼쪽을 꾹: 대본 읽기 · 면접관이 볼 땐 떼기 (←)': '← 키를 꾹: 대본 읽기 · 면접관이 볼 땐 떼기',
  };
  if (typeof examHint === 'function') {
    const origHint = examHint;
    window.examHint = function () { const h = origHint.apply(this, arguments); if (!h || STATE.touchUI) return h; return PC_HINT[h] || h.replace(/를 눌러 마킹 \(1~4\)$/, '를 클릭하거나 1~4 키로 마킹'); };
  }
  if (typeof drawExamOverlays === 'function') { // 첫 시험 조작 안내: 누를 자리 고리 대신 키보드 키 그림
    const origOv = drawExamOverlays;
    window.drawExamOverlays = function (k, L, E0, now0, H) {
      const gd = E0 && E0.guide;
      if (!gd || STATE.touchUI || gd.k === 'end') return origOv.apply(this, arguments);
      E0.guide = null; try { origOv.apply(this, arguments); } finally { E0.guide = gd; }
      if (!E0.caught && !E0.over && E0.start <= 0) keyGuide(k, L, gd);
    };
  }
  function keyGuide(k, L, gd) {
    const W = L.W, HH = L.H, held = c => down.has(c), cap = s => k.SUB(s, W / 2, HH - 30, 22, '#ffffff', 'center');
    if (gd.k === 'hold') { keycap(k, W / 2, HH - 76, 'SPACE', 104, gd.on); cap('Space를 꾹 누르면 카메라가 문제를 읽는다'); }
    else if (gd.k === 'up') { keycap(k, W / 2, 46, '↑', 34, held('ArrowUp') || held('KeyW')); cap('↑ 키를 누르면 정면을 본다'); }
    else if (gd.k === 'sides') { keycap(k, 51, 173, '←', 34, held('ArrowLeft') || held('KeyA')); keycap(k, W - 51, 173, '→', 34, held('ArrowRight') || held('KeyD')); cap('← → 키를 누르면 그쪽으로 고개를 돌린다'); }
  }
  function keycap(k, cx, cy, label, w, isDown) { // 키보드 키 (점 그림): 밝은 윗면과 아래 두께. 누르고 있으면 내려앉는다
    const R = k.R, h = 24, x = Math.round(cx - w / 2), y = Math.round(cy - h / 2), d = isDown ? 3 : 0;
    R(x - 2, y - 2 + d, w + 4, h + 8 - d, '#0b0a10');
    R(x, y + d + h - 2, w, 6 - d, '#8f8a7c');
    R(x, y + d, w, h - 2, '#f4f1e8'); R(x + 2, y + d + 2, w - 4, 1, '#ffffff');
    k.T(label, cx, y + d + (h - 2) / 2, label.length > 1 ? 10 : 15, '#1a1822', 'center', 800);
  }
})();
