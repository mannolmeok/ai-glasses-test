// 익명 이용 통계 (PostHog). 본판(aiglass.lol)에서만 보낸다: 테스트판·파일로 연 화면·점검 중에는 아무것도 보내지 않는다.
// 이름·이메일 같은 개인 정보는 보내지 않는다. 기기마다 무작위 번호 하나만 쓴다. 게임 본체는 이 파일이 없어도 그대로 돈다.
(function () {
  'use strict';
  var KEY = 'phc_ufKBNyqf4Vb2W4ju2vfmEgvgdEXou7nprcb9Cxepx7nj', HOST = 'https://us.i.posthog.com/batch/';
  var ON = !!window.__phForce || (location.hostname === 'aiglass.lol' && !(typeof CHECKED !== 'undefined' && CHECKED) && !(typeof TESTSITE !== 'undefined' && TESTSITE));
  if (!ON || typeof events === 'undefined') return;
  var id = null;
  try { id = localStorage.getItem('ai-glasses-aid'); if (!id) { id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2); localStorage.setItem('ai-glasses-aid', id); } } catch (_) { }
  if (!id) id = 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2);
  var mobile = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches), app = false;
  try { app = !!navigator.standalone || matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches; } catch (_) { }
  var q = [], timer = 0;
  function base() {
    var ref = document.referrer || '', dom = '';
    try { dom = ref ? new URL(ref).hostname : ''; } catch (_) { }
    return { distinct_id: id, $process_person_profile: false, $lib: 'aiglass', $current_url: location.href, $host: location.hostname, $pathname: location.pathname, $referrer: ref || '$direct', $referring_domain: dom || '$direct',
      build: String(window.BUILD || ''), device: mobile ? 'mobile' : 'pc', installed: app };
  }
  function send() {
    timer = 0; if (!q.length) return;
    var body = JSON.stringify({ api_key: KEY, batch: q.splice(0, q.length) });
    try { fetch(HOST, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body, keepalive: true, credentials: 'omit' }).catch(function () { }); } catch (_) { }
  }
  function track(name, props) {
    try {
      var p = base(); for (var k in props || {}) p[k] = props[k];
      q.push({ event: name, properties: p, timestamp: new Date().toISOString() });
      if (q.length >= 20) send(); else if (!timer) timer = setTimeout(send, 4000);
    } catch (_) { }
  }
  window.__track = track;
  addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') send(); });
  addEventListener('pagehide', send);

  function tierProps(ti) { var T = TIERS[ti] || {}; return { tier: ti, exam: T.id || '', exam_name: T.name || '', act: T.act || 0 }; }
  function gearProps() { var g = (typeof G !== 'undefined' && G && G.gear) || {}; return { lens: g.lens || 0, model: g.model || 0, money: Math.round((G && G.money) || 0), exams_done: (G && G.stats && G.stats.exams) || 0 }; }
  function merge(a, b) { for (var k in b) a[k] = b[k]; return a; }

  // 게임이 이미 남기는 사건 목록(events)에 얹는다
  var push = events.push.bind(events), lastHow = '';
  events.push = function (e) {
    try {
      if (e && e.type && !(STATE && STATE.titleBuild)) {
        if (e.type === 'exam') track('exam_start', merge(merge(tierProps(e.tier), gearProps()), { fee: e.fee || 0 }));
        else if (e.type === 'caught') lastHow = e.how || '';
        else if (e.type === 'result') {
          if (e.final) track('ending', gearProps());
          else {
            var E0 = (typeof E !== 'undefined' && E) || {};
            track('exam_end', merge(merge(tierProps(E0.tier), gearProps()), { passed: !!e.passed, perfect: !!e.perfect, caught: !!e.caught, caught_how: e.caught ? lastHow : '', correct: e.correct, questions: (E0.qs && E0.qs.length) || 0, reward: e.reward || 0 }));
            lastHow = '';
          }
        }
        else if (e.type === 'buy') track('buy', merge({ item: e.id, lv: e.lv, at_tier: (G.unlocked || 1) - 1 }, gearProps()));
      }
    } catch (_) { }
    return push(e);
  };
  // 응시료가 모자라 못 들어간 경우
  try {
    var se = startExam;
    startExam = function (ti) {
      var r = se.apply(this, arguments);
      try { if (r === false && STATE.note && /모자라/.test(STATE.note.text || '')) { var t = Math.max(0, Math.min(ti, G.unlocked - 1)); track('fee_short', merge(merge(tierProps(t), gearProps()), { fee: examFee(TIERS[t]) })); } } catch (_) { }
      return r;
    };
    var ep = endProbe;
    endProbe = function () {
      var P = STATE.probe, t = P ? P.tier : -1, c = P ? P.correct : 0, r = ep.apply(this, arguments);
      try { track('probe_end', merge(merge(tierProps(t), gearProps()), { passed: c >= 3, correct: c })); } catch (_) { }
      return r;
    };
  } catch (_) { }

  track('$pageview', {});
  track('game_open', gearProps());
})();
