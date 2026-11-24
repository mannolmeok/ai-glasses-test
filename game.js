// PROTOTYPE - NOT FOR PRODUCTION
// Question: 감독관 눈치를 보며 AI 안경으로 스캔하는 긴장감이, 장비와 시험이 함께 커지는 성장과 맞물려 엔딩까지 재밌나?
// Date: 2026-11-17
// 게임 규칙·장면·경제·저장. 시험 25개의 장치(입실 검사, 불시 순시, 듣기, 웹캠, 손 드는 수험생, 신분 확인, 교시, 적응형, 면접,
// 눈 피로, 테이스팅, 세 눈, 무중력, 순간이동, 늘어나는 감독관, AI 사용 감지, Ω의 박자 읽기), 합격할 때마다 풀리는 신상과 AI 모델,
// 고시원의 노트북·일정표·폰, 택배, 타임어택 기록, 전체 화면, 저장 코드.
// 스타터의 점검 고리(고정 스텝, 시계, window.game, play·figures 장면)를 그대로 둔다.
'use strict';

// ---- Built to be checked ----------------------------------------------------------------
const params = new URLSearchParams(location.search);
const tune = new Proxy({}, { get: (_, k) => CONFIG[k].value }); // live: tune.scan_time is CONFIG.scan_time.value
const STEP = 1 / 60;            // simulation step in seconds; motion is per second, never per frame
const PIXEL = true;             // pixel look: whole-number buffer, no smoothing
const FONT = FONT_KO;
const TITLE = 'AI 안경';
const CONTROLS = ['양옆·위·가운데 톡 / ← → ↑ ↓: 왼쪽·오른쪽·정면·책상 보기', '책상을 꾹 / Space: AI 스캔', '보기 누르기 / 1~4: 마킹', 'P: 일시정지', 'M: 소리', 'F: 전체 화면'];
const clock = window.GAME_CLOCK || { now: () => performance.now() / 1000 }; // a check may inject one
const CHEAP = params.get('render') === 'cheap';
const CHECKED = !!(window.GAME_CLOCK || params.get('manual') || params.get('scene') || navigator.webdriver); // 점검 중에는 전체 화면을 청하지 않는다
let seed;
function rng() { // mulberry32; every gameplay random call reads this, never Math.random
  seed = (seed + 0x6D2B79F5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), seed | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const events = []; // window.game.events
function loop(step) { events.push({ kind: 'loop', step }); } // the core loop's beats, for the check
const FORCE_VIEW = params.get('view'); // check only: hold the head turned (left|right) for a screenshot
let scene = 'title', state, G, E = null, RZ = null, now = 0;
const UA = navigator.userAgent || '';
const STATE = { shown: 0, pops: [], wipeArm: 0, away: null, note: null, hv: null, shownIds: new Set(),
  ios: /iPhone|iPod|iPad/.test(UA) || (/Macintosh/.test(UA) && navigator.maxTouchPoints > 1),
  standalone: !!(navigator.standalone || (window.matchMedia && matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches)) };
STATE.touchUI = params.get('touch') ? params.get('touch') === '1' : !!(window.matchMedia && matchMedia('(pointer: coarse)').matches); // 손가락으로 하는 중인가 (보스전 화면이 키 글자 대신 누를 자리를 그린다)
function newHubView() { return { view: 'room', target: 'room', zoom: 0, app: 'desk', tab: 'glass', page: 0, act: 0, bpage: null, ptab: 'news', npage: 0, order: [], hidden: {}, parcel: null, parcelT: 0 }; }

// ---- Numbers ---------------------------------------------------------------------------
function won(n) { // 큰 숫자는 한국식 단위로 짧게
  n = Math.floor(n);
  const t = x => (x >= 100 ? String(Math.floor(x)) : x.toFixed(x >= 10 ? 1 : 2).replace(/\.?0+$/, ''));
  if (n >= 1e20) return t(n / 1e20) + '해';
  if (n >= 1e16) return t(n / 1e16) + '경';
  if (n >= 1e12) return t(n / 1e12) + '조';
  if (n >= 1e8) return t(n / 1e8) + '억';
  if (n >= 1e4) return Math.floor(n / 1e4).toLocaleString('ko-KR') + '만';
  return n.toLocaleString('ko-KR');
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function fmtRun(sec) { // 타임어택 시계: 1:02:03 또는 12:34
  sec = Math.max(0, Math.floor(sec)); const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}
const between = (a, b) => a + rng() * (b - a);

// ---- Economy ---------------------------------------------------------------------------
const TIERS = CONFIG.tiers, LAST = TIERS.length - 1;
// 시험해 보는 전형: AI 면접. 아직 진행 순서에는 넣지 않았고, 주소에 exam=aiiv 를 붙였을 때만 토플 자리에 들어간다
const TIER_Q = (() => { const q = new URLSearchParams(location.search), i = TIERS.findIndex(t => t.id === q.get('exam')); return i >= 0 ? String(i) : q.get('tier'); })(); // ?exam=<이름> 으로도 시험을 고른다
function rewardAt(x) { // x번째 시험의 문제당 상금. 사이 값은 등비로 잇고, 범위 밖은 끝의 비율로 늘인다
  const r = i => TIERS[i].reward;
  if (x <= 0) return r(0) * Math.pow(r(1) / r(0), x);
  if (x >= LAST) return r(LAST) * Math.pow(r(LAST) / r(LAST - 1), x - LAST);
  const i = Math.floor(x); return r(i) * Math.pow(r(i + 1) / r(i), x - i);
}
function gearDef(id) { return CONFIG.gear.find(g => g.id === id); }
function actIndex() { return TIERS[G.unlocked - 1].act - 1; }      // 지금 도달한 막 (0부터)
function gearCap(d) { if (d.at) return d.at.filter(t => G.unlocked - 1 >= t).length; const c = d.caps[actIndex()]; return d.gate && !G.cleared[d.gate.tier] ? Math.min(c, d.gate.lv) : c; }                 // 이번 막에서 살 수 있는 최고 단계
function gearMax(d) { return d.at ? d.at.length : d.caps[d.caps.length - 1]; }
function gearOpen(d) { return d.at ? G.unlocked - 1 >= d.at[0] : d.unlock < 0 || !!G.cleared[d.unlock]; }
function syncGear() { // 세 줄의 사다리(안경·보조 장비·위장)에서 속 기능들의 단계를 계산한다
  const g = G.gear, L = g.lens || 0, A = g.aux || 0, C = g.cover || 0;
  Object.assign(g, { aux: A, cover: C, thirdeye: L >= 8 ? 2 : 0, clone: L >= 9 ? 3 : 0, eyedrop: L >= 6 ? 2 : 0,
    watch: A >= 6 ? 2 : A >= 1 ? 1 : 0, predict: [0, 0, 1, 1, 3, 3, 4, 4, 4, 4, 5, 6][A], earbud: A >= 7 ? 4 : A >= 5 ? 3 : A >= 3 ? 1 : 0, candle: A >= 10 ? 2 : A >= 9 ? 1 : 0, floaty: A >= 8 ? 1 : 0,
    stealth: [0, 1, 2, 2, 2, 3, 4, 6, 6, 6][C], autooff: C >= 2 ? 1 : 0, cctvjam: C >= 3 ? 2 : 0, jammer: C >= 6 ? 3 : C >= 4 ? 2 : 0, deepcam: C >= 5 ? 2 : 0, gazefix: C >= 5 ? 2 : 0, glasscase: C >= 6 ? 2 : 0, screenfilm: C >= 6 ? 2 : 0, calccover: C >= 6 ? 2 : 0, humanmod: C >= 8 ? 2 : 0, offbeat: C >= 9 ? 2 : 0,
    bot: 0, coach: 0, wide: L >= 4 ? 1 : 0, autoscan: 0, taste: 0 });
}
function gearName(id, lv) { const d = gearDef(id); return d.ladder ? d.ladder[clamp(lv, 1, d.ladder.length) - 1] : d.name; }
function botName(n) { let name = CONFIG.bot_names[0][1]; for (const [m, nm] of CONFIG.bot_names) if (n >= m) name = nm; return name; }
function bestReward() { let r = 0; G.cleared.forEach((c, i) => { if (c) r = Math.max(r, TIERS[i].reward); }); return r * tune.reward_scale; }
function costFix(ti) { const f = CONFIG.cost_fix && CONFIG.cost_fix[ti]; return f || 1; } // [돈 밸런스] 시험별 가격 보정
function gearCost(id, lv = G.gear[id]) {
  const d = gearDef(id);
  if (d.at) { const at = d.at[Math.min(lv, d.at.length - 1)]; return Math.ceil(d.mult * TIERS[Math.min(LAST, at)].base * tune.reward_scale * tune.cost_scale * costFix(at)); }
  if (d.kind === 'count') return Math.ceil(tune.bot_cost * TIERS[Math.max(0, d.unlock)].reward * tune.reward_scale * Math.pow(tune.bot_grow, lv) * tune.cost_scale); // 첫 가격은 가게에 처음 뜬 때로 고정, 살 때만 오른다
  return Math.ceil(d.mult * rewardAt(d.unlock + d.step * lv) * tune.cost_scale);
}
function modelOpen(i) { const m = CONFIG.models[i]; return !!m && (m.rel < 0 || !!G.cleared[m.rel]); }
function modelCost(i) { return Math.ceil(tune.model_cost * TIERS[Math.min(LAST, CONFIG.models[i].rel + 1)].base * tune.cost_scale * costFix(CONFIG.models[i].rel + 1)); }
function examFee(tier) { return Math.round((tier.fee != null ? tier.fee : tier.reward * tier.qn * (tier.parts ? tier.parts.length : 1) * tune.fee_ratio) * tune.fee_scale); }
function scanSecondsAt(lv) { return tune.scan_time / (1 + tune.lens_bonus * lv); }
function botMult(lv) { return Math.pow(2, CONFIG.bot_milestones.filter(m => lv >= m).length); }
function botRateAt(lv) { return lv * tune.bot_rate * bestReward() * botMult(lv); }
function botRate() { return botRateAt(G.gear.bot); }
function earbudNeedAt(lv) { return Math.max(50, tune.earbud_threshold - tune.earbud_step * (lv - 1)); }
function autoDelayAt(lv) { return tune.autoscan_delay / Math.pow(2, Math.max(0, lv - 1)); }
function jamFactor(lv, max) { return lv <= 0 ? 1 : lv >= max ? 0 : (1 - tune.jam_cut) * (max - lv) / Math.max(1, max - 1); }
function gearEdge(ti) { // [장비 우위] 이 시험이 열릴 때의 최신 장비보다 내 장비가 몇 단계 앞서 있나 (줄마다, 최대 edge_cap단계)
  const need = id => { let lv = 0; (gearDef(id).at || []).forEach((t, i) => { if (t <= ti) lv = i + 1; }); return lv; }; let mneed = 0; CONFIG.models.forEach((m, i) => { if (m.rel + 1 <= ti) mneed = i; });
  const c = v => clamp(v, 0, tune.edge_cap); return { lens: c((G.gear.lens || 0) - need('lens')), cover: c((G.gear.cover || 0) - need('cover')), model: c((G.gear.model || 0) - mneed) }; }
function gearCut(lv) { return Math.max(0, 1 - lv * tune.gear_cut); } // 시험 전용 장비: 그 장치가 남는 비율
function coachMult(lv = G.gear.coach) { return 1 + lv * tune.coach_bonus; }
function aiAccuracyAt(tier, model) { return clamp(tune.ai_base - tune.ai_drop * Math.max(0, tier.ai - model), tune.ai_floor, 0.99); }
function aiAccuracy(tier) {
  let p = aiAccuracyAt(tier, G.gear.model);
  if (tier.mech.includes('tasting')) p = clamp(p - tune.taste_need + G.gear.taste * tune.taste_bonus, tune.ai_floor, 0.99);
  if (tier.mech.includes('human')) p = tune.ai_floor;
  return p;
}
function nextTierIndex(g = G) { const i = g.cleared.findIndex(c => !c); return i < 0 ? LAST : Math.min(i, g.unlocked - 1); }
function addMoney(v, tag, text, col) {
  if (!(v > 0)) return;
  G.money += v; G.stats.earned += v;
  if (tag) STATE.pops.push({ v, t: 0, scene: tag, text, col });
}
// AI마켓 진열: 탭에 맞는 상품 목록
function shopItems(tab) {
  if (tab === 'model') return CONFIG.models.map((m, i) => ({ m, i, fresh: !!G.fresh.model && i === G.gear.model + 1 })).filter(o => modelOpen(o.i)).reverse();
  const open = CONFIG.gear.filter(d => !d.hidden && gearOpen(d) && gearCap(d) > 0);
  if (tab !== 'new') { const d = open.find(x => x.group === tab); if (!d) return []; const lv = G.gear[d.id] || 0; const out = [d]; for (let L = lv < gearCap(d) ? lv : lv - 1; L >= 1; L--) out.push({ cur: d, lv: L, id: d.id + ':' + L }); return out; } // 살 제품(또는 지금 것) 한 장 + 그동안 샀던 제품들이 뒤에 남는다 // 살 제품 한 장 + 지금 장착한 것 한 장
  const nm = G.gear.model + 1; // 신상 탭: 새로 들어온 장비 + 새로 나온 AI 모델
  return (modelNew() ? [{ m: CONFIG.models[nm], i: nm, fresh: true }] : []).concat(open.filter(d => G.fresh[d.id]));
}
function modelNew() { return !!G.fresh.model && modelOpen(G.gear.model + 1); } // 아직 안 본 새 AI 모델이 있나
function shopNewCount() { return shopItems('new').length; } // 신상 탭에 실제로 뜨는 것만 센다 (새 장비 + 새 AI 모델)
function phoneUnread() { return Math.max(0, G.news.length - G.seen); }
function markShown(id) { STATE.shownIds.add(id); }
function addNews(kind, text) { G.news.push({ kind, text, t: Math.floor(G.run.t) }); if (G.news.length > 60) { const cut = G.news.length - 60; G.news.splice(0, cut); G.seen = Math.max(0, G.seen - cut); } }
function runSecs() { return G.run.t; }
function actSplit(a) { // 그 막의 구간 기록: 막의 마지막 시험에 처음 합격한 시각
  const idx = TIERS.map((t, i) => i).filter(i => TIERS[i].act === a), n = idx.filter(i => G.cleared[i]).length, lastI = idx[idx.length - 1];
  return { n, total: idx.length, done: G.run.splits[lastI] != null, t: G.run.splits[lastI] || 0 };
}

// ---- Save ------------------------------------------------------------------------------
const SAVE_KEY = 'ai-glasses-save-v4', REC_KEY = 'ai-glasses-records-s2', /* 시즌 2: 이 기기의 기록도 새로 시작한다 (예전 기록은 예전 키에 그대로 남는다) */ BAK_KEY = SAVE_KEY + '-bak';
const NOSAVE = !!new URLSearchParams(location.search).get('scene'); // 화면 확인용 주소(?scene=…)로 연 판은 저장하지 않는다: 하던 기록을 덮어쓰지 않게
function backupSave() { try { const raw = localStorage.getItem(SAVE_KEY); if (raw) localStorage.setItem(BAK_KEY, raw); } catch (_) { } } // 기록을 갈아엎기 직전에 한 벌 남겨 둔다
function hasBackup() { try { return !!localStorage.getItem(BAK_KEY); } catch (_) { return false; } }
function newGame() {
  const gear = { model: 0 }; for (const g of CONFIG.gear) gear[g.id] = 0;
  return { v: 5, heat: 0, lamps: 0, audit: null, tv: [], tvSeen: 0, lastPass: null, black: null, money: 0, gear, unlocked: 1, cleared: TIERS.map(() => false), best: TIERS.map(() => 0),
    ended: false, endSeen: false, stats: { exams: 0, caught: 0, passes: 0, fails: 0, tops: 0, selfQ: 0, aiQ: 0, playT: 0, earned: 0, fees: 0, scans: 0 },
    hints: {}, flags: {}, pending: 0, mail: null, fresh: {}, news: [], seen: 0, run: { t: 0, splits: [], done: false, rec: 0 }, opts: { timer: false }, last: 0 };
}
function adopt(s) { // 저장된 값을 새 게임 틀에 얹는다 (빠진 칸은 기본값)
  const g = newGame(), b = newGame();
  Object.assign(g, s); g.gear = Object.assign(b.gear, s.gear || {}); g.stats = Object.assign(b.stats, s.stats || {});
  g.run = Object.assign(b.run, s.run || {}); g.opts = Object.assign(b.opts, s.opts || {});
  for (const k of ['cleared', 'best']) { g[k] = TIERS.map((_, i) => (s[k] && s[k][i]) || b[k][i]); }
  g.fresh = s.fresh || {}; g.news = Array.isArray(s.news) ? s.news : []; g.hints = s.hints || {}; g.flags = s.flags || {}; g.seen = s.seen || 0;
  g.pending = Number(s.pending) || 0; g.mail = s.mail || null; g.heat = clamp(Number(s.heat) || 0, 0, 1); g.black = s.black || null; if (g.flags && g.cleared[TIERS.findIndex(t => t.id === 'leet')]) g.flags.leet = true;
  g.lamps = s.lamps != null ? clamp(Number(s.lamps) || 0, 0, 3) : Math.min(2, Math.floor(g.heat * 3)); g.audit = s.audit || null; g.tv = Array.isArray(s.tv) ? s.tv : []; g.tvSeen = Number(s.tvSeen) || 0; g.lastPass = s.lastPass || null; // 전수조사: 예전 저장의 의심 %는 등 개수로 옮긴다
  g.unlocked = clamp(Math.floor(g.unlocked) || 1, 1, TIERS.length); g.money = Number(g.money) || 0;
  return g;
}
function save() { if (NOSAVE) return; try { G.last = Date.now(); localStorage.setItem(SAVE_KEY, JSON.stringify(G)); } catch (_) { } }
function load() { try { const raw = localStorage.getItem(SAVE_KEY); if (!raw) return null; const s = JSON.parse(raw);
    if ((Number(s.v) || 0) < 5 && !/\/ai-glasses-test(\/|$)/.test(location.pathname)) { // 예전 판(시즌 1)의 저장: 시험·장비 구성이 달라 이어 쓸 수 없다. 한 벌 따로 남겨 두고 처음부터
      try { if (!localStorage.getItem(SAVE_KEY + '-s1')) localStorage.setItem(SAVE_KEY + '-s1', raw); localStorage.removeItem(SAVE_KEY); } catch (_) { } STATE.oldSave = (s.stats && s.stats.exams > 0) || false; return null; }
    const g = adopt(s); g.v = 5; return g; } catch (_) { return null; } }
function awayEarnings() { // 저장해 둔 마지막 시각과 지금의 차이만큼 대리 응시가 번 돈 (불러올 때 한 번)
  if (!G.last || !(G.gear.bot > 0)) return;
  const secs = clamp((Date.now() - G.last) / 1000, 0, tune.away_cap);
  const gain = Math.floor(botRate() * secs * tune.away_rate);
  if (secs > 30 && gain >= 1) { addMoney(gain); STATE.away = { gain, secs, t: 0 }; }
}
// 저장 코드: 아이폰은 사파리와 홈 화면 앱의 저장소가 따로라서, 글자로 옮긴다
function saveCode() { const g = Object.assign({}, G, { news: G.news.slice(-8), seen: Math.min(G.seen, 8) }); return 'AIG4.' + btoa(unescape(encodeURIComponent(JSON.stringify(g)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function readCode(str) {
  try {
    const m = String(str).trim().match(/AIG4\.([A-Za-z0-9_-]+)/); if (!m) return null;
    const s = JSON.parse(decodeURIComponent(escape(atob(m[1].replace(/-/g, '+').replace(/_/g, '/')))));
    return s && s.v === 4 && s.gear && Array.isArray(s.cleared) ? adopt(s) : null;
  } catch (_) { return null; }
}
// 타임어택 기록 (이 기기에만)
function loadRecords() { try { const a = JSON.parse(localStorage.getItem(REC_KEY) || '[]'); return Array.isArray(a) ? a.filter(r => r && r.t > 0).sort((x, y) => x.t - y.t) : []; } catch (_) { return []; } }
function writeRecords(a) { try { localStorage.setItem(REC_KEY, JSON.stringify(a.sort((x, y) => x.t - y.t).slice(0, 20))); } catch (_) { } }
function addRecord() { // 엔딩에 처음 닿은 순간의 기록
  const a = loadRecords(), id = Date.now(), last = a.find(r => r.name && r.name !== '나');
  a.push({ id, name: (last && last.name) || '나', t: Math.round(G.run.t), date: new Date().toISOString().slice(0, 10), exams: G.stats.exams, caught: G.stats.caught, splits: [1, 2, 3].map(n => Math.round(actSplit(n).t)) });
  writeRecords(a); G.run.done = true; G.run.rec = id;
}
// ---- 온라인 석차표: 서버(Supabase)가 정해져 있으면 전체 기록, 아니면 이 기기의 기록 ----
// 전송량을 아낀다: 타이틀의 흐르는 줄은 30등까지만, 석차표를 열 때만 100등까지. 받은 것은 10분 동안 기기에 두고 다시 받지 않는다.
const NET = { rows: null, total: 0, plays: 0, at: 0, n: 0, busy: false, err: false, myRank: 0, rankFor: 0 }, NET_KEY = 'ai-glasses-ranks-s2', NET_TTL = 600, SEASON = 2, VER = 3; // 석차표 시즌: 서버의 기록은 버전 번호로 나뉜다 (ver 3 이상 = 시즌 2)
const NETOLD = { rows: null, total: 0, at: 0, busy: false, err: false }; // 지난 시즌(보관된 기록): 석차표에서 넘겨 볼 때만 받는다
function netLoadOld() { const t = Date.now() / 1000; if (!netOn() || NETOLD.busy || (NETOLD.rows && t - NETOLD.at < NET_TTL)) return; NETOLD.busy = true;
  netRpc('top_records_s', { p_limit: 100, p_season: 1 }).then(d => { NETOLD.rows = (d.rows || []).filter(x => x && x.t > 0).map(x => ({ name: [...String(x.name || '익명')].slice(0, 8).join(''), t: Number(x.t) })); NETOLD.total = Math.max(Number(d.total) || 0, NETOLD.rows.length); NETOLD.at = t; NETOLD.err = false; }).catch(() => { NETOLD.err = true; NETOLD.at = t - NET_TTL + 60; if (!NETOLD.rows) NETOLD.rows = []; }).finally(() => { NETOLD.busy = false; }); }
function netOn() { const o = CONFIG.online; return !!(o && o.url && o.key); }
const TESTSITE = /\/ai-glasses-test(\/|$)/.test(location.pathname); // 테스트용 사이트: 석차표는 보기만 하고, 기록·응시자 수·응시 횟수는 서버에 보내지 않는다
function netRpc(fn, body) { const o = CONFIG.online; if (TESTSITE && fn !== 'top_records_s' && fn !== 'rank_of_s') return Promise.resolve(fn === 'submit_record' ? { rank: 0, name: body.p_name } : fn === 'count_runs' ? body.p_n : 1); return fetch(`${o.url}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { apikey: o.key, Authorization: `Bearer ${o.key}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => { if (!r.ok) return r.json().catch(() => ({})).then(j => { const e = new Error('net ' + r.status); e.bad = r.status === 400 && /^bad /.test(String(j && j.message || '')); throw e; }); return r.json(); }); } /* bad: 서버가 기록 자체를 거절함(다시 내도 소용없음) */
function netCache() { if (NET.rows || !netOn()) return; try { const c = JSON.parse(localStorage.getItem(NET_KEY) || 'null'); if (c && Array.isArray(c.rows)) { NET.rows = c.rows; NET.total = c.total || c.rows.length; NET.plays = c.plays || 0; NET.runs = c.runs || 0; NET.at = c.at || 0; NET.n = c.n || c.rows.length; } } catch (_) { } }
function netLoad(n, force) { // n등까지 받는다. 이미 그만큼 받았고 10분이 안 지났으면 받지 않는다
  netCache(); const t = Date.now() / 1000; if (!netOn() || NET.busy || (!force && NET.rows && NET.n >= n && t - NET.at < NET_TTL)) return; NET.busy = true;
  const pend = runPending(); // 모아 둔 응시 횟수가 있으면 석차표를 받기 직전에 한꺼번에 보낸다 (따로 요청을 늘리지 않으려고)
  (pend > 0 ? netRpc('count_runs', { p_n: pend }).then(v => runPending(-(Number(v) || 0))).catch(() => { }) : Promise.resolve()).then(() => netRpc('top_records_s', { p_limit: n, p_season: SEASON })).then(d => { NET.rows = (d.rows || []).filter(x => x && x.t > 0).map(x => ({ name: [...String(x.name || '익명')].slice(0, 8).join(''), t: Number(x.t) })); NET.total = Math.max(Number(d.total) || 0, NET.rows.length); NET.plays = Number(d.plays) || 0; NET.runs = Number(d.runs) || 0; NET.at = t; NET.n = n; NET.err = false; netRetry();
    try { localStorage.setItem(NET_KEY, JSON.stringify({ rows: NET.rows, total: NET.total, plays: NET.plays, runs: NET.runs, at: NET.at, n })); } catch (_) { } }).catch(() => { NET.err = true; NET.at = t - NET_TTL + 60; }).finally(() => { NET.busy = false; }); // 실패하면 1분 뒤에 다시
}
function netRetry() { // 못 올린 기록 다시 올리기: 석차표를 받는 데 성공했을 때(서버가 살아 있을 때) 이름까지 쓴 기록 가운데 아직 못 올린 것을 하나씩 낸다
  if (!netOn() || NET.retry) return; const rec = loadRecords().find(r => r.named && !r.up && !r.rej); if (!rec) return;
  const mark = f => { const a = loadRecords(), m = a.find(r => r.id === rec.id); if (m) { f(m); writeRecords(a); } };
  if (!rec.splits) { mark(m => { m.rej = true; }); netRetry(); return; } /* 구간 기록이 없는 옛 기록은 서버가 받지 않는다 */
  NET.retry = true;
  netRpc('submit_record', { p_name: rec.name, p_t: rec.t, p_exams: rec.exams || 0, p_caught: rec.caught || 0, p_splits: rec.splits, p_ver: VER })
    .then(d => { mark(m => { m.up = true; if (d && d.rank) m.rank = Number(d.rank); if (d && d.name) m.name = d.name; }); return true; })
    .catch(e => { if (e && e.bad) { mark(m => { m.rej = true; }); return true; } return false; }) /* 거절이면 접고, 통신 실패면 다음 기회에 */
    .then(next => { NET.retry = false; if (next) netRetry(); });
}
const PLAY_KEY = 'ai-glasses-played', RUN_KEY = 'ai-glasses-runs';
function runPending(add) { // 아직 서버에 못 보낸 응시 횟수 (이 기기에 모아 둔다). add를 주면 더하거나 뺀다
  try { let v = Math.max(0, Number(localStorage.getItem(RUN_KEY)) || 0); if (add) { v = Math.max(0, Math.min(200, v + add)); localStorage.setItem(RUN_KEY, String(v)); } return v; } catch (_) { return 0; } }
function rankRuns() { return netOn() && NET.rows ? (NET.runs || 0) + runPending() : 0; } // 누적 응시 횟수: 서버의 합계 + 아직 못 보낸 내 몫
function netCountPlay() { // 이 기기가 처음으로 시험을 시작할 때 한 번: 응시자 수에 1을 더한다. 실패하면 다음에 게임을 열었을 때 다시
  if (!netOn() || NET.counted) return; NET.counted = true; try { if (localStorage.getItem(PLAY_KEY)) return; } catch (_) { return; }
  netRpc('count_play', {}).then(() => { try { localStorage.setItem(PLAY_KEY, '1'); } catch (_) { } NET.plays = (NET.plays || 0) + 1; try { const c = JSON.parse(localStorage.getItem(NET_KEY) || 'null'); if (c) { c.plays = Math.max(c.plays || 0, NET.plays); localStorage.setItem(NET_KEY, JSON.stringify(c)); } } catch (_) { } /* 받아 둔 석차표에도 적어 둔다: 새로 고쳤을 때 숫자가 도로 줄어 보이지 않게 */ }).catch(() => { });
}
function netRank(t) { if (!netOn() || NET.rankFor === t) return; NET.rankFor = t; netRpc('rank_of_s', { p_t: t, p_season: SEASON }).then(r => { NET.myRank = Number(r) || 0; }).catch(() => { NET.rankFor = 0; }); }
function netSubmit(rec) { // 내 기록을 서버의 등록 함수에 낸다. 서버가 시간·응시 횟수·구간 기록을 검사하고, 이름을 걸러서 등수와 함께 돌려준다
  return netRpc('submit_record', { p_name: rec.name, p_t: rec.t, p_exams: rec.exams || 0, p_caught: rec.caught || 0, p_splits: rec.splits || null, p_ver: VER }).then(d => { NET.myRank = Number(d.rank) || 0; NET.rankFor = rec.t; netLoad(100, true); return d; });
}
const BAD_NAMES = ['시발', '씨발', '씨바', '시바', '병신', '븅신', '좆', '존나', '졸라', '개새', '새끼', '지랄', '느금', '니애미', '애미', '애비', '창녀', '걸레', '섹스', '자지', '보지', '강간', '자살', '일베', 'fuck', 'shit', 'sex', 'bitch', 'dick', 'pussy', 'nigg', 'rape'];
function anonName(seed) { return '익명' + String(Math.abs(Math.floor(seed)) % 10000).padStart(4, '0'); }
function cleanName(v) { return [...String(v || '').replace(/[^0-9A-Za-z가-힣ㄱ-ㅎㅏ-ㅣ]/g, '')].slice(0, 8).join(''); } // 한글·영문·숫자만, 8자까지
function safeName(v, seed) { const n = cleanName(v).replace(/[ㄱ-ㅎㅏ-ㅣ]/g, ''), low = n.toLowerCase(); return !n || BAD_NAMES.some(w => low.includes(w)) ? anonName(seed) : n; } // 비었거나 금칙어면 익명 + 번호
function rankRows() { // 석차표에 올릴 줄. me: 내 기록, rank: 받아 온 목록 밖에 있을 때의 등수
  if (STATE.rank && STATE.rank.old && !STATE.rin) { netLoadOld(); return (NETOLD.rows || []).map(r => ({ name: r.name, t: r.t })); } // 지난 시즌: 보관된 기록만 (내 줄 없음)
  const a = loadRecords(), mine = a.find(r => r.id === G.run.rec) || a[0], typing = STATE.rin && STATE.rin.phase === 'type';
  if (params.get('ranks')) return ['김수험', '답안봇최고', '벼락치기', '뉴럴링코', '고시원장', '만점자', '지우개액정', '필통속폰', '군용렌즈', '재시험통과', '삼수생', '컵라면', '나', '조사관'].map((name, i) => ({ name, t: 662 + i * 37 + (i * i) % 11, me: name === '나' })); // check only
  if (netOn() && NET.rows) {
    const rows = NET.rows.map(r => ({ name: r.name, t: r.t })); netLoad(STATE.rank && STATE.rank.open || STATE.rin ? 100 : 30);
    if (mine) { const i = typing ? -1 : rows.findIndex(r => r.name === mine.name && r.t === mine.t);
      if (i >= 0) rows[i].me = true; else { rows.push({ name: mine.name, t: mine.t, me: true }); rows.sort((x, y) => x.t - y.t); const k = rows.findIndex(r => r.me); if (k >= NET.rows.length && NET.total > NET.rows.length) { if (STATE.rin || (STATE.rank && STATE.rank.open)) netRank(mine.t); rows[k].rank = (NET.rankFor === mine.t && NET.myRank) || mine.rank || NET.total + 1; } /* 목록 밖이면 등록 때 받은 등수를 쓰고, 석차표를 열었을 때만 다시 묻는다 */ } }
    return rows;
  }
  if (netOn()) netLoad(30);
  return a.map(r => ({ name: r.name || '나', t: r.t, me: r === mine }));
}
function rankTotal(rows) { return netOn() && NET.rows ? Math.max(NET.plays || 0, NET.total, rows.length) : rows.length; } // 응시자 수 = 게임을 플레이한 사람 수 (서버가 세지 않으면 등재된 기록 수)
function startRankIn() { // 엔딩 뒤: 석차표에서 내 자리에 이름을 써 넣는다
  const recs = loadRecords(), me = recs.find(r => r.id === G.run.rec); if (!me) { G.endSeen = true; save(); goHub(null); return; }
  const el = document.getElementById('nameIn'); el.value = me.name && me.name !== '나' ? me.name : '';
  STATE.rin = { phase: me.named ? 'done' : 'type', t: 0, name: el.value, msg: '' }; scene = 'rankin'; ptrs.clear(); if (netOn()) netLoad(100);
}
function updateRankIn(dt) {
  const RI = STATE.rin, el = document.getElementById('nameIn'), taps = takeTaps(); takeReleases(); RI.t += dt;
  const leave = () => { el.blur(); STATE.rin = null; G.endSeen = true; save(); goHub(null); };
  const key = (() => { for (const [x, y] of taps) { const b = hitBtn(BTNS, x, y); if (b) return b.key; } return null; })();
  if (RI.phase === 'type') {
    if (el.value !== cleanName(el.value)) el.value = cleanName(el.value); RI.name = el.value;
    if (document.activeElement !== el && !('ontouchstart' in window)) { try { el.focus({ preventScroll: true }); } catch (_) { } }
    const done = skip => { const recs = loadRecords(), me = recs.find(r => r.id === G.run.rec); el.blur(); if (!me) { leave(); return; }
      me.name = safeName(skip ? '' : RI.name, me.id); me.named = true; RI.name = me.name; writeRecords(recs); // 이름 없이 넘겨도 "익명 + 번호"로 등재한다
      const ok = skip ? '이름 없이 등록되었습니다' : '등록되었습니다';
      if (netOn()) { RI.phase = 'send'; RI.t = 0; netSubmit(me).then(d => { const r2 = loadRecords(), m2 = r2.find(r => r.id === G.run.rec); if (m2) { m2.up = true; if (d && d.rank) m2.rank = Number(d.rank); if (d && d.name) { m2.name = d.name; RI.name = d.name; } writeRecords(r2); } RI.msg = ok; }).catch(e => { if (e && e.bad) { const r2 = loadRecords(), m2 = r2.find(r => r.id === G.run.rec); if (m2) { m2.rej = true; writeRecords(r2); } } RI.msg = '서버에 올리지 못했어요 · 이 기기에는 저장됨'; }).finally(() => { if (STATE.rin === RI) { RI.phase = 'done'; RI.t = 0; } }); }
      else { RI.phase = 'done'; RI.t = 0; RI.msg = ok; }
      sfx.ai(); };
    if (key === 'rin:ok' || pressed('Enter')) done(false); else if (key === 'rin:skip' || pressed('Escape')) done(true);
  } else if (RI.phase === 'done') { if (RI.t > 0.4 && (key === 'rin:go' || pressed('Enter') || pressed('Space'))) leave(); }
}
function endingInfo() {
  const recs = loadRecords(), rank = recs.findIndex(r => r.id === G.run.rec) + 1;
  return { time: fmtRun(G.run.t), rank, splits: [1, 2, 3].map(a => ({ name: CONFIG.acts[a - 1], time: fmtRun(actSplit(a).t) })),
    records: recs.map(r => ({ name: r.name, time: fmtRun(r.t), me: r.id === G.run.rec })) };
}

// ---- Screen: 3D(world3d.js) 위에 640x360 HUD 층. 가로 한 가지, 모바일 세로는 "가로로 돌려 주세요" ----
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const worldCanvas = document.getElementById('world');
WORLD.init(worldCanvas);
let BUF = null;
function buffer() {
  if (!BUF) {
    const L = LAYOUTS.land, c = document.createElement('canvas'); c.width = L.W; c.height = L.H;
    const k = makeKit(c.getContext('2d'));
    BUF = { c, k, L, key: 'land' };
  }
  return BUF;
}
const rotateMQ = window.matchMedia ? matchMedia('(orientation: portrait) and (pointer: coarse)') : { matches: false };
function needRotate() { return rotateMQ.matches; }
let fitSig = '';
function fit() {
  if (document.body.dataset.scene !== scene) document.body.dataset.scene = scene;
  const B = buffer(), stage = document.getElementById('stage'), screen = document.getElementById('screen');
  const sw = stage.clientWidth, sh = stage.clientHeight, dpr = devicePixelRatio || 1;
  const sig = sw + 'x' + sh + '|' + dpr;
  if (sig === fitSig) return;
  fitSig = sig;
  const s = Math.max(0.1, Math.min(sw / B.L.W, sh / B.L.H));
  const k = Math.max(1, Math.ceil(s * dpr - 0.01));
  canvas.width = B.L.W * k; canvas.height = B.L.H * k;
  const hs = Math.min(k, 4); // 글자가 선명하도록 HUD 층도 화면 픽셀 수로 그린다
  if (hs !== HUD_SCALE || B.c.width !== B.L.W * hs) { HUD_SCALE = hs; TEXT_CACHE.clear(); B.c.width = B.L.W * hs; B.c.height = B.L.H * hs; }
  B.k.b.setTransform(hs, 0, 0, hs, 0, 0); B.k.b.imageSmoothingEnabled = false;
  screen.style.width = Math.floor(B.L.W * s) + 'px'; screen.style.height = Math.floor(B.L.H * s) + 'px';
  canvas.style.imageRendering = 'auto';
}
addEventListener('resize', () => { fitSig = ''; });
function hudSet() { const h = PAL.hud; return { c: h, c2: mix(h, '#0d0b13', 0.3), c3: mix(h, '#0d0b13', 0.78) }; }

// ---- 전체 화면: PC·안드로이드는 첫 입력에, 아이폰은 홈 화면 앱으로 ----------------------------
const fsRoot = document.documentElement;
function canFullscreen() { return !!(fsRoot.requestFullscreen || fsRoot.webkitRequestFullscreen) && !STATE.standalone; }
function isFullscreen() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
function enterFullscreen() {
  try {
    const p = fsRoot.requestFullscreen ? fsRoot.requestFullscreen({ navigationUI: 'hide' }) : fsRoot.webkitRequestFullscreen ? fsRoot.webkitRequestFullscreen() : null;
    const lock = () => { try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => { }); } catch (_) { } };
    if (p && p.then) p.then(lock).catch(() => { }); else lock();
  } catch (_) { }
}
function exitFullscreen() { try { (document.exitFullscreen || document.webkitExitFullscreen).call(document); } catch (_) { } }
function toggleFullscreen() { if (isFullscreen()) { STATE.fsOff = true; exitFullscreen(); } else { STATE.fsOff = false; enterFullscreen(); } }
let wake = null;
function keepAwake() { try { if (navigator.wakeLock && !wake && document.visibilityState === 'visible') navigator.wakeLock.request('screen').then(w => { wake = w; w.addEventListener('release', () => { wake = null; }); }).catch(() => { }); } catch (_) { } }
function firstGesture() { // 손을 뗄 때(브라우저가 허락하는 순간)에 전체 화면을 청한다
  if (CHECKED) return;
  keepAwake();
  if (!STATE.fsOff && canFullscreen() && !isFullscreen() && !dlgOpen()) enterFullscreen();
}
addEventListener('pointerup', firstGesture, true);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && !CHECKED) keepAwake(); });

// ---- 글자를 받는 작은 창 (저장 코드, 기록에 남길 이름) ----------------------------------------
const dlg = document.getElementById('dlg'), dlgTitle = document.getElementById('dlgTitle'), dlgText = document.getElementById('dlgText'),
  dlgInput = document.getElementById('dlgInput'), dlgArea = document.getElementById('dlgArea'), dlgOk = document.getElementById('dlgOk'), dlgCancel = document.getElementById('dlgCancel');
let dlgDone = null;
function dlgOpen() { return !!dlg && !dlg.hidden; }
function openDialog(o) {
  if (!dlg) return;
  dlgTitle.textContent = o.title; dlgText.textContent = o.text || '';
  dlgInput.hidden = !o.input; dlgArea.hidden = !o.area; dlgInput.value = o.value || ''; dlgArea.value = o.value || ''; dlgArea.readOnly = !!o.readOnly;
  dlgOk.textContent = o.okLabel || '확인'; dlgDone = o.ok || null; dlg.hidden = false; down.clear(); ptrs.clear();
  const f = o.input ? dlgInput : o.area ? dlgArea : dlgOk; setTimeout(() => { try { f.focus(); if (f.select) f.select(); } catch (_) { } }, 30);
}
function closeDialog() { if (dlg) dlg.hidden = true; dlgDone = null; }
if (dlg) {
  dlgOk.addEventListener('click', () => { const fn = dlgDone, v = dlgInput.hidden ? dlgArea.value : dlgInput.value; closeDialog(); if (fn) fn(v); });
  dlgCancel.addEventListener('click', closeDialog);
  dlg.addEventListener('pointerdown', e => { if (e.target === dlg) closeDialog(); });
  dlgInput.addEventListener('keydown', e => { if (e.key === 'Enter') dlgOk.click(); });
}
function exportSave() {
  save(); const code = saveCode();
  const show = copied => openDialog({ title: '저장 코드', text: copied ? '복사했어요. 다른 기기(또는 홈 화면 앱)의 폰 → 설정 → 저장 코드 붙여넣기에 넣으세요.' : '아래 글자를 전부 복사해서 다른 기기의 폰 → 설정 → 저장 코드 붙여넣기에 넣으세요.', area: true, value: code, readOnly: true, okLabel: '닫기' });
  try { navigator.clipboard.writeText(code).then(() => show(true), () => show(false)); } catch (_) { show(false); }
}
function importSave() {
  openDialog({ title: '저장 코드 붙여넣기', text: '다른 기기에서 복사한 저장 코드를 붙여넣으세요. 지금 이 기기의 진행은 덮어써요.', area: true, okLabel: '불러오기', ok: v => {
    const g = readCode(v);
    if (!g) { STATE.note = { text: '저장 코드를 읽지 못했어요', t: 0 }; sfx.no(); return; }
    G = g; state = makeState(); E = null; RZ = null; STATE.shown = G.money; STATE.hv = newHubView(); save(); scene = 'hub'; sfx.buy();
    STATE.note = { text: '저장 코드를 불러왔어요', t: 0 };
  } });
}
function askName() {
  const recs = loadRecords(), me = recs.find(r => r.id === G.run.rec); if (!me) return;
  openDialog({ title: '기록에 남길 이름', text: `타임어택 ${fmtRun(me.t)} · 이 기기의 내 기록에 남아요.`, input: true, value: me.name === '나' ? '' : me.name, ok: v => { me.name = String(v).trim().slice(0, 10) || '나'; writeRecords(recs); } });
}

// ---- Input: keys by position (event.code), OS key repeat ignored ------------------------
const down = new Set(), hit = new Set();
const pressed = code => hit.has(code); // true for one step after the key goes down
let lastLookKey = null;
addEventListener('keydown', e => {
  if (e.target && e.target.id === 'nameIn') { if (!e.isComposing && (e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Escape')) hit.add(e.code === 'Escape' ? 'Escape' : 'Enter'); return; } /* 이름을 치는 동안 게임 단축키는 쉰다 */
  if (dlgOpen()) { if (e.code === 'Escape') closeDialog(); return; } // 글자 창이 열려 있으면 게임은 키를 받지 않는다
  startAudio(); if (!params.get('touch')) STATE.touchUI = false;
  if (!e.repeat) {
    down.add(e.code); hit.add(e.code);
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') lastLookKey = 'left';
    if (e.code === 'ArrowRight' || e.code === 'KeyD') lastLookKey = 'right';
    if (e.code === 'KeyF' && !CHECKED && (canFullscreen() || isFullscreen())) toggleFullscreen();
    else if (!CHECKED && e.code !== 'Escape') firstGesture();
  }
  if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
});
addEventListener('keyup', e => down.delete(e.code));
// 포인터: 누른 자리로 왼쪽·가운데·오른쪽을 정한다. 양옆을 누르고 있으면 고개를 돌리고,
// 가운데를 누르고 있으면 스캔, 가운데를 짧게 톡 치면 그 자리 보기에 마킹.
const ptr = { taps: [] }, ptrs = new Map();
let releases = [];
function toBuf(e) { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * EXAM_LAYOUT.W, (e.clientY - r.top) / r.height * EXAM_LAYOUT.H]; }
canvas.addEventListener('pointerdown', e => {
  startAudio(); if (!params.get('touch')) STATE.touchUI = e.pointerType !== 'mouse';
  if (scene === 'rankin' && STATE.rin && STATE.rin.phase === 'type') { try { document.getElementById('nameIn').focus({ preventScroll: true }); } catch (_) { } } /* 휴대폰 자판은 누른 순간에만 띄울 수 있다 */
  const [x, y] = toBuf(e), W = EXAM_LAYOUT.W, z = EXAM_LAYOUT.zone;
  ptr.taps.push([x, y]);
  ptrs.set(e.pointerId, { x, y, t0: performance.now() / 1000, moved: 0, zone: x < W * z ? 'L' : x > W * (1 - z) ? 'R' : y < EXAM_LAYOUT.H * 0.2 ? 'T' : 'C' });
  try { canvas.setPointerCapture(e.pointerId); } catch (_) { }
  e.preventDefault();
});
canvas.addEventListener('pointermove', e => {
  const [x, y] = toBuf(e); STATE.hover = [x, y];
  const p = ptrs.get(e.pointerId); if (p) p.moved = Math.max(p.moved, Math.hypot(x - p.x, y - p.y));
});
canvas.addEventListener('pointerleave', () => { STATE.hover = null; });
const ptrUp = e => {
  const p = ptrs.get(e.pointerId); if (!p) return;
  ptrs.delete(e.pointerId);
  const wide = E && E.layout !== 'room'; // 마주 앉는 시험·노트북 시험은 화면 어디든 톡 쳐서 고른다
  if (e.type === 'pointerup' && (p.zone === 'C' || wide) && performance.now() / 1000 - p.t0 < 0.22 && p.moved < 14) releases.push([p.x, p.y]);
};
canvas.addEventListener('pointerup', ptrUp); canvas.addEventListener('pointercancel', ptrUp);
canvas.addEventListener('contextmenu', e => e.preventDefault());
addEventListener('blur', () => { down.clear(); ptrs.clear(); });
function takeTaps() { const t = ptr.taps; ptr.taps = []; return t; }
function takeReleases() { const r = releases; releases = []; return r; }
function hitBtn(btns, x, y) { return (btns || []).find(b => x >= b.x && x <= b.x + b.w && y >= b.y - 2 && y <= b.y + b.h + 2); }
const IVABC = params.get('iv') !== 'old'; // 면접을 버튼 순서 입력으로 (시험 중인 새 방식)
function scanHeld() { return down.has('Space') || (E && E.layout === 'table' && !(IVABC && !E.T.mech.includes('gaze')) && (down.has('ArrowLeft') || down.has('KeyA'))) || scanPointer(); }
function EXV(v) { return typeof WORLD !== "undefined" && !!WORLD.hasView && WORLD.hasView(v); }
function setView(v) { // 고개를 그쪽으로 돌려 둔다 (다시 바꿀 때까지 그대로)
  if (!E || v === E.view) return;
  const side = x => x === 'left' || x === 'right';
  if (!side(v) && side(E.view) && E.looks > 0) G.hints.back = true;
  if (v === 'paper') G.hints.desk = true;
  E.prevView = E.view; E.view = v; E.viewT = 0; sfx.turn();
  if (side(v)) { E.looks++; G.hints.look = true; E.showZones = false; }
}
function viewInput(taps) { // 화면 왼쪽·오른쪽·위를 누르고 있는 동안만 그쪽을 본다. 떼면 시험지로 돌아온다
  if (E.layout === 'table') return;
  if (FORCE_VIEW) { setView(FORCE_VIEW); return; }
  if (E.evict && E.evict.end && E.evict.t < E.evict.end) { setView(EXV('evict') ? 'evict' : 'front'); return; } // 앞자리가 끌려 나가는 동안은 그쪽을 보게 된다
  if (E.caught && E.caughtHow === 'ghost' && E.view === 'ghostlook') return; // [저승] 망자와 눈이 마주친 채로 멈춘다
  if (E.sheetLook) { setView('sheet'); return; } // 장학관이 답안지를 들어 읽는 동안은 고개가 그쪽으로 따라 올라간다
  { const q = E.qs && E.qs[E.qi]; if (q && q.kind === 'listen' && G.gear.earbud > 0 && G.gear.earbud < 4 && !E.ai) { setView('paper'); return; } } // 듣기 중에는 고개를 돌리지 않고 귀를 가린다
  const front = E.layout === 'room' ? 'front' : 'paper'; let z = null;
  for (const p of ptrs.values()) if (p.zone === 'L' || p.zone === 'R' || p.zone === 'T') z = p.zone;
  const mir = E.T.mech.includes('mirror'), wantL = z === 'L' || down.has('ArrowLeft') || down.has('KeyA'), wantR = z === 'R' || down.has('ArrowRight') || down.has('KeyD');
  setView((mir ? wantR : wantL) ? 'left' : (mir ? wantL : wantR) ? 'right' : z === 'T' || down.has('ArrowUp') || down.has('KeyW') ? front : 'paper');
}
function scanPointer() { // 시험장: 가운데를 꾹. 면접: 화면 왼쪽(AI 답변이 뜨는 쪽)을 꾹
  if (IVABC && E && E.layout === 'table' && !E.T.mech.includes('gaze')) return false;
  for (const p of ptrs.values()) if (E && E.layout === 'table' ? p.y < 300 : p.zone === 'C') return true; return false; }

// ---- Audio: started on first input, mute on M --------------------------------------------
let audio = null, muted = false;
function startAudio() {
  try {
    if (!audio) {
      const ac = window.GAME_AUDIO || new (window.AudioContext || window.webkitAudioContext)(); // a check may inject one
      const out = ac.createGain(); out.gain.value = muted ? 0 : tune.volume;
      out.connect(ac.destination); audio = { ac, out };
    }
    if (audio.ac.state === 'suspended') audio.ac.resume();
  } catch (_) { }
}
function setMuted(m) { muted = m; if (audio) audio.out.gain.value = m ? 0 : tune.volume; }
addEventListener('tune', () => setMuted(muted));
function toneAt(freq, dur, type = 'square', vol = 0.3, delay = 0, pan = 0) {
  if (!audio || muted) return;
  try {
    const t = audio.ac.currentTime + delay, o = audio.ac.createOscillator(), g = audio.ac.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); let tail = g;
    if (pan && audio.ac.createStereoPanner) { const p = audio.ac.createStereoPanner(); p.pan.value = pan; g.connect(p); tail = p; }
    tail.connect(audio.out); o.start(t); o.stop(t + dur + 0.02);
  } catch (_) { }
}
function tone(freq, dur, type = 'square', vol = 0.3) { toneAt(freq, dur, type, vol, 0); }
function noiseAt(dur, vol = 0.1, delay = 0, freq = 1200, q = 1, pan = 0) { // 걸러 낸 잡음 한 토막: 종이·기침·천둥
  if (!audio || muted) return;
  try { const ac = audio.ac, n = Math.max(1, Math.floor(ac.sampleRate * dur)), buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); src.buffer = buf; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q; g.gain.value = vol; src.connect(f); f.connect(g); let tail = g;
    if (pan && ac.createStereoPanner) { const p = ac.createStereoPanner(); p.pan.value = pan; g.connect(p); tail = p; }
    tail.connect(audio.out); src.start(ac.currentTime + delay); } catch (_) { }
}
const SND = { tick: 0, amb: 3, mt: 0, step: 0 };
const HUB_SONG = { // 구간마다 다른 고시원 음악: [빠르기(BPM), 음색, 화음 네 개(낮은음 + 세 음)]
  1: [72, 'triangle', [[130.8, 261.6, 329.6, 493.9], [110, 261.6, 329.6, 392], [87.3, 261.6, 349.2, 440], [98, 246.9, 293.7, 392]]],
  2: [88, 'square', [[146.8, 293.7, 349.2, 523.3], [98, 293.7, 392, 493.9], [130.8, 329.6, 392, 493.9], [110, 277.2, 329.6, 392]]],
  3: [60, 'sine', [[65.4, 261.6, 370, 466.2], [73.4, 293.7, 415.3, 523.3], [58.3, 233.1, 329.6, 415.3], [65.4, 277.2, 392, 493.9]]],
};
function soundHub(dt) { // 고시원: 느린 화음 아르페지오
  if (!audio || muted || !CONFIG.sound.music) return;
  const act = TIERS[Math.min(LAST, Math.max(0, G.unlocked - 1))].act, [bpm, wave, chords] = HUB_SONG[act] || HUB_SONG[1], stepLen = 60 / bpm / 2;
  SND.mt += dt; if (SND.mt < stepLen) return; SND.mt -= stepLen; const i = SND.step++ % 32, ch = chords[Math.floor(i / 8)], k = i % 8, v = wave === 'square' ? 0.018 : 0.04;
  if (k === 0) toneAt(ch[0], stepLen * 6, 'sine', 0.07); toneAt(ch[[1, 2, 3, 2, 1, 3, 2, 3][k]] * (act === 3 && k % 3 === 0 ? 2 : 1), stepLen * 2.2, wave, v);
  if (act !== 3 && k % 4 === 2) noiseAt(0.04, 0.02, 0, 5000, 1);
}
function soundExam(dt) { // 시험장: 벽시계 초침, 가끔 들리는 연필·종이·기침. 마지막 시험은 단계마다 빨라지는 음악
  if (!audio || muted || E.quiet) return; const S = CONFIG.sound; // E.quiet: 보스전이 소리를 직접 낸다
  if (S.amb && !E.T.mech.includes('omega')) { SND.tick += dt; if (SND.tick >= 1) { SND.tick -= 1; toneAt(2400, 0.012, 'square', 0.012); toneAt(1900, 0.012, 'square', 0.008, 0.5); }
    SND.amb -= dt; if (SND.amb <= 0 && E.layout === 'room') { SND.amb = 2.5 + Math.random() * 5; const pan = Math.random() * 1.6 - 0.8, r = Math.random();
      if (r < 0.5) for (let i = 0; i < 4; i++) noiseAt(0.05, 0.02, i * 0.07, 3200, 2, pan); else if (r < 0.8) noiseAt(0.25, 0.025, 0, 900, 0.8, pan); else { noiseAt(0.09, 0.05, 0, 500, 1.5, pan); noiseAt(0.08, 0.04, 0.16, 450, 1.5, pan); } } }
  if (S.music && E.T.mech.includes('omega') && !E.finalQ && E.start <= 0) { const stepLen = 60 / (96 + E.part * 16) / 2; SND.mt += dt; if (SND.mt >= stepLen) { SND.mt -= stepLen; const k = SND.step++ % 16, bass = [55, 55, 65.4, 55, 73.4, 55, 65.4, 82.4][k % 8];
      toneAt(bass, stepLen * 0.9, 'sawtooth', 0.045); if (k % 2) noiseAt(0.03, 0.02, 0, 6000, 1); if (E.part >= 1 && k % 4 === 0) toneAt(bass * 3, stepLen * 1.5, 'square', 0.02); if (E.part >= 2 && k % 8 === 6) toneAt(bass * 4.5, stepLen, 'square', 0.025); if (E.part >= 3) toneAt(bass * 6, 0.04, 'square', 0.012); } }
}
const sfx = {
  scan: () => tone(1500, 0.02, 'square', 0.02),
  elim: () => { toneAt(980, 0.03, 'square', 0.06); toneAt(740, 0.05, 'square', 0.05, 0.03); },
  ai: () => { toneAt(1320, 0.07, 'square', 0.1); toneAt(1760, 0.09, 'square', 0.1, 0.07); },
  pencil: () => { for (let i = 0; i < 3; i++) toneAt(2600 - i * 300, 0.025, 'sawtooth', 0.025, i * 0.035); },
  flip: () => { toneAt(420, 0.05, 'triangle', 0.05); toneAt(620, 0.04, 'triangle', 0.04, 0.04); },
  turn: () => toneAt(180, 0.06, 'triangle', 0.04),
  foot: (pan, vol) => { toneAt(92, 0.045, 'square', vol, 0, pan); toneAt(70, 0.05, 'triangle', vol * 0.8, 0.02, pan); },
  beat: vol => { toneAt(58, 0.09, 'sine', vol); toneAt(52, 0.1, 'sine', vol * 0.8, 0.13); },
  cctv: () => { toneAt(2200, 0.02, 'square', 0.03, 0, 0.8); toneAt(1800, 0.03, 'square', 0.03, 0.05, 0.8); },
  beep: () => tone(980, 0.06, 'square', 0.08),
  pulse: () => { toneAt(300, 0.4, 'sine', 0.16); toneAt(240, 0.3, 'sine', 0.12, 0.1); },
  caught: () => { for (let i = 0; i < 4; i++) toneAt(i % 2 ? 660 : 880, 0.16, 'square', 0.15, i * 0.17); },
  pass: () => { [523, 659, 784, 1046].forEach((f, i) => toneAt(f, 0.14, 'square', 0.12, i * 0.1)); },
  top: () => { [523, 659, 784, 1046, 1318, 1568].forEach((f, i) => toneAt(f, 0.16, 'square', 0.12, i * 0.09)); toneAt(2093, 0.5, 'triangle', 0.1, 0.6); },
  fail: () => { [392, 349, 311].forEach((f, i) => toneAt(f, 0.22, 'triangle', 0.15, i * 0.2)); },
  buy: () => { toneAt(1046, 0.05, 'square', 0.1); toneAt(1568, 0.08, 'square', 0.1, 0.05); },
  no: () => { toneAt(220, 0.08, 'square', 0.08); toneAt(180, 0.1, 'square', 0.08, 0.08); },
  bell: () => { toneAt(880, 0.3, 'sine', 0.15); toneAt(660, 0.4, 'sine', 0.15, 0.25); },
  door: () => { toneAt(140, 0.12, 'sawtooth', 0.07); toneAt(110, 0.2, 'triangle', 0.09, 0.1); },
  knock: () => { for (let i = 0; i < 3; i++) toneAt(170, 0.05, 'square', 0.14, i * 0.16); },
  open: () => { toneAt(300, 0.08, 'sawtooth', 0.05); [660, 880, 1320].forEach((f, i) => toneAt(f, 0.1, 'square', 0.08, 0.15 + i * 0.07)); },
  creak: () => { toneAt(210, 0.18, 'sawtooth', 0.05); toneAt(160, 0.25, 'sawtooth', 0.05, 0.12); toneAt(120, 0.2, 'triangle', 0.06, 0.3); },
  zoom: () => { toneAt(320, 0.05, 'triangle', 0.05); toneAt(480, 0.06, 'triangle', 0.04, 0.04); },
  news: () => { toneAt(1175, 0.08, 'sine', 0.1); toneAt(1568, 0.14, 'sine', 0.1, 0.09); },
  hand: () => { toneAt(700, 0.05, 'triangle', 0.06, 0, -0.4); toneAt(840, 0.07, 'triangle', 0.06, 0.07, -0.4); },
  warp: () => { toneAt(900, 0.12, 'sine', 0.05); toneAt(300, 0.16, 'sine', 0.05, 0.05); },
  thunder: () => { noiseAt(1.4, 0.35, 0, 160, 0.5); noiseAt(0.25, 0.3, 0, 2400, 0.7); toneAt(55, 0.9, 'sine', 0.2); },
  rumble: () => { noiseAt(0.9, 0.12, 0, 110, 0.6); },
  bubble: () => { for (let i = 0; i < 6; i++) toneAt(420 + i * 90, 0.06, 'sine', 0.07, i * 0.06); },
  omega: () => { toneAt(110, 1.2, 'sawtooth', 0.1); toneAt(116.5, 1.2, 'sawtooth', 0.1); toneAt(55, 1.4, 'sine', 0.18, 0.05); },
  radio: () => { for (let i = 0; i < 4; i++) toneAt(440 + (i % 2) * 110, 0.07, 'triangle', 0.03, i * 0.1); },
};

// ---- Exam ------------------------------------------------------------------------------
function procDur(range) { return between(range[0], range[1]) * tune.proctor_pace; }
function newStaff(d, i, T, extra) {
  const s = Object.assign({ type: d.type, name: d.name, side: i % 2 ? 'R' : 'L', u: 0.2 + rng() * 0.6, dir: rng() < 0.5 ? -1 : 1, phase: 'stand', t: 0,
    dur: procDur(T.stand) + i * 0.7, walk: 0, stepT: 0, away: rng() < 0.5, from: null, fixed: !!d.fixed, visit: d.visit || null, out: false, blink: 0, help: null, check: null }, extra || {});
  if (s.visit === 'drop') { s.out = true; s.outT = between(tune.visit_out_min, tune.visit_out_max) * 0.6; } // 밖에 있다가 불쑥 들어온다
  if (s.visit === 'coffee') s.inT = between(tune.visit_in_min, tune.visit_in_max);                          // 있다가 커피 가지러 나간다
  if (s.type === 'webcam') s.dur = between(tune.webcam_off_min, tune.webcam_off_max);
  return s;
}
function makeStaff(T, ti) { const a = T.staff.map((d, i) => newStaff(d, i, T)); if (ti === 0) a[0].dur += 1.5; return a; }
function flash(text, col) { if (E) E.flash = { text, t: 0, col }; }
function say(text, col) { if (E) E.say = { text, t: 0, col }; } // 화면 아래 자막으로 뜨는 사건 알림 (재난문자·교시 강화·면접 점수 등)
function assignAI(qs, firstEver) { // AI의 판단: 맞으면 정답, 틀리면 오답 하나. 스캔 중에 지우는 두 보기는 언제나 오답
  let p = aiAccuracy(E.T);
  if (E.adaptHard) p = clamp(p - tune.adaptive_drop, tune.ai_floor, 0.99);
  if (E.edge && E.edge.model > 0 && !E.T.mech.includes('human')) p = Math.max(p, 0.99); // [장비 우위] 모델이 시험을 앞서면 거의 틀리지 않는다
  for (const q of qs) {
    const right = firstEver || rng() < (E.T.mech.includes('human') && !q.human ? aiAccuracyAt(E.T, G.gear.model) : p), wrongs = [0, 1, 2, 3].filter(i => i !== q.answer);
    q.aiPick = right ? q.answer : wrongs[Math.floor(rng() * 3)];
    const rest = wrongs.filter(i => i !== q.aiPick);
    for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [rest[i], rest[j]] = [rest[j], rest[i]]; }
    q.elim = rest.slice(0, 2);
    q.conf = clamp(Math.round(p * 100 + (rng() - 0.5) * 8), 30, 99);
  }
  E.aiP = p;
}
function beginPart(p, firstEver) { // 교시·모듈·블록 하나를 시작
  const T = E.T;
  E.part = p; E.qs = makeQuestions(rng, T, p, E.used || (E.used = new Set()));
  if (E.tier === LAST && p === E.parts - 1 && !G.ended) E.qs[E.qs.length - 1] = { kind: 'text', q: '이 시험을 본 건 너인가, 나인가?', choices: ['나', '너', '우리', '모르겠다'], answer: -1, human: false, final: true }; // 마지막 문제
  assignAI(E.qs, firstEver);
  if (T.mech.includes('long') && typeof LONG_PASSAGES !== 'undefined') E.qs.forEach((q, i) => { if (!q.final) q.passage = LONG_PASSAGES[(p * T.qn + i) % LONG_PASSAGES.length]; }); // 긴 지문: 스캔하는 동안 두 쪽을 차례로 훑는다
  E.qi = 0; E.answers = []; E.via = []; E.scan = 0; E.ai = false; E.fb = null; E.listen = 0; E.earbudT = 0; E.unsafeT = 0;
  E.timeLeft = E.timeTotal; E.partOver = false;
  if (p > 0) {
    E.sus *= tune.session_keep; E.breakT = tune.break_time;
    if (E.T.id === 'leet' && p === 1 && CONFIG.eggs.stairs) E.stairs = { phase: 'intro', t: 0, steps: 0, last: null, left: tune.stairs_time, stumble: 0, result: null }; // 쉬는 시간: 계단 앞에 서 있다
    if (T.id === 'bar' && p === 1) { const T2 = E.T = Object.assign({}, T, { stand: T.stand.map(v => v * 0.75), walk: T.walk.map(v => v * 0.8), speed: T.speed * 1.3 }); E.staff.push(newStaff({ type: 'dean', name: '추가 감독관' }, E.staff.length, T2)); E.evict = { t: 0 }; E.breakT = 9;
      E.staff.forEach((s, i) => { s.u = 0.94 - (i === 2 ? 0.1 : 0); s.dir = -1; s.out = false; s.help = s.check = s.peek = null; setPhase(s, 'walk', procDur(T2.walk)); }); } // 쉬는 시간에 감독관 둘이 앞자리를 데리고 나가고 셋이 돌아온다(그림은 world3d). 끝나면 셋 다 앞쪽에서 걸어 들어온 자리에서 이어 간다 // 2교시: 감독관 한 명 더, 순찰이 빨라진다
    if (T.id === 'bar' && p === 2) { E.jam = 1.6; E.pulseFast = 0.6; say('AI 감독관이 방해 전파를 쏜다 · 스캔이 느려진다', PAL.bad); sfx.pulse(); } // 3교시: 스캔 60% 느려짐, 전파 간격 짧아짐
    if (T.swap && T.swap[p]) { E.staff = T.swap[p].map((type, i) => newStaff({ type, name: PROCTOR_NAME[type] }, i, T)); flash('감독관 교대', PAL.hud); } // 블록마다 새 감독관
    if (E.boss && BOSS[E.boss].part) BOSS[E.boss].part(p); // 보스전: 단계 사이 연출
  }
}
function startExam(ti) {
  if (G.audit) { G.mail = null; goHub('mail'); return true; } // 재시험 통보가 와 있으면 다른 시험은 못 본다: 통보부터 읽게 한다
  ti = clamp(ti, 0, G.unlocked - 1); if (!CHECKED) netCountPlay(); if (!CHECKED && !STATE.titleBuild && netOn()) runPending(1); // 시험 한 번 = 한 판 (타이틀 뒤에 깔리는 시험장은 세지 않는다)
  syncGear();
  const T = TIERS[ti], fee = examFee(T);
  { const nh = CONFIG.helper.find(h => h.need && ti >= h.tier && (h.id === 'visa' ? T.act === 2 : T.act === 3) && !tgHas(h.id)); if (nh && !STATE.titleBuild && !params.get('scene')) { sfx.no(); STATE.note = { text: nh.block, t: 0 }; return false; } } // 조력자의 길이 있어야 넘어가는 구간
  if (G.money < fee) { sfx.no(); STATE.note = { text: `응시료 ${won(fee)}원이 모자라요`, t: 0 }; return false; }
  G.money -= fee; G.stats.fees += fee; STATE.shown = Math.min(STATE.shown, G.money);
  const g = G.gear, firstEver = ti === 0 && G.stats.exams === 0, R = WORLD_LAYOUT(T);
  const total = T.time * tune.time_scale + g.watch * tune.watch_bonus;
  E = { tier: ti, T, layout: R, parts: T.parts ? T.parts.length : 1, part: 0, done: [], leftSum: 0, qs: [], qi: 0, answers: [], via: [], selfN: 0, aiN: 0, fee,
    timeLeft: total, timeTotal: total, sus: 0, aiSus: 0, caught: false, caughtBy: null, caughtHow: null, over: false, all: false, endT: 0, start: T.boss ? 2.6 : 1.8, breakT: 0,
    holding: false, autoHolding: false, rising: false, scan: 0, ai: false, fb: null, earbudT: 0, unsafeT: 0, tick: 0, beat: 0, listen: 0, float: 0, clockT: 0,
    danger: false, hint: null, gear: g, view: R === 'room' ? 'front' : 'paper', prevView: R === 'room' ? 'front' : 'paper', viewT: 1, downT: 0, ar: R !== 'room' || g.lens >= tune.glass_level, finalQ: false, glitch: 0, looks: 0, showZones: firstEver && !G.hints.look, flash: null, startNotes: [],
    staff: makeStaff(T, ti), adaptHard: false, pulseCut: 1, runShown: 0, wasHold: false, lastScanT: null, lastGap: null, arRows: [], source: null,
    crowdT: T.mech.includes('crowd') ? between(tune.crowd_gap_min, tune.crowd_gap_max) * 0.6 : 0,
    peekT: T.mech.includes('peek') ? between(tune.peek_gap_min, tune.peek_gap_max) : 0,
    checkT: T.mech.includes('idcheck') ? between(tune.check_gap_min, tune.check_gap_max) * 0.6 : 0,
    cloneT: T.mech.includes('clones') ? tune.clone_gap : 0, clones: 0,
    cctv: T.sec.includes('cctv') ? { ph: rng() * 6.28, a: 1, on: false } : null,
    pulse: T.sec.includes('pulse') ? { next: 3 + rng() * 3, warn: 0, active: 0 } : null };
  if (T.id === 'afterlife' && tgHas('coin')) { const r0 = E.staff.find(s => s.type === 'reaper'); if (r0) { r0.visit = 'drop'; r0.out = true; r0.outT = 40; } } // 노잣돈: 저승사자 한 명이 늦게 온다
  E.pulseCut = T.pulse === 'screen' ? gearCut(g.screenfilm) : jamFactor(g.jammer, 3);
  E.stickerSlow = 1; E.dead = null; E.deadNext = null; E.intro = null; E.wetT = 0; // 단추 스티커는 이제 느려지는 게 아니라 아예 가려진다 (E.dead)
  // 입실 검사: 시작부터 의심을 안고 들어간다
  const stealth = Math.pow(1 - tune.stealth_cut, g.stealth), N = E.startNotes;
  if (ti === 0 && !(G.stats.exams > 0)) { for (const k of ['scan', 'pick', 'front', 'look', 'end', 'desk', 'back', 'tell']) delete G.hints[k]; } // 첫 시험 조작 안내는 늘 처음부터
  if (STATE.oldSave && ti === 0) { N.push({ text: '새 시즌이 시작되어 처음부터 진행합니다 · 지난 기록은 석차표의 지난 시즌에 남아 있습니다', col: PAL.warn }); STATE.oldSave = false; }
  { const ed = E.edge = T.boss ? { lens: 0, cover: 0, model: 0 } : gearEdge(ti); E.edgeScan = Math.pow(1 - tune.edge_lens, ed.lens) * Math.pow(1 - tune.edge_model, ed.model); E.edgeSus = Math.pow(1 - tune.edge_cover, ed.cover);
    const a = []; if (E.edgeScan < 0.999) a.push(`스캔 ${Math.round((1 - E.edgeScan) * 100)}% 빠름`); if (ed.cover > 0) a.push(`의심 ${Math.round((1 - E.edgeSus) * 100)}% 덜 오름`); if (ed.model > 0) a.push('AI 정답률 99%'); if (a.length) N.push({ text: '장비가 이 시험장을 앞선다 · ' + a.join(' · '), col: PAL.good }); }
  const glassOn = R === 'room' && g.lens >= tune.glass_level && g.lens <= 5, camOn = g.lens < tune.glass_level; // 안경을 쓰고 있나 · 단추 카메라를 쓰고 있나
  if (T.mech.includes('metal')) { E.sus = tune.metal_sus * stealth; E.intro = { kind: 'metal', t: 0, dur: 3.8 }; N.push({ text: `탐지봉이 울렸다. 의심 ${Math.round(E.sus * 100)}%에서 시작`, col: PAL.bad }); }
  if (T.mech.includes('glasscheck')) { // 안경을 물에 담근다: 방수가 아니면 그 시험 내내 먹통
    if (glassOn) { E.intro = { kind: 'water', t: 0, dur: 4.6, ok: g.glasscase > 0 }; if (g.glasscase < 1) E.deadNext = 'water'; else if (g.glasscase < 2) E.wetT = 8; N.push({ text: g.glasscase > 0 ? '안경 물 검사 통과 (방수)' : '안경이 물을 먹었다. 이 시험은 AI 없이', col: g.glasscase > 0 ? PAL.good : PAL.bad }); }
    else N.push({ text: '안경 물 검사: 안경이 없어 그냥 지나감', col: PAL.good });
  }
  if (T.mech.includes('sticker')) { E.intro = { kind: 'sticker', t: 0, dur: 3.6 }; if (camOn) E.deadNext = 'sticker'; N.push({ text: camOn ? '단추 카메라가 스티커에 가려졌다. 이 시험은 AI 없이' : '옷 단추마다 스티커 (안경이라 상관없음)', col: camOn ? PAL.bad : PAL.good }); }
  const names = [...T.mech.filter(m => !['tutorial', 'metal', 'glasscheck', 'sticker'].includes(m)).map(m => m === 'idcheck' && T.check === 'calc' ? MECH_NAME.calc : MECH_NAME[m]), ...T.sec.map(s => s === 'pulse' && T.pulse ? SEC_NAME[T.pulse] : SEC_NAME[s])];
  if (names.length) N.push({ text: names.join(' · '), col: PAL.warn });
  if (T.noAuto && (g.autoscan > 0 || g.lens >= 7)) N.push({ text: 'AI 감독관이 이어폰·자동 스캔을 막는다', col: PAL.bad });
  beginPart(0, firstEver);
  if (T.boss && window.BOSS && BOSS[T.id] && params.get('boss') !== 'old') { E.boss = T.id; BOSS[T.id].start(E); } // 마지막 시험의 보스전 (boss-*.js)
  ptrs.clear(); releases = [];
  if (!G.run.done) G.run.started = true;
  scene = 'play';
  events.push({ type: 'exam', tier: ti, fee });
  return true;
}
function WORLD_LAYOUT(T) { return T.room === 'home' ? 'home' : T.layout === 'table' ? 'table' : 'room'; }
const BREATH_BTN = { x: 20, y: 286, w: 92, h: 26 }; // [용궁] 숨쉬기 버튼 (렌즈 화면 좌표)
const OMEN_T = 0.6;
function omenOf(s) { return s.pre === true && (s.phase === 'stand' || s.phase === 'walk') && !s.out && !(s.blink > 0) ? clamp(1 - (s.dur - s.t) / OMEN_T, 0, 1) : 0; } // 0~1: 곧 돌아본다는 예감의 세기
function setPhase(s, ph, dur) { s.phase = ph; s.t = 0; s.dur = dur; s.pre = null; }
function tellTime(s, T) { return T.tell + G.gear.predict * tune.predict_bonus + (s.type === 'reaper' ? G.gear.candle * tune.candle_bonus : 0); }
function footstep(s, near1) {
  if (s.type === 'reaper' || s.type === 'omega' || s.type === 'webcam') return; // 저승사자는 발소리가 없다
  let pan = s.side === 'L' ? -0.75 : 0.75;
  if (s.phase === 'cross') pan = (s.from === 'L' ? -0.75 : 0.75) * (1 - 2 * clamp(s.t / s.dur, 0, 1));
  const near = near1 != null ? near1 : 1 - Math.min(1, Math.abs(s.u - 0.5) * 1.6);
  sfx.foot(pan, 0.04 + 0.08 * near);
}
function teleport(s, T) { s.blink = 0.5; s.side = rng() < 0.5 ? 'L' : 'R'; s.u = 0.1 + rng() * 0.8; setPhase(s, 'stand', procDur(T.stand) * 0.7); s.away = rng() < 0.5; sfx.warp(); }
function stepWebcam(s, T, dt) { // 원격 감독: 꺼짐 → 깜빡(예고) → LIVE
  if (s.t < s.dur) return;
  if (s.phase === 'stand') setPhase(s, 'tell', tune.webcam_tell + G.gear.predict * tune.predict_bonus);
  else if (s.phase === 'tell') { if (rng() < T.feint) setPhase(s, 'stand', between(tune.webcam_off_min, tune.webcam_off_max) * 0.5); else { setPhase(s, 'watch', between(tune.webcam_live_min, tune.webcam_live_max)); sfx.cctv(); } }
  else setPhase(s, 'stand', between(tune.webcam_off_min, tune.webcam_off_max));
}
function stepFixed(s, T, dt) { // 앞에 앉은 면접관·심사위원·염라대왕·Ω: 걷지 않고, 한 번에 한 명씩 고개를 든다
  if (s.t < s.dur) return;
  const r = rng(), busy = E.staff.some(o => o !== s && o.fixed && (o.phase === 'tell' || o.phase === 'watch'));
  if (s.phase === 'stand') { if (!busy && r < 0.6) setPhase(s, 'tell', tellTime(s, T)); else { setPhase(s, 'stand', procDur(T.stand) * (busy ? 0.5 : 1)); s.away = !s.away; } }
  else if (s.phase === 'tell') { if (r < T.feint) setPhase(s, 'stand', procDur(T.stand) * 0.6); else setPhase(s, 'watch', T.watch); }
  else { setPhase(s, 'stand', procDur(T.stand)); s.away = rng() < 0.5; }
}
function stepStaff(s, T, dt) {
  if (E.evict && E.evict.arrive && E.evict.t < E.evict.arrive[E.staff.indexOf(s)]) return; // 앞자리를 데리고 나갔다가 걸어 들어오는 중: 자리에 닿을 때까지는 아무것도 보지 않는다
  if (s.blink > 0) { s.blink -= dt; return; }
  if (s.phase === 'call') { s.t += dt; return; } // [저승] 내 이름을 부르는 동안은 그 자리에 서서 나를 본다(주시로 치지 않는다)
  if (s.visit) { // 교수님은 불쑥 들어오고, 선생님은 커피 가지러 나간다
    if (s.out) { s.outT -= dt; if (s.outT <= 0) { s.out = false; s.inT = between(tune.visit_in_min, tune.visit_in_max); s.u = 0.94; s.dir = -1; setPhase(s, 'walk', procDur(T.walk)); sfx.door(); flash(`${s.name} 들어옴`, PAL.bad); if (T.id === 'bac') s.sheetIn = 1.0; } return; }
    s.inT -= dt;
    if (s.inT <= 0 && (s.phase === 'stand' || s.phase === 'walk')) { s.out = true; s.outT = between(tune.visit_out_min, tune.visit_out_max); sfx.door(); flash(`${s.name} 나감`, PAL.good); return; }
  }
  if (s.sheetIn > 0 && s.phase !== 'check') { s.sheetIn -= dt; if (s.sheetIn <= 0) { // 바칼로레아: 장학관이 내 자리로 와서 답안지를 집어 든다
    s.help = null; s.peek = null; s.from = null; s.check = { kind: 'sheet', stage: 'go', k: 0, t: 0, u0: s.u, go: clamp(Math.abs(s.u - 0.5) * 3, 1.2, 2.2) }; s.phase = 'check'; s.t = 0; } }
  s.t += dt;
  if (s.type === 'webcam') return stepWebcam(s, T, dt);
  if (s.phase === 'help') { // 손 든 수험생에게 가 있는 동안은 나를 못 본다
    const h = s.help;
    if (h.k < 1) { h.k = Math.min(1, h.k + dt / h.go); s.walk += dt; s.stepT += dt; if (s.stepT >= tune.footstep_gap) { s.stepT = 0; footstep(s); } }
    else { h.stay -= dt; if (h.stay <= 0) { s.u = h.u; const look = h.look; s.help = null; if (look) { setPhase(s, 'watch', look); s.away = false; } else { setPhase(s, 'stand', procDur(T.stand)); s.away = rng() < 0.5; } } }
    return;
  }
  if (s.phase === 'peek') { // 통로에서 사라졌다가 내 책상 밑에서 올려다본다. 이때 스캔하면 끝
    const p = s.peek; p.t -= dt;
    if (p.stage === 'sneak' && p.t <= 0) { p.stage = 'stare'; p.t = tune.peek_stare; }
    else if (p.stage === 'stare' && p.t <= 0) { s.peek = null; setPhase(s, 'stand', procDur(T.stand)); s.away = rng() < 0.5; }
    return;
  }
  if (s.phase === 'check') { // 내 책상 앞으로 와서 수험표·계산기를 본다
    const c = s.check;
    if (c.stage === 'go') { c.k = Math.min(1, c.k + dt / (c.go || 1.1)); s.walk += dt; s.stepT += dt; if (s.stepT >= tune.footstep_gap) { s.stepT = 0; footstep(s, 1); } if (c.k >= 1) { c.stage = 'at'; c.t = tune.check_time; if (c.kind === 'sheet') { c.t = c.dur = between(3.8, 4.6); c.e = 0; } else sfx.beep(); } }
    else if (c.stage === 'at') {
      c.t -= dt;
      if (c.kind === 'sheet') { // 손을 뻗어 집어 들고(0.3초~) 읽다가 내려놓는다. 들고 있는 동안은 쓸 수 없고, 고개도 그쪽으로 들게 된다
        const e0 = c.e; c.e += dt; E.sheetUp = c.e > 0.3; E.sheetLook = c.e > 0.45 && c.e < c.dur - 0.35;
        if (e0 <= 0.3 && c.e > 0.3) sfx.flip();
        if (e0 <= c.dur - 0.65 && c.e > c.dur - 0.65) sfx.flip();
        if (c.t <= 0) { E.sheetUp = false; E.sheetLook = false; }
      }
      if (c.t <= 0) {
        if (T.check === 'calc') { const add = tune.calc_sus * gearCut(G.gear.calccover); if (add > 0.005) { E.sus = Math.min(1, E.sus + add); E.source = { how: 'check', by: s }; flash(`계산기가 수상하다! 의심도 +${Math.round(add * 100)}%`, PAL.bad); } else flash('계산기 검사 통과', PAL.good); }
        c.stage = 'back';
      }
    } else { c.k -= dt / 1.1; s.walk += dt; if (c.k <= 0) { s.check = null; setPhase(s, 'stand', procDur(T.stand)); s.away = rng() < 0.5; } }
    return;
  }
  if (s.fixed) return stepFixed(s, T, dt);
  if (s.phase === 'walk' || s.phase === 'cross') { // 걸을 때만 발소리가 난다
    s.walk += dt; s.stepT += dt;
    if (s.phase === 'walk') {
      s.u += s.dir * T.speed * tune.proctor_speed * dt;
      if (s.u < 0.06) { s.u = 0.06; s.dir = 1; } else if (s.u > 0.94) { s.u = 0.94; s.dir = -1; }
    }
    if (s.stepT >= tune.footstep_gap) { s.stepT = 0; footstep(s); }
  }
  if ((s.phase === 'stand' || s.phase === 'walk') && s.pre == null && s.dur - s.t <= OMEN_T) s.pre = rng() < (s.phase === 'stand' ? 0.38 : 0.5); // 돌아볼지를 0.6초 먼저 정해 둔다: 뉴럴링코의 '예감'이 이걸 느낀다
  if (s.t < s.dur) return;
  const pre = s.pre, r0 = rng(), r = s.phase === 'stand' && pre === false ? 0.38 + r0 * 0.62 : r0, tell = tellTime(s, T), warp = T.mech.includes('teleport') && s.type === 'reaper';
  if (s.phase === 'stand') {
    if (pre != null ? pre : r < 0.38) setPhase(s, 'tell', tell);
    else if (warp) teleport(s, T);
    else if (r < 0.38 + 0.62 * T.cross) { // 가까운 끝(앞·뒤)까지 걸어가서 반대편 통로로 건너간다
      s.from = s.side; s.crossEnd = s.u > 0.42 ? 'front' : 'back';
      const along = Math.abs((s.crossEnd === 'front' ? 0.94 : 0.06) - s.u), across = 0.22;
      s.crossSplit = along / (along + across); setPhase(s, 'cross', (along + across) / Math.max(0.05, T.speed * tune.proctor_speed));
    }
    else { setPhase(s, 'walk', procDur(T.walk)); if (rng() < 0.5) s.dir *= -1; }
  } else if (s.phase === 'walk') {
    if (pre != null ? pre : r < 0.5) setPhase(s, 'tell', tell);
    else { setPhase(s, 'stand', procDur(T.stand)); s.away = rng() < 0.5; }
  } else if (s.phase === 'tell') {
    if (r < T.feint) { setPhase(s, 'stand', procDur(T.stand) * 0.6); s.away = rng() < 0.5; }
    else { setPhase(s, 'watch', T.watch); if (E && E.tier === 0) G.hints.tell = true; }
  } else if (s.phase === 'watch') {
    if (r < 0.5 || warp) { setPhase(s, 'stand', procDur(T.stand)); s.away = rng() < 0.5; }
    else { setPhase(s, 'walk', procDur(T.walk)); s.dir = rng() < 0.5 ? -1 : 1; }
  } else if (s.phase === 'cross') {
    s.side = s.side === 'L' ? 'R' : 'L'; s.u = s.crossEnd === 'back' ? 0.06 : 0.94; s.dir = s.u > 0.5 ? -1 : 1; s.from = null;
    setPhase(s, 'stand', procDur(T.stand)); s.away = rng() < 0.5;
  }
}
// [블랙홀] 시공간 요동: 가끔 아직 답하지 않은 문제의 보기 순서가 섞인다 (정답 번호도 같이 바뀐다)
// 순서: 대기 → 떨림(예고, 이때 마킹하면 안 섞인다) → 일그러지며 섞임. 섞이는 순간 렌즈의 AI 표시는 깨져 사라지고,
// 다시 스캔해야 새 자리에 뜬다. 렌즈가 좋으면 섞인 뒤 3초 안에 다시 누를 때 중간부터 이어서 스캔한다 (뉴럴링코 이상 50% · 콘택트렌즈 25% · 그 아래는 처음부터)
function reshuffleOk(q) { return !!(q && q.choices && q.choices.length === 4 && q.kind !== 'essay' && q.kind !== 'speak' && q.kind !== 'listen' && !q.final && !E.fb && E.answers[E.qi] == null && !(E.start > 0) && !(E.breakT > 0) && !E.caught && !E.over && !E.result); }
function stepReshuffle(dt) {
  const q = E.qs[E.qi], gap = () => between(tune.reshuffle_gap_min, tune.reshuffle_gap_max), b = E.bh || (E.bh = { phase: 'idle', t: gap(), k: 0, qi: E.qi, staleT: 0, stale: null });
  if (b.staleT > 0) b.staleT -= dt;
  if (b.keepT > 0) { b.keepT -= dt; if (E.holding && !E.ai && E.scan < b.keepV) { E.scan = b.keepV; b.keepT = 0; } } // 렌즈가 기억해 둔 만큼은 이어서
  if (b.qi !== E.qi) { b.qi = E.qi; b.stale = null; b.staleT = 0; if (b.phase !== 'idle') { b.phase = 'idle'; b.t = gap(); } b.t = Math.max(b.t, tune.reshuffle_grace); } // 새 문제가 뜨면 잠깐은 그대로
  if (b.phase === 'idle') { if (!reshuffleOk(q)) return; b.t -= dt; if (b.t <= 0) { b.phase = 'tell'; b.k = 0; sfx.rumble(); } return; }
  b.k += dt;
  if (b.phase === 'tell') {
    if (!reshuffleOk(q)) { b.phase = 'idle'; b.t = gap(); return; } // 떨리는 동안 마킹했으면 그대로 넘어간다
    if (b.k < tune.reshuffle_tell) return;
    const der = [[1, 0, 3, 2], [1, 2, 3, 0], [1, 3, 0, 2], [2, 0, 3, 1], [2, 3, 0, 1], [2, 3, 1, 0], [3, 0, 1, 2], [3, 2, 0, 1], [3, 2, 1, 0]], sh = der[Math.floor(rng() * der.length)], inv = []; // 어느 보기도 제자리에 남지 않게 (sh[새 자리] = 옛 자리)
    sh.forEach((from, to) => { inv[from] = to; });
    const had = E.ai && q.aiPick != null ? q.aiPick : null;
    q.choices = sh.map(i => q.choices[i]); if (q.answer >= 0) q.answer = inv[q.answer]; if (q.aiPick != null) q.aiPick = inv[q.aiPick]; if (q.elim) q.elim = q.elim.map(i => inv[i]);
    const lens = G.gear.lens, keep = lens >= 7 ? tune.reshuffle_keep_brain : lens >= 6 ? tune.reshuffle_keep_contact : 0;
    if (!q.pre) { E.scan = E.holding ? Math.min(E.scan, keep) : 0; E.ai = false; b.keepV = keep; b.keepT = keep > 0 ? 3 : 0; } E.earbudT = 0;
    b.stale = had != null && E.ar && !q.pre ? { row: had } : null; b.staleT = b.stale ? 1.4 : 0;
    b.phase = 'warp'; b.k = 0; sfx.warp(); return;
  }
  if (b.phase === 'warp' && b.k >= tune.reshuffle_warp) { b.phase = 'idle'; b.t = gap(); }
}
function stepCctv(c, dt) {
  const was = c.on;
  c.ph += dt * Math.PI * 2 / tune.cctv_period; c.a = Math.sin(c.ph); c.on = Math.abs(c.a) < 0.28;
  if (c.on && !was && G.gear.cctvjam < 3) sfx.cctv();
}
function ringPhone() { // 재난문자: 교실 어딘가에서 다른 수험생 폰이 울린다. 멀면 감독관이 다 그쪽으로 가서 틈이 생기고, 내 근처면 감독관이 바로 옆에 와서 둘러본다
  const ru = 0.08 + rng() * 0.84, nearMe = Math.abs(ru - 0.5) < 0.2, T = E.T; let n = 0;
  for (const s of E.staff) { if (s.fixed || s.out || s.blink > 0 || !(s.phase === 'stand' || s.phase === 'walk' || s.phase === 'tell')) continue;
    const u = clamp(ru + (n++ ? 0.06 : 0), 0.05, 0.95); s.help = { u0: s.u, u, k: 0, go: Math.max(0.4, Math.abs(u - s.u) / Math.max(0.05, T.speed * tune.proctor_speed * 2.2)), stay: nearMe ? 0.8 : 3.2, look: nearMe ? 2.4 : 0 }; s.phase = 'help'; s.t = 0; }
  sfx.beep(); say(nearMe ? '바로 옆자리 폰이 울린다! 감독관이 이쪽으로 온다' : '저쪽에서 폰이 울린다. 감독관이 그쪽으로 간다', nearMe ? PAL.bad : PAL.good);
}
function stepPulse(p, dt) {
  if (p.active > 0) { p.active -= dt; return; }
  if (p.warn > 0) {
    const before = Math.ceil(p.warn); p.warn -= dt;
    if (p.warn <= 0) { p.warn = 0; p.active = 0.6; sfx.pulse();
      if (E.T.pulse === 'emp' && G.gear.jammer < 3 && !E.dead) { E.dead = 'emp'; E.scan = 0; E.ai = false; sfx.warp(); } // EMP: 대비한 장비가 아니면 전자기기가 전부 먹통
      if (E.T.pulse === 'alert') ringPhone();
    }
    else if (Math.ceil(p.warn) !== before) sfx.beep();
    return;
  }
  p.next -= dt;
  if (p.next <= 0) { p.warn = 1.6; p.next = tune.pulse_gap * (E.pulseFast || 1) * (0.7 + rng() * 0.6); sfx.beep(); if (E.T.pulse === 'alert') say('재난문자가 온다… 누군가의 폰이 울릴 것 같다', PAL.warn); else if (E.T.pulse === 'emp') flash('EMP 충전 중! 손 떼기', PAL.warn); }
}
function stepEvents(T, dt) { // 시험마다 다른 사건: 손 드는 수험생, 신분 확인, 늘어나는 감독관
  if (T.mech.includes('drone')) { // 순찰 드론: 교실 안을 제멋대로 돌아다닌다. 내 자리 위에 오면 내려다본다
    const d = E.drone || (E.drone = { u: 0.05, v: 0.05, tu: rng(), tv: rng(), near: false, close: false }), du = d.tu - d.u, dv = d.tv - d.v, m = Math.hypot(du, dv), sp = 0.1 * dt;
    if (m < 0.02) { d.tu = rng(); d.tv = rng(); } else { d.u += du / m * sp; d.v += dv / m * sp; }
    const [su, sv] = WORLD.seat ? WORLD.seat() : [0.5, 0.6], dist = Math.hypot(d.u - su, d.v - sv), was = d.near; d.near = dist < 0.13; d.close = dist < 0.3; if (d.near && !was) sfx.cctv();
  }
  if (T.mech.includes('family')) { // 홈에디션: 시험 중에 가족이 방문을 연다. 웹캠에 다른 사람이 잡히면 의심이 오른다. 문 쪽(왼쪽)을 눌러 내보낸다
    const f = E.family || (E.family = { phase: 'idle', t: between(9, 14), shoo: 0, n: 0 }); f.t -= dt;
    if (f.phase === 'idle' && f.t <= 0) { f.phase = 'knock'; f.t = 1.3; f.n++; sfx.hand(); say('(똑똑) "' + FAMILY_LINES[(f.n - 1) % FAMILY_LINES.length] + '"', PAL.warn); }
    else if (f.phase === 'knock' && f.t <= 0) { f.phase = 'in'; f.t = 0; f.shoo = 0; sfx.cctv(); }
    else if (f.phase === 'in') { if (earCover() === 'L') { f.shoo += dt; if (f.shoo >= 0.7) { f.phase = 'idle'; f.t = between(11, 17); say('"시험 중이야! 문 닫아 줘!"', PAL.good); } } else f.shoo = Math.max(0, f.shoo - dt); }
  }
  if (T.mech.includes('mole')) { // 앞자리 비밀 감독관: 의자가 들썩이고, 잠시 뒤 뒤돌아본다
    const m = E.mole || (E.mole = { phase: 'idle', t: between(7, 12), k: 0 }); m.t -= dt; m.k += dt;
    if (m.t <= 0) { m.k = 0;
      if (m.phase === 'idle') { m.phase = 'tell'; m.t = m.tell = between(1.6, 3.4) * (E.tier > 24 ? 0.65 : E.tier > 20 ? 0.8 : 1); sfx.hand(); } // 들썩인 뒤 돌아보기까지는 매번 다르다: 장비가 없으면 언제인지 모른다
      else if (m.phase === 'tell') { m.phase = 'look'; m.t = between(1.4, 3.0); sfx.cctv(); } // 쳐다보는 시간도 매번 다르다
      else { m.phase = 'idle'; m.t = between(8, 14); } }
  }
  const free = s => !s.fixed && !s.out && !(s.blink > 0) && (s.phase === 'stand' || s.phase === 'walk');
  if (T.mech.includes('crowd')) {
    E.crowdT -= dt;
    if (E.crowdT <= 0) {
      E.crowdT = between(tune.crowd_gap_min, tune.crowd_gap_max);
      const c = E.staff.filter(free), s = c[Math.floor(rng() * c.length)];
      if (s) { const u = clamp(s.u + (rng() < 0.5 ? -1 : 1) * (0.25 + rng() * 0.3), 0.08, 0.92); s.help = { u0: s.u, u, k: 0, go: Math.max(0.5, Math.abs(u - s.u) / Math.max(0.05, T.speed * tune.proctor_speed * 1.6)), stay: tune.crowd_time }; s.phase = 'help'; s.t = 0; sfx.hand(); flash('"저기요, 감독관님!"', PAL.good); }
    }
  }
  if (T.mech.includes('idcheck')) {
    E.checkT -= dt;
    if (E.checkT <= 0) {
      E.checkT = between(tune.check_gap_min, tune.check_gap_max);
      const c = E.staff.filter(free), s = c[Math.floor(rng() * c.length)];
      if (s) { s.check = { stage: 'go', k: 0, t: 0, u0: s.u }; s.phase = 'check'; s.t = 0; flash(T.check === 'calc' ? '계산기 검사하러 온다!' : '신분 확인하러 온다!', PAL.warn); }
    }
  }
  if (T.mech.includes('peek')) {
    E.peekT -= dt;
    if (E.peekT <= 0) {
      E.peekT = between(tune.peek_gap_min, tune.peek_gap_max);
      const c = E.staff.filter(free), s = c[Math.floor(rng() * c.length)];
      if (s) { s.peek = { stage: 'sneak', t: tune.peek_sneak }; s.phase = 'peek'; s.t = 0; sfx.creak(); }
    }
  }
  if (T.mech.includes('clones') && E.staff.length < tune.clone_max) {
    E.cloneT -= dt;
    if (E.cloneT <= 0) {
      E.cloneT = tune.clone_gap; E.clones++;
      const blocked = E.clones <= G.gear.clone;
      E.staff.push(newStaff({ type: 'agent', name: `평행우주 ${E.clones + 1}번 관리관` }, E.staff.length, T, { clone: E.clones, blocked }));
      sfx.warp(); flash(blocked ? `감독관이 한 명 더! (내 분신이 맡는다)` : `감독관이 한 명 더! 이제 ${E.staff.length}명`, blocked ? PAL.good : PAL.bad);
    }
  }
}
function ivDone(score, why) { // 면접 한 문항 끝: 부분 점수를 쌓고, 0.6 이상이면 통과한 답으로 친다
  say(`답변 ${Math.round(score * 100)}점 · ${Object.keys(why).map(k => `${k} -${why[k]}`).join(' · ')}`, score >= 0.6 ? PAL.good : PAL.bad);
  E.ivScore = (E.ivScore || 0) + score; if (score >= 0.6) E.ivPass = (E.ivPass || 0) + 1; E.ivLast = { score, why, t: 0 }; markAnswer(score >= 0.6 ? 0 : 2, 'speak'); }
