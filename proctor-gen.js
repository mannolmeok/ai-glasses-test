// 시험판: 감독관을 생성 모델(힉스필드 기준 그림 → Meshy 3D·뼈대·걷기)로 바꿔 보기. 주소에 ?proctor=gen 을 붙였을 때만 켜진다.
// 모델은 뼈대째 싣지 않고 걷기·서 있기 동작을 정점 위치로 구워 둔 묶음(assets/gen/proctor-gen.bin)을 프레임 사이를 이어 붙여 움직인다.
// 고개 돌리기는 목 위 정점만 목뼈 자리를 축으로 돌린다. 앉기·답안지 집기·입실 검사처럼 팔을 쓰는 동작은 아직 상자 모델로 돌아간다.
(() => {
  'use strict';
  const QS = new URLSearchParams(location.search), ROOM = QS.get('assets') === 'gen';
  if ((QS.get('proctor') !== 'gen' && !ROOM) || typeof THREE === 'undefined') return;
  // ?assets=gen: 시험장 전체(책상·학생·문·사물함)도 생성 모델로. world3d.js가 읽기 전에 모델 묶음을 먼저 싣는다
  if (ROOM && document.readyState === 'loading') document.write('<script src="assets/gen/room-gen.js?v=3"><\/script>');
  // 분위기 B(흐린 오후): 낮 시험장의 따뜻한 햇빛을 차가운 청록빛 형광등 느낌으로 바꾼다. 장면마다 한 번
  function mood(scene) {
    if (!ROOM || scene.userData.moodB) return; scene.userData.moodB = 1;
    let day = false; scene.traverse(o => { if (o.isDirectionalLight && o.color.getHex() === 0xffe2b8) day = true; }); if (!day) return;
    scene.traverse(o => {
      if (o.isDirectionalLight) { o.color.setHex(0xe4f2ea); o.intensity = 1.25; }
      else if (o.isHemisphereLight) { o.color.setHex(0xd6ebe2); o.groundColor.setHex(0x2e3d37); o.intensity = 1.05; }
      else if (o.isAmbientLight) { o.color.setHex(0xd4e8de); o.intensity = 0.82; }
    });
    if (scene.fog) scene.fog.color.setHex(0x7f948c);
    decor(scene);
  }
  const b64 = b => { const t = atob(b), a = new Uint8Array(t.length); for (let i = 0; i < t.length; i++) a[i] = t.charCodeAt(i); return a.buffer; };
  const tex = src => { const t = new THREE.Texture(), img = new Image(); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; img.onload = () => { t.image = img; t.needsUpdate = true; }; img.src = src; return t; };
  // 게임에 자리가 없는 것들은 장면에 직접 손댄다: 창밖, 벽 깜빡임, TV·칠판 틀·시계·필통을 생성 모델로
  const MESH = {};
  function gen(name) { // window.MODELS의 모델 하나를 메시로 (같은 모델은 도형·재질을 함께 쓴다)
    const d = window.MODELS && window.MODELS[name]; if (!d) return null;
    if (!MESH[name]) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(b64(d.pos)), 3)); g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(b64(d.uv)), 2)); g.setIndex(new THREE.BufferAttribute(new Uint16Array(b64(d.idx)), 1)); g.computeBoundingBox();
      const t = tex(d.tex); t.flipY = true; MESH[name] = { g, m: new THREE.MeshLambertMaterial({ map: t, flatShading: true }) }; }
    return new THREE.Mesh(MESH[name].g, MESH[name].m);
  }
  function decor(scene) {
    const FXT = window.FX && window.FX.tex; let door = null, sky = null, clock = null, pcase = null;
    scene.traverse(o => {
      if (o.isGroup && o.parent === scene && Math.abs(o.position.y - 0.744) < 0.001 && Math.abs(o.rotation.y - 0.14) < 0.001 && o.children.some(c => c.isGroup && Math.abs(c.position.z + 0.035) < 0.001)) pcase = o;
      if (!o.isMesh) return; const gp = o.geometry && o.geometry.parameters, m = o.material;
      if (Math.abs(o.scale.x - 2.15) < 0.01 && Math.abs(o.rotation.y + Math.PI / 2) < 0.01) door = o;
      if (gp && gp.width === 2 && gp.height === 1.5 && m && m.isMeshBasicMaterial && m.map && m.fog === false) sky = m;
      if (gp && gp.width === 0.42 && gp.height === 0.42 && m && m.transparent) clock = o;
      if (gp && gp.width === 1.9 && gp.height === 1.3 && m && m.blending === THREE.AdditiveBlending) { m.color.setHex(0xcfe6dc); m.opacity = 0.07; }
      // 벽 그림이 벽 상자와 거의 같은 자리에 있어 번갈아 그려지며 깜빡였다: 벽 그림을 방 안쪽으로 3cm 당기고 항상 앞에 그려지게 한다
      if (gp && gp.width >= 9 && gp.height >= 2.9 && Math.abs(o.rotation.x) < 0.01 && m && m.map && Math.abs(o.position.y - gp.height / 2) < 0.01) {
        o.position.x += Math.sin(o.rotation.y) * 0.03; o.position.z += Math.cos(o.rotation.y) * 0.03; m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -4; }
    });
    if (sky && FXT && FXT.sky) { sky.map = tex(FXT.sky); sky.map.flipY = true; sky.color.setHex(0xe8f0ec); sky.needsUpdate = true; }
    if (door) {
      const z0 = door.position.z - 1.4, tv = gen('tv'), bd = gen('board');
      if (tv) { // 원래 검은 TV 상자(1.1 × 0.7)를 TV 몸통이 딱 덮게: 몸통(앞쪽 정점들)의 크기를 재서 맞춘다
        const P = tv.geometry.attributes.position, bb = tv.geometry.boundingBox, zc = bb.max.z * 0.6; let x0 = 9, x1 = -9, y0 = 9, y1 = -9;
        for (let i = 0; i < P.count; i++) if (P.getZ(i) > zc) { x0 = Math.min(x0, P.getX(i)); x1 = Math.max(x1, P.getX(i)); y0 = Math.min(y0, P.getY(i)); y1 = Math.max(y1, P.getY(i)); }
        const sx = 1.16 / (x1 - x0), sy = 0.76 / (y1 - y0), sz = 0.42 / bb.max.z;
        tv.scale.set(sx, sy, sz); tv.position.set(3.6 - (x0 + x1) / 2 * sx, 2.35 - (y0 + y1) / 2 * sy, z0 + 0.02); scene.add(tv); }
      if (bd) { bd.scale.set(5.92, 1.7, 0.2); bd.position.set(0, 1.565, z0 + 0.045); scene.add(bd); } // 칠판 틀과 분필 받침: 글씨는 게임이 그리는 판이 앞에서 그대로 보인다
    }
    if (clock) { const c = gen('clock'); if (c) { c.scale.set(0.54, 0.54, 0.07); c.position.set(clock.position.x, clock.position.y, clock.position.z - 0.045); scene.add(c); } }
    if (pcase) { // 필통: 뚜껑(스캔할 때 열리는 부분)을 생성 모델로. 열리고 떨리는 동작은 게임 것 그대로 따라간다
      const lid = pcase.children.find(c => c.isGroup), c = gen('pcase');
      if (lid && c) { lid.children.forEach(x => { if (x.isMesh) x.visible = false; }); pcase.children.forEach(x => { if (x.isMesh && x.geometry && !(x.geometry.parameters && x.geometry.parameters.width) && Math.abs(x.scale.y - 0.024) < 0.001) x.scale.y = 0.02; });
        c.scale.set(0.158, 0.034, 0.078); c.position.set(0, 0.012, 0.036); lid.add(c); }
    }
  }
  const D = { ok: false }, V = '?v=3';
  Promise.all([fetch('assets/gen/proctor-gen.json' + V).then(r => r.json()), fetch('assets/gen/proctor-gen.bin' + V).then(r => r.arrayBuffer())]).then(([meta, buf]) => {
    const n = meta.n, F = meta.clips.walk.frames + meta.clips.idle.frames; let o = 0;
    D.pos = new Int16Array(buf, o, F * n * 3); o += F * n * 6;
    D.uv = new Float32Array(buf.slice(o, o + n * 8)); o += n * 8;
    D.idx = new Uint16Array(buf.slice(o, o + meta.tris * 6)); o += meta.tris * 6;
    D.hw = new Uint8Array(buf, o, n); D.meta = meta; D.n = n;
    D.head = []; for (let i = 0; i < n; i++) if (D.hw[i] > 0) D.head.push(i);
    const tex = new THREE.Texture(), img = new Image();
    tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.flipY = false;
    img.onload = () => { tex.image = img; tex.needsUpdate = true; D.ok = true; }; img.src = 'assets/gen/proctor-gen.png' + V; D.tex = tex;
  }).catch(e => console.warn('proctor-gen', e));
  function material(snap) { // 게임의 다른 모델처럼 화면 격자에 정점을 맞춰 떨리게 (PSX 느낌)
    if (D.mat) return D.mat;
    const m = new THREE.MeshLambertMaterial({ map: D.tex, color: 0xffffff, flatShading: true });
    m.onBeforeCompile = sh => { sh.uniforms.snapRes = { value: snap };
      sh.vertexShader = 'uniform vec2 snapRes;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n  gl_Position.xy = floor(gl_Position.xy / gl_Position.w * snapRes + 0.5) / snapRes * gl_Position.w;'); };
    m.customProgramCacheKey = () => 'psx-proctor-gen';
    return (D.mat = m);
  }
  function make(snap) {
    const g = new THREE.BufferGeometry(), pos = new Float32Array(D.n * 3), attr = new THREE.BufferAttribute(pos, 3);
    g.setAttribute('position', attr); g.setAttribute('uv', new THREE.BufferAttribute(D.uv, 2)); g.setIndex(new THREE.BufferAttribute(D.idx, 1));
    const mesh = new THREE.Mesh(g, material(snap)); mesh.frustumCulled = false; mesh.userData = { pos, attr, blend: 0, last: 0 };
    return mesh;
  }
  const clipAt = (c, cyc) => { const f = ((cyc % 1) + 1) % 1 * c.frames, i0 = Math.floor(f) % c.frames; return { a: (c.start + i0) * D.n * 3, b: (c.start + (i0 + 1) % c.frames) * D.n * 3, k: f - Math.floor(f), i0, i1: (i0 + 1) % c.frames }; };
  function setPose(mesh, walkCyc, idleCyc, blend, headYaw) {
    const C = D.meta.clips, P = D.pos, out = mesh.userData.pos, q = 1 / D.meta.q, n3 = D.n * 3, w = clipAt(C.walk, walkCyc), s = clipAt(C.idle, idleCyc), nk = D.meta.neck;
    if (blend <= 0.001) for (let i = 0; i < n3; i++) out[i] = (P[s.a + i] + (P[s.b + i] - P[s.a + i]) * s.k) * q;
    else if (blend >= 0.999) for (let i = 0; i < n3; i++) out[i] = (P[w.a + i] + (P[w.b + i] - P[w.a + i]) * w.k) * q;
    else for (let i = 0; i < n3; i++) { const x = P[s.a + i] + (P[s.b + i] - P[s.a + i]) * s.k, y = P[w.a + i] + (P[w.b + i] - P[w.a + i]) * w.k; out[i] = (x + (y - x) * blend) * q; }
    if (Math.abs(headYaw) > 0.005) { // 고개: 목 위 정점만 목뼈를 축으로 돌린다 (목 아래로 갈수록 덜 돌아 자연스럽게 이어진다)
      const ni = nk.idle, nw = nk.walk, px = [0, 2].map(j => { const a = ni[s.i0][j] + (ni[s.i1][j] - ni[s.i0][j]) * s.k, b = nw[w.i0][j] + (nw[w.i1][j] - nw[w.i0][j]) * w.k; return a + (b - a) * blend; });
      for (const v of D.head) { const a = headYaw * D.hw[v] / 255, c = Math.cos(a), sn = Math.sin(a), i = v * 3, dx = out[i] - px[0], dz = out[i + 2] - px[1]; out[i] = px[0] + dx * c + dz * sn; out[i + 2] = px[1] - dx * sn + dz * c; }
    }
    mesh.userData.attr.needsUpdate = true;
  }
  function restore(m) { if (m._genHid) { for (const o of m._genHid) o.visible = true; m._genHid = null; } if (m.gen2) m.gen2.visible = false; }
  window.PROCTOR_GEN = {
    data: D,
    // 게임이 감독관마다 매 프레임 부른다. true를 돌려주면 상자 몸은 숨기고 생성 모델을 세운다 (시야 부채꼴은 그대로 둔다)
    pose(m, o) {
      const p = o.p, s = o.s;
      mood(o.scene);
      if (!D.ok || m.robot || m.omega || m.type === 'omega' || o.frisk || o.hold || p.seated || p.sit > 0.01 || p.raise) { restore(m); return false; }
      if (!m.gen2) { m.gen2 = make(o.snap); o.scene.add(m.gen2); }
      const g = m.gen2, u = g.userData, shown = m.root.visible;
      if (g.parent !== o.scene) o.scene.add(g);
      if (!m._genHid) { m._genHid = []; m.root.traverse(x => { if (x.isMesh && x !== m.cone && x.visible) { let c = false; for (let y = x; y; y = y.parent) if (y === m.cone) c = true; if (!c) { x.visible = false; m._genHid.push(x); } } }); }
      g.visible = shown; if (!shown) return true;
      const dt = Math.min(0.1, Math.max(0, o.now - u.last)); u.last = o.now;
      u.blend += ((p.moving ? 1 : 0) - u.blend) * Math.min(1, dt * 9);
      const walk = p.walk != null ? p.walk : s.walk;
      setPose(g, (walk || 0) * 7 / (Math.PI * 2), o.now / D.meta.clips.idle.dur, u.blend, m.headYaw || 0);
      g.position.set(p.x, p.y || 0, p.z); g.rotation.y = m.yaw || 0; g.scale.setScalar(p.scale || 1);
      if (m.props) for (const pp of m.props) pp.visible = false; // 상자 모델이 들던 소품은 숨기고, 생성 모델 손에 서류판을 쥐여 준다
      if (ROOM && u.clip === undefined) { u.clip = gen('clip') || null; if (u.clip) { u.clip.scale.set(0.23, 0.31, 0.03); g.add(u.clip); } }
      if (u.clip) { const H = D.meta.hand, C = D.meta.clips, wf = clipAt(C.walk, (walk || 0) * 7 / (Math.PI * 2)), sf = clipAt(C.idle, o.now / C.idle.dur), at = j => { const a = H.idle[sf.i0][j] + (H.idle[sf.i1][j] - H.idle[sf.i0][j]) * sf.k, b = H.walk[wf.i0][j] + (H.walk[wf.i1][j] - H.walk[wf.i0][j]) * wf.k; return a + (b - a) * u.blend; };
        u.clip.position.set(at(0) - 0.03, at(1) - 0.13, at(2) + 0.03); u.clip.rotation.set(0.12, Math.PI / 2 - 0.25, 0); }
      return true;
    },
  };
})();
