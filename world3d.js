// PROTOTYPE - NOT FOR PRODUCTION
// Question: 감독관 눈치를 보며 AI 안경으로 스캔하는 긴장감이, 장비와 시험이 함께 커지는 성장과 맞물려 엔딩까지 재밌나?
// Date: 2026-11-17
// 3D 세계: PSX풍 저해상도(640x360) 1인칭. 시험장(교실형·마주 앉는 방·고시원 노트북·허공), 감독관 여러 종, 수험생, 내 손과 시험지,
// CCTV·탐지 전파·드론·촛불·와인잔·Ω 같은 시험 장치, 허브인 고시원 방(노트북·일정표·폰으로 다가가는 카메라, 택배 상자),
// figures 줄 세우기. 그리기만 하고 규칙은 game.js가 정한다. 색은 줄이고 디더링하며, 정점은 화면 격자에 붙여 PSX처럼 떨리게 한다.
'use strict';

const WORLD = (() => {
  const LOOK_PIXEL = (new URLSearchParams(location.search).get('look') || CONFIG.look) === 'pixel'; // 3D는 그대로, 화면만 2D 픽셀 그림처럼
  const RW = LOOK_PIXEL ? 426 : 640, RH = LOOK_PIXEL ? 240 : 360; // 픽셀 그림 모드는 점을 더 크게
  const W = { ok: false, RW, RH };
  if (typeof THREE === 'undefined') return Object.assign(W, { init() { }, renderExam() { }, renderHub() { }, renderTitle() { }, renderFigures() { }, renderEnding() { }, renderTableau() { }, pickChoice: () => -1, pickHub: () => null, hubLabels: () => [], figureLabels: () => [], hubRect: () => null, hubUV: () => null, laptopCanvas: () => document.createElement('canvas') });

  let renderer = null, rt = null, post = null, postCam = null, postMat = null;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, k) => a + (b - a) * k;
  const ease = k => k * k * (3 - 2 * k);
  const angTo = (a, b, k) => { const d = ((b - a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; return a + d * k; };
  const FONT = FONT_BODY; // 시험지·칠판 글자는 HUD 글꼴을 따라가지 않는다

  // ---------- 렌더러: 640x360 + 비네트·잡티·디더링 ----------
  function init(canvas) {
    try {
      THREE.ColorManagement.enabled = false;
      renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
      renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
      renderer.setPixelRatio(1); renderer.setSize(RW, RH, false);
      rt = new THREE.WebGLRenderTarget(RW, RH, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
      rt.depthTexture = new THREE.DepthTexture(RW, RH); // 픽셀 그림 모드의 외곽선용
      post = new THREE.Scene(); postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      postMat = new THREE.ShaderMaterial({
        uniforms: { tex: { value: rt.texture }, dep: { value: rt.depthTexture }, res: { value: new THREE.Vector2(RW, RH) }, time: { value: 0 }, vig: { value: 1 }, pix: { value: LOOK_PIXEL ? 1 : 0 }, nf: { value: new THREE.Vector2(0.05, 30) } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
        fragmentShader: `uniform sampler2D tex; uniform sampler2D dep; uniform vec2 res; uniform vec2 nf; uniform float time; uniform float vig; uniform float pix; varying vec2 vUv;
          const int PN = 36;
          float lin(vec2 uv){ float d = texture2D(dep, uv).x * 2.0 - 1.0; return 2.0 * nf.x * nf.y / (nf.y + nf.x - d * (nf.y - nf.x)); }
          vec3 nearestPal(vec3 c){ vec3 P[PN]; P[0]=vec3(0.090,0.082,0.110); P[1]=vec3(0.114,0.106,0.137); P[2]=vec3(0.141,0.133,0.169); P[3]=vec3(0.169,0.165,0.200); P[4]=vec3(0.204,0.192,0.235); P[5]=vec3(0.243,0.239,0.278); P[6]=vec3(0.298,0.290,0.337); P[7]=vec3(0.361,0.349,0.400); P[8]=vec3(0.435,0.420,0.471); P[9]=vec3(0.518,0.498,0.545); P[10]=vec3(0.608,0.584,0.631); P[11]=vec3(0.706,0.678,0.722); P[12]=vec3(0.812,0.784,0.820); P[13]=vec3(0.902,0.875,0.847); P[14]=vec3(0.957,0.933,0.902); P[15]=vec3(0.180,0.122,0.137); P[16]=vec3(0.329,0.086,0.141); P[17]=vec3(0.478,0.122,0.180); P[18]=vec3(0.659,0.188,0.247); P[19]=vec3(0.227,0.173,0.173); P[20]=vec3(0.310,0.239,0.227); P[21]=vec3(0.400,0.314,0.282); P[22]=vec3(0.502,0.400,0.353); P[23]=vec3(0.604,0.502,0.439); P[24]=vec3(0.490,0.373,0.376); P[25]=vec3(0.659,0.522,0.498); P[26]=vec3(0.788,0.655,0.612); P[27]=vec3(0.149,0.188,0.184); P[28]=vec3(0.200,0.259,0.239); P[29]=vec3(0.267,0.341,0.310); P[30]=vec3(0.145,0.165,0.239); P[31]=vec3(0.204,0.235,0.337); P[32]=vec3(0.286,0.329,0.478); P[33]=vec3(0.165,0.435,0.478); P[34]=vec3(0.247,0.722,0.769); P[35]=vec3(0.549,0.478,0.227);
            vec3 best = P[0]; float bd = 9.0; for (int i = 0; i < PN; i++) { vec3 d = (c - P[i]) * vec3(0.9, 1.1, 0.8); float e = dot(d, d); if (e < bd) { bd = e; best = P[i]; } } return best; }
          float b2(vec2 p){ return mod(2.0 * p.x + 3.0 * p.y, 4.0); }
          float bayer4(vec2 p){ vec2 q = mod(p, 4.0); return (4.0 * b2(mod(q, 2.0)) + b2(floor(q / 2.0))) / 16.0; }
          void main(){
            vec2 px = floor(vUv * res);
            vec3 c = texture2D(tex, (px + 0.5) / res).rgb;
            if (pix > 0.5) { // 2D 픽셀 그림처럼: 밝고 따뜻하게, 정해진 색으로만, 물체 가장자리에 먹선
              vec2 uv = (px + 0.5) / res, e = 1.0 / res;
              float d0 = lin(uv), dm = max(max(abs(lin(uv + vec2(e.x, 0.0)) - d0), abs(lin(uv - vec2(e.x, 0.0)) - d0)), max(abs(lin(uv + vec2(0.0, e.y)) - d0), abs(lin(uv - vec2(0.0, e.y)) - d0)));
              float edge = smoothstep(0.035, 0.09, dm / max(d0, 0.2));
              c = pow(c, vec3(1.12)) * 0.8;
              float l = dot(c, vec3(0.3, 0.59, 0.11)); c = mix(vec3(l), c, 0.42) * vec3(0.97, 0.94, 1.06) + vec3(0.012, 0.008, 0.02);
              c += (bayer4(px) - 0.5) * 0.035;
              c = nearestPal(clamp(c, 0.0, 1.0));
              c = mix(c, vec3(0.09, 0.08, 0.11), edge * 0.3);
              float v2 = smoothstep(1.0, 0.35, length((vUv - 0.5) * vec2(1.25, 1.0))); c = mix(vec3(0.09, 0.083, 0.11), c, mix(0.3, 1.0, v2));
              gl_FragColor = vec4(c, 1.0); return;
            }
            float v = smoothstep(0.95, 0.25, length((vUv - 0.5) * vec2(1.25, 1.0)));
            c *= mix(1.0 - 0.5 * vig, 1.0, v);
            float n = fract(sin(dot(px + floor(time * 12.0) * 7.0, vec2(12.9898, 78.233))) * 43758.5453);
            c += (n - 0.5) * 0.035;
            c = floor(c * 22.0 + bayer4(px)) / 22.0;
            gl_FragColor = vec4(c, 1.0);
          }`,
        depthTest: false, depthWrite: false,
      });
      post.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMat));
      W.ok = true;
    } catch (e) { W.ok = false; W.error = String(e && e.message || e); }
  }
  function draw(scene, cam, now, vig = 1) {
    if (!W.ok) return;
    postMat.uniforms.time.value = now; postMat.uniforms.vig.value = vig; postMat.uniforms.nf.value.set(cam.near, cam.far);
    renderer.setRenderTarget(rt); renderer.render(scene, cam);
    renderer.setRenderTarget(null); renderer.render(post, postCam);
  }

  // ---------- 재질·상자·한 덩어리 묶음 ----------
  const SNAP = new THREE.Vector2(RW / 2, RH / 2);
  function psx(m) {
    m.onBeforeCompile = sh => {
      sh.uniforms.snapRes = { value: SNAP };
      sh.vertexShader = 'uniform vec2 snapRes;\n' + sh.vertexShader.replace('#include <project_vertex>',
        '#include <project_vertex>\n  gl_Position.xy = floor(gl_Position.xy / gl_Position.w * snapRes + 0.5) / snapRes * gl_Position.w;');
    };
    m.customProgramCacheKey = () => 'psx';
    return m;
  }
  const PXD = LOOK_PIXEL && window.PX ? window.PX : null, PXT = {};
  function pxTex(src, rx = 1, ry = 1) { // data URL 그림을 점 그대로 보이는 텍스처로
    const key = src.length + ':' + src.slice(-24) + rx + ',' + ry; if (PXT[key]) return PXT[key];
    const t = new THREE.Texture(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
    const img = new Image(); img.onload = () => { t.image = img; t.needsUpdate = true; }; img.src = src; return (PXT[key] = t);
  }
  const PXGEO = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0), PXMAT = {}; let PXDESK = null;
  function pxSprite(name, height) { // 발이 바닥에 닿는 세워 둔 그림 한 장
    const d = PXD.sprites[name]; if (!PXMAT[name]) PXMAT[name] = new THREE.MeshBasicMaterial({ map: pxTex(d.src), alphaTest: 0.5, side: THREE.DoubleSide, color: 0xe4e0dc });
    const m = new THREE.Mesh(PXGEO, PXMAT[name]); m.scale.set(height * d.w / d.h, height, 1); m.userData.w = height * d.w / d.h; return m;
  }
  function psxDetail(m) { // 모든 면에 손그림 결을 곱한다 (세계 좌표 기준이라 UV가 없어도 된다)
    const tex = pxTex(PXD.tex.detail);
    m.onBeforeCompile = sh => {
      sh.uniforms.snapRes = { value: SNAP }; sh.uniforms.detailMap = { value: tex };
      sh.vertexShader = 'uniform vec2 snapRes; varying vec3 vWp; varying vec3 vWn;\n' + sh.vertexShader.replace('#include <project_vertex>',
        '#include <project_vertex>\n  vWp = (modelMatrix * vec4(transformed, 1.0)).xyz; vWn = normal;\n  gl_Position.xy = floor(gl_Position.xy / gl_Position.w * snapRes + 0.5) / snapRes * gl_Position.w;');
      sh.fragmentShader = 'uniform sampler2D detailMap; varying vec3 vWp; varying vec3 vWn;\n' + sh.fragmentShader.replace('#include <color_fragment>',
        '#include <color_fragment>\n  { vec3 an = abs(vWn); vec2 tuv = an.y > 0.5 ? vWp.xz : an.x > 0.5 ? vWp.zy : vWp.xy; diffuseColor.rgb *= texture2D(detailMap, tuv * 0.45).rgb * 1.2; }');
    };
    m.customProgramCacheKey = () => 'psxd';
    return m;
  }
  const GEN_ROOM = (new URLSearchParams(location.search).get('assets') || CONFIG.room_assets) === 'gen' && window.MODELS && window.MODELS.desk; // 시험장을 생성 모델로
  const DESK_YAW = 0, STU_YAW = { stu1: Math.PI + 0.878, stu2: Math.PI + 0.95, stu3: Math.PI + 0.9 }, PROCTOR_YAW = 0; // 모델이 비스듬히 만들어져서 Blender 위에서 본 각도로 맞췄다 // 생성 모델이 바라보는 방향 보정
  const MODEL_CACHE = {};
  function modelInst(name) { // 같은 모델을 여러 번 세울 때 도형과 재질을 함께 쓴다
    if (!(name in MODEL_CACHE)) MODEL_CACHE[name] = modelMesh(name);
    const b = MODEL_CACHE[name]; return b ? new THREE.Mesh(b.geometry, b.material) : null;
  }
  function animMesh(name) { // 구워 둔 정점 애니메이션(걷기): 프레임 사이를 이어 붙여 움직인다
    const d = window.MODELS && window.MODELS[name]; if (!d) return null;
    const bin = b64 => { const s2 = atob(b64), a = new Uint8Array(s2.length); for (let i = 0; i < s2.length; i++) a[i] = s2.charCodeAt(i); return a.buffer; };
    if (!d._pos) { d._pos = new Int16Array(bin(d.pos)); d._uv = new Float32Array(bin(d.uv)); d._idx = new Uint16Array(bin(d.idx)); d._mat = psx(new THREE.MeshLambertMaterial({ color: 0xffffff }));
      const img = new Image(); img.onload = () => { const t = new THREE.Texture(img); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true; d._mat.map = t; d._mat.needsUpdate = true; }; img.src = d.tex; }
    const g = new THREE.BufferGeometry(), pos = new Float32Array(d.n * 3), attr = new THREE.BufferAttribute(pos, 3);
    g.setAttribute('position', attr); g.setAttribute('uv', new THREE.BufferAttribute(d._uv, 2)); g.setIndex(new THREE.BufferAttribute(d._idx, 1));
    const mesh = new THREE.Mesh(g, d._mat), n3 = d.n * 3; mesh.frustumCulled = false;
    mesh.userData.pose = (t, moving) => {
      const f = moving ? (t / d.dur * d.frames) % d.frames : d.stand, i0 = Math.floor(f) % d.frames, i1 = (i0 + 1) % d.frames, k = moving ? f - Math.floor(f) : 0, a = i0 * n3, b = i1 * n3, P = d._pos, q = 1 / d.q;
      if (mesh.userData.key === i0 + ':' + k.toFixed(2)) return; mesh.userData.key = i0 + ':' + k.toFixed(2);
      for (let i = 0; i < n3; i++) pos[i] = (P[a + i] + (P[b + i] - P[a + i]) * k) * q;
      attr.needsUpdate = true; if (!mesh.userData.nrm) { g.computeVertexNormals(); mesh.userData.nrm = 1; }
    };
    mesh.userData.pose(0, false);
    return mesh;
  }
  const MATS = new Map();
  function mat(color) { if (!MATS.has(color)) MATS.set(color, psx(new THREE.MeshLambertMaterial({ color, flatShading: true }))); return MATS.get(color); }
  function ownMat(color, extra) { return psx(new THREE.MeshLambertMaterial(Object.assign({ color, flatShading: true }, extra || {}))); }
  const glowMat = color => new THREE.MeshBasicMaterial({ color, fog: false });
  const UNIT = new THREE.BoxGeometry(1, 1, 1), UNI = UNIT.clone().toNonIndexed();
  function bx(parent, w, h, d, color, x, y, z, m) { const o = new THREE.Mesh(UNIT, m || mat(color)); o.scale.set(w, h, d); o.position.set(x, y, z); parent.add(o); return o; }
  function pivot(parent, x, y, z) { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; }
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _v = new THREE.Vector3();
  function batch() {
    const P = [], N = [], C = [];
    return {
      box(w, h, d, color, x, y, z, rx = 0, ry = 0, rz = 0) {
        _e.set(rx, ry, rz); _q.setFromEuler(_e); _m.compose(_v.set(x, y, z), _q, _s.set(w, h, d));
        const g = UNI.clone().applyMatrix4(_m), c = new THREE.Color(color), p = g.attributes.position.array, n = g.attributes.normal.array;
        for (let i = 0; i < p.length; i++) { P.push(p[i]); N.push(n[i]); }
        for (let i = 0; i < p.length / 3; i++) C.push(c.r, c.g, c.b);
        g.dispose();
      },
      mesh() {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
        g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
        g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
        return new THREE.Mesh(g, (PXD ? psxDetail : psx)(new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true })));
      },
    };
  }
  function canvasTex(w, h, smooth) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const t = new THREE.CanvasTexture(c);
    t.magFilter = smooth ? THREE.LinearFilter : THREE.NearestFilter;
    t.minFilter = smooth ? THREE.LinearMipmapLinearFilter : THREE.NearestFilter;
    t.generateMipmaps = !!smooth; if (smooth) t.anisotropy = 4;
    return { c, g: c.getContext('2d'), t };
  }
  function plane(parent, w, h, material, x, y, z, rx = 0, ry = 0) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material); m.position.set(x, y, z); m.rotation.set(rx, ry, 0); parent.add(m); return m; }
  function seeded(n) { let s = n * 9301 + 49297; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; }
  function disposeScene(sc) {
    if (!sc) return;
    sc.traverse(o => {
      if (o.geometry && o.geometry !== UNIT) o.geometry.dispose();
      const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
      for (const m of ms) { if ([...MATS.values()].includes(m)) continue; if (m.map) m.map.dispose(); m.dispose(); }
    });
  }

  // ---------- 감독관 ----------
  const SKIN = 0xdcae88;
  const STAFF_LOOK = {
    homeroom: { top: 0xd9705f, sleeve: 0xc8604f, leg: 0x2f3b62, skirt: true, shirt: 0xf6efe4, hair: 'bun', hairC: 0x3a2418, prop: 'book' },
    dean: { top: 0x33405f, sleeve: 0x2b3650, leg: 0x2a3350, shirt: 0xf3f3ee, tie: 0xb8362e, hair: 'bald', hairC: 0x33261f, glasses: 'metal', prop: 'clipboard' },
    suneung: { top: 0x7d8796, sleeve: 0xeeeeea, leg: 0x3b3f4a, shirt: 0xf1f1ec, hair: 'spiky', hairC: 0x1d1a22, prop: 'wand', badge: true },
    agent: { top: 0x1f2129, sleeve: 0x1b1d24, leg: 0x15161c, shirt: 0xf4f4f0, tie: 0x111216, hair: 'buzz', hairC: 0x2a2420, glasses: 'sun', prop: 'cross', ear: true },
    ta: { top: 0x5a6a8a, sleeve: 0x55657f, leg: 0x2a2f3a, shirt: 0x5a6a8a, hair: 'spiky', hairC: 0x221c1a, prop: 'clipboard', hood: true },
    prof: { top: 0x7a5a3a, sleeve: 0x6a4a2e, leg: 0x3a332c, shirt: 0xeee8da, tie: 0x2a4a3a, hair: 'bald', hairC: 0xb8b4ac, glasses: 'metal', prop: 'book' },
    teacher: { top: 0x3f7a5a, sleeve: 0x3a7052, leg: 0x3a4a62, shirt: 0xf0ece0, hair: 'bun', hairC: 0x7a4a2a, prop: 'mug', skin: 0xe8c4a0 },
    cnproctor: { top: 0xf2f2ee, sleeve: 0xe8e8e4, leg: 0x23262e, shirt: 0xf2f2ee, hair: 'buzz', hairC: 0x15131a, prop: 'wand', armband: 0xc0282a },
    don: { top: 0x15141a, sleeve: 0x1a1920, leg: 0x15141a, shirt: 0xf4f4f0, tie: 0xe8e8e4, robe: true, hair: 'bald', hairC: 0xd8d6d0, glasses: 'metal', skin: 0xe8c8b0 },
    don2: { top: 0x15141a, sleeve: 0x1a1920, leg: 0x15141a, shirt: 0xf4f4f0, robe: true, hair: 'bun', hairC: 0x8a6a4a, skin: 0xead0b8 },
    judge: { top: 0x1a1a1e, sleeve: 0x16161a, leg: 0x1a1a1e, shirt: 0xf4f4f0, tie: 0x7a1a2a, hair: 'buzz', hairC: 0x2a2420, prop: 'tastevin' },
    banker: { top: 0x1c2238, sleeve: 0x181d30, leg: 0x1c2238, shirt: 0xf4f4f0, tie: 0x2a4a8a, hair: 'buzz', hairC: 0x3a3028, glasses: 'metal' },
    alien: { top: 0xa8b4c8, sleeve: 0x98a4b8, leg: 0x6a7488, shirt: 0xa8b4c8, hair: 'none', skin: 0x7ad06a, eyes3: true, antenna: true },
    reaper: { top: 0x101014, sleeve: 0x0c0c10, leg: 0x101014, shirt: 0x101014, robe: true, hair: 'none', skin: 0xd8d4cc, hat: 'gat' },
    yeomra: { top: 0x9a1a1a, sleeve: 0x8a1616, leg: 0x9a1a1a, shirt: 0xd8b04a, robe: true, hair: 'none', skin: 0xc89a7a, hat: 'crown', beard: 0x15131a, big: 1.25 },
  };
  function gazeCone() { // 시선 예측 장비가 그리는 시선: 머리에서 앞으로 퍼지는 반투명 원뿔
    const g = new THREE.ConeGeometry(0.25, 1, 14, 1, true); g.translate(0, -0.5, 0); g.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.08, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false }));
    m.visible = false; return m;
  }
  function makeHuman(o) {
    const root = new THREE.Group(), body = pivot(root, 0, 0, 0), legs = [], arms = [], props = [], skin = o.skin || SKIN;
    if (o.big) body.scale.setScalar(o.big);
    for (const s of [-1, 1]) {
      const p = pivot(body, s * 0.08, 0.84, 0);
      if (o.skirt) bx(p, 0.09, 0.6, 0.1, 0xc9a07e, 0, -0.52, 0); else if (!o.robe) bx(p, 0.12, 0.82, 0.14, o.leg, 0, -0.41, 0);
      bx(p, 0.13, 0.06, 0.22, 0x1b1b20, 0, -0.81, 0.04); legs.push(p);
    }
    if (o.skirt) bx(body, 0.36, 0.34, 0.26, o.leg, 0, 0.74, 0);
    if (o.robe) bx(body, 0.44, 0.84, 0.3, o.top, 0, 0.44, 0);
    bx(body, 0.4, 0.6, 0.22, o.top, 0, 1.12, 0);
    bx(body, 0.12, 0.34, 0.012, o.shirt, 0, 1.27, 0.112);
    if (o.tie) bx(body, 0.04, 0.26, 0.012, o.tie, 0, 1.25, 0.12);
    if (o.hood) bx(body, 0.3, 0.12, 0.1, o.top, 0, 1.42, -0.12);
    if (o.badge) { bx(body, 0.1, 0.12, 0.012, 0xffffff, 0.1, 1.12, 0.118); bx(body, 0.1, 0.03, 0.013, 0x3b6fd6, 0.1, 1.15, 0.12); }
    else if (!o.robe && !o.antenna) { bx(body, 0.08, 0.1, 0.012, 0xffffff, 0.11, 1.14, 0.118); bx(body, 0.08, 0.025, 0.013, 0x3b6fd6, 0.11, 1.16, 0.12); } // 감독관 명찰
    if (o.prop === 'tastevin') { bx(body, 0.07, 0.012, 0.07, 0xd8dce4, 0, 1.05, 0.125); bx(body, 0.01, 0.2, 0.01, 0xd8dce4, 0, 1.18, 0.12); }
    for (const s of [-1, 1]) {
      const p = pivot(body, s * 0.25, 1.38, 0);
      bx(p, 0.09, 0.56, 0.11, o.sleeve, 0, -0.28, 0); bx(p, 0.08, 0.1, 0.09, skin, 0, -0.6, 0);
      if (s < 0 && o.armband) bx(p, 0.1, 0.08, 0.12, o.armband, 0, -0.14, 0);
      if (s > 0 && o.prop === 'wand') { bx(p, 0.035, 0.32, 0.035, 0x1d1d22, 0, -0.68, 0.1); bx(p, 0.06, 0.08, 0.05, 0xe7c13a, 0, -0.84, 0.12); }
      if (s > 0 && o.prop === 'clipboard') { bx(p, 0.2, 0.26, 0.015, 0x8a5a32, 0, -0.62, 0.08); bx(p, 0.17, 0.2, 0.004, 0xf4f1e6, 0, -0.63, 0.09); }
      if (s > 0 && o.prop === 'mug') { bx(p, 0.07, 0.09, 0.07, 0xf4f4f0, 0, -0.66, 0.06); bx(p, 0.02, 0.05, 0.03, 0xf4f4f0, 0.045, -0.66, 0.06); }
      if (s < 0 && o.prop === 'book') props.push(bx(p, 0.16, 0.22, 0.03, 0xf4efe2, 0, -0.62, 0.08), bx(p, 0.02, 0.22, 0.035, 0xc45f54, 0, -0.62, 0.08));
      arms.push(p);
    }
    bx(body, 0.08, 0.06, 0.08, skin, 0, 1.45, 0);
    const head = pivot(body, 0, 1.6, 0);
    bx(head, 0.2, 0.24, 0.21, skin, 0, 0, 0);
    const H = o.hairC;
    if (o.hair === 'bald') { bx(head, 0.03, 0.08, 0.15, H, -0.105, 0.0, -0.02); bx(head, 0.03, 0.08, 0.15, H, 0.105, 0.0, -0.02); bx(head, 0.21, 0.08, 0.05, H, 0, -0.02, -0.09); }
    else if (o.hair === 'buzz') { bx(head, 0.21, 0.04, 0.22, H, 0, 0.12, 0); bx(head, 0.21, 0.14, 0.04, H, 0, 0.05, -0.095); }
    else if (o.hair !== 'none') {
      bx(head, 0.21, 0.07, 0.22, H, 0, 0.12, -0.005); bx(head, 0.21, 0.2, 0.05, H, 0, 0.02, -0.09);
      bx(head, 0.03, 0.12, 0.17, H, -0.105, 0.04, -0.02); bx(head, 0.03, 0.12, 0.17, H, 0.105, 0.04, -0.02);
      if (o.hair === 'bun') bx(head, 0.1, 0.1, 0.08, H, 0, 0.08, -0.15);
      if (o.hair === 'spiky') for (const sx of [-0.06, 0, 0.06]) bx(head, 0.05, 0.07, 0.07, H, sx, 0.17, 0.02);
    }
    const eyeC = o.eyeC || 0x15151a;
    for (const s of [-1, 1]) { bx(head, 0.035, 0.022, 0.01, eyeC, s * 0.048, 0.02, 0.108); if (o.hair !== 'none') bx(head, 0.05, 0.01, 0.01, H, s * 0.048, 0.055, 0.108); }
    if (o.eyes3) { bx(head, 0.04, 0.03, 0.01, 0x15151a, 0, 0.075, 0.108); bx(head, 0.02, 0.012, 0.012, 0xffffff, 0.006, 0.08, 0.11); }
    if (o.antenna) for (const s of [-1, 1]) { bx(head, 0.012, 0.14, 0.012, 0x4a7a3a, s * 0.06, 0.18, 0); bx(head, 0.035, 0.035, 0.035, 0xff5a8a, s * 0.06, 0.26, 0, glowMat(0xff6a9a)); }
    if (o.glasses === 'metal') { for (const s of [-1, 1]) { bx(head, 0.06, 0.008, 0.006, 0x8a8f99, s * 0.048, 0.04, 0.114); bx(head, 0.06, 0.006, 0.006, 0x8a8f99, s * 0.048, 0.0, 0.114); } bx(head, 0.03, 0.006, 0.006, 0x8a8f99, 0, 0.03, 0.114); }
    if (o.glasses === 'sun') { bx(head, 0.17, 0.045, 0.01, 0x15161c, 0, 0.02, 0.112); }
    if (o.ear) bx(head, 0.02, 0.03, 0.02, 0xe8e8e8, 0.108, -0.01, 0.0);
    if (o.hat === 'gat') { bx(head, 0.44, 0.012, 0.44, 0x0c0c10, 0, 0.13, 0); bx(head, 0.17, 0.15, 0.17, 0x0c0c10, 0, 0.21, 0); bx(head, 0.004, 0.2, 0.004, 0x3a3a40, 0.1, 0.02, 0.1); }
    if (o.hat === 'crown') { bx(head, 0.24, 0.12, 0.22, 0x15131a, 0, 0.17, 0); bx(head, 0.34, 0.02, 0.26, 0x15131a, 0, 0.24, 0); for (const sx of [-0.14, -0.07, 0, 0.07, 0.14]) bx(head, 0.012, 0.09, 0.012, 0xd8b04a, sx, 0.19, 0.13); }
    if (o.beard) bx(head, 0.16, 0.12, 0.06, o.beard, 0, -0.14, 0.08);
    else bx(head, 0.05, 0.012, 0.01, 0x9a5a4a, 0, -0.07, 0.108);
    const cone = gazeCone(); cone.position.set(0, 0.02, 0.11); head.add(cone);
    return { root, body, legs, arms, props, head, cone, look: o, yaw: Math.PI, headYaw: 0, headPitch: 0, last: 0 };
  }
  function makeRobot() {
    const root = new THREE.Group(), M = 0x9aa3b8, M2 = 0x6c7590;
    const glow = glowMat(0xff3048);
    const base = pivot(root, 0, 0.18, 0);
    bx(base, 0.36, 0.1, 0.36, M2, 0, 0, 0); bx(base, 0.26, 0.03, 0.26, 0, 0, -0.06, 0, glow);
    const body = pivot(root, 0, 0, 0);
    bx(body, 0.46, 0.62, 0.3, M, 0, 0.62, 0); bx(body, 0.44, 0.06, 0.28, 0xc9d0e0, 0, 0.9, 0);
    bx(body, 0.16, 0.12, 0.02, 0x1a2133, 0, 0.7, 0.155); bx(body, 0.1, 0.03, 0.022, 0, 0, 0.7, 0.16, glow);
    const arms = [];
    for (const s of [-1, 1]) { const p = pivot(body, s * 0.3, 0.88, 0); bx(p, 0.1, 0.5, 0.12, M2, 0, -0.25, 0); bx(p, 0.12, 0.08, 0.12, M, 0, -0.52, 0); arms.push(p); }
    bx(body, 0.1, 0.08, 0.1, M2, 0, 0.98, 0);
    const head = pivot(body, 0, 1.12, 0);
    bx(head, 0.32, 0.24, 0.28, M, 0, 0, 0); bx(head, 0.3, 0.04, 0.26, 0xc9d0e0, 0, 0.12, 0);
    const visorMat = glowMat(0x7a1f2c);
    bx(head, 0.26, 0.07, 0.02, 0, 0, 0.0, 0.145, visorMat);
    bx(head, 0.02, 0.16, 0.02, M2, 0.08, 0.2, 0); bx(head, 0.04, 0.04, 0.04, 0, 0.08, 0.29, 0, glow);
    const cone = gazeCone(); cone.position.set(0, 0, 0.15); head.add(cone);
    return { root, body, legs: [], arms, head, cone, robot: true, visorMat, yaw: Math.PI, headYaw: 0, headPitch: 0, last: 0 };
  }
  function makeOmega() { // 인류의 마지막 시험의 감독관: 떠 있는 거대한 눈
    const root = new THREE.Group(), head = pivot(root, 0, 0, 0);
    const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(1.0, 1), psx(new THREE.MeshLambertMaterial({ color: 0xe8e4ee, flatShading: true }))); head.add(ball);
    const irisMat = glowMat(0x3a6aff), pupilMat = glowMat(0x050508);
    const iris = new THREE.Mesh(new THREE.CircleGeometry(0.46, 18), irisMat); iris.position.z = 0.97; head.add(iris);
    const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.2, 14), pupilMat); pupil.position.z = 0.985; head.add(pupil);
    const rings = [];
    for (let i = 0; i < 3; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(1.45 + i * 0.28, 0.025, 4, 40), glowMat(i === 1 ? 0x45e5ee : 0x8a6cd6)); r.rotation.x = 1.2 + i * 0.5; root.add(r); rings.push(r); }
    const cone = gazeCone(); cone.position.set(0, 0, 1.0); head.add(cone);
    return { root, head, legs: [], arms: [], cone, omega: true, irisMat, rings, yaw: 0, headYaw: 0, headPitch: 0, last: 0 };
  }
  function makeStaff(type) { const m = type === 'robot' ? makeRobot() : type === 'omega' ? makeOmega() : type === 'webcam' ? null : makeHuman(STAFF_LOOK[type] || STAFF_LOOK.dean); if (m) m.type = type; return m; }
  function poseModel(m, o) { // o: {x, y, z, yaw, moving, walk, phase, now, headYaw, headPitch, coneLen, predict, away, hidden, seated}
    const dt = clamp(o.now - m.last, 0, 0.1); m.last = o.now;
    m.root.visible = !o.hidden;
    if (o.hidden) return;
    const rate = o.phase === 'tell' ? 3.0 : o.phase === 'watch' ? 9 : 6;
    m.yaw = angTo(m.yaw, o.yaw, Math.min(1, dt * rate));
    m.headYaw = angTo(m.headYaw, o.headYaw || 0, Math.min(1, dt * 8));
    m.headPitch = lerp(m.headPitch, o.headPitch || 0, Math.min(1, dt * 6));
    if (m.omega) {
      m.root.position.set(o.x, (o.y || 0) + Math.sin(o.now * 0.8) * 0.12, o.z); m.root.scale.setScalar(o.scale || 1);
      m.head.rotation.set(m.headPitch, m.yaw + m.headYaw, 0);
      m.rings.forEach((r, i) => { r.rotation.z = o.now * (0.3 + i * 0.2); });
      m.irisMat.color.setHex(o.asleep ? 0x0a0a12 : o.phase === 'watch' ? 0xff2e47 : o.phase === 'tell' ? 0xffa030 : 0x3a6aff);
      m.head.scale.y = lerp(m.head.scale.y, o.asleep ? 0.12 : 1, Math.min(1, dt * 3)); // 눈이 감긴다
    } else {
      const sw = o.moving ? Math.sin(o.walk * 7) : 0;
      const sit = o.sit != null ? o.sit : o.seated ? 1 : 0; // 1 앉음 · 0 섬 (사이 값이면 일어나는 중)
      const y = m.robot ? 0.06 + Math.sin(o.now * 4) * 0.03 : (sit > 0 ? -0.4 * sit : o.moving ? Math.abs(sw) * 0.02 : 0);
      m.root.position.set(o.x, y + (o.y || 0), o.z); m.root.scale.setScalar(o.scale || 1);
      m.root.rotation.y = m.yaw; m.head.rotation.set(m.headPitch, m.headYaw, 0);
      if (m.legs.length) { const lk = -1.4 * sit; m.legs[0].rotation.x = lk + sw * 0.45; m.legs[1].rotation.x = lk - sw * 0.45; }
      const crossArms = m.look && m.look.prop === 'cross' && !o.moving;
      if (sit > 0.5) { m.arms[0].rotation.set(-0.9, 0, 0.15); m.arms[1].rotation.set(o.raise ? -2.7 : o.phase === 'stand' ? -1.1 : -0.9, 0, o.raise ? -0.25 : -0.15); }
      else if (crossArms) { m.arms[0].rotation.set(-1.05, 0, 0.55); m.arms[1].rotation.set(-1.05, 0, -0.55); }
      else if (o.raise) { m.arms[0].rotation.set(-sw * 0.35, 0, 0); m.arms[1].rotation.set(-0.5, 0, 0); }
      else { m.arms[0].rotation.set(-sw * 0.35, 0, 0); m.arms[1].rotation.set(o.phase === 'watch' && !m.robot ? -0.35 : sw * 0.35, 0, 0); }
      const H = o.hold, grab = H ? Math.max(H.reach, H.lift) : 0; // 바칼로레아: 몸을 숙여 답안지를 집고, 두 손으로 들어 읽는다
      if (H && m.arms.length > 1) { const ax = lerp(lerp(m.arms[0].rotation.x, -0.62, H.reach), -0.86, H.lift); m.arms[0].rotation.set(ax, 0, 0.13 * grab); m.arms[1].rotation.set(ax, 0, -0.13 * grab); }
      if (m.body && !m.robot) m.body.rotation.x = H ? 0.2 * H.reach * (1 - H.lift) : 0;
      if (m.props) for (const pp of m.props) pp.visible = grab < 0.05;
      if (m.visorMat) m.visorMat.color.setHex(o.phase === 'watch' ? 0xff2e47 : o.phase === 'tell' ? 0xc03040 : 0x7a1f2c);
    }
    const c = m.cone;
    c.visible = !!o.predict && !(o.phase === 'stand' && o.away);
    if (c.visible) {
      const col = o.phase === 'watch' ? 0xff3040 : o.phase === 'tell' ? 0xffa030 : 0xffffff;
      c.material.color.setHex(col); c.material.opacity = o.phase === 'watch' ? 0.2 : o.phase === 'tell' ? 0.16 : 0.05;
      const L = o.coneLen || 3.5; c.scale.set(L * 0.9, L * 0.9, L);
    }
  }

  // ---------- 시험장 ----------
  const SKY = {
    day: { amb: [0xfff2e0, 1.0], hemi: [0xfff0d4, 0x4a3a2e, 1.2], sun: [0xffe2b8, 2.5], fog: 0xb8ad96, glass: ['#9fd2f2', '#e8f4fb', '#7fae7a'] },
    dawn: { amb: [0xffe6dc, 0.95], hemi: [0xffe0d0, 0x4a3a3e, 1.1], sun: [0xffc8a0, 2.3], fog: 0xb8a39a, glass: ['#f2b49a', '#ffe1c4', '#8f7f86'] },
    dusk: { amb: [0xffd8b8, 0.85], hemi: [0xffcfa0, 0x3a2a2e, 1.0], sun: [0xff9a5a, 2.3], fog: 0x9a7f6a, glass: ['#e98a5a', '#f6c18a', '#5a4a5a'] },
    night: { amb: [0xc8d4ff, 0.75], hemi: [0xd0dcff, 0x1a1a2a, 0.9], sun: [0xdfe8ff, 1.5], fog: 0x1c2030, glass: ['#0d1430', '#1c2650', '#0a0d1c'] },
    space: { amb: [0xc8d0ff, 0.8], hemi: [0xb8c8ff, 0x1a1a30, 1.0], sun: [0xe8f0ff, 1.8], fog: 0x0a0c1a, glass: ['#02030a', '#0a0c22', '#2a1a4a'] },
    hell: { amb: [0xff9a8a, 0.55], hemi: [0xff7a6a, 0x1a0608, 0.8], sun: [0xff5a3a, 1.2], fog: 0x1a0a0e, glass: ['#3a0a0a', '#8a1a0a', '#1a0505'] },
    glitch: { amb: [0xd8c8ff, 0.8], hemi: [0xff8aff, 0x1a1a40, 1.0], sun: [0x8affff, 1.8], fog: 0x221a3a, glass: ['#ff3aa0', '#3affd0', '#2a1a5a'] },
    white: { amb: [0xffffff, 1.2], hemi: [0xffffff, 0x8a92a0, 1.2], sun: [0xffffff, 2.0], fog: 0xdfe4ea, glass: ['#e8f0f8', '#ffffff', '#c8d0d8'] },
    mars: { amb: [0xffc8a0, 0.9], hemi: [0xffb080, 0x3a1a10, 1.0], sun: [0xff9a60, 2.2], fog: 0x9a4a2a, glass: ['#c8602a', '#e89a5a', '#8a3a1a'] },
    sea: { amb: [0x9ae0ff, 0.9], hemi: [0x8ad8f0, 0x0a2a3a, 1.0], sun: [0xc8f4ff, 1.6], fog: 0x0e4a5e, glass: ['#0a4a6a', '#2a8aa8', '#0a2a3a'] },
    dreamy: { amb: [0xffd8f4, 1.0], hemi: [0xf4c8ff, 0x4a3a6a, 1.1], sun: [0xffe0f8, 2.0], fog: 0xcaa8e0, glass: ['#ffb8e0', '#fff0c8', '#b8a0ff'] },
    storm: { amb: [0xa8b0d8, 0.55], hemi: [0x9aa4d0, 0x0a0a14, 0.7], sun: [0xd8e0ff, 1.1], fog: 0x12141f, glass: ['#0a0c18', '#2a3050', '#0a0a12'] },
    void: { amb: [0xb8c0ff, 0.7], hemi: [0xc8d0ff, 0x05050a, 0.9], sun: [0xffffff, 1.4], fog: 0x020208, glass: ['#000000', '#05050a', '#000000'] },
  };
  const ROOMS = {
    hs: { wall: 0xe6e0cc, wain: 0x9a8a6a, floor: 'wood', board: 'green', sky: 'day', tv: true },
    suneung: { wall: 0xe8e2d2, wain: 0xa58e6c, floor: 'wood', board: 'green', sky: 'dawn', tv: true },
    lecture: { wall: 0xe8dcc4, wain: 0xb59a74, floor: 'wood', board: 'white', sky: 'day' },
    toeic: { wall: 0xdfe6dc, wain: 0x8f9d8a, floor: 'wood', board: 'green', sky: 'day', speaker: true },
    history: { wall: 0xece0c0, wain: 0xa98b62, floor: 'wood', board: 'green', sky: 'day' },
    civil: { wall: 0xd3d9e0, wain: 0x7d8794, floor: 'tile', board: 'green', sky: 'day' },
    tax: { wall: 0xeef0f2, wain: 0x9aa1ab, floor: 'tile', board: 'white', sky: 'day', hall: true },
    cpa: { wall: 0xe4e8ee, wain: 0x8a93a3, floor: 'tile', board: 'white', sky: 'dusk', hall: true },
    leet: { wall: 0xc9b08e, wain: 0x6e5238, floor: 'darkwood', board: 'green', sky: 'dusk' },
    bar: { wall: 0x2c3550, wain: 0x1c2236, floor: 'darktile', board: 'screen', sky: 'night', hall: true, redLight: true },
    usclass: { wall: 0xd8e2ea, wain: 0x5a7a9a, floor: 'tile', board: 'white', sky: 'day', lockers: [0x3b6fb6, 0x3466a8] },
    gaokao: { wall: 0xf0ece0, wain: 0x9a3a2a, floor: 'tile', board: 'red', sky: 'day', banner: '诚信考试' },
    testcenter: { wall: 0xdadfe4, wain: 0x6a7480, floor: 'tile', board: 'white', sky: 'day', partitions: true },
    cfa: { wall: 0xe8e8ec, wain: 0x7a808c, floor: 'tile', board: 'white', sky: 'dusk', hall: true },
    convention: { wall: 0xc8ccd4, wain: 0x4a505a, floor: 'darktile', board: 'screen', sky: 'day', hall: true, huge: true },
    space: { wall: 0x9aa4b8, wain: 0x4a5468, floor: 'metal', board: 'screen', sky: 'space', floaty: true, ceil: 0x6a7488 },
    underworld: { wall: 0x3a1e22, wain: 0x1a0c10, floor: 'darkwood', board: 'red', sky: 'hell', candles: true, ceil: 0x1a0c10 },
    multiverse: { wall: 0x3a2c58, wain: 0x221a3a, floor: 'darktile', board: 'screen', sky: 'glitch', hall: true, ceil: 0x221a3a },
    server: { wall: 0xf2f4f6, wain: 0xc8ccd2, floor: 'tile', board: 'screen', sky: 'white', racks: true },
    void: { void: true, sky: 'void', floor: 'none', board: 'none' },
    todai: { wall: 0xe8e4d8, wain: 0x5a4a3a, floor: 'darkwood', board: 'green', sky: 'dawn', hall: true },
    iit: { wall: 0xe8d8b0, wain: 0x8a6a3a, floor: 'tile', board: 'green', sky: 'day', hall: true, huge: true },
    bac: { wall: 0xf0e8d8, wain: 0x6a7a9a, floor: 'wood', board: 'green', sky: 'day' },
    nasa: { wall: 0xdfe4ea, wain: 0x3a4a6a, floor: 'metal', board: 'screen', sky: 'night', ceil: 0x8a94a6 },
    mars: { wall: 0xb86a4a, wain: 0x6a3a2a, floor: 'metal', board: 'screen', sky: 'mars', ceil: 0x7a4a3a },
    sea: { wall: 0x2a7a8a, wain: 0x1a4a5a, floor: 'tile', board: 'red', sky: 'sea', floaty: true, ceil: 0x1a5a6a },
    dream: { wall: 0xf4d8f0, wain: 0xb8a0e0, floor: 'wood', board: 'white', sky: 'dreamy', floaty: true },
    mirror: { wall: 0xe8eef4, wain: 0xa8b4c4, floor: 'tile', board: 'white', sky: 'white', hall: true },
    tele: { wall: 0x4a3a7a, wain: 0x2a1f4a, floor: 'darktile', board: 'screen', sky: 'glitch', ceil: 0x2a1f4a },
    court: { wall: 0x2a2e3a, wain: 0x14161e, floor: 'darktile', board: 'screen', sky: 'night', hall: true, racks: true, redLight: true },
    hole: { wall: 0x1a1a2a, wain: 0x0a0a14, floor: 'metal', board: 'screen', sky: 'space', floaty: true, ceil: 0x0a0a14 },
    storm: { wall: 0xc8c8d0, wain: 0x8a8a96, floor: 'tile', board: 'none', sky: 'storm', hall: true, ceil: 0x3a3c4a },
    aiface: { layout: 'table', wall: 0xdfe8f0, wain: 0x8aa0b8, floor: 'tile', sky: 'white' },
    ielts: { layout: 'table', wall: 0xdfe6ea, wain: 0x9aa8b4, floor: 'tile', sky: 'day' },
    taxi: { layout: 'table', wall: 0x5a6a4a, wain: 0x3a4630, floor: 'darkwood', sky: 'day', shelves: true },
    oxford: { layout: 'table', wall: 0x6a4a32, wain: 0x4a3222, floor: 'darkwood', sky: 'dusk', shelves: true },
    tasting: { layout: 'table', wall: 0x2a2228, wain: 0x1a1418, floor: 'darkwood', sky: 'night', cloth: true, glasses: true },
    ibank: { layout: 'table', wall: 0x2a3040, wain: 0x1a2030, floor: 'darktile', sky: 'night' },
    home: { layout: 'home' },
  };
  function floorTex(kind) {
    const T = canvasTex(64, 64, false), g = T.g;
    if (kind === 'wood' || kind === 'darkwood') {
      const a = kind === 'wood' ? ['#9c6c47', '#93633f', '#a3724c', '#7c5233'] : ['#6e4b33', '#654430', '#77523a', '#4f3524'];
      g.fillStyle = a[0]; g.fillRect(0, 0, 64, 64);
      for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? a[1] : a[2]; g.fillRect(0, i * 16, 64, 15); g.fillStyle = a[3]; g.fillRect(0, i * 16 + 15, 64, 1); g.fillRect((i * 23) % 64, i * 16, 1, 15); }
    } else if (kind === 'metal') {
      g.fillStyle = '#5a6272'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#6a7384'; g.fillRect(2, 2, 60, 60); g.fillStyle = '#4a5262';
      g.fillRect(0, 31, 64, 2); g.fillRect(31, 0, 2, 64); g.fillStyle = '#8a94a6'; for (const [x, y] of [[6, 6], [56, 6], [6, 56], [56, 56], [26, 26], [36, 36]]) g.fillRect(x, y, 2, 2);
    } else {
      const a = kind === 'tile' ? ['#b9bec6', '#a3a9b2', '#c6cbd2'] : ['#3b3f4f', '#2c2f3b', '#454a5c'];
      g.fillStyle = a[0]; g.fillRect(0, 0, 64, 64); g.fillStyle = a[2]; g.fillRect(2, 2, 28, 28); g.fillRect(34, 34, 28, 28);
      g.fillStyle = a[1]; g.fillRect(0, 31, 64, 2); g.fillRect(31, 0, 2, 64);
    }
    T.t.wrapS = T.t.wrapT = THREE.RepeatWrapping; T.t.needsUpdate = true; return T.t;
  }
  function skyTex(sky) {
    const T = canvasTex(32, 32, false), g = T.g, c = SKY[sky].glass, gr = g.createLinearGradient(0, 0, 0, 32);
    gr.addColorStop(0, c[0]); gr.addColorStop(1, c[1]); g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
    if (sky === 'space' || sky === 'void') { g.fillStyle = '#ffffff'; for (let i = 0; i < 14; i++) g.fillRect((i * 11) % 31, (i * 7) % 31, 1, 1); g.fillStyle = '#c87a4a'; g.fillRect(18, 18, 7, 7); g.fillStyle = '#e8a06a'; g.fillRect(19, 19, 4, 3); }
    else if (sky === 'hell') { g.fillStyle = '#ff6a2a'; for (let i = 0; i < 10; i++) g.fillRect((i * 7) % 30, 20 + (i * 3) % 10, 2, 12); }
    else if (sky === 'glitch') { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#ff3aa0' : '#3affd0'; g.fillRect(0, i * 4, 32, 1); } g.fillStyle = c[2]; g.fillRect(4, 20, 24, 12); }
    else { g.fillStyle = c[2]; for (let i = 0; i < 8; i++) g.fillRect(i * 4, 22 + (i * 5) % 6, 3, 10); }
    if (sky === 'night') { g.fillStyle = '#f5cc4a'; for (let i = 0; i < 9; i++) g.fillRect((i * 7) % 30, 24 + (i * 3) % 7, 1, 1); g.fillStyle = '#ffffff'; for (let i = 0; i < 6; i++) g.fillRect((i * 11) % 31, (i * 5) % 14, 1, 1); }
    T.t.needsUpdate = true; return T.t;
  }
  function boardTex(kind, lines) {
    const T = canvasTex(512, 128, false), g = T.g, white = kind === 'white', screen = kind === 'screen', red = kind === 'red';
    g.fillStyle = white ? '#f2f2ee' : screen ? '#06080f' : red ? '#8a1a1a' : '#2f5a48'; g.fillRect(0, 0, 512, 128);
    const n = lines.length, fg = white ? '#24324a' : screen ? '#7ff6ff' : red ? '#ffd86a' : '#e9f1e8', fg2 = white ? '#c0392b' : screen ? '#ff5a6e' : red ? '#ffffff' : '#f2c4cf';
    g.textAlign = 'center';
    lines.forEach((ln, i) => { g.fillStyle = i === 0 ? fg : i === n - 1 && n > 1 ? fg2 : fg; g.font = `${i === 0 ? 800 : 700} ${i === 0 ? 28 : 21}px ${FONT}`; g.fillText(ln, 256, n === 2 ? 52 + i * 38 : n === 1 ? 72 : 36 + i * 36); });
    if (screen) { g.strokeStyle = '#1e3a4a'; g.lineWidth = 2; g.strokeRect(6, 6, 500, 116); }
    T.t.needsUpdate = true; return T.t;
  }
  function noteTex(str) {
    const T = canvasTex(128, 96, false), g = T.g;
    g.fillStyle = '#fbf9f1'; g.fillRect(0, 0, 128, 96); g.fillStyle = '#d9473f'; g.fillRect(0, 0, 128, 14);
    g.fillStyle = '#2a2838'; g.textAlign = 'center'; g.font = `800 13px ${FONT}`;
    const words = str.split(' '), lines = []; let cur = '';
    for (const w of words) { const t = cur ? cur + ' ' + w : w; if (g.measureText(t).width > 112 && cur) { lines.push(cur); cur = w; } else cur = t; } if (cur) lines.push(cur);
    lines.slice(0, 4).forEach((ln, i) => g.fillText(ln, 64, 40 + i * 17 - (lines.length - 1) * 6));
    T.t.needsUpdate = true; return T.t;
  }
  function bannerTex(text) {
    const T = canvasTex(256, 48, false), g = T.g;
    g.fillStyle = '#b81a1a'; g.fillRect(0, 0, 256, 48); g.fillStyle = '#ffe08a'; g.textAlign = 'center'; g.font = `800 30px ${FONT}`; g.fillText(text, 128, 36);
    T.t.needsUpdate = true; return T.t;
  }

  const EX = { scene: null, tier: -1, home: false };
  const VIEWS_ROOM = { result: { yaw: 0, pitch: -0.83, fov: 33 }, front: { yaw: 0, pitch: -0.1, fov: 62 }, paper: { yaw: 0, pitch: -0.83, fov: 40 }, left: { yaw: 0.8, pitch: -0.1, fov: 58 }, right: { yaw: -0.8, pitch: -0.1, fov: 58 } };
  const VIEWS_VOID = { result: { yaw: 0, pitch: -0.83, fov: 33 }, front: { yaw: 0.1, pitch: 0.18, fov: 60 }, paper: { yaw: 0, pitch: -0.83, fov: 40 }, left: { yaw: 0.1, pitch: 0.18, fov: 60 }, right: { yaw: 0.1, pitch: 0.18, fov: 60 } };
  const VIEWS_TABLE = { paper: { yaw: 0, pitch: -0.08, fov: 62 }, left: { yaw: 0, pitch: -0.08, fov: 62 }, right: { yaw: 0, pitch: -0.08, fov: 62 } };

  function lights(sc, S, sky) {
    sc.add(new THREE.AmbientLight(S.amb[0], S.amb[1])); sc.add(new THREE.HemisphereLight(S.hemi[0], S.hemi[1], S.hemi[2]));
    const sun = new THREE.DirectionalLight(S.sun[0], S.sun[1]); sun.position.set(sky === 'night' || sky === 'void' ? 0 : -6, 8, -1.5); sc.add(sun);
  }
  // 내 책상 위: 시험지(또는 태블릿), 수험표, 손, 사인펜, 스마트워치
  function myDesk(sc, MY, ti, device) {
    const tablet = device === 'tablet';
    const paperTex = canvasTex(PAPER_W, PAPER_H, true);
    const pw = tablet ? 0.27 : 0.31, ph = tablet ? 0.38 : 0.43;
    if (tablet) { const b = pivot(sc, MY.x, 0.744, MY.z - 0.02); bx(b, pw + 0.03, 0.012, ph + 0.03, 0x1a1c22, 0, 0, 0); }
    const paper = plane(sc, pw, ph, (PXD ? new THREE.MeshBasicMaterial({ map: paperTex.t, color: 0xf2ece0 }) : new THREE.MeshLambertMaterial({ map: paperTex.t })), MY.x, tablet ? 0.752 : 0.744, MY.z - 0.02, -Math.PI / 2);
    if (!tablet) plane(paper, pw, ph, PXD ? new THREE.MeshBasicMaterial({ color: 0xe9e3d6 }) : new THREE.MeshLambertMaterial({ color: 0xeee8da, emissive: 0x4a4438 }), 0, 0, -0.0015, 0, Math.PI); // 뒷면: 누가 집어 들면 내 쪽에서는 빈 뒷면이 보인다
    paper.userData.home = { p: paper.position.clone(), r: paper.rotation.clone() };
    const ticket = canvasTex(128, 80, false);
    { const g = ticket.g; g.fillStyle = '#eef4f8'; g.fillRect(0, 0, 128, 80); g.fillStyle = '#2b5f8a'; g.fillRect(0, 0, 128, 16); g.fillStyle = '#ffffff'; g.font = `800 11px ${FONT}`; g.fillText('수 험 표', 44, 12); g.fillStyle = '#2a2838'; g.font = `700 10px ${FONT}`; g.fillText('수험번호 ' + (31000000 + ti * 1234567), 8, 36); g.fillText('성명  김수험', 8, 54); g.fillStyle = '#c9b8a6'; g.fillRect(92, 26, 28, 36); ticket.t.needsUpdate = true; }
    plane(sc, 0.11, 0.07, psx(new THREE.MeshLambertMaterial({ map: ticket.t })), MY.x - 0.24, 0.743, MY.z - 0.16, -Math.PI / 2);
    const HSK = 0xd9a57c, SLV = 0x3f5285, hands = pivot(sc, 0, 0, 0), HANDS = PXD && PXD.sprites.handL ? PXD.sprites : GEN_ROOM && window.FX ? window.FX.sprites : null;
    const hand = (x, z, side) => {
      const g = pivot(hands, x, 0.752, z); g.rotation.y = side * 0.35;
      if (HANDS) { // 위에서 내려다본 손 그림을 책상에 눕힌다
        const d = HANDS[side < 0 ? 'handL' : 'handR'], L = 0.4, m = new THREE.Mesh(new THREE.PlaneGeometry(L * d.w / d.h, L), new THREE.MeshBasicMaterial({ map: pxTex(d.src), alphaTest: 0.5, color: PXD ? 0xe4e0dc : 0xffffff }));
        m.rotation.x = -Math.PI / 2; m.position.set(side < 0 ? -0.07 : 0.03, 0.004, L / 2 - 0.1); g.add(m); return g;
      }
      bx(g, 0.075, 0.026, 0.07, HSK, 0, 0, 0);
      for (let i = 0; i < 4; i++) bx(g, 0.015, 0.018, 0.045 - Math.abs(i - 1.5) * 0.006, HSK, -0.027 + i * 0.018, -0.002, -0.055);
      bx(g, 0.018, 0.018, 0.04, HSK, side * -0.045, 0, -0.02).rotation.y = side * 0.5;
      bx(g, 0.1, 0.07, 0.3, SLV, side * 0.01, 0.01, 0.18); bx(g, 0.104, 0.074, 0.03, 0x2f3e66, side * 0.01, 0.01, 0.045);
      return g;
    };
    const lh = hand(MY.x - 0.2, MY.z + 0.21, -1); hand(MY.x + 0.19, MY.z + 0.19, 1);
    const watch = pivot(lh, 0, 0.02, 0.06);
    bx(watch, 0.06, 0.012, 0.05, 0x20303a, 0, 0, 0); bx(watch, 0.044, 0.004, 0.036, 0, 0, 0.007, 0, glowMat(0x45e5ee));
    const pen = pivot(sc, MY.x + 0.15, 0.772, MY.z + 0.13); pen.rotation.set(0.3, 0.75, 0);
    if (!HANDS) { bx(pen, 0.009, 0.009, 0.1, 0x24242c, 0, 0, 0); bx(pen, 0.01, 0.01, 0.018, 0xdedee6, 0, 0, -0.058); } // 그림 손은 펜을 쥐고 있다
    // 안경 전 단계의 책상 위 소품: 필통 속 폰 · 지우개 액정 (스캔할 때만 열리고 켜진다)
    const gx = MY.x - 0.25, gz = MY.z - 0.045;
    const pcase = pivot(sc, gx, 0.744, gz); pcase.rotation.y = 0.14; pcase.visible = false;
    bx(pcase, 0.15, 0.024, 0.07, 0x2c3a5c, 0, 0.012, 0); bx(pcase, 0.142, 0.002, 0.062, 0x08080b, 0, 0.0245, 0);
    const caseT = canvasTex(260, 104, true), caseFace = plane(pcase, 0.134, 0.0536, new THREE.MeshBasicMaterial({ map: caseT.t, fog: false }), 0, 0.0262, 0, -Math.PI / 2);
    const lid = pivot(pcase, 0, 0.026, -0.035); bx(lid, 0.152, 0.008, 0.072, 0x3a4a72, 0, 0.004, 0.036); bx(lid, 0.146, 0.003, 0.004, 0xc9b458, 0, 0.004, 0.071);
    const eraser = pivot(sc, gx + 0.01, 0.744, gz); eraser.rotation.y = 0.2; eraser.visible = false;
    bx(eraser, 0.035, 0.026, 0.044, 0xf4f1e8, -0.048, 0.013, 0); bx(eraser, 0.082, 0.028, 0.046, 0x2b5f8a, 0.01, 0.014, 0); bx(eraser, 0.068, 0.002, 0.036, 0x0b0b0e, 0.01, 0.0285, 0);
    const lcdT = canvasTex(128, 64, false), lcdFace = plane(eraser, 0.062, 0.031, new THREE.MeshBasicMaterial({ map: lcdT.t, fog: false }), 0.01, 0.0298, 0, -Math.PI / 2);
    // 입실 검사 소품: 물그릇과 안경(가오카오), 탐지봉(수능). 그 장면에서만 보인다
    const bowl = pivot(sc, MY.x + 0.2, 0.744, MY.z - 0.1); bowl.visible = false;
    bx(bowl, 0.2, 0.012, 0.15, 0x8f98a4, 0, 0.006, 0); for (const [w, d, x, z] of [[0.2, 0.012, 0, -0.07], [0.2, 0.012, 0, 0.07], [0.012, 0.15, -0.095, 0], [0.012, 0.15, 0.095, 0]]) bx(bowl, w, 0.05, d, 0x9aa3ae, x, 0.03, z);
    bx(bowl, 0.176, 0.004, 0.126, 0, 0, 0.044, 0, new THREE.MeshBasicMaterial({ color: 0x4fa3c8, transparent: true, opacity: 0.8 }));
    const dunk = pivot(bowl, 0, 0.3, 0); for (const x of [-0.035, 0.035]) { bx(dunk, 0.06, 0.006, 0.04, 0x17151c, x, 0, 0); bx(dunk, 0.048, 0.007, 0.028, 0x9fd8ee, x, 0, 0); } bx(dunk, 0.012, 0.006, 0.006, 0x17151c, 0, 0, 0);
    bx(dunk, 0.5, 0.07, 0.07, 0xb03a30, 0.36, 0.05, 0.0); bx(dunk, 0.07, 0.03, 0.06, 0xd9a57c, 0.09, 0.02, 0.0);
    const bubbles = [0, 1, 2, 3].map(i => bx(bowl, 0.01, 0.01, 0.01, 0xffffff, -0.05 + i * 0.033, 0.05, (i % 2) * 0.03 - 0.015));
    const wand = pivot(sc, MY.x, 1.0, MY.z - 0.25); wand.visible = false; bx(wand, 0.04, 0.03, 0.3, 0x17151c, 0, 0, -0.1); bx(wand, 0.12, 0.014, 0.12, 0x2a2a32, 0, 0, 0.1); const wandLed = glowMat(0x3a1010); bx(wand, 0.03, 0.01, 0.03, 0, 0, 0.02, 0.0, wandLed); bx(wand, 0.07, 0.07, 0.4, 0x1c2a4a, 0, 0.02, -0.45);
    // 단추 스티커 장면: 고개를 숙여 내려다본 내 옷. 감독관 손이 단추마다 스티커를 붙인다
    const shirt = pivot(sc, 0, -5, 0); shirt.visible = false;
    bx(shirt, 0.9, 0.62, 0.02, 0x3f5285, 0, 0, 0); bx(shirt, 0.06, 0.62, 0.006, 0x4a5f96, 0, 0, 0.012); bx(shirt, 0.012, 0.62, 0.004, 0x34447a, 0.03, 0, 0.016);
    for (const sx of [-1, 1]) { const c = bx(shirt, 0.2, 0.07, 0.016, 0x34447a, sx * 0.12, 0.27, 0.018); c.rotation.z = sx * 0.5; }
    const stk = canvasTex(64, 64, false); { const g = stk.g; g.clearRect(0, 0, 64, 64); g.fillStyle = '#b05a10'; g.beginPath(); g.arc(32, 32, 31, 0, 7); g.fill(); g.fillStyle = '#ff8a2a'; g.beginPath(); g.arc(32, 32, 27, 0, 7); g.fill(); g.fillStyle = '#4a2400'; g.font = `800 17px ${FONT}`; g.textAlign = 'center'; g.fillText('검사필', 32, 38); stk.t.needsUpdate = true; }
    const stickers = [0.15, 0, -0.15].map((y, i) => { bx(shirt, 0.03, 0.03, 0.008, 0xe8ecf2, 0, y, 0.018); if (i === 0) bx(shirt, 0.011, 0.011, 0.004, 0x101014, 0, y, 0.024); const m = plane(shirt, 0.085, 0.085, new THREE.MeshBasicMaterial({ map: stk.t, transparent: true, alphaTest: 0.5, fog: false }), 0, y, 0.028); m.rotation.z = (i - 1) * 0.25; m.visible = false; return m; });
    const sArm = pivot(shirt, 0.6, 0.15, 0.05); bx(sArm, 0.6, 0.085, 0.07, 0xb03a30, 0.37, 0, 0); bx(sArm, 0.09, 0.06, 0.05, 0xd9a57c, 0.03, 0, 0);
    return { paper, paperTex, watch, pen, gadget: { pcase, lid, caseT, caseFace, eraser, lcdT, open: 0, bowl, dunk, bubbles, wand, wandLed, shirt, stickers, sArm } };
  }
  let MOLE = null, EVS = null, EX_DOOR = null; // EVS: 변호사시험 2교시에 끌려 나가는 앞자리 수험생
  function seat() { return EX && EX.my && EX.X0 != null ? [(EX.my.x - (EX.X0 + 0.5)) / ((EX.X1 - 0.5) - (EX.X0 + 0.5)), (EX.my.z + 0.2 - EX.zFront) / (EX.zBack - EX.zFront)] : [0.5, 0.6]; }
  // [저승] 저승 입학시험: 떠도는 망자(물방울)와, 이름 부르는 사자의 고개·촛불 ---------------------------------------
  W.uwYawTo = (side, u) => { if (!EX || !EX.my || EX.AL == null || !EX.eye) return null; const x = side === 'L' ? EX.AL : EX.AR, z = lerp(EX.zBack, EX.zFront, u); return Math.atan2(-(x - EX.eye.x), -(z - EX.eye.z)); }; // 고개를 이만큼(왼쪽 +) 돌리면 그 자리가 보인다
  W.uwMyU = () => EX && EX.my && EX.zBack != null ? (EX.zBack - EX.my.z) / (EX.zBack - EX.zFront) : 0.45; // 내 줄의 u (0 뒤 · 1 앞)
  let UW = null;
  function uwBuild(sc, MY) {
    const m = makeHuman({ top: 0xc9ced2, sleeve: 0xc9ced2, leg: 0xc9ced2, shirt: 0xc9ced2, robe: true, hair: 'none', skin: 0xc4d0d6, eyeC: 0x050506 }), H = 0x07080b; // 소복 입은 망자
    bx(m.head, 0.22, 0.08, 0.23, H, 0, 0.125, -0.005); bx(m.head, 0.23, 0.52, 0.07, H, 0, -0.13, -0.1); bx(m.head, 0.035, 0.44, 0.19, H, -0.112, -0.09, 0); bx(m.head, 0.035, 0.44, 0.19, H, 0.112, -0.09, 0); bx(m.head, 0.085, 0.36, 0.02, H, -0.055, -0.07, 0.113); // 젖어서 늘어진 긴 머리 (얼굴 왼쪽 절반을 가리고 한쪽 눈만 보인다)
    m.head.children.forEach(c => { if (c.isMesh && Math.abs(c.position.y + 0.07) < 0.001 && c.position.z > 0.1) c.material = mat(0x241818); }); // 입은 핏기 없이 어둡게
    m.root.traverse(o => { if (o.isMesh && o.material && o !== m.cone) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.86; if (o.material.emissive && o.material.color && o.material.color.getHSL({}).l > 0.4) o.material.emissive.setHex(0x14202a); } }); m.cone.visible = false; sc.add(m.root); // 피부·소복만 촛불 아래에서도 차갑고 창백하게 (머리카락은 그대로 검게)
    const dm = new THREE.MeshBasicMaterial({ color: 0xd8efff, transparent: true, opacity: 0.9, fog: false }), drops = [];
    for (let i = 0; i < 6; i++) { const d = new THREE.Mesh(UNIT, dm); d.scale.set(0.006, 0.018, 0.006); d.visible = false; sc.add(d); drops.push(d); }
    const wet = canvasTex(128, 128, true); { const g = wet.g; let sd = 41; const rr = () => (sd = (sd * 16807) % 2147483647) / 2147483647; // 젖은 종이: 울퉁불퉁하게 번진 얼룩, 짙은 가장자리, 가운데 고인 물
      const blob = (cx, cy, r, col) => { g.fillStyle = col; g.beginPath(); for (let i = 0; i <= 18; i++) { const a = i / 18 * 6.283, q = r * (0.8 + 0.28 * Math.sin(a * 3 + 1) + 0.12 * Math.sin(a * 7)); i ? g.lineTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q) : g.moveTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q); } g.fill(); };
      blob(64, 64, 52, 'rgba(70,78,84,0.34)'); blob(64, 64, 47, 'rgba(120,128,130,0.5)'); blob(62, 66, 38, 'rgba(96,106,112,0.42)'); for (let i = 0; i < 5; i++) blob(64 + (rr() - 0.5) * 80, 64 + (rr() - 0.5) * 80, 7 + rr() * 9, 'rgba(100,110,116,0.45)');
      const gr = g.createRadialGradient(58, 58, 2, 62, 62, 22); gr.addColorStop(0, 'rgba(235,245,255,0.5)'); gr.addColorStop(0.6, 'rgba(190,210,230,0.16)'); gr.addColorStop(1, 'rgba(190,210,230,0)'); g.fillStyle = gr; g.fillRect(30, 30, 70, 70);
      g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.ellipse(52, 50, 8, 4, -0.6, 0, Math.PI * 2); g.fill(); wet.t.needsUpdate = true; } // 시험지에 번진 물자국
    const marks = []; for (let i = 0; i < 14; i++) { const p = plane(sc, 0.085, 0.085, new THREE.MeshBasicMaterial({ map: wet.t, transparent: true, depthWrite: false, opacity: 0, polygonOffset: true, polygonOffsetFactor: -2 }), 0, 0.7466, 0, -Math.PI / 2); p.visible = false; marks.push(p); }
    const sh = canvasTex(64, 64, true); { const g = sh.g, gr = g.createRadialGradient(32, 32, 4, 32, 32, 31); gr.addColorStop(0, 'rgba(0,0,0,0.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); sh.t.needsUpdate = true; } // 머리 위에 무언가 있을 때 시험지에 드리우는 그림자
    const shadow = plane(sc, 0.38, 0.32, new THREE.MeshBasicMaterial({ map: sh.t, transparent: true, depthWrite: false, opacity: 0, polygonOffset: true, polygonOffsetFactor: -1 }), MY.x, 0.7464, MY.z - 0.14, -Math.PI / 2); shadow.visible = false;
    UW = { m, drops, marks, shadow, sc };
  }
  function uwRender(E, now) {
    const U = UW, g = E.ghost, m = U.m, C = E.call;
    if (C && C.by) { const sm = EX.staff[E.staff.indexOf(C.by)]; if (sm && sm.head) { if (C.phase === 'call') sm.head.rotation.z = 0.1 + Math.sin(now * 1.3) * 0.12; else if (C.phase === 'nod') sm.head.rotation.x = Math.sin(clamp(C.k / 0.8, 0, 1) * Math.PI * 2) * 0.35; } } // 부르는 동안 고개를 갸웃, 돌아봐 주면 끄덕인다
    if (EX.candle) { const f = EX.candle.flame; if (C && C.phase === 'call') f.rotation.set(-(1 - Math.min(1, Math.abs(C.yaw))) * 0.5, 0, clamp(C.yaw, -1, 1) * 0.6); else f.rotation.set(0, 0, 0); } // 촛불이 부르는 사자 쪽으로 눕는다
    if (!g) { m.root.visible = false; U.shadow.visible = false; return; }
    const over = { x: EX.my.x, z: EX.my.z - 0.62 }, aisle = (side, u) => ({ x: (side === 'L' ? EX.AL : EX.AR) + (side === 'L' ? 0.22 : -0.22), z: lerp(EX.zBack, EX.zFront, u) });
    let p, yaw, lean = 0, hp = 0.3;
    if (g.phase === 'roam') { p = aisle(g.side, g.u); yaw = g.du > 0 ? Math.PI : 0; }
    else if (g.phase === 'come') { const a = aisle(g.from.side, g.from.u), k = ease(clamp(g.k, 0, 1)); p = { x: lerp(a.x, over.x, k), z: lerp(a.z, over.z, k) }; yaw = Math.atan2(over.x - a.x, over.z - a.z); lean = 0.1 * k; }
    else if (g.phase === 'over') { p = over; yaw = Math.atan2(EX.eye.x - over.x, EX.eye.z - over.z); lean = 0.15; hp = E.caught && E.caughtHow === 'ghost' ? 0.5 : 0.85; } // 내 책상 너머로 몸을 숙여 시험지를 내려다본다 (시험지를 보는 동안은 화면 밖)
    else { const b = aisle(g.to.side, g.to.u), k = ease(clamp(g.k, 0, 1)); p = { x: lerp(over.x, b.x, k), z: lerp(over.z, b.z, k) }; yaw = Math.atan2(b.x - over.x, b.z - over.z); lean = 0.15 * (1 - k); }
    poseModel(m, { x: p.x, y: 0.03 + Math.sin(now * 1.7) * 0.02, z: p.z, yaw, moving: false, walk: 0, phase: 'stand', now, headPitch: hp, hidden: false }); // 발이 닿지 않고 조금 떠서 미끄러진다
    m.body.rotation.x = lean; m.arms[0].rotation.set(0.25, 0, 0.06); m.arms[1].rotation.set(0.25, 0, -0.06); // 팔은 등 뒤로 늘어뜨린다 (시험지를 보는 동안 화면에 손이 들어오지 않게)
    if (EX.views && !EX.views.ghostlook) EX.views.ghostlook = { yaw: 0, pitch: 0.22, fov: 56 }; // 올려다본 순간: 내려다보는 망자의 얼굴
    const P = EX.paper ? EX.paper.position : { x: EX.my.x, z: EX.my.z - 0.02 }, pw = 0.31, ph = 0.43;
    U.drops.forEach((d, i) => { const dd = g.drops[i]; d.visible = !!dd; if (dd) { const k = clamp(dd.t / 0.32, 0, 1); d.position.set(P.x + (dd.u - 0.5) * pw, 1.3 - 0.55 * k * k, P.z + (dd.v - 0.5) * ph); } }); // 떨어지는 물방울
    U.marks.forEach((mk, i) => { const M = g.marks[g.marks.length - 1 - i]; mk.visible = !!M; if (M) { const gr = M.s * (0.3 + 0.7 * (1 - Math.pow(1 - Math.min(1, M.t / 2.2), 2))); mk.scale.set(gr, gr, 1); mk.rotation.z = (M.u * 37 + M.v * 91) % 6.28; /* 떨어진 자리에서 천천히 번진다 */ mk.position.set(P.x + (M.u - 0.5) * pw, 0.7466 + i * 0.00002, P.z + (M.v - 0.5) * ph); mk.material.opacity = 0.85 * (1 - clamp((M.t - 9) / 5, 0, 1)); } });
    const pres = g.phase === 'over' ? 1 : g.phase === 'come' ? g.k : g.phase === 'go' ? 1 - g.k : 0; U.shadow.visible = pres > 0.01; U.shadow.material.opacity = 0.5 * pres;
  }
  function secDevices(sc, tier, X1, HY, Z0, X0, MY) { // CCTV·탐지 전파 장치·드론
    let cctv = null, pulse = null, drone = null;
    if (tier.sec.includes('cctv')) {
      const g = pivot(sc, X1 - 0.25, HY - 0.32, Z0 + 1.9); bx(g, 0.06, 0.2, 0.06, 0x9b9eac, 0, 0.12, 0); bx(g, 0.2, 0.05, 0.2, 0x9b9eac, 0.1, 0.22, 0);
      const body = pivot(g, 0, 0, 0); bx(body, 0.16, 0.14, 0.32, 0xd4d6de, 0, 0, 0); bx(body, 0.1, 0.1, 0.02, 0x1b2030, 0, 0, 0.17);
      const led = glowMat(0x6b2a2a); bx(body, 0.03, 0.03, 0.02, 0, 0.05, 0.05, 0.165, led);
      const cone = gazeCone(); cone.position.set(0, 0, 0.18); body.add(cone);
      cctv = { body, led, cone, base: Math.atan2(MY.x - (X1 - 0.25), MY.z + 0.42 - (Z0 + 1.9)) };
    }
    if (tier.sec.includes('pulse')) {
      const g = pivot(sc, X1 - 1.4, 2.0, Z0 + 0.16); bx(g, 0.36, 0.26, 0.14, tier.pulse === 'screen' ? 0x2a3a5a : 0x3a3f4a, 0, 0, 0);
      const led = glowMat(0x5a2a2a); bx(g, 0.06, 0.06, 0.02, 0, -0.1, 0.04, 0.08, led);
      bx(g, 0.02, 0.3, 0.02, 0x2a2a30, 0.1, 0.28, 0); bx(g, 0.05, 0.05, 0.05, 0, 0.1, 0.44, 0, glowMat(0xff3048));
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.96, 1.0, 48), new THREE.MeshBasicMaterial({ color: tier.pulse === 'screen' ? 0x45e5ee : 0xff3048, transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false }));
      ring.rotation.x = -Math.PI / 2; ring.position.set(X1 - 1.4, 1.6, Z0 + 0.4); ring.visible = false; sc.add(ring);
      pulse = { led, ring };
    }
    if (tier.mech.includes('drone')) { { // 교실 안을 돌아다니는 순찰 드론
        drone = pivot(sc, 0, 2.0, 0); bx(drone, 0.34, 0.08, 0.34, 0x2a2c34, 0, 0, 0); bx(drone, 0.1, 0.06, 0.1, 0x111216, 0, -0.06, 0.1);
        for (const [dx, dz] of [[-0.24, -0.24], [0.24, -0.24], [-0.24, 0.24], [0.24, 0.24]]) { bx(drone, 0.03, 0.06, 0.03, 0x2a2c34, dx, 0.04, dz); bx(drone, 0.2, 0.008, 0.03, 0x8a8f99, dx, 0.08, dz); }
        const dled = glowMat(0x6b2a2a); bx(drone, 0.05, 0.05, 0.05, 0, 0, -0.1, 0.1, dled); drone.userData.led = dled;
        const beam = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.25, 20, 1, true), new THREE.MeshBasicMaterial({ color: 0xff3048, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false })); beam.position.y = -0.7; drone.add(beam); drone.userData.beam = beam;
      }
    }
    return { cctv, pulse, drone, X0, X1 };
  }
  function buildClassroom(ti, tier, R) {
    const S = SKY[R.sky], big = !!R.hall, huge = !!R.huge, rnd = seeded(ti + 3), vd = !!R.void;
    const X1 = huge ? 8.6 : big ? 6.4 : 4.6, X0 = -X1, Z0 = huge ? -9.6 : big ? -7.6 : -6, Z1 = huge ? 7.6 : big ? 6.2 : 4.6, HY = huge ? 4.4 : big ? 3.6 : 3;
    const COLS = huge ? [-7.2, -5.4, -3.6, -1.2, 0.6, 2.4, 4.2, 6.0, 7.8] : big ? [-4.8, -3.0, -1.2, 0.6, 2.4, 4.2] : [-3.0, -1.2, 0.6, 2.4];
    const ROWS = huge ? [-8.4, -7.0, -5.6, -4.2, -2.8, -1.4, 0, 1.4, 2.8, 4.2, 5.6] : big ? [-5.6, -4.2, -2.8, -1.4, 0, 1.4, 2.8, 4.2] : [-4.2, -2.8, -1.4, 0, 1.4, 2.8];
    const MY = { x: 0.6, z: 0 }, sc = new THREE.Scene(), B = batch();
    let clockKeep = null;
    const fogC = R.fogC || S.fog;
    sc.background = new THREE.Color(fogC); sc.fog = new THREE.Fog(fogC, vd ? 6 : big ? 9 : 7, vd ? 40 : huge ? 30 : big ? 24 : 18);
    lights(sc, S, R.sky);
    if (R.redLight || R.board === 'screen' && R.sky === 'night') { const red = new THREE.PointLight(0xff2040, 6, 9, 1.5); red.position.set(0, 2.6, Z0 + 1.2); sc.add(red); }
    let candle = null, glowLamps = [];
    if (vd) { // 인류의 마지막 시험: 벽도 바닥도 없는 허공에 내 책상 하나
      const pts = [], r = seeded(77);
      for (let i = 0; i < 700; i++) { const a = r() * Math.PI * 2, b = (r() - 0.5) * Math.PI, d = 22 + r() * 10; pts.push(Math.cos(a) * Math.cos(b) * d, Math.sin(b) * d, Math.sin(a) * Math.cos(b) * d); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      sc.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false, fog: false })));
      B.box(2.2, 0.06, 2.2, 0x1c1e2a, MY.x, -0.02, MY.z + 0.2);
    } else {
      const GENW = GEN_ROOM && window.FX && !R.candles && R.sky !== 'space'; // 벽·바닥도 생성 텍스처로
      const ft = PXD ? pxTex(PXD.tex.floor, (X1 - X0) / 1.6, (Z1 - Z0) / 1.6) : GENW ? pxTex(window.FX.tex.floor, (X1 - X0) / 2.2, (Z1 - Z0) / 2.2) : floorTex(R.floor); if (!PXD && !GENW) ft.repeat.set((X1 - X0) / 1.3, (Z1 - Z0) / 1.3);
      plane(sc, X1 - X0, Z1 - Z0, psx(new THREE.MeshLambertMaterial({ map: ft })), 0, 0, (Z0 + Z1) / 2, -Math.PI / 2);
      B.box(X1 - X0, 0.05, Z1 - Z0, R.ceil || (R.sky === 'night' ? 0x2a2f40 : 0xe8e4d8), 0, HY, (Z0 + Z1) / 2);
      B.box(X1 - X0, HY, 0.1, R.wall, 0, HY / 2, Z0 - 0.05); B.box(X1 - X0, HY, 0.1, R.wall, 0, HY / 2, Z1 + 0.05);
      B.box(0.1, HY, Z1 - Z0, R.wall, X0 - 0.05, HY / 2, (Z0 + Z1) / 2); B.box(0.1, HY, Z1 - Z0, R.wall, X1 + 0.05, HY / 2, (Z0 + Z1) / 2);
      for (const [w, d, x, z] of [[X1 - X0, 0.04, 0, Z0 + 0.02], [X1 - X0, 0.04, 0, Z1 - 0.02], [0.04, Z1 - Z0, X0 + 0.02, (Z0 + Z1) / 2], [0.04, Z1 - Z0, X1 - 0.02, (Z0 + Z1) / 2]]) {
        if (GENW) continue; // 벽 그림에 아랫단이 들어 있다
        B.box(w, 0.95, d, R.wain, x, 0.475, z); B.box(w + 0.01, 0.05, d + 0.01, 0x5a4330, x, 0.97, z);
      }
      if (GENW) { // 네 벽 안쪽에 벽 그림을 붙인다
        const wm = n => psx(new THREE.MeshLambertMaterial({ map: pxTex(window.FX.tex.wall, n, 1) }));
        plane(sc, X1 - X0, HY, wm((X1 - X0) / 3), 0, HY / 2, Z0 + 0.004); plane(sc, X1 - X0, HY, wm((X1 - X0) / 3), 0, HY / 2, Z1 - 0.004, 0, Math.PI);
        plane(sc, Z1 - Z0, HY, wm((Z1 - Z0) / 3), X0 + 0.004, HY / 2, (Z0 + Z1) / 2, 0, Math.PI / 2); plane(sc, Z1 - Z0, HY, wm((Z1 - Z0) / 3), X1 - 0.004, HY / 2, (Z0 + Z1) / 2, 0, -Math.PI / 2);
      }
      if (!R.candles) for (let i = 0; i * 3 < Z1 - Z0 - 1; i++) for (let x = X0 + 2.2; x < X1 - 1; x += 2.4) B.box(0.5, 0.04, 1.2, R.sky === 'glitch' ? 0xd8a8ff : 0xfafaf4, x, HY - 0.03, Z0 + 2 + i * 3);
      // 창문 (왼쪽 벽)
      const skyMat = new THREE.MeshBasicMaterial({ map: skyTex(R.sky), fog: false });
      const shine = new THREE.MeshBasicMaterial({ color: R.sky === 'dusk' ? 0xff9a50 : 0xffeab0, transparent: true, opacity: ['night', 'space', 'hell', 'glitch', 'void'].includes(R.sky) ? 0 : 0.2, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
      for (let z = Z0 + 1.8; z < Z1 - 1; z += 2.6) {
        plane(sc, 2.0, 1.5, skyMat, X0 + 0.02, 1.85, z, 0, Math.PI / 2);
        const fr = R.sky === 'space' ? 0x8a94a8 : R.candles ? 0x2a1010 : 0xf2efe6;
        for (const dz of [-1.04, 0, 1.04]) B.box(0.08, 1.62, 0.08, fr, X0 + 0.05, 1.85, z + dz);
        B.box(0.08, 0.08, 2.16, fr, X0 + 0.05, 2.64, z); B.box(0.16, 0.06, 2.16, fr, X0 + 0.08, 1.07, z);
        if (shine.opacity > 0) plane(sc, 1.9, 1.3, shine, X0 + 2.0, 0.012, z + 0.4, -Math.PI / 2);
      }
      // 앞: 칠판·시계, 오른쪽: 문·안내문, 뒤: 사물함
      if (R.board !== 'none') {
        B.box(5.6, 1.5, 0.08, R.board === 'screen' ? 0x0c0e16 : 0x6b4a30, 0, 1.6, Z0 + 0.06);
        plane(sc, 5.4, 1.32, psx(new THREE.MeshLambertMaterial({ map: boardTex(R.board, tier.lines.length ? tier.lines : [tier.name]), emissive: R.board === 'screen' ? 0x223344 : 0x000000 })), 0, 1.6, Z0 + 0.105);
        B.box(5.6, 0.05, 0.14, 0x6b4a30, 0, 0.84, Z0 + 0.12);
      }
      if (R.tv) B.box(1.1, 0.7, 0.1, 0x1c1d22, 3.6, 2.35, Z0 + 0.1);
      if (R.speaker) { B.box(0.4, 0.5, 0.2, 0x2a2a30, X1 - 0.3, HY - 0.5, Z0 + 2.6); B.box(0.3, 0.3, 0.02, 0x15151a, X1 - 0.41, HY - 0.5, Z0 + 2.6); }
      if (R.banner) plane(sc, 3.2, 0.6, new THREE.MeshBasicMaterial({ map: bannerTex(R.banner) }), 0, HY - 0.45, Z0 + 0.11);
      const clockT = canvasTex(64, 64, false);
      plane(sc, 0.42, 0.42, new THREE.MeshBasicMaterial({ map: clockT.t, transparent: true }), 0, HY - 0.38, Z0 + 0.11);
      clockKeep = clockT;
      if (GEN_ROOM && !R.candles && R.sky !== 'space') { const m = modelInst('door'); if (m) { m.position.set(X1 - 0.09, 0, Z0 + 1.4); m.scale.setScalar(2.15); m.rotation.y = -Math.PI / 2; sc.add(m); } const pd = modelInst('podium'); if (pd) { pd.position.set(0.6, 0, Z0 + 0.7); pd.scale.setScalar(1.08); pd.rotation.y = Math.PI; sc.add(pd); } }
      else if (tier.id === 'bar') { // 변호사시험: 열리는 문. 열리면 복도 불빛이 들어온다 (2교시에 앞자리를 데리고 나가는 문)
        const lit = plane(sc, 0.96, 2.06, new THREE.MeshBasicMaterial({ color: 0xfff1d6, fog: false }), X1 - 0.055, 1.03, Z0 + 1.4, 0, -Math.PI / 2);
        const hinge = pivot(sc, X1 - 0.04, 0, Z0 + 0.9); bx(hinge, 0.08, 2.1, 1.0, 0x8a6a4a, 0, 1.05, 0.5); bx(hinge, 0.1, 0.5, 0.36, 0xcfe8f5, -0.02, 1.55, 0.35);
        const glow = new THREE.PointLight(0xffe6b8, 0, 6, 1.4); glow.position.set(X1 - 0.7, 1.7, Z0 + 1.4); sc.add(glow); EX_DOOR = { hinge, lit, glow, sc }; }
      else { B.box(0.08, 2.1, 1.0, 0x8a6a4a, X1 - 0.04, 1.05, Z0 + 1.4); B.box(0.1, 0.5, 0.36, 0xcfe8f5, X1 - 0.06, 1.55, Z0 + 1.25); }
      plane(sc, 0.64, 0.48, psx(new THREE.MeshLambertMaterial({ map: noteTex(tier.lines[tier.lines.length - 1] || tier.name) })), X1 - 0.02, 1.6, Z0 + 3.6, 0, -Math.PI / 2);
      B.box(0.3, 0.3, 0.2, 0x3a3a40, X1 - 0.12, HY - 0.4, Z0 + 4.6);
      const LK = R.lockers || [0x9aa0a8, 0x8d939c];
      if (R.racks) for (let x = X0 + 1.3; x < X1 - 0.6; x += 1.32) { B.box(1.0, 2.0, 0.6, 0x2a2e36, x, 1.0, Z1 - 0.35); for (let k = 0; k < 6; k++) B.box(0.8, 0.04, 0.02, k % 2 ? 0x45e5ee : 0x62d84a, x, 0.4 + k * 0.28, Z1 - 0.65); }
      else if (GEN_ROOM && !R.candles && R.sky !== 'space') for (let x = X0 + 1.3; x < X1 - 0.6; x += 1.32) { const m = modelInst('lockers'); if (m) { m.position.set(x, 0, Z1 - 0.3); m.scale.setScalar(1.35); m.rotation.y = Math.PI; sc.add(m); } }
      else for (let x = X0 + 1.3; x < X1 - 0.6; x += 1.32) B.box(1.1, 1.2, 0.5, (Math.round(x * 10) % 2) ? LK[0] : LK[1], x, 0.6, Z1 - 0.28);
      if (R.candles) { // 저승: 벽 등롱
        for (let z = Z0 + 1.5; z < Z1 - 1; z += 3) for (const x of [X0 + 0.2, X1 - 0.2]) { B.box(0.18, 0.3, 0.18, 0x8a1a1a, x, 2.2, z); const l = new THREE.PointLight(0xff5a2a, 2.2, 5, 1.6); l.position.set(x + (x < 0 ? 0.3 : -0.3), 2.1, z); sc.add(l); glowLamps.push(l); }
      }
    }
    // 책상·의자·수험생
    const TOP = R.floor === 'darktile' || R.floor === 'metal' ? 0x6a5a4a : R.candles ? 0x4a2a1a : 0xc89a64, METAL = 0x8c9099, SEAT = 0xb98a58;
    const CLOTH = R.sky === 'space' ? [0x6a8a5a, 0x5a6a9a, 0x8a5a9a, 0x4a8a8a] : R.candles ? [0xe8e4dc, 0xd8d4cc, 0xc8c4bc] : [0x3f4f78, 0x5a5f6b, 0x7a3b3b, 0x2f5d50, 0x4b4b4b, 0x6b5a46, 0x8a8f99, 0x3b3550, 0xb0a48c, 0x24324a];
    const SKINS = R.sky === 'space' ? [0x7ad06a, 0x6ac0d0, 0xb08ad0] : R.candles ? [0xd8d4cc] : [0xe2b48e];
    const HAIRS = [0x1f1a1c, 0x2b211c, 0x3a2a20, 0x161214, 0x4a3226];
    const GENR = GEN_ROOM && !R.candles && R.sky !== 'space' && !vd; // 사람이 치는 보통 시험장만 생성 모델로
    const put = (name, x, y, z, sx, sy, sz, ry) => { const m = modelInst(name); if (m) { m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.rotation.y = ry || 0; sc.add(m); } return m; };
    const desks = [], PXS = PXD && !R.candles && R.sky !== 'space'; // 사람 수험생만 그림으로 바꾼다
    ROWS.forEach(z => COLS.forEach(x => {
      const mine = x === MY.x && z === MY.z;
      if (vd && !mine) return;
      const dz = z - 0.02, fy = R.floaty && !mine ? Math.sin(x * 3 + z * 2) * 0.06 : 0;
      if (GENR) put('desk', x, fy, dz, 0.62, 0.741, 0.56, DESK_YAW); // 윗면이 시험지 바로 아래에 오게 높이를 맞춘다
      else {
        B.box(0.62, 0.04, 0.44, TOP, x, 0.72 + fy, dz); B.box(0.56, 0.08, 0.36, METAL, x, 0.64 + fy, dz);
        B.box(0.03, 0.62, 0.4, METAL, x - 0.28, 0.31 + fy, dz); B.box(0.03, 0.62, 0.4, METAL, x + 0.28, 0.31 + fy, dz);
      }
      if (!(PXS || GENR) || mine) {
        B.box(0.4, 0.03, 0.38, SEAT, x, 0.44, z + 0.42); B.box(0.4, 0.26, 0.03, SEAT, x, 0.72, z + 0.62);
        B.box(0.03, 0.44, 0.36, METAL, x - 0.18, 0.22, z + 0.42); B.box(0.03, 0.44, 0.36, METAL, x + 0.18, 0.22, z + 0.42);
      }
      if (R.partitions) { B.box(0.02, 0.5, 0.5, 0xb8c0c8, x - 0.33, 0.98, dz); if (!(mine && (tier.mech.includes('mole') || tier.id === 'bar'))) B.box(0.62, 0.5, 0.02, 0xb8c0c8, x, 0.98, dz - 0.24); /* 앞자리에 암행 감독관이 있는 시험은 내 책상 앞 가림막이 없다 (가리면 안 보인다) */ if (!mine) { B.box(0.3, 0.2, 0.02, 0x1a1c22, x, 0.9, dz - 0.15); } }
      if (PXS) plane(sc, 0.62, 0.44, PXDESK || (PXDESK = new THREE.MeshLambertMaterial({ map: pxTex(PXD.tex.desk, 1, 1) })), x, 0.7412 + fy, dz, -Math.PI / 2);
      if (mine) return;
      desks.push({ x, z });
      B.box(0.24, 0.004, 0.32, R.candles ? 0xe8d8b0 : 0xf4f1e6, x - 0.04, 0.743 + fy, dz + 0.02, 0, 0.1);
      const cl = CLOTH[Math.floor(rnd() * CLOTH.length)], hr = HAIRS[Math.floor(rnd() * HAIRS.length)], lean = 0.18 + rnd() * 0.12, sk = SKINS[Math.floor(rnd() * SKINS.length)];
      const front = x === MY.x && z === Math.max(...ROWS.filter(r => r < MY.z - 0.01), -99), mole = m => { if (!front || !m || !(tier.mech.includes('mole') || tier.id === 'bar')) return; const eyes = pivot(sc, x, 1.02, z + 0.56); bx(eyes, 0.035, 0.025, 0.01, 0, -0.045, 0, 0, glowMat(0xff3048)); bx(eyes, 0.035, 0.025, 0.01, 0, 0.045, 0, 0, glowMat(0xff3048)); eyes.visible = false; MOLE = { obj: m, eyes, y0: m.position.y, ry0: m.rotation.y, sx: m.scale.x, sprite: !!m.isSprite || !!(m.material && m.material.map && !m.children.length), sc }; };
      if (GENR) { const sn = 'stu' + (1 + Math.floor(rnd() * 3)); mole(put(sn, x + (rnd() - 0.5) * 0.04, 0, z + 0.47, 1.2, 1.2, 1.2, STU_YAW[sn] + (rnd() - 0.5) * 0.1)); return; }
      if (PXS) { // 내 자리에서 보이는 방향에 맞춰 뒷모습이나 옆모습 그림을 세운다
        const ex = MY.x, ez = MY.z + 0.45, sx = x, sz = z + 0.42, dx = sx - ex, dz = sz - ez, sideOn = z >= MY.z - 0.1;
        const sp = pxSprite((sideOn ? 'ss' : 'sb') + Math.floor(rnd() * 3), sideOn ? 1.2 : 1.22);
        sp.position.set(sx, 0, sz); sp.rotation.y = Math.atan2(ex - sx, ez - sz); if (sideOn && dx < 0) sp.scale.x *= -1;
        sc.add(sp); mole(sp); return;
      }
      if (front && tier.id === 'bar') { const st = makeHuman({ top: cl, sleeve: cl, leg: 0x2b2f3d, shirt: 0xe8e8e8, hairC: hr, skin: sk }); sc.add(st.root); EVS = { m: st, x, z: z + 0.42, sc, plan: null }; return; }
      B.box(0.34, 0.14, 0.36, 0x2b2f3d, x, 0.52, z + 0.3);
      B.box(0.12, 0.42, 0.12, 0x2b2f3d, x - 0.08, 0.22, z + 0.12); B.box(0.12, 0.42, 0.12, 0x2b2f3d, x + 0.08, 0.22, z + 0.12);
      if (front && (tier.mech.includes('mole') || tier.id === 'bar')) { // 앞자리 비밀 감독관(또는 변호사시험에서 끌려 나가는 수험생): 윗몸을 따로 만들어 움직일 수 있게 한다
        const g = pivot(sc, x, 0, z + 0.4); bx(g, 0.36, 0.46, 0.2, cl, 0, 0.8, 0.04); bx(g, 0.09, 0.1, 0.3, cl, -0.17, 0.79, -0.2); bx(g, 0.09, 0.1, 0.3, cl, 0.17, 0.79, -0.2);
        bx(g, 0.19, 0.22, 0.2, sk, 0, 1.08, -0.05); bx(g, 0.2, 0.09, 0.21, hr, 0, 1.19, -0.04); bx(g, 0.2, 0.17, 0.06, hr, 0, 1.11, 0.06);
        bx(g, 0.16, 0.035, 0.012, 0x15161c, 0, 1.1, -0.156); bx(g, 0.07, 0.012, 0.012, 0x5a2a22, 0, 1.02, -0.156); // 선글라스 같은 검은 안경과 굳게 다문 입
        const eyes = pivot(g, 0, 1.1, -0.165); bx(eyes, 0.035, 0.022, 0.01, 0, -0.045, 0, 0, glowMat(0xff3048)); bx(eyes, 0.035, 0.022, 0.01, 0, 0.045, 0, 0, glowMat(0xff3048)); eyes.visible = false;
        MOLE = { obj: g, eyes, y0: 0, ry0: 0, sx: 1, sprite: false, sc }; return; }
      B.box(0.36, 0.46, 0.2, cl, x, 0.8, z + 0.44, -lean);
      B.box(0.09, 0.1, 0.34, cl, x - 0.17, 0.79, z + 0.16); B.box(0.09, 0.1, 0.34, cl, x + 0.17, 0.79, z + 0.16);
      B.box(0.19, 0.22, 0.2, sk, x, 1.08, z + 0.33, -lean * 0.6);
      if (R.candles) { B.box(0.21, 0.24, 0.22, 0xf0ece4, x, 1.1, z + 0.36, -lean * 0.6); } // 소복 입은 망자
      else if (R.sky !== 'space') { B.box(0.2, 0.09, 0.21, hr, x, 1.19, z + 0.34, -lean * 0.6); B.box(0.2, 0.17, 0.06, hr, x, 1.11, z + 0.44, -lean * 0.6); if (rnd() < 0.3) B.box(0.1, 0.1, 0.08, hr, x, 1.12, z + 0.5); }
      else { B.box(0.02, 0.12, 0.02, 0x4a7a3a, x, 1.25, z + 0.33); }
    }));
    sc.add(B.mesh());
    const D = myDesk(sc, MY, ti, tier.device);
    if (R.candles) { // 내 책상 촛불: 저승사자가 가까이 오면 흔들린다
      const g = pivot(sc, MY.x + 0.27, 0.744, MY.z - 0.2); bx(g, 0.035, 0.09, 0.035, 0xf4efe0, 0, 0.045, 0);
      const flame = new THREE.Mesh(UNIT, glowMat(0xffb04a)); flame.scale.set(0.02, 0.04, 0.02); flame.position.set(0, 0.11, 0); g.add(flame);
      const light = new THREE.PointLight(0xffa040, 0.8, 1.6, 2); light.position.set(0, 0.14, 0); g.add(light);
      candle = { flame, light };
    }
    if (tier.id === 'afterlife') uwBuild(sc, MY); // [저승] 떠도는 망자·물방울·물자국
    const dev = secDevices(sc, tier, X1, HY, Z0, X0, MY);
    const staff = tier.staff.map(d => { const m = makeStaff(d.type); if (m) sc.add(m.root); return m; });
    // 손 드는 수험생 (다른 수험생 이벤트)
    const raise = pivot(sc, 0, 0, 0); bx(raise, 0.08, 0.36, 0.08, 0x3f4f78, 0, 0.18, 0); bx(raise, 0.07, 0.09, 0.07, 0xe2b48e, 0, 0.4, 0); raise.visible = false;
    // 염라대왕 책상
    if (tier.staff.some(s => s.type === 'yeomra')) { const b2 = batch(); b2.box(1.6, 0.82, 0.5, 0x4a0e0e, -1.8, 0.41, ROWS[0] - 1.15); b2.box(0.5, 0.06, 0.3, 0xe8d8b0, -1.8, 0.85, ROWS[0] - 1.15); sc.add(b2.mesh()); }
    const cam = new THREE.PerspectiveCamera(40, RW / RH, 0.03, 80); cam.rotation.order = 'YXZ';
    const eye = new THREE.Vector3(MY.x, 1.2, MY.z + 0.42); cam.position.copy(eye);
    Object.assign(EX, { scene: sc, tier: ti, paper: D.paper, paperTex: D.paperTex, paperSig: '', staff, ...dev, cam, eye, watch: D.watch, pen: D.pen, gadget: D.gadget, clock: clockKeep, clockSec: -1,
      AL: MY.x - 0.9, AR: MY.x + 0.9, zFront: ROWS[0] - 0.75, zBack: ROWS[ROWS.length - 1] + 0.75, my: MY, desks, raise, candle, lamps: glowLamps, views: vd ? VIEWS_VOID : VIEWS_ROOM,
      layout: 'room', floaty: !!R.floaty, glasses: null, X0, frontZ: ROWS[0], door: { x: X1 - 0.4, z: Z0 + 1.4 } });
  }
  function buildTable(ti, tier, R) { // 마주 앉는 방: 면접관·심사위원이 테이블 건너편에
    const S = SKY[R.sky], sc = new THREE.Scene(), B = batch();
    sc.background = new THREE.Color(S.fog); sc.fog = new THREE.Fog(S.fog, 4, 12);
    lights(sc, S, R.sky);
    const warm = new THREE.PointLight(0xffd8a0, 2.4, 6, 1.5); warm.position.set(0, 2.4, -0.4); sc.add(warm);
    const X1 = 2.6, X0 = -2.6, Z0 = -2.4, Z1 = 2.2, HY = 2.8;
    const ft = floorTex(R.floor); ft.repeat.set(4, 4);
    plane(sc, X1 - X0, Z1 - Z0, psx(new THREE.MeshLambertMaterial({ map: ft })), 0, 0, (Z0 + Z1) / 2, -Math.PI / 2);
    B.box(X1 - X0, HY, 0.1, R.wall, 0, HY / 2, Z0); B.box(0.1, HY, Z1 - Z0, R.wall, X0, HY / 2, (Z0 + Z1) / 2); B.box(0.1, HY, Z1 - Z0, R.wall, X1, HY / 2, (Z0 + Z1) / 2);
    B.box(X1 - X0, 0.05, Z1 - Z0, 0x2a2018, 0, HY, (Z0 + Z1) / 2);
    B.box(X1 - X0, 0.9, 0.06, R.wain, 0, 0.45, Z0 + 0.05);
    if (R.shelves) for (const x of [-1.9, 1.9]) { B.box(1.1, 2.2, 0.36, 0x4a3020, x, 1.1, Z0 + 0.25); for (let k = 0; k < 5; k++) for (let j = 0; j < 9; j++) B.box(0.09, 0.3, 0.24, [0x7a2a2a, 0x2a4a6a, 0x6a5a2a, 0x2a5a3a][(j + k) % 4], x - 0.45 + j * 0.11, 0.3 + k * 0.42, Z0 + 0.32); }
    else for (const x of [-1.9, 1.9]) { B.box(1.0, 1.6, 0.4, 0x2a1418, x, 0.8, Z0 + 0.3); for (let k = 0; k < 4; k++) for (let j = 0; j < 6; j++) B.box(0.08, 0.3, 0.08, j % 2 ? 0x5a1a2a : 0x2a3a1a, x - 0.35 + j * 0.14, 0.25 + k * 0.38, Z0 + 0.35); }
    const win = new THREE.MeshBasicMaterial({ map: skyTex(R.sky), fog: false }); plane(sc, 1.0, 1.1, win, 0, 1.8, Z0 + 0.06);
    // 테이블
    B.box(2.6, 0.06, 0.95, R.cloth ? 0xf2f0ea : 0x5a3a24, 0, 0.74, -0.25); B.box(2.5, 0.7, 0.06, R.cloth ? 0xe8e6e0 : 0x4a3020, 0, 0.36, -0.68);
    if (R.cloth) B.box(2.62, 0.3, 0.02, 0xf2f0ea, 0, 0.6, 0.23);
    const chairs = [-0.9, 0, 0.9].map(x => bx(sc, 0.42, 0.9, 0.08, 0x2a1a12, x, 0.9, -1.12)); // 면접관 의자 등받이 (해외 보스전 3페이즈에서 낮춘다)
    if (!R.glasses) { B.box(0.3, 0.02, 0.22, 0xf4f1e6, -0.55, 0.78, -0.4, 0, 0.2); B.box(0.08, 0.07, 0.08, 0xf4f4f0, 0.6, 0.8, -0.3); }
    else { B.box(0.2, 0.18, 0.2, 0x8a8f99, 1.05, 0.86, -0.4); B.box(0.24, 0.02, 0.16, 0xd8b884, -1.05, 0.78, -0.4); }
    sc.add(B.mesh());
    // 심사위원·면접관 자리
    const staff = tier.staff.map(d => { const m = makeStaff(d.type); if (m) sc.add(m.root); return m; });
    // 와인잔 6개
    let glasses = null;
    if (R.glasses) {
      glasses = [];
      for (let i = 0; i < 6; i++) {
        const g = pivot(sc, -0.75 + i * 0.3, 0.77, 0.02);
        bx(g, 0.08, 0.01, 0.08, 0xe8eef4, 0, 0, 0); bx(g, 0.012, 0.09, 0.012, 0xe8eef4, 0, 0.05, 0);
        bx(g, 0.07, 0.08, 0.07, 0xdfe8f2, 0, 0.13, 0, new THREE.MeshBasicMaterial({ color: 0xdfe8f2, transparent: true, opacity: 0.35, fog: false }));
        const wine = new THREE.Mesh(UNIT, glowMat(0x6a0a1a)); wine.scale.set(0.06, 0.04, 0.06); wine.position.set(0, 0.11, 0); g.add(wine);
        glasses.push({ g, wine });
      }
    }
    const cam = new THREE.PerspectiveCamera(62, RW / RH, 0.03, 40); cam.rotation.order = 'YXZ';
    const eye = new THREE.Vector3(0, 1.17, 0.9); cam.position.copy(eye);
    Object.assign(EX, { scene: sc, tier: ti, paper: null, paperTex: null, paperSig: '', staff, cctv: null, pulse: null, drone: null, cam, eye, watch: null, pen: null, clock: null, clockSec: -1,
      AL: -0.9, AR: 0.9, zFront: -1, zBack: 1, my: { x: 0, z: 0.6 }, desks: [], raise: null, candle: null, lamps: [], views: VIEWS_TABLE, layout: 'table', floaty: false, glasses, frontZ: -1, chairs });
  }
  function buildHomeExam(ti) { // 토플 홈에디션: 고시원 방 노트북 화면이 시험지
    buildHub();
    const screenTex = canvasTex(SCREEN_W, SCREEN_H, true);
    const c = new THREE.Vector3(), n = new THREE.Vector3(), q = new THREE.Quaternion();
    HUB.shopFace.getWorldPosition(c); HUB.shopFace.getWorldQuaternion(q); n.set(0, 0, 1).applyQuaternion(q);
    const eye = c.clone().addScaledVector(n, 0.36); eye.y += 0.04;
    const d = c.clone().sub(eye).normalize(), yaw = Math.atan2(-d.x, -d.z), pitch = Math.asin(d.y);
    const cam = new THREE.PerspectiveCamera(46, RW / RH, 0.02, 30); cam.rotation.order = 'YXZ'; cam.position.copy(eye);
    const views = { paper: { yaw, pitch, fov: 46 }, left: { yaw: yaw + 0.95, pitch: pitch + 0.25, fov: 60 }, right: { yaw: yaw - 0.95, pitch: pitch + 0.25, fov: 60 } };
    Object.assign(EX, { scene: HUB.scene, home: true, tier: ti, paper: HUB.shopFace, paperTex: screenTex, paperSig: '', staff: [], cctv: null, pulse: null, drone: null, cam, eye, watch: null, pen: null, clock: null, clockSec: -1,
      AL: 0, AR: 0, zFront: 0, zBack: 0, my: { x: 0, z: 0 }, desks: [], raise: null, candle: null, lamps: [], views, layout: 'home', floaty: false, glasses: null, frontZ: 0 });
  }
  function buildExam(ti) {
    if (EX.tier === ti && EX.scene) return;
    if (EX.home) { HUB.shopFace.material.map = HUB.shop.t; HUB.shopFace.material.needsUpdate = true; } else disposeScene(EX.scene);
    EX.scene = null; EX.home = false;
    const tier = CONFIG.tiers[ti], R = ROOMS[tier.room] || ROOMS.hs;
    if (R.layout === 'home') buildHomeExam(ti);
    else if (R.layout === 'table') buildTable(ti, tier, R);
    else buildClassroom(ti, tier, R);
  }
  const zOf = u => lerp(EX.zBack, EX.zFront, u);
  function drawClockFace(sec) {
    if (!EX.clock) return;
    const g = EX.clock.g; g.clearRect(0, 0, 64, 64);
    g.fillStyle = '#2a2838'; g.beginPath(); g.arc(32, 32, 31, 0, 7); g.fill(); g.fillStyle = '#fbfaf3'; g.beginPath(); g.arc(32, 32, 27, 0, 7); g.fill();
    g.strokeStyle = '#2a2838'; g.lineWidth = 3; const h = 0.55 * 6.283, m = (sec / 60) * 6.283;
    g.beginPath(); g.moveTo(32, 32); g.lineTo(32 + Math.sin(h) * 13, 32 - Math.cos(h) * 13); g.stroke();
    g.lineWidth = 2; g.beginPath(); g.moveTo(32, 32); g.lineTo(32 + Math.sin(m) * 20, 32 - Math.cos(m) * 20); g.stroke();
    EX.clock.t.needsUpdate = true;
  }
  const SEATS = { 1: [0], 2: [-0.45, 0.45], 3: [-0.9, 0, 0.9] };
  const sheetK = c => { const e = c.e || 0, d = c.dur || 4; return { reach: clamp(e / 0.3, 0, 1) * clamp((d - e) / 0.3, 0, 1), lift: ease(clamp((e - 0.3) / 0.5, 0, 1)) * (1 - ease(clamp((e - (d - 0.65)) / 0.4, 0, 1))) }; }; // 장학관 손: 뻗기·들어 올리기
  // 변호사시험 2교시: 감독관 둘이 앞자리 수험생을 문으로 데리고 나가고, 셋이 되어 돌아온다 (글자 없이 '감독 강화'를 보여 준다)
  const EV_V = 2.9, EV_BACK = 3.0;
  function evPath(pts) { const seg = []; let L = 0; for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z); seg.push(l); L += l; } return { pts, seg, L }; }
  function evAt(P, d) { // 경로 위 d 지점과 그 지점의 진행 방향
    d = clamp(d, 0, P.L); let i = 0; while (i < P.seg.length - 1 && d > P.seg[i]) { d -= P.seg[i]; i++; }
    const a = P.pts[i], b = P.pts[i + 1], k = P.seg[i] ? clamp(d / P.seg[i], 0, 1) : 0;
    return { x: lerp(a.x, b.x, k), z: lerp(a.z, b.z, k), yaw: Math.atan2(b.x - a.x, b.z - a.z) };
  }
  function evPlan(E) {
    const sx = EVS.x, sz = EVS.z, fz = EX.zFront + 0.25, dx = EX.door.x, dSeat = 0.7, gA = 0.8, gB = -0.65;
    const P = evPath([{ x: sx - dSeat, z: sz }, { x: sx, z: sz }, { x: EX.AR, z: sz }, { x: EX.AR, z: fz }, { x: dx, z: fz }, { x: dx + 0.6, z: fz }]), Ld = P.L - 0.6;
    const pick = [evAt(P, dSeat + gA), evAt(P, dSeat + gB)], st = pick; // 종이 울리고 고개를 들면 감독관 둘이 이미 앞자리 양옆에 서 있다
    const T1 = 0.6, tStand = T1 + 0.45, tGo = tStand + 0.1;
    const passT = g => tGo + (Ld + 0.5 - (dSeat + g)) / EV_V, tOut = passT(gB), tBack = tOut + 0.5;
    const back = E.staff.slice(0, 3).map((s, j) => { const f = staffPlace0(s, j, E), R = evPath([{ x: dx + 0.3, z: fz }, { x: dx, z: fz }, { x: f.x, z: fz }, { x: f.x, z: f.z }]), e = tBack + j * 0.3; return { R, e, a: e + R.L / EV_BACK, f }; });
    const end = tBack + 1.1, endAll = Math.max(...back.map(b => b.a)) + 0.05; // end: 고개가 따라가는 장면 끝 · endAll: 셋이 각자 자리에 닿는 때(그동안은 걸어 들어오기만 한다)
    return { P, Ld, dSeat, gA, gB, st, pick, T1, tStand, tGo, tOut, tBack, back, end, endAll, sDoor: passT(0) - 0.5 / EV_V, doors: [passT(gA) - 0.5 / EV_V, tBack] };
  }
  function evStaff(i, t, E) { // 장면이 도는 동안 감독관 i의 자리 (null이면 평소대로)
    const V = E.evict.plan; if (!V || i > 2) return null;
    if (i < 2 && t < V.tOut + 0.01) {
      const g = i ? V.gB : V.gA, a = V.st[i], b = V.pick[i];
      if (t < V.tGo) return { x: b.x, z: b.z, yaw: Math.atan2(EVS.x - b.x, EVS.z - b.z), moving: false, headPitch: 0.35 };
      const d = V.dSeat + g + EV_V * (t - V.tGo), q = evAt(V.P, d); return { x: q.x, z: q.z, yaw: q.yaw, moving: true, headPitch: 0, walk: t, hiddenNow: d > V.Ld + 0.5 };
    }
    const B = V.back[i]; if (t < B.e) return { x: B.f.x, z: B.f.z, yaw: 0, moving: false, hiddenNow: true };
    if (t >= B.a) return null; const q = evAt(B.R, EV_BACK * (t - B.e)); return { x: q.x, z: q.z, yaw: q.yaw, moving: true, headPitch: 0, walk: t };
  }
  function staffPlace(s, i, E) { const ev = E.evict && E.evict.plan && E.evict.t < E.evict.plan.endAll ? evStaff(i, E.evict.t, E) : null, p = ev || staffPlace0(s, i, E); return E.boss && window.BOSS && BOSS[E.boss].place ? BOSS[E.boss].place(s, i, E, p) || p : p; } // 보스전은 자세를 덧입힌다
  function staffPlace0(s, i, E) { // 게임 규칙의 위치(왼쪽·오른쪽 통로, 앞뒤 u, 자리)를 방 좌표로
    const T = E.T;
    if (s.fixed) {
      const toMe = x => Math.atan2(EX.eye.x - x, EX.eye.z - (EX.layout === 'table' ? -0.95 : EX.frontZ - 1.55));
      const pitch = s.phase === 'stand' ? 0.55 : s.phase === 'tell' ? 0.22 : 0;
      if (EX.layout === 'table') { const fx = T.staff.map((d, j) => j).filter(j => T.staff[j].fixed), n = fx.length, k = fx.indexOf(i), x = (SEATS[n] || SEATS[3])[Math.max(0, k)];
        const bigAI = s.type === 'robot'; return { x, z: bigAI ? -0.7 : -0.95, y: bigAI ? -1.15 : 0, scale: bigAI ? 2.2 : 1, yaw: toMe(x) * (s.phase === 'stand' ? 0.3 : 1), moving: false, headPitch: pitch, seated: !bigAI }; }
      if (s.type === 'omega') return { x: 0, y: 2.3, z: -5.5, yaw: s.asleep ? 0 : s.phase === 'stand' ? (s.away ? 0.7 : -0.7) : 0, headPitch: s.phase === 'stand' ? -0.2 : 0.18, moving: false };
      return { x: -1.8, z: EX.frontZ - 1.55, yaw: toMe(-1.8), moving: false, headPitch: pitch, seated: true };
    }
    let x = s.side === 'L' ? EX.AL : EX.AR, z = zOf(s.u), yaw, moving = s.phase === 'walk', headPitch = 0;
    if (s.phase === 'cross') { // 앞이나 뒤 끝으로 가서 반대편 통로로 건너간다
      const k = clamp(s.t / s.dur, 0, 1), fromX = s.from === 'L' ? EX.AL : EX.AR, toX = s.from === 'L' ? EX.AR : EX.AL;
      const endZ = zOf(s.crossEnd === 'back' ? 0.06 : 0.94), z0 = zOf(s.u), sp = clamp(s.crossSplit == null ? 0.35 : s.crossSplit, 0.05, 0.95);
      z = lerp(z0, endZ, clamp(k / sp, 0, 1)); x = lerp(fromX, toX, clamp((k - sp) / (1 - sp), 0, 1));
      yaw = k < sp ? (endZ < z0 ? Math.PI : 0) : (toX > fromX ? Math.PI / 2 : -Math.PI / 2); moving = true;
    } else if (s.phase === 'walk') yaw = s.dir > 0 ? Math.PI : 0;
    else if (s.phase === 'stand') yaw = s.away ? (s.side === 'L' ? -Math.PI / 2 : Math.PI / 2) : Math.PI;
    else if (s.phase === 'help' && s.help) { // 손 든 수험생 쪽으로 가서 그쪽을 본다
      const k = clamp(s.help.k, 0, 1), tz = zOf(s.help.u);
      z = lerp(zOf(s.help.u0), tz, ease(k)); moving = k < 1; yaw = k < 1 ? (tz < zOf(s.help.u0) ? Math.PI : 0) : (s.side === 'L' ? -Math.PI / 2 : Math.PI / 2); headPitch = 0.25;
    } else if (s.phase === 'peek' && s.peek) { // 책상 건너편 바닥에 쪼그려 앉아 책상 너머로 눈만 내밀고 올려다본다
      const up = s.peek.stage === 'stare' ? clamp((tune.peek_stare - s.peek.t) / 0.25, 0, 1) : 0;
      return { x: EX.my.x - 0.39, y: -1.1 + up * 0.28, z: EX.my.z + 0.04, yaw: 0.75, moving: false, headPitch: -0.7, hiddenNow: s.peek.stage !== 'stare' };
    } else if (s.phase === 'check' && s.check) { // 내 책상 앞으로 와서 수험표·계산기를 본다
      const ax = s.side === 'L' ? EX.AL : EX.AR, az = zOf(s.check.u0), tx = EX.my.x + (s.side === 'L' ? -0.3 : 0.3), tz = EX.my.z - 0.62, k = ease(clamp(s.check.k, 0, 1));
      x = lerp(ax, tx, k); z = lerp(az, tz, k); yaw = Math.atan2(EX.eye.x - x, EX.eye.z - z); moving = s.check.stage !== 'at'; headPitch = s.check.stage === 'at' ? 0.5 : 0;
    } else yaw = Math.atan2(EX.eye.x - x, EX.eye.z - z);
    return { x, z, yaw, moving, headPitch };
  }
  function renderExam(E, now) {
    if (!W.ok) return;
    buildExam(E.tier);
    if (E.evict && EVS && EVS.sc === EX.scene && !E.evict.plan) { const V = E.evict.plan = evPlan(E); E.evict.end = V.end; E.evict.endAll = V.endAll; E.evict.arrive = V.back.map(b => b.a); E.evict.doors = V.doors; EX.evCam = null; }
    if (E.evict && E.evict.plan && E.evict.t < E.evict.plan.end + 0.5) { // 끌려 나가는 쪽 → 문 → 돌아오는 감독관들로 고개가 따라간다
      const V = E.evict.plan, t = E.evict.t; let fx, fz;
      if (t < V.sDoor) { const q = t < V.tGo ? { x: EVS.x, z: EVS.z } : evAt(V.P, V.dSeat + EV_V * (t - V.tGo)); fx = q.x; fz = q.z; }
      else if (t < V.tBack + 0.2) { fx = EX.door.x; fz = EX.door.z; }
      else { let on = V.back.map((b, j) => evStaff(j, t, E) || b.f).filter(p => !p.hiddenNow); if (!on.length) on = [EX.door]; fx = on.reduce((a, p) => a + p.x, 0) / on.length; fz = on.reduce((a, p) => a + p.z, 0) / on.length; }
      const fd = Math.hypot(fx - EX.eye.x, fz - EX.eye.z), ty = Math.atan2(-(fx - EX.eye.x), -(fz - EX.eye.z)), tp = Math.atan2(1.0 - EX.eye.y, fd), c = EX.evCam || (EX.evCam = { yaw: 0, pitch: -0.1, last: t }), k = 1 - Math.exp(-clamp(t - c.last, 0, 0.5) * 3.2);
      c.last = t; c.yaw += (ty - c.yaw) * k; c.pitch += (tp - c.pitch) * k; c.fov = (c.fov || 62) + (clamp(64 - (fd - 2.5) * 3.4, 36, 62) - (c.fov || 62)) * k; // 멀어질수록 그쪽에 눈이 간다(조금 당겨 본다)
      EX.views.evict = { yaw: c.yaw, pitch: c.pitch, fov: c.fov }; }
    if (EX_DOOR && EX_DOOR.sc === EX.scene) { const V = E.evict && E.evict.plan, t = E.evict ? E.evict.t : 0, win = (a, b) => clamp((t - a) / 0.4, 0, 1) * clamp((b - t) / 0.45, 0, 1); // 데리고 나갈 때 한 번, 셋이 돌아올 때 한 번 열린다
      const o = V ? Math.max(win(V.doors[0] - 0.55, V.tOut + 0.25), win(V.tBack - 0.35, V.back[2].e + 0.9)) : 0; EX_DOOR.hinge.rotation.y = -ease(o) * 1.35; EX_DOOR.glow.intensity = 2.6 * o; }
    const shS = EX.my && EX.views && E.staff.find(s => s.check && s.check.kind === 'sheet');
    if (shS) { const dx = EX.my.x + (shS.side === 'L' ? -0.3 : 0.3) - EX.eye.x, dz = EX.my.z - 0.62 - EX.eye.z; EX.views.sheet = { yaw: Math.atan2(-dx, -dz) * 0.85, pitch: Math.atan2(1.34 - EX.eye.y, Math.hypot(dx, dz)), fov: 60 }; } // 답안지를 든 장학관 쪽으로 고개를 든다
    const V = EX.views, a = V[E.prevView] || V.paper, b = V[E.view] || V.paper, k = ease(clamp(E.viewT, 0, 1)), cam = EX.cam;
    cam.position.copy(EX.eye); cam.position.y += Math.sin(now * 1.3) * 0.003;
    cam.rotation.order = 'YXZ'; cam.rotation.z = E.roll || 0; cam.rotation.y = lerp(a.yaw, b.yaw, k); cam.rotation.x = lerp(a.pitch, b.pitch, k) + Math.sin(now * 0.9) * 0.004;
    const fov = lerp(a.fov, b.fov, k); if (Math.abs(cam.fov - fov) > 0.01) { cam.fov = fov; cam.updateProjectionMatrix(); }
    const predict = E.gear.predict > 0 || (E.gear.thirdeye > 0 && E.T.mech.includes('threeeyes'));
    // 평행우주: 늘어난 감독관 모델을 만든다
    while (EX.staff.length < E.staff.length) { const s = E.staff[EX.staff.length], m = makeStaff(s.type); if (m) { m.root.traverse(o => { if (o.material && o.material.color && o.material !== m.cone.material) { o.material = o.material.clone(); o.material.color.offsetHSL(0.1 * EX.staff.length, 0, 0); } }); EX.scene.add(m.root); } EX.staff.push(m); }
    let helping = null, sheetAt = null;
    for (let i = E.staff.length; i < EX.staff.length; i++) if (EX.staff[i]) EX.staff[i].root.visible = false;
    E.staff.forEach((s, i) => {
      let m = EX.staff[i];
      if (m && m.type !== s.type) { EX.scene.remove(m.root); if (m.bb) EX.scene.remove(m.bb); if (m.gen) EX.scene.remove(m.gen); m = EX.staff[i] = makeStaff(s.type); if (m) EX.scene.add(m.root); } // 블록마다 감독관 교대
      if (!m) return;
      const p = staffPlace(s, i, E), toMe = Math.atan2(EX.eye.x - p.x, EX.eye.z - p.z);
      const headYaw = s.phase === 'tell' && !s.fixed ? clamp(angTo(0, toMe - (m.yaw || 0), 1), -1.1, 1.1) : 0;
      const dist = Math.hypot(EX.eye.x - p.x, EX.eye.z - p.z);
      if (s.phase === 'help' && s.help && s.help.k >= 1) helping = s;
      const frisk = i === 0 && E.intro && E.intro.kind === 'metal' && m.arms && m.arms.length > 1; // 입실 검사: 감독관이 내 앞 통로에 서서, 손에 든 탐지봉으로 나를 훑는다
      if (frisk) { const sw = ease(clamp((E.intro.t - 0.5) / 2.2, 0, 1)), fx = EX.eye.x - 0.62, fz = EX.eye.z - 1.5, face = Math.atan2(EX.eye.x - fx, EX.eye.z - fz), swing = lerp(0.34, -0.3, sw);
        p.x = fx; p.z = fz; p.yaw = face + swing; p.moving = false; p.headPitch = 0.14; p.hiddenNow = false; p.seated = false; }
      const hold = s.phase === 'check' && s.check && s.check.kind === 'sheet' && s.check.stage === 'at' ? sheetK(s.check) : null; if (hold) sheetAt = { p, hold };
      poseModel(m, { hold, sit: p.sit, raise: p.raise, x: p.x, y: p.y, z: p.z, scale: p.scale, yaw: p.yaw, moving: p.moving, walk: p.walk != null ? p.walk : s.walk, phase: s.phase === 'check' && s.check && s.check.stage === 'at' ? 'watch' : frisk ? 'watch' : s.phase, now, headYaw: frisk ? -(p.yaw - Math.atan2(EX.eye.x - p.x, EX.eye.z - p.z)) : headYaw, headPitch: p.headPitch,
        predict: predict && !s.asleep && !hold && !(E.evict && E.evict.plan && E.evict.t < E.evict.plan.endAll), asleep: s.asleep, away: s.away, hidden: s.out || s.blink > 0 || p.hiddenNow, seated: p.seated, coneLen: s.phase === 'watch' ? Math.max(0.6, dist - 0.55) : 3.5 });
      if (frisk) { const W2 = EX.gadget.wand, mt = E.intro.t; if (W2.parent !== m.arms[1]) { m.arms[1].add(W2); W2.position.set(0, -1.02, 0.1); W2.rotation.set(Math.PI / 2, 0, 0); W2.scale.setScalar(0.9); }
        m.arms[1].rotation.set(-1.17 + Math.sin(mt * 4.2) * 0.05, 0, 0); m.arms[0].rotation.set(0, 0, 0); W2.visible = true; }
      if (GEN_ROOM && !m.robot && m.type !== 'omega') { // 상자 몸 대신 걷는 동작이 들어간 생성 모델
        if (!m.gen) { m.gen = animMesh('proctorWalk'); if (m.gen) { m.gen.scale.setScalar(1.76); EX.scene.add(m.gen); } }
        if (m.gen) { const shown = m.root.visible; m.root.visible = false; m.gen.visible = shown;
          if (shown) { m.gen.userData.pose(now, !!p.moving); m.gen.position.set(p.x, p.y || 0, p.z); m.gen.rotation.y = (p.yaw || 0) + headYaw * 0.35 + PROCTOR_YAW; } }
      } else
      if (PXD && !m.robot && m.type !== 'omega') { // 3D 몸 대신 그림 한 장: 나를 향한 각도에 맞는 자세를 골라 세운다
        if (!m.bb) { m.bb = new THREE.Group(); m.bbs = {}; for (const n of ['stand', 'walk', 'back', 'side', 'lean']) { const sp = pxSprite(n, n === 'lean' ? 1.58 : 1.76); m.bbs[n] = sp; m.bb.add(sp); } EX.scene.add(m.bb); }
        const shown = m.root.visible; m.root.visible = false; m.bb.visible = shown;
        if (shown) {
          const cx = EX.cam.position.x, cz = EX.cam.position.z, toCam = Math.atan2(cx - p.x, cz - p.z);
          let rel = (p.yaw || 0) + headYaw * 0.5 - toCam; rel = ((rel + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
          const ar = Math.abs(rel), near = dist < 2.2, name = ar < 0.75 ? (p.moving ? 'walk' : (near && (s.phase === 'watch' || s.phase === 'tell' || s.phase === 'peek' || s.phase === 'check')) ? 'lean' : 'stand') : ar > 2.3 ? 'back' : 'side';
          const stepN = p.moving ? Math.floor(now / 0.3) % 2 : 0, bob = p.moving ? Math.abs(Math.sin(now / 0.3 * Math.PI)) * 0.03 : 0;
          for (const n in m.bbs) { const sp = m.bbs[n]; sp.visible = n === name; if (n === name) { const flip = n === 'side' ? (rel > 0 ? -1 : 1) : (n === 'walk' || n === 'back') && stepN ? -1 : 1; sp.scale.x = sp.userData.w * flip; } }
          m.bb.position.set(p.x, (p.y || 0) + bob, p.z); m.bb.rotation.y = toCam;
        }
      }
    });
    if (EX.paper && EX.paper.userData.home && !EX.home) { const P0 = EX.paper, h0 = P0.userData.home; // 바칼로레아: 답안지가 책상에서 장학관 손으로 올라갔다 내려온다
      if (sheetAt && sheetAt.hold.lift > 0) { const { p, hold } = sheetAt, k = hold.lift, yw = p.yaw || 0, hx = p.x + Math.sin(yw) * 0.42, hz = p.z + Math.cos(yw) * 0.42;
        let yH = yw + Math.PI; yH = ((yH + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
        P0.rotation.order = 'YXZ'; P0.position.set(lerp(h0.p.x, hx, k), lerp(h0.p.y, 1.2, k) + Math.sin(k * Math.PI) * 0.08, lerp(h0.p.z, hz, k));
        P0.rotation.set(lerp(h0.r.x, -0.5 + Math.sin(now * 0.9) * 0.04 * k, k), lerp(0, yH, k), Math.sin(now * 1.7) * 0.025 * k); P0.userData.moved = true; }
      else if (P0.userData.moved) { P0.position.copy(h0.p); P0.rotation.order = 'XYZ'; P0.rotation.copy(h0.r); P0.userData.moved = false; } }
    if (EX.raise) { // 손 든 수험생
      EX.raise.visible = !!helping;
      if (helping) { const tx = (helping.side === 'L' ? EX.AL : EX.AR) + (helping.side === 'L' ? -0.6 : 0.6); EX.raise.position.set(tx, 1.05 + Math.sin(now * 5) * 0.02, zOf(helping.help.u) + 0.3); }
    }
    if (EX.drone && E.drone) { const d = E.drone, x0 = EX.X0 + 0.5, x1 = EX.X1 - 0.5; // 순찰 드론: 머리 위에 오면 불빛이 붉어지고 빛기둥이 짙어진다
      EX.drone.visible = true; EX.drone.position.set(lerp(x0, x1, d.u), 1.95 + Math.sin(now * 5) * 0.04, lerp(EX.zFront, EX.zBack, d.v)); EX.drone.rotation.y = now * 0.6;
      EX.drone.userData.led.color.setHex(d.near ? (Math.floor(now * 6) % 2 ? 0xff3048 : 0xffb0b0) : d.close ? 0xffa030 : 0x6b2a2a); EX.drone.userData.beam.material.opacity = d.near ? 0.3 : d.close ? 0.16 : 0.07; }
    if (EVS && EVS.sc === EX.scene) { const m = EVS.m, V = E.evict && E.evict.plan, t = E.evict ? E.evict.t : 0;
      if (!V) poseModel(m, { x: EVS.x, z: EVS.z, yaw: Math.PI, seated: true, now, phase: 'stand', headPitch: 0.45, moving: false, walk: 0 });
      else if (t < V.tGo) { const up = clamp((t - V.T1) / 0.45, 0, 1); poseModel(m, { x: EVS.x, z: EVS.z, yaw: up > 0.6 ? Math.PI / 2 : Math.PI, sit: 1 - up, now, phase: 'stand', headPitch: 0.5, moving: false, walk: 0 }); }
      else { const d = V.dSeat + EV_V * (t - V.tGo), q = evAt(V.P, d); poseModel(m, { x: q.x, z: q.z, yaw: q.yaw, sit: 0, now, phase: 'walk', headPitch: 0.55, moving: true, walk: t, hidden: d > V.Ld + 0.5 }); } }
    if (MOLE && MOLE.obj && MOLE.sc === EX.scene && E.evict) { if (!E.evict.end) E.evict.end = 3.6; const o = MOLE.obj, t = E.evict.t; if (MOLE.x0 == null) MOLE.x0 = o.position.x; // 변호사시험 2교시: 앞자리 수험생이 일어나 통로로 끌려 나간다
      o.visible = t < 3.4; o.position.y = MOLE.y0 + Math.min(0.26, t * 0.5) + (t > 0.7 ? Math.abs(Math.sin(t * 9)) * 0.02 : 0); if (!MOLE.sprite) o.rotation.y = MOLE.ry0 + clamp((t - 0.5) / 0.5, 0, 1) * -Math.PI / 2; o.position.x = MOLE.x0 + Math.max(0, t - 0.9) * 1.5; o.rotation.z = t > 0.9 ? Math.sin(t * 9) * 0.05 : 0; MOLE.eyes.visible = false; }
    else if (MOLE && MOLE.obj && MOLE.sc === EX.scene) { const m = E.mole, o = MOLE.obj, caughtM = E.caught && E.caughtHow === 'mole', ph = caughtM ? 'look' : m ? m.phase : 'idle'; // 앞자리 비밀 감독관: 들썩 → 뒤돌아봄
      const turn = ph === 'look' ? clamp((caughtM ? 1 : m.k / 0.25), 0, 1) : 0;
      o.rotation.z = ph === 'tell' ? Math.sin(now * 22) * 0.05 : 0; o.position.y = MOLE.y0 + (ph === 'tell' ? Math.abs(Math.sin(now * 11)) * 0.035 : 0) ;
      if (MOLE.sprite) o.scale.x = MOLE.sx * (1 - 2 * turn) || 0.001; else o.rotation.y = MOLE.ry0 + Math.PI * turn;
      MOLE.eyes.visible = turn > 0.6; }
    if (EX.cctv) {
      const c = EX.cctv, on = E.cctv && E.cctv.on, jammed = E.gear.cctvjam >= 3;
      c.body.rotation.y = c.base + (E.cctv ? E.cctv.a : 0) * 0.9;
      c.led.color.setHex(on && !jammed ? (Math.floor(now * 4) % 2 ? 0xff3048 : 0xff9a9a) : 0x6b2a2a);
      c.cone.visible = predict; c.cone.material.color.setHex(on && !jammed ? 0xff3040 : 0xff8080); c.cone.material.opacity = on && !jammed ? 0.16 : 0.05; c.cone.scale.set(6, 6, 7);
    }
    if (EX.pulse && E.pulse) {
      const p = EX.pulse, warn = E.pulse.warn > 0 && Math.floor(now * 8) % 2 === 0;
      p.led.color.setHex(warn || E.pulse.active > 0 ? 0xff3048 : 0x5a2a2a);
      p.ring.visible = E.pulse.active > 0 && E.T.pulse !== 'drone';
      if (p.ring.visible) { const kk = 1 - E.pulse.active / 0.6; p.ring.scale.setScalar(0.3 + kk * 16); p.ring.material.opacity = 0.6 * (1 - kk) + 0.1; }
      if (EX.drone && E.T.pulse === 'drone') { const on = E.pulse.warn > 0 || E.pulse.active > 0; EX.drone.visible = on; if (on) { const kk = E.pulse.active > 0 ? 1 - E.pulse.active / 0.6 * 0.3 : 1 - E.pulse.warn / 1.6; EX.drone.position.set(EX.X0 - 0.9, 2.2 + Math.sin(now * 6) * 0.05, lerp(EX.zBack, EX.zFront, clamp(kk, 0, 1))); } }
    }
    if (EX.candle) { // 저승사자가 낌새를 보이거나 가까우면 촛불이 흔들린다
      const near = E.staff.some(s => s.type === 'reaper' && (s.phase === 'tell' || s.phase === 'watch' || Math.abs(zOf(s.u) - EX.my.z) < 1.2 && !s.blink));
      const f = near ? 0.6 + Math.abs(Math.sin(now * 23)) * 0.8 : 1 + Math.sin(now * 3) * 0.08;
      EX.candle.flame.scale.set(0.02 * (near ? 1.3 : 1), 0.04 * f, 0.02); EX.candle.flame.position.x = near ? Math.sin(now * 31) * 0.008 : 0; EX.candle.light.intensity = near ? 0.4 + Math.abs(Math.sin(now * 37)) * 0.8 : 0.8;
    }
    if (UW && UW.sc === EX.scene) uwRender(E, now); // [저승]
    if (EX.glasses) EX.glasses.forEach((gl, i) => {
      const q = E.qs[i], cur = i === E.qi && !E.over;
      if (q) gl.wine.material.color.setHex(q.color === 'white' ? 0xe8d070 : 0x6a0a1a);
      gl.wine.visible = !!q; gl.g.position.y = 0.77 + (cur ? 0.06 + Math.sin(now * 2) * 0.01 : 0); gl.g.position.z = 0.02 + (cur ? 0.14 : 0);
    });
    if (EX.home) { // 토플: 노트북 웹캠 불
      const w = E.staff[0], led = HUB.camLed;
      if (w && led) led.color.setHex(w.phase === 'watch' ? 0xff2030 : w.phase === 'tell' ? (Math.floor(now * 8) % 2 ? 0xffa030 : 0x3a1a10) : 0x2a1010);
      HUB.shopFace.material.map = EX.paperTex.t; HUB.shopFace.material.needsUpdate = true;
    }
    if (EX.watch) EX.watch.visible = E.gear.watch > 0;
    if (EX.pen) EX.pen.position.y = 0.772 + (E.fb ? Math.sin(E.fb.t * 40) * 0.006 : 0);
    if (EX.paper && EX.floaty && !EX.home) { EX.paper.rotation.z = Math.sin(now * 0.7) * 0.08 * E.float; EX.paper.position.y = 0.744 + Math.max(0, Math.sin(now * 1.1)) * 0.03 * E.float; }
    const sec = Math.floor(now) % 60; if (sec !== EX.clockSec) { EX.clockSec = sec; drawClockFace(sec); }
    if (EX.paperTex) {
      const q = E.qs[Math.min(E.qi, E.qs.length - 1)];
      const sig = [E.qi, E.part, E.ar, E.clear, E.dead, !!E.intro, E.es && E.es.done + '/' + Math.floor(E.es.w * 14), E.finalQ && Math.floor(now * 12), Math.min(3, Math.floor(E.scan * 3 + 1e-6)), E.ai, E.answers[E.qi], !!E.fb, E.scan > 0, q && q.pre, E.start > 0, E.breakT > 0, Math.floor((E.listen || 0) * 10), E.pulse && E.pulse.active > 0, E.pulse && E.pulse.warn > 0].join();
      if (E.holding || sig !== EX.paperSig) { EX.paperSig = sig; (EX.home ? drawScreenTexture : drawPaperTexture)(EX.paperTex.g, E, now); EX.paperTex.t.needsUpdate = true; }
      if (!EX.home && E.bh && (E.bh.phase !== 'idle' || E.bh.staleT > 0)) { drawPaperTexture(EX.paperTex.g, E, now); EX.paperTex.t.needsUpdate = true; EX.paperSig = ''; } // [블랙홀] 떨림·일그러짐·낡은 표시 잔상은 매 프레임 다시 그린다
    }
    if (EX.gadget && !EX.home) { // 책상 위 소품: 스캔하는 동안만 뚜껑이 열리고 화면이 켜진다
      const G2 = EX.gadget, st = hudStage(E), I = E.intro, ring = !E.caught && E.pulse && E.T.pulse === 'alert' && E.pulse.warn > 0 && E.gear.lens < 2, on = ring || (!I && E.start <= 0 && !E.over && !E.caught && (E.scan > 0 || (E.ai && !E.fb) || E.tryHold));
      G2.pcase.rotation.z = ring ? Math.sin(now * 80) * 0.035 : 0; // 재난문자: 필통이 떤다
      const wt = I && I.kind === 'water' ? I.t : -1; G2.bowl.visible = wt >= 0;
      if (wt >= 0) { const dn = clamp((wt - 0.9) / 0.5, 0, 1) - clamp((wt - 3.0) / 0.5, 0, 1); G2.dunk.position.y = lerp(0.3, 0.052, ease(dn)) + (dn >= 1 ? Math.sin(now * 9) * 0.004 : 0); G2.dunk.rotation.z = (1 - dn) * 0.25;
        G2.bubbles.forEach((m, i) => { const p = (now * 1.6 + i * 0.27) % 1; m.visible = dn >= 1; m.position.y = 0.05 + p * 0.07; }); }
      const kt = I && I.kind === 'sticker' ? I.t : -1; G2.shirt.visible = kt >= 0;
      if (kt >= 0) { const inn = ease(clamp(kt / 0.45, 0, 1)) * (1 - ease(clamp((kt - 3.1) / 0.4, 0, 1))); // 고개를 숙이면 옷이 화면 아래에서 올라온다
        G2.shirt.scale.setScalar(0.33); G2.shirt.quaternion.copy(cam.quaternion).multiply(_qs.setFromEuler(_es.set(-0.3, 0.05, 0.03)));
        _ps.set(0, -0.012 - (1 - inn) * 0.3, -0.2).applyQuaternion(cam.quaternion); G2.shirt.position.copy(cam.position).add(_ps);
        const ys = [0.15, 0, -0.15], at = [0.9, 1.4, 1.9]; G2.stickers.forEach((m, i) => { const p = clamp((kt - at[i]) / 0.12, 0, 1); m.visible = p > 0; m.scale.setScalar(0.4 + 0.6 * p + (p < 1 ? 0.2 : 0)); });
        const ti = kt < 1.15 ? 0 : kt < 1.65 ? 1 : 2, out = kt > 2.3 ? ease(clamp((kt - 2.3) / 0.5, 0, 1)) : 0; G2.sArm.position.y += (ys[ti] - G2.sArm.position.y) * 0.3; G2.sArm.position.x = 0.05 + (1 - ease(clamp(kt / 0.7, 0, 1))) * 0.7 + out * 0.8; }
      const mt = I && I.kind === 'metal' ? I.t : -1; if (mt < 0) G2.wand.visible = false; // 탐지봉은 감독관의 손에 붙어 있다 (위의 감독관 자세에서 붙인다)
      if (mt >= 0) { G2.wandLed.color.setHex(mt > 1.5 && mt < 2.3 && Math.floor(now * 10) % 2 ? 0xff3030 : 0x3a1010); }
      G2.pcase.visible = st === 'case'; G2.eraser.visible = st === 'eraser';
      G2.open += ((on ? 1 : 0) - G2.open) * 0.3; G2.lid.rotation.x = -G2.open * 1.95; G2.caseFace.visible = G2.open > 0.04;
      if (st === 'case' && G2.open > 0.04) { drawGadgetScreen(G2.caseT.g, E, now, 'case'); G2.caseT.t.needsUpdate = true; }
      if (st === 'eraser') { drawGadgetScreen(G2.lcdT.g, E, now, 'eraser'); G2.lcdT.t.needsUpdate = true; }
    }
    if (window.HAZ3D) HAZ3D(E, now, bossApi()); // 외계 시험의 방해 요소를 시험장에 그린다 (haz3d.js)
    if (E.boss && window.BOSS && BOSS[E.boss].world) BOSS[E.boss].world(E, now, bossApi()); // 보스전 연출: 카메라·시세판·눈·거울 속 나
    draw(EX.scene, cam, now);
  }
  let BAPI = null;
  function bossApi() { return BAPI || (BAPI = { THREE, EX, bx, pivot, plane, glowMat, mat, ownMat, makeHuman, makeStaff, poseModel, canvasTex, batch, psx, RW, RH, clamp, lerp, ease, angTo, renderer: () => renderer }); } // 보스 연출이 쓰는 3D 도구
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function pickChoice(x, y) { // 화면(640x360 좌표)에서 톡 친 자리 → 시험지 보기 번호
    if (!W.ok || !EX.scene || !EX.paper) return -1;
    ndc.set(x / RW * 2 - 1, -(y / RH * 2 - 1)); ray.setFromCamera(ndc, EX.cam);
    const hit = ray.intersectObject(EX.paper)[0]; if (!hit || !hit.uv) return -1;
    return EX.home ? screenRowAt(hit.uv.x * SCREEN_W, (1 - hit.uv.y) * SCREEN_H) : paperRowAt((1 - hit.uv.y) * PAPER_H);
  }

  // ---------- 허브: 고시원 방 ----------
  const HUB = { scene: null };
  // 구간별 거점 후보 (테스트: 주소에 ?hub=<이름>). 책상·노트북·일정표·폰의 자리는 고시원과 같고 벽·바닥·불빛·창밖·소품만 다르다
  const HUB_THEMES = {
    gosi: { bg: 0x15131c, amb: [0xcfc4ff, 0.95], hemi: 0xffe2c0, lamp: 0xffc888, tube: 0xe8f0ff, wall: ['#d6cfbf', '#cbc3b1', '#ddd6c8'], floorKind: 'tile', floorC: 0xb8a888, ceil: 0xd8d2c6, trim: 0x8a7a64, desk: [0xb08a5e, 0x8c6a46, 0x9c7a50], frame: 0xe8e4da, win: 1 },
    dorm: { door: 0xf0e8d8, bg: 0x1a2030, amb: [0xfff0d8, 1.05], hemi: 0xfff4e0, lamp: 0xffd8a0, tube: 0xfff6e8, wall: ['#e8e2d0', '#ddd6c2', '#f0ead8'], floorKind: 'wood', floorC: 0xffffff, ceil: 0xf0ece0, trim: 0x7a4a2a, desk: [0xd8b888, 0xb89468, 0xc8a878], frame: 0x7a4a2a, win: 'campus',
      extra(B) { B.box(0.5, 0.34, 0.01, 0x1f3a6a, 0.82, 1.55, -0.69); B.box(0.44, 0.06, 0.012, 0xf2e6c0, 0.82, 1.6, -0.688); B.box(0.3, 0.04, 0.012, 0xf2e6c0, 0.82, 1.5, -0.688); // 학교 깃발
        B.box(0.3, 0.42, 0.01, 0xc8442e, 0.82, 1.05, -0.69); B.box(0.24, 0.2, 0.012, 0xf4e8c8, 0.82, 1.1, -0.688); // 포스터
        B.box(0.42, 0.6, 0.24, 0x2e6a8a, 0.9, 0.3, -0.5); B.box(0.2, 0.05, 0.04, 0x1a1a20, 0.9, 0.63, -0.5); B.box(0.44, 0.03, 0.26, 0x1f4a62, 0.9, 0.3, -0.5); // 캐리어
        for (let i = 0; i < 3; i++) B.box(0.09, 0.09, 0.09, [0xe8442e, 0xf2c13a, 0x3a8a5a][i], 0.5 + i * 0.01, 0.8 + i * 0.09, -0.5); } }, // 컵라면 탑
    capsule: { door: 0xc8d4dc, bg: 0x0a0c12, amb: [0xd8e8ff, 0.9], hemi: 0xe0f0ff, lamp: 0x8fd8ff, tube: 0xbfe8ff, wall: ['#eef2f4', '#dfe6ea', '#ffffff'], floorKind: 'darktile', floorC: 0x9aa4b0, ceil: 0xf4f6f8, trim: 0x4ab8e8, desk: [0xf2f2ee, 0xd8dade, 0xe8eaee], frame: 0x2a2e36, win: 'tokyo',
      extra(B, sc, D) { B.box(D.X1 - D.X0, 0.03, 0.03, 0x4ad8ff, 0, 2.3, -0.68); B.box(D.X1 - D.X0, 0.03, 0.03, 0x4ad8ff, 0, 0.12, -0.68); // 조명 띠
        for (let i = 0; i < 5; i++) B.box(0.02, 2.2, 0.02, 0xc8d0d8, 0.5 + i * 0.18, 1.2, -0.69); // 플라스틱 벽 이음매
        B.box(0.5, 0.3, 0.02, 0x1a1e26, 0.86, 1.5, -0.68); B.box(0.44, 0.24, 0.022, 0x2a6a9a, 0.86, 1.5, -0.675); // 벽 붙박이 화면
        B.box(0.5, 0.16, 0.3, 0xf4f4f0, 0.86, 0.5, -0.5); B.box(0.5, 0.06, 0.3, 0x4ab8e8, 0.86, 0.61, -0.5); // 개어 둔 이불
        const l = new THREE.PointLight(0x4ad8ff, 1.2, 3, 2); l.position.set(0.8, 2.0, -0.2); sc.add(l); } },
    motel: { door: 0x5a2a1a, bg: 0x120c14, amb: [0xffc8b0, 0.8], hemi: 0xffb890, lamp: 0xffa860, tube: 0xffd0a8, wall: ['#a8683e', '#8c5430', '#b87848'], floorKind: 'darkwood', floorC: 0xc86a5a, ceil: 0xd8c8b0, trim: 0x4a2a1a, desk: [0x7a4a2a, 0x5a3418, 0x6a3e22], frame: 0x4a2a1a, win: 'neon',
      extra(B, sc) { B.box(0.52, 0.2, 0.03, 0xff3a8a, 0.84, 1.62, -0.68); B.box(0.4, 0.05, 0.035, 0xffe0f0, 0.84, 1.62, -0.67); // 네온 간판 빛이 새는 창 위 간판
        B.box(0.34, 0.44, 0.02, 0x2a1a12, 0.84, 1.1, -0.69); B.box(0.28, 0.38, 0.022, 0x7ab0c8, 0.84, 1.1, -0.685); // 싸구려 풍경화
        B.box(0.5, 0.5, 0.4, 0x6a3e22, 0.86, 0.25, -0.45); B.box(0.3, 0.22, 0.26, 0x2a2a30, 0.86, 0.62, -0.45); B.box(0.24, 0.16, 0.01, 0x8ab8d8, 0.86, 0.62, -0.31); // 브라운관 TV와 협탁
        const l = new THREE.PointLight(0xff3a8a, 1.6, 3.2, 2); l.position.set(0.6, 1.5, -0.3); sc.add(l); } },
    cabin: { door: 0x4a5262, bg: 0x05070c, amb: [0xb8d0ff, 0.85], hemi: 0xc8e0ff, lamp: 0x6ad8ff, tube: 0xd0e8ff, wall: ['#7a8494', '#667080', '#8a94a4'], floorKind: 'metal', floorC: 0xffffff, ceil: 0x5a6474, trim: 0x2a3240, desk: [0x8a94a6, 0x5a6474, 0x6a7484], frame: 0x2a3240, win: 'earth',
      extra(B, sc, D) { for (const x of [-1.15, -0.33, 0.15, 0.55, 0.95, 1.35]) B.box(0.05, 2.4, 0.05, 0x4a5262, x, 1.2, -0.68); // 선체 늑골: 시험 일정표(x −1.10~−0.38)를 가리지 않게 양옆에 세운다
        B.box(D.X1 - D.X0, 0.07, 0.07, 0x3a4250, 0, 2.2, -0.64); B.box(D.X1 - D.X0, 0.05, 0.05, 0xc87a3a, 0, 2.08, -0.65); // 배관
        B.box(0.1, 0.025, 0.02, 0x4affd8, (D.X0 - 1.15) / 2, 0.9, -0.69); B.box(D.X1 + 0.33, 0.025, 0.02, 0x4affd8, (D.X1 - 0.33) / 2, 0.9, -0.69); // 바닥 쪽 조명 띠 (일정표 아래는 비운다)
        for (let i = 0; i < 2; i++) { B.box(0.3, 0.9, 0.3, 0x5a6474, 0.7 + i * 0.34, 0.45, -0.5); B.box(0.24, 0.04, 0.02, 0xf2c13a, 0.7 + i * 0.34, 0.7, -0.34); B.box(0.04, 0.04, 0.02, 0x4affd8, 0.7 + i * 0.34, 0.8, -0.34); } // 사물함
        B.box(0.26, 0.34, 0.02, 0xe8e8e0, 0.86, 1.4, -0.68); B.box(0.2, 0.05, 0.022, 0xc8242a, 0.86, 1.5, -0.675); // 비상 수칙 판
        const l = new THREE.PointLight(0x4affd8, 1.0, 3, 2); l.position.set(0.7, 1.0, -0.2); sc.add(l); } },
    station: { door: 0xcbbce8, bg: 0x0c0818, amb: [0xe0c8ff, 0.95], hemi: 0xf0d8ff, lamp: 0xff9af0, tube: 0xe8d8ff, wall: ['#e8e0f4', '#d4c8ec', '#f4eeff'], floorKind: 'darktile', floorC: 0xb8a0e8, ceil: 0xf0e8ff, trim: 0xb07aff, desk: [0xf0ecf8, 0xc8bce0, 0xdcd4ec], frame: 0xb07aff, win: 'nebula',
      extra(B, sc, D) { B.box(D.X1 - D.X0, 0.04, 0.03, 0xff7af0, 0, 2.28, -0.68); B.box(0.03, 2.3, 0.03, 0xb07aff, 0.45, 1.2, -0.68); B.box(0.03, 2.3, 0.03, 0xb07aff, 1.2, 1.2, -0.68);
        for (let i = 0; i < 5; i++) B.box(0.08 + (i % 2) * 0.04, 0.08 + (i % 2) * 0.04, 0.08, [0xff7af0, 0x7afff0, 0xfff07a][i % 3], 0.6 + i * 0.13, 1.0 + ((i * 37) % 60) / 100, -0.45 - (i % 2) * 0.1, i * 0.7, i * 0.5); // 떠다니는 물건들
        B.box(0.5, 0.08, 0.34, 0xf4eeff, 0.84, 0.46, -0.48); B.box(0.06, 0.4, 0.06, 0xb07aff, 0.84, 0.22, -0.48); // 떠 있는 듯한 원반 탁자
        const l = new THREE.PointLight(0xff7af0, 1.4, 3.2, 2); l.position.set(0.8, 1.6, -0.2); sc.add(l); } },
    alien: { door: 0x5a3a80, bg: 0x061008, amb: [0xc8ffd8, 0.85], hemi: 0xd8ffc8, lamp: 0xc8ff6a, tube: 0xd8ffe8, wall: ['#3e6a5a', '#32584a', '#4a7a68'], floorKind: 'darkwood', floorC: 0x8a6ab8, ceil: 0x2a4a3e, trim: 0xc8ff6a, desk: [0x8a5ab0, 0x5a3a80, 0x6e4a98], frame: 0xc8ff6a, win: 'moons',
      extra(B, sc) { for (let i = 0; i < 6; i++) B.box(0.1 - i * 0.012, 0.2, 0.1 - i * 0.012, i % 2 ? 0x7ad06a : 0x5ab04a, 0.95 + Math.sin(i * 0.9) * 0.08, 0.1 + i * 0.2, -0.5, 0, i * 0.4); // 구불구불한 외계 식물
        for (let i = 0; i < 4; i++) B.box(0.09, 0.09, 0.09, 0xfff07a, 0.55 + i * 0.16, 1.9 - (i % 2) * 0.12, -0.6, 0.6, 0.6); // 빛나는 열매 전등
        B.box(0.4, 0.5, 0.02, 0x2a1a3a, 0.72, 1.2, -0.69); B.box(0.1, 0.1, 0.022, 0xff6a8a, 0.66, 1.3, -0.685); B.box(0.1, 0.1, 0.022, 0x6ad8ff, 0.8, 1.14, -0.685); B.box(0.07, 0.07, 0.022, 0xfff07a, 0.7, 1.05, -0.685); // 외계 가족사진
        const l = new THREE.PointLight(0xc8ff6a, 1.3, 3, 2); l.position.set(0.8, 1.7, -0.2); sc.add(l); } },
  };
  function windowTex(act) {
    const T = canvasTex(64, 48, false), g = T.g;
    if (act === 'campus') { g.fillStyle = '#8fc8f0'; g.fillRect(0, 0, 64, 48); g.fillStyle = '#ffffff'; g.fillRect(8, 6, 14, 4); g.fillRect(40, 10, 16, 4); g.fillStyle = '#9a4a34'; g.fillRect(4, 20, 30, 28); g.fillRect(14, 10, 8, 12); g.fillStyle = '#e8e0c8'; for (let i = 0; i < 4; i++) g.fillRect(8 + i * 7, 26, 4, 6); g.fillStyle = '#4a8a4a'; g.fillRect(0, 40, 64, 8); g.fillStyle = '#3a6a3a'; g.fillRect(44, 24, 12, 18); }
    else if (act === 'tokyo') { g.fillStyle = '#1a1030'; g.fillRect(0, 0, 64, 48); for (let i = 0; i < 9; i++) { g.fillStyle = '#0c0a1a'; g.fillRect(i * 7, 8 + (i * 5) % 14, 6, 40); g.fillStyle = ['#ff3a8a', '#3ad8ff', '#fff07a'][i % 3]; g.fillRect(i * 7 + 1, 12 + (i * 5) % 14, 2, 8); } g.fillStyle = '#ff3a3a'; g.fillRect(30, 2, 2, 46); g.fillRect(27, 10, 8, 1); }
    else if (act === 'neon') { g.fillStyle = '#14081c'; g.fillRect(0, 0, 64, 48); g.fillStyle = '#ff3a8a'; g.fillRect(6, 8, 30, 3); g.fillRect(6, 8, 3, 16); g.fillRect(6, 15, 22, 3); g.fillStyle = '#3ad8ff'; g.fillRect(40, 14, 3, 22); g.fillRect(40, 14, 16, 3); g.fillStyle = '#2a1a2a'; g.fillRect(0, 38, 64, 10); g.fillStyle = '#f5cc4a'; g.fillRect(10, 40, 6, 3); g.fillRect(44, 41, 6, 3); }
    else if (act === 'earth') { g.fillStyle = '#02030a'; g.fillRect(0, 0, 64, 48); g.fillStyle = '#ffffff'; for (let i = 0; i < 26; i++) g.fillRect((i * 17) % 63, (i * 11) % 47, 1, 1); g.fillStyle = '#2a6ad9'; g.beginPath(); g.arc(34, 30, 17, 0, 7); g.fill(); g.fillStyle = '#3a9a5a'; g.fillRect(26, 22, 10, 7); g.fillRect(36, 30, 8, 9); g.fillStyle = '#e8f4ff'; g.fillRect(24, 34, 12, 2); g.fillRect(34, 18, 10, 2); }
    else if (act === 'nebula') { g.fillStyle = '#12082a'; g.fillRect(0, 0, 64, 48); for (let i = 0; i < 40; i++) { g.fillStyle = ['#ff7af0', '#7a9aff', '#b07aff'][i % 3]; g.globalAlpha = 0.35; g.fillRect((i * 23) % 60, (i * 13) % 44, 8, 5); } g.globalAlpha = 1; g.fillStyle = '#ffffff'; for (let i = 0; i < 20; i++) g.fillRect((i * 19) % 63, (i * 7) % 47, 1, 1); g.fillStyle = '#f2e6c0'; g.fillRect(8, 30, 40, 2); g.fillStyle = '#e8c88a'; g.beginPath(); g.arc(28, 31, 7, 0, 7); g.fill(); }
    else if (act === 'moons') { g.fillStyle = '#1a3a2e'; g.fillRect(0, 0, 64, 48); g.fillStyle = '#ffe07a'; g.beginPath(); g.arc(18, 14, 8, 0, 7); g.fill(); g.fillStyle = '#ff9ad0'; g.beginPath(); g.arc(44, 20, 5, 0, 7); g.fill(); g.fillStyle = '#0e241c'; for (let i = 0; i < 6; i++) { g.fillRect(i * 11, 30 - (i * 7) % 9, 4, 20); g.beginPath(); g.arc(i * 11 + 2, 30 - (i * 7) % 9, 5, 0, 7); g.fill(); } }
    else if (act === 3) { g.fillStyle = '#05040e'; g.fillRect(0, 0, 64, 48); g.fillStyle = '#ffffff'; for (let i = 0; i < 26; i++) g.fillRect((i * 17) % 63, (i * 11) % 47, 1, 1); g.fillStyle = '#c87a4a'; g.fillRect(36, 10, 14, 14); g.fillStyle = '#e8a06a'; g.fillRect(38, 12, 7, 5); g.fillStyle = '#8a6cd6'; g.fillRect(30, 16, 26, 1); }
    else if (act === 2) { g.fillStyle = '#2a2a4a'; g.fillRect(0, 0, 64, 48); g.fillStyle = '#c86a4a'; g.fillRect(0, 22, 64, 4); for (let i = 0; i < 7; i++) { g.fillStyle = '#14142a'; g.fillRect(i * 9 + 2, 16 + (i * 7) % 10, 7, 32); } g.fillStyle = '#14142a'; g.fillRect(26, 6, 4, 42); g.fillRect(22, 14, 12, 2); g.fillStyle = '#f5cc4a'; for (let i = 0; i < 16; i++) g.fillRect((i * 13) % 62, 28 + (i * 7) % 18, 1, 1); }
    else { g.fillStyle = '#0d1430'; g.fillRect(0, 0, 64, 48); for (let i = 0; i < 9; i++) { g.fillStyle = '#080b18'; g.fillRect(i * 7, 20 + (i * 5) % 12, 6, 30); } g.fillStyle = '#f5cc4a'; for (let i = 0; i < 18; i++) g.fillRect((i * 13) % 62, 26 + (i * 7) % 20, 1, 1); }
    T.t.needsUpdate = true; return T.t;
  }
  const HUB_KEEP = {}; // 방을 새로 지어도(이사) 그대로 쓰는 화면 캔버스들
  function buildHub() {
    if (HUB.scene) return;
    const sc = new THREE.Scene(), B = batch(), hubAct = CONFIG.tiers[typeof nextTierIndex === 'function' ? nextTierIndex(G) : 0].act, THN = new URLSearchParams(location.search).get('hub') || CONFIG.hub_by_act[hubAct - 1], TH = HUB_THEMES[THN] || HUB_THEMES.gosi; HUB.themed = TH !== HUB_THEMES.gosi; HUB.builtAct = hubAct;
    sc.background = new THREE.Color(TH.bg); sc.fog = new THREE.Fog(TH.bg, 3, 7);
    sc.add(new THREE.AmbientLight(TH.amb[0], TH.amb[1])); sc.add(new THREE.HemisphereLight(TH.hemi, 0x1c1620, 0.8));
    const lamp = new THREE.PointLight(TH.lamp, 1.1, 2.4, 2); lamp.position.set(-0.85, 0.98, -0.3); sc.add(lamp);
    const tube = new THREE.PointLight(TH.tube, 1.8, 5, 1.6); tube.position.set(0, 2.25, 0.6); sc.add(tube);
    const X0 = -1.25, X1 = 1.25, Z0 = -0.7, Z1 = 2.2, HY = 2.4;
    const genProps = (new URLSearchParams(location.search).get('props') || CONFIG.hub_props) === 'gen' && window.MODELS && window.MODELS.lamp && window.TEXTURES; // 소품·표면을 생성한 것으로 바꿔 끼울지
    const genTex = (n, rx, ry) => { const t = new THREE.Texture(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; const img = new Image(); img.onload = () => { t.image = img; t.needsUpdate = true; }; img.src = window.TEXTURES[n]; return t; };
    const wallT = canvasTex(32, 32, false); { const g = wallT.g; g.fillStyle = TH.wall[0]; g.fillRect(0, 0, 32, 32); g.fillStyle = TH.wall[1]; for (let i = 0; i < 8; i++) g.fillRect(i * 4 + 1, 0, 1, 32); g.fillStyle = TH.wall[2]; g.fillRect(0, 15, 32, 1); wallT.t.wrapS = wallT.t.wrapT = THREE.RepeatWrapping; wallT.t.repeat.set(8, 6); wallT.t.needsUpdate = true; }
    const wallM = psx(new THREE.MeshLambertMaterial({ map: genProps ? genTex('wall', 2.2, 2) : wallT.t }));
    plane(sc, X1 - X0, HY, wallM, 0, HY / 2, Z0); plane(sc, Z1 - Z0, HY, wallM, X0, HY / 2, (Z0 + Z1) / 2, 0, Math.PI / 2); plane(sc, Z1 - Z0, HY, wallM, X1, HY / 2, (Z0 + Z1) / 2, 0, -Math.PI / 2);
    const fl = floorTex(TH.floorKind); fl.repeat.set(4, 5); plane(sc, X1 - X0, Z1 - Z0, psx(new THREE.MeshLambertMaterial(genProps ? { map: genTex('floor', 2.5, 3) } : { map: fl, color: TH.floorC })), 0, 0, (Z0 + Z1) / 2, -Math.PI / 2);
    B.box(X1 - X0, 0.04, Z1 - Z0, TH.ceil, 0, HY, (Z0 + Z1) / 2); B.box(0.6, 0.04, 0.12, 0xf4f4f0, 0, HY - 0.03, 0.6);
    B.box(X1 - X0, 0.08, 0.02, TH.trim, 0, 0.04, Z0 + 0.01);
    // 책상과 위 선반
    if (genProps) { // 나뭇결을 입힌 책상과 선반
      const top = psx(new THREE.MeshLambertMaterial({ map: genTex('wood', 2, 1) })), side = psx(new THREE.MeshLambertMaterial({ map: genTex('wood', 1, 1), color: 0xc9b8a4 }));
      bx(sc, 1.62, 0.04, 0.62, 0, -0.43, 0.74, -0.38, top); bx(sc, 0.04, 0.72, 0.58, 0, -1.21, 0.36, -0.38, side); bx(sc, 0.04, 0.72, 0.58, 0, 0.35, 0.36, -0.38, side);
      bx(sc, 1.62, 0.03, 0.26, 0, -0.43, 1.46, -0.56, top); bx(sc, 0.03, 0.2, 0.26, 0, 0.36, 1.36, -0.56, side);
    } else {
      B.box(1.62, 0.04, 0.62, TH.desk[0], -0.43, 0.74, -0.38); B.box(0.04, 0.72, 0.58, TH.desk[1], -1.21, 0.36, -0.38); B.box(0.04, 0.72, 0.58, TH.desk[1], 0.35, 0.36, -0.38);
      B.box(1.62, 0.03, 0.26, TH.desk[2], -0.43, 1.46, -0.56); B.box(0.03, 0.2, 0.26, TH.desk[1], 0.36, 1.36, -0.56);
    }
    const spines = [0xb8362e, 0x2b5f8a, 0xe7c13a, 0x3f7a4a, 0xd9705f, 0x24324a, 0x8a5a32];
    if (!genProps) {
    for (let i = 0; i < 5; i++) B.box(0.035, 0.22 + (i % 3) * 0.02, 0.18, spines[i % spines.length], -1.2 + i * 0.042, 1.585 + (i % 3) * 0.01, -0.58); // 책은 선반 왼쪽 끝, 오른쪽 끝은 TV 자리
    for (let i = 0; i < 4; i++) B.box(0.22, 0.04, 0.3, spines[(i + 2) % spines.length], 0.22, 0.78 + i * 0.04, -0.52, 0, i * 0.12); // 수험서 더미
    B.box(0.05, 0.11, 0.05, 0x2a6ad9, 0.3, 0.815, -0.16); B.box(0.05, 0.11, 0.05, 0x22a058, 0.24, 0.815, -0.24); // 에너지 음료
    B.box(0.03, 0.34, 0.03, 0x2a2a30, -1.13, 0.93, -0.5); B.box(0.18, 0.08, 0.12, 0x2a2a30, -1.09, 1.1, -0.42); B.box(0.12, 0.02, 0.12, 0x2a2a30, -1.13, 0.77, -0.5); // 스탠드 (일정표를 가리지 않게 책상 왼쪽 끝)
    } else { // [이름, x, 바닥 y, z, 높이, 돌림]
      for (const [n, x, y, z, h, yaw, w] of [['lamp', -1.0, 0.76, -0.5, 0.44, 3.5], ['books', 0.22, 0.76, -0.5, 0.18, 0.25, 0.3], ['cans', 0.3, 0.76, -0.2, 0.125, -0.3], ['shelf', 0.1, 1.475, -0.57, 0.24, 0], ['ramen', -0.72, 0.76, -0.34, 0.14, 0.4], ['mug', -0.15, 0.76, -0.56, 0.15, 0.3], ['strip', 0.06, 0.76, -0.63, 0.09, 1.57], ['tray', -0.88, 0.76, -0.14, 0.11, 0.5]]) { const m = modelMesh(n); if (m) { m.position.set(x, y, z); m.scale.set(w || h, h, w || h); m.rotation.y = yaw; sc.add(m); } } // w: 높이와 따로 주는 가로 크기
    }
    // 창문 (막마다 바깥 풍경이 바뀐다)
    const winMat = new THREE.MeshBasicMaterial({ map: windowTex(TH.win), fog: false });
    plane(sc, 0.5, 0.38, winMat, 0.05, 1.16, Z0 + 0.01);
    B.box(0.56, 0.03, 0.03, TH.frame, 0.05, 1.36, Z0 + 0.02); B.box(0.56, 0.03, 0.03, TH.frame, 0.05, 0.96, Z0 + 0.02); B.box(0.03, 0.42, 0.03, TH.frame, -0.22, 1.16, Z0 + 0.02); B.box(0.03, 0.42, 0.03, TH.frame, 0.32, 1.16, Z0 + 0.02); B.box(0.02, 0.4, 0.02, TH.frame, 0.05, 1.16, Z0 + 0.025);
    if (TH.extra) TH.extra(B, sc, { X0, X1, Z0, Z1, HY });
    sc.add(B.mesh());
    // 누르는 물건들 (각자 재질을 따로 둬서 마우스를 올리면 밝아진다)
    const hot = { exams: [], gear: [], log: [], go: [], parcel: [], tv: [] }, hm = (key, color, extra) => { const m = ownMat(color, extra); hot[key].push(m); return m; };
    const cork = canvasTex(256, 176, false), boardT = HUB_KEEP.boardT || (HUB_KEEP.boardT = canvasTex(800, 534, true)); // boardT: 다가갔을 때의 진짜 일정표
    const board = pivot(sc, -0.74, 1.12, Z0 + 0.012); bx(board, 0.72, 0.5, 0.02, 0, 0, 0, 0, genProps ? hm('exams', 0xb89a80, { map: genTex('wood', 1, 1), flatShading: false }) : hm('exams', 0x8a6a46));
    const corkFace = plane(board, 0.66, 0.44, hm('exams', 0xffffff, { map: cork.t }), 0, 0, 0.012);
    const boardFace = plane(board, 0.66, 0.44, new THREE.MeshBasicMaterial({ map: boardT.t, fog: false, color: 0xe6e0d4 }), 0, 0, 0.0128); boardFace.visible = false; // 다가갔을 때만 보이는 진짜 일정표
    const laptop = pivot(sc, -0.42, 0.76, -0.33); bx(laptop, 0.36, 0.02, 0.24, 0, 0, 0, 0, hm('gear', 0x3a3d46));
    if (genProps) plane(laptop, 0.352, 0.232, hm('gear', 0xffffff, { map: genTex('keys', 1, 1), flatShading: false }), 0, 0.0105, 0, -Math.PI / 2); // 자판 면
    const scr = pivot(laptop, 0, 0.0, -0.12); scr.rotation.x = -0.32; bx(scr, 0.36, 0.23, 0.012, 0, 0, 0.115, 0, hm('gear', 0x2c2f38));
    const screenT = HUB_KEEP.screenT || (HUB_KEEP.screenT = canvasTex(800, 480, true));
    const shop = canvasTex(256, 160, false), shopFace = plane(scr, 0.33, 0.2, new THREE.MeshBasicMaterial({ map: shop.t, fog: false }), 0, 0.115, 0.008); hot.gear.push(shopFace.material);
    const camLed = glowMat(0x2a1010); bx(scr, 0.01, 0.006, 0.004, 0, 0, 0.222, 0.008, camLed); bx(scr, 0.016, 0.01, 0.003, 0x0a0a0e, 0.016, 0.222, 0.007);
    const phone = pivot(sc, 0.06, 0.765, -0.2); phone.rotation.set(-Math.PI / 2, 0, -0.25); bx(phone, 0.08, 0.15, 0.012, 0, 0, 0, 0, hm('log', 0x1a1a20));
    const phoneT = HUB_KEEP.phoneT || (HUB_KEEP.phoneT = canvasTex(64, 120, false)), phoneFace = plane(phone, 0.07, 0.135, new THREE.MeshBasicMaterial({ map: phoneT.t, fog: false }), 0, 0, 0.0065); hot.log.push(phoneFace.material);
    const held = pivot(sc, 0, -5, 0); held.visible = false; bx(held, 0.1, 0.16, 0.01, 0, 0, 0, 0, ownMat(0x0c0c10)); // 집어 든 폰: 카메라 앞에 든다
    const heldMail = pivot(sc, 0, -5, 0); heldMail.visible = false; // 집어 든 성적 통지표
    const mailT = HUB_KEEP.mailT || (HUB_KEEP.mailT = canvasTex(PAPER_W, PAPER_H, true)), mailFace = plane(heldMail, 0.118, 0.164, new THREE.MeshBasicMaterial({ map: mailT.t, fog: false, color: 0xe6e0d2 }), 0, 0, 0); bx(heldMail, 0.118, 0.164, 0.0006, 0x2a2620, 0.003, -0.004, -0.004);
    const heldT = HUB_KEEP.heldT || (HUB_KEEP.heldT = canvasTex(504, 810, true)), heldFace = plane(held, 0.092, 0.148, new THREE.MeshBasicMaterial({ map: heldT.t, fog: false }), 0, 0, 0.0056);
    const door = pivot(sc, 0.84, 1.03, Z0 + 0.03);
    bx(door, 0.82, 2.06, 0.05, 0, 0, 0, 0, genProps ? hm('go', 0xffffff, { map: genTex('door', 1, 1), flatShading: false }) : hm('go', TH.door || 0x7a5a3c)); bx(door, 0.06, 0.06, 0.08, 0, -0.3, -0.02, 0.05, hm('go', 0xd4b25a));
    const sign = canvasTex(128, 96, false); plane(door, 0.36, 0.27, hm('go', 0xffffff, { map: sign.t }), 0.05, 0.35, 0.03);
    // 택배 상자 (문 앞)
    const parcel = pivot(sc, 0.22, 0.94, -0.5); parcel.rotation.y = 0.2; parcel.scale.setScalar(0.8); // 수험서 더미 위에 올려 둔 택배
    bx(parcel, 0.32, 0.2, 0.24, 0, 0, 0.1, 0, genProps ? hm('parcel', 0xffffff, { map: genTex('card', 1, 1), flatShading: false }) : hm('parcel', 0xb98a56)); bx(parcel, 0.33, 0.012, 0.05, 0xd8c8a0, 0, 0.205, 0);
    const lidA = pivot(parcel, 0, 0.2, -0.12), lidB = pivot(parcel, 0, 0.2, 0.12);
    bx(lidA, 0.32, 0.012, 0.12, 0, 0, 0, 0.06, (genProps ? hm('parcel', 0xffffff, { map: genTex('card', 1, 1), flatShading: false }) : hm('parcel', 0xc89a62))); bx(lidB, 0.32, 0.012, 0.12, 0, 0, 0, -0.06, (genProps ? hm('parcel', 0xffffff, { map: genTex('card', 1, 1), flatShading: false }) : hm('parcel', 0xc89a62)));
    const label = canvasTex(64, 32, false); { const g = label.g; g.fillStyle = '#fbf9f1'; g.fillRect(0, 0, 64, 32); g.fillStyle = '#d9473f'; g.fillRect(0, 0, 64, 8); g.fillStyle = '#2a2838'; g.font = `800 11px ${FONT}`; g.fillText('AI마켓', 6, 22); label.t.needsUpdate = true; }
    plane(parcel, 0.12, 0.06, psx(new THREE.MeshLambertMaterial({ map: label.t })), 0.06, 0.12, 0.121);
    parcel.visible = false;
    const mail = pivot(sc, -0.62, 0.762, -0.02); mail.rotation.y = 0.4; // 우편으로 온 성적 통지표
    bx(mail, 0.2, 0.006, 0.13, 0, 0, 0, 0, (hot.mail = [ownMat(0xf4f1e6)])[0]); bx(mail, 0.06, 0.007, 0.03, 0xd9473f, 0.06, 0.001, -0.04); bx(mail, 0.1, 0.007, 0.004, 0x8a8f99, -0.03, 0.001, 0.02); mail.visible = false; mail.userData.action = 'mail';
    // 산 장비가 책상과 선반에 놓인다
    const gear = {};
    const glasses = pivot(sc, -0.06, 0.745, -0.42); bx(glasses, 0.1, 0.012, 0.08, 0x2a2434, 0, 0.006, 0); bx(glasses, 0.012, 0.11, 0.012, 0x2a2434, 0, 0.06, 0);
    const lensM = glowMat(0x9fe0ff); lensM.transparent = true; lensM.opacity = 0.75;
    const gl = pivot(glasses, 0, 0.125, 0.01);
    for (const s of [-1, 1]) { bx(gl, 0.07, 0.05, 0.008, 0x2a2434, s * 0.042, 0, 0, hm('gear', 0x2a2434)); bx(gl, 0.058, 0.04, 0.009, 0, s * 0.042, 0, 0.001, lensM); bx(gl, 0.006, 0.006, 0.12, 0x2a2434, s * 0.078, 0.012, -0.06); }
    bx(gl, 0.016, 0.008, 0.008, 0x2a2434, 0, 0.012, 0);
    gear.predict = bx(gl, 0.01, 0.01, 0.01, 0, 0.075, 0.03, 0.006, glowMat(0xf6a234));
    gear.thirdeye = bx(gl, 0.02, 0.02, 0.008, 0, 0, 0.04, 0.004, glowMat(0x7ad06a));
    gear.wide = bx(gl, 0.16, 0.012, 0.01, 0x45e5ee, 0, -0.03, 0.005);
    const item = (id, x, y, z, parts) => { const p = pivot(sc, x, y, z); for (const [w, h, d, c, px, py, pz, glow] of parts) bx(p, w, h, d, c, px, py, pz, glow ? glowMat(c) : undefined); gear[id] = p; return p; };
    item('watch', -0.66, 0.75, -0.16, [[0.05, 0.012, 0.14, 0x3a3248, 0, 0, 0], [0.05, 0.016, 0.05, 0x20303a, 0, 0.006, 0], [0.04, 0.004, 0.04, 0x45e5ee, 0, 0.015, 0, 1]]);
    item('earbud', -0.2, 0.755, -0.16, [[0.06, 0.03, 0.045, 0xf2f2f4, 0, 0, 0], [0.008, 0.008, 0.004, 0x45e5ee, 0, 0.004, 0.024, 1]]);
    item('autoscan', -0.86, 0.746, -0.2, [[0.09, 0.006, 0.07, 0x1f6b3a, 0, 0, 0], [0.03, 0.01, 0.03, 0x111111, 0.01, 0.006, 0], [0.07, 0.002, 0.004, 0xe7c13a, 0, 0.004, 0.025]]);
    item('model', -0.98, 0.8, -0.58, [[0.18, 0.1, 0.12, 0x15161c, 0, 0, 0], [0.16, 0.01, 0.002, 0x8a5cff, 0, 0, 0.061, 1]]);
    item('cctvjam', -1.12, 0.79, -0.26, [[0.1, 0.08, 0.08, 0xd4d6de, 0, 0, 0], [0.01, 0.12, 0.01, 0x2a2a30, 0.03, 0.1, 0], [0.02, 0.02, 0.004, 0xea4540, -0.02, 0.01, 0.041, 1]]);
    item('jammer', -1.12, 0.79, -0.08, [[0.1, 0.07, 0.07, 0x3a3f4a, 0, 0, 0], [0.01, 0.16, 0.01, 0x2a2a30, -0.03, 0.12, 0], [0.02, 0.02, 0.004, 0x45e5ee, 0.02, 0.01, 0.036, 1]]);
    const coach = item('coach', -0.2, 0.8, -0.62, [[0.16, 0.11, 0.008, 0x1a1a20, 0, 0, 0], [0.14, 0.09, 0.002, 0x2f7a5a, 0, 0, 0.005, 1]]); coach.rotation.x = -0.25;
    item('deepcam', -0.42, 0.98, -0.47, [[0.04, 0.025, 0.02, 0x15151a, 0, 0, 0], [0.01, 0.01, 0.004, 0x62d84a, 0, 0, 0.011, 1]]);
    item('autooff', -0.74, 0.746, -0.12, [[0.05, 0.006, 0.05, 0x3a1f6b, 0, 0, 0], [0.02, 0.008, 0.02, 0xd8b04a, 0, 0.004, 0]]);
    // 2막·3막 장비는 선반 위에 한 줄로
    const shelf = [['glasscase', [[0.1, 0.04, 0.05, 0x7a5a3a, 0, 0.02, 0]]], ['gazefix', [[0.04, 0.02, 0.04, 0xe8eef4, 0, 0.01, 0], [0.04, 0.004, 0.04, 0x45e5ee, 0, 0.022, 0, 1]]],
      ['eyedrop', [[0.025, 0.07, 0.025, 0xf4f4f8, 0, 0.035, 0], [0.012, 0.02, 0.012, 0x2a8af0, 0, 0.08, 0]]], ['calccover', [[0.06, 0.012, 0.09, 0x2a2c34, 0, 0.006, 0], [0.05, 0.004, 0.025, 0x9ae0a0, 0, 0.014, -0.025, 1]]],
      ['screenfilm', [[0.03, 0.06, 0.03, 0xc8d0d8, 0, 0.03, 0]]], ['taste', [[0.05, 0.03, 0.03, 0x8a1a2a, 0, 0.015, 0], [0.01, 0.01, 0.01, 0xff5a8a, 0, 0.035, 0, 1]]],
      ['candle', [[0.025, 0.06, 0.025, 0xf4efe0, 0, 0.03, 0], [0.012, 0.022, 0.012, 0xffb04a, 0, 0.072, 0, 1]]], ['clone', [[0.06, 0.08, 0.01, 0x8a6a46, 0, 0.04, 0], [0.05, 0.06, 0.002, 0x8a6cd6, 0, 0.04, 0.006, 1]]],
      ['humanmod', [[0.05, 0.006, 0.05, 0x6b1f3a, 0, 0.003, 0], [0.02, 0.01, 0.02, 0xe8e8e8, 0, 0.008, 0]]], ['offbeat', [[0.05, 0.08, 0.04, 0x5a3a24, 0, 0.04, 0], [0.004, 0.07, 0.004, 0xe8e8e8, 0, 0.07, 0.022]]]];
    shelf.forEach(([id, parts], i) => item(id, 0.04 + i * 0.034 - 0.6, 1.475, -0.5 + (i % 2) * 0.02, parts));
    const bots = [];
    for (let i = 0; i < 8; i++) { const b = pivot(sc, -0.96 + i * 0.1, 1.475, -0.52); bx(b, 0.06, 0.05, 0.05, 0x9aa3b8, 0, 0.04, 0); bx(b, 0.05, 0.02, 0.006, 0, 0, 0.045, 0.026, glowMat(0x7ff6ff)); bx(b, 0.008, 0.03, 0.008, 0x2a2a30, 0, 0.08, 0); bx(b, 0.07, 0.03, 0.06, 0x8a5a32, 0, 0.01, 0); b.visible = false; bots.push(b); }
    // 선반 오른쪽 위의 작은 TV: 뉴스가 나오고, 밑에는 전수조사 빨간 등 3개
    const tv = pivot(sc, 0.16, 1.475, -0.57); tv.rotation.y = -0.1; tv.userData.action = 'tv';
    bx(tv, 0.4, 0.27, 0.07, 0, 0, 0.155, 0, hm('tv', 0x2a2930)); bx(tv, 0.14, 0.02, 0.09, 0x1b1a20, 0, 0.01, 0); bx(tv, 0.012, 0.1, 0.012, 0x4a4a52, 0.13, 0.33, -0.01).rotation.z = -0.35; bx(tv, 0.012, 0.1, 0.012, 0x4a4a52, 0.09, 0.33, -0.01).rotation.z = 0.3;
    const tvT = canvasTex(640, 360, true), tvFace = plane(tv, 0.36, 0.2025, new THREE.MeshBasicMaterial({ map: tvT.t, fog: false }), 0, 0.178, 0.036);
    const tvLamps = [-1, 0, 1].map(i => { const m = glowMat(0x3a1a1c); bx(tv, 0.016, 0.016, 0.008, 0, i * 0.034, 0.05, 0.036, m); return m; });
    // 책상 위 초콜릿: 누르면 집었다가 내려놓는다 (단맛은 참는 거라고 했다)
    const choco = pivot(sc, -0.76, 0.762, -0.3); choco.rotation.y = 0.45; choco.userData.action = 'choco';
    bx(choco, 0.13, 0.018, 0.055, 0x5a2c16, 0, 0.009, 0); bx(choco, 0.075, 0.02, 0.057, 0xc8302e, -0.03, 0.009, 0); bx(choco, 0.05, 0.021, 0.02, 0xf0d9a0, -0.03, 0.009, 0); for (let i = 0; i < 2; i++) bx(choco, 0.004, 0.019, 0.055, 0x3e1c0c, 0.025 + i * 0.03, 0.0095, 0);
    const cam = new THREE.PerspectiveCamera(60, RW / RH, 0.02, 30); cam.rotation.order = 'YXZ';
    HUB.mail = mail; Object.assign(HUB, { tv, tvT, tvFace, tvLamps, choco });
    Object.assign(HUB, { screenT, boardT, boardFace, heldMail, mailT, mailFace, held, heldT, heldFace, scene: sc, cam, hot, cork, corkFace, shop, shopFace, camLed, phoneT, phone, sign, gear, bots, lensM, parcel, lidA, lidB, wallM, winMat, act: 1, sigs: {}, anchors: [
      ['exams', new THREE.Vector3(-0.74, 1.4, Z0 + 0.05)],
      ['gear', new THREE.Vector3(-0.42, 1.02, -0.38)],
      ['log', new THREE.Vector3(0.06, 0.84, -0.2)],
      ['go', new THREE.Vector3(0.84, 1.68, Z0 + 0.06)],
      ['parcel', new THREE.Vector3(0.22, 1.2, -0.5)],
      ['mail', new THREE.Vector3(-0.62, 0.84, -0.02)],
      ['tv', new THREE.Vector3(0.16, 1.44, -0.5)],
    ], pickables: [board, laptop, phone, door, glasses, parcel].map((o, i) => { o.userData.action = ['exams', 'gear', 'log', 'go', 'gear', 'parcel'][i]; return o; }) });
    // 카메라가 다가가는 자리: 방 전체 · 노트북 화면 · 일정표 · 폰
    const c = new THREE.Vector3(), n = new THREE.Vector3(), q = new THREE.Quaternion();
    const poseAt = (obj, dist, lift = 0) => { obj.updateMatrixWorld(true); obj.getWorldPosition(c); obj.getWorldQuaternion(q); n.set(0, 0, 1).applyQuaternion(q); const p = c.clone().addScaledVector(n, dist); p.y += lift; return { pos: p, look: c.clone() }; };
    sc.updateMatrixWorld(true);
    HUB.pickables.push(mail, tv, choco);
    HUB.poses = { tv: (() => { const p = poseAt(tvFace, 0.36, 0); p.pos.y -= 0.075; p.look.y -= 0.022; return p; })(), mail: { pos: new THREE.Vector3(-0.56, 1.1, 0.26), look: new THREE.Vector3(-0.62, 0.76, -0.02) }, laptop: poseAt(shopFace, 0.24, 0.0), board: (() => { const p = poseAt(corkFace, 0.5, 0.0); return { pos: new THREE.Vector3(p.look.x + 0.07, p.look.y + 0.015, p.look.z + 0.52), look: p.look }; })(), phone: { pos: new THREE.Vector3(0.0, 1.12, 0.22), look: new THREE.Vector3(0.05, 0.77, -0.2) } };
  }
  function drawCork(G) { // 방에서 보이는 일정표: 이번 막에서 합격한 시험과 다음 시험만
    const g = HUB.cork.g, nt = nextTierIndex(G), act = CONFIG.tiers[nt].act;
    g.fillStyle = '#c79a62'; g.fillRect(0, 0, 256, 176); g.fillStyle = '#b98a54'; for (let i = 0; i < 60; i++) g.fillRect((i * 37) % 256, (i * 23) % 176, 2, 2);
    g.fillStyle = '#fbf9f1'; g.fillRect(12, 8, 232, 160); g.fillStyle = '#d9473f'; g.fillRect(12, 8, 232, 18);
    g.fillStyle = '#ffffff'; g.font = `800 12px ${FONT}`; g.textAlign = 'left'; g.fillText(`${CONFIG.acts[act - 1]} 시험 일정표`, 20, 22);
    const list = CONFIG.tiers.map((t, i) => ({ t, i })).filter(o => o.t.act === act && o.i <= nt);
    list.slice(-8).forEach(({ t, i }, k) => {
      const y = 42 + k * 16;
      g.fillStyle = i === nt ? '#ffe9a8' : 'rgba(0,0,0,0)'; g.fillRect(14, y - 11, 228, 15);
      g.fillStyle = '#2a2838'; g.font = `${i === nt ? 800 : 700} 11px ${FONT}`; g.fillText(t.name, 20, y);
      g.textAlign = 'right'; g.fillStyle = G.cleared[i] ? '#2f8a3a' : '#b8362e';
      g.fillText(G.cleared[i] ? '합격' : examFee(t) ? won(examFee(t)) + '원' : '무료', 236, y); g.textAlign = 'left';
    });
    HUB.cork.t.needsUpdate = true;
  }
  function drawShop(G) { // 방에서 보이는 노트북 화면: AI마켓, 새로 들어온 게 있으면 NEW
    const g = HUB.shop.g; g.fillStyle = '#0d1018'; g.fillRect(0, 0, 256, 160);
    g.fillStyle = '#45e5ee'; g.font = `800 18px ${FONT}`; g.textAlign = 'left'; g.fillText('AI마켓', 12, 26); g.fillStyle = '#2a8f9a'; g.fillRect(12, 34, 232, 1);
    const fresh = shopNewCount();
    if (fresh) { g.fillStyle = '#ea4540'; g.fillRect(170, 10, 74, 22); g.fillStyle = '#ffffff'; g.font = `800 13px ${FONT}`; g.fillText(`NEW ${fresh}`, 180, 26); }
    g.fillStyle = '#c9f6fa'; g.font = `700 12px ${FONT}`; g.fillText('오늘의 특가 · 시험 전 총알배송', 12, 56);
    for (let i = 0; i < 3; i++) { g.fillStyle = '#1c2230'; g.fillRect(12 + i * 80, 70, 72, 70); g.fillStyle = '#f5cc4a'; g.fillText('주문', 30 + i * 80, 130); }
    HUB.shop.t.needsUpdate = true;
  }
  function drawPhone(G) {
    const g = HUB.phoneT.g; g.fillStyle = '#10131c'; g.fillRect(0, 0, 64, 120);
    g.fillStyle = '#8fa0b8'; g.font = `700 8px ${FONT}`; g.textAlign = 'center'; g.fillText('내 통장', 32, 16);
    g.fillStyle = '#f5cc4a'; g.font = `800 11px ${FONT}`; g.fillText(won(STATE.shown), 32, 34); g.font = `800 9px ${FONT}`; g.fillText('원', 32, 46);
    const unread = phoneUnread();
    if (unread) { g.fillStyle = '#ea4540'; g.beginPath(); g.arc(52, 10, 7, 0, 7); g.fill(); g.fillStyle = '#ffffff'; g.font = `800 8px ${FONT}`; g.fillText(String(Math.min(9, unread)), 52, 13); }
    g.fillStyle = '#45e5ee'; g.font = `700 7px ${FONT}`; g.fillText(fmtRun(runSecs()), 32, 64);
    g.fillStyle = '#2a2f3c'; for (let i = 0; i < 3; i++) g.fillRect(8, 76 + i * 12, 48, 8);
    HUB.phoneT.t.needsUpdate = true;
  }
  function drawSign(G) {
    const g = HUB.sign.g, t = CONFIG.tiers[nextTierIndex(G)];
    g.fillStyle = '#fbf9f1'; g.fillRect(0, 0, 128, 96); g.fillStyle = '#2b5f8a'; g.fillRect(0, 0, 128, 16);
    g.fillStyle = '#ffffff'; g.font = `800 11px ${FONT}`; g.textAlign = 'center'; g.fillText('다음 시험', 64, 12);
    g.fillStyle = '#2a2838'; g.font = `800 12px ${FONT}`;
    const nm = t.name.length > 9 ? [t.name.slice(0, 9), t.name.slice(9)] : [t.name]; nm.forEach((s, i) => g.fillText(s, 64, 40 + i * 15));
    g.fillStyle = '#b8362e'; g.font = `700 10px ${FONT}`; g.fillText(examFee(t) ? `응시료 ${won(examFee(t))}원` : '응시료 무료', 64, 82);
    HUB.sign.t.needsUpdate = true;
  }
  function updateHub(G, now, hover, hv) {
    const sigs = HUB.sigs, examSig = G.unlocked + '|' + G.cleared.join() + '|' + nextTierIndex(G) + '|' + tune.fee_scale;
    if (sigs.cork !== examSig) { sigs.cork = examSig; drawCork(G); drawSign(G); }
    const shopSig = shopNewCount(); if (sigs.shop !== shopSig) { sigs.shop = shopSig; drawShop(G); }
    if (now - (sigs.phoneT || -9) > 0.25) { sigs.phoneT = now; drawPhone(G); }
    const act = CONFIG.tiers[nextTierIndex(G)].act;
    if (HUB.builtAct !== act && !new URLSearchParams(location.search).get('hub')) { HUB.scene = null; buildHub(); return; } // 구간이 바뀌면 방을 새로 짓는다 (이사)
    if (HUB.act !== act && !HUB.themed) { HUB.act = act; HUB.winMat.map = windowTex(act); HUB.winMat.needsUpdate = true; HUB.wallM.color.setHex(act === 3 ? 0xb8a8d8 : act === 2 ? 0xc8d4e0 : 0xffffff); }
    const g = G.gear, hid = (hv && hv.hidden) || {};
    for (const id in HUB.gear) { const lv = id === 'model' ? g.model : g[id]; HUB.gear[id].visible = lv > 0 && !hid[id]; }
    HUB.bots.forEach((b, i) => { b.visible = i < g.bot && !hid.bot; b.position.y = 1.475 + (i < g.bot ? Math.abs(Math.sin(now * 3 + i)) * 0.006 : 0); });
    HUB.lensM.color.setHex(g.stealth ? 0x8a6cd6 : [0xbfe8ff, 0x9fe0ff, 0x7fd6ff, 0x5fe0e8, 0x45e5ee][Math.min(4, Math.floor(g.lens / 2))]);
    HUB.mail.visible = !!(hv && hv.mail);
    { const u = hv && hv.chocoT != null ? clamp((now - hv.chocoT) / 1.3, 0, 1) : 1, lift = Math.sin(u * Math.PI); HUB.choco.visible = !!(hv && hv.choco); HUB.choco.position.y = 0.762 + lift * 0.09; HUB.choco.rotation.z = lift * 0.35; }
    HUB.tvLamps.forEach((m, i) => m.color.setHex(i < (G.lamps || 0) ? (i === G.lamps - 1 && hv && hv.tvNew && Math.floor(now * 3) % 2 ? 0xff9a8a : 0xff3b30) : 0x3a1a1c)); HUB.tvT.t.needsUpdate = true;
    const pc = hv && hv.parcel;
    HUB.parcel.visible = !!pc;
    if (pc) { const k = pc.phase === 'open' ? clamp(pc.t / 0.5, 0, 1) : 0, drop = pc.phase === 'arrive' ? clamp(1 - pc.t / 0.35, 0, 1) : 0; HUB.lidA.rotation.x = -k * 2.0; HUB.lidB.rotation.x = k * 2.0; HUB.parcel.position.y = 0.94 + drop * 0.4; }
    for (const key in HUB.hot) for (const m of HUB.hot[key]) if (m.emissive) m.emissive.setHex(key === hover ? 0x3a3424 : 0x000000);
  }
  const ROOM_POSE = { pos: new THREE.Vector3(-0.3, 1.2, 0.66), yaw: -0.12, pitch: -0.1, fov: 60 }; // 선반 위 TV와 빨간 등까지 한 화면에
  const _qa = new THREE.Quaternion(), _qb = new THREE.Quaternion(), _look = new THREE.Object3D();
  function renderHub(G, now, hover, hv) {
    if (!W.ok) return;
    buildHub();
    const wantMap = hv && hv.view === 'laptop' ? HUB.screenT.t : HUB.shop.t; // 다가가면 진짜 화면, 멀리서는 작은 그림
    if (HUB.shopFace.material.map !== wantMap) { HUB.shopFace.material.map = wantMap; HUB.shopFace.material.needsUpdate = true; }
    if (hv && hv.view === 'laptop') HUB.screenT.t.needsUpdate = true;
    HUB.boardFace.visible = !!(hv && hv.view === 'board'); if (HUB.boardFace.visible) HUB.boardT.t.needsUpdate = true; // 일정표도 다가가면 벽의 판 위에 진짜 내용을 그린다
    updateHub(G, now, hover, hv);
    const c = HUB.cam, z = hv ? ease(clamp(hv.zoom, 0, 1)) : 0, target = hv && HUB.poses[hv.view];
    const roomYaw = ROOM_POSE.yaw + Math.sin(now * 0.3) * 0.01, roomPitch = ROOM_POSE.pitch + Math.sin(now * 0.45) * 0.006;
    _e.set(roomPitch, roomYaw, 0, 'YXZ'); _qa.setFromEuler(_e);
    if (target && z > 0) {
      _look.position.copy(target.pos); _look.lookAt(target.look); _qb.copy(_look.quaternion);
      // Object3D.lookAt는 +z가 대상을 향하게 돌리므로 카메라(-z가 앞)는 반 바퀴 돌린다
      _qb.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI));
      c.position.copy(ROOM_POSE.pos).lerp(target.pos, z); c.quaternion.copy(_qa).slerp(_qb, z);
      const fov = lerp(ROOM_POSE.fov, hv.view === 'phone' ? 55 : 50, z); if (Math.abs(c.fov - fov) > 0.01) { c.fov = fov; c.updateProjectionMatrix(); }
    } else {
      c.position.copy(ROOM_POSE.pos); c.quaternion.copy(_qa);
      if (c.fov !== ROOM_POSE.fov) { c.fov = ROOM_POSE.fov; c.updateProjectionMatrix(); }
    }
    c.updateMatrixWorld();
    const ph = !!(hv && hv.view === 'phone'); HUB.held.visible = ph; HUB.phone.visible = !ph; // 폰: 책상의 폰을 집어 눈앞에 든다
    if (ph) { HUB.heldT.t.needsUpdate = true; _qb.setFromEuler(_e.set(-0.08, 0.07, 0.015, 'YXZ')); HUB.held.quaternion.copy(c.quaternion).multiply(_qb); _p.set(0.003, 0.004 - (1 - z) * 0.22, -0.167).applyQuaternion(c.quaternion); HUB.held.position.copy(c.position).add(_p); HUB.held.updateMatrixWorld(true); }
    const ml = !!(hv && hv.view === 'mail'); HUB.heldMail.visible = ml; if (ml) { HUB.mail.visible = false; _qb.setFromEuler(_e.set(-0.1, -0.06, -0.035, 'YXZ')); HUB.heldMail.quaternion.copy(c.quaternion).multiply(_qb); _p.set(0, 0.002 - (1 - z) * 0.24, -0.19).applyQuaternion(c.quaternion); HUB.heldMail.position.copy(c.position).add(_p); HUB.heldMail.updateMatrixWorld(true); }
    draw(HUB.scene, c, now);
  }
  function renderTitle(G, now) { // 밤의 고시원: 책상 위 AI 안경을 천천히 비춘다
    if (!W.ok) return;
    buildHub(); updateHub(G, now, null, null);
    const c = HUB.cam; c.position.set(0.05 + Math.sin(now * 0.2) * 0.06, 1.0, 0.05); c.rotation.set(-0.3, 0.2 + Math.sin(now * 0.2) * 0.05, 0, 'YXZ');
    if (c.fov !== 50) { c.fov = 50; c.updateProjectionMatrix(); }
    c.updateMatrixWorld();
    draw(HUB.scene, c, now, 1.3);
  }
  const _p = new THREE.Vector3();
  function hubLabels() { // 물건 이름표 위치 (640x360 좌표)
    if (!W.ok || !HUB.scene) return [];
    return HUB.anchors.map(([action, v]) => { _p.copy(v).project(HUB.cam); return { action, x: (_p.x + 1) / 2 * RW, y: (1 - _p.y) / 2 * RH, show: _p.z < 1 && (action !== 'parcel' || HUB.parcel.visible) && (action !== 'mail' || HUB.mail.visible) }; });
  }
  function hubRect(view) { // 다가간 노트북 화면·일정표가 화면에서 차지하는 사각형 (640x360 좌표)
    if (!W.ok || !HUB.scene) return null;
    const face = view === 'laptop' ? HUB.shopFace : view === 'board' ? HUB.boardFace : view === 'phone' ? HUB.heldFace : view === 'mail' ? HUB.mailFace : view === 'tv' ? HUB.tvFace : null; if (!face) return null;
    const w = face.geometry.parameters.width / 2, h = face.geometry.parameters.height / 2;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const [px, py] of [[-w, -h], [w, -h], [w, h], [-w, h]]) { _p.set(px, py, 0); face.localToWorld(_p); _p.project(HUB.cam); const sx = (_p.x + 1) / 2 * RW, sy = (1 - _p.y) / 2 * RH; x0 = Math.min(x0, sx); y0 = Math.min(y0, sy); x1 = Math.max(x1, sx); y1 = Math.max(y1, sy); }
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }
  function moleRect() { // 앞자리 비밀 감독관이 화면에서 차지하는 자리 (640x360 좌표)
    if (!W.ok || !MOLE || !MOLE.obj || !EX.cam || MOLE.sc !== EX.scene) return null; _p.setFromMatrixPosition(MOLE.obj.matrixWorld); const bx = _p.x, bz = _p.z;
    _p.set(bx, 0.6, bz); _p.project(EX.cam); if (_p.z > 1 || Math.abs(_p.x) > 1.2) return null; const x = (_p.x + 1) / 2 * RW, y1 = (1 - _p.y) / 2 * RH;
    _p.set(bx, 1.32, bz); _p.project(EX.cam); const y0 = (1 - _p.y) / 2 * RH, h = y1 - y0; if (h <= 0) return null; return { x: x - h * 0.32, y: y0, w: h * 0.64, h }; }
  function staffRects() { // 시험장의 감독관들이 화면에서 차지하는 자리 (640x360 좌표). 군용 렌즈의 표적 표시에 쓴다
    const out = []; if (!W.ok || !EX.staff || !EX.cam) return out;
    EX.staff.forEach((m, i) => { if (!m || !m.root || !m.root.visible) return;
      _p.setFromMatrixPosition(m.root.matrixWorld); const fy = _p.y; _p.project(EX.cam); if (_p.z > 1 || Math.abs(_p.x) > 1.3) return; const x = (_p.x + 1) / 2 * RW, y1 = (1 - _p.y) / 2 * RH;
      _p.setFromMatrixPosition(m.root.matrixWorld); _p.y = fy + 1.72; _p.project(EX.cam); const y0 = (1 - _p.y) / 2 * RH, h = y1 - y0; if (h <= 0) return;
      out.push({ i, x: x - h * 0.19, y: y0, w: h * 0.38, h }); });
    return out;
  }
  function mailTex() { buildHub(); return HUB.mailT; }
  function tvTex() { buildHub(); return HUB.tvT; }
  function laptopCanvas() { buildHub(); return HUB.screenT.c; }
  function surfaceCanvas(view) { buildHub(); return (view === 'board' ? HUB.boardT : view === 'phone' ? HUB.heldT : HUB.screenT).c; }
  function hubUV(x, y, view) { // 화면에서 누른 자리 → 노트북 화면 위의 위치(0~1), 화면 밖이면 null
    if (!W.ok || !HUB.scene) return null;
    ndc.set(x / RW * 2 - 1, -(y / RH * 2 - 1)); ray.setFromCamera(ndc, HUB.cam);
    const hit = ray.intersectObject(view === 'board' ? HUB.boardFace : view === 'phone' ? HUB.heldFace : HUB.shopFace)[0]; return hit && hit.uv ? [hit.uv.x, 1 - hit.uv.y] : null;
  }
  function pickHub(x, y) {
    if (!W.ok || !HUB.scene) return null;
    ndc.set(x / RW * 2 - 1, -(y / RH * 2 - 1)); ray.setFromCamera(ndc, HUB.cam);
    const hit = ray.intersectObjects(HUB.pickables.filter(o => o.visible), true)[0]; if (!hit) return null;
    let o = hit.object; while (o && !o.userData.action) o = o.parent;
    return o ? o.userData.action : null;
  }

  // ---------- 엔딩: 처음으로 보이는 내 모습. AI 장비에 뒤덮여 있다 ----------
  const END = { scene: null };
  function modelMesh(name) { // assets/의 생성 모델(정점·UV·면 base64)을 메시로. 없으면 null
    const d = window.MODELS && window.MODELS[name]; if (!d) return null;
    const bin = b64 => { const s2 = atob(b64), a = new Uint8Array(s2.length); for (let i = 0; i < s2.length; i++) a[i] = s2.charCodeAt(i); return a.buffer; };
    const m = psx(new THREE.MeshLambertMaterial({ color: d.tex ? 0xffffff : 0x8a93a8, flatShading: !d.tex }));
    if (d.tex) { const img = new Image(); img.onload = () => { const t = new THREE.Texture(img); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true; m.map = t; m.needsUpdate = true; }; img.src = d.tex; }
    const one = p => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(bin(p.pos)), 3));
      g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(bin(p.uv)), 2));
      g.setIndex(new THREE.BufferAttribute(p.wide ? new Uint32Array(bin(p.idx)) : new Uint16Array(bin(p.idx)), 1));
      g.computeVertexNormals();
      return new THREE.Mesh(g, m);
    };
    if (!d.parts) return one(d);
    const root = new THREE.Group(); root.userData.arms = []; // 부품으로 나뉜 모델: 팔은 회전 중심에 놓아 따로 움직인다
    for (const p of d.parts) { const me = one(p); me.position.fromArray(p.pivot); root.add(me); if (p.name !== 'body') root.userData.arms.push(me); }
    return root;
  }
  function buildEnding() {
    if (END.scene) return;
    const sc = new THREE.Scene(); sc.background = new THREE.Color(0x05050a); sc.fog = new THREE.Fog(0x05050a, 3, 9);
    sc.add(new THREE.AmbientLight(0x8890c0, 0.5));
    const key = new THREE.SpotLight(0xdfe8ff, 30, 9, 0.5, 0.6, 1.2); key.position.set(0.6, 3.6, 2.2); key.target.position.set(0, 1.2, 0); sc.add(key); sc.add(key.target);
    const rim = new THREE.PointLight(0x45e5ee, 3, 4, 1.5); rim.position.set(-1.2, 1.6, -0.8); sc.add(rim);
    const B = batch(); B.box(8, 0.02, 8, 0x14141c, 0, -0.01, 0); sc.add(B.mesh());
    const me = makeHuman({ top: 0x3f5285, sleeve: 0x3f5285, leg: 0x2b2f3d, shirt: 0x3f5285, hair: 'spiky', hairC: 0x1f1a1c, hood: true, skin: 0xd9a57c });
    me.root.rotation.y = 0; me.cone.visible = false; sc.add(me.root);
    const M = 0x2a2c34, W2 = 0x15151a, glow = c => glowMat(c), leds = [];
    const led = (p, w, h, d, c, x, y, z) => { const m = glow(c); bx(p, w, h, d, c, x, y, z, m); leds.push(m); return m; };
    const H = me.head, Bd = me.body;
    // 머리: 겹겹이 쌓인 안경과 렌즈, 이마의 세 번째 눈, 두개골 임플란트, 안테나, 귀의 이어폰 다발
    for (let i = 0; i < 3; i++) { for (const sx of [-1, 1]) { bx(H, 0.085, 0.06, 0.012, W2, sx * 0.05, 0.02, 0.112 + i * 0.03); led(H, 0.07, 0.045, 0.006, i === 2 ? 0x45e5ee : 0x2a8f9a, sx * 0.05, 0.02, 0.12 + i * 0.03); } bx(H, 0.02, 0.01, 0.01, W2, 0, 0.03, 0.112 + i * 0.03); }
    for (const sx of [-1, 1]) { bx(H, 0.04, 0.04, 0.09, M, sx * 0.05, 0.02, 0.24); led(H, 0.03, 0.03, 0.006, 0xff3048, sx * 0.05, 0.02, 0.288); } // 망원 렌즈
    bx(H, 0.05, 0.05, 0.03, M, 0, 0.1, 0.11); led(H, 0.03, 0.03, 0.006, 0x7ad06a, 0, 0.1, 0.128);
    bx(H, 0.16, 0.06, 0.16, M, 0, 0.16, -0.02); for (let i = 0; i < 4; i++) led(H, 0.012, 0.012, 0.012, i % 2 ? 0x45e5ee : 0xf5cc4a, -0.05 + i * 0.033, 0.195, 0.05);
    for (const [ax, ah] of [[-0.06, 0.22], [0.02, 0.3], [0.07, 0.16]]) { bx(H, 0.008, ah, 0.008, 0x8a8f99, ax, 0.19 + ah / 2, -0.04); led(H, 0.02, 0.02, 0.02, 0xff3048, ax, 0.2 + ah, -0.04); }
    for (const sx of [-1, 1]) { bx(H, 0.03, 0.07, 0.05, 0xf2f2f4, sx * 0.115, -0.01, 0); bx(H, 0.02, 0.04, 0.03, 0xf2f2f4, sx * 0.13, -0.06, 0.01); bx(H, 0.006, 0.3, 0.006, W2, sx * 0.12, -0.2, -0.02); }
    bx(H, 0.006, 0.006, 0.2, W2, 0.06, 0.12, -0.1); bx(H, 0.006, 0.006, 0.2, W2, -0.05, 0.14, -0.1);
    // 몸통: 단추마다 카메라, 가슴의 액정, 등에 진 배터리와 서버, 전선
    for (let i = 0; i < 5; i++) { bx(Bd, 0.03, 0.03, 0.02, W2, 0, 1.36 - i * 0.11, 0.118); led(Bd, 0.014, 0.014, 0.006, 0xff3048, 0, 1.36 - i * 0.11, 0.13); }
    bx(Bd, 0.14, 0.1, 0.02, W2, -0.1, 1.2, 0.118); led(Bd, 0.12, 0.08, 0.006, 0x0c3a1c, -0.1, 1.2, 0.13); led(Bd, 0.08, 0.012, 0.007, 0x7dff9a, -0.1, 1.21, 0.134);
    bx(Bd, 0.36, 0.5, 0.18, M, 0, 1.15, -0.2); for (let i = 0; i < 5; i++) led(Bd, 0.3, 0.012, 0.006, i % 2 ? 0x45e5ee : 0x62d84a, 0, 0.98 + i * 0.09, -0.293);
    bx(Bd, 0.008, 0.5, 0.008, 0xb8362e, 0.12, 1.5, -0.14); bx(Bd, 0.008, 0.5, 0.008, 0xf5cc4a, -0.1, 1.5, -0.15); bx(Bd, 0.008, 0.4, 0.008, 0x45e5ee, 0.02, 1.5, -0.16);
    bx(Bd, 0.14, 0.1, 0.2, 0xd4d6de, 0.27, 1.5, 0); bx(Bd, 0.08, 0.08, 0.02, W2, 0.27, 1.5, 0.11); led(Bd, 0.03, 0.03, 0.006, 0xff3048, 0.3, 1.53, 0.124); // 어깨 위 CCTV
    bx(Bd, 0.1, 0.18, 0.02, W2, 0.1, 0.62, 0.08); led(Bd, 0.08, 0.15, 0.006, 0x1c4a8a, 0.1, 0.62, 0.092); // 허벅지 폰
    // 팔: 손목부터 줄줄이 찬 시계와 소매 액정
    for (const [i, arm] of me.arms.entries()) { for (let j = 0; j < 4; j++) { bx(arm, 0.1, 0.035, 0.12, 0x20303a, 0, -0.5 + j * 0.09, 0); led(arm, 0.05, 0.025, 0.006, [0x45e5ee, 0x7dff9a, 0xf5cc4a, 0xff3048][(j + i) % 4], 0, -0.5 + j * 0.09, 0.062); } bx(arm, 0.006, 0.3, 0.006, W2, 0.05, -0.2, 0.03); }
    me.arms[0].rotation.set(0, 0, 0.12); me.arms[1].rotation.set(0, 0, -0.12);
    // 등에서 뻗어 나온 기계 팔 넷: 폰, 액정, 카메라, 시험지를 들고 있다
    const mech = [];
    for (const [sx, sy, hold] of [[-1, 1.5, 'phone'], [1, 1.5, 'cam'], [-1, 1.15, 'lcd'], [1, 1.15, 'paper']]) {
      const a = pivot(Bd, sx * 0.16, sy, -0.2); a.rotation.set(0.5, 0, sx * -(sy > 1.3 ? 1.9 : 1.2));
      bx(a, 0.035, 0.42, 0.035, 0x6c7590, 0, -0.21, 0); bx(a, 0.05, 0.05, 0.05, 0x9aa3b8, 0, -0.42, 0);
      const f = pivot(a, 0, -0.42, 0); f.rotation.set(-1.3, 0, sx * 0.5); bx(f, 0.03, 0.36, 0.03, 0x6c7590, 0, -0.18, 0);
      if (hold === 'phone') { bx(f, 0.09, 0.16, 0.012, W2, 0, -0.42, 0.02); led(f, 0.075, 0.14, 0.004, 0x1c4a8a, 0, -0.42, 0.028); }
      else if (hold === 'cam') { bx(f, 0.1, 0.08, 0.08, 0xd4d6de, 0, -0.4, 0.02); led(f, 0.04, 0.04, 0.006, 0xff3048, 0, -0.4, 0.064); }
      else if (hold === 'lcd') { bx(f, 0.16, 0.11, 0.012, W2, 0, -0.42, 0.02); led(f, 0.14, 0.09, 0.004, 0x0c3a1c, 0, -0.42, 0.028); led(f, 0.09, 0.012, 0.005, 0x7dff9a, 0, -0.41, 0.03); }
      else bx(f, 0.16, 0.22, 0.004, 0xf6f2e6, 0, -0.44, 0.02);
      mech.push({ a, f, sx });
    }
    END.mech = mech;
    // 더 기괴하게: 얼굴을 뒤덮은 렌즈 다발, 입을 막은 스피커, 목의 고정대, 굽은 등뼈 안테나, 바닥까지 늘어진 전선
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { const lx = -0.09 + c * 0.06 + (r % 2) * 0.02, ly = -0.06 + r * 0.055, d = 0.03 + ((r * 5 + c * 3) % 4) * 0.025;
      bx(H, 0.045, 0.045, d, M, lx, ly, 0.2 + d / 2); led(H, 0.03, 0.03, 0.006, [0xff3048, 0x45e5ee, 0x7ad06a, 0xf5cc4a][(r + c) % 4], lx, ly, 0.2 + d + 0.004); }
    bx(H, 0.14, 0.07, 0.05, W2, 0, -0.1, 0.13); for (let i = 0; i < 4; i++) bx(H, 0.1, 0.006, 0.006, 0x8a8f99, 0, -0.125 + i * 0.016, 0.158);
    bx(Bd, 0.2, 0.08, 0.2, 0x8a8f99, 0, 1.46, 0); for (const sx of [-1, 1]) bx(Bd, 0.02, 0.2, 0.02, 0x8a8f99, sx * 0.09, 1.55, -0.08);
    for (let i = 0; i < 6; i++) { bx(Bd, 0.05, 0.05, 0.06, M, 0, 0.85 + i * 0.11, -0.31); bx(Bd, 0.006, 0.12 + (i % 3) * 0.08, 0.006, 0x8a8f99, 0, 0.9 + i * 0.11, -0.4); led(Bd, 0.018, 0.018, 0.018, 0xff3048, 0, 0.97 + i * 0.11 + (i % 3) * 0.04, -0.4); }
    const wires = batch(), wc = [0xb8362e, 0xf5cc4a, 0x45e5ee, 0x15151a, 0x62d84a];
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2, r0 = 0.18, r1 = 0.7 + (i % 4) * 0.35, x0 = Math.cos(a) * r0, z0 = -0.2 + Math.sin(a) * r0 * 0.5, x1 = Math.cos(a) * r1, z1 = Math.sin(a) * r1;
      wires.box(0.012, 0.95, 0.012, wc[i % 5], x0, 0.48, z0 - 0.08); const len = Math.hypot(x1 - x0, z1 - z0); wires.box(len, 0.012, 0.012, wc[i % 5], (x0 + x1) / 2, 0.012, (z0 + z1) / 2 - 0.08, 0, -Math.atan2(z1 - z0, x1 - x0), 0); }
    sc.add(wires.mesh());
    for (const lg of me.legs) { bx(lg, 0.09, 0.16, 0.012, W2, 0, -0.3, 0.08); led(lg, 0.075, 0.13, 0.004, 0x1c4a8a, 0, -0.3, 0.088); bx(lg, 0.14, 0.04, 0.16, M, 0, -0.6, 0); led(lg, 0.02, 0.02, 0.006, 0x62d84a, 0.04, -0.6, 0.082); }
    me.body.rotation.x = 0.16; me.head.position.z += 0.05; // 굽은 등, 앞으로 빠진 목
    for (const [sx, sy] of [[-1, 0.85], [1, 0.85]]) { const a = pivot(Bd, sx * 0.14, sy, -0.24); a.rotation.set(0.9, 0, sx * -0.9); bx(a, 0.03, 0.5, 0.03, 0x6c7590, 0, -0.25, 0); const f = pivot(a, 0, -0.5, 0); f.rotation.set(-1.6, 0, 0); bx(f, 0.025, 0.4, 0.025, 0x6c7590, 0, -0.2, 0); bx(f, 0.06, 0.05, 0.05, 0x15151a, 0, -0.42, 0); led(f, 0.03, 0.03, 0.006, 0xff3048, 0, -0.42, 0.03); mech.push({ a, f, sx }); }
    const pick = new URLSearchParams(location.search).get('me') || CONFIG.ending_model, alt = pick && pick !== 'box' ? modelMesh(pick) : null;
    if (alt) { me.root.visible = false; alt.scale.setScalar(1.85); alt.rotation.y = 0; sc.add(alt); END.alt = alt; } // 생성 모델로 바꿔 끼운다 (전선은 그대로 바닥에)
    const cam = new THREE.PerspectiveCamera(40, RW / RH, 0.05, 30);
    Object.assign(END, { scene: sc, cam, me, leds, rim });
    END.mech = END.mech || [];
  }
  // 엔딩 앞 장면들: CCTV에 찍힌 세상. 모두가 그렇게 합격했다
  const TAB = {};
  function addGlasses(m, col) { for (const sx of [-1, 1]) { bx(m.head, 0.075, 0.05, 0.012, 0x15151a, sx * 0.05, 0.02, 0.112); bx(m.head, 0.06, 0.036, 0.006, 0, sx * 0.05, 0.02, 0.12, glowMat(col || 0x45e5ee)); } bx(m.head, 0.02, 0.008, 0.01, 0x15151a, 0, 0.03, 0.112); m.cone.visible = false; }
  function buildTableau(kind) {
    if (TAB[kind]) return TAB[kind];
    const sc = new THREE.Scene(), B = batch(), bg = { doctor: 0x9ab0b4, court: 0x4a3a2c, school: 0xb8ad96 }[kind];
    sc.background = new THREE.Color(bg); sc.fog = new THREE.Fog(bg, 5, 14);
    sc.add(new THREE.AmbientLight(0xffffff, 1.0)); sc.add(new THREE.HemisphereLight(0xffffff, 0x3a3a40, 1.0)); const sun = new THREE.DirectionalLight(0xffffff, 1.6); sun.position.set(-3, 6, 4); sc.add(sun);
    const put = (look, x, z, yaw, seated) => { const m = makeHuman(look); m.root.position.set(x, seated ? -0.4 : 0, z); m.root.rotation.y = yaw; if (seated) { m.legs[0].rotation.x = -1.4; m.legs[1].rotation.x = -1.4; } sc.add(m.root); return m; };
    const people = [];
    if (kind === 'doctor') { // 진료실: 안경 쓴 의사가 환자 앞에서 허공만 본다
      B.box(8, 0.02, 8, 0xc8d4d4, 0, -0.01, 0); B.box(8, 3, 0.1, 0xdfe8e8, 0, 1.5, -2.2); B.box(0.1, 3, 8, 0xdfe8e8, -3, 1.5, 0);
      B.box(1.9, 0.5, 0.8, 0xf4f4f0, 0.3, 0.55, 0); B.box(1.9, 0.08, 0.8, 0x8a9aa0, 0.3, 0.3, 0); for (const lx of [-0.5, 1.1]) B.box(0.06, 0.3, 0.7, 0x8a9aa0, lx, 0.15, 0);
      B.box(0.5, 0.26, 0.5, 0xd9a57c, -0.4, 0.92, 0); B.box(1.2, 0.2, 0.6, 0x9ad0e0, 0.5, 0.86, 0); // 누운 환자
      B.box(0.06, 1.7, 0.06, 0x8a8f99, 1.5, 0.85, -0.5); B.box(0.2, 0.3, 0.06, 0xe8f0f8, 1.5, 1.6, -0.5); B.box(0.5, 0.4, 0.3, 0x2a2c34, -1.6, 1.0, -1.6); B.box(0.4, 0.3, 0.02, 0x62d84a, -1.6, 1.0, -1.44);
      const d = put({ top: 0xf4f4f0, sleeve: 0xf0f0ec, leg: 0x3a4a62, shirt: 0x9ad0e0, hair: 'buzz', hairC: 0x2a2420, robe: true }, 0.3, -0.75, 0, false); addGlasses(d, 0xff3048); d.arms[1].rotation.set(-1.2, 0, -0.2); people.push(d);
      const n = put({ top: 0x9ad0e0, sleeve: 0x9ad0e0, leg: 0x9ad0e0, shirt: 0x9ad0e0, hair: 'bun', hairC: 0x3a2418 }, 1.4, 0.3, -1.2, false); addGlasses(n); people.push(n);
    } else if (kind === 'court') { // 법정: 변호사도 판사도 안경만 본다
      B.box(9, 0.02, 9, 0x6e4b33, 0, -0.01, 0); B.box(9, 3.4, 0.1, 0x5a3a24, 0, 1.7, -3); B.box(3.2, 1.3, 0.7, 0x4a3020, 0, 0.65, -2.2); B.box(3.4, 0.08, 0.8, 0x3a2418, 0, 1.32, -2.2);
      const j = put(STAFF_LOOK.don, 0, -2.7, 0, false); j.root.position.y = 0.35; addGlasses(j, 0xf5cc4a); people.push(j);
      for (const sx of [-1, 1]) { B.box(1.5, 0.06, 0.6, 0x5a3a24, sx * 1.5, 0.74, 0.2); B.box(1.4, 0.7, 0.05, 0x4a3020, sx * 1.5, 0.37, -0.08); }
      const l = put(STAFF_LOOK.banker, -1.5, 0.75, Math.PI, true); addGlasses(l, 0xff3048); l.root.rotation.y = Math.PI; people.push(l);
      const c = put({ top: 0x7a5a3a, sleeve: 0x6a4a2e, leg: 0x3a332c, shirt: 0xeee8da, hair: 'spiky', hairC: 0x221c1a }, -0.9, 0.75, Math.PI, true); people.push(c); // 의뢰인만 안경이 없다
      const p = put(STAFF_LOOK.agent, 1.5, 0.75, Math.PI, true); addGlasses(p); people.push(p);
    } else { // 교실: 책은 덮여 있고 모두 렌즈만 본다
      B.box(9, 0.02, 9, 0x9c6c47, 0, -0.01, 0); B.box(9, 3, 0.1, 0xe6e0cc, 0, 1.5, -3.2); B.box(4.6, 1.3, 0.06, 0x2f5a48, 0, 1.6, -3.12);
      const t = put(STAFF_LOOK.homeroom, -1.8, -2.6, 0.3, false); people.push(t); t.arms[1].rotation.set(-2.2, 0, 0);
      for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { const x = -1.8 + c * 1.2, z = -1.2 + r * 1.3;
        B.box(0.62, 0.04, 0.44, 0xc89a64, x, 0.72, z); B.box(0.03, 0.7, 0.4, 0x8c9099, x - 0.28, 0.35, z); B.box(0.03, 0.7, 0.4, 0x8c9099, x + 0.28, 0.35, z); B.box(0.22, 0.03, 0.3, [0xb8362e, 0x2b5f8a, 0x3f7a4a][(r + c) % 3], x, 0.755, z);
        const st = put({ top: [0x3f4f78, 0x5a5f6b, 0x2f5d50][(r * 2 + c) % 3], sleeve: 0x3f4f78, leg: 0x2b2f3d, shirt: 0xf4f4f0, hair: (r + c) % 2 ? 'bun' : 'spiky', hairC: 0x1f1a1c }, x, z + 0.5, Math.PI, true); addGlasses(st, (r + c) % 3 ? 0x45e5ee : 0x7ad06a); st.head.rotation.x = -0.35; people.push(st); }
    }
    sc.add(B.mesh());
    const cam = new THREE.PerspectiveCamera(58, RW / RH, 0.05, 30); // 천장 구석 CCTV 자리
    cam.position.set(kind === 'school' ? 3.2 : 2.6, 2.7, kind === 'doctor' ? 2.4 : 3.0); cam.lookAt(kind === 'court' ? -0.3 : 0, 0.8, kind === 'doctor' ? -0.2 : -0.8);
    return (TAB[kind] = { scene: sc, cam, people });
  }
  function renderTableau(kind, now) { if (!W.ok) return; const T2 = buildTableau(kind); T2.cam.rotation.z = Math.sin(now * 0.3) * 0.004; draw(T2.scene, T2.cam, now, 1.8); }
  function renderEnding(t, now) { // 눈앞의 렌즈에서 시작해 천천히 물러나며 전신이 드러난다
    if (!W.ok) return;
    buildEnding();
    const k = ease(clamp((t - 1.2) / 7.5, 0, 1)), d = lerp(0.55, 3.4, k), a = lerp(0.0, 0.35, k) + Math.sin(now * 0.2) * 0.03;
    END.cam.position.set(Math.sin(a) * d, lerp(1.62, 1.25, k), Math.cos(a) * d); END.cam.lookAt(0, lerp(1.62, 1.05, k), 0);
    END.me.head.rotation.set(Math.sin(now * 0.7) * 0.03, Math.sin(now * 0.4) * 0.05, 0);
    if (END.alt && END.alt.userData.arms) END.alt.userData.arms.forEach((m, i) => { m.rotation.z = Math.sin(now * 1.1 + i * 1.7) * 0.16; m.rotation.x = Math.sin(now * 0.8 + i * 2.3) * 0.12; m.rotation.y = Math.sin(now * 0.6 + i) * 0.1; });
    (END.mech || []).forEach((m, i) => { m.f.rotation.x = -1.3 + Math.sin(now * 1.3 + i * 1.7) * 0.18; m.a.rotation.x = 0.5 + Math.sin(now * 0.9 + i) * 0.08; });
    END.leds.forEach((m, i) => { const on = Math.sin(now * (2 + (i % 5)) + i) > -0.6; if (!m.userData.c) m.userData.c = m.color.getHex(); m.color.setHex(on ? m.userData.c : 0x101014); });
    draw(END.scene, END.cam, now, 1.4);
  }

  const _qs = new THREE.Quaternion(), _es = new THREE.Euler(), _ps = new THREE.Vector3();
  // ---------- 계단: LEET 쉬는 시간에 전력으로 오르내리는 계단 ----------
  const ST = { scene: null, i: 0, yaw: 0, pitch: 0 }, ST_N = 14, ST_H = 0.17, ST_D = 0.3;
  function buildStairs() {
    if (ST.scene) return;
    const sc = new THREE.Scene(); sc.background = new THREE.Color(0x9aa0a8); sc.fog = new THREE.Fog(0x9aa0a8, 3, 12);
    sc.add(new THREE.AmbientLight(0xffffff, 1.0)); sc.add(new THREE.HemisphereLight(0xeef4ff, 0x6a6258, 1.1));
    const sun = new THREE.DirectionalLight(0xfff0d0, 1.6); sun.position.set(2, 6, -3); sc.add(sun);
    const B = batch(), top = ST_N * ST_H, zt = -ST_N * ST_D;
    for (let i = 0; i < ST_N; i++) { const h = (i + 1) * ST_H; B.box(1.7, h, ST_D, i % 2 ? 0xb4afa2 : 0xc2bdb0, 0, h / 2, -i * ST_D); B.box(1.7, 0.012, 0.035, 0x3e3e46, 0, h + 0.006, -i * ST_D + ST_D / 2 - 0.02); }
    B.box(1.7, 0.1, 2.4, 0x8f8a7e, 0, -0.05, 1.3); B.box(1.7, top, 1.8, 0xb4afa2, 0, top / 2, zt - 0.75); // 아래·위 층계참
    B.box(0.1, 8, 12, 0xdcd8cc, -0.9, 3, -2); B.box(0.1, 8, 12, 0xd2cec2, 0.9, 3, -2); B.box(0.12, 8, 12, 0x5a7a5a, -0.84, -2.9, -2); B.box(0.12, 8, 12, 0x5a7a5a, 0.84, -2.9, -2); // 벽과 아래쪽 초록 띠
    B.box(1.9, 8, 0.1, 0xd6d2c6, 0, 3, zt - 1.7); B.box(1.9, 8, 0.1, 0xd6d2c6, 0, 3, 2.5); B.box(1.9, 0.1, 12, 0xe6e2d8, 0, 5.2, -2);
    for (let i = 0; i <= ST_N; i += 2) B.box(0.04, 0.9, 0.04, 0x4a4a52, 0.78, i * ST_H + 0.6, -i * ST_D + 0.1); // 난간 기둥
    sc.add(B.mesh());
    plane(sc, 0.9, 1.1, new THREE.MeshBasicMaterial({ color: 0xfff6d8, fog: false }), 0, top + 1.9, zt - 1.64); // 층계참 창문
    const sign = canvasTex(128, 64, false); { const g = sign.g; g.fillStyle = '#2b5f8a'; g.fillRect(0, 0, 128, 64); g.fillStyle = '#ffffff'; g.font = `800 34px ${FONT}`; g.textAlign = 'center'; g.fillText('3F', 64, 44); sign.t.needsUpdate = true; }
    plane(sc, 0.4, 0.2, new THREE.MeshBasicMaterial({ map: sign.t, fog: false }), -0.84, top + 1.9, zt - 0.6, 0, Math.PI / 2);
    const exit = canvasTex(128, 64, false); { const g = exit.g; g.fillStyle = '#1c8a4a'; g.fillRect(0, 0, 128, 64); g.fillStyle = '#ffffff'; g.font = `800 22px ${FONT}`; g.textAlign = 'center'; g.fillText('2F 고사실', 64, 40); exit.t.needsUpdate = true; }
    plane(sc, 0.5, 0.25, new THREE.MeshBasicMaterial({ map: exit.t, fog: false }), 0, 2.2, 2.44, 0, Math.PI);
    // 계단 끝 위층 바닥 안쪽 구석에 앉은 작은 검은 고양이 (오르는 내내, 다 올라서도 보이는 자리)
    const cat = pivot(sc, -0.5, top, zt - 1.35), ck = 0x0c0c10; cat.rotation.y = 0.3; cat.scale.setScalar(1.5); cat.visible = !!CONFIG.eggs.cat;
    bx(cat, 0.1, 0.13, 0.13, ck, 0, 0.065, 0); bx(cat, 0.085, 0.05, 0.05, ck, 0, 0.025, 0.07);
    const chead = pivot(cat, 0, 0.16, 0.035); bx(chead, 0.095, 0.08, 0.08, ck, 0, 0.02, 0); for (const s of [-1, 1]) { bx(chead, 0.028, 0.035, 0.02, ck, s * 0.032, 0.072, 0); bx(chead, 0.016, 0.014, 0.004, 0, s * 0.022, 0.028, 0.041, glowMat(0xffd83a)); }
    const ctail = pivot(cat, 0.04, 0.02, -0.06); bx(ctail, 0.022, 0.022, 0.14, ck, 0, 0, -0.07); bx(ctail, 0.022, 0.07, 0.022, ck, 0, 0.035, -0.14);
    const cam = new THREE.PerspectiveCamera(72, RW / RH, 0.03, 30); cam.rotation.order = 'YXZ';
    Object.assign(ST, { scene: sc, cam, cat, chead, ctail });
  }
  function renderStairs(S, now) {
    if (!W.ok) return; buildStairs();
    const m = S.steps % (2 * ST_N), up = m < ST_N, i = m <= ST_N ? m : 2 * ST_N - m; // 끝까지 오르면 돌아서 내려온다
    ST.i += (i - ST.i) * 0.35; ST.yaw += ((up ? 0 : Math.PI) - ST.yaw) * 0.22; ST.pitch += ((up ? 0.02 : -0.62) - ST.pitch) * 0.2;
    const run = S.phase === 'run', bob = run ? Math.abs(Math.sin(S.steps * Math.PI / 2 + now * 9)) * 0.035 : Math.sin(now * 1.4) * 0.006, c = ST.cam;
    c.position.set((S.last === 'L' ? -0.05 : 0.05) * (run ? 1 : 0) + (S.stumble > 0 ? Math.sin(now * 60) * 0.03 : 0), ST.i * ST_H + 1.52 + bob, -ST.i * ST_D + 0.55);
    c.rotation.set(ST.pitch + (S.stumble > 0 ? -0.12 : 0), ST.yaw, run ? (S.last === 'L' ? 0.035 : -0.035) : 0);
    const fov = run ? 78 : 70; if (Math.abs(c.fov - fov) > 0.5) { c.fov += (fov - c.fov) * 0.2; c.updateProjectionMatrix(); }
    ST.ctail.rotation.y = Math.sin(now * 1.7) * 0.5; ST.chead.rotation.y = clamp((c.position.x - ST.cat.position.x) * 0.9, -0.8, 0.8) - 0.3; ST.chead.rotation.z = Math.sin(now * 0.6) > 0.94 ? 0.25 : 0; // 꼬리를 흔들고, 올라오는 나를 눈으로 따라온다
    c.updateMatrixWorld(); draw(ST.scene, c, now);
  }

  // ---------- 재시험 조사실: 책상 하나, 형광등 하나, 맞은편의 조사관 ----------
  const PB = { scene: null, k: 0, last: 0 };
  function buildProbe() {
    if (PB.scene) return;
    const sc = new THREE.Scene(); sc.background = new THREE.Color(0x0b0c0f); sc.fog = new THREE.Fog(0x0b0c0f, 2.6, 7.5);
    const amb = new THREE.AmbientLight(0xffffff, 0.75); sc.add(amb); sc.add(new THREE.HemisphereLight(0xdfe8ff, 0x24262a, 0.7));
    const sun = new THREE.DirectionalLight(0xf2f6ff, 1.5); sun.position.set(0.2, 4, 0.6); sc.add(sun);
    const B = batch();
    B.box(4, 0.04, 4.4, 0x2a2c30, 0, -0.02, -0.4); B.box(4, 0.04, 4.4, 0x34373c, 0, 2.52, -0.4); // 바닥·천장
    B.box(4, 2.6, 0.06, 0x3d4247, 0, 1.25, -2.0); B.box(0.06, 2.6, 4.4, 0x383c41, -1.8, 1.25, -0.4); B.box(0.06, 2.6, 4.4, 0x383c41, 1.8, 1.25, 0.9); B.box(0.06, 2.6, 0.9, 0x383c41, 1.8, 1.25, -1.72); B.box(0.06, 0.5, 1.0, 0x383c41, 1.8, 2.3, -0.8); // 벽 (오른쪽에 문 자리)
    B.box(4, 0.9, 0.02, 0x2e3237, 0, 0.45, -1.96); // 아래쪽 띠
    B.box(1.0, 0.62, 0.03, 0x50555c, -0.95, 1.45, -1.96); B.box(0.92, 0.54, 0.035, 0x121418, -0.95, 1.45, -1.955); // 안이 안 보이는 창
    B.box(1.6, 0.05, 0.95, 0x6b5a48, 0, 0.74, -0.38); for (const [x, z] of [[-0.72, -0.78], [0.72, -0.78], [-0.72, 0.02], [0.72, 0.02]]) B.box(0.05, 0.72, 0.05, 0x3a3f46, x, 0.36, z); // 책상
    B.box(0.28, 0.018, 0.18, 0x8a9098, -0.5, 0.774, -0.2); B.box(0.24, 0.006, 0.14, 0x3c4046, -0.5, 0.785, -0.2); // 트레이
    B.box(1.0, 0.03, 0.14, 0x555a62, 0, 2.48, -0.5);
    sc.add(B.mesh());
    bx(sc, 0.9, 0.02, 0.1, 0, 0, 2.46, -0.5, glowMat(0xf2f7ff)); // 형광등
    const inv = makeStaff('agent'); sc.add(inv.root);
    const paperT = canvasTex(600, 800, true), paper = plane(sc, 0.42, 0.56, new THREE.MeshBasicMaterial({ map: paperT.t, fog: false, color: 0xe8e2d4 }), 0.02, 0.768, -0.2, -Math.PI / 2, 0); paper.rotation.z = 0.03;
    const gl = pivot(sc, 0, 0, 0); for (const s of [-1, 1]) { bx(gl, 0.062, 0.006, 0.04, 0x15161a, s * 0.04, 0, 0); bx(gl, 0.05, 0.007, 0.03, 0, s * 0.04, 0, 0, glowMat(0x1c2a22)); bx(gl, 0.006, 0.006, 0.1, 0x15161a, s * 0.072, 0, -0.05); } bx(gl, 0.02, 0.006, 0.008, 0x15161a, 0, 0, 0);
    const led = glowMat(0x62d84a); bx(gl, 0.008, 0.008, 0.008, 0, 0.072, 0.003, 0.012, led);
    const door = pivot(sc, 1.8, 0, -1.27); bx(door, 0.05, 2.05, 0.92, 0x4a4f57, 0, 1.025, 0.46); bx(door, 0.07, 0.05, 0.05, 0xc9ced6, -0.03, 1.0, 0.8);
    const glow = plane(sc, 0.92, 2.05, new THREE.MeshBasicMaterial({ color: 0xfff3cc, fog: false }), 1.95, 1.025, -0.81, 0, -Math.PI / 2); glow.visible = false;
    const cop = makeStaff('agent'); sc.add(cop.root); bx(cop.head, 0.27, 0.07, 0.27, 0x10182a, 0, 0.2, 0); bx(cop.head, 0.2, 0.02, 0.1, 0x10182a, 0, 0.17, 0.16); bx(cop.head, 0.05, 0.04, 0.01, 0xe7c13a, 0, 0.21, 0.137); cop.root.visible = false;
    const torch = bx(cop.arms[1], 0.05, 0.05, 0.16, 0x2a2c34, 0, -0.62, 0.1); bx(cop.arms[1], 0.045, 0.045, 0.01, 0, 0, -0.62, 0.185, glowMat(0xfffbe0));
    const cuffs = pivot(sc, 0.36, 0.78, -0.02); const ring = psx(new THREE.MeshLambertMaterial({ color: 0xc9ced6, flatShading: true }));
    for (const s of [-1, 1]) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.008, 5, 10), ring); t.rotation.x = Math.PI / 2; t.position.x = s * 0.055; cuffs.add(t); } bx(cuffs, 0.04, 0.008, 0.012, 0x9aa0aa, 0, 0, 0); cuffs.rotation.y = 0.5; cuffs.visible = false;
    const cam = new THREE.PerspectiveCamera(62, RW / RH, 0.03, 20); cam.rotation.order = 'YXZ';
    Object.assign(PB, { scene: sc, cam, amb, inv, paper, paperT, gl, led, door, glow, cop, cuffs });
  }
  const PB_FRONT = { pos: new THREE.Vector3(0, 1.24, 0.66), look: new THREE.Vector3(0, 1.0, -0.6) }, PB_PAPER = { pos: new THREE.Vector3(0.02, 1.37, -0.13), look: new THREE.Vector3(0.02, 0.77, -0.215) };
  function renderProbe(P, now) {
    if (!W.ok) return; buildProbe();
    const dt = clamp(now - PB.last, 0, 0.1); PB.last = now;
    const want = P.phase === 'play' ? 1 : 0; PB.k += (want - PB.k) * Math.min(1, dt * 5); if (P.snap) { PB.k = want; P.snap = false; }
    const k = ease(clamp(PB.k, 0, 1)), c = PB.cam, fail = P.phase === 'fail', t = P.t;
    _p.copy(PB_FRONT.pos).lerp(PB_PAPER.pos, k); c.position.copy(_p); c.position.x += Math.sin(now * 0.7) * 0.004; c.position.y += Math.sin(now * 1.1) * 0.003;
    _look.position.copy(c.position); _p.copy(PB_FRONT.look).lerp(PB_PAPER.look, k); if (fail && t > 1.6) _p.x += ease(clamp((t - 1.6) / 0.7, 0, 1)) * 0.75; // 문 쪽으로 고개가 돌아간다
    _look.lookAt(_p); c.quaternion.copy(_look.quaternion).multiply(_qb.setFromAxisAngle(_p.set(0, 1, 0), Math.PI)); c.updateMatrixWorld();
    poseModel(PB.inv, { x: 0, z: -1.16, yaw: 0, seated: true, phase: 'stand', now, headPitch: P.phase === 'judge' ? 0.55 : P.phase === 'play' ? 0.2 : 0, headYaw: fail && t > 1.7 ? -0.9 : 0 });
    const g = P.phase === 'in' ? ease(clamp((t - 0.6) / 1.3, 0, 1)) : 1; // 안경을 벗어 트레이에 놓는다
    PB.gl.position.set(lerp(0, -0.5, g), lerp(1.08, 0.795, g) + Math.sin(g * Math.PI) * 0.05, lerp(0.42, -0.2, g)); PB.gl.rotation.set(lerp(-0.9, 0, g), lerp(0, 0.3, g), 0);
    PB.led.color.setHex(P.phase === 'in' && t < 2.2 && Math.floor(now * 6) % 2 ? 0x62d84a : 0x1a2a1c);
    const open = fail ? ease(clamp((t - 1.6) / 0.45, 0, 1)) : 0; PB.door.rotation.y = open * 1.45; PB.glow.visible = open > 0.05;
    PB.cop.root.visible = fail && t > 1.75;
    if (PB.cop.root.visible) { const u = ease(clamp((t - 1.75) / 1.3, 0, 1)); poseModel(PB.cop, { x: lerp(2.25, 1.22, u), z: -0.78, yaw: -1.05, moving: u < 1, walk: t * 1.1, phase: 'watch', now, raise: true }); PB.cop.arms[1].rotation.set(-1.25, 0, 0); }
    PB.cuffs.visible = fail && t > 3.1; if (PB.cuffs.visible) PB.cuffs.position.y = 0.78 + Math.max(0, 0.32 * (1 - (t - 3.1) / 0.22));
    PB.amb.color.setHex(fail && t > 2.0 ? (Math.floor(now / 0.32) % 2 ? 0xff8a8a : 0x8aa2ff) : 0xffffff);
    PB.paperT.t.needsUpdate = true;
    draw(PB.scene, c, now, 1.25);
  }
  function probeTex() { buildProbe(); return PB.paperT; }
  function probePick(x, y) { // 누른 자리 → 시험지 위의 위치(0~1). 종이 밖이면 null
    if (!W.ok || !PB.scene) return null;
    ndc.set(x / RW * 2 - 1, -(y / RH * 2 - 1)); ray.setFromCamera(ndc, PB.cam);
    const hit = ray.intersectObject(PB.paper)[0]; return hit && hit.uv ? [hit.uv.x, 1 - hit.uv.y] : null;
  }
  function probeSpot() { // 경찰 손전등이 화면에서 있는 자리 (640x360 좌표)
    if (!W.ok || !PB.scene || !PB.cop.root.visible) return null;
    _p.setFromMatrixPosition(PB.cop.root.matrixWorld); _p.y += 1.18; _p.project(PB.cam); return _p.z > 1 ? null : [(_p.x + 1) / 2 * RW, (1 - _p.y) / 2 * RH];
  }

  // ---------- figures: 감독관 줄 세우기 ----------
  const FIG = { scene: null };
  const FIG_TYPES = [['homeroom', 'dean', 'suneung', 'agent', 'robot', 'ta', 'prof', 'teacher'], ['cnproctor', 'don', 'don2', 'banker', 'alien', 'reaper', 'yeomra', 'omega']];
  function buildFigures() {
    if (FIG.scene) return;
    const sc = new THREE.Scene(); sc.background = new THREE.Color(0xd8cdb4);
    sc.add(new THREE.AmbientLight(0xffffff, 1.3)); sc.add(new THREE.HemisphereLight(0xfff4dc, 0x5a4a3a, 1.2));
    const sun = new THREE.DirectionalLight(0xffffff, 2.0); sun.position.set(-3, 5, 6); sc.add(sun);
    const B = batch(); B.box(16, 0.02, 10, 0xbfae8c, 0, -0.01, -1.5); sc.add(B.mesh());
    const ms = [];
    FIG_TYPES.forEach((row, r) => row.forEach((t, i) => {
      const m = makeStaff(t), x = -4.55 + i * 1.3, z = r ? -3.4 : 0;
      if (m) { m.root.position.set(x, t === 'omega' ? 0.9 : 0, z); if (t === 'omega') m.root.scale.setScalar(0.4); m.root.rotation.y = 0; sc.add(m.root); }
      ms.push({ m, label: PROCTOR_NAME[t] || t, pose: 'watch', x, z, top: !!r });
    }));
    const cam = new THREE.PerspectiveCamera(30, RW / RH, 0.1, 60); cam.position.set(0, 4.6, 12.5); cam.lookAt(0, 0.7, -1.6);
    Object.assign(FIG, { scene: sc, cam, ms });
  }
  function renderFigures(now) {
    if (!W.ok) return;
    buildFigures();
    for (const f of FIG.ms) if (f.m && f.m.robot) f.m.root.position.y = 0.06 + Math.sin(now * 4) * 0.03;
    draw(FIG.scene, FIG.cam, now, 0.3);
  }
  function figureLabels() {
    if (!W.ok || !FIG.scene) return [];
    return FIG.ms.map(f => { _p.set(f.x, f.top ? 2.3 : -0.15, f.z).project(FIG.cam); return { text: f.label, x: (_p.x + 1) / 2 * RW, y: (1 - _p.y) / 2 * RH, pose: f.pose }; });
  }

  function hasView(v) { return !!(EX && EX.views && EX.views[v]); }
  return Object.assign(W, { hasView, init, renderExam, renderHub, renderTitle, renderFigures, renderEnding, renderTableau, pickChoice, seat, moleRect, pickHub, hubLabels, figureLabels, hubRect, hubUV, laptopCanvas, surfaceCanvas, staffRects, mailTex, tvTex, renderProbe, probeTex, probePick, probeSpot, renderStairs, layout: () => EX.layout });
})();