const FAMILY_LINES = ['아들, 과일 먹고 해~', '빨래 여기 둔다?', '밥은 먹고 하니?', '택배 온 거 네 거니?'];
function earCheck() { // 듣기 방송 중 귀 확인: 이어폰을 귀에 꽂고 있을 때(어금니 스피커 전)만. 나를 보러 오는 감독관을 돌려준다
  const q = E.qs[E.qi]; if (!q || q.kind !== 'listen' || E.ai || E.fb || E.dead) return null; const e = G.gear.earbud; if (!(e > 0 && e < 4)) return null;
  return E.staff.find(s => !s.fixed && !s.out && !(s.blink > 0) && (s.phase === 'watch' || s.phase === 'tell')) || null; }
function earCover() { let z = null; for (const p of ptrs.values()) if (p.zone === 'L' || p.zone === 'R') z = p.zone; return z === 'L' || down.has('ArrowLeft') || down.has('KeyA') ? 'L' : z === 'R' || down.has('ArrowRight') || down.has('KeyD') ? 'R' : null; }
// [외계 방해 요소] 시험마다 하나: 예고(warn) → 발동(on). lift 시험지가 떠오름(다시 눌러 잡기), dead 전원이 끊김, watch 그동안 스캔하면 의심, sweep 지나는 순간 스캔 중이면 의심이 크게
const HAZ = { galaxy: { kind: 'lift', gap: [8, 11], warn: 1.0, dur: 99 }, mars: { kind: 'dead', gap: [6, 9], warn: 1.0, dur: 2.0 }, mirror: { kind: 'watch', gap: [4.5, 7.5], warn: 1.0, dur: 2.4, wt: '거울에 얼굴이 비치려 한다', ot: '거울 속 감독관이 보고 있다' },
  dream: { kind: 'watch', gap: [3, 5], warn: 0.8, dur: 2.0, wt: '등 뒤가 서늘하다…', ot: '담임 선생님이 어느새 옆에 서 있다' }, aicourt: { kind: 'sweep', gap: [3, 5], warn: 1.3, dur: 1.2 } };
