// PROTOTYPE - NOT FOR PRODUCTION
// Question: 감독관 눈치를 보며 AI 안경으로 스캔하는 긴장감이, 장비와 시험이 함께 커지는 성장과 맞물려 엔딩까지 재밌나?
// Date: 2026-11-18
// 고시원 방에서 물건에 다가갔을 때의 화면: 노트북의 쇼핑몰 "AI마켓"(신상·안경·AI 기기·AI 모델 구독),
// 벽의 시험 일정표(구간별 시험 접수), 폰(알림·기록·설정). 640x360 도트 층에 그리고, 누를 수 있는 곳을 돌려준다.
// 규칙과 숫자는 game.js, 여기서는 그리기만 한다.
'use strict';

const HUBUI = (() => {
  const SHOP_TABS = [['glass', '안경'], ['aux', '보조 장비'], ['cover', '위장'], ['model', 'AI 모델']];
  const GEAR_ICON = { lens: 0, aux: 9, cover: 20 }, ICON_IMG = new Image(); ICON_IMG.src = 'assets/gear-icons.jpg'; const MODEL_IMG = new Image(); MODEL_IMG.src = 'assets/model-icons.jpg'; /* AI 모델 15종 그림 (96px 격자, 4칸씩) */ // 힉스필드로 뽑은 제품 그림 (96px 격자, 8칸씩)
  function gearIcon(k, id, lv, x, y, s) { const n = GEAR_ICON[id] + Math.max(1, lv) - 1; if (GEAR_ICON[id] == null || !ICON_IMG.complete || !ICON_IMG.naturalWidth) return false; k.b.drawImage(ICON_IMG, (n % 8) * 96, Math.floor(n / 8) * 96, 96, 96, x, y, s, s); return true; }
  const PHONE_TABS = [['news', '알림'], ['log', '기록'], ['set', '설정']];
  let btns = [], hover = null;
  const inR = (b, p) => p && p[0] >= b.x && p[0] <= b.x + b.w && p[1] >= b.y && p[1] <= b.y + b.h;
  function btn(k, x, y, w, h, label, key, o = {}) { // 누르는 칸 하나
    const hot = !o.off && inR({ x, y, w, h }, hover), col = o.col || PAL.hud;
    k.R(x, y, w, h, o.off ? '#1a1820' : o.on ? col : hot ? '#17505a' : (o.bg || '#0f3238'));
    k.frame(x, y, w, h, o.off ? '#3a3548' : hot ? PAL.white : col, 1);
    let size = o.size || 11; while (k.TW(label, size, 800) > w - 6 && size > 8) size--;
    k.T(label, x + w / 2, y + h / 2, size, o.off ? '#6d6880' : o.on ? PAL.dark : (o.fg || '#dcfdff'), 'center', 800);
    if (!o.off && key) btns.push({ x, y, w, h, key });
  }
  function fitText(k, str, maxW, size, min = 8) { while (k.TW(str, size, 700) > maxW && size > min) size--; return size; }
  function wrap(k, str, maxW, size) {
    const out = []; let cur = '';
    for (const w of String(str).split(' ')) { const t = cur ? cur + ' ' + w : w; if (k.TW(t, size, 700) <= maxW || !cur) cur = t; else { out.push(cur); cur = w; } }
    if (cur) out.push(cur); return out;
  }

  // ---- 노트북: 3D 화면 표면에 직접 그린다 (400x240, 큰 글자, 한 화면에 상품 2개) ----
  const LW = 400, LH = 240;
  function lapHead(k, title, col, bg) { k.R(0, 0, LW, 26, bg); k.T(title, 10, 13, 15, col, 'left', 800); k.T(`${won(STATE.shown)}원`, LW - 8, 13, 13, PAL.gold, 'right', 800); }
  function lapFoot(k, hv, backLabel, bg, pages, pkey) {
    k.R(0, LH - 28, LW, 28, bg);
    const out = deskOpen(); // 품절·협박 사건 전에는 바탕화면이 없는 것처럼: 뒤로 = 방으로
    btn(k, 6, LH - 24, 92, 20, out ? backLabel : '< 방으로', 'back', { bg: '#1d2433', col: '#4a5a6a', fg: '#ffffff', size: 12 });
    if (out && !G.flags.deskSeen && Math.floor(now * 2) % 2 === 0) k.disc(96, LH - 23, 5, '#e8453e'); // 바탕화면에 새 소식: 빨간 점이 깜빡인다
    if (pages > 1) { const pg = hv.page;
      btn(k, LW / 2 - 62, LH - 24, 34, 20, '<', pg > 0 ? pkey + ':-1' : null, { off: pg <= 0, bg: '#1d2433', col: '#4a5a6a', fg: '#ffffff', size: 13 });
      k.T(`${pg + 1} / ${pages}`, LW / 2, LH - 14, 12, '#5a6474', 'center', 800);
      btn(k, LW / 2 + 28, LH - 24, 34, 20, '>', pg < pages - 1 ? pkey + ':1' : null, { off: pg >= pages - 1, bg: '#1d2433', col: '#4a5a6a', fg: '#ffffff', size: 13 }); }
    const n = hv.order.length; if (n) k.T(`주문 ${n}건 · 방에 택배 옴`, LW - 8, LH - 14, 11, '#c0392b', 'right', 800);
  }
  function drawDesk(k, hv, now) {
    const { R, T } = k, C = PAL;
    for (let i = 0; i < 8; i++) R(0, i * 30, LW, 30, ['#16324a', '#183a52', '#1a425a', '#1c4a60', '#1e5266', '#205a6a', '#22626c', '#24686c'][i]);
    T('내 노트북', 10, 13, 12, '#c9e6f0', 'left', 700); T(`${won(STATE.shown)}원`, LW - 8, 13, 13, C.gold, 'right', 800);
    const icon = (ix, label, key, col, glyph, badge) => {
      const iy = 54, hot = inR({ x: ix, y: iy, w: 120, h: 126 }, hover);
      if (hot) { k.b.globalAlpha = 0.25; R(ix, iy, 120, 126, '#ffffff'); k.b.globalAlpha = 1; }
      R(ix + 24, iy + 8, 72, 72, C.dark); R(ix + 27, iy + 11, 66, 66, col); glyph(ix + 60, iy + 44);
      T(label, ix + 60, iy + 102, 16, C.white, 'center', 800);
      if (badge) { k.disc(ix + 94, iy + 12, 11, '#e8453e'); T(String(badge), ix + 94, iy + 12, 13, C.white, 'center', 800); }
      btns.push({ x: ix, y: iy, w: 120, h: 126, key });
    };
    const tgBadge = G.black || (G.flags.sold && soldOut(gearDef('lens'))) || helperPending() ? 1 : 0;
    icon(60, 'AI마켓', 'app:shop', '#0f1722', (cx, cy) => T('AI', cx, cy, 30, C.hud, 'center', 800), shopNewCount());
    icon(220, '텔레그램', 'app:tg', '#2aa3e0', (cx, cy) => k.poly([[cx - 22, cy], [cx + 22, cy - 18], [cx + 11, cy + 19], [cx - 3, cy + 7]], '#ffffff'), tgBadge);
    lapFoot(k, hv, '< 방으로', '#0d1f2c', 1);
  }
  function drawTg(k, hv, now) {
    const { R, T } = k, C = PAL;
    R(0, 0, LW, LH, '#0e1621'); lapHead(k, '텔레그램', '#5eb5f7', '#17212b');
    const want = G.flags.sold && soldOut(gearDef('lens')), done = !!G.flags.cam, bl = G.black;
    let by = 34;
    const bubble = (text, mine) => { const ls = wrap(k, text, 250, 12), bw = Math.max(...ls.map(l => k.TW(l, 12, 700))) + 16, bh = ls.length * 15 + 8, bx = mine ? LW - 10 - bw : 10;
      R(bx, by, bw, bh, mine ? '#2b5278' : '#182533'); ls.forEach((l, i) => T(l, bx + 8, by + 12 + i * 15, 12, C.white, 'left', 700)); by += bh + 5; };
    const hp = helperPending(), hl = helperLast(), hh = hp || (!want ? hl : null);
    if (!bl && hh && !(want && !hp)) { // 의문의 조력자: 정해진 시험 앞에서 먼저 연락한다
      T('의문의 조력자', 12, by - 2, 10, '#5eb5f7', 'left', 800); by += 10;
      const cost = helperCost(hh), has = tgHas(hh.id); hh.lines.slice(has ? -1 : -3).forEach(([t, mine]) => bubble(t, mine));
      if (has) { bubble('보냈어요', true); bubble(hh.done, false); T(`받은 것: ${hh.name} · ${hh.effect}`, 12, LH - 50, 10, '#8fd8a8', 'left', 800); }
      else { T(`${hh.name} · ${hh.effect}`, 12, LH - 78, 10, '#9fc4e0', 'left', 800); T(hh.need ? '이게 없으면 다음 시험을 볼 수 없다' : '없어도 시험은 볼 수 있다', 12, LH - 49, 9, hh.need ? '#ffb0b0' : '#8a9aa8', 'left', 700);
        const ok = G.money >= cost; btn(k, LW - 10 - 220, LH - 62, 220, 26, ok ? `송금 · ${won(cost)}원` : `${won(cost - G.money)}원 모자람`, ok ? 'tgbuy:' + hh.id : null, { off: !ok, bg: '#2b5278', col: '#5eb5f7', fg: '#ffffff', size: 13 }); }
      lapFoot(k, hv, '< 바탕화면', '#17212b', 1); return;
    }
    if (!want && !done && !bl) { T('새 대화가 없습니다', LW / 2, 100, 15, '#6d7f8f', 'center', 800); T('모르는 사람의 메시지는 조심하세요', LW / 2, 124, 11, '#4a5a6a', 'center', 700); }
    else if (bl) { // 다시 연락 온 브로커: 입막음비를 내거나, 제보당하거나
      bubble('사장님 오랜만. 요즘 단속 심해진 거 아시죠?', false);
      bubble(`구매자 명단이 저한테 있어요. ${won(bl.amount)}원 보내면 지워 드림. 안 보내면 제보합니다`, false);
      if (bl.seen) T('다음 시험이 끝날 때까지 답이 없으면 제보한다', LW / 2, 158, 11, PAL.warn, 'center', 800);
      const ok = G.money >= bl.amount;
      btn(k, 10, LH - 62, 150, 26, '무시 (제보당함)', 'refuse', { bg: '#2a1218', col: PAL.bad, fg: '#ffd6da', size: 12 });
      btn(k, LW - 10 - 210, LH - 62, 210, 26, ok ? `송금 · ${won(bl.amount)}원` : `${won(bl.amount - G.money)}원 모자람`, ok ? 'hush' : null, { off: !ok, bg: '#2b5278', col: '#5eb5f7', fg: '#ffffff', size: 13 });
    } else {
      bubble('초소형 카메라 찾으시죠? 한국은 다 품절이라던데', false);
      bubble('재고 있어요?', true);
      bubble(`해외 창고에 딱 남았음. 값은 좀 올랐어요. ${won(brokerCost())}원, 선입금`, false);
      if (done) { bubble('입금했어요', true); bubble('확인. 택배 보냄. 우린 모르는 사이', false); }
      else { const ok = G.money >= brokerCost(); btn(k, LW - 10 - 220, LH - 62, 220, 26, ok ? `입금하기 · ${won(brokerCost())}원` : `${won(brokerCost() - G.money)}원 모자람`, ok ? 'broker' : null, { off: !ok, bg: '#2b5278', col: '#5eb5f7', fg: '#ffffff', size: 13 }); }
    }
    lapFoot(k, hv, '< 바탕화면', '#17212b', 1);
  }
  function drawShop(k, hv, now) {
    const { R, T } = k, C = PAL;
    R(0, 0, LW, LH, '#f3f4f7'); lapHead(k, 'AI마켓', C.hud, '#0f1722');
    const fresh = shopNewCount(), tw = Math.floor((LW - 12) / 4);
    SHOP_TABS.forEach(([key, name], i) => {
      const on = hv.tab === key, bx = 6 + i * tw, label = name + (key !== 'model' && G.fresh[{ glass: 'lens', aux: 'aux', cover: 'cover' }[key]] || (key === 'model' && G.fresh.model) ? ' ●' : '');
      R(bx, 30, tw - 4, 22, on ? '#ffffff' : '#dfe3ea'); if (on) R(bx, 30, tw - 4, 3, '#e8453e');
      T(label, bx + (tw - 4) / 2, 42, 13, on ? '#1d2433' : '#5a6474', 'center', 800);
      btns.push({ x: bx, y: 30, w: tw - 4, h: 22, key: 'tab:' + key });
    });
    const list = shopItems(hv.tab), per = 2, pages = Math.max(1, Math.ceil(list.length / per)); hv.page = Math.max(0, Math.min(pages - 1, hv.page));
    const items = list.slice(hv.page * per, hv.page * per + per), top = 58, cw = 190, ch = 150;
    if (!list.length) { T(hv.tab === 'new' ? '새로 들어온 상품이 없어요' : '아직 입고된 상품이 없어요', LW / 2, 120, 15, '#5a6474', 'center', 800); T('시험에 처음 합격하면 신상이 들어와요', LW / 2, 144, 11, '#8a94a4', 'center', 700); }
    items.forEach((it, i) => {
      const cx = 6 + i * (cw + 8), cy = top, isModel = !!it.m;
      let id, name, sub, eff, isNew, label, key, off, state = '', iconLv = 0;
      if (isModel) {
        const m = it.m, cur = G.gear.model === it.i, owned = G.gear.model > it.i, next = G.gear.model + 1 === it.i, cost = modelCost(it.i), ok = G.money >= cost;
        id = 'model'; name = m.name; sub = `지능 ${it.i + 1}단계 · ${m.note}`; eff = `지금 시험 AI 정답률 ${Math.round(aiAccuracyAt(CONFIG.tiers[nextTierIndex()], it.i) * 100)}%`; isNew = it.fresh; if (isNew) markShown('model');
        if (cur) { label = '구독 중'; off = true; } else if (owned) { label = '이전 모델'; off = true; } else if (!next) { label = '앞 모델부터'; off = true; } else { label = ok ? `구독 · ${won(cost)}원` : `${won(cost - G.money)}원 모자람`; key = ok ? 'model' : null; off = !ok; }
      } else {
        const d = it.cur || it, lv = G.gear[d.id], cap = gearCap(d), count = d.kind === 'count', maxed = lv >= cap, cost = gearCost(d.id), ok = !maxed && G.money >= cost, so = soldOut(d), gone = so && G.flags.sold;
        if (it.cur) { const sl = it.lv || lv; id = d.id; name = gearName(d.id, sl); sub = `${d.name} · ${sl} / ${gearMax(d)}단계`; eff = GEAR_TEXT[d.id](sl); label = sl === lv ? '장착 중' : '보유 · 지난 제품'; off = true; iconLv = sl; } else {
        id = d.id; iconLv = maxed ? lv : lv + 1; name = count ? botName(lv + 1) : maxed ? gearName(d.id, lv) : gearName(d.id, lv + 1); sub = count ? `${d.name} · 지금 ${lv}명` : `${d.name} · ${lv ? '지금 ' + gearName(d.id, lv) : '아직 없음'}`;
        eff = GEAR_TEXT[d.id](maxed ? lv : lv + 1); isNew = !!G.fresh[d.id]; if (isNew) markShown(d.id);
        if (so) state = gone ? '품절' : '남은 재고 1개';
        if (gone) { label = '품절 · 재입고 미정'; off = true; } else if (maxed) { label = cap >= gearMax(d) ? '최고 사양 장착 중' : '다음 제품은 아직 입고 전'; off = true; } else { label = ok ? `구매 · ${won(cost)}원` : `${won(cost - G.money)}원 모자람`; key = ok ? 'buy:' + d.id : null; off = !ok; } }
      }
      R(cx, cy, cw, ch, '#ffffff'); k.frame(cx, cy, cw, ch, off ? '#d0d5de' : '#2a8f9a', 2);
      R(cx + 8, cy + 8, 46, 46, '#eef1f6'); if (isModel && MODEL_IMG.complete && MODEL_IMG.naturalWidth) k.b.drawImage(MODEL_IMG, (it.i % 4) * 96, Math.floor(it.i / 4) * 96, 96, 96, cx + 8, cy + 8, 46, 46); else if (!gearIcon(k, id, iconLv, cx + 8, cy + 8, 46)) drawGear(k, id, cx + 31, cy + 31, 38, id === 'lens' ? Math.max(1, Math.min(G.gear.lens + 1, gearCap(gearDef('lens')))) : 3); /* 촬영·표시 장비는 카드에 적힌 단계의 그림 */
      if (isNew) { R(cx + cw - 42, cy + 4, 38, 14, '#e8453e'); T('NEW', cx + cw - 23, cy + 11, 10, C.white, 'center', 800); }
      // 이름은 그림 오른쪽에 크게, 구분선 아래 효과는 검은 글씨로 또렷하게, 지금 가진 것은 맨 아래 작게
      const nl = wrap(k, name, cw - 70, 15).slice(0, 2); nl.forEach((ln, j) => T(ln, cx + 62, cy + (nl.length > 1 ? 24 : 32) + j * 18, 15, '#12161f', 'left', 800));
      if (state) { const sw2 = k.TW(state, 10, 800) + 10; R(cx + 8, cy + 58, sw2, 14, state === '품절' ? '#5a6474' : '#e8453e'); T(state, cx + 8 + sw2 / 2, cy + 65, 10, C.white, 'center', 800); }
      R(cx + 8, cy + 60 + (state ? 16 : 0), cw - 16, 1, '#dfe3ea');
      const ty = cy + 74 + (state ? 16 : 0);
      { const room = (cy + ch - 46) - (ty - 7); let fs = 12, lh = 15, ls = wrap(k, eff, cw - 16, fs); if (ls.length * lh > room) { fs = 10; lh = 12; ls = wrap(k, eff, cw - 16, fs); } // 효과 설명이 잘리지 않게: 안 들어가면 글자를 줄여 한 줄 더
        ls.slice(0, Math.max(1, Math.floor(room / lh))).forEach((ln, j) => T(ln, cx + 8, ty - (fs < 12 ? 1 : 0) + j * lh, fs, '#12161f', 'left', 700)); }
      T(sub, cx + 8, cy + ch - 40, fitText(k, sub, cw - 16, 10, 8), '#7a8494', 'left', 700);
      btn(k, cx + 6, cy + ch - 30, cw - 12, 24, label, key, { off, bg: '#e8453e', col: '#e8453e', fg: '#ffffff', size: 13 });
    });
    lapFoot(k, hv, '< 바탕화면', '#e3e6ec', pages, 'page');
  }
  function laptop(k, hv, now, hoverXY) { // 노트북 화면 한 장을 그리고 누를 수 있는 칸을 돌려준다 (화면 좌표 400x240)
    btns = []; hover = hoverXY;
    (hv.app === 'shop' ? drawShop : hv.app === 'tg' ? drawTg : drawDesk)(k, hv, now);
    const b = k.b; b.globalAlpha = 0.06; b.fillStyle = '#000000'; for (let y = 0; y < LH; y += 2) b.fillRect(0, y, LW, 0.5); // 주사선
    b.globalAlpha = 0.05; b.fillStyle = '#ffffff'; b.fillRect(0, ((now * 30) % (LH + 60)) - 30, LW, 18); b.globalAlpha = 1;
    if (STATE.note) { // 품절 같은 알림은 화면 안의 창으로 뜬다
      const w = 230, h = 104, x = (LW - w) / 2, y = (LH - h) / 2 - 6; b.globalAlpha = 0.45; k.R(0, 0, LW, LH, '#000000'); b.globalAlpha = 1;
      k.R(x + 3, y + 4, w, h, 'rgba(0,0,0,0.35)'); k.R(x, y, w, h, '#f4f5f7'); k.frame(x, y, w, h, '#8a93a3', 1); k.R(x, y, w, 22, '#dfe3ea'); k.T('AI마켓 안내', x + 10, y + 11, 12, '#3a4252', 'left', 800); k.T('×', x + w - 12, y + 11, 13, '#6a7282', 'center', 800);
      k.T(STATE.note.text, LW / 2, y + (STATE.note.sub ? 40 : 47), fitText(k, STATE.note.text, w - 24, 15, 10), '#1d2433', 'center', 800);
      if (STATE.note.sub) k.T(STATE.note.sub, LW / 2, y + 57, fitText(k, STATE.note.sub, w - 20, 10, 8), '#5a6474', 'center', 700);
      btn(k, LW / 2 - 40, y + h - 34, 80, 24, '확인', 'noteok', { bg: '#1d2433', col: '#1d2433', fg: '#ffffff', size: 13 });
    }
    if (hover) { const [mx, my] = hover; k.poly([[mx, my], [mx, my + 13], [mx + 4, my + 10], [mx + 10, my + 10]], '#101018'); k.poly([[mx + 1, my + 2], [mx + 1, my + 10], [mx + 3, my + 8], [mx + 7, my + 8]], '#ffffff'); }
    return btns;
  }

  // ---- 벽: 시험 일정표 ----
  // ---- 벽의 시험 일정표: 벽에 걸린 판 위에 직접 그린다 (400x267, 한 장에 시험 3개) ----
  const BW = 400, BH = 267;
  function pager(k, cx, y, page, pages, key, o) { // < 1 / 3 >
    btn(k, cx - 52, y, 28, 20, '<', page > 0 ? key + ':-1' : null, Object.assign({ off: page <= 0, size: 13 }, o));
    k.T(`${page + 1} / ${pages}`, cx, y + 10, 12, o.ink, 'center', 800);
    btn(k, cx + 24, y, 28, 20, '>', page < pages - 1 ? key + ':1' : null, Object.assign({ off: page >= pages - 1, size: 13 }, o));
  }
  function drawBoard(k, hv, now) {
    const { R, T } = k, C = PAL, w = BW, h = BH;
    R(0, 0, w, h, '#c79a62'); k.b.globalAlpha = 0.5; for (let i = 0; i < 90; i++) R((i * 37) % w, (i * 23) % h, 2, 2, '#b98a54'); k.b.globalAlpha = 1;
    R(8, 8, w - 16, h - 16, '#fbf9f1');
    const maxAct = CONFIG.tiers[G.unlocked - 1].act; hv.act = Math.max(1, Math.min(maxAct, hv.act || maxAct));
    R(8, 8, w - 16, 28, '#d9473f'); T(`${CONFIG.acts[hv.act - 1]} 시험 일정표`, 28, 22, 16, C.white, 'left', 800);
    if (maxAct > 1) for (let a = 1; a <= maxAct; a++) btn(k, w - 26 - (maxAct - a + 1) * 50, 12, 46, 20, CONFIG.acts[a - 1], 'act:' + a, { on: a === hv.act, bg: '#8a2a24', col: '#ffffff', fg: '#ffffff', size: 12 });
    const rows = CONFIG.tiers.map((t, i) => ({ t, i })).filter(o => o.t.act === hv.act && o.i <= G.unlocked);
    const top = 41, rh = 63, per = 3, pages = Math.max(1, Math.ceil(rows.length / per));
    if (hv.bpage == null) hv.bpage = Math.floor(rows.findIndex(o => o.i === nextTierIndex()) / per); // 처음엔 다음 시험이 있는 쪽
    hv.bpage = Math.max(0, Math.min(pages - 1, hv.bpage < 0 ? 0 : hv.bpage));
    const nt = nextTierIndex();
    rows.slice(hv.bpage * per, hv.bpage * per + per).forEach(({ t, i }, n) => {
      const ry = top + n * rh, locked = i > G.unlocked - 1, bw = 112, bx = w - 18 - bw, tw = bx - 54;
      R(13, ry, w - 26, rh - 5, i === nt ? '#fff3c8' : '#f1ede0'); k.frame(13, ry, w - 26, rh - 5, i === nt ? '#d9a02a' : '#d8d2c0', 1);
      R(19, ry + 7, 22, 18, '#2b5f8a'); T(String(i + 1), 30, ry + 16, 12, C.white, 'center', 800);
      if (locked) { T('? ? ?', 48, ry + 17, 15, '#8a8676', 'left', 800); T('앞 시험에 합격하면 공개', 48, ry + 38, 12, '#a09a88', 'left', 700); return; }
      const name = t.name + (t.boss ? ' [보스]' : ''); T(name, 48, ry + 16, fitText(k, name, tw, 15, 11), '#2a2838', 'left', 800);
      const mech = [...t.mech.filter(m => m !== 'tutorial').map(m => m === 'idcheck' && t.check === 'calc' ? MECH_NAME.calc : MECH_NAME[m]), ...t.sec.map(s => s === 'pulse' && t.pulse ? SEC_NAME[t.pulse] : SEC_NAME[s])].filter(Boolean); // 이름 없는 장치는 '유의:' 줄에서 뺀다 (쉼표만 남지 않게)
      const info = `${t.subject} · ${t.qn * (t.parts ? t.parts.length : 1)}문항`; T(info, 48, ry + 33, fitText(k, info, tw, 12, 9), '#6c6a80', 'left', 700);
      const fee = examFee(t), ok = G.money >= fee, warn = mech.length ? `유의: ${mech.join(', ')}` : fee ? `응시료 ${won(fee)}원` : '응시료 없음';
      T(warn, 48, ry + 48, fitText(k, warn, tw, 12, 9), mech.length ? '#a04a1a' : '#6c6a80', 'left', 700);
      btn(k, bx, ry + 6, bw, 28, ok ? (G.cleared[i] ? '재응시 접수' : '응시 접수') : '응시료 부족', ok ? 'exam:' + i : null, { off: !ok, bg: '#2b5f8a', col: '#2b5f8a', fg: '#ffffff', size: 13 });
      T(fee ? `응시료 ${won(fee)}원` : '응시료 없음', bx + bw, ry + 47, 11, '#6c6a80', 'right', 700);
      if (G.cleared[i]) { k.b.save(); k.b.translate(bx - 26, ry + 20); k.b.rotate(-0.12); k.frame(-24, -11, 48, 22, '#d0282a', 2); T('합격', 0, 0, 13, '#d0282a', 'center', 800); k.b.restore(); }
    });
    const dk = { bg: '#2a2838', col: '#2a2838', fg: '#ffffff', ink: '#2a2838' };
    btn(k, 14, h - 34, 84, 22, '< 방으로', 'back', Object.assign({ size: 12 }, dk));
    if (pages > 1) pager(k, w / 2, h - 33, hv.bpage, pages, 'bpage', dk);
    T(`합격 기준 ${Math.round(tune.pass_mark * 100)}점`, w - 16, h - 23, 11, '#6c6a80', 'right', 700);
    paperFx(k, { x: 0, y: 0, w, h });
  }

  // ---- 폰: 집어 든 폰의 화면에 직접 그린다 (168x270). 알림 · 기록 · 설정 ----
  const PW = 168, PH = 270;
  function drawPhone(k, hv, now) {
    const { R, T } = k, C = PAL, w = PW, h = PH;
    if (hv.tip) return drawTip(k, hv.tip.t);
    R(0, 0, w, h, '#10131c');
    R(0, 0, w, 20, '#0a0c12'); T(fmtRun(runSecs()), 7, 10.5, 11, C.hud, 'left', 800); T(`${won(STATE.shown)}원`, w - 7, 10.5, 12, C.gold, 'right', 800);
    const tw = w / 3, unread = phoneUnread(), ty = h - 48, lt = { bg: '#1c2230', col: '#4a5a6a', fg: '#ffffff', ink: '#8fa0b8' };
    PHONE_TABS.forEach(([key, name], i) => {
      const on = hv.ptab === key, bx = i * tw;
      R(bx, ty, tw, 26, on ? '#1c2230' : '#0a0c12'); if (on) R(bx, ty, tw, 2, C.hud);
      T(key === 'news' && unread ? `${name} ${unread}` : name, bx + tw / 2, ty + 14, 12, on ? C.white : '#8fa0b8', 'center', 800);
      btns.push({ x: bx, y: ty, w: tw, h: 26, key: 'ptab:' + key });
    });
    btn(k, 5, h - 20, w - 10, 17, '< 방으로', 'back', Object.assign({ size: 11 }, lt));
    const top = 24, bottom = ty - 2;
    if (hv.ptab === 'news') {
      const per = 2, list = G.news.slice().reverse(), pages = Math.max(1, Math.ceil(list.length / per)); hv.npage = Math.max(0, Math.min(pages - 1, hv.npage || 0));
      if (!list.length) T('아직 알림이 없어요', w / 2, top + 60, 12, '#8fa0b8', 'center', 700);
      list.slice(hv.npage * per, hv.npage * per + per).forEach((n, i) => {
        const ry = top + i * 85, col = { bank: '#f5cc4a', tg: '#5eb5f7', reg: '#f6a234', shop: '#e8453e', model: '#8a5cff', exam: '#2f8a3a', act: '#f5cc4a', bot: '#45e5ee' }[n.kind] || '#8fa0b8';
        R(5, ry, w - 10, 82, '#1a1f2c'); R(5, ry, 3, 82, col);
        T({ bank: '은행', tg: '텔레그램', reg: '뉴스 속보', shop: 'AI마켓', model: 'AI 속보', exam: '시험', act: '새 일정', bot: '대리 응시' }[n.kind] || '알림', 13, ry + 10, 11, col, 'left', 800);
        T(fmtRun(n.t), w - 10, ry + 10, 10, '#5a6474', 'right', 700);
        wrap(k, n.text, w - 24, 11).slice(0, 5).forEach((ln, j) => T(ln, 13, ry + 25 + j * 12.5, 11, C.white, 'left', 700));
      });
      if (pages > 1) pager(k, w / 2, bottom - 22, hv.npage, pages, 'npage', lt);
    } else if (hv.ptab === 'log') {
      const s = G.stats, recs = loadRecords(); let ry = top + 8; hv.lpage = Math.max(0, Math.min(1, hv.lpage || 0));
      const row = (a, b, col) => { const vw = k.TW(b, 11, 800); T(a, 8, ry, fitText(k, a, w - 22 - vw, 11, 8), '#8fa0b8', 'left', 700); T(b, w - 8, ry, 11, col || C.white, 'right', 800); ry += 16; };
      const head = t => { T(t, 8, ry, 12, C.hud, 'left', 800); ry += 18; };
      if (hv.lpage === 0) {
        head('타임어택');
        row(G.run.done ? '이번 기록 (완주)' : '지금까지', fmtRun(runSecs()), C.gold);
        for (let a = 1; a <= 3; a++) { const sp = actSplit(a); row(CONFIG.acts[a - 1] + ' 구간', sp.done ? fmtRun(sp.t) : `${sp.n} / ${sp.total}`, sp.done ? C.white : '#8fa0b8'); }
        row('내 최고 기록', recs.length ? fmtRun(recs[0].t) : '아직 없음', recs.length ? C.gold : '#8fa0b8');
        ry += 6; head('지금 상태');
        row('AI 모델', CONFIG.models[G.gear.model].name, C.hud);
        row('TV 빨간 등', `${'●'.repeat(G.lamps || 0)}${'○'.repeat(3 - (G.lamps || 0))}`, G.lamps >= 2 ? C.bad : G.lamps ? C.warn : C.white);
        if (botRate() > 0) row('대리 응시 수입', `초당 ${won(botRate())}원`, C.gold);
      } else {
        head('기록');
        row('시험 응시', `${s.exams}번`); row('합격·불합격·적발', `${s.passes} · ${s.fails} · ${s.caught}`); row('수석 합격(만점)', `${s.tops}번`);
        row('직접 고른 답', `${s.selfQ}개`); row('AI가 고른 답', `${s.aiQ}개`); row('낸 응시료', `${won(s.fees)}원`); row('지금까지 번 돈', `${won(s.earned)}원`, C.gold);
      }
      pager(k, w / 2, bottom - 22, hv.lpage, 2, 'lpage', lt);
    } else {
      let ry = top + 2; const b = (label, key, o) => { btn(k, 6, ry, w - 12, 23, label, key, Object.assign({ size: 11 }, o)); ry += 26; };
      b(muted ? '소리 켜기' : '소리 끄기', 'opt:mute');
      if (canFullscreen()) b(isFullscreen() ? '전체 화면 끄기' : '전체 화면 켜기 (F)', 'opt:fs');
      b(G.opts.timer ? '시험 중 시계: 켜짐' : '시험 중 시계: 꺼짐', 'opt:timer');
      if (typeof CAN_JUMP !== 'undefined' && CAN_JUMP) { // 테스트 전용: 단계 건너뛰기
        const J = STATE.jump || nextTierIndex() + 1, bw = Math.floor((w - 12 - 9) / 4); [['-5', '◀◀'], ['-1', '◀'], ['1', '▶'], ['5', '▶▶']].forEach(([d, lb], i) => btn(k, 6 + i * (bw + 3), ry, bw, 20, lb, 'jump:' + d, { size: 10 })); ry += 23;
        b(`${J}번 ${TIERS[J - 1].name.slice(0, 9)} 앞으로`, 'jump:go', { bg: '#12283a', col: '#5eb5f7', fg: '#ffffff' });
        { const bk = hasBackup(), hw = bk ? Math.floor((w - 12 - 3) / 2) : w - 12; btn(k, 6, ry, hw, 23, G.opts.rich ? '돈: 무한' : '돈: 일반', 'opt:rich', { size: 10, bg: G.opts.rich ? '#3a2c08' : undefined, col: G.opts.rich ? '#f0c53a' : undefined, fg: G.opts.rich ? '#ffe9a8' : undefined }); if (bk) btn(k, 6 + hw + 3, ry, hw, 23, '기록 되살리기', 'jump:undo', { size: 10 }); ry += 26; } }
      { const hw = Math.floor((w - 12 - 3) / 2); btn(k, 6, ry, hw, 23, '코드 복사', 'save:export', { size: 10 }); btn(k, 6 + hw + 3, ry, hw, 23, '코드 붙여넣기', 'save:import', { size: 10 }); ry += 26; } // 저장 코드: 한 줄에 둘
      b(STATE.wipeArm > 0 ? '한 번 더 누르면 지워요' : '저장 지우고 처음부터', 'wipe', { bg: '#2a1218', col: PAL.bad, fg: '#ffd6da' });
      for (const ln of ['← → 고개 · Space 스캔', '1~4 마킹 · P 정지 · M 소리', STATE.standalone ? '홈 화면 앱으로 실행 중' : STATE.ios ? '공유 → 홈 화면에 추가' : '']) { if (ln && ry + 6 < bottom) T(ln, w / 2, ry + 6, 10, '#6f7a8c', 'center', 700); ry += 12; }
    }
    const g = k.b; g.globalAlpha = 0.07; g.fillStyle = '#000000'; for (let y = 0; y < h; y += 2) g.fillRect(0, y, w, 0.5); // 주사선
    g.globalAlpha = 1; let gr = g.createLinearGradient(0, 0, w * 0.9, h); gr.addColorStop(0, 'rgba(255,255,255,0.10)'); gr.addColorStop(0.3, 'rgba(255,255,255,0.02)'); gr.addColorStop(0.31, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); // 비스듬한 반사
  }
  function drawTip(k, t) { // 브로커의 제보: 폰이 저절로 들리고 메시지가 하나씩 뜬다
    const { R, T } = k, w = PW, h = PH, b = k.b;
    R(0, 0, w, h, '#17212b'); R(0, 0, w, 30, '#232e3c'); k.disc(17, 15, 9, '#55606e'); T('장비 팔던 사람', 32, 15, 12, '#ffffff', 'left', 800); T('방금', w - 8, 15, 9, '#8fa0b8', 'right', 700);
    const msgs = [`${won(STATE.tipAmount || 0)}원. 오늘까지라고 했죠`, '답이 없으시네', '그럼 제보합니다', null, '방송국에 보냈어요 ㅎ'];
    let y = 40; const n = Math.min(msgs.length, Math.floor(t / 0.8) + 1);
    for (let i = 0; i < n; i++) { const m = msgs[i];
      if (m == null) { R(8, y, 104, 58, '#232e3c'); b.save(); b.globalAlpha = 0.9; R(12, y + 4, 96, 50, '#3a4a3a'); R(12, y + 34, 96, 20, '#6b5a48'); R(46, y + 22, 30, 22, '#e8e2d4'); R(30, y + 10, 16, 16, '#1b1d24'); R(74, y + 8, 14, 14, '#1b1d24'); for (let j = 0; j < 12; j++) R(12 + (j % 6) * 16, y + 4 + Math.floor(j / 6) * 25, 16, 25, j % 2 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.12)'); b.restore(); y += 64; continue; } // 흐릿한 시험장 사진
      const lines = wrap(k, m, 110, 11), bh = lines.length * 13 + 10; R(8, y, 126, bh, '#232e3c'); lines.forEach((ln, j) => T(ln, 15, y + 11 + j * 13, 11, '#ffffff', 'left', 700)); y += bh + 6; }
    if (t > 4.4) T('상대방이 대화방을 나갔습니다', w / 2, y + 8, 9, '#8fa0b8', 'center', 700);
    return;
  }
  const TV_IDLE = { tag: '경제', h: 'AI 안경 판매량 석 달 새 4배', s: '"없어서 못 판다" 수험가 품귀', tk: ['전자기기 반입 단속 강화', '내일 전국 흐리고 비', '환율 1,380원대'], icon: 'glass' };
  function tv(g, item, now, lit) { // 선반 위 TV 화면 (640x360). 꺼져 있으면 까만 유리, 켜지면 진짜 방송처럼
    const W = 640, H = 360, F = FONT_BODY; g.setTransform(1, 0, 0, 1, 0, 0); g.textBaseline = 'alphabetic';
    if (!lit) { let gr = g.createRadialGradient(200, 80, 10, 320, 180, 420); gr.addColorStop(0, '#24262e'); gr.addColorStop(1, '#07070a'); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.fillStyle = 'rgba(255,255,255,0.06)'; g.beginPath(); g.moveTo(40, 0); g.lineTo(190, 0); g.lineTo(90, H); g.lineTo(-60, H); g.fill(); return; }
    const it = item || TV_IDLE, br = it.tag === '속보';
    let gr = g.createRadialGradient(190, 110, 20, 320, 180, 460); gr.addColorStop(0, '#2c4f86'); gr.addColorStop(1, '#0d1c38'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(120,170,255,0.14)'; g.beginPath(); g.moveTo(70, 0); g.lineTo(190, 0); g.lineTo(50, H); g.lineTo(-70, H); g.fill(); g.beginPath(); g.moveTo(300, 0); g.lineTo(340, 0); g.lineTo(200, H); g.lineTo(160, H); g.fill();
    g.fillStyle = '#12203c'; g.fillRect(0, 232, W, 40);
    // 앵커: 얼굴 없는 실루엣
    const ax = 150, bob = Math.sin(now * 1.3) * 1.2;
    g.fillStyle = '#18213a'; g.beginPath(); g.moveTo(ax - 92, 272); g.quadraticCurveTo(ax - 88, 176, ax - 30, 168); g.lineTo(ax + 30, 168); g.quadraticCurveTo(ax + 88, 176, ax + 92, 272); g.fill();
    g.fillStyle = '#e9edf2'; g.beginPath(); g.moveTo(ax - 18, 168); g.lineTo(ax + 18, 168); g.lineTo(ax, 206); g.fill(); g.fillStyle = '#8a1f2a'; g.beginPath(); g.moveTo(ax - 5, 172); g.lineTo(ax + 5, 172); g.lineTo(ax + 7, 214); g.lineTo(ax, 224); g.lineTo(ax - 7, 214); g.fill();
    g.fillStyle = '#b98e76'; g.fillRect(ax - 13, 150 + bob, 26, 22); g.fillStyle = '#cfa88e'; g.beginPath(); g.ellipse(ax, 118 + bob, 33, 40, 0, 0, 7); g.fill();
    g.fillStyle = '#1d1a1c'; g.beginPath(); g.ellipse(ax, 96 + bob, 36, 26, 0, Math.PI, 0); g.fill(); g.fillRect(ax - 36, 94 + bob, 72, 12);
    // 자료 화면
    const px = 350, py = 44, pw = 250, ph = 158; g.fillStyle = '#e9edf2'; g.fillRect(px - 3, py - 3, pw + 6, ph + 6); g.fillStyle = '#20242c'; g.fillRect(px, py, pw, ph);
    g.save(); g.beginPath(); g.rect(px, py, pw, ph); g.clip();
    if (it.icon === 'paper') { g.fillStyle = '#6b5a48'; g.fillRect(px, py, pw, ph); g.save(); g.translate(px + 125, py + 84); g.rotate(-0.08); g.fillStyle = '#f1efe6'; g.fillRect(-62, -70, 124, 150); g.fillStyle = '#3a3948'; for (let i = 0; i < 5; i++) g.fillRect(-48, -50 + i * 22, 96 - (i % 2) * 24, 5); g.strokeStyle = '#c8242a'; g.lineWidth = 6; g.beginPath(); g.arc(20, 30, 30, 0, 7); g.stroke(); g.fillStyle = '#c8242a'; g.font = `900 26px ${F}`; g.textAlign = 'center'; g.fillText('100', 20, 40); g.restore(); }
    else if (it.icon === 'tip') { g.fillStyle = '#2a2e36'; g.fillRect(px, py, pw, ph); for (let j = 0; j < 40; j++) { g.fillStyle = ['#4a5560', '#6b5a48', '#3a4046', '#8a7a64', '#2a2e36'][(j * 7) % 5]; g.fillRect(px + (j % 8) * 32, py + Math.floor(j / 8) * 32, 32, 32); } g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(px, py + ph - 30, pw, 30); }
    else if (it.icon === 'cuffs') { g.fillStyle = '#1c2230'; g.fillRect(px, py, pw, ph); g.fillStyle = 'rgba(255,60,60,0.5)'; g.fillRect(px, py, pw / 2, ph); g.fillStyle = 'rgba(60,100,255,0.5)'; g.fillRect(px + pw / 2, py, pw / 2, ph); g.strokeStyle = '#d9dee6'; g.lineWidth = 9; g.beginPath(); g.arc(px + 96, py + 82, 30, 0, 7); g.stroke(); g.beginPath(); g.arc(px + 160, py + 82, 30, 0, 7); g.stroke(); }
    else if (it.icon === 'stamp') { g.fillStyle = '#6b5a48'; g.fillRect(px, py, pw, ph); g.fillStyle = '#f1efe6'; g.fillRect(px + 50, py + 16, 150, 130); g.save(); g.translate(px + 125, py + 84); g.rotate(-0.14); g.strokeStyle = '#1c5a9a'; g.lineWidth = 5; g.strokeRect(-58, -22, 116, 44); g.fillStyle = '#1c5a9a'; g.font = `900 26px ${F}`; g.textAlign = 'center'; g.fillText('이상 없음', 0, 10); g.restore(); }
    else { g.fillStyle = '#d8d2c6'; g.fillRect(px, py, pw, ph); g.fillStyle = '#b08a5e'; for (let j = 0; j < 8; j++) g.fillRect(px + 14 + (j % 4) * 60, py + 56 + Math.floor(j / 4) * 52, 44, 26); g.fillStyle = '#3f5f4a'; g.fillRect(px + 40, py + 10, 170, 30); g.strokeStyle = '#15161a'; g.lineWidth = 7; g.strokeRect(px + 78, py + 70, 40, 26); g.strokeRect(px + 132, py + 70, 40, 26); g.beginPath(); g.moveTo(px + 118, py + 80); g.lineTo(px + 132, py + 80); g.stroke(); }
    g.restore(); g.fillStyle = 'rgba(0,0,0,0.7)'; g.fillRect(px, py + ph - 22, 96, 22); g.fillStyle = '#ffffff'; g.font = `500 12px ${F}`; g.textAlign = 'left'; g.fillText(it.cap || '자료 화면', px + 8, py + ph - 7);
    // 방송사 표지와 시계
    g.fillStyle = '#e9edf2'; g.fillRect(18, 14, 52, 24); g.fillStyle = '#10234a'; g.font = `900 18px ${F}`; g.textAlign = 'center'; g.fillText('GSN', 44, 33); g.fillStyle = '#ffffff'; g.font = `700 14px ${F}`; g.textAlign = 'left'; g.fillText('뉴스 9', 78, 32);
    const mm = 4 + Math.floor(now / 60) % 50, ss = Math.floor(now) % 60; g.textAlign = 'right'; g.font = `700 14px ${F}`; g.fillText(`21:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`, W - 18, 32);
    // 아래 자막 띠
    gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, '#0c2a66'); gr.addColorStop(0.6, '#12409a'); gr.addColorStop(1, '#0c2a66'); g.fillStyle = gr; g.fillRect(0, 258, W, 76);
    g.fillStyle = br ? '#d6202a' : '#e9edf2'; g.fillRect(0, 232, 76, 26); g.fillStyle = br ? '#ffffff' : '#10234a'; g.font = `900 15px ${F}`; g.textAlign = 'center'; g.fillText(it.tag || '사회', 38, 251);
    g.fillStyle = '#ffffff'; g.textAlign = 'left'; let fs = 30; g.font = `900 ${fs}px ${F}`; while (g.measureText(it.h).width > W - 36 && fs > 18) { fs -= 1; g.font = `900 ${fs}px ${F}`; } g.fillText(it.h, 18, 294);
    g.fillStyle = '#cfe0ff'; fs = 16; g.font = `500 ${fs}px ${F}`; while (g.measureText(it.s).width > W - 36 && fs > 11) { fs -= 1; g.font = `500 ${fs}px ${F}`; } g.fillText(it.s, 19, 320);
    g.fillStyle = '#f1f3f6'; g.fillRect(0, 334, W, 26); const tk = (it.tk || TV_IDLE.tk).join('   ·   ') + '   ·   '; g.font = `500 13px ${F}`; const tw2 = g.measureText(tk).width, off = (now * 34) % tw2;
    g.save(); g.beginPath(); g.rect(74, 334, W - 74, 26); g.clip(); g.fillStyle = '#1a1d26'; for (let x = 84 - off; x < W; x += tw2) g.fillText(tk, x, 352); g.restore();
    g.fillStyle = '#12409a'; g.fillRect(0, 334, 74, 26); g.fillStyle = '#ffffff'; g.font = `700 13px ${F}`; g.textAlign = 'center'; g.fillText('이 시각', 37, 352);
    g.fillStyle = 'rgba(0,0,0,0.13)'; for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1);
    gr = g.createRadialGradient(W / 2, H / 2, 150, W / 2, H / 2, 420); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.5)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  }
  function surface(view, k, hv, now, hoverXY) { // 3D 표면에 그리는 화면: 노트북 · 일정표 · 폰
    if (view === 'laptop') return laptop(k, hv, now, hoverXY);
    btns = []; hover = hoverXY; (view === 'board' ? drawBoard : drawPhone)(k, hv, now); return btns;
  }

  function screenFx(k, r, now) { // 모니터 느낌: 주사선, 화소 격자, 비스듬한 반사, 가장자리 어둠, 깜빡임
    const x = Math.round(r.x), y = Math.round(r.y), w = Math.round(r.w), h = Math.round(r.h), b = k.b;
    b.save(); b.beginPath(); b.rect(x, y, w, h); b.clip();
    b.globalAlpha = 0.07; b.fillStyle = '#000000'; for (let yy = y; yy < y + h; yy += 2) b.fillRect(x, yy, w, 0.6);
    b.globalAlpha = 0.035; for (let xx = x; xx < x + w; xx += 3) b.fillRect(xx, y, 0.5, h);
    const roll = y + ((now * 46) % (h + 80)) - 40; b.globalAlpha = 0.05; b.fillStyle = '#ffffff'; b.fillRect(x, roll, w, 26); // 천천히 내려가는 밝은 띠
    let gr = b.createLinearGradient(x, y, x + w * 0.7, y + h); gr.addColorStop(0, 'rgba(255,255,255,0.10)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.02)'); gr.addColorStop(0.36, 'rgba(255,255,255,0)'); b.globalAlpha = 1; b.fillStyle = gr; b.fillRect(x, y, w, h);
    gr = b.createRadialGradient(x + w / 2, y + h / 2, h * 0.45, x + w / 2, y + h / 2, w * 0.72); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,10,0.38)'); b.fillStyle = gr; b.fillRect(x, y, w, h);
    b.globalAlpha = 0.02 + 0.015 * Math.sin(now * 50); b.fillStyle = '#9fd0ff'; b.fillRect(x, y, w, h);
    b.restore(); b.globalAlpha = 1;
    if (hover && inR({ x, y, w, h }, hover)) { const [mx, my] = hover; k.poly([[mx, my], [mx, my + 11], [mx + 3, my + 8], [mx + 8, my + 8]], '#101018'); k.poly([[mx + 1, my + 2], [mx + 1, my + 8], [mx + 3, my + 6], [mx + 5, my + 6]], '#ffffff'); } // 마우스 커서
  }
  function paperFx(k, r) { // 종이 느낌: 결, 압정, 접힌 그림자
    const x = Math.round(r.x), y = Math.round(r.y), w = Math.round(r.w), h = Math.round(r.h), b = k.b;
    b.save(); b.beginPath(); b.rect(x, y, w, h); b.clip();
    b.globalAlpha = 0.05; b.fillStyle = '#5a4020'; for (let i = 0; i < 260; i++) b.fillRect(x + (i * 97) % w, y + (i * 61) % h, 2 + (i % 5), 0.6);
    let gr = b.createLinearGradient(x, y, x, y + h); gr.addColorStop(0, 'rgba(0,0,0,0.10)'); gr.addColorStop(0.12, 'rgba(0,0,0,0)'); gr.addColorStop(0.9, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(60,30,0,0.14)'); b.globalAlpha = 1; b.fillStyle = gr; b.fillRect(x, y, w, h);
    b.globalAlpha = 0.06; b.fillStyle = '#000000'; b.fillRect(x + w / 2 - 0.5, y + 6, 1, h - 12);
    b.restore(); b.globalAlpha = 1;
    for (const px of [x + 16, x + w - 16]) { k.disc(px + 1, y + 9, 5, 'rgba(0,0,0,0.35)'); k.disc(px, y + 8, 5, '#c0392b'); k.disc(px - 1, y + 7, 2, '#f08a7a'); }
  }
  function drawMail(k, L, z) { // 우편으로 온 성적 통지표: 집어 든 종이(3D) 위에 그린다
    const doc = G.mail || G.audit; if (!doc) return null;
    if (STATE.mailImg !== doc) { const m = WORLD.mailTex(); if (G.mail) drawResultPaper(m.g, G.mail); else drawNoticePaper(m.g, G.audit); m.t.needsUpdate = true; STATE.mailImg = doc; }
    return WORLD.hubRect('mail');
  }
  function draw(k, L, hv, now, hoverXY) { // 2D 층에 그리는 건 우편뿐. 노트북·일정표·폰은 3D 표면(surface)에 그린다
    btns = []; hover = hoverXY; let rect = null;
    const z = hv.zoom * hv.zoom * (3 - 2 * hv.zoom);
    if (hv.view === 'mail') rect = drawMail(k, L, z);
    else rect = WORLD.hubRect(hv.view);
    return { btns, rect };
  }
  return { draw, laptop, surface, tv, LW, LH, BW, BH, PW, PH };
})();
