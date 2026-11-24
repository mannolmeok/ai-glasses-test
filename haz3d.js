// PROTOTYPE - NOT FOR PRODUCTION
// 외계 일반 시험의 방해 요소를 시험장에서 실제로 보이게 한다 (규칙은 game.js의 E.hz · E.noise · E.warp 가 정하고, 여기서는 그리기만 한다).
//  은하수능: 시험지가 책상에서 떠오른다   화성: 모래바람이 불고 조명이 꺼진다   꿈속: 담임이 책상 옆에 서 있다
//  거울 나라: 책상 위 손거울에 감독관 눈이 비친다   AI 재판소: 붉은 스캔 막이 법정을 훑는다
//  텔레파시: 생각이 고리가 되어 머리 위로 새어 나간다   블랙홀: 시간이 빨라지면 시험장이 붉게 물든다
'use strict';
(function () {
  let H = null;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), IDS = { galaxy: 1, mars: 1, dream: 1, mirror: 1, aicourt: 1, telepathy: 1, hole: 1 };
  function setup(E, Ax) {
    const EX = Ax.EX, T = Ax.THREE, sc = EX.scene, my = EX.my, id = E.T.id;
    H = { sc, id, k: 0, last: 0, lights: [], pz: EX.paper ? EX.paper.position.z : 0, px: EX.paper ? EX.paper.position.x : 0 };
    sc.traverse(o => { if (o.isLight) H.lights.push([o, o.intensity, o.color.clone()]); });
    if (id === 'mars') { const n = 220, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { pos[i * 3] = my.x + (Math.random() - 0.5) * 7; pos[i * 3 + 1] = 0.5 + Math.random() * 2; pos[i * 3 + 2] = my.z - 3.2 + Math.random() * 4; }
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); H.dust = new T.Points(g, new T.PointsMaterial({ color: 0xe0a060, size: 0.07, transparent: true, opacity: 0, depthWrite: false, fog: false })); H.dust.frustumCulled = false; sc.add(H.dust);
      H.haze = Ax.plane(sc, 9, 4, new T.MeshBasicMaterial({ color: 0xc8743a, transparent: true, opacity: 0, depthWrite: false, fog: false, side: T.DoubleSide }), my.x, 1.6, my.z - 2.4); }
    if (id === 'dream') { H.fig = Ax.makeStaff((E.staff[0] && E.staff[0].type) || 'dean'); if (H.fig) { sc.add(H.fig.root); H.fig.root.visible = false; }
      H.shade = Ax.plane(sc, 0.9, 0.9, new T.MeshBasicMaterial({ color: 0x1a0a2a, transparent: true, opacity: 0, depthWrite: false, fog: false }), my.x - 0.22, 0.75, my.z - 0.2, -Math.PI / 2); }
    if (id === 'mirror') { const tx = Ax.canvasTex(96, 64, true); H.mt = tx; const g = new T.Group(); g.position.set(my.x + 0.3, 0.746, my.z - 0.13); g.rotation.y = -0.28; sc.add(g); // 책상 오른쪽 위에 비스듬히 눕혀 둔 손거울
      const tilt = new T.Group(); tilt.rotation.x = -1.15; g.add(tilt); Ax.bx(tilt, 0.2, 0.145, 0.012, 0x8a8aa0, 0, 0.0725, 0); Ax.bx(tilt, 0.03, 0.07, 0.012, 0x5a5a6a, 0, -0.03, 0);
      Ax.plane(tilt, 0.176, 0.12, new T.MeshBasicMaterial({ map: tx.t, fog: false }), 0, 0.0725, 0.0075); H.mirror = g; H.msig = ''; }
    if (id === 'aicourt') { const g = new T.Group(); sc.add(g); H.sweep = g;
      H.sw1 = Ax.plane(g, 7, 3.2, new T.MeshBasicMaterial({ color: 0xff2a2a, transparent: true, opacity: 0, depthWrite: false, fog: false, side: T.DoubleSide }), 0, 1.6, my.z - 1.6, 0, Math.PI / 2);
      H.sw2 = Ax.bx(g, 0.02, 0.004, 7, 0xff3a3a, 0, 0.752, my.z - 1.6, Ax.glowMat(0xff4a4a)); H.sw3 = Ax.bx(g, 0.02, 3.2, 0.02, 0xff3a3a, 0, 1.6, my.z - 4.9, Ax.glowMat(0xff6a6a)); g.visible = false; }
    if (id === 'telepathy') { H.rings = []; for (let i = 0; i < 5; i++) { const r = new T.Mesh(new T.RingGeometry(0.1, 0.118, 28), new T.MeshBasicMaterial({ color: 0xd8b8ff, transparent: true, opacity: 0, depthWrite: false, fog: false, side: T.DoubleSide })); r.rotation.x = -Math.PI / 2; sc.add(r); H.rings.push(r); } }
  }
  window.HAZ3D = function (E, now, Ax) {
    const EX = Ax.EX; if (!E || !E.T || !IDS[E.T.id] || !EX.scene || EX.home || EX.layout === 'table' || !EX.my) return;
    if (!H || H.sc !== EX.scene || H.id !== E.T.id) setup(E, Ax);
    const dt = clamp(now - H.last, 0, 0.1); H.last = now;
    const hz = E.hz, ph = hz ? hz.phase : 'idle', warn = ph === 'warn', on = ph === 'on', my = EX.my, live = !(E.start > 0) && !E.over && !E.caught;
    const to = (v, tgt, rate) => v + (tgt - v) * (1 - Math.exp(-dt * rate));
    if (H.id === 'galaxy' && EX.paper) { H.k = to(H.k, live && on ? 1 : 0, live && on ? 3.2 : 7); const k = H.k, tr = warn && live ? Math.sin(now * 38) * 0.004 : 0, P = EX.paper;
      if (!EX.floaty) P.position.y = 0.744; P.position.y += 0.2 * k + tr + Math.sin(now * 1.9) * 0.012 * k; P.position.z = H.pz - 0.07 * k; P.position.x = H.px + Math.sin(now * 0.9) * 0.03 * k; P.rotation.z = (EX.floaty ? P.rotation.z : 0) + 0.32 * k; P.rotation.x = -Math.PI / 2 + 0.3 * k; }
    else if (H.id === 'mars') { H.k = to(H.k, live && on ? 1 : live && warn ? 0.45 : 0, 4); const k = H.k, a = H.dust.geometry.attributes.position, v = (2.5 + 6 * k) * dt;
      for (let i = 0; i < a.count; i++) { let x = a.getX(i) + v * (0.7 + (i % 5) * 0.12); if (x > my.x + 3.5) x -= 7; a.setX(i, x); a.setY(i, a.getY(i) + Math.sin(now * 3 + i) * 0.004); } a.needsUpdate = true;
      H.dust.material.opacity = 0.85 * k; H.haze.material.opacity = 0.3 * k; const dim = on && live ? 0.3 : warn && live ? 0.7 + 0.3 * Math.sin(now * 31) : 1; for (const [L, i0] of H.lights) L.intensity = i0 * (1 - (1 - dim) * Math.min(1, k * 2.2)); }
    else if (H.id === 'dream') { const show = live && on; H.k = to(H.k, show ? 1 : live && warn ? 0.6 : 0, 6); H.shade.material.opacity = 0.42 * H.k;
      if (H.fig) { H.fig.root.visible = show; if (show) Ax.poseModel(H.fig, { x: my.x - 0.5, y: 0, z: my.z - 0.42, yaw: Math.PI / 2 - 0.55, moving: false, walk: 0, phase: 'watch', now, headYaw: 0, headPitch: 0.62, hidden: false }); } }
    else if (H.id === 'mirror') { const st = live && on ? 2 : live && warn ? 1 : 0, sig = st + '|' + (st ? Math.floor(now * 6) % 2 : 0);
      if (sig !== H.msig) { H.msig = sig; const g = H.mt.g; g.fillStyle = st === 2 ? '#3a1414' : '#9fb4c8'; g.fillRect(0, 0, 96, 64); g.fillStyle = 'rgba(255,255,255,0.25)'; g.beginPath(); g.moveTo(8, 0); g.lineTo(30, 0); g.lineTo(6, 64); g.lineTo(0, 64); g.fill();
        if (st === 1) { g.fillStyle = 'rgba(40,30,30,0.35)'; g.beginPath(); g.ellipse(48, 40, 24, 28, 0, 0, 7); g.fill(); }
        if (st === 2) { g.fillStyle = '#c8a890'; g.beginPath(); g.ellipse(48, 38, 26, 30, 0, 0, 7); g.fill(); g.fillStyle = '#1a1010'; g.fillRect(22, 4, 52, 14); for (const ex of [36, 60]) { g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(ex, 34, 8, 5.5, 0, 0, 7); g.fill(); g.fillStyle = '#c01818'; g.beginPath(); g.arc(ex, 34, 4, 0, 7); g.fill(); g.fillStyle = '#000000'; g.beginPath(); g.arc(ex, 34, 1.8, 0, 7); g.fill(); } g.fillStyle = '#2a1a1a'; g.fillRect(30, 24, 14, 3); g.fillRect(52, 24, 14, 3); }
        H.mt.t.needsUpdate = true; } }
    else if (H.id === 'aicourt') { const vis = live && (warn || on || (ph === 'idle' && H.k > 0.02)); let u = H.u == null ? 0 : H.u;
      if (warn) u = 0.5 * (1 - hz.t / hz.warn) * 0.9; else if (on) u = 0.45 + 0.1 * (1 - hz.t / hz.dur); else u = Math.min(1.1, u + dt * 0.9); H.u = u; H.k = to(H.k, live && (warn || on) ? 1 : u < 1.05 && live ? 0.8 : 0, 8);
      H.sweep.visible = vis && H.k > 0.02; H.sweep.position.x = my.x - 3.2 + 6.4 * clamp(u, 0, 1.05); H.sw1.material.opacity = (on ? 0.3 : 0.16) * H.k; if (!live || (ph === 'idle' && u >= 1.05)) { H.sweep.visible = false; if (ph === 'idle' && hz && hz.t < 0.2) H.u = 0; } if (warn && hz.t > hz.warn - 0.05) H.u = 0; }
    else if (H.id === 'telepathy') { const n = live ? (E.noise || 0) : 0, burst = E.noiseT > 0 && live;
      H.rings.forEach((r, i) => { const f = ((now * (burst ? 1.6 : 0.5) + i / 5) % 1), s = 0.6 + f * (burst ? 9 : 2.2); r.position.set(my.x, 0.775 + f * (burst ? 0.3 : 0.22), my.z - 0.02); r.scale.setScalar(s * (burst ? 0.6 : 0.8)); r.material.opacity = (burst ? 0.8 : n * 0.75) * (1 - f); r.material.color.setHex(burst || n > 0.7 ? 0xff7a9a : 0xd8b8ff); }); }
    else if (H.id === 'hole') { const w = live ? clamp(((E.warp || 1) - 1.2) / 0.9, 0, 1) : 0; H.k = to(H.k, w, 4); for (const [L, i0, c0] of H.lights) { L.color.copy(c0); L.color.r = Math.min(1, c0.r + 0.5 * H.k); L.color.g = c0.g * (1 - 0.55 * H.k); L.color.b = c0.b * (1 - 0.6 * H.k); L.intensity = i0 * (1 + 0.25 * H.k * Math.sin(now * 9)); } }
  };
})();