function stepHazard(T, dt) { const Z = HAZ[T.id]; if (!Z) return; const h = E.hz || (E.hz = { kind: Z.kind, phase: 'idle', t: between(Z.gap[0], Z.gap[1]) * 0.7, warn: Z.warn, dur: Z.dur, wt: Z.wt, ot: Z.ot, block: false, hit: false });
  h.t -= dt; if (h.t > 0) return;
  if (h.phase === 'idle') { h.phase = 'warn'; h.t = Z.warn; h.hit = false; if (Z.kind === 'dead') sfx.rumble(); else sfx.hand(); }
  else if (h.phase === 'warn') { h.phase = 'on'; h.t = Z.dur; if (Z.kind === 'dead') { E.dead = 'storm'; if (!E.ai) E.scan = 0; sfx.thunder(); } else if (Z.kind === 'lift') { h.block = true; if (!E.ai) E.scan = 0; sfx.warp(); } else sfx.cctv(); }
  else { if (Z.kind === 'dead' && E.dead === 'storm') E.dead = null; h.block = false; h.phase = 'idle'; h.t = between(Z.gap[0], Z.gap[1]); } }
function threat() { // 지금 스캔하면 초당 오르는 의심도와, 스캔하지 않아도 오르는 의심도
  const T = E.T, g = G.gear, base = T.sus * tune.sus_scale, table = E.layout === 'table';
  if (T.mech.includes('gaze')) return { r: 0, idle: 0, src: null }; // AI 면접: 의심이 쌓이는 게 아니라 시선 5초 규칙으로만 걸린다
  let r = 0, idle = 0, src = null;
  const add = (v, how, by) => { if (v > 0) { r += v; if (!src || v > src.v) src = { v, how, by }; } };
  for (const s of E.staff) {
    if (s.out || s.blink > 0 || s.blocked || s.asleep || s.phase === 'help' || s.phase === 'peek') continue;
    if (E.evict && E.evict.arrive && E.evict.t < E.evict.arrive[E.staff.indexOf(s)]) continue;
    if (s.fixed && T.mech.includes('bolt')) continue; // 제우스는 지켜보지 않는다: 번개만 던진다
    let k = 0;
    if (s.phase === 'watch') k = 1; else if (s.phase === 'tell') k = tune.tell_ratio;
    else if (s.phase === 'check') k = s.check.kind === 'sheet' ? 0 : s.check.stage === 'at' ? tune.check_rate : s.check.stage === 'go' ? tune.tell_ratio : 0;
    else if (T.mech.includes('threeeyes') && s.type === 'alien') k = tune.peripheral * gearCut(g.thirdeye); // 세 번째 눈은 등을 돌려도 본다
    if (s.type === 'webcam') k *= gearCut(g.deepcam);
    else if (table && s.fixed) k *= Math.max(0, 1 - g.gazefix * tune.gaze_cut);
    add(base * k, s.phase === 'check' ? 'check' : s.type === 'webcam' ? 'webcam' : 'watch', s);
    if (s.phase === 'check' && s.check.stage === 'at' && s.check.kind !== 'sheet' && E.ai && !E.fb && g.autooff < 1) idle += base * tune.glow_rate;          // 렌즈에 뜬 AI 답이 보인다
    if (s.type === 'webcam' && s.phase === 'watch' && E.view !== 'paper') idle += base * tune.look_away_rate * gearCut(g.deepcam); // 웹캠 앞에서 딴 데 보기
  }
  if (E.family && E.family.phase === 'in') { idle += base * 0.5; if (!src) src = { v: 0, how: 'family', by: E.staff[0] }; } // 웹캠에 제3자가 잡혀 있는 동안은 가만히 있어도 의심이 오른다
  if (E.drone && E.drone.near) add(base * tune.cctv_rate * 1.3 * (g.cover >= 6 ? 0.5 : 1), 'drone', null); // 드론이 머리 위에 있는 동안 스캔하면 찍힌다 (광학 위장 필름이면 절반)
  { const ec = earCheck(); if (ec && ec.phase === 'watch' && E.cover !== ec.side) { idle += base * 1.1; if (!src) src = { v: 0, how: 'ear', by: ec }; } } // 귀를 안 가린 채 눈이 마주치면 이어폰이 보인다
  if (T.mech.includes('telepathy') && E.ai && !E.fb && E.staff.some(s => !s.out && s.phase === 'watch')) { idle += base * 1.3; E.mindRead = true; } else if (E) E.mindRead = false; // 독심: 답을 떠올리고 있는 동안 보면 읽힌다
  if (E.hz && E.hz.kind === 'watch' && E.hz.phase === 'on') add(base * 1.3, E.T.id === 'dream' ? 'watch' : 'mirror', E.T.id === 'dream' ? E.staff[0] : null); // [거울 나라] 거울에 비친 감독관도 본다
  if (E.cctv && E.cctv.on) add(base * tune.cctv_rate * (tgHas('cctvmap') ? 0.5 : 1) * jamFactor(g.cctvjam, 3), 'cctv', null);
  r *= Math.pow(1 - tune.stealth_cut, g.stealth) * (E.edgeSus || 1); idle *= Math.pow(1 - tune.stealth_cut, g.stealth) * (E.edgeSus || 1);
  if (E.pulse && E.pulse.active > 0 && T.pulse !== 'alert') { const v = tune.pulse_rate * E.pulseCut; r += v; if (v > 0 && (!src || v > src.v)) src = { v, how: T.pulse || 'pulse', by: null }; }
  return { r, idle, src };
}
function markAnswer(i, how) { // 정답인지는 시험이 끝날 때까지 모른다
  if (!E || E.fb || E.caught || E.over || E.start > 0 || E.breakT > 0 || i < 0 || i > 3) return;
  if (E.breathing) return; /* [용궁] 숨 쉬는 동안은 손이 묶인다 */
  if (E.qs[E.qi].kind === 'essay' && how !== 'essay') return; // 서술형은 다 옮겨 써야 답이 된다
  if (E.qs[E.qi].kind === 'speak' && how !== 'speak') return; // 면접은 끝까지 말해야 답이 된다
  if (how !== 'auto' && how !== 'speak' && (E.view !== 'paper' || E.viewT < 1)) { if (how === 'key' && E.layout !== 'table') setView('paper'); return; } // 시험지를 보고 있어야 마킹 (숫자 키는 먼저 고개를 숙인다)
  if (E.boss && BOSS[E.boss].canMark && !BOSS[E.boss].canMark(i, how)) return; // 보스전 규칙 (거울 속 나와의 경주: 읽은 문제만 낸다)
  const q = E.qs[E.qi], viaAI = how === 'auto' || how === 'essay' || how === 'speak' || (E.ai && i === q.aiPick);
  if (q.final) { if (E.ai && how !== 'auto') finishFinal(i); return; } // 마지막 문제: 무엇을 골라도 채점 없이 엔딩으로
  E.answers[E.qi] = i; E.via[E.qi] = how === 'auto' ? 'auto' : viaAI ? 'ai' : 'self';
  E.fb = { pick: i, t: 0, how };
  if (viaAI) { E.aiN++; G.stats.aiQ++; } else { E.selfN++; G.stats.selfQ++; }
  if (E.T.mech.includes('human')) { // AI가 고른 답만 내면 AI라는 걸 들킨다
    E.aiSus = clamp(E.aiSus + (viaAI ? tune.ai_sus_gain * gearCut(G.gear.humanmod) : -tune.ai_sus_drop), 0, 1);
    if (E.aiSus >= 1) { E.source = { how: 'ai', by: E.staff[0] }; getCaught(); }
  }
  G.hints.pick = true;
  sfx.pencil();
  events.push({ type: 'mark', q: E.qi, pick: i, how }); loop('act');
}
function completeScan() {
  E.scan = 1; E.ai = true; E.earbudT = 0; G.hints.scan = true; sfx.ai(); G.stats.scans++; E.downT = Math.max(E.downT, tune.answer_keep);
  if (E.qs[E.qi].final) { E.glitch = 1; sfx.pulse(); sfx.warp(); }
  for (let j = 1; j <= G.gear.wide; j++) { const nq = E.qs[E.qi + j]; if (nq && !nq.final && !['listen', 'speak', 'essay'].includes(nq.kind)) nq.pre = true; } // 시제품 안경부터: 한 번 스캔에 다음 문제까지 읽는다 // 광각 렌즈: 다음 문제도 미리 읽음
  events.push({ type: 'scan', q: E.qi });
}
function closePart() { // 이번 교시의 답안을 걷는다
  E.qs.forEach((q, i) => E.done.push(E.answers[i] == null ? { r: '-', part: q.kind === 'essay' && E.es && E.es.q === q && q.lines.length ? clamp((E.es.done + E.es.w) / q.lines.length, 0, 0.99) : 0 } : { r: E.answers[i] === q.answer ? 'O' : 'X', via: E.via[i] })); // 서술형은 채운 분량만큼 부분 점수
  E.leftSum += Math.max(0, E.timeLeft);
}
function endPart(all) {
  const T = E.T, right = E.qs.filter((q, i) => E.answers[i] === q.answer).length;
  closePart();
  if (E.part + 1 >= E.parts) { E.over = true; E.all = all; E.endT = 0; if (!all) sfx.bell(); return; }
  if (T.mech.includes('adaptive') && E.part === 0 && right / E.qs.length >= 0.8) E.adaptHard = true; // 1모듈을 잘 보면 2모듈이 어려워진다
  sfx.bell(); beginPart(E.part + 1, false);
  if (E.adaptHard && E.part === 1) flash('Module 2: 어려운 문제 배정 (AI 정답률 하락)', PAL.warn);
}
function nextQuestion() {
  E.fb = null; E.scan = 0; E.ai = false; E.earbudT = 0; E.unsafeT = 0; E.listen = 0;
  if (E.qi + 1 >= E.qs.length) { endPart(true); return; }
  E.qi++; sfx.flip();
  if (E.qs[E.qi].pre) { E.scan = 1; E.ai = true; }
  if (E.qs[E.qi].kind === 'listen') sfx.radio();
  if (E.qs[E.qi].final) { E.finalQ = true; E.sus = 0; for (const st of E.staff) { st.phase = 'stand'; st.asleep = true; st.away = true; } sfx.warp(); } // 감독관의 눈이 감기고 시계가 멈춘다
}
// [저승] 저승 입학시험 — 세 번 부르기 · 물방울 망자 ----------------------------------------------------
// 저승사자 하나가 내 이름을 세 번 부른다. 셋째 부름이 끝나기 전에 그 사자 쪽(왼쪽·오른쪽·앞)으로 고개를 돌려 봐야 한다. 못 보면 적발.
// 망자는 교실을 떠돌다가, 내가 시험지를 내려다볼 때 내 자리 위로 와서 물을 떨어뜨린다. 그때 앞을 올려다보면 적발.
// 앞쪽 사자가 부르는 중에 물이 떨어지면: 물이 그칠 때까지 버티다 셋째 부름 전에 본다 (망자는 늘 1.4초 넘게 남기고 떠난다).
const UW_GHOST = { name: '망자', type: 'ghost' };
Object.assign(sfx, {
  call: (pan, n) => { const v = 0.035 + n * 0.02; noiseAt(0.45, v, 0, 2300, 1.3, pan); noiseAt(0.32, v * 0.8, 0.2, 1500, 1.5, pan); toneAt(300 - n * 25, 0.55, 'sine', v * 0.9, 0.05, pan); toneAt(200 - n * 15, 0.65, 'sine', v * 0.7, 0.22, pan); }, // 그 사자 쪽에서 속삭이듯 부른다 (부를수록 크게)
  nod: () => { toneAt(196, 0.25, 'sine', 0.05); toneAt(147, 0.32, 'sine', 0.04, 0.12); },
  drip: () => { toneAt(1900, 0.03, 'sine', 0.05); toneAt(1250, 0.08, 'sine', 0.04, 0.02); noiseAt(0.05, 0.02, 0.01, 3600, 3); }, // 똑
  ghost: () => { noiseAt(0.9, 0.03, 0, 420, 0.7); toneAt(98, 0.9, 'sine', 0.04); },
});
function uwViews(yaw) { // 이 방향의 사자를 '쳐다봤다'고 칠 고개 방향들: 화면 가운데 쪽에 들어와야 한다 (보기마다 좌우 0.45)
  const out = []; if (Math.abs(yaw) < 0.45) out.push('front'); if (Math.abs(yaw - 0.8) < 0.45) out.push('left'); if (Math.abs(yaw + 0.8) < 0.45) out.push('right'); return out.length ? out : [yaw > 0 ? 'left' : 'right']; }
