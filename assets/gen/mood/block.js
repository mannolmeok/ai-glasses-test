// 4번 블록 주인공을 상자로 직접 조립한다 (Meshy를 거치지 않는다).
// 힉스필드 앞·뒤·옆 그림(688×1024)에서 각 부위를 잘라 상자 면에 그대로 붙인다. 치수는 그림의 픽셀 좌표로 적는다.
window.BLOCK = (() => {
  const W = 688, H = 1024, CX = 344, CZ = 337, FEET = 1000, S = 1.7 / 985; // 그림 가운데, 옆모습 가운데, 발바닥 높이, 1픽셀이 몇 m인지
  function build(THREE, base) {
    const load = f => { const t = new THREE.TextureLoader().load(base + f); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
    const TF = load('bf.jpg'), TB = load('bb.jpg'), TS = load('bs.jpg');
    const mat = t => new THREE.MeshLambertMaterial({ map: t }), MF = mat(TF), MB = mat(TB), MS = mat(TS);
    // 상자 하나: f = 앞모습에서의 자리 [x0,y0,x1,y1], z = 옆모습에서의 깊이 [x0,x1], top = 윗면·아랫면에 쓸 앞모습 조각, o = 면별로 바꿔 쓸 조각
    function box(parent, f, z, top, o = {}) {
      const w = (f[2] - f[0]) * S, h = (f[3] - f[1]) * S, d = (z[1] - z[0]) * S, g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv;
      const face = (i, r, flip) => { let u0 = r[0] / W, u1 = r[2] / W; const v1 = 1 - r[1] / H, v0 = 1 - r[3] / H; if (flip) [u0, u1] = [u1, u0];
        uv.setXY(i * 4, u0, v1); uv.setXY(i * 4 + 1, u1, v1); uv.setXY(i * 4 + 2, u0, v0); uv.setXY(i * 4 + 3, u1, v0); };
      const side = o.side || [z[0], f[1], z[1], f[3]], back = o.back || [W - f[2], f[1], W - f[0], f[3]], t = top || [f[0] + 8, f[1] + 8, f[2] - 8, f[1] + 20];
      face(0, o.px || side, false); face(1, o.nx || side, !o.nx); face(2, t, false); face(3, o.bottom || t, false); face(4, o.front || f, false); face(5, back, false);
      const m = new THREE.Mesh(g, [o.pxM || MS, o.nxM || MS, MF, MF, MF, MB]);
      m.position.set(((f[0] + f[2]) / 2 - CX) * S, (FEET - (f[1] + f[3]) / 2) * S, -((z[0] + z[1]) / 2 - CZ) * S); parent.add(m); return m;
    }
    // 관절: 그림 좌표의 한 점을 축으로 삼는 묶음. 안에 넣는 상자는 그 점 기준으로 자리를 다시 잡는다
    function joint(parent, px, py, pz) { const g = new THREE.Group(), p = new THREE.Vector3((px - CX) * S, (FEET - py) * S, -(pz - CZ) * S); g.userData.p = p; g.position.copy(p); if (parent.userData.p) g.position.sub(parent.userData.p0 || parent.userData.p); g.userData.p0 = p; parent.add(g); return g; }
    const put = (g, m) => { m.position.sub(g.userData.p0); return m; };
    const root = new THREE.Group(), body = joint(root, CX, 628, CZ); body.position.copy(body.userData.p);
    const NAVY = [250, 440, 300, 470], SKIN = [270, 262, 300, 290], HAIR = [270, 60, 420, 120], GREY = [240, 700, 300, 760], WHITE = [215, 940, 290, 960];
    put(body, box(body, [237, 320, 452, 628], [278, 393], NAVY)); // 몸통
    put(body, box(body, [300, 298, 390, 322], [300, 375], SKIN, { side: [300, 290, 375, 300] })); // 목
    const head = joint(body, CX, 300, 330);
    put(head, box(head, [245, 150, 445, 300], [240, 390], SKIN)); // 얼굴
    put(head, box(head, [198, 20, 492, 185], [210, 480], HAIR)); // 윗머리(앞머리 포함)
    put(head, box(head, [215, 185, 475, 290], [335, 480], HAIR, { front: [300, 60, 400, 110] })); // 뒷머리
    put(head, box(head, [220, 195, 255, 265], [335, 385], SKIN, { side: SKIN, nx: [222, 197, 253, 263], nxM: MF })); // 오른쪽 귀
    put(head, box(head, [435, 195, 470, 265], [335, 385], SKIN, { side: SKIN, px: [437, 197, 468, 263], pxM: MF })); // 왼쪽 귀
    for (const [x0, y0, x1, y1, zc] of [[250, 8, 300, 40, 300], [360, 2, 420, 36, 350], [430, 30, 470, 60, 400], [205, 40, 240, 75, 380]]) put(head, box(head, [x0, y0, x1, y1], [zc - 22, zc + 22], HAIR, { front: HAIR, back: HAIR, side: HAIR })); // 삐죽 머리
    // 팔: 어깨 → 팔꿈치 → 손 (그림은 팔을 벌린 자세라 길이가 x축)
    const arm = (sx, f1, f2, hand) => { // sx: -1 오른팔(그림 왼쪽), +1 왼팔
      const sh = joint(body, CX + sx * 108, 367, 347), el = joint(sh, CX + sx * 224, 367, 347), cap = sx < 0 ? { nx: hand, nxM: MF, px: NAVY, pxM: MF } : { px: hand, pxM: MF, nx: NAVY, nxM: MF };
      put(sh, box(sh, f1, [310, 385], f1, { px: NAVY, pxM: MF, nx: NAVY, nxM: MF, bottom: f1 })); put(el, box(el, f2, [310, 385], f2, Object.assign({ bottom: f2 }, cap)));
      return { sh, el };
    };
    const R = arm(-1, [121, 327, 237, 408], [5, 327, 121, 408], [10, 340, 45, 395]), L = arm(1, [452, 327, 568, 408], [568, 327, 683, 408], [640, 340, 678, 395]);
    // 다리: 엉덩이 → 무릎 → 신발
    const leg = (f1, f2, shoe) => { const cx = (f1[0] + f1[2]) / 2, hip = joint(root, cx, 628, CZ), knee = joint(hip, cx, 775, CZ); hip.position.copy(hip.userData.p);
      put(hip, box(hip, f1, [290, 385], GREY)); put(knee, box(knee, f2, [290, 385], GREY)); put(knee, box(knee, shoe, [240, 385], WHITE)); return { hip, knee }; };
    const RL = leg([218, 628, 332, 775], [214, 775, 326, 925], [200, 920, 305, 1000]), LL = leg([356, 628, 470, 775], [362, 775, 474, 925], [383, 920, 488, 1000]);
    const ease = (a, b, k) => a + (b - a) * k, st = { k: { stand: 1, walk: 0, sit: 0 } };
    // 자세: mode = 'tpose' | 'stand' | 'walk' | 'sit'
    function pose(t, mode, dt) {
      for (const m of ['tpose', 'stand', 'walk', 'sit']) st.k[m] = ease(st.k[m] || 0, m === mode ? 1 : 0, Math.min(1, dt * 7));
      const { stand = 0, walk = 0, sit = 0 } = st.k, down = stand + walk + sit, sw = Math.sin(t * 6.2) * walk, wr = Math.sin(t * 11) * 0.05 * sit;
      body.position.y = body.userData.p.y + Math.abs(Math.sin(t * 6.2)) * 0.02 * walk - 0.42 * sit + Math.sin(t * 1.6) * 0.004 * (stand + sit);
      body.rotation.x = 0.22 * sit + Math.sin(t * 0.5) * 0.01 * sit; head.rotation.x = 0.3 * sit + Math.sin(t * 1.3) * 0.02 * stand; head.rotation.y = Math.sin(t * 0.7) * 0.25 * stand;
      R.sh.rotation.z = 1.45 * down; L.sh.rotation.z = -1.45 * down; // 벌린 팔을 내린다
      R.sh.rotation.x = sw * 0.6 - 0.75 * sit + wr; L.sh.rotation.x = -sw * 0.6 - 0.75 * sit; R.el.rotation.y = 0.85 * sit + Math.max(0, -sw) * 0.4 + 0.15 * walk; L.el.rotation.y = -0.85 * sit - Math.max(0, sw) * 0.4 - 0.15 * walk; // 팔을 앞뒤로 흔들고, 앉으면 책상 위로 올린다
      for (const [lg, s] of [[RL, 1], [LL, -1]]) { lg.hip.position.y = lg.hip.userData.p.y - 0.42 * sit; lg.hip.rotation.x = -sw * s * 0.55 - 1.5 * sit; lg.knee.rotation.x = Math.max(0, -sw * s) * 0.7 + 1.5 * sit; }
      root.position.y = 0;
    }
    return { root, pose, height: 985 * S };
  }
  return { build };
})();
