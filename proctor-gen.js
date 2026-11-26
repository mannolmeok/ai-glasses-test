// 시험판: 감독관을 생성 모델(힉스필드 기준 그림 → Meshy 3D·뼈대·걷기)로 바꿔 보기. 주소에 ?proctor=gen 을 붙였을 때만 켜진다.
// 뼈대째 실어 뼈를 돌려 움직인다. 앉기·답안지 집기·입실 검사처럼 팔을 쓰는 동작은 아직 상자 모델로 돌아간다.
(() => {
  'use strict';
  const QS = new URLSearchParams(location.search), ROOM = QS.get('assets') === 'gen';
  if ((QS.get('proctor') !== 'gen' && !ROOM) || typeof THREE === 'undefined') return;
  // ?assets=gen: 시험장 전체(책상·학생·문·사물함)도 생성 모델로. world3d.js가 읽기 전에 모델 묶음을 먼저 싣는다
  if (ROOM && document.readyState === 'loading') document.write('<script src="assets/gen/room-gen.js?v=9"><\/script>');
  // 장면마다 한 번: 생성 모델 색 맞추기와 소품 놓기
  let CALM = false;
  function mood(scene, snap) {
    if (!ROOM) return;
    // 정점을 화면 격자에 맞추는 떨림(PSX 느낌)은 면이 몇 개뿐인 상자 모델에나 어울린다: 정점이 수천 개인 생성 모델은 카메라가 숨 쉬듯 흔들릴 때마다 겉이 통째로 들썩여 보였다. 격자를 아주 촘촘히 해서 사실상 끈다
    if (snap && !CALM) { CALM = true; snap.multiplyScalar(8); }
    if (scene.userData.moodB) return; scene.userData.moodB = 1;
    // 밝은 낮 교실: 게임의 낮 조명을 그대로 쓴다 (어두운 청록 분위기는 뺐다)
    decor(scene);
  }
  const b64 = b => { const t = atob(b), a = new Uint8Array(t.length); for (let i = 0; i < t.length; i++) a[i] = t.charCodeAt(i); return a.buffer; };
  const smooth = t => { t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = 4; if (t.image) t.needsUpdate = true; }; // 점 그대로 찍는 텍스처는 멀리서 볼 때 무늬가 자글자글 움직인다: 부드럽게 줄여 찍는다
  const tex = src => { const t = new THREE.Texture(), img = new Image(); smooth(t); img.onload = () => { t.image = img; t.needsUpdate = true; }; img.src = src; return t; };
  // 장면에 직접 손대는 것은 색 맞추기와 벽 깜빡임뿐이다. 소품(TV·칠판 틀·시계·필통)은 world3d.js가 직접 세운다
  const MESH = {}, DIM = 0xdcdcdc, GRIP = { along: 0.06, palm: 0.024 };
  function gen(name) { // window.MODELS의 모델 하나를 메시로 (같은 모델은 도형·재질을 함께 쓴다)
    const d = window.MODELS && window.MODELS[name]; if (!d) return null;
    if (!MESH[name]) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(b64(d.pos)), 3)); g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(b64(d.uv)), 2)); g.setIndex(new THREE.BufferAttribute(new Uint16Array(b64(d.idx)), 1)); g.computeBoundingBox();
      const t = tex(d.tex); t.flipY = true; MESH[name] = { g, m: new THREE.MeshLambertMaterial({ map: t, flatShading: true, color: 0xdcdcdc }) }; }
    return new THREE.Mesh(MESH[name].g, MESH[name].m);
  }
  function decor(scene) {
    const FXT = window.FX && window.FX.tex; let sky = null;
    scene.traverse(o => { // 생성 모델(게임이 세운 책상·학생·문·사물함)은 그림에 명암이 이미 있어서 조명을 그대로 받으면 색이 하얗게 뜬다: 받는 빛을 줄인다
      const m = o.isMesh && o.material; if (m && m.isMeshLambertMaterial && m.color.getHex() === 0xffffff && o.geometry && !o.geometry.parameters && o.geometry.index && o.geometry.attributes.uv && !m.userData.dim) { m.userData.dim = 1; m.color.setHex(DIM); if (m.map) smooth(m.map); }
    });
    const calmTex = () => scene.traverse(o => { const t = o.isMesh && o.material && o.material.map; if (t && !t.userData.calm && t.image && /assets\/gen\//.test(t.image.src || '')) { t.userData.calm = 1; smooth(t); } }); // 생성 벽·바닥 그림 (그림이 다 실린 뒤에 알아볼 수 있다)
    calmTex(); [300, 1200, 3000].forEach(ms => setTimeout(calmTex, ms));
    scene.traverse(o => {
      if (!o.isMesh) return; const gp = o.geometry && o.geometry.parameters, m = o.material;
      if (gp && gp.width === 2 && gp.height === 1.5 && m && m.isMeshBasicMaterial && m.map && m.fog === false) sky = m;
      // 벽 그림이 벽 상자와 거의 같은 자리에 있어 번갈아 그려지며 깜빡였다: 벽 그림이 벽 상자보다 항상 앞에 그려지게 한다 (창밖 그림은 그보다 더 앞)
      if (gp && gp.width >= 9 && gp.height >= 2.9 && Math.abs(o.rotation.x) < 0.01 && m && m.map && Math.abs(o.position.y - gp.height / 2) < 0.01) {
        m.polygonOffset = true; m.polygonOffsetFactor = -1; m.polygonOffsetUnits = -2; }
    });
    if (sky) { sky.polygonOffset = true; sky.polygonOffsetFactor = -3; sky.polygonOffsetUnits = -8; }
  }
  // ---- 감독관: 뼈대째 실어 뼈를 돌려 움직인다 (자세 몇 장을 이어 붙이던 방식은 팔다리가 찌그러졌다) ----
  const D = { ok: false }, V = '?v=6';
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
    // 서류판 쥐는 자리: 손뼈 기준으로 한 번만 계산한다. 팔 벌린 기본 자세에서 손끝 방향(아래팔→손)과 손바닥 방향(아래)을 손뼈 좌표로 옮겨, 판의 윗변이 손바닥 안에 오고 판이 손바닥과 나란히 늘어지게
    const hb = bones[D.J.RightHand], fb = bones[D.J.RightForeArm], hp = new THREE.Vector3().setFromMatrixPosition(hb.matrixWorld), ax = hp.clone().sub(new THREE.Vector3().setFromMatrixPosition(fb.matrixWorld)).normalize();
    const palm = new THREE.Vector3(0, -1, 0); palm.addScaledVector(ax, -palm.dot(ax)).normalize();
    const qi = hb.getWorldQuaternion(new THREE.Quaternion()).invert(); ax.applyQuaternion(qi); palm.applyQuaternion(qi);
    const Y = ax.clone().negate(), Z = palm.clone().negate(), X = new THREE.Vector3().crossVectors(Y, Z);
    const grip = { p: ax.clone().multiplyScalar(GRIP.along).addScaledVector(palm, GRIP.palm), q: new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, Z)) };
    mesh.userData = { bones, blend: 0, last: 0, wt: 0, px: null, pz: 0, grip };
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
  // ---- 필기구: 연필·샤프·볼펜을 각진 통으로 빚는다 (끝이 원점, 몸통이 +y) ----
  const PENS = [{ body: 0xe2b23a, tip: 0xd9b88a, lead: 0x2a2a2e, cap: 0xd98a8a, band: 0xb9bcc4 }, { body: 0x26262c, tip: 0xb9bcc4, lead: 0x8a8d94, cap: 0x26262c, band: 0xb9bcc4 }, { body: 0x2f4f9a, tip: 0x2f4f9a, lead: 0xd8d8de, cap: 0x1c2f66, band: 0x1c2f66 }], PM = {};
  const pm = c => PM[c] || (PM[c] = new THREE.MeshLambertMaterial({ color: c, flatShading: true }));
  function pen(kind, len) {
    const k = PENS[((kind | 0) % PENS.length + PENS.length) % PENS.length], g = new THREE.Group(), L = len || 0.15, r = 0.006;
    const part = (geo, c, y) => { const m = new THREE.Mesh(geo, pm(c)); m.position.y = y; g.add(m); return m; };
    part(new THREE.ConeGeometry(r * 0.35, 0.007, 6), k.lead, 0.0035).rotation.x = Math.PI;
    const cone = new THREE.CylinderGeometry(r, r * 0.35, 0.016, 6); part(cone, k.tip, 0.015);
    part(new THREE.CylinderGeometry(r, r, L - 0.045, 6), k.body, 0.023 + (L - 0.045) / 2); part(new THREE.CylinderGeometry(r * 1.05, r * 1.05, 0.008, 6), k.band, L - 0.018); part(new THREE.CylinderGeometry(r * 0.95, r * 0.95, 0.014, 6), k.cap, L - 0.007);
    return g;
  }
  // ---- 학생: 앉은 동작을 뼈대로 돌리고, 그 위에 시험 치는 자세(숙이기·팔 올리기)와 글씨 쓰기·고개 들기를 얹는다 ----
  const DESK_Y = 0.775, _hv = new THREE.Vector3(), PENPOSE = { along: 0.17, down: 0.035, off: 0, back: 0.55, up: 0.8, side: 0.25 }, SR = {}, STUS = [], AX = { x: new THREE.Vector3(1, 0, 0), y: new THREE.Vector3(0, 1, 0), z: new THREE.Vector3(0, 0, 1) };
  function loadRig(name) {
    const R = SR[name] = { ok: false };
    Promise.all([fetch('assets/gen/' + name + '-rig.json' + V).then(r => r.json()), fetch('assets/gen/' + name + '-rig.bin' + V).then(r => r.arrayBuffer())]).then(([meta, buf]) => {
      const n = meta.n, nj = meta.joints.length; let o = 0; const take = bytes => { const a = buf.slice(o, o + bytes); o += bytes; return a; };
      const p16 = new Int16Array(take(n * 6)), pos = new Float32Array(n * 3); for (let i = 0; i < n * 3; i++) pos[i] = p16[i] / meta.q;
      const uv = new Float32Array(take(n * 8)), idx = new Uint16Array(take(meta.tris * 6)), si = new Uint16Array(new Uint8Array(take(n * 4))), w8 = new Uint8Array(take(n * 4)), sw = new Float32Array(n * 4); for (let i = 0; i < n * 4; i++) sw[i] = w8[i] / 255;
      R.rest = new Float32Array(take(nj * 28)); R.clip = {};
      for (const k of Object.keys(meta.clips)) R.clip[k] = Object.assign({ data: new Float32Array(take(meta.clips[k].frames * nj * 28)) }, meta.clips[k]);
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(new THREE.BufferAttribute(idx, 1));
      g.setAttribute('skinIndex', new THREE.BufferAttribute(si, 4)); g.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4)); g.computeVertexNormals(); R.geo = g;
      const t = tex('assets/gen/' + name + '-rig.png' + V); t.flipY = false; R.mat = new THREE.MeshLambertMaterial({ map: t, color: DIM, flatShading: true });
      R.meta = meta; R.nj = nj; R.J = {}; meta.joints.forEach((nm, i) => { R.J[nm] = i; }); R.ok = true;
    }).catch(e => console.warn('proctor-gen', name, e));
  }
  if (ROOM) ['stu1', 'stu2', 'stu3'].forEach(loadRig);
  function skinned(R) {
    const mesh = new THREE.SkinnedMesh(R.geo, R.mat), bones = [], A = R.rest; mesh.frustumCulled = false;
    for (let j = 0; j < R.nj; j++) { const b = new THREE.Bone(), k = j * 7; b.quaternion.set(A[k], A[k + 1], A[k + 2], A[k + 3]); b.position.set(A[k + 4], A[k + 5], A[k + 6]); bones.push(b); }
    R.meta.parents.forEach((pj, j) => { if (pj < 0) mesh.add(bones[j]); else bones[pj].add(bones[j]); });
    mesh.updateMatrixWorld(true); mesh.bind(new THREE.Skeleton(bones));
    // 오른손에 필기구: 손뼈 기준으로 손끝 방향·손바닥 방향을 구해, 끝은 손끝 아래 종이 쪽에, 몸통은 손등 위로 비스듬히 기대게
    const hb = bones[R.J.RightHand], fb = bones[R.J.RightForeArm], hp = new THREE.Vector3().setFromMatrixPosition(hb.matrixWorld), ax = hp.clone().sub(new THREE.Vector3().setFromMatrixPosition(fb.matrixWorld)).normalize();
    const palm = new THREE.Vector3(0, -1, 0); palm.addScaledVector(ax, -palm.dot(ax)).normalize(); const qi = hb.getWorldQuaternion(new THREE.Quaternion()).invert(); ax.applyQuaternion(qi); palm.applyQuaternion(qi);
    const side = new THREE.Vector3().crossVectors(ax, palm), dir = ax.clone().multiplyScalar(-PENPOSE.back).addScaledVector(palm, -PENPOSE.up).addScaledVector(side, PENPOSE.side).normalize();
    const hold = { p: ax.clone().multiplyScalar(PENPOSE.along).addScaledVector(palm, PENPOSE.down).addScaledVector(side, PENPOSE.off), q: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir) };
    return { mesh, bones, hold, ax };
  }
  const _p = new THREE.Quaternion(), _r = new THREE.Quaternion(), _q1 = new THREE.Quaternion(), _q2 = new THREE.Quaternion();
  function turn(mesh, bone, axis, ang) { // 그 뼈와 아래 뼈들을 몸 기준 축으로 돌린다 (x +: 앞으로 숙이기)
    if (!bone || !ang) return; _p.identity(); for (let b = bone.parent; b && b !== mesh; b = b.parent) _p.premultiply(b.quaternion);
    _r.setFromAxisAngle(AX[axis], ang); bone.quaternion.premultiply(_q1.copy(_p).invert().multiply(_r).multiply(_p));
  }
  const smooth01 = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
  function tickStudents(scene, now) {
    for (let i = STUS.length - 1; i >= 0; i--) {
      const s = STUS[i]; if (s.g.parent !== scene) { if (!s.g.parent) STUS.splice(i, 1); continue; } if (!s.g.visible) continue;
      const R = s.R, B = s.bones, c = R.clip.sit, t = now + s.ph, f = (0.5 + Math.sin(t * 0.6) * 0.25) / c.dur * c.frames, // 앉은 동작의 앞부분만 조금씩 오간다 (동작 전체에는 책상에 엎드리다시피 숙이는 구간이 있다)
         i0 = Math.floor(f) % c.frames, i1 = (i0 + 1) % c.frames, k = f - Math.floor(f), A = c.data;
      for (let j = 0; j < R.nj; j++) { const a = (i0 * R.nj + j) * 7, b = (i1 * R.nj + j) * 7; _q1.set(A[a], A[a + 1], A[a + 2], A[a + 3]); _q2.set(A[b], A[b + 1], A[b + 2], A[b + 3]); B[j].quaternion.slerpQuaternions(_q1, _q2, k);
        B[j].position.set(A[a + 4] + (A[b + 4] - A[a + 4]) * k, A[a + 5] + (A[b + 5] - A[a + 5]) * k, A[a + 6] + (A[b + 6] - A[a + 6]) * k); }
      // 가끔 고개를 들어 생각하다가 다시 쓴다
      const u = t % s.per, lift = smooth01(s.per - 3.0, s.per - 2.3, u) * (1 - smooth01(s.per - 0.8, s.per - 0.1, u)), w = (1 - lift) * smooth01(-0.2, 0.3, Math.sin(t * 0.45 + s.ph * 3)), J = R.J, m = s.mesh;
      const scr = Math.sin(t * 11) * 0.03 * w + Math.sin(t * 2.3) * 0.02 * w; // 펜 끝이 오가는 흔들림
      turn(m, B[J.Spine01], 'x', s.lean - lift * 0.1 + Math.sin(t * 0.5) * 0.012); turn(m, B[J.Spine02], 'x', Math.sin(t * 1.5) * 0.012); // 숨 turn(m, B[J.neck], 'x', 0.32 - lift * 0.36); turn(m, B[J.Head], 'y', lift * s.look);
      turn(m, B[J.LeftArm], 'x', -0.75); turn(m, B[J.RightArm], 'x', -0.75 + scr * 0.3); turn(m, B[J.LeftForeArm], 'x', -0.4); turn(m, B[J.RightForeArm], 'x', -0.4);
      turn(m, B[J.LeftArm], 'y', 0.3); turn(m, B[J.RightArm], 'y', -0.08 + scr); turn(m, B[J.RightForeArm], 'y', scr * 0.8);
      // 손이 책상 위에 뜨거나 파묻히지 않게: 손목 높이를 재서 팔을 그만큼 내리거나 올린다 (모델마다 팔 길이가 달라서)
      if (s.fix === undefined || s.lift0 !== (lift > 0.01)) { s.lift0 = lift > 0.01; s.g.updateMatrixWorld(true); s.fix = [J.LeftHand, J.RightHand].map(j => Math.max(-0.35, Math.min(0.35, (_hv.setFromMatrixPosition(B[j].matrixWorld).y - s.g.position.y - DESK_Y) / 0.3)));
        s.wr = Math.asin(Math.max(-1, Math.min(1, _hv.copy(s.ax).transformDirection(B[J.RightHand].matrixWorld).y))) + 0.12; s.wr = Math.max(-0.1, Math.min(0.3, s.wr)); } // 손끝이 들려 있으면 손목을 그만큼 숙인다
      turn(m, B[J.LeftArm], 'x', s.fix[0]); turn(m, B[J.RightArm], 'x', s.fix[1]); turn(m, B[J.LeftHand], 'x', s.wr); turn(m, B[J.RightHand], 'x', s.wr);
    }
  }
  function student(name, x, y, z, yaw, scene) { // world3d.js가 자리마다 부른다. 뼈대 묶음이 아직 안 실렸으면 null (그때는 굳은 모델을 쓴다)
    const R = SR[name]; if (!R || !R.ok || !R.clip.sit) return null;
    const g = new THREE.Group(), sk = skinned(R), base = R.clip.sit.base, chair = gen('chair'), h = Math.abs(Math.sin(x * 12.9898 + z * 78.233) * 43758.5453) % 1;
    sk.mesh.position.set(-base[0], -base[1], -base[2]); g.add(sk.mesh);
    const pn = pen(Math.floor(h * 97) % 3, 0.14 + (h * 5 % 1) * 0.02); pn.position.copy(sk.hold.p); pn.quaternion.copy(sk.hold.q); sk.bones[R.J.RightHand].add(pn); if (chair) { chair.position.set(0, 0, -0.05); g.add(chair); }
    g.position.set(x, y, z); g.rotation.y = Math.PI + yaw; scene.add(g);
    STUS.push({ g, R, mesh: sk.mesh, bones: sk.bones, ax: sk.ax, ph: h * 40, per: 9 + h * 9, lean: 0.24 + (h * 7 % 1) * 0.1, look: ((h * 13 % 1) - 0.5) * 0.5 });
    return g;
  }
  window.PROCTOR_GEN = {
    student, pen, _stus: STUS, PENPOSE,
    data: D,
    // 게임이 감독관마다 매 프레임 부른다. true를 돌려주면 상자 몸은 숨기고 생성 모델을 세운다 (시야 부채꼴은 그대로 둔다)
    pose(m, o) {
      const p = o.p;
      mood(o.scene, o.snap); tickStudents(o.scene, o.now);
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
      if (ROOM && u.clip === undefined) { u.clip = gen('clip') || null; if (u.clip) { u.clip.scale.set(0.23, 0.31, 0.03); u.clip.position.copy(u.grip.p); u.clip.quaternion.copy(u.grip.q); u.bones[D.J.RightHand].add(u.clip); } } // 서류판은 손뼈에 붙여 손이 도는 대로 같이 돈다
      return true;
    },
  };
})();