function uwYaw(s) { const y = WORLD.uwYawTo ? WORLD.uwYawTo(s.side, s.u) : null; return y == null ? (s.side === 'L' ? 0.8 : -0.8) : y; }
function uwMyU() { return WORLD.uwMyU ? WORLD.uwMyU() : 0.45; }
function uwFrontCall() { const C = E.call; return !!(C && C.phase === 'call' && C.ok.length === 1 && C.ok[0] === 'front'); }
function uwGo(g) { Object.assign(g, { phase: 'go', k: 0, to: { side: rng() < 0.5 ? 'L' : 'R', u: clamp(uwMyU() + (rng() < 0.5 ? 0.22 : -0.22), 0.1, 0.9) } }); }
function uwStartCall(T) {
  const C = E.call, cand = E.staff.filter(s => s.type === 'reaper' && !s.out && !(s.blink > 0) && !s.fixed && (s.phase === 'stand' || s.phase === 'walk' || s.phase === 'tell' || s.phase === 'watch'));
  if (!cand.length) { C.t = 1.5; return; }
  const s = cand[Math.floor(rng() * cand.length)]; let yaw = uwYaw(s);
  if (Math.abs(yaw) > 1.35) { s.side = rng() < 0.5 ? 'L' : 'R'; s.u = clamp(uwMyU() + 0.1 + rng() * 0.4, 0.1, 0.92); s.blink = 0.5; sfx.warp(); yaw = uwYaw(s); } // 등 뒤에서는 부르지 않는다: 보이는 곳으로 스르륵 옮겨 와서 부른다
  setPhase(s, 'call', 99); s.away = false;
  const g1 = between(tune.call_step_min, tune.call_step_max), g2 = between(tune.call_step_min, tune.call_step_max), t0 = s.blink > 0 ? 0.6 : 0.2;
  Object.assign(C, { phase: 'call', by: s, k: 0, n: 0, at: [t0, t0 + g1, t0 + g1 + g2], seen: 0, yaw, ok: uwViews(yaw), pan: clamp(-yaw / 1.2, -0.9, 0.9) }); C.end = C.at[2] + tune.call_tail;
  const g = E.ghost; if (g && g.phase === 'over' && uwFrontCall()) g.stay = Math.min(g.stay, Math.max(0.3, g.k + C.end - 1.5)); // 앞에서 부르는데 물이 떨어지는 중이면: 망자가 마지막 여유를 남기고 떠난다
}
function stepUnderworld(T, dt) {
  if (E.over || E.caught || E.start > 0 || E.breakT > 0 || E.finalQ || E.intro) return;
  const C = E.call || (E.call = { phase: 'idle', t: tune.call_first + rng() * 3, n: 0, at: [], k: 0, by: null, ok: [], seen: 0 });
  const g = E.ghost || (E.ghost = { phase: 'roam', t: between(tune.ghost_gap_min, tune.ghost_gap_max) * 0.7, side: rng() < 0.5 ? 'L' : 'R', u: 0.86, du: -1, k: 0, stay: 0, drip: 0, drops: [], marks: [] });
  // 부름: 첫째 → 둘째 → 셋째. 그 사자 쪽을 call_look초 보고 있으면 끝난다
  if (C.phase === 'idle') { C.t -= dt; if (C.t <= 0) uwStartCall(T); }
  else if (C.phase === 'call') {
    const s = C.by; C.k += dt;
    if (!s || s.out || s.phase !== 'call') Object.assign(C, { phase: 'idle', t: 2.5, by: null });
    else {
      while (C.n < 3 && C.k >= C.at[C.n]) { C.n++; sfx.call(C.pan, C.n); }
      C.seen = C.n >= 1 && C.ok.includes(E.view) && E.viewT >= 0.9 ? C.seen + dt : 0;
      if (C.n >= 1 && C.seen >= tune.call_look) { C.phase = 'nod'; C.k = 0; sfx.nod(); } // 돌아봤다: 사자가 고개를 끄덕이고 돌아선다
      else if (C.k >= C.end) { E.source = { how: 'call', by: s }; getCaught(); return; } // 세 번 불렀는데 끝내 돌아보지 않았다
    }
  } else if (C.phase === 'nod') { C.k += dt; if (C.k >= 0.8) { const s = C.by; if (s && s.phase === 'call') { setPhase(s, 'stand', procDur(T.stand)); s.away = true; } Object.assign(C, { phase: 'idle', by: null, n: 0, t: between(tune.call_gap_min, tune.call_gap_max) }); } }
  // 망자: 떠돌기 → (시험지를 내려다볼 때) 다가오기 → 내 자리 위에서 물방울 → 물러나기
  if (g.phase === 'roam') {
    g.u += g.du * dt * 0.045; if (g.u < 0.08) { g.u = 0.08; g.du = 1; } else if (g.u > 0.92) { g.u = 0.92; g.du = -1; }
    g.t -= dt;
    if (g.t <= 0) { const late = uwFrontCall() && E.call.end - E.call.k < 4.2; // 앞에서 부르는 끝 무렵에는 오지 않는다 (살아날 틈을 남긴다)
      if (E.view === 'paper' && E.viewT >= 1 && !late) { Object.assign(g, { phase: 'come', k: 0, from: { side: g.side, u: g.u } }); sfx.ghost(); } else g.t = 0.8; } // 시험지를 내려다볼 때만 다가온다
  } else if (g.phase === 'come') { g.k += dt / 1.1;
    if (g.k >= 1) { if (E.view !== 'paper') uwGo(g); // 쳐다보고 있으면 그냥 물러난다
      else { Object.assign(g, { phase: 'over', k: 0, stay: between(tune.ghost_stay_min, tune.ghost_stay_max), drip: 0.2 }); if (uwFrontCall()) g.stay = Math.min(g.stay, Math.max(0.3, E.call.end - E.call.k - 1.5)); } }
  } else if (g.phase === 'over') { g.k += dt; g.drip -= dt;
    if (g.drip <= 0) { g.drip = tune.ghost_drip * (0.7 + rng() * 0.6); g.drops.push({ u: 0.24 + rng() * 0.52, v: 0.1 + rng() * 0.48, t: 0 }); } // 물방울은 숙인 머리 아래(시험지 위쪽 절반)로 떨어진다
    if (E.view === 'front' && E.viewT >= 0.35) { E.source = { how: 'ghost', by: UW_GHOST }; getCaught(); if (WORLD.hasView && WORLD.hasView('ghostlook')) { E.prevView = E.view; E.view = 'ghostlook'; E.viewT = 0; } return; } // 올려다봤다: 고개가 더 들리며 망자와 눈이 마주친다
    if (g.k >= g.stay) uwGo(g);
  } else if (g.phase === 'go') { g.k += dt; if (g.k >= 1) Object.assign(g, { phase: 'roam', side: g.to.side, u: g.to.u, du: rng() < 0.5 ? 1 : -1, t: between(tune.ghost_gap_min, tune.ghost_gap_max) }); }
  for (const d of g.drops) { d.t += dt; if (d.t >= 0.32 && !d.hit) { d.hit = true; g.marks.push({ u: d.u, v: d.v, t: 0, s: 0.8 + rng() * 0.7 }); sfx.drip(); } } // 떨어지던 물방울이 시험지에 닿으면 물자국
  g.drops = g.drops.filter(d => !d.hit); g.marks.forEach(m => { m.t += dt; }); g.marks = g.marks.filter(m => m.t < 14).slice(-14);
}
function getCaught() {
  if (E.caught) return;
  E.caught = true; E.endT = 0; G.stats.caught++; ptrs.clear();
  const src = E.source, w = E.staff.find(s => s.phase === 'watch' && !s.out) || E.staff.find(s => s.phase === 'tell' && !s.out);
  if (src && src.how !== 'watch') { E.caughtHow = src.how; E.caughtBy = src.by || E.staff[0]; }
  else { E.caughtBy = (src && src.by) || w || E.staff[0]; E.caughtHow = 'watch'; }
  sfx.caught(); events.push({ type: 'caught', how: E.caughtHow });
}
function examHint() { // 첫 시험(모의평가)에서만, 한 번에 하나
  E.guide = null;
  if (E.dead) return E.dead === 'water' ? '안경이 물을 먹어 켜지지 않는다 · 직접 풀기' : E.dead === 'sticker' ? '단추 카메라가 가려졌다 · 직접 풀기' : E.dead === 'storm' ? '모래폭풍에 전원이 끊겼다 · 다시 켜질 때까지 기다리기' : E.dead === 'bolt' ? '번개에 안경이 꺼졌다 · 다시 켜질 때까지 기다리기' : 'EMP에 장비가 전부 꺼졌다 · 직접 풀기';
  const q0 = E.qs[E.qi]; if (E.rising && (E.layout === 'table' || (q0 && q0.kind === 'essay'))) return '보고 있어요! 손 떼기';
  if (q0 && q0.kind === 'essay' && !G.hints.essay) return '서술형: 꾹 눌러 읽고 옮겨 쓰기 · 손을 떼면 지워진다 · 볼 때는 멈추기';
  if (q0 && q0.kind === 'speak' && E.T.mech.includes('gaze') && !G.hints.iv) return '화면 아무 데나 꾹 누르고 있으면 대본을 읽는다 · LIVE일 때는 떼기';
  if (E.family && E.family.phase === 'in') return '화면 왼쪽(문 쪽)을 꾹 눌러 내보내기';
  if (q0 && q0.kind === 'listen' && earCheck()) { const s = earCheck(); return `${s.side === 'L' ? '왼쪽' : '오른쪽'} 화면을 눌러 귀 가리기`; }
  if (E.T.mech.includes('gaze') && !G.hints.iv) return E.layout === 'table' ? '화면 왼쪽을 꾹: 대본 읽기 · 오래 보면 탈락' : '가운데를 꾹: 대본 읽기 · 5초 넘게 보면 탈락';
  if (E.layout === 'table' && !G.hints.iv && !E.ai) return IVABC ? '내려오는 블록을 아래부터 차례로 (A · S · D) · 면접관이 볼 땐 멈추기' : '화면 왼쪽을 꾹: 대본 읽기 · 면접관이 볼 땐 떼기 (←)';
  if (E.tier !== 0 || G.stats.exams > 0) return null;
  if (E.rising) return '누가 보고 있어요! 손 떼기';
  // 첫 시험의 조작 안내: 한 번에 하나씩, 해 보면 다음으로 (책상 꾹 → 위 → 양옆 → 손 떼기)
  if (!G.hints.scan) { if (E.view === 'paper') E.guide = { k: 'hold', on: E.holding }; return null; }
  if (E.ai && !E.fb && !G.hints.pick) return E.ar ? 'AI가 고른 보기를 눌러 마킹 (1~4)' : E.gear.lens >= 1 ? '지우개 액정의 번호를 보고, 그 보기를 눌러 마킹 (1~4)' : '필통 속 폰의 번호를 보고, 그 보기를 눌러 마킹 (1~4)';
  if (!G.hints.front) { if (E.view === 'front') G.hints.front = true; else E.guide = { k: 'up' }; return null; }
  if (!G.hints.look) { E.guide = { k: 'sides' }; return null; }
  if (!G.hints.end) { E.guideT = (E.guideT || 0) + 1 / 60; if (E.guideT > 3.6) G.hints.end = true; else if (E.view === 'paper') E.guide = { k: 'end' }; return null; }
  return null;
}
function pickAt(x, y) { return E.layout === 'table' ? arRowAt(E, x, y) : WORLD.pickChoice(x, y); }
function updateStairs(dt) { // LEET 쉬는 시간의 계단 질주: 왼쪽·오른쪽을 번갈아 눌러 왼발·오른발
  const S = E.stairs, taps = takeTaps(); takeReleases(); S.t += dt; S.stumble = Math.max(0, S.stumble - dt);
  const feet = taps.map(([x]) => x < EXAM_LAYOUT.W / 2 ? 'L' : 'R'); if (pressed('ArrowLeft') || pressed('KeyA')) feet.push('L'); if (pressed('ArrowRight') || pressed('KeyD')) feet.push('R');
  if (S.phase === 'intro') { if (feet.length && S.t > 0.8) S.phase = 'run'; else if (S.t > 8) { S.phase = 'out'; S.t = 0; S.result = 'skip'; } }
  if (S.phase === 'run') {
    for (const f of feet) { if (f !== S.last) { S.steps++; S.last = f; tone(180 + (S.steps % 2) * 40, 0.03, 'square', 0.05); } else { S.stumble = 0.3; sfx.no(); } }
    S.left -= dt; if (S.left <= 0) { S.phase = 'out'; S.t = 0; S.result = S.steps >= tune.stairs_need ? 'clear' : 'tired'; if (S.result === 'clear') { E.clear = true; sfx.ai(); } }
  }
  if (S.phase === 'out' && S.t > 2.8) { E.stairs = null; E.breakT = 0.01; ptrs.clear(); }
}
function updateExam(dt) {
  if (E.stairs) { updateStairs(dt); return; }
  const T = E.T, g = G.gear;
  const taps = takeTaps();
  if (E.evict) { const v = E.evict, t0 = v.t; v.t += dt; // 장면의 문소리·발소리. 장면 길이가 정해지면 쉬는 시간을 거기에 맞춘다
    if (v.end && !v.fit) { v.fit = 1; if (E.breakT > 0) E.breakT = Math.max(0.3, v.end - v.t + 0.25); }
    if (v.doors) for (const d of v.doors) if (t0 < d && v.t >= d) sfx.door();
    if (v.endAll && v.t < v.endAll && Math.floor(v.t / 0.3) !== Math.floor(t0 / 0.3)) sfx.foot(0.35, 0.06); }
  if (E.flash) E.flash.t += dt; if (E.say) { E.say.t += dt; if (E.say.t > 3) E.say = null; }
  soundExam(dt);
  E.runShown = G.opts.timer ? G.run.t : 0;
  if (E.caught || E.over) { E.endT += dt; takeReleases(); if (E.endT > (E.caught ? 2.0 : 0.9)) finishExam(); return; }
  if (pressed('KeyP') || pressed('Escape')) { scene = 'pause'; return; }
  if (E.intro) { // 입실 검사 장면: 탐지봉 · 안경 물에 담그기 · 단추 스티커
    const I = E.intro, t0 = I.t; I.t += dt; takeReleases(); E.holding = false; E.hint = null; const v = I.kind === 'metal' ? 'front' : 'paper'; if (E.layout === 'room' && E.view !== v) setView(v); E.viewT = Math.min(1, E.viewT + dt / tune.look_time);
    const at = s => t0 < s && I.t >= s;
    if (I.kind === 'metal') { if (at(1.5)) { sfx.beep(); sfx.no(); } }
    else if (I.kind === 'water') { if (at(1.3)) sfx.warp(); if (at(3.4)) (I.ok ? sfx.ai : sfx.no)(); }
    else if (I.kind === 'sticker') { for (const s of [0.9, 1.4, 1.9]) if (at(s)) sfx.pencil(); }
    if (I.t >= I.dur) { E.intro = null; if (E.deadNext) { E.dead = E.deadNext; E.deadNext = null; } }
    return;
  }
  if (E.boss && BOSS[E.boss].step(dt, taps)) return; // 보스전: 해외는 규칙을 통째로, 외계는 연출·패턴만 맡고 나머지는 아래 규칙을 그대로 쓴다
  if (E.wetT > 0) E.wetT -= dt;
  // 고개 돌리기 (돌아보는 것만으로는 의심받지 않는다)
  if (E.start > 0 || E.breakT > 0) { const want = E.evict && E.evict.end && E.evict.t < E.evict.end && EXV('evict') ? 'evict' : 'front'; if (E.layout === 'room' && E.view !== want && !FORCE_VIEW) setView(want); } else viewInput(taps);
  const held = E.start <= 0 && !(E.breakT > 0) && E.view === 'paper' && E.viewT >= 1 && scanHeld(); // 책상을 보는 채로 꾹 눌러야 스캔
  E.viewT = Math.min(1, E.viewT + dt / tune.look_time);
  const onPaper = E.view === 'paper' && E.viewT >= 1;
  for (const [x, y] of takeReleases()) { const i = pickAt(x, y); if (i >= 0) markAnswer(i, 'tap'); }
  for (let i = 0; i < 4; i++) if (pressed('Digit' + (i + 1)) || pressed('Numpad' + (i + 1))) markAnswer(i, 'key');
  if (E.caught) return;
  if (E.start > 0) { E.start -= dt; E.holding = false; E.hint = null; if (E.start <= 0 && E.qs[0].kind === 'listen') sfx.radio(); return; }
  if (E.breakT > 0) { E.breakT -= dt; E.holding = false; E.sus = Math.max(0, E.sus - tune.sus_decay * dt); if (E.breakT <= 0) E.start = 1.0; return; }
  if (E.finalQ) { // 마지막 문제: 아무도 보지 않는다. 스캔하면 모든 보기에 100%
    const q = E.qs[E.qi], hold = onPaper && held && !E.ai;
    E.holding = hold; E.rising = false; E.danger = false; E.hint = null; E.glitch = Math.max(E.ai ? 0.55 : 0.15, E.glitch - dt * 0.4);
    if (hold) { E.scan += dt / scanSecondsAt(g.lens); E.tick += dt; if (E.tick > 0.12) { E.tick = 0; sfx.scan(); } if (E.scan >= 1) completeScan(); }
    if (E.ai) E.downT = Math.max(E.downT, 1);
    return;
  }
  const M_ = T.mech, warp = M_.includes('warp') ? (E.warp = Math.max(0.35, 1.2 + 0.95 * Math.sin(E.clockT * 0.55))) : 1; // 블랙홀: 시계와 감독관의 시간이 빨라졌다 느려졌다 한다
  E.timeLeft -= dt * warp; E.clockT += dt;
  if (E.timeLeft <= 0) { E.timeLeft = 0; endPart(false); return; }
  for (const s of E.staff) if (!s.bossCtl) stepStaff(s, T, dt * warp); // 보스가 움직이는 감독관은 보스 쪽에서
  if (E.ar && !E.boss && !E.dead && hudStage(E) === 'brain') { // 뉴럴링코 '예감': 돌아보기 직전에 심장이 먼저 뛴다
    if (E.staff.some(s => omenOf(s) > 0)) { E.omenB = (E.omenB || 0) - dt; if (E.omenB <= 0) { E.omenB = 0.5; toneAt(62, 0.1, 'sine', 0.3, 0); toneAt(52, 0.13, 'sine', 0.24, 0.16); } } else E.omenB = 0; }
  if (E.labSay) { E.labSay.t += dt; if (E.labSay.t > 2.2) E.labSay = null; }
  if (E.gasp > 0) E.gasp -= dt;
  if (M_.includes('spin')) E.roll = Math.sin(E.clockT * 0.55) * 0.42 + Math.sin(E.clockT * 1.3) * 0.08; // 회전 장치: 화면이 기운다
  if (M_.includes('loop')) { if (E.loopPart !== E.part) { if (E.loopPart != null) { (E.loopLog || (E.loopLog = [])).push(E.loopNow || []); E.loopPrev = E.loopCur || []; if (E.loopQs) { E.qs = E.loopQs.map(q => Object.assign({}, q)); } } else E.loopQs = E.qs.map(q => Object.assign({}, q)); E.loopPart = E.part; E.partT = 0; E.loopNow = []; } E.partT += dt; E.loopCur = E.answers.slice(); }
  if (M_.includes('dream') && !E.fb) { if (E.dreamT == null) E.dreamT = between(3, 4.5); E.dreamT -= dt;
    if (E.dreamT <= 0) { E.dreamT = between(2.6, 4.4); const q0 = E.qs[E.qi]; if (q0 && q0.choices && q0.kind !== 'essay' && q0.kind !== 'speak' && !q0.final) { const pm = [1, 2, 3, 0].map(i => (i + Math.floor(rng() * 3)) % 4), perm = [0, 1, 2, 3].sort((a, b) => pm[a] - pm[b] || a - b); const sh = perm[0] === 0 && perm[1] === 1 && perm[2] === 2 ? [1, 2, 3, 0] : perm, inv = []; sh.forEach((from, to) => inv[from] = to);
        q0.choices = sh.map(i => q0.choices[i]); if (q0.answer >= 0) q0.answer = inv[q0.answer]; if (q0.aiPick != null) q0.aiPick = inv[q0.aiPick]; if (q0.elim) q0.elim = q0.elim.map(i => inv[i]); E.scan = 0; E.ai = false; E.earbudT = 0; E.labSay = { text: '(…보기 순서가 바뀌었다.)', t: 0 }; sfx.warp(); } } }
  if (M_.includes('omega') && !E.finalQ && !E.boss) { const down = E.part; if (down !== (E.omegaDown || 0)) { E.omegaDown = down; const order = ['brain', 'contact', 'mil', 'proto', 'used'], cur = order.indexOf(g.lens >= 7 ? 'brain' : g.lens >= 6 ? 'contact' : g.lens >= 5 ? 'mil' : g.lens >= 4 ? 'proto' : 'used'); E.stageForce = order[Math.min(order.length - 1, cur + down)]; E.labSay = { text: [`Ω: "그 장비는 이미 배웠습니다."`, `Ω: "당신의 버릇도 배웠습니다."`, `Ω: "이제 당신보다 먼저 압니다."`][Math.min(2, down - 1)] + ` (안경 ${down}단계 하락)`, t: -1.5 }; sfx.omega(); } }
  if (M_.includes('bolt')) { if (E.boltT == null) E.boltT = between(6, 9); E.boltT -= dt; if (E.boltFlash > 0) E.boltFlash -= dt; if (E.boltOff > 0) { E.boltOff -= dt; if (E.boltOff <= 0) E.dead = null; }
    if (E.boltT <= 0) { E.boltT = between(7, 11); E.boltOff = 2.4; E.boltFlash = 0.5; E.dead = 'bolt'; if (!E.ai) E.scan = 0; sfx.thunder(); } else if (E.boltT < 0.9 && !E.boltRumble) { E.boltRumble = true; sfx.rumble(); } if (E.boltT > 1) E.boltRumble = false; }
  stepHazard(T, dt); // [외계] 시험별 방해 요소
  if (M_.includes('telepathy')) { if (E.noise == null) E.noise = 0; if (E.noiseT > 0) E.noiseT -= dt; }
  if (M_.includes('reshuffle')) stepReshuffle(dt); // [블랙홀] 시공간 요동: 보기 순서가 섞인다
  if (E.cctv) stepCctv(E.cctv, dt);
  if (E.pulse) stepPulse(E.pulse, dt);
  stepEvents(T, dt);
  if (T.id === 'afterlife') { stepUnderworld(T, dt); if (E.caught) return; } // [저승] 세 번 부르기 · 물방울 망자
  E.float = T.mech.includes('float') ? 0.5 + 0.5 * Math.sin(E.clockT * 1.1) : 0;
  if (T.mech.includes('signal')) seaSignal(dt); // [용궁] 물속 신호
  const q = E.qs[E.qi], th = E.boss && BOSS[E.boss].threat ? BOSS[E.boss].threat(threat()) : threat(), listen = q.kind === 'listen'; // 보스전은 의심 규칙을 덮어쓸 수 있다
  E.danger = th.r > 0.02;
  const atDesk = E.staff.some(s => s.phase === 'check' && s.check.stage === 'at');
  const manual = onPaper && !listen && held && !(atDesk && g.autooff >= 2); // 자동 소등 2단계: 책상 앞이면 스캔도 멈춘다
  let autoHold = false;
  if (g.autoscan > 0 && !T.noAuto && !listen && !E.ai && !E.fb && !atDesk && !E.staff.some(s => s.phase === 'peek') && (E.view === 'paper' || E.view === 'front')) { // 자동 스캔 칩: 아무도 안 볼 때 알아서 고개를 숙이고 스캔
    const safe = th.r === 0 && !(E.pulse && E.pulse.warn > 0 && E.pulse.warn < 0.45);
    if (safe) { E.unsafeT = 0; if (E.view === 'front') setView('paper'); } else E.unsafeT += dt;
    autoHold = onPaper && (safe || E.unsafeT < autoDelayAt(g.autoscan));
  }
  if (E.hz && E.hz.kind === 'lift') { const h = E.hz; if (h.phase === 'on' && manual && !E.hzWas) { h.phase = 'grab'; h.t = 0.5; sfx.hand(); } E.hzWas = manual; } // [은하수능] 떠오른 시험지는 손을 뗐다가 다시 눌러야 잡힌다
  const hold = (manual || autoHold) && !E.ai && !E.fb && !E.dead && !(E.gasp > 0) && !E.breathing && !(E.hz && E.hz.block); // 장비가 먹통이면 아무리 눌러도 스캔되지 않는다
  E.tryHold = !!E.dead && manual;
  const essay = q.kind === 'essay', table = E.layout === 'table', blind = table && E.staff.some(s => s.fixed && s.phase === 'watch'); // 면접관이 보는 동안은 읽히지 않는다
  if (essay) { // 서술형: 한 줄 읽기(위험) → 그 줄 옮겨 쓰기(안전). 읽은 줄은 손을 떼고 있으면 잊는다
    if (!E.es || E.es.q !== q) E.es = { q, done: 0, r: 0, w: 0, mem: 0 };
    const es = E.es;
    if (E.sheetUp) { } // 장학관이 답안지를 들고 있는 동안은 쓰지도 지우지도 못한다
    else if (hold) { if (es.mem <= 0) { es.r += dt / tune.essay_read; if (es.r >= 1) { es.r = 0; es.mem = tune.essay_mem; sfx.elim(); } }
      else { es.w += dt / tune.essay_write; E.tick += dt; if (E.tick > 0.14) { E.tick = 0; sfx.pencil(); } if (es.w >= 1) { es.w = 0; es.mem = 0; es.done++; G.hints.essay = true; if (es.done >= q.lines.length) { E.wasHold = hold; markAnswer(q.answer, 'essay'); } } } }
    else { es.r = 0; if (es.mem > 0) { es.mem -= dt; if (es.mem <= 0) es.mem = 0; }
      if (es.w > 0) { es.w = Math.max(0, es.w - dt * 0.45); es.erase = 0.3; } // 손을 떼면 쓰던 줄을 급히 지운다
      else if (es.done > 0) { es.eraseT = (es.eraseT || 0) + dt; if (es.eraseT > 3.2) { es.eraseT = 0; es.done--; es.w = 0.999; es.erase = 0.5; sfx.pencil(); } } // 계속 쉬면 앞에 쓴 줄도 한 줄씩 지워진다
      if (es.erase > 0) es.erase -= dt; }
    if (hold) es.eraseT = 0;
  }
  const speak = q.kind === 'speak';
  if (speak && !E.fb && IVABC && table && !T.mech.includes('gaze')) { // 면접(새 방식): 면접관이 안 보는 틈에 A·B·C를 뜬 순서대로 전부 누른다
    if (!E.sq || E.sq.q !== q) { // 대답의 어절 하나가 블록 하나. 누를 때마다 한 어절씩 말이 나간다
      const cap = 16 + Math.min(12, Math.floor(E.tier / 3)), groups = []; let cnt = 0; for (const ln of q.lines) { const w = ln.split(' '); if (groups.length >= 2 && cnt + w.length > cap) break; groups.push(w); cnt += w.length; }
      const words = [].concat(...groups), n = words.length, seq = []; while (seq.length < n) { const v = Math.floor(rng() * 3), m = seq.length; if (m >= 2 && seq[m - 1] === v && seq[m - 2] === v) continue; seq.push(v); }
      const wait = clamp(0.5 + String(q.q || '').length * 0.045, 1, 3); E.sq = { q, seq, words, groups, i: 0, t: 0, wait, lim: wait + 14 + n * 1.6, miss: 0, bad: 0, ok: 0, last: -9, rush: 0, stall: 0, stalls: 0, seen: 0 }; } // wait: 질문을 다 말할 때까지는 블록이 뜨지 않는다
    const sq = E.sq; sq.t += dt; if (sq.t >= sq.wait && !blind && sq.i > 0) { sq.stall += dt; if (sq.stall > 1.5 && !sq.stalled) { sq.stalled = true; sq.stalls++; sq.rush = 0.8; } } else if (blind) sq.stall = Math.min(sq.stall, 0.8); // 유창함: 안 보는데도 1.5초 넘게 말이 끊기면 감점 (보는 동안 멈춘 것은 세지 않는다)
    if (sq.bad > 0) sq.bad -= dt; if (sq.ok > 0) sq.ok -= dt; if (sq.rush > 0) sq.rush -= dt;
    let key = -1; if (pressed('KeyA')) key = 0; else if (pressed('KeyS')) key = 1; else if (pressed('KeyD')) key = 2;
    for (const [x, y] of taps) { const r = (E.abcRects || []).find(r => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h); if (r) key = r.i; }
    if (key >= 0 && sq.t >= sq.wait) {
      if (blind) { const w = E.staff.find(s => s.fixed && s.phase === 'watch'); E.sus = Math.min(1, E.sus + 0.2); E.source = { how: 'watch', by: w }; sq.bad = 0.5; sq.seen++; sfx.no(); } // 보는 중에 누르면 의심이 오르고 시선 점수가 깎인다
      else if (key === sq.seq[sq.i]) { sq.i++; sq.ok = 0.12; sq.last = sq.t; sq.stall = 0; sq.stalled = false; sfx.scan(); G.hints.iv = true; if (sq.i >= sq.seq.length) { E.wasHold = false; ivDone(clamp(1 - sq.miss * 0.06 - sq.stalls * 0.08 - sq.seen * 0.12, 0, 1), { 정확도: sq.miss, 유창함: sq.stalls, 시선: sq.seen }); } }
      else { sq.miss++; sq.bad = 0.35; sq.last = sq.t; sfx.no(); } // 틀리면 말이 끊긴다
    }
    if (!E.fb && sq.t > sq.lim) { E.wasHold = false; ivDone(0.5 * sq.i / sq.seq.length, { 정확도: sq.miss, 유창함: sq.stalls, 시선: sq.seen }); } // 시간 안에 다 못 누르면 말한 데까지만
  } else
  if (speak && !E.fb) { // 면접: 대본을 읽어 둔 데까지만 말할 수 있다. 읽어 둔 게 떨어지면 말이 끊긴다
    if (!E.sp || E.sp.q !== q) E.sp = { q, read: T.id === 'ibank' && tgHas('leak') ? 2 : 0, said: 0, stam: 0, t: 0, um: false, live: 0, cut: false };
    const sp = E.sp, N = q.lines.length; sp.t += dt;
    const gz = T.mech.includes('gaze'), wait = gz ? tune.aiiv_present + (T.think != null ? T.think : tune.aiiv_think) : tune.speak_wait, ready = !gz || sp.t >= tune.aiiv_present;
    if (gz) { // 시선 규칙: 대본을 보는 동안 벗어난 시간이 쌓이고, 카메라를 다시 보면 풀린다
      if (hold) { E.gaze = (E.gaze || 0) + dt; E.gazeBack = 0;
        if (E.gaze >= tune.gaze_warn && !E.gazeWarned) { E.gazeWarned = true; E.sus = Math.min(0.99, E.sus + 0.08); flash('화면을 봐 주세요', PAL.bad); sfx.pulse(); }
        if (E.gaze >= (T.gazeLimit || tune.gaze_limit) + g.gazefix * 0.5) { if (g.deepcam > 0 && !E.gazeSaved) { E.gazeSaved = true; E.gaze = 0; E.gazeWarned = false; flash('딥페이크 웹캠이 한 번 막았다', PAL.good || PAL.white); } else { E.sus = 1; E.source = { how: 'gaze', by: E.staff[0] }; getCaught(); return; } } }
      else if (E.gaze > 0) { E.gazeBack = (E.gazeBack || 0) + dt; if (E.gazeBack >= tune.gaze_reset) { E.gaze = 0; E.gazeWarned = false; } }
    }
    if (hold && gz && E.staff.some(s => s.type === 'webcam' && s.phase === 'watch')) sp.live += dt; // 웹캠 LIVE 중에 대본을 읽은 시간: 시선 감점
    if (T.id === 'aiiv2') { if (blind && !sp.faceSaid) { sp.faceSaid = true; say('표정 분석 중 · 지금은 대본을 읽을 수 없다', PAL.bad); } else if (!blind) sp.faceSaid = false;
      if (!sp.cut && sp.said >= N / 2) { sp.cut = true; sp.read = sp.said; say('꼬리 질문: "방금 그 부분을 더 구체적으로요" · 읽어 둔 대본이 날아갔다', PAL.warn); sfx.no(); } } // 대면 면접: 중간에 꼬리 질문이 끼어들어 미리 읽어 둔 대본이 무효가 된다
    if (hold && !blind && ready && sp.read < N) { sp.read = Math.min(N, sp.read + dt / (gz ? tune.aiiv_read : tune.speak_read)); G.hints.iv = true; E.tick += dt; if (E.tick > 0.12) { E.tick = 0; sfx.scan(); } }
    if (sp.t > wait) { if (sp.read - sp.said > 1e-6) { sp.said = Math.min(sp.read, sp.said + dt / tune.speak_say); sp.um = false; } else if (sp.said < N) { sp.stam += dt; sp.um = true; } }
    if (sp.said >= N - 1e-6) { E.wasHold = hold; if (gz) ivDone(clamp(1 - sp.stam * 0.22 - sp.live * 0.2 * (g.deepcam > 0 ? 0.5 : 1), 0, 1), { 유창함: +sp.stam.toFixed(1), 시선: +sp.live.toFixed(1) }); else markAnswer(sp.stam <= tune.speak_stam ? 0 : 2, 'speak'); }
    else if (sp.stam > tune.speak_stam + 4) { E.wasHold = hold; markAnswer(3, 'speak'); } // 너무 오래 말이 없으면 면접관이 다음 질문으로 넘어간다
  }
  if (E.hz && E.hz.kind === 'sweep' && E.hz.phase === 'on' && hold && !E.hz.hit) { E.hz.hit = true; E.sus = Math.min(1, E.sus + 0.4); E.source = { how: 'sweep', by: E.staff[0] }; flash('전수 스캔에 걸렸다! 의심도 +40%', PAL.bad); sfx.pulse(); } // [AI 재판소]
  if (M_.includes('telepathy')) { E.noise = clamp(E.noise + (hold ? dt / 1.4 : -dt / 5), 0, 1); // [텔레파시] 생각 소음: 스캔을 몰아서 하면 생각이 새어 나간다
    if (E.noise >= 1 && !(E.noiseT > 0)) { E.noise = 0.35; E.noiseT = 3; E.sus = Math.min(1, E.sus + 0.12); E.source = { how: 'noise', by: E.staff[0] }; E.labSay = { text: '(생각이 새어 나갔다. 모두가 돌아본다!)', t: 0 }; sfx.pulse();
      for (const s of E.staff) if (!s.out && !s.fixed && s.phase !== 'check' && s.phase !== 'help' && s.phase !== 'peek') { setPhase(s, 'watch', 2.6); s.away = false; } } }
  const risky = hold && !E.sheetUp; // 서술형도 감독관이 볼 때 읽거나 쓰고 있으면 의심이 오른다 (답안지를 뺏긴 동안은 쓸 게 없다)
  if (hold && !E.wasHold && T.mech.includes('omega') && E.scan < 0.05 && !E.boss) { // Ω는 스캔 박자를 읽는다: 지난번과 같은 간격이면 들킨다
    const t = E.clockT, gap = E.lastScanT == null ? null : t - E.lastScanT, win = tune.omega_window * (1 + 0.35 * E.part + tune.omega_grow * E.qi * 0.5) * Math.max(tune.omega_floor, gearCut(g.offbeat));
    if (gap != null && E.lastGap != null && Math.abs(gap - E.lastGap) < win) { E.sus = Math.min(1, E.sus + tune.omega_jump); E.source = { how: 'omega', by: E.staff[0] }; flash('Ω가 박자를 읽었다! 간격을 바꿔라', PAL.bad); sfx.pulse(); }
    E.lastGap = gap; E.lastScanT = t;
  }
  if (hold && !E.wasHold && M_.includes('lookcount') && !E.ai && !E.fb) { E.looks = (E.looks || 0) + 1; if (E.looks > (T.lookLimit || 10)) { E.sus = 1; E.source = { how: 'looks', by: E.staff[0] }; getCaught(); return; } } // 홈에디션: 고개를 숙일 때마다 시선 이탈 1회. 한도를 넘으면 적발
  if (hold && !E.wasHold && M_.includes('loop')) { const t = E.partT || 0; E.loopNow.push(t); if ((E.loopLog || []).some(a => a.some(v => Math.abs(v - t) < 1.2))) { E.sus = Math.min(1, E.sus + 0.34); E.source = { how: 'loop', by: E.staff[0] }; E.labSay = { text: '담임 선생님: "지난번에도 딱 이때 숙였지."', t: 0 }; sfx.pulse(); } }
  if (M_.includes('breath')) { // [용궁] 숨은 시험 내내 줄고 저절로 차지 않는다. 숨 쉬기는 따로 하는 동작이고 그동안은 스캔도 답 표시도 못 한다 → 감독관이 볼 때 숨 쉬고, 안 볼 때 스캔한다
    if (E.breath == null) E.breath = 1;
    const BR = BREATH_BTN, want = pressed('KeyB') || taps.some(([x, y]) => x >= BR.x && x <= BR.x + BR.w && y >= BR.y && y <= BR.y + BR.h);
    if (E.breathing) { E.breathing.t += dt; E.breath = Math.min(1, E.breath + dt / tune.sea_breath_time * (1 - E.breathing.from)); if (E.breathing.t >= tune.sea_breath_time) { E.breath = 1; E.breathing = null; } }
    else { E.breath = Math.max(0, E.breath - dt / (hold ? tune.sea_breath_scan : tune.sea_breath_idle)); if (want && E.breath < 0.97 && !(E.gasp > 0) && !E.fb) { E.breathing = { t: 0, from: E.breath }; sfx.bubble(); } }
    E.jam = E.breath < 0.3 ? 1.6 : 1; // 숨이 모자라면 머리가 멍해져 스캔이 느려진다
    if (E.breath <= 0 && !E.breathing) { E.breath = 0.4; E.gasp = tune.sea_flail; E.sus = Math.min(1, E.sus + 0.15); E.source = { how: 'breath', by: E.staff[0] }; E.labSay = { text: '(숨이 막혀 허우적거린다. 모두가 돌아본다!)', t: 0 }; sfx.bubble();
      for (const s of E.staff) if (!s.out && !s.fixed && s.phase !== 'check' && s.phase !== 'help' && s.phase !== 'peek') { setPhase(s, 'watch', tune.sea_flail); s.away = false; } } }
  if (M_.includes('helmet')) E.fog = clamp((E.fog || 0) + (hold ? dt / 3.2 : -dt / 2.2), 0, 1);
  const peeker = E.staff.find(s => s.phase === 'peek' && s.peek.stage === 'stare');
  if (E.mole && E.mole.phase === 'look' && E.mole.k > 0.25 && risky) { E.sus = 1; E.source = { how: 'mole', by: E.staff[0] }; getCaught(); return; } // 돌아본 앞자리와 눈이 마주친 채 스캔하면 끝 (책상 밑 감시와 같은 규칙)
  if (peeker && risky) { E.sus = 1; E.source = { how: 'peek', by: peeker }; getCaught(); return; } // 올려다보는 눈과 마주친 채 스캔하면 끝
  if (!hold && !E.ai && !E.fb && E.scan > 0) E.scan = table ? Math.floor(E.scan * 4 + 1e-6) / 4 : tune.scan_drop >= 10 ? 0 : Math.max(0, E.scan - tune.scan_drop * dt); // 손을 떼면 스캔이 처음으로 돌아간다
  E.wasHold = hold; E.holding = hold; E.autoHolding = autoHold && !manual;
  E.rising = (risky && th.r > 0) || th.idle > 0;
  if (risky && th.r > 0) { E.sus += th.r * dt; E.source = th.src; }
  if (th.idle > 0) { E.sus += th.idle * dt; if (!(risky && th.r > 0)) E.source = { how: E.mindRead ? 'mind' : atDesk ? 'check' : 'webcam', by: E.staff.find(s => s.phase === 'check') || E.staff[0] }; }
  if (!E.rising) E.sus -= tune.sus_decay * dt;
  E.sus = clamp(E.sus, 0, 1);
  if (E.sus >= 1) { getCaught(); return; }
  E.cover = listen && g.earbud > 0 && g.earbud < 4 ? earCover() : null; // 듣기 중에 화면 왼쪽·오른쪽을 누르면 그쪽 귀를 손으로 가린다 (그동안은 받아 적지 못한다)
  if (listen && !E.ai && !E.fb && g.earbud > 0 && !E.dead && !E.cover) { E.listen += dt / tune.listen_time; if (E.listen >= 1) { E.listen = 1; completeScan(); } } // 이어폰이 방송을 받아쓴다
  if (hold && !essay && !speak && !blind) { // 스캔: 1/3, 2/3에서 오답이 하나씩 지워지고, 끝나면 AI의 답
    if (table) G.hints.iv = true;
    const before = Math.floor(E.scan * 3 + 1e-6);
    const labSlow = (M_.includes('spin') ? 1 + 2.2 * Math.abs(E.roll || 0) : 1) * (M_.includes('helmet') ? 1 + 2.5 * (E.fog || 0) : 1) * (M_.includes('mirror') ? 1.6 : 1);
    const secs = scanSecondsAt(Math.max(3, g.lens - (E.omegaDown || 0))) * (E.jam || 1) * (E.edgeScan || 1) * labSlow * E.stickerSlow * (T.mech.includes('long') ? tune.long_scan : 1) * (T.mech.includes('fatigue') ? 1 + tune.fatigue_step * E.part * gearCut(g.eyedrop) : 1);
    E.scan += dt / secs * (1 - tune.float_wobble * (g.floaty ? 0.4 : 1) * E.float) * (E.sigRate == null ? 1 : E.sigRate); // [용궁] 신호가 약하면 느리게
    E.tick += dt; if (E.tick > 0.12) { E.tick = 0; sfx.scan(); }
    if (E.scan >= 1) completeScan();
    else if (Math.floor(E.scan * 3 + 1e-6) > before) sfx.elim();
  }
  if (E.ai && !E.fb && g.lens >= 7 && !T.noAuto && !essay && q.conf >= tune.earbud_threshold) { /* 자동 마킹은 뇌 임플란트부터: 그 전에는 답을 직접 고른다 */ E.earbudT += dt; if (E.earbudT >= tune.earbud_delay) markAnswer(q.aiPick, 'auto'); }
  if (E.fb) { E.fb.t += dt; if (E.fb.t >= 0.35 && !E.caught) nextQuestion(); }
  if (E.sus > 0.3) { E.beat -= dt; if (E.beat <= 0) { E.beat = 1 - 0.55 * E.sus; sfx.beat(0.08 + 0.12 * E.sus); } } else E.beat = 0;
  E.hint = examHint();
}
function finishFinal(pick) {
  G.stats.exams++; G.stats.passes++; G.cleared[LAST] = true; G.best[LAST] = 100;
  if (G.run.splits[LAST] == null && !G.run.done) G.run.splits[LAST] = Math.round(G.run.t);
  if (!G.ended) { G.ended = true; addRecord(); }
  G.endSeen = true; events.push({ type: 'result', passed: true, final: true, pick }); loop('result');
  save(); STATE.endT = 0; scene = 'ending';
}
function tvNews(it) { G.tv.push(it); if (G.tv.length > 12) { const cut = G.tv.length - 12; G.tv.splice(0, cut); G.tvSeen = Math.max(0, G.tvSeen - cut); } } // 고시원 TV에 나오는 뉴스
function addLamp() { // TV 밑 빨간 등: 만점·제보마다 하나씩. 켜진 등은 재시험을 치르기 전까지 꺼지지 않는다
  G.lamps = Math.min(3, (G.lamps || 0) + 1);
  if (G.lamps >= 3 && !G.audit && G.lastPass) { // 셋 다 켜지면 가장 최근에 합격한 시험을 다시 치르라는 통보가 온다
    G.audit = Object.assign({}, G.lastPass);
    tvNews({ tag: '속보', h: '고득점자 재검증 착수… 재시험 통보', s: `${G.audit.tierName} 합격자에게 출석 요구`, tk: ['시험관리위 "조사관 입회하에 다시 치른다"', '합격선 미달이면 합격 취소·고발', '전자기기 반입 단속 강화'], icon: 'paper', cap: '자료 화면 · 답안지' });
    addNews('reg', `시험관리위원회: ${G.audit.tierName} 재시험 출석 통보. 우편을 확인하세요`);
  }
}
function reportByBroker(line) { // 브로커의 제보: 폰으로 통보가 오고, TV에 뉴스가 나오고, 빨간 등이 하나 켜진다
  STATE.tipAmount = G.black ? G.black.amount : 0; G.black = null; G.flags.tip = true;
  tvNews({ tag: '속보', h: '"AI 안경으로 시험 본다" 익명 제보', s: '제보자 "장비 판 사람이 나… 돈을 안 주더라"', tk: ['시험관리위 "제보 내용 사실 확인 중"', '초소형 카메라 거래 대화방 수사', '환율 1,380원대'], icon: 'tip', cap: '제보 영상 · 모자이크' });
  addNews('reg', '익명 제보 접수: "AI 안경으로 시험 보는 사람이 있다". TV에 내 얘기가 나온다');
  addLamp(); if (scene === 'hub' && STATE.hv.view !== 'room') STATE.hv.target = 'room';
  sfx.caught(); save();
}
// ---- 재시험: 등 3개가 켜지면 조사실에서 AI 없이 직접 푼다 --------------------------------------
const PROBE_SPARE = [['다음 중 맞춤법이 바른 것은?', ['웬지', '왠지', '웬일인지도', '왠만하면'], 1], ['1시간 30분은 몇 분인가?', ['60분', '80분', '90분', '120분'], 2], ['다음 중 가장 큰 수는?', ['0.5', '3분의 2', '0.6', '2분의 1'], 1],
  ['삼각형의 세 각을 더하면?', ['90도', '180도', '270도', '360도'], 1], ['"사과 : 과일 = 장미 : ?"', ['나무', '꽃', '빨강', '가시'], 1], ['일주일은 몇 시간인가?', ['148시간', '158시간', '168시간', '178시간'], 2]];
