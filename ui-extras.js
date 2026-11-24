// PROTOTYPE - NOT FOR PRODUCTION
// 테스트판 편의 기능. 게임 본체 파일(game.js · art.js · exam-art.js)은 고치지 않고, 그 함수들을 감싸서 덧붙인다.
//  1) 시험·고시원 화면 왼쪽 위 작은 버튼 둘(소리 · 일시정지). 결과 화면은 소리만. 소리 끔은 이 기기에 기억한다
//  2) 뒤로 가기: 게임 중에는 일시정지 창을 열고, 창에서 다시 누르면 닫는다. 타이틀에서는 원래대로 사이트를 나간다
//  3) 일시정지 창: 계속하기 · 소리 · 타이틀로. 시험 중에 타이틀로 가려면 두 번 눌러야 하고, 그 시험은 포기(점수 없음, 낸 응시료는 그대로)
//  4) 첫 시험 조작 안내는 안경 HUD 모양(초록 꺾쇠). 손가락이면 누를 자리, PC(키보드)면 키와 '어느 키' 힌트. ?guide=old 는 예전 흰 고리
//  5) 자막은 넷플릭스(OTT) 모양: 흰 보통 굵기 글자 + 얇은 테두리 + 옅은 그림자. 글꼴(Pretendard Medium)을 게임에 넣어 기기마다 같게.
//     주소에 ?sub=orig 를 붙이면 원래 자막, ?sub=film|docu|tv|vhs|scope 는 다른 시안 미리 보기
'use strict';
(function () {
  if (typeof scenes === 'undefined' || typeof makeKit !== 'function' || !scenes.pause) return;
  const Q = new URLSearchParams(location.search);

  // ---- 5) 자막 글씨: 넷플릭스(OTT) 모양이 기본. ?sub=orig 원래 자막, ?sub=film|docu|tv|vhs|scope 다른 시안 ----
  const GOTHIC = FONT_SUB, SERIF = '"Noto Serif KR","AppleMyungjo","Apple Myungjo","Noto Serif CJK KR","Batang","바탕",serif';
  const SUBS = { // sh: [x, y, 번짐, 색] (화면 1칸 단위)
    ott: { font: GOTHIC, web: '"aig-sub",', w: 500, k: 1.02, fill: '#ffffff', stroke: 0.9, sCol: 'rgba(0,0,0,0.9)', sh: [0, 0.8, 2.5, 'rgba(0,0,0,0.8)'] }, // 넷플릭스·OTT: 흰 글자, 얇은 테두리 + 옅은 그림자
    film: { font: GOTHIC, w: 400, k: 1.0, fill: '#f2eee4', sp: 0.06, sh: [0, 1, 5, 'rgba(0,0,0,0.95)'], twice: true }, // 극장 영화: 가는 글자, 자간 넓게, 테두리 없이 번진 그림자
    docu: { font: SERIF, w: 500, k: 1.0, fill: '#ffffff', sp: 0.03, sh: [0, 1, 4, 'rgba(0,0,0,0.9)'], twice: true, name: true }, // 다큐: 명조, 말하는 사람 이름은 작게 회색
    tv: { font: GOTHIC, w: 700, k: 0.92, fill: '#ffffff', box: 'rgba(0,0,0,0.66)', pad: [7, 3] }, // 방송 자막: 글자에 맞춘 반투명 검은 상자
    vhs: { font: GOTHIC, w: 800, k: 1.0, fill: '#ffe14d', stroke: 1.8, sCol: '#000000', sh: [1, 1.5, 0, 'rgba(0,0,0,0.85)'] }, // 비디오 자막: 노란 굵은 글자 + 검은 테두리
    scope: { font: GOTHIC, w: 500, k: 0.98, fill: '#f6f6f6', band: 'rgba(0,0,0,0.9)' }, // 레터박스: 화면 아래 검은 띠 안에 흰 글자
  };
  const QSUB = Q.get('sub'), SUB = QSUB === 'orig' ? null : SUBS[QSUB] ? QSUB : 'ott';
  // 자막 글꼴 Pretendard Medium(자주 쓰는 한글 묶음, OFL)은 다 받은 '뒤에만' 쓴다. 아이폰(사파리)은 받는 중인 글꼴로 캔버스에 쓴 글자를
  // 빈칸으로 그리는데, 그 빈 그림이 글자 캐시에 남으면 그 문구가 계속 안 보인다. 받기 전에는 기기 글꼴로 그리고, 다 받으면 자막만 새로 그린다
  const SUBF = { ok: false };
  if (SUBS[SUB] && SUBS[SUB].web && typeof FontFace === 'function' && document.fonts) {
    const ff = new FontFace('aig-sub', 'url(assets/fonts/Pretendard-Medium.subset.woff2?v=1) format("woff2")', { weight: '500', style: 'normal', display: 'swap' });
    document.fonts.add(ff);
    ff.load().then(() => { SUBF.ok = true; for (const k of Array.from(TEXT_CACHE.keys())) if (String(k).startsWith('sub2|')) TEXT_CACHE.delete(k); }).catch(() => {});
  }
  function subCanvas(str, size, col, S, st) {
    const px = size * st.k * S, m = document.createElement('canvas'), g = m.getContext('2d');
    const white = /^#(fff|ffffff|f4f1e8|f2f5ee)$/i.test(col), fill = white ? st.fill : col; // 흰 자막만 시안의 색으로 (빨강·회색처럼 뜻이 있는 색은 그대로)
    let name = null, body = str; if (st.name) { const mm = /^([^:"]{1,12}):\s*(.+)$/.exec(str); if (mm) { name = mm[1]; body = mm[2]; } }
    const fam = (st.web && SUBF.ok ? st.web : '') + st.font, f1 = `${st.w} ${px}px ${fam}`, f2 = `${st.w} ${px * 0.78}px ${fam}`;
    const setF = f => { g.font = f; if ('letterSpacing' in g) g.letterSpacing = st.sp ? (st.sp * px).toFixed(1) + 'px' : '0px'; };
    setF(f1); const bw = g.measureText(body).width; let nw = 0; if (name) { setF(f2); nw = g.measureText(name).width + px * 0.45; }
    const tw = Math.ceil(nw + bw), sh = st.sh || [0, 0, 0, 'transparent'], padX = Math.ceil(((st.stroke || 0) + sh[2] + Math.abs(sh[0]) + 2 + (st.box ? st.pad[0] : 0)) * S), padY = Math.ceil(((st.stroke || 0) + sh[2] + Math.abs(sh[1]) + 2 + (st.box ? st.pad[1] : 0)) * S), h = Math.ceil(px * 1.35);
    m.width = tw + padX * 2; m.height = h + padY * 2;
    const cy = m.height / 2;
    if (st.box) { const bx = padX - st.pad[0] * S, by = cy - h / 2 - st.pad[1] * S + px * 0.06, bw2 = tw + st.pad[0] * 2 * S, bh = h + st.pad[1] * 2 * S - px * 0.12; g.fillStyle = st.box; g.beginPath(); if (g.roundRect) g.roundRect(bx, by, bw2, bh, 2 * S); else g.rect(bx, by, bw2, bh); g.fill(); }
    g.textBaseline = 'middle'; g.lineJoin = 'round';
    const run = (txt, x, f, c) => {
      setF(f);
      if (st.stroke) { g.strokeStyle = st.sCol; g.lineWidth = st.stroke * 2 * S; g.strokeText(txt, x, cy); }
      g.shadowColor = sh[3]; g.shadowOffsetX = sh[0] * S; g.shadowOffsetY = sh[1] * S; g.shadowBlur = sh[2] * S; g.fillStyle = c; g.fillText(txt, x, cy); if (st.twice) g.fillText(txt, x, cy);
      g.shadowColor = 'transparent'; g.shadowBlur = 0; g.shadowOffsetX = 0; g.shadowOffsetY = 0;
    };
    if (name) run(name, padX, f2, '#c9c9c9');
    run(body, padX + nw, f1, fill);
    m.padX = padX; m.tw = tw; return m;
  }
  const BANDS = { t: -1, s: new Set() };
  function styledSub(K) {
    if (!K || K.__sub || !SUB) return K; K.__sub = true;
    const orig = K.SUB, b = K.b, st = SUBS[SUB];
    K.SUB = function (str, x, y, size, col = '#ffffff', align = 'center') {
      if (CONFIG.sub_style !== 'film') return orig(str, x, y, size, col, align);
      str = String(str); size += 2;
      const S = K.S || HUD_SCALE, key = 'sub2|' + SUB + '|' + str + '|' + size + '|' + col + '|' + S;
      let c = TEXT_CACHE.get(key);
      if (!c) { c = subCanvas(str, size, col, S, st); if (TEXT_CACHE.size > 900) TEXT_CACHE.clear(); TEXT_CACHE.set(key, c); }
      const w = c.width / S, h = c.height / S, pd = c.padX / S, tw = c.tw / S;
      const dx = align === 'center' ? x - w / 2 : align === 'right' ? x - w + pd : x - pd;
      if (st.band && str.length > 1) { const bk = now + '|' + Math.round(y); if (BANDS.t !== now) { BANDS.t = now; BANDS.s.clear(); } if (!BANDS.s.has(bk)) { BANDS.s.add(bk); b.save(); b.fillStyle = st.band; b.fillRect(0, Math.round(y - size * 0.95), b.canvas.width / S, Math.round(size * 1.9)); b.restore(); } } // 레터박스 띠 (같은 줄에 자막이 여럿이면 띠는 한 번만)
      b.drawImage(c, Math.round(dx * S) / S, Math.round((y - h / 2) * S) / S, w, h);
      return st.box ? tw + st.pad[0] * 2 : tw;
    };
    return K;
  }
  const origMakeKit = makeKit;
  window.makeKit = function (b) { return styledSub(origMakeKit(b)); };
  if (typeof BUF !== 'undefined' && BUF) styledSub(BUF.k);
  if (typeof KITS !== 'undefined') for (const id in KITS) styledSub(KITS[id]);

  // ---- 1) 소리 끔 기억 ----
  const MK = 'ai-glasses-muted';
  try { if (localStorage.getItem(MK) === '1') muted = true; } catch (_) { }
  const origSetMuted = setMuted;
  window.setMuted = function (m) { origSetMuted(m); try { localStorage.setItem(MK, m ? '1' : '0'); } catch (_) { } };
  // 배경음 · 효과음 따로 끄기 (일시정지 창에서). 왼쪽 위 소리 버튼은 전체 끄기 그대로이고, 다시 켜면 여기서 정해 둔 대로 난다. 이 기기에 기억한다
  //  배경음 = 고시원 음악 · 마지막 시험 음악 · 타이틀 배경음 (CONFIG.sound.music 을 끈다)   효과음 = 그 밖의 모든 소리
  const BK = 'ai-glasses-bgm', SK = 'ai-glasses-sfx', SND2 = { bgm: true, sfx: true, mus: 0 };
  try { if (localStorage.getItem(BK) === '0') SND2.bgm = false; if (localStorage.getItem(SK) === '0') SND2.sfx = false; } catch (_) { }
  const MUSIC0 = !(CONFIG.sound && CONFIG.sound.music === false);
  const applyBgm = () => { if (CONFIG.sound) CONFIG.sound.music = MUSIC0 && SND2.bgm; };
  applyBgm();
  function setBgm(on) { SND2.bgm = on; applyBgm(); try { localStorage.setItem(BK, on ? '1' : '0'); } catch (_) { } }
  function setSfx(on) { SND2.sfx = on; try { localStorage.setItem(SK, on ? '1' : '0'); } catch (_) { } }
  window.__music = f => { SND2.mus++; try { return f(); } finally { SND2.mus--; } }; // 이 안에서 나는 소리는 배경음으로 친다 (타이틀 배경음이 쓴다)
  { const t0 = toneAt, n0 = noiseAt; // 효과음을 껐으면 배경음이 아닌 소리는 내지 않는다
    window.toneAt = function () { if (!SND2.sfx && !SND2.mus) return; return t0.apply(this, arguments); };
    window.noiseAt = function () { if (!SND2.sfx && !SND2.mus) return; return n0.apply(this, arguments); };
    if (typeof soundHub === 'function') { const h0 = soundHub; window.soundHub = function () { SND2.mus++; try { return h0.apply(this, arguments); } finally { SND2.mus--; } }; }
    if (typeof soundExam === 'function') { const e0 = soundExam; window.soundExam = function () { // 시험장 소리: 시계·연필·기침은 효과음, 마지막 시험 음악은 배경음
      if (SND2.sfx) return e0.apply(this, arguments); const a = CONFIG.sound.amb; CONFIG.sound.amb = false; SND2.mus++; try { return e0.apply(this, arguments); } finally { SND2.mus--; CONFIG.sound.amb = a; } }; } }

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
    if (pressed('KeyP') || pressed('Escape') || pressed('Enter')) key = 'resume'; else if (pressed('KeyT')) key = 'title'; else if (pressed('KeyB')) key = 'bgm'; else if (pressed('KeyS')) key = 'sfx';
    const exam = STATE.pauseFrom !== 'hub';
    if (key === 'resume') resumePause();
    else if (key === 'sound') { setMuted(!muted); if (!muted) sfx.flip(); }
    else if (key === 'bgm') { if (muted) setMuted(false); setBgm(!SND2.bgm); sfx.flip(); }
    else if (key === 'sfx') { if (muted) setMuted(false); setSfx(!SND2.sfx); sfx.flip(); }
    else if (key === 'title') { if (exam && !(STATE.pauseArm > 0)) { STATE.pauseArm = 3; sfx.no(); } else toTitle(exam); }
  };
  scenes.pause.draw = function (B) {
    const exam = STATE.pauseFrom !== 'hub';
    if (exam) { WORLD.renderExam(E, now); drawExamHud(B.k, B.L, E, now, hudSet()); } else scenes.hub.draw(B);
    BTNS = drawPauseMenu(B.k, B.L, now, { exam, muted, bgm: SND2.bgm && !muted, sfx: SND2.sfx && !muted, arm: STATE.pauseArm || 0, touch: STATE.touchUI, hover: STATE.hover });
  };
  function drawPauseMenu(k, L, now, o) { // 기존 초록 일시정지 화면 위에 버튼 셋
    const b = k.b, W = L.W, R = k.R, G1 = '#74ff8e', RD = '#ff6a6a', btns = [];
    drawLensScreen(k, L, now, { col: G1, glow: '#0a4018', tint: '#061e0e', big: '일시정지', y: 150, lines: o.exam ? ['LENS-OS 0.9b', '시험 ......... 멈춤', '감독관 ....... 멈춤'] : ['LENS-OS 0.9b', '고시원 ....... 멈춤'] });
    const text = (str, x, y, size, col, glow) => { b.font = `400 ${size * BOOT_K}px ${BOOT_FONT}`; b.textAlign = 'center'; b.textBaseline = 'alphabetic'; b.shadowColor = glow || 'transparent'; b.shadowBlur = glow ? 4 * (k.S || HUD_SCALE) : 0; b.fillStyle = col; b.fillText(str, x, y); b.shadowBlur = 0; b.shadowColor = 'transparent'; };
    const armed = o.exam && o.arm > 0, defs = [['▶ 계속하기', 'P', 'resume'], [o.bgm ? '배경음 켜짐' : '배경음 꺼짐', 'B', 'bgm'], [o.sfx ? '효과음 켜짐' : '효과음 꺼짐', 'S', 'sfx'], [armed ? '한 번 더: 시험 포기' : '타이틀로', 'T', 'title']];
    const bw = 138, bh = 30, gap = 10, x0 = W / 2 - (bw * defs.length + gap * (defs.length - 1)) / 2, by = 196;
    defs.forEach(([label, keyName, key], i) => {
      const bx = x0 + i * (bw + gap), red = key === 'title' && armed, col = red ? RD : G1, hot = !!o.hover && o.hover[0] >= bx && o.hover[0] <= bx + bw && o.hover[1] >= by && o.hover[1] <= by + bh;
      const off = (key === 'bgm' && !o.bgm) || (key === 'sfx' && !o.sfx);
      b.globalAlpha = red ? 0.24 : hot ? 0.2 : 0.08; R(bx, by, bw, bh, col); b.globalAlpha = off ? 0.45 : 1; k.frame(bx, by, bw, bh, col, 1.5);
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
    return scene === 'hub' ? ['sound', 'pause'] : scene === 'results' || (scene === 'title' && !(STATE.rank && STATE.rank.k > 0)) ? ['sound'] : []; // 타이틀에도 소리 버튼 (꺼 둔 소리가 기억돼 있으면 여기서 바로 보이게)
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
  for (const name of ['play', 'hub', 'results', 'title']) {
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

  // ---- 6) 소리 깨우기: 브라우저는 손가락을 누르는 순간이 아니라 '뗄 때'(pointerup·touchend·click)를 허락으로 친다.
  //      게임은 누를 때만 소리를 켜서 휴대폰에서는 첫 터치 소리가 늦거나 빠졌다. 뗄 때도 깨우고, 다른 앱에 다녀오면 다시 깨운다 ----
  const wake = () => { startAudio(); try { if (audio && audio.ac.state !== 'running' && audio.ac.state !== 'closed') audio.ac.resume(); } catch (_) { } };
  for (const ev of ['pointerup', 'touchend', 'click', 'keyup']) addEventListener(ev, wake, { capture: true, passive: true });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && audio) wake(); });

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
  if (typeof drawExamOverlays === 'function') { // 첫 시험 조작 안내: 흰 고리·키보드 그림 대신 안경 HUD 모양 (초록 모서리 꺾쇠 + 어두운 판 + HUD 글자). 손가락이면 누를 자리, PC면 키
    const origOv = drawExamOverlays;
    window.drawExamOverlays = function (k, L, E0, now0, H) {
      const gd = E0 && E0.guide;
      if (!gd || gd.k === 'end' || Q.get('guide') === 'old') return origOv.apply(this, arguments);
      E0.guide = null; try { origOv.apply(this, arguments); } finally { E0.guide = gd; }
      if (!E0.caught && !E0.over && E0.start <= 0) (STATE.touchUI ? touchGuide : keyGuide)(k, L, gd, now0);
    };
  }
  const HG = '#74ff8e', HD = '#04160c', HHI = '#c8ffd8';
  function brackets(k, x, y, w, h, p, col) { // 네 모서리 꺾쇠. p만큼 바깥으로 숨 쉬듯 벌어진다
    const R = k.R, n = 8, t = 2, x0 = x - p, y0 = y - p, x1 = x + w + p, y1 = y + h + p;
    R(x0, y0, n, t, col); R(x0, y0, t, n, col); R(x1 - n, y0, n, t, col); R(x1 - t, y0, t, n, col);
    R(x0, y1 - t, n, t, col); R(x0, y1 - n, t, n, col); R(x1 - n, y1 - t, n, t, col); R(x1 - t, y1 - n, t, n, col);
  }
  function arrow(k, cx, cy, dir, col) { // 점 그림 화살표
    const P = k.poly, R = k.R;
    if (dir === 'up') { P([[cx, cy - 9], [cx + 9, cy + 1], [cx - 9, cy + 1]], col); R(cx - 2, cy + 1, 4, 8, col); }
    else if (dir === 'left') { P([[cx - 9, cy], [cx + 1, cy - 9], [cx + 1, cy + 9]], col); R(cx + 1, cy - 2, 8, 4, col); }
    else { P([[cx + 9, cy], [cx - 1, cy - 9], [cx - 1, cy + 9]], col); R(cx - 9, cy - 2, 8, 4, col); }
  }
  function tag(k, str, cx, y, col) { const b = k.b, w = k.TW(str, 8, 700) + 10; b.globalAlpha = 0.72; k.R(Math.round(cx - w / 2), y - 7, w, 13, HD); b.globalAlpha = 1; k.M(str, cx, y, 8, col, 'center', 700); }
  function spotHud(k, cx, cy, t, label, glyph, on) { // 누를 자리: 어두운 판 + 꺾쇠 + 가운데 그림 + 아래 이름표
    const b = k.b, R = k.R, r = 25, p = on ? 0 : Math.round(2 + 2 * Math.sin(t * 5)), blink = Math.floor(t * 3) % 2 === 0;
    b.globalAlpha = on ? 0.3 : 0.55; R(cx - r, cy - r, r * 2, r * 2, on ? HG : HD); b.globalAlpha = 1;
    brackets(k, cx - r, cy - r, r * 2, r * 2, p, HG);
    if (glyph === 'hold') { R(cx - 12, cy - 1, 7, 2, HG); R(cx + 5, cy - 1, 7, 2, HG); R(cx - 1, cy - 12, 2, 7, HG); R(cx - 1, cy + 5, 2, 7, HG); if (on || blink) R(cx - 3, cy - 3, 6, 6, on ? HHI : HG); }
    else arrow(k, cx, cy, glyph, blink ? HHI : HG);
    tag(k, label, cx, cy + r + 13, on ? HHI : HG);
  }
  function touchGuide(k, L, gd, t) {
    const W = L.W, HH = L.H, cap = s => k.SUB(s, W / 2, HH - 30, 22, '#ffffff', 'center');
    if (gd.k === 'hold') { spotHud(k, 372, 196, t, gd.on ? '읽는 중' : '꾹 누르기', 'hold', gd.on); cap('책상을 꾹 누르면 카메라가 문제를 읽는다'); }
    else if (gd.k === 'up') { spotHud(k, W / 2, 46, t, '정면 보기', 'up', false); cap('화면 위쪽을 누르면 정면을 본다'); }
    else if (gd.k === 'sides') { spotHud(k, 51, 173, t, '왼쪽 보기', 'left', false); spotHud(k, W - 51, 173, t, '오른쪽 보기', 'right', false); cap('양옆을 누르면 그쪽으로 고개를 돌린다'); }
  }
  function keyGuide(k, L, gd, t) {
    const W = L.W, HH = L.H, held = c => down.has(c), cap = s => k.SUB(s, W / 2, HH - 30, 22, '#ffffff', 'center');
    if (gd.k === 'hold') { keyHud(k, W / 2, HH - 78, 'SPACE', 110, gd.on, t, gd.on ? '읽는 중' : '꾹 누르기'); cap('Space를 꾹 누르면 카메라가 문제를 읽는다'); }
    else if (gd.k === 'up') { keyHud(k, W / 2, 42, 'up', 36, held('ArrowUp') || held('KeyW'), t, '정면 보기'); cap('↑ 키를 누르면 정면을 본다'); }
    else if (gd.k === 'sides') { keyHud(k, 51, 173, 'left', 36, held('ArrowLeft') || held('KeyA'), t, '왼쪽 보기'); keyHud(k, W - 51, 173, 'right', 36, held('ArrowRight') || held('KeyD'), t, '오른쪽 보기'); cap('← → 키를 누르면 그쪽으로 고개를 돌린다'); }
  }
  function keyHud(k, cx, cy, label, w, isDown, t, name) { // 키: HUD 창 모양 (어두운 판, 얇은 초록 테두리, 왼쪽 굵은 줄). 누르면 초록으로 찬다
    const b = k.b, R = k.R, h = 26, x = Math.round(cx - w / 2), y = Math.round(cy - h / 2), p = isDown ? 0 : Math.round(2 + 2 * Math.sin(t * 5)), ink = isDown ? HD : HG;
    b.globalAlpha = isDown ? 0.92 : 0.72; R(x, y, w, h, isDown ? HG : HD); b.globalAlpha = 1;
    k.frame(x, y, w, h, HG, 1); R(x, y, 2, h, HG); brackets(k, x - 3, y - 3, w + 6, h + 6, p, HG);
    if (label.length > 2 && label === label.toUpperCase()) { k.M(label, cx, cy + 0.5, 11, ink, 'center', 700); if (!isDown && Math.floor(t * 3) % 2 === 0) R(x + w - 9, y + 5, 3, 3, HG); }
    else arrow(k, cx, cy, label, ink);
    tag(k, name, cx, y + h + 15, isDown ? HHI : HG);
  }
})();
