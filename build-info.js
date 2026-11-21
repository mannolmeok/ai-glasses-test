// PROTOTYPE - NOT FOR PRODUCTION
// 배포판 전용 (GitHub Pages): 제목·방 화면 구석에 버전 번호를 띄우고, 새 판이 올라왔으면 한 번만 새로 불러온다.
// 게임 폴더(prototypes/ai-glasses)에는 없는 파일이다. tools/deploy-pages.sh 가 배포 복사본에만 넣고,
// 그 복사본의 index.html 에 window.BUILD 를 찍는다.
(function () {
  'use strict';
  var BUILD = window.BUILD;
  if (!BUILD) return;

  var el = document.createElement('div');
  el.id = 'ver';
  el.setAttribute('aria-hidden', 'true');
  var TEST = /\/ai-glasses-test(\/|$)/.test(location.pathname); // 테스트용 사이트는 본판과 헷갈리지 않게 표시한다
  var LABEL = TEST ? 'TEST ' + BUILD : 'v' + BUILD;
  el.textContent = LABEL;
  if (TEST) el.style.color = '#ffd24a';
  el.style.cssText = 'position:absolute;left:8px;bottom:6px;z-index:2;font-size:11px;line-height:1;' +
    'color:rgba(236,235,242,.55);letter-spacing:.5px;pointer-events:none;display:none';
  var screen = document.getElementById('screen');
  if (screen) screen.appendChild(el);

  function sceneNow() { try { return window.game ? window.game.scene : ''; } catch (e) { return ''; } }
  // 시험 중 HUD에는 띄우지 않는다: 제목과 고시원 방에서만
  setInterval(function () {
    var s = sceneNow();
    el.style.display = s === 'title' || s === 'hub' ? 'block' : 'none';
  }, 300);

  if (!/^https?:$/.test(location.protocol)) return;
  fetch('version.txt?t=' + Date.now(), { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.text() : ''; })
    .then(function (v) {
      v = String(v || '').trim();
      if (!v || v === BUILD) return;
      var tried = '';
      try { tried = sessionStorage.getItem('ai-glasses-reload') || ''; } catch (e) { }
      // 제목 화면이 아니면(이미 시험을 시작했으면) 끊지 않고 알려만 준다. 한 번 새로 불렀는데도
      // 예전 판이면 서버 반영을 기다리는 중이라 다시 돌지 않는다.
      if (tried === v || sceneNow() !== 'title') { el.textContent = LABEL + ' · 새 버전 ' + (TEST ? '' : 'v') + v + ' 있음 (새로고침)'; return; }
      try { sessionStorage.setItem('ai-glasses-reload', v); } catch (e) { }
      var u = new URL(location.href);
      u.searchParams.set('v', v);
      location.replace(u.href);
    })
    .catch(function () { });
})();