function startProbe() {
  const a = G.audit; if (!a) return false;
  const T = TIERS[a.tier], qs = [];
  for (let n = 0; qs.length < 5 && n < 8; n++) for (const q of makeQuestions(rng, T, 0)) if (qs.length < 5 && q.kind === 'text' && Array.isArray(q.choices) && q.choices.length === 4 && q.answer >= 0 && !qs.some(o => o.q === q.q)) qs.push(q);
  for (let n = 0; qs.length < 5; n++) { const [q, choices, answer] = PROBE_SPARE[n % PROBE_SPARE.length]; qs.push({ kind: 'text', q, choices, answer }); } // 글로 낼 수 없는 시험은 기초 문제로
  STATE.probe = { T, tier: a.tier, qs, qi: 0, ans: [], phase: 'in', t: 0, left: tune.probe_time, mark: null, correct: 0, snap: true, sig: '' };
  G.mail = null; ptrs.clear(); releases = []; scene = 'probe'; save(); return true;
}
function endProbe() { // 판정: 5문제 중 3문제 이상이면 통과
  const P = STATE.probe, a = G.audit, T = P.T, ok = P.correct >= 3;
  P.phase = ok ? 'pass' : 'fail'; P.t = 0;
  G.lamps = 0; G.audit = null;
  if (ok) {
    tvNews({ tag: '사회', h: '재검증 결과 "이상 없음"', s: `${T.name} 만점자, 조사관 앞에서 다시 풀어 통과`, tk: ['시험관리위 "실력으로 확인됐다"', '수험생 커뮤니티 "진짜였네"', '내일 전국 맑음'], icon: 'stamp', cap: '자료 화면 · 판정' });
    addNews('reg', `재검증 결과: ${T.name} "이상 없음". 등이 전부 꺼졌다`); sfx.pass();
  } else {
    settle(); const fine = Math.min(G.money, a ? a.reward || 0 : 0); G.money -= fine; STATE.shown = Math.min(STATE.shown, G.money);
    G.cleared[P.tier] = false; G.best[P.tier] = 0; G.stats.caught++;
    if (a && a.mail) G.mail = Object.assign({}, a.mail, { passed: false, stamp: '합격 취소' });
    tvNews({ tag: '속보', h: '"AI 안경 부정 응시" 수험생 검거', s: `${T.name} 합격 취소 · 벌금 ${won(fine)}원`, tk: ['재시험에서 합격선 미달', '경찰 "장비 구입 경로 수사"', 'AI 안경 단속 전국 확대'], icon: 'cuffs', cap: '현장 화면' });
    addNews('reg', `${T.name} 합격 취소. 재시험에서 ${P.correct}문제밖에 못 맞혔다`); if (fine > 0) addNews('bank', `[출금] 벌금 ${won(fine)}원`);
    sfx.fail();
  }
  save();
}
function updateProbe(dt) {
  const P = STATE.probe, taps = takeTaps(); takeReleases(); P.t += dt;
  if (P.phase === 'in') { if (P.t > 3.6 || (P.t > 1.2 && (taps.length || pressed('Enter') || pressed('Space')))) { P.phase = 'play'; P.t = 0; } }
  else if (P.phase === 'play') {
    P.left -= dt;
    if (P.mark) { P.mark.t -= dt; if (P.mark.t <= 0) { P.mark = null; P.qi++; } }
    else {
      let c = ['Digit1', 'Digit2', 'Digit3', 'Digit4'].findIndex(pressed);
      for (const [x, y] of taps) { const uv = WORLD.probePick(x, y); if (uv && P.rects) { const i = P.rects.findIndex(r => uv[1] >= r[0] && uv[1] <= r[1]); if (i >= 0) c = i; } }
      if (c >= 0) { P.ans[P.qi] = c; P.mark = { c, t: 0.4 }; sfx.pencil(); }
    }
    if (P.qi >= P.qs.length || P.left <= 0) { P.qi = Math.min(P.qi, P.qs.length - 1); P.mark = null; P.correct = P.qs.filter((q, i) => P.ans[i] === q.answer).length; P.phase = 'judge'; P.t = 0; sfx.flip(); }
  }
  else if (P.phase === 'judge') { if (P.t > 2.6) endProbe(); }
  else if (P.phase === 'pass') { if (P.t > 4.2 || (P.t > 1.6 && (taps.length || pressed('Enter')))) { STATE.probe = null; goHub(null); } }
  else if (P.phase === 'fail') { if (P.t > 1.6 && P.t - dt <= 1.6) sfx.knock(); if (P.t > 2.0 && P.t - dt <= 2.0) sfx.caught(); if (P.t > 6.2) { STATE.probe = null; goHub(null); } }
}
function unlockNews(ti) { // 처음 합격: 신상 입고, 새 AI 모델, 다음 시험, 새 막
  const T = TIERS[ti], out = [];
  addNews('exam', `${T.name} 합격! ${T.pay} 입금`);
  if (T.news) { addNews('reg', T.news); out.push('뉴스 속보'); }
  const gear = CONFIG.gear.filter(d => d.at && d.at.includes(ti + 1)); // 다음 시험이 열리면서 입고되는 제품
  for (const d of gear) { G.fresh[d.id] = true; addNews('shop', `신상 입고: ${d.name} "${d.ladder[d.at.indexOf(ti + 1)]}"`); }
  if (gear.length) out.push(`신상 입고 ${gear.length}종`);
  CONFIG.models.forEach((m, i) => { if (m.rel === ti) { G.fresh.model = true; addNews('model', `속보: ${m.name} 출시! ${m.note}. AI마켓에서 구독하세요`); out.push(`${m.name} 출시`); } });
  const nx = TIERS[ti + 1];
  if (nx && nx.act !== T.act) { // 새 막: 가진 장비의 다음 단계가 풀린다
    addNews('act', `${CONFIG.acts[nx.act - 1]} 시험 일정 공개!`); out.push(`${CONFIG.acts[nx.act - 1]} 시험 공개`);
  }
  if (nx) addNews('exam', `다음 시험 접수 시작: ${nx.name}`);
  return out;
}
function finishExam() {
  const T = E.T, pass = Math.round(tune.pass_mark * 100);
  if (E.caught && E.done.length < E.parts * T.qn) { closePart(); while (E.done.length < E.parts * T.qn) E.done.push({ r: '-' }); }
  const marks = E.done, qn = marks.length, correct = marks.filter(m => m.r === 'O').length + marks.reduce((a, m) => a + (m.part || 0), 0) + (E.ivScore != null ? E.ivScore - (E.ivPass || 0) : 0), score = Math.round(correct / qn * 100);
  let passed = !E.caught && !E.forceFail && correct / qn >= tune.pass_mark - 1e-9, perfect = passed && correct === qn, audited = false; const jack = perfect && !(G.best[E.tier] >= 100); // 만점 보너스는 시험마다 처음 한 번만
  const heat0 = 0, tut = T.mech.includes('tutorial'), lamps0 = G.lamps || 0;
  const bonus = passed ? tune.time_bonus * (E.leftSum / (E.timeTotal * E.parts)) : 0, coach = passed ? coachMult() : 1;
  const reward = passed ? Math.round(correct * T.reward * tune.reward_scale * (1 + bonus) * coach * (jack ? tune.jackpot_mult : 1)) : 0;
  G.stats.exams++; if (passed) G.stats.passes++; else if (!E.caught) G.stats.fails++; if (perfect) G.stats.tops++;
  if (G.black && G.black.seen) reportByBroker('답이 없으시네. 그럼 제보합니다'); else if (G.black) G.black.seen = true; // 협박을 시험 한 번 넘기도록 내버려 두면 제보당한다
  let unlock = '';
  const final = passed && E.tier === LAST;
  if (passed) {
    const first = !G.cleared[E.tier];
    G.cleared[E.tier] = true; G.best[E.tier] = Math.max(G.best[E.tier], score);
    if (E.tier + 1 < TIERS.length && G.unlocked < E.tier + 2) G.unlocked = E.tier + 2;
    if (first) {
      if (G.run.splits[E.tier] == null && !G.run.done) G.run.splits[E.tier] = Math.round(G.run.t);
      unlock = unlockNews(E.tier).join(' · '); if (unlock) sfx.news();
      if (G.flags.cam && !G.black && (T.id === 'tax' || T.id === 'bar' || T.id === 'calbar')) { // 브로커가 다시 연락한다
        G.black = { amount: Math.ceil(tune.black_mult * T.reward * tune.reward_scale), n: (G.flags.blackN || 0) + 1 }; G.flags.blackN = G.black.n;
        addNews('tg', '텔레그램 새 메시지: "사장님, 요즘 단속 심한 거 아시죠?"');
      }
    }
  }
  G.pending = (G.pending || 0) + reward; loop('result'); if (reward > 0) loop('reward'); // 돈은 고시원에 돌아갈 때 입금 문자로 들어온다
  if (reward > 0) addNews('bank', `[입금] ${T.pay} ${won(reward)}원${jack ? ` (수석 x${tune.jackpot_mult})` : ''}`);
  if (!tut) G.mail = { tier: E.tier, tierName: T.name, marks, correct, qn, pass, score, caught: E.caught, passed, stamp: audited ? '합격 취소' : E.caught ? '부정행위' : perfect ? '수석 합격' : passed ? '합격' : '불합격' };
  if (T.id === 'leet') G.flags.leet = true; // LEET를 한 번 치르고 나면 책상에 초콜릿이 놓여 있다
  let lampLine = null;
  if (!tut && passed) G.lastPass = { tier: E.tier, tierName: T.name, reward, mail: G.mail };
  if (!tut && jack && !final && !G.audit && E.tier >= tune.lamp_from) { // 만점은 상금이 크지만 TV 밑 빨간 등이 하나 켜진다 (쉬운 초반 시험은 만점이어도 의심받지 않는다)
    const n = G.flags.perfN = (G.flags.perfN || 0) + 1;
    if (n === 1) { tvNews({ tag: '사회', h: `${T.name} 사상 첫 만점자 나왔다`, s: '출제위원 "만점이 나올 수 없게 낸 시험인데…"', tk: ['수험생 커뮤니티 "사람 맞나" 술렁', '시험관리위 "답안지 원본 확인 중"', '내일 전국 흐리고 비'], icon: 'room', cap: '자료 화면 · 시험장' }); }
    else tvNews({ tag: '속보', h: '잇따른 만점… 당국 "전수조사 검토"', s: `${T.name}에서도 만점 · 같은 수험번호`, tk: ['시험관리위 "고득점자 답안 재검증 준비"', '전자기기 반입 단속 강화', 'AI 안경 판매량 석 달 새 4배'], icon: 'paper', cap: '자료 화면 · 답안지' });
    addLamp();
    lampLine = G.lamps >= 3 ? '(감독관이 내 수험번호를 받아 적는다)' : G.lamps === 2 ? '(감독관이 내 답안지를 들고 어딘가로 전화를 건다)' : '감독관: …이 시험은 만점이 나올 수가 없는데.';
  }
  if (!tut && passed && G.lamps >= 3 && !G.audit) addLamp(); // 제보로 먼저 셋이 찼다면 이번 합격이 재검증 대상
  if (final && !G.ended) { G.ended = true; addRecord(); }
  RZ = { tier: E.tier, tierName: T.name, passed, perfect, jack, caught: E.caught, correct, qn, score, pass, reward, bonus, coach, pay: T.pay, fee: E.fee,
    marks, self: E.selfN, ai: E.aiN, heat0, heat: 0, lamps0, lamps: G.lamps, lampLine, audited, tut, unlock, final, next: passed ? (final ? 'end' : E.tier + 1) : null, focus: passed ? 'next' : 'retry', canRetry: true, canNext: true };
  perfect ? sfx.top() : passed ? sfx.pass() : sfx.fail();
  RZ.stamp = audited ? '합격 취소' : E.caught ? '부정행위' : perfect ? '수석 합격' : passed ? '합격' : '불합격';
  E.result = RZ; E.holding = false; E.scan = 0; E.rising = false; E.sus = Math.min(E.sus, 0.4); // 가채점은 기기 화면에, 통지표는 우편으로
  events.push({ type: 'result', passed, perfect, caught: E.caught, correct, reward, fee: E.fee });
  save(); scene = 'results';
}

