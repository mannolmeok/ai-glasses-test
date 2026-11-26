// 시험판: 감독관을 생성 모델(힉스필드 기준 그림 → Meshy 3D·뼈대·걷기)로 바꿔 보기. 주소에 ?proctor=gen 을 붙였을 때만 켜진다.
// 모델은 뼈대째 싣지 않고 걷기·서 있기 동작을 정점 위치로 구워 둔 묶음(assets/gen/proctor-gen.bin)을 프레임 사이를 이어 붙여 움직인다.
// 고개 돌리기는 목 위 정점만 목뼈 자리를 축으로 돌린다. 앉기·답안지 집기·입실 검사처럼 팔을 쓰는 동작은 아직 상자 모델로 돌아간다.
(() => {
  'use strict';
  const QS = new URLSearchParams(location.search), ROOM = QS.get('assets') === 'gen';
  if ((QS.get('proctor') !== 'gen' && !ROOM) || typeof THREE === 'undefined') return;
  // ?assets=gen: 시험장 전체(책상·학생·문·사물함)도 생성 모델로. world3d.js가 읽기 전에 모델 묶음을 먼저 싣는다
  if (ROOM && document.readyState === 'loading') document.write('<script src="assets/gen/room-gen.js?v=5"><\/script>');
  // 장면마다 한 번: 생성 모델 색 맞추기와 소품 놓기
  function mood(scene) {
    if (!ROOM || scene.userData.moodB) return; scene.userData.moodB = 1;
    // 밝은 낮 교실: 게임의 낮 조명을 그대로 쓴다 (어두운 청록 분위기는 뺐다)
    decor(scene);
  }
  const b64 = b => { const t = atob(b), a = new Uint8Array(t.length); for (let i = 0; i < t.length; i++) a[i] = t.charCodeAt(i); return a.buffer; };
  const tex = src => { const t = new THREE.Texture(), img = new Image(); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; img.onload = () => { t.image = img; t.needsUpdate = true; }; img.src = src; return t; };
  // 게임에 자리가 없는 것들은 장면에 직접 손댄다: 창밖, 벽 깜빡임, TV·칠판 틀·시계·필통을 생성 모델로
  const MESH = {}, DIM = 0xdcdcdc;
  function gen(name) { // window.MODELS의 모델 하나를 메시로 (같은 모델은 도형·재질을 함께 쓴다)
    const d = window.MODELS && window.MODELS[name]; if (!d) return null;
    if (!MESH[name]) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(b64(d.pos)), 3)); g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(b64(d.uv)), 2)); g.setIndex(new THREE.BufferAttribute(new Uint16Array(b64(d.idx)), 1)); g.computeBoundingBox();
      const t = tex(d.tex); t.flipY = true; MESH[name] = { g, m: new THREE.MeshLambertMaterial({ map: t, flatShading: true, color: 0xdcdcdc }) }; }
    return new THREE.Mesh(MESH[name].g, MESH[name].m);
  }
  function decor(scene) {
    const FXT = window.FX && window.FX.tex; let door = null, sky = null, clock = null, pcase = null;
    scene.traverse(o => { // 생성 모델(게임이 세운 책상·학생·문·사물함)은 그림에 명암이 이미 있어서 조명을 그대로 받으면 색이 하얗게 뜬다: 받는 빛을 줄인다
      const m = o.isMesh && o.material; if (m && m.isMeshLambertMaterial && m.color.getHex() === 0xffffff && o.geometry && !o.geometry.parameters && o.geometry.index && o.geometry.attributes.uv && !m.userData.dim) { m.userData.dim = 1; m.color.setHex(DIM); }
    });
    scene.traverse(o => {
      if (o.isGroup && o.parent === scene && Math.abs(o.position.y - 0.744) < 0.001 && Math.abs(o.rotation.y - 0.14) < 0.001 && o.children.some(c => c.isGroup && Math.abs(c.position.z + 0.035) < 0.001)) pcase = o;
      if (!o.isMesh) return; const gp = o.geometry && o.geometry.parameters, m = o.material;
      if (Math.abs(o.scale.x - 2.15) < 0.01 && Math.abs(o.rotation.y + Math.PI / 2) < 0.01) door = o;
      if (gp && gp.width === 2 && gp.height === 1.5 && m && m.isMeshBasicMaterial && m.map && m.fog === false) sky = m;
      if (gp && gp.width === 0.42 && gp.height === 0.42 && m && m.transparent) clock = o;
      // 벽 그림이 벽 상자와 거의 같은 자리에 있어 번갈아 그려지며 깜빡였다: 벽 그림이 벽 상자보다 항상 앞에 그려지게 한다 (창밖 그림은 그보다 더 앞)
      if (gp && gp.width >= 9 && gp.height >= 2.9 && Math.abs(o.rotation.x) < 0.01 && m && m.map && Math.abs(o.position.y - gp.height / 2) < 0.01) {
        m.polygonOffset = true; m.polygonOffsetFactor = -1; m.polygonOffsetUnits = -2; }
    });
    if (sky) { sky.polygonOffset = true; sky.polygonOffsetFactor = -3; sky.polygonOffsetUnits = -8; }
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
  // ---- 감독관: 뼈대째 실어 뼈를 돌려 움직인다 (자세 몇 장을 이어 붙이던 방식은 팔다리가 찌그러졌다) ----
  const D = { ok: false }, V = '?v=5';
  Promise.all([fetch('assets/gen/proctor-rig.json' + V).then(r => r.json()), fetch('assets/gen/proctor-rig.bin' + V).then(r => r.arrayBuffer())]).then(([meta, buf]) => {
    const n = meta.n, nj = meta.joints.length; let o = 0; const take = (bytes) => { const a = buf.slice(o, o + bytes); o += bytes; return a; };
    const p16 = new Int16Array(take(n * 6)), pos = new Float32Array(n * 3); for (let i = 0; i < n * 3; i++) pos[i] = p16[i] / meta.q;
    D.pos = pos; D.uv = new Float32Array(take(n * 8)); D.idx = new Uint16Array(take(meta.tris * 6));
    D.si = new Uint16Array(new Uint8Array(take(n * 4))); const w8 = new Uint8Array(take(n * 4)); D.sw = new Float32Array(n * 4); for (let i = 0; i < n * 4; i++) D.sw[i] = w8[i] / 255;
    D.rest = new Float32Array(take(nj * 28)); D.clip = {};
    for (const k of ['walk', 'idle']) D.clip[k] = Object.assign({ data: new Float32Array(take(meta.clips[k].frames * nj * 28)) }, meta.clips[k]);
    D.meta = meta; D.nj = nj; D.J = {}; meta.joints.forEach((nm, i) => { D.J[nm] = i; });
    const t = tex('assets/gen/proctor-rig.png' + V); t.flipY = false; D.tex = t; D.ok = true;
  }).catch(e => console.warn('proctor-gen', e));
  function material(snap) { // 게임의 다른 모델처럼 화면 격자에 정점을 맞춰 떨리게 (PSX 느낌)
    if (D.mat) return D.mat;
    const m = new THREE.MeshLambertMaterial({ map: D.tex, color: 0xe6e6e6, flatShading: true });
    m.onBeforeCompile = sh => { sh.uniforms.snapRes = { value: snap };
      sh.vertexShader = 'uniform vec2 snapRes;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n  gl_Position.xy = floor(gl_Position.xy / gl_Position.w * snapRes + 0.5) / snapRes * gl_Position.w;'); };
    m.customProgramCacheKey = () => 'psx-proctor-rig';
    return (D.mat = m);
  }
  function make(snap) {
    if (!D.geo) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(D.pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(D.uv, 2)); g.setIndex(new THREE.BufferAttribute(D.idx, 1));
      g.setAttribute('skinIndex', new THREE.BufferAttribute(D.si, 4)); g.setAttribute('skinWeight', new THREE.BufferAttribute(D.sw, 4)); g.computeVertexNormals(); D.geo = g; }
    const mesh = new THREE.SkinnedMesh(D.geo, material(snap)), bones = [], R = D.rest; mesh.frustumCulled = false;
    for (let j = 0; j < D.nj; j++) { const b = new THREE.Bone(), k = j * 7; b.quaternion.set(R[k], R[k + 1], R[k + 2], R[k + 3]); b.position.set(R[k + 4], R[k + 5], R[k + 6]); bones.push(b); }
    D.meta.parents.forEach((pj, j) => { if (pj < 0) mesh.add(bones[j]); else bones[pj].add(bones[j]); });
    mesh.updateMatrixWorld(true); mesh.bind(new THREE.Skeleton(bones));
    mesh.userData = { bones, blend: 0, last: 0, wt: 0, px: null, pz: 0 };
    return mesh;
  }
  const _a = new THREE.Quaternion(), _b = new THREE.Quaternion(), _c = new THREE.Quaternion(), _d = new THREE.Quaternion(), _y = new THREE.Quaternion(), _up = new THREE.Vector3(0, 1, 0), _v = new THREE.Vector3(), _w = new THREE.Vector3();
  function sample(c, time, j, q, v) { // 동작의 그 시각 뼈 j의 회전·위치 (프레임 사이는 구면 보간)
    const f = ((time / c.dur) % 1 + 1) % 1 * c.frames, i0 = Math.floor(f) % c.frames, i1 = (i0 + 1) % c.frames, k = f - Math.floor(f), A = c.data, a = (i0 * D.nj + j) * 7, b = (i1 * D.nj + j) * 7;
    _a.set(A[a], A[a + 1], A[a + 2], A[a + 3]); _b.set(A[b], A[b + 1], A[b + 2], A[b + 3]); q.slerpQuaternions(_a, _b, k);
    v.set(A[a + 4] + (A[b + 4] - A[a + 4]) * k, A[a + 5] + (A[b + 5] - A[a + 5]) * k, A[a + 6] + (A[b + 6] - A[a + 6]) * k);
  }
  function setPose(mesh, walkT, idleT, blend, headYaw) {
    const B = mesh.userData.bones, W = D.clip.walk, I = D.clip.idle;
    for (let j = 0; j < D.nj; j++) {
      if (blend <= 0.001) sample(I, idleT, j, B[j].quaternion, B[j].position);
      else if (blend >= 0.999) sample(W, walkT, j, B[j].quaternion, B[j].position);
      else { sample(I, idleT, j, _c, _v); sample(W, walkT, j, _d, _w); B[j].quaternion.slerpQuaternions(_c, _d, blend); B[j].position.lerpVectors(_v, _w, blend); }
    }
    if (Math.abs(headYaw) > 0.005) { // 고개: 목과 머리 뼈를 나눠 돌린다 (몸 기준 세로축)
      for (const [nm, share] of [['neck', 0.4], ['Head', 0.6]]) { const b = B[D.J[nm]]; if (!b) continue; b.parent.updateWorldMatrix(true, false); b.parent.getWorldQuaternion(_a); mesh.getWorldQuaternion(_b);
        _y.setFromAxisAngle(_up, headYaw * share); _c.copy(_a).invert().multiply(_b).multiply(_y).multiply(_b.invert()).multiply(_a); b.quaternion.premultiply(_c); }
    }
  }
  function restore(m) { if (m._genHid) { for (const o of m._genHid) o.visible = true; m._genHid = null; } if (m.gen2) m.gen2.visible = false; }
  window.PROCTOR_GEN = {
    data: D,
    // 게임이 감독관마다 매 프레임 부른다. true를 돌려주면 상자 몸은 숨기고 생성 모델을 세운다 (시야 부채꼴은 그대로 둔다)
    pose(m, o) {
      const p = o.p;
      mood(o.scene);
      if (!D.ok || m.robot || m.omega || m.type === 'omega' || o.frisk || o.hold || p.seated || p.sit > 0.01 || p.raise) { restore(m); return false; }
      if (!m.gen2) { m.gen2 = make(o.snap); o.scene.add(m.gen2); }
      const g = m.gen2, u = g.userData, shown = m.root.visible;
      if (g.parent !== o.scene) o.scene.add(g);
      if (!m._genHid) { m._genHid = []; m.root.traverse(x => { if (x.isMesh && x !== m.cone && x.visible) { let c = false; for (let y = x; y; y = y.parent) if (y === m.cone) c = true; if (!c) { x.visible = false; m._genHid.push(x); } } }); }
      g.visible = shown; if (!shown) return true;
      const dt = Math.min(0.1, Math.max(0, o.now - u.last)); u.last = o.now;
      // 걸음 빠르기: 실제로 움직인 속도에 맞추되 보통 걸음의 0.75~1.3배 안에서만 (감독관이 빨리 움직여도 다리가 갑자기 빨라지지 않게)
      const sp = u.px === null || dt <= 0 ? 0 : Math.hypot(p.x - u.px, p.z - u.pz) / dt; u.px = p.x; u.pz = p.z;
      u.rate = (u.rate || 1) + ((p.moving ? Math.min(1.3, Math.max(0.75, sp / 1.05)) : 1) - (u.rate || 1)) * Math.min(1, dt * 4);
      if (p.moving || u.blend > 0.01) u.wt += dt * u.rate;
      u.blend += ((p.moving ? 1 : 0) - u.blend) * Math.min(1, dt * 7);
      g.position.set(p.x, p.y || 0, p.z); g.rotation.y = m.yaw || 0; g.scale.setScalar(p.scale || 1);
      setPose(g, u.wt, o.now, u.blend, m.headYaw || 0);
      if (m.props) for (const pp of m.props) pp.visible = false; // 상자 모델이 들던 소품은 숨기고, 생성 모델 손에 서류판을 쥐여 준다
      if (ROOM && u.clip === undefined) { u.clip = gen('clip') || null; if (u.clip) { u.clip.scale.set(0.23, 0.31, 0.03); g.add(u.clip); } }
      if (u.clip) { const h = u.bones[D.J.RightHand]; g.updateMatrixWorld(true); _v.setFromMatrixPosition(h.matrixWorld); g.worldToLocal(_v); u.clip.position.set(_v.x - 0.02, _v.y - 0.14, _v.z + 0.03); u.clip.rotation.set(0.12, Math.PI / 2 - 0.25, 0); }
      return true;
    },
  };
})();