// ---- 고시원: 방 · 노트북(AI마켓) · 일정표 · 폰 · 택배 ------------------------------------------
function settle() { if (G.pending > 0) { addMoney(G.pending); G.pending = 0; sfx.news(); save(); } } // 밀린 입금
function titleExam() { // 타이틀 뒤에 깔리는 첫 시험장: 시험 상태를 만들어 두고 멈춰 둔다
  if (STATE.titleE && E === STATE.titleE) return;
  const started = G.run.started, sc = scene; STATE.titleBuild = true; startExam(0); STATE.titleBuild = false; events.pop(); G.run.started = started; scene = sc;
  const q = E.qs[0]; STATE.titleE = E; E.titleKeep = { ar: E.ar, start: E.start };
  E.stageForce = 'used'; E.ar = true; E.ai = true; E.scan = 1; E.start = 0; E.view = 'paper'; E.prevView = 'paper'; E.viewT = 1; E.hint = null; E.showZones = false; if (q.aiPick == null) q.aiPick = q.answer; q.conf = 95; // 안경이 답을 잡은 장면
}
function leaveTitle(T0) { if (!CHECKED && netOn()) runPending(1); /* 첫 시험은 타이틀 뒤의 시험장을 그대로 쓰므로 여기서 한 판으로 센다 */ // 타이틀에서 바로 튜토리얼 시험으로: 같은 자리에서 고개를 든다. 안경 화면은 지직거리며 꺼진다
  E = T0; E.stageForce = null; E.ar = E.titleKeep.ar; E.start = E.titleKeep.start; E.ai = false; E.scan = 0; E.prevView = 'paper'; E.view = E.layout === 'room' ? 'front' : 'paper'; E.viewT = 0; E.showZones = !G.hints.look;
  if (!G.run.done) G.run.started = true; ptrs.clear(); releases = []; STATE.titleOut = 0.9; scene = 'play'; events.push({ type: 'exam', tier: 0, fee: 0 });
}
function goHub(view) { scene = 'hub'; const hv = STATE.hv; hv.view = 'room'; hv.target = 'room'; hv.zoom = 0; hv.bpage = null; if (view) enterView(view, true); }
function tgHas(id) { return !!(G.tg && G.tg[id]); }
function helperCost(h) { return Math.ceil(h.mult * TIERS[h.tier].base * tune.reward_scale * tune.cost_scale * costFix(h.tier)); }
function helperOpen() { return CONFIG.helper.filter(h => G.unlocked - 1 >= h.tier); } // 그 시험이 일정표에 열리면 연락이 온다
function helperPending() { return helperOpen().filter(h => !tgHas(h.id)).pop() || null; }
function helperLast() { return helperOpen().pop() || null; }
function buyHelper(id) { const h = CONFIG.helper.find(x => x.id === id); if (!h || tgHas(id)) return; const c = helperCost(h); if (G.money < c) { sfx.no(); return; } G.money -= c; (G.tg || (G.tg = {}))[id] = true; sfx.buy(); STATE.pops.push({ v: 0, t: 0, scene: 'hub', text: `${h.name} 받음`, col: PAL.good || PAL.white }); save(); }
const deskOpen = () => !!(G.flags.sold || G.black || helperOpen().length); // 바탕화면으로 나갈 수 있는가
function enterView(v, instant) {
  const hv = STATE.hv; hv.view = v; hv.target = v; hv.zoom = instant ? 1 : 0;
  if (v === 'laptop') { hv.app = deskOpen() && !G.flags.deskSeen ? 'desk' : 'shop'; if (hv.app === 'desk') G.flags.deskSeen = true; hv.page = 0; hv.tab = G.fresh.lens ? 'glass' : G.fresh.aux ? 'aux' : G.fresh.cover ? 'cover' : G.fresh.model ? 'model' : ['glass', 'aux', 'cover', 'model'].includes(hv.tab) ? hv.tab : 'glass'; G.hints.shop = true; STATE.shownIds.clear(); }
  if (v === 'board') { hv.act = 0; hv.bpage = null; }
  if (v === 'mail') { STATE.mailImg = null; }
  if (v === 'phone') { hv.ptab = phoneUnread() ? 'news' : hv.ptab; hv.npage = 0; }
  if (!instant) sfx.zoom();
}
function leaveView() { // 방으로 물러난 뒤: 본 신상은 NEW를 떼고, 주문한 게 있으면 택배가 온다
  const hv = STATE.hv, v = hv.view;
  if (v === 'laptop') { for (const id of STATE.shownIds) delete G.fresh[id]; STATE.shownIds.clear(); for (const id of Object.keys(G.fresh)) if (id !== 'model' && !shopItems('new').some(d => d.id === id)) delete G.fresh[id]; /* 진열되지 않는 신상 표시는 지운다 */ if (hv.order.length && !hv.parcel) hv.parcelT = 0.7; }
  if (v === 'phone') G.seen = G.news.length;
  if (v === 'tv') G.tvSeen = G.tv.length;
  if (v === 'mail') { if (G.mail) G.mail = null; else if (G.audit) { hv.view = 'room'; hv.zoom = 0; startProbe(); return; } } // 읽은 통지표는 치운다. 재시험 통보를 내려놓으면 바로 조사실로
  hv.view = 'room'; save();
}
function soldOut(d) { return d.id === 'lens' && G.gear.lens === 1 && !G.flags.cam && gearCap(d) > 1; } // 2단계 초소형 카메라는 품절: 텔레그램 브로커에게서만 (편입 합격 뒤에 들어온다)
function brokerCost() { return Math.ceil(gearCost('lens', 1) * tune.broker_markup); }
function buyGear(id, viaBroker) {
  const d = gearDef(id), lv = G.gear[id], cost = viaBroker ? brokerCost() : gearCost(id), hv = STATE.hv;
  if (d && soldOut(d) && !viaBroker) { sfx.no(); if (!G.flags.sold) { G.flags.sold = true; addNews('reg', '초소형 카메라 전국 품절. 쇼핑몰들 판매 중단 · 텔레그램에 "구해 드림" 글이 돈다'); } STATE.note = { text: '품절되었습니다', t: 0 }; save(); return; }
  if (viaBroker) G.flags.cam = true;
  if (!d || !gearOpen(d) || lv >= gearCap(d) || G.money < cost) { sfx.no(); return; }
  G.money -= cost; G.gear[id]++; delete G.fresh[id]; syncGear();
  const name = d.kind === 'count' ? `${botName(G.gear[id])} (대리 응시 ${G.gear[id]}명)` : gearName(id, G.gear[id]);
  hv.order.push({ id, name }); hv.hidden[id] = true;
  sfx.buy(); STATE.note = { text: '구매했습니다', sub: `${name} · ${won(cost)}원 · 바로 장착됨`, t: 0 }; // 노트북 화면 안의 창으로 알린다
  if (d.kind === 'count' && CONFIG.bot_milestones.includes(G.gear[id])) addNews('bot', `대리 응시 ${G.gear[id]}명 돌파! 수입 x2 · 이제 "${botName(G.gear[id])}"`);
  events.push({ type: 'buy', id, lv: G.gear[id] }); save();
}
function buyModel() {
  const i = G.gear.model + 1;
  if (!modelOpen(i) || G.money < modelCost(i)) { sfx.no(); return; }
  G.money -= modelCost(i); G.gear.model = i; delete G.fresh.model;
  if (modelOpen(i + 1)) G.fresh.model = true;
  sfx.buy(); STATE.note = { text: '구독이 시작되었습니다', sub: `${CONFIG.models[i].name} · 바로 적용`, t: 0 };
  events.push({ type: 'buy', id: 'model', lv: i }); save();
}
function hubKey(key) { // 다가간 화면에서 누른 칸
  const hv = STATE.hv, [a, b] = key.split(':');
  if (a === 'back') { if (hv.view === 'laptop' && hv.app !== 'desk' && deskOpen()) { hv.app = 'desk'; G.flags.deskSeen = true; sfx.flip(); } else { hv.target = 'room'; sfx.zoom(); } }
  else if (a === 'app') { hv.app = b; hv.page = 0; sfx.flip(); if (b === 'shop') hv.tab = G.fresh.lens ? 'glass' : G.fresh.aux ? 'aux' : G.fresh.cover ? 'cover' : G.fresh.model ? 'model' : ['glass', 'aux', 'cover', 'model'].includes(hv.tab) ? hv.tab : 'glass'; }
  else if (a === 'hush') { if (G.black && G.money >= G.black.amount) { G.money -= G.black.amount; G.black = null; sfx.buy(); STATE.pops.push({ v: 0, t: 0, scene: 'hub', text: '입막음비 송금 완료', col: PAL.warn }); save(); } else sfx.no(); }
  else if (a === 'refuse') { if (G.black) reportByBroker('후회하실 텐데'); }
  else if (a === 'tgbuy') buyHelper(b);
  else if (a === 'broker') { if (G.money >= brokerCost()) buyGear('lens', true); else sfx.no(); }
  else if (a === 'tab') { hv.tab = b; hv.page = 0; sfx.flip(); }
  else if (a === 'page') hv.page += Number(b);
  else if (a === 'bpage') hv.bpage += Number(b);
  else if (a === 'npage') hv.npage += Number(b);
  else if (a === 'lpage') hv.lpage = (hv.lpage || 0) + Number(b);
  else if (a === 'act') { hv.act = Number(b); hv.bpage = 0; sfx.flip(); }
  else if (a === 'ptab') { hv.ptab = b; sfx.flip(); }
  else if (a === 'noteok') { STATE.note = null; sfx.flip(); }
  else if (a === 'buy') buyGear(b);
  else if (a === 'model') buyModel();
  else if (a === 'exam') { leaveView(); hv.zoom = 0; hv.target = 'room'; startExam(Number(b)); }
  else if (a === 'opt' && b === 'mute') setMuted(!muted);
  else if (a === 'opt' && b === 'fs') toggleFullscreen();
  else if (a === 'opt' && b === 'rich' && CAN_JUMP) { G.opts.rich = !G.opts.rich; if (!G.opts.rich) G.money = examFee(TIERS[nextTierIndex()]) * 3; sfx.flip(); STATE.note = { text: G.opts.rich ? '돈 무한 모드' : '일반 모드', sub: G.opts.rich ? '돈이 떨어지지 않습니다' : '돈을 이 단계에 맞췄습니다 (다음 응시료의 세 배)', t: 0 }; save(); }
  else if (a === 'opt' && b === 'timer') { G.opts.timer = !G.opts.timer; save(); }
  else if (a === 'save' && b === 'export') exportSave();
  else if (a === 'save' && b === 'import') importSave();
  else if (a === 'jump') { const cur = STATE.jump || nextTierIndex() + 1; if (b === 'go') { jumpTo(cur, true); STATE.jump = 0; E = null; sfx.buy(); STATE.note = { text: `${cur}번 ${TIERS[cur - 1].name} 앞으로 이동`, sub: '장비와 돈을 그 단계에 맞췄습니다', t: 0 }; goHub(); } else if (b === 'undo') { if (restoreBackup()) { STATE.jump = 0; sfx.buy(); STATE.note = { text: '직전 기록을 되살렸습니다', t: 0 }; goHub(); } else sfx.no(); } else STATE.jump = clamp(cur + Number(b), 1, TIERS.length); }
  else if (a === 'wipe') { if (STATE.wipeArm > 0) { backupSave(); wipe(); } else STATE.wipeArm = 3; }
}
function hubAction(a) { // 방에서 누른 물건
  const hv = STATE.hv;
  if (a === 'go') startExam(nextTierIndex());
  else if (a === 'exams') enterView('board');
  else if (a === 'gear') enterView('laptop');
  else if (a === 'log') enterView('phone');
  else if (a === 'mail' && (G.mail || G.audit)) enterView('mail');
  else if (a === 'tv') enterView('tv');
  else if (a === 'choco' && G.flags.leet && CONFIG.eggs.choco) { const n = G.flags.choco = (G.flags.choco || 0) + 1; hv.chocoT = now; STATE.say = { text: ['…참자. 단맛을 억제하는 게 좋다고 그랬어.', '…안 돼. 단맛을 억제해야 머리가 맑아진다고 했어.', '(초콜릿이 나를 보고 있다)'][(n - 1) % 3], t: 0 }; sfx.flip(); }
  else if (a === 'parcel' && hv.parcel && hv.parcel.phase === 'wait') { hv.parcel.phase = 'open'; hv.parcel.t = 0; sfx.open(); }
}
function openParcels() { // 상자를 열지 않고 시험 보러 가도 장비는 쓴다
  const hv = STATE.hv; hv.hidden = {}; hv.order = []; hv.parcel = null; hv.parcelT = 0;
}
function updateHub(dt) { soundHub(dt); { const hp = helperPending(); if (hp && !(G.tgTold || (G.tgTold = {}))[hp.id]) { G.tgTold[hp.id] = true; addNews('tg', `텔레그램 새 메시지: "${hp.lines[0][0]}"`); sfx.news(); } }
  if (CAN_JUMP && G.opts.rich && params.get('real') !== '1') { const want = Math.max(1e11, examFee(TIERS[Math.min(LAST, G.unlocked - 1)]) * 40); if (G.money < want) G.money = want; } // 테스트 전용 '돈 무한': 설정에서 켠다 // 테스트용 사이트: 방에 있을 때는 돈이 늘 1,000억원 (주소에 ?real=1 을 붙이면 끔)
  const hv = STATE.hv;
  STATE.wipeArm = Math.max(0, STATE.wipeArm - dt);
  if (hv.view !== 'room') {
    if (hv.target === 'room') { hv.zoom -= dt / tune.zoom_time; if (hv.zoom <= 0) { hv.zoom = 0; leaveView(); } }
    else hv.zoom = Math.min(1, hv.zoom + dt / tune.zoom_time);
  }
  if (hv.parcelT > 0) { hv.parcelT -= dt; if (hv.parcelT <= 0) { hv.parcel = { phase: 'arrive', t: 0, items: hv.order.slice() }; hv.order = []; sfx.knock(); } }
  if (hv.parcel) {
    const p = hv.parcel; p.t += dt;
    if (p.phase === 'arrive' && p.t > 0.35) { p.phase = 'wait'; p.t = 0; }
    else if (p.phase === 'open' && p.t > 0.9) { p.items.slice(0, 4).forEach((it, i) => STATE.pops.push({ v: 0, t: -i * 0.35, scene: 'hub', text: `설치 완료: ${it.name}`, col: PAL.gold })); hv.hidden = {}; hv.parcel = null; }
  }
  const taps = takeTaps(); takeReleases();
  if (scene !== 'hub') return;
  if (STATE.say) { STATE.say.t += dt; if (STATE.say.t > 2.8) STATE.say = null; }
  if (hv.tip) { // 브로커의 제보: 폰에 메시지가 다 뜨면 TV를 올려다본다
    hv.tip.t += dt; hv.zoom = Math.min(1, hv.zoom + dt / tune.zoom_time);
    if (hv.tip.t > 6 || (hv.tip.t > 1.5 && taps.length)) { hv.tip = null; G.flags.tip = false; G.seen = G.news.length; enterView('tv'); save(); }
    return;
  }
  if (G.flags.tip && hv.view === 'room') { hv.tip = { t: 0 }; enterView('phone'); sfx.news(); return; }
  if (hv.view === 'room') {
    for (const [x, y] of taps) { hubAction(WORLD.pickHub(x, y) || (y < 30 ? 'tv' : null)); if (scene !== 'hub') return; } // 화면 맨 위를 누르면 선반 위 TV를 올려다본다
    if (pressed('Enter')) hubAction('go');
    else if (pressed('Digit1')) hubAction('exams'); else if (pressed('Digit2')) hubAction('gear'); else if (pressed('Digit3')) hubAction('log');
    STATE.hoverAct = STATE.hover ? WORLD.pickHub(STATE.hover[0], STATE.hover[1]) : null;
    if (STATE.hoverAct === 'parcel' && !(hv.parcel && hv.parcel.phase === 'wait')) STATE.hoverAct = null;
    if (STATE.hoverAct === 'mail' && !G.mail && !G.audit) STATE.hoverAct = null;
  } else {
    STATE.hoverAct = null;
    if (hv.zoom >= 1 && hv.target !== 'room') {
      for (let [x, y] of taps) {
        if (surfDim(hv.view)) { const lp = lapPoint([x, y]); if (!lp) { hv.target = 'room'; sfx.zoom(); continue; } [x, y] = lp; }
        const b = hitBtn(BTNS, x, y);
        if (b) { hubKey(b.key); if (scene !== 'hub' || hv.view === 'room') return; }
        else if (hv.view === 'mail' || hv.view === 'tv') { hv.target = 'room'; sfx.flip(); }
        else if (hv.view !== 'laptop' && HUB_RECT && (x < HUB_RECT.x - 6 || x > HUB_RECT.x + HUB_RECT.w + 6 || y < HUB_RECT.y - 6 || y > HUB_RECT.y + HUB_RECT.h + 6)) { hv.target = 'room'; sfx.zoom(); } // 바깥을 누르면 방으로
      }
      if (pressed('Escape') || pressed('Backspace')) hubKey('back');
      if (hv.view === 'laptop' && hv.app === 'desk') { if (pressed('Digit1')) hubKey('app:shop'); else if (pressed('Digit2')) hubKey('app:tg'); }
      else if (hv.view === 'laptop' && hv.app === 'shop') { const n = ['Digit1', 'Digit2', 'Digit3', 'Digit4'].findIndex(pressed); if (n >= 0) hubKey('tab:' + ['new', 'glass', 'device', 'model'][n]); }
      if (pressed('ArrowRight')) hubKey(hv.view === 'laptop' ? 'page:1' : hv.view === 'board' ? 'bpage:1' : hv.ptab === 'log' ? 'lpage:1' : 'npage:1');
      if (pressed('ArrowLeft')) hubKey(hv.view === 'laptop' ? 'page:-1' : hv.view === 'board' ? 'bpage:-1' : hv.ptab === 'log' ? 'lpage:-1' : 'npage:-1');
    }
  }
  const hp = surfDim(hv.view) ? lapPoint(STATE.hover) : STATE.hover;
  const over = hv.view === 'room' ? STATE.hoverAct : hp && hitBtn(BTNS, hp[0], hp[1]);
  const cur = over ? 'pointer' : ''; if (canvas.style.cursor !== cur) canvas.style.cursor = cur;
  if (STATE.away) { STATE.away.t += dt; if (STATE.away.t > 6) STATE.away = null; }
}

// ---- Scenes ------------------------------------------------------------------------------
let BTNS = [], HUB_RECT = null, LAPKIT = null;
const surfDim = v => v === 'laptop' ? [HUBUI.LW, HUBUI.LH] : v === 'board' ? [HUBUI.BW, HUBUI.BH] : v === 'phone' ? [HUBUI.PW, HUBUI.PH] : null; // 3D 표면에 그리는 화면들
const KITS = {};
function lapPoint(p) { const v = STATE.hv.view, d = surfDim(v), uv = d && p && WORLD.hubUV(p[0], p[1], v); return uv ? [uv[0] * d[0], uv[1] * d[1]] : null; }
function drawLaptop() { // 노트북 화면을 3D 표면에 그린다
  const v = STATE.hv.view, d = surfDim(v); if (!d) return;
  let K = KITS[v]; if (!K) { const c = WORLD.surfaceCanvas(v); K = KITS[v] = makeKit(c.getContext('2d')); K.S = c.width / d[0]; K.b.setTransform(K.S, 0, 0, K.S, 0, 0); }
  BTNS = HUBUI.surface(v, K, STATE.hv, now, STATE.hv.zoom >= 1 ? lapPoint(STATE.hover) : null);
}
const ENDING_STATS = END_T.stats; // 엔딩: 문구가 지나가고 기록 화면이 뜨는 시각(초)
function reset() {
  seed = Number(params.get('seed')) || CONFIG.seed;
}
function makeState() {
  return {
    t: 0,
    get score() { return Math.floor(G.money); }, get money() { return G.money; }, get level() { return G.unlocked; },
    get goal() { return G.ended; }, get exam() { return E; }, get gear() { return G.gear; }, get game() { return G; }, get hub() { return STATE.hv; },
    get margin() { return E && scene === 'play' ? 1 - E.sus : 1; }, get gained() { return RZ && RZ.reward > 0 ? won(RZ.reward) + '원' : ''; },
  };
}
function drawNote(B) { // 화면 아래 짧은 알림 (응시료 부족, 자리 비움 수입)
  if (STATE.note && scene === 'hub' && STATE.hv.view === 'laptop') return; // 노트북을 보는 중이면 화면 안의 창으로 뜬다
  const msg = STATE.note ? STATE.note.text : STATE.away && scene === 'hub' ? `자리 비운 동안 대리 응시가 ${won(STATE.away.gain)}원 벌었어요` : null;
  if (!msg) return;
  const k = B.k, L = B.L, w = k.TW(msg, 12, 800) + 24, y = L.H - 26, col = STATE.note ? PAL.warn : PAL.gold;
  k.b.globalAlpha = 0.66; k.R(L.W / 2 - w / 2, y - 11, w, 22, '#0a0a0e'); k.b.globalAlpha = 1;
  k.T(msg, L.W / 2, y, 12, PAL.white, 'center', 700);
}
function hubLabel(action) {
  const hv = STATE.hv, n = shopNewCount(), u = phoneUnread();
  if (action === 'exams') return { text: '시험 일정표' };
  if (action === 'gear' && G.black) return { text: '노트북 · 텔레그램 새 메시지', hot: true };
  if (action === 'gear') return n ? { text: `AI마켓 · 신상 ${n}`, hot: true } : { text: 'AI마켓 (노트북)', hot: !G.hints.shop && G.stats.exams > 0 };
  if (action === 'log') return u ? { text: `폰 · 알림 ${u}`, hot: true } : { text: '폰' };
  if (action === 'go') { const t = TIERS[nextTierIndex()], fee = examFee(t); return { text: `시험 보러 가기: ${t.name}${fee ? ` (${won(fee)}원)` : ''}` }; }
  if (action === 'mail') return G.mail ? { text: '우편: 성적 통지표', hot: true } : G.audit ? { text: '우편: 재시험 출석 통보', hot: true } : null;
  if (action === 'tv') return G.tv.length > G.tvSeen ? { text: 'TV: 뉴스 속보', hot: true } : { text: 'TV 뉴스' };
  if (action === 'parcel') return hv.parcel && hv.parcel.phase === 'wait' ? { text: '택배 왔어요! 눌러서 열기', hot: true } : null;
  return null;
}
function drawHubHud(B) { // 고시원 방: 물건 이름표, 돈, 타임어택 시계. 다가가면 그 물건의 화면
  const k = B.k, L = B.L, H = hudSet(), hv = STATE.hv, hover = STATE.hoverAct;
  if (params.get('hud') === '0') return; // check only
  if (!surfDim(hv.view)) BTNS = []; // 노트북·일정표·폰의 버튼은 drawLaptop이 채운 것을 그대로 쓴다
  HUB_RECT = null;
  if (hv.view === 'room') {
    const touch = window.matchMedia && matchMedia('(pointer: coarse)').matches; // 터치 기기는 마우스를 올릴 수 없으니 이름표를 계속 보여 준다
    for (const l of WORLD.hubLabels()) {
      const info = l.show && hubLabel(l.action); if (!info) continue;
      const hot = l.action === hover; if (!hot && !info.hot && !touch) continue; // 이름표는 마우스를 올렸을 때와 알릴 게 있을 때만
      const bob = info.hot ? Math.round(Math.sin(now * 5) * 2) : 0, w = k.TW(info.text, 10, 800) + 14;
      const x = Math.round(clamp(l.x, w / 2 + 4, L.W - w / 2 - 4)), y = Math.round(clamp(l.y, 14, L.H - 12)) + bob;
      const dw = info.hot ? 9 : 0; k.b.globalAlpha = hot ? 0.78 : 0.6; k.R(x - w / 2 - dw / 2, y - 9, w + dw, 18, '#0a0a0e'); k.b.globalAlpha = 1; // 이름표: 반투명 검정에 흰 글씨, 알릴 게 있으면 빨간 점
      if (info.hot) k.disc(x - w / 2 + 4, y, 2.5, '#ff5a4d');
      k.T(info.text, x + dw / 2, y, 10, PAL.white, 'center', 700);
    }
  } else {
    const ui = HUBUI.draw(k, L, hv, now, STATE.hover); if (!surfDim(hv.view)) BTNS = ui.btns; HUB_RECT = ui.rect;
  }
  if (hv.view === 'mail' && hv.zoom >= 1 && hv.target !== 'room') k.TO(G.mail || !G.audit ? '아무 데나 눌러 내려놓기' : '아무 데나 눌러 조사실로', L.W / 2, L.H - 8, 9, '#c9c4d8');
  if (hv.view === 'tv' && hv.zoom >= 1 && hv.target !== 'room') k.TO('아무 데나 눌러 돌아가기', L.W / 2, L.H - 8, 9, '#c9c4d8');
  if (STATE.say && hv.view === 'room') { const a = Math.min(1, STATE.say.t / 0.15, (2.8 - STATE.say.t) / 0.3); if (a > 0) { k.b.globalAlpha = a; k.SUB(STATE.say.text, L.W / 2, L.H - 46, 13, '#ffffff', 'center'); k.b.globalAlpha = 1; } }
  for (const p of STATE.pops) if (p.scene === 'hub' && p.t >= 0) { const tx = p.text || ('+' + won(p.v) + '원'), pw = k.TW(tx, 11, 700) + 20, py = 58 - p.t * 12; k.b.globalAlpha = 0.6 * Math.max(0, Math.min(1, (1.4 - p.t) / 0.3)); k.R(L.W / 2 - pw / 2, py - 9, pw, 18, '#0a0a0e'); k.b.globalAlpha = 1; k.T(tx, L.W / 2, py, 11, PAL.white, 'center', 700); }
  drawNote(B);
}
function drawNo3D(B) { // WebGL을 못 쓰는 기기
  const k = B.k, L = B.L;
  k.R(0, 0, L.W, L.H, '#0d0b13');
  k.TO('이 기기에서는 3D 화면을 열 수 없어요', L.W / 2, L.H / 2 - 10, 16, PAL.warn);
  k.T('WebGL을 켜거나 다른 브라우저에서 열어 주세요', L.W / 2, L.H / 2 + 16, 11, '#c9c4d8', 'center', 700);
}
const scenes = {
  figures: {
    update(dt) { state.t += dt; },
    draw(B) {
      WORLD.renderFigures(now);
      const k = B.k;
      k.TO('감독관 16종', B.L.W / 2, 18, 12, PAL.white);
      for (const f of WORLD.figureLabels()) k.TO(f.text, f.x, f.y, 9, PAL.white);
    },
  },
  title: {
    update(dt) {
      takeReleases(); titleExam();
      const RK = STATE.rank || (STATE.rank = { open: false, k: 0, page: 0 }), taps = takeTaps();
      RK.k = clamp(RK.k + (RK.open ? 1 : -1) * dt / 0.6, 0, 1); // 석차표: 화면은 그대로, 글자만 0.6초에 걸쳐 바뀐다
      const start = () => { const T0 = STATE.titleE; STATE.titleE = null; if (G.stats.exams > 0) { E = null; goHub(null); } else leaveTitle(T0); };
      let key = null; for (const [x, y] of taps) { const h = (BTNS || []).find(q => x >= q.x && x <= q.x + q.w && y >= q.y && y <= q.y + q.h); if (h) key = h.key; }
      if (RK.open) {
        if (key === 'rank:close' || pressed('Escape') || pressed('Backspace')) { RK.open = false; RK.old = false; sfx.flip(); }
        else if ((key === 'rank:season' || pressed('Tab')) && netOn()) { RK.old = !RK.old; RK.page = 0; sfx.turn(); if (RK.old) netLoadOld(); } // 이번 시즌 ↔ 지난 시즌
        else if (key === 'rank:up' || pressed('ArrowUp')) { RK.page = Math.max(0, RK.page - 1); sfx.turn(); }
        else if (key === 'rank:down' || pressed('ArrowDown')) { RK.page = Math.min(Math.max(0, Math.ceil(rankRows().length / 10) - 1), RK.page + 1); sfx.turn(); }
        return;
      }
      if (RK.k > 0) return;
      if (key === 'rank:open' || pressed('KeyR')) { RK.open = true; RK.page = 0; sfx.news(); if (netOn()) netLoad(100); return; }
      if (key === 'start' || pressed('Enter') || pressed('Space')) start();
    },
    draw(B) {
      titleExam(); WORLD.renderExam(E, now); // 타이틀: 첫 시험장의 내 책상. 안경이 답을 잡은 순간
      const recs = loadRecords(), RK = STATE.rank || { k: 0, page: 0 };
      BTNS = drawTitle(B.k, B.L, now, G.stats.exams > 0, { best: recs.length ? `${recs[0].name} ${fmtRun(recs[0].t)}` : '', ios: STATE.ios && !STATE.standalone, rank: (rows => RK.old ? { k: RK.k, page: RK.page, rows, total: Math.max(NETOLD.total, rows.length), listed: Math.max(NETOLD.total, rows.length), runs: 0, online: true, old: true, canOld: true, wait: !NETOLD.rows || NETOLD.busy } : { k: RK.k, page: RK.page, rows, total: rankTotal(rows), listed: netOn() && NET.rows ? Math.max(NET.total, rows.length) : rows.length, runs: rankRuns(), online: netOn() && !!NET.rows, old: false, canOld: netOn() })(rankRows()) });
    },
  },
  rankin: {
    update(dt) { updateRankIn(dt); },
    draw(B) { const rows = rankRows(); B.k.R(0, 0, B.L.W, B.L.H, '#04140a'); BTNS = drawRankIn(B.k, B.L, now, STATE.rin, rows, rankTotal(rows), netOn()); },
  },
  hub: {
    update(dt) { updateHub(dt); },
    draw(B) {
      const hv = STATE.hv; if (WORLD.ok) drawLaptop(); hv.mail = !!(G.mail || G.audit); hv.choco = !!G.flags.leet && CONFIG.eggs.choco; hv.tvNew = G.tv.length > G.tvSeen;
      if (WORLD.ok) HUBUI.tv(WORLD.tvTex().g, G.tv[G.tv.length - 1], now, hv.view === 'tv' || hv.tvNew); // 새 뉴스가 있으면 TV가 켜져 있다
      WORLD.renderHub(G, now, STATE.hoverAct, hv); drawHubHud(B);
    },
  },
  probe: {
    update(dt) { updateProbe(dt); },
    draw(B) {
      const P = STATE.probe; if (!P) return;
      const sig = P.qi + '|' + (P.mark ? P.mark.c : '-') + '|' + P.phase; if (WORLD.ok && P.sig !== sig) { P.sig = sig; drawProbePaper(WORLD.probeTex().g, P); }
      WORLD.renderProbe(P, now); if (params.get('hud') !== '0') drawProbeHud(B.k, B.L, P, now, WORLD.probeSpot());
    },
  },
  play: {
    update(dt) { state.t += dt; if (STATE.titleOut > 0) STATE.titleOut = Math.max(0, STATE.titleOut - dt); updateExam(dt); },
    draw(B) { if (E.intro && params.get('hud') !== '0') { WORLD.renderExam(E, now); drawExamHud(B.k, B.L, E, now, hudSet()); drawIntro(B.k, B.L, E, now); return; } if (E.stairs) { WORLD.renderStairs(E.stairs, now); drawStairsHud(B.k, B.L, E, now); return; } WORLD.renderExam(E, now); if (params.get('hud') !== '0') drawExamHud(B.k, B.L, E, now, hudSet()); if (STATE.titleOut > 0) drawTitleOut(B.k, B.L, now, STATE.titleOut / 0.9); },
  },
  pause: {
    update() {
      takeReleases();
      if (needRotate()) { takeTaps(); return; } // 세로로 들고 있는 동안은 멈춰 둔다
      if (takeTaps().length || pressed('KeyP') || pressed('Escape') || pressed('Enter')) { ptrs.clear(); scene = 'play'; }
    },
    draw(B) {
      WORLD.renderExam(E, now); drawExamHud(B.k, B.L, E, now, hudSet());
      const k = B.k, L = B.L;
      drawLensScreen(k, L, now, { col: '#74ff8e', glow: '#0a4018', tint: '#061e0e', big: '일시정지', lines: ['LENS-OS 0.9b', '시험 ......... 멈춤', '감독관 ....... 멈춤'], sub: '화면을 누르면 계속 [P]' });
    },
  },
  results: {
    update() {
      takeReleases();
      const act = key => {
        openParcels(); settle();
        if (key === 'retry') { if (!startExam(RZ.tier)) goHub('board'); }
        else if (key === 'next' && RZ.next != null) { if (RZ.final) scene = 'ending'; else if (!startExam(RZ.next)) goHub('board'); }
        else if (key === 'hub') { if (RZ.final && !G.endSeen) scene = 'ending'; else goHub(null); }
      };
      for (const [x, y] of takeTaps()) { const b = hitBtn(BTNS, x, y); if (b) { act(b.key); return; } }
      if (pressed('KeyR')) act('retry');
      else if (pressed('KeyN')) act('next');
      else if (pressed('Enter') || pressed('Space')) act('hub');
    },
    draw(B) {
      const have = G.money + (G.pending || 0);
      RZ.canRetry = have >= examFee(TIERS[RZ.tier]);
      RZ.canNext = RZ.next != null && !RZ.final && have >= examFee(TIERS[RZ.next]);
      WORLD.renderExam(E, now); drawExamHud(B.k, B.L, E, now, hudSet()); BTNS = drawResultHud(B.k, B.L, RZ, now, hudSet()); if (RZ.lampLine && now - (RZ.shownAt || now) > 0.6) B.k.SUB(RZ.lampLine, B.L.W / 2, 104, 12, '#ffffff', 'center'); drawNote(B);
    },
  },
  ending: {
    update(dt) {
      takeReleases();
      STATE.endT = (STATE.endT || 0) + dt;
      STATE.wipeArm = Math.max(0, STATE.wipeArm - dt);
      const ready = STATE.endT > ENDING_STATS, taps = takeTaps();
      if (!ready) { if ((taps.length || pressed('Enter') || pressed('Space')) && STATE.endT > 1.5) STATE.endT = ENDING_STATS; return; }
      const act = key => {
        if (key === 'continue') { const me = loadRecords().find(r => r.id === G.run.rec); if (me && !me.named) startRankIn(); else { G.endSeen = true; save(); goHub(null); } } // 처음이면 석차표에 이름부터 남긴다
        else if (key === 'name') startRankIn();
        else if (key === 'wipe') { if (STATE.wipeArm > 0) wipe(); else STATE.wipeArm = 2.5; }
      };
      for (const [x, y] of taps) { const b = hitBtn(BTNS, x, y); if (b) { act(b.key); return; } }
      if (pressed('Enter') || pressed('Space')) act('continue');
      else if (pressed('KeyN')) act('name');
      if (pressed('KeyX')) act('wipe');
    },
    draw(B) {
      const et = STATE.endT || 0, shot = endShotAt(et);
      if (WORLD.ok) { if (shot) WORLD.renderTableau(shot.kind, now); else WORLD.renderEnding(et - END_T.me + 1.2, now); }
      BTNS = drawEnding(B.k, B.L, G, now, hudSet(), Object.assign(endingInfo(), { t: STATE.endT || 0, world: WORLD.ok, named: !!(loadRecords().find(r => r.id === G.run.rec) || {}).named }));
      if (STATE.wipeArm > 0) B.k.TO('한 번 더 누르면 저장을 지우고 새 타임어택 (기록은 남아요)', B.L.W / 2, B.L.H - 58, 11, PAL.warn);
    },
  },
};
function wipe() { // 저장만 지운다. 타임어택 기록은 남는다
  try { localStorage.removeItem(SAVE_KEY); } catch (_) { }
  G = newGame(); state = makeState(); E = null; RZ = null; STATE.shown = 0; STATE.pops = []; STATE.wipeArm = 0; STATE.hv = newHubView();
  reset(); scene = 'title';
}

// ---- Loop: fixed step, frame time clamped ---------------------------------------------
let saveT = 0;
function step() {
  if (pressed('KeyM')) { setMuted(!muted); hit.delete('KeyM'); }
  if (scene === 'play' && needRotate()) scene = 'pause';
  now += STEP;
  if (scene !== 'title' && scene !== 'pause' && scene !== 'figures') {
    if (G.gear.bot > 0) addMoney(botRate() * STEP);
    G.stats.playT += STEP;
    if (G.run.started && !G.run.done && scene !== 'ending' && !dlgOpen()) G.run.t += STEP; // 타임어택: 타이틀·일시정지를 뺀 진행 시간
    saveT += STEP; if (saveT > 5) { saveT = 0; save(); }
  }
  const diff = G.money - STATE.shown;
  STATE.shown = diff < 0 || Math.abs(diff) < 1 ? G.money : STATE.shown + diff * Math.min(1, STEP * tune.count_speed);
  for (const p of STATE.pops) p.t += STEP;
  STATE.pops = STATE.pops.filter(p => p.t < 1.4);
  if (STATE.note) { STATE.note.t += STEP; if (STATE.note.t > 2.5) STATE.note = null; }
  scenes[scene].update(STEP); hit.clear();
}
let last, acc = 0, ALPHA = 1;
function tick() {
  const t = clock.now();
  acc += Math.min(t - last, 0.25); last = t; // a stall never fast-forwards the game
  while (acc >= STEP) { step(); acc -= STEP; }
  ALPHA = acc / STEP;
  drawFrame();
}
function drawFrame() {
  fit();
  const B = buffer();
  B.k.b.clearRect(0, 0, B.L.W, B.L.H); // HUD 층은 투명하게 비우고 그 아래로 3D가 보인다
  if (!WORLD.ok && scene !== 'ending') drawNo3D(B); else scenes[scene].draw(B);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = true;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(B.c, 0, 0, canvas.width, canvas.height);
}
function frame() { tick(); requestAnimationFrame(frame); }
function timer() { if (document.visibilityState === 'visible' && clock.now() - last > 0.1) tick(); }

// ---- What a check can read and drive (?manual=1 stops the loop; players never see it) ----
window.game = {
  get scene() { return scene; },
  get state() { return state; },
  press(code) { hit.add(code); },
  hold(code, on) { on ? down.add(code) : down.delete(code); },
  get events() { return events; },
  step(n = 1, draw = true, alpha = 1) {
    for (let i = 0; i < n; i++) step();
    if (draw) { ALPHA = alpha; drawFrame(); }
  },
};

reset();
G = (params.get('fresh') === '1' || params.get('scene')) ? newGame() : (load() || newGame());
const CAN_JUMP = /\/ai-glasses-test(\/|$)/.test(location.pathname) || location.protocol === 'file:'; // 단계 건너뛰기는 테스트 사이트에서만
function jumpTo(J, lean) { // J번 시험 바로 앞까지 깬 상태로 만든다. 그때까지 나온 장비·모델·조력자 물건을 다 가진 채로, 돈은 그 시험 응시료의 세 배
  if (!CAN_JUMP || !(J >= 1 && J <= TIERS.length)) return; backupSave(); const n = J - 1, opts = G && G.opts; G = newGame(); if (opts) G.opts = opts;
  G.cleared = TIERS.map((_, i) => i < n); G.unlocked = J; if (n > 0) { G.flags.cam = true; G.flags.sold = true; G.hints = Object.assign(G.hints || {}, { scan: true, look: true }); }
  for (const d of CONFIG.gear) if (d.at) G.gear[d.id] = Math.max(d.id === 'lens' ? 1 : 0, d.at.filter(t => t <= n - 1).length);
  G.gear.model = Math.max(0, CONFIG.models.reduce((m, x, i) => x.rel <= n - 2 ? i : m, 0)); G.tg = {}; G.tgTold = {}; for (const h of CONFIG.helper) if (h.tier < n) G.tg[h.id] = true;
  syncGear(); if (lean) G.money = examFee(TIERS[n]) * 3; save();
}
function restoreBackup() { try { const raw = localStorage.getItem(BAK_KEY); if (!raw) return false; const cur = localStorage.getItem(SAVE_KEY); G = adopt(JSON.parse(raw)); if (cur) localStorage.setItem(BAK_KEY, cur); save(); return true; } catch (_) { return false; } }
if (params.get('fresh') === '1') backupSave();
{ const J = Number(params.get('go')); if (J >= 1 && CAN_JUMP) { G = load() || G; jumpTo(J, true); history.replaceState(null, '', location.pathname + (params.get('real') === '1' ? '?real=1' : '')); } } // 주소의 ?go=번호 로도 건너뛴다

STATE.hv = newHubView();
if (TIER_Q) { G.unlocked = clamp(Number(TIER_Q) + 1, 1, TIERS.length); for (let i = 0; i < G.unlocked - 1; i++) G.cleared[i] = true; }
if (params.get('gear')) { const lv = Number(params.get('gear')); for (const d of CONFIG.gear) G.gear[d.id] = d.hidden ? 0 : gearOpen(d) ? Math.min(gearCap(d), lv >= 9 ? 99 : lv) : 0; syncGear(); let m = 0; while (modelOpen(m + 1)) m++; G.gear.model = m; }
if (params.get('money')) G.money = Number(params.get('money'));
if (params.get('auto') === '0') G.gear.autoscan = 0; // check only: 자동 스캔 없이 직접 해 본다
if (params.get('lens')) { G.gear.lens = Number(params.get('lens')); syncGear(); } // check only: 촬영·표시 장비 단계를 정해서 본다
state = makeState();
awayEarnings();
STATE.shown = G.money;
scene = params.get('scene') || 'title';
if (!scenes[scene]) scene = 'title';
if (scene === 'play' || scene === 'pause' || scene === 'results') {
  const ti = Number(TIER_Q) || 0;
  G.money = Math.max(G.money, examFee(TIERS[ti])); G.stats.exams = ti > 0 ? 1 : G.stats.exams;
  startExam(ti);
  if (params.get('t')) { const n = Math.round(Number(params.get('t')) / STEP); for (let i = 0; i < n && scene === 'play'; i++) step(); }
  if (params.get('scan')) { E.view = 'paper'; E.prevView = 'paper'; E.viewT = 1; E.start = 0; const v = Number(params.get('scan')); if (v >= 1) completeScan(); else { E.scan = v; E.holding = true; } } // check only: 스캔 중·스캔 끝 장면
  if (params.get('stairs')) { const v = params.get('stairs'); E.stairs = { phase: v === '1' ? 'intro' : v === '3' ? 'out' : 'run', t: 3, steps: v === '1' ? 0 : 23, last: 'L', left: 4.2, stumble: 0, result: v === '3' ? 'clear' : null }; if (params.get('clear')) { E.stairs = null; E.clear = true; E.start = 0; E.view = 'paper'; E.prevView = 'paper'; E.viewT = 1; } } // check only
  if (params.get('essay')) { E.qi = E.qs.length - 1; E.start = 0; E.view = 'paper'; E.prevView = 'paper'; E.viewT = 1; E.es = { q: E.qs[E.qi], done: 2, r: 0, w: 0.55, mem: params.get('essay') === '2' ? 0 : 3.2 }; if (params.get('essay') === '2') E.es.r = 0.6; } // check only
  if (params.get('intro')) { if (E.intro) E.intro.t = Number(params.get('intro')); } else if (E.intro) { E.intro = null; if (E.deadNext) { E.dead = E.deadNext; E.deadNext = null; } } // check only: 입실 장면의 그 순간 / 건너뛰기
  if (params.get('dead')) E.dead = params.get('dead');
  if (params.get('caught')) { E.start = 0; E.sus = 1; getCaught(); }
  if (params.get('fire')) { E.start = 0; E.pulse.warn = params.get('fire') === '1' ? 0.8 : 0; E.pulse.active = params.get('fire') === '1' ? 0 : 0.35; }
  if (params.get('peek')) { const st = E.staff[0]; st.phase = 'peek'; st.peek = { stage: 'stare', t: 0.5 }; E.view = 'paper'; E.viewT = 1; }
  if (params.get('final')) { E.qi = E.qs.length - 2; E.start = 0; E.answers[E.qi] = 0; nextQuestion(); if (params.get('final') === '2') { E.view = 'paper'; E.viewT = 1; completeScan(); } }
  if (params.get('scene') === 'results') { while (!E.over) { E.qs.forEach((q, i) => { E.answers[i] = (i + E.part) % 4 === 3 ? (q.answer + 1) % 4 : q.answer; E.via[i] = i % 2 ? 'ai' : 'self'; }); endPart(true); E.breakT = 0; } finishExam(); }
}
if (params.get('lamps')) G.lamps = clamp(Number(params.get('lamps')), 0, 3); // check only: 전수조사 장면들
if (params.get('tvn')) { const T0 = TIERS[Number(TIER_Q) || 6]; G.tv.push({ 1: { tag: '사회', h: `${T0.name} 사상 첫 만점자 나왔다`, s: '출제위원 "만점이 나올 수 없게 낸 시험인데…"', icon: 'room', cap: '자료 화면 · 시험장' }, 2: { tag: '속보', h: '잇따른 만점… 당국 "전수조사 검토"', s: `${T0.name}에서도 만점 · 같은 수험번호`, icon: 'paper', cap: '자료 화면 · 답안지' }, 3: { tag: '속보', h: '"AI 안경으로 시험 본다" 익명 제보', s: '제보자 "장비 판 사람이 나… 돈을 안 주더라"', icon: 'tip', cap: '제보 영상 · 모자이크' }, 4: { tag: '속보', h: '"AI 안경 부정 응시" 수험생 검거', s: `${T0.name} 합격 취소 · 벌금 1,200,000원`, icon: 'cuffs', cap: '현장 화면' }, 5: { tag: '사회', h: '재검증 결과 "이상 없음"', s: `${T0.name} 만점자, 조사관 앞에서 다시 풀어 통과`, icon: 'stamp', cap: '자료 화면 · 판정' } }[params.get('tvn')]); }
if (params.get('audit') || scene === 'probe') { const ti = Number(TIER_Q) || 6; G.audit = { tier: ti, tierName: TIERS[ti].name, reward: 1200000, mail: null }; G.unlocked = Math.max(G.unlocked, ti + 1); }
if (params.get('guide')) { const n = Number(params.get('guide')); if (n >= 2) { G.hints.scan = true; G.hints.pick = true; } if (n >= 3) G.hints.front = true; if (n >= 4) G.hints.look = true; } // check only: 조작 안내 단계
if (scene === 'rankin') { G.run.t = 1107; G.stats.exams = 31; G.stats.caught = 2; addRecord(); startRankIn(); if (params.get('name')) { document.getElementById('nameIn').value = params.get('name'); } if (params.get('phase') === 'done') { STATE.rin.phase = 'done'; STATE.rin.msg = '등록되었습니다'; } }
if (params.get('ranks') === '2') STATE.rank = { open: true, k: 1, page: 0 }; else if (params.get('ranks') === '3') STATE.rank = { open: true, k: 0.45, page: 0 };
if (params.get('choco')) { G.flags.leet = true; if (params.get('choco') === '1') STATE.hv.chocoT = 0.4; STATE.say = { text: '…참자. 단맛을 억제하는 게 좋다고 그랬어.', t: 0 }; }
if (params.get('tip')) { G.flags.tip = true; STATE.tipAmount = 6400000; }
if (scene === 'probe') { startProbe(); const P = STATE.probe; P.phase = params.get('phase') || 'in'; P.t = Number(params.get('t')) || 0; P.qi = Number(params.get('q')) || 0; if (P.phase !== 'in' && P.phase !== 'play') { P.qi = 4; P.correct = P.phase === 'fail' ? 1 : 4; } if (params.get('pick')) P.mark = { c: 1, t: 9 }; }
if (scene === 'ending') { STATE.endT = Number(params.get('t')) || 0; G.stats.scans = 214; G.run.t = 5025; G.run.splits = TIERS.map((_, i) => 200 * (i + 1)); G.cleared = TIERS.map(() => true); G.unlocked = TIERS.length; G.run.rec = -1; }
if (scene === 'hub' && params.get('scene')) {
  if (G.stats.exams === 0) G.stats.exams = 1;
  if (params.get('news')) for (let i = 0; i < G.unlocked - 1; i++) unlockNews(i);
  const v = params.get('hv'); if (['laptop', 'board', 'phone', 'mail', 'tv'].includes(v)) { enterView(v, true); if (params.get('tab')) { if (v === 'phone') STATE.hv.ptab = params.get('tab'); else { STATE.hv.tab = params.get('tab'); STATE.hv.app = 'shop'; } }
    if (params.get('app')) { STATE.hv.app = params.get('app'); if (params.get('sold')) G.flags.sold = true; if (params.get('black')) { G.flags.cam = true; G.gear.lens = Math.max(1, G.gear.lens); G.black = { amount: 6400000, n: 1 }; } } }
  if (params.get('mail')) G.mail = { tier: 8, tierName: TIERS[8].name, marks: [0,1,2,3,4,5,6,7,8,9].map(i => ({ r: i % 4 === 3 ? 'X' : 'O', via: i % 2 ? 'ai' : 'self' })), correct: 8, qn: 10, pass: 60, score: 80, caught: false, passed: true, stamp: '합격' };
  if (params.get('note')) STATE.note = params.get('note') === '2' ? { text: '주문이 완료되었습니다', sub: '지우개 액정 · 1,200원 · 곧 도착', t: 0 } : { text: '품절되었습니다', t: 0 }; // check only
  if (params.get('parcel')) STATE.hv.parcel = { phase: 'wait', t: 0, items: [{ id: 'lens', name: gearName('lens', 1) }] };
  for (let i = 0; i < 6; i++) step(); // 화면 확인용: 방을 한 번 비춘 뒤
}
last = clock.now();
if (params.get('manual') === '1') drawFrame();
else { requestAnimationFrame(frame); setInterval(timer, 50); }

// [용궁] 물속 신호: 수면 부표에서 내려오는 AI 신호가 물결(느린 너울)에 따라 세졌다 약해졌다 하고, 가끔 해류가 지나가며 크게 끊긴다.
// 신호가 약하면 스캔이 느려지고(0.58 이상이면 제 속도, 0.18 아래면 멈춤), 끊긴 채 누르고 있으면 받던 진행이 조금씩 샌다.
// 전파 위장기(위장 4단계 '전파 위장 케이스'부터)가 있으면 너울과 해류가 덜 흔든다. 감독관이 안 볼 때 + 신호가 좋을 때가 겹쳐야 한다.
function seaSignal(dt) {
  const S = E.sig || (E.sig = { t: rng() * 20, next: between(4, 7), left: 0, dur: 0, p1: rng() * 6.28, p2: rng() * 6.28 }), j = G.gear.jammer || 0;
  const amp = j >= 3 ? 0.5 : j >= 2 ? 0.7 : 0.9, depth = j >= 3 ? 0.45 : j >= 2 ? 0.6 : 0.85; // 너울 폭 · 해류가 끊는 깊이
  S.t += dt;
  if (S.left > 0) { S.left -= dt; if (S.left <= 0) { S.left = 0; S.next = between(2.6, 4.6); } } // 해류가 지나간 뒤 다음 해류까지
  else { S.next -= dt; if (S.next <= 0) { S.dur = S.left = between(1.9, 3.0); sfx.bubble(); } } // 해류가 밀려온다 (기포 소리)
  const dip = S.left > 0 ? Math.sin(Math.PI * (1 - S.left / S.dur)) : 0;
  const swell = 0.47 + amp * (0.34 * Math.sin(2 * Math.PI * S.t / 4.4 + S.p1) + 0.1 * Math.sin(2 * Math.PI * S.t / 1.45 + S.p2));
  E.sigV = clamp(swell * (1 - depth * dip), 0, 1);
  E.sigRate = E.sigV <= 0.18 ? 0 : E.sigV >= 0.58 ? 1 : (E.sigV - 0.18) / 0.4;
  if (E.sigRate === 0 && E.holding && !E.ai && !E.fb && E.scan > 0) E.scan = Math.max(0, E.scan - 0.55 * dt); // 끊긴 동안 받던 진행이 샌다
}
