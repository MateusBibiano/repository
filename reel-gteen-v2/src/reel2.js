/* Reel vertical com narração — Voz Visível (equipe GTEeN).
   Sala de aula 3D (Three.js r128) com aluno e professor animados (boneco Xbot do three.js),
   landmarks do MediaPipe presos aos ossos (corpo e 21 pontos da mão), malha canônica do rosto
   do MediaPipe (468 pontos) com expressões, e legendas sincronizadas com a voz.
   Tudo é função do tempo t (renderAt determinístico). */
(async function () {
  const W = 1080, H = 1920;
  const C = { ink: '#050b18', blue: '#38b6ff', blue2: '#1e7fd6', ice: '#cfeaff', white: '#f3f8ff', ok: '#3ddc84', red: '#ff4d6d', warn: '#ffb627' };
  const F = '"League Spartan", "Arial Black", sans-serif';
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const p = (t, a, b) => clamp((t - a) / (b - a));
  const lerp = (a, b, x) => a + (b - a) * x;
  const eo = (x) => 1 - Math.pow(1 - x, 3);
  const eio = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const back = (x) => { const c1 = 1.7, c3 = c1 + 1; return x <= 0 ? 0 : 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  function rng(seed) { return function () { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const col = (h) => new THREE.Color(h).convertSRGBToLinear();
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  // ---------- recursos ----------
  const IMG = {};
  await Promise.all(['logo.png', 'equipe.jpg', 'interface.png', 'tbr.png'].map((f) => new Promise((res, rej) => { const im = new Image(); im.onload = res; im.onerror = () => rej(new Error(f)); im.src = 'assets/' + f; IMG[f] = im; })));
  const objText = await (await fetch('assets/canonical_face_model.obj')).text();
  const glb = await (await fetch('assets/Xbot.glb')).arrayBuffer();
  const gltf = await new Promise((res, rej) => new THREE.GLTFLoader().parse(glb, '', res, rej));
  await document.fonts.load(`800 40px ${F}`); await document.fonts.load(`600 40px ${F}`); await document.fonts.ready;
  const VOICE = window.VOICE;

  // ================= ROTEIRO (cenas = falas) =================
  const LEAD = 0.45, TAIL = 0.65;
  const SC = VOICE.lines.map((l, i) => ({ id: l.id, text: l.text, vdur: l.dur, d: (i === 0 ? 0.8 : LEAD) + l.dur + TAIL + (l.id === 'fim' ? 1.4 : 0), lead: i === 0 ? 0.8 : LEAD }));
  let acc = 0; SC.forEach((s) => { s.a = acc; acc += s.d; s.b = acc; s.v0 = s.a + s.lead; });
  const DUR = acc;
  const S = Object.fromEntries(SC.map((s) => [s.id, s]));
  const sceneAt = (t) => { let i = 0; SC.forEach((s, k) => { if (t >= s.a) i = k; }); return i; };
  const CUES = [];
  SC.forEach((s, i) => { if (i) CUES.push({ t: s.a - 0.05, k: 'swish' }); });
  const cue = (id, t, k) => CUES.push({ t: S[id].a + t, k });
  [['equipe', 0.5, 'shimmer'], ['webcam', 0.6, 'blip'], ['calibra', 2.4, 'blip'], ['calibra', 3.6, 'blip'], ['calibra', 4.8, 'blip'], ['compara', 4.8, 'chime2'], ['alerta', 0.6, 'blip'],
    ['genero', 3.4, 'blip'], ['genero', 4.2, 'blip'], ['custo', 3.2, 'shimmer'], ['testes', 1.0, 'blip'], ['testes', 2.6, 'blip'], ['fim', 0.5, 'shimmer']].forEach((c) => cue(...c));

  // ---------- Three.js ----------
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  let OW = W, OH = H; renderer.setSize(OW, OH, false);
  renderer.shadowMap.enabled = false;
  const scene = new THREE.Scene();
  scene.background = col('#0a1226');
  scene.fog = new THREE.Fog(col('#0a1226'), 9, 26);
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new THREE.RoomEnvironment(), 0.04).texture;
  const amb = new THREE.HemisphereLight(col('#cfe6ff'), col('#1a1430'), 0.55); scene.add(amb);
  const sun = new THREE.DirectionalLight(col('#ffe2b8'), 1.1); sun.position.set(-6, 7, -4); scene.add(sun);
  const fill = new THREE.DirectionalLight(col('#8fc4ff'), 0.7); fill.position.set(4, 3, 6); scene.add(fill);
  const holoLight = new THREE.PointLight(col('#38b6ff'), 0, 6); scene.add(holoLight);
  const camera = new THREE.PerspectiveCamera(42, W / H, 0.05, 120);

  // sala de aula
  const M = (c, r = 0.7, m = 0.05, e) => new THREE.MeshStandardMaterial({ color: col(c), roughness: r, metalness: m, emissive: e ? col(e) : undefined });
  const room = new THREE.Group(); scene.add(room);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 16), M('#2a3348', 0.55)); floor.rotation.x = -Math.PI / 2; room.add(floor);
  const tiles = new THREE.GridHelper(14, 28, col('#3a4a6a'), col('#323f5c')); tiles.position.y = 0.002; room.add(tiles);
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(14, 4.2), M('#25324f', 0.9)); backWall.position.set(0, 2.1, -3.6); room.add(backWall);
  const sideL = new THREE.Mesh(new THREE.PlaneGeometry(16, 4.2), M('#1f2a44', 0.9)); sideL.rotation.y = Math.PI / 2; sideL.position.set(-4.2, 2.1, 1); room.add(sideL);
  const sideR = sideL.clone(); sideR.rotation.y = -Math.PI / 2; sideR.position.x = 4.2; room.add(sideR);
  const front = new THREE.Mesh(new THREE.PlaneGeometry(14, 4.2), M('#22304d', 0.9)); front.rotation.y = Math.PI; front.position.set(0, 2.1, 6); room.add(front);
  for (let i = 0; i < 3; i++) { // janelas com luz
    const w = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.6), new THREE.MeshBasicMaterial({ color: col('#9fd4ff').multiplyScalar(1.4) }));
    w.rotation.y = Math.PI / 2; w.position.set(-4.18, 2.1, -2.2 + i * 2.4); room.add(w);
    const fr = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.7, 0.08), M('#dfe7f2')); fr.position.set(-4.15, 2.1, -2.2 + i * 2.4); room.add(fr);
  }
  const board = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.5, 0.06), M('#1d3b33', 0.8)); board.position.set(0, 1.85, 5.95); room.add(board);
  const boardFrame = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.7, 0.04), M('#c9d2df')); boardFrame.position.set(0, 1.85, 5.98); room.add(boardFrame);
  const poster = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), (() => { const t = new THREE.Texture(IMG['logo.png']); t.needsUpdate = true; t.encoding = THREE.sRGBEncoding; return new THREE.MeshBasicMaterial({ map: t, transparent: true }); })());
  poster.position.set(2.3, 2.3, -3.58); poster.scale.setScalar(0.7); poster.material.color = col('#9aa6be'); room.add(poster);
  function desk(x, z, ry = 0) {
    const g = new THREE.Group();
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.05, 0.62), M('#c79a63', 0.6)); top.position.y = 0.74; g.add(top);
    [[-0.52, -0.26], [0.52, -0.26], [-0.52, 0.26], [0.52, 0.26]].forEach(([a, b]) => { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.74, 8), M('#7c8798', 0.4, 0.6)); l.position.set(a, 0.37, b); g.add(l); });
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.04, 0.44), M('#2f6fb5', 0.5)); seat.position.set(0, 0.46, -0.62); g.add(seat);
    const backr = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.4, 0.04), M('#2f6fb5', 0.5)); backr.position.set(0, 0.7, -0.86); g.add(backr);
    [[-0.2, -0.82], [0.2, -0.82], [-0.2, -0.42], [0.2, -0.42]].forEach(([a, b]) => { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.46, 6), M('#7c8798', 0.4, 0.6)); l.position.set(a, 0.23, b); g.add(l); });
    g.position.set(x, 0, z); g.rotation.y = ry; room.add(g); return g;
  }
  const SEATS = [[0, 0.62], [-1.7, 0.62], [1.7, 0.62], [-0.85, -1.3], [0.85, -1.3]];
  SEATS.forEach(([x, z]) => desk(x, z));
  // mesa e notebook do professor
  const tdesk = new THREE.Group();
  const tdTop = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 0.8), M('#8b5e3c', 0.55)); tdTop.position.y = 0.76; tdesk.add(tdTop);
  const tdBody = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.7, 0.7), M('#6b4a30', 0.6)); tdBody.position.y = 0.38; tdesk.add(tdBody);
  tdesk.position.set(2.3, 0, 3.6); room.add(tdesk);
  const laptop = new THREE.Group();
  const lbase = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.025, 0.42), M('#aab4c3', 0.3, 0.8)); laptop.add(lbase);
  const lid = new THREE.Group(); lid.position.set(0, 0.01, -0.21); lid.rotation.x = 0.12; laptop.add(lid);
  const lidBox = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.4, 0.02), M('#aab4c3', 0.3, 0.8)); lidBox.position.set(0, 0.2, -0.012); lid.add(lidBox);
  const scrTex = new THREE.Texture(IMG['interface.png']); scrTex.needsUpdate = true; scrTex.encoding = THREE.sRGBEncoding;
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.58 * 717 / 1275), new THREE.MeshBasicMaterial({ map: scrTex, toneMapped: false })); scr.position.set(0, 0.2, 0.0); lid.add(scr);
  const alertGlow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: col(C.blue).multiplyScalar(2.5), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  { const w = 0.58, h = 0.58 * 717 / 1275; alertGlow.position.set(((720 + 1240) / 2 / 1275 - 0.5) * w, 0.2 - (((287 + 393) / 2) / 717 - 0.5) * h, 0.002); alertGlow.scale.set((520 / 1275) * w * 1.05, (106 / 717) * h * 1.2, 1); lid.add(alertGlow); }
  laptop.position.set(2.3, 0.8, 3.45); room.add(laptop); // tela virada para o professor (lado +z)
  // webcam na mesa do aluno
  function webcamModel() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.06, 32, 24), M('#151d2e', 0.3, 0.6)); body.scale.set(1.5, 1, 1);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.033, 0.006, 12, 32), M('#aebfd6', 0.15, 0.95)); ring.position.z = 0.052;
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.031, 32), new THREE.MeshStandardMaterial({ color: col('#081a3a'), roughness: 0.05, metalness: 0.2, emissive: col('#0b3a7a') })); lens.position.z = 0.053;
    const led = new THREE.Mesh(new THREE.CircleGeometry(0.006, 12), new THREE.MeshBasicMaterial({ color: col(C.ok).multiplyScalar(2), toneMapped: false })); led.position.set(0.062, 0.015, 0.046);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.08, 8), M('#2a3550', 0.4, 0.6)); leg.position.y = -0.08;
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.012, 24), M('#1a2338', 0.4, 0.6)); foot.position.y = -0.12;
    g.add(body, ring, lens, led, leg, foot); return g;
  }
  const cam3d = webcamModel(); cam3d.position.set(0.32, 0.88, 0.88); cam3d.rotation.y = Math.PI + 0.25; room.add(cam3d); // olhando para o aluno

  // ---------- personagens ----------
  const san = (n) => 'mixamorig' + n;
  function makeChar(surface, joints) {
    const root = THREE.SkeletonUtils.clone(gltf.scene);
    root.traverse((o) => {
      if (o.isSkinnedMesh) {
        const isJ = /Joints/.test(o.name) || /Joints/.test(o.material.name);
        o.material = new THREE.MeshStandardMaterial({ skinning: true, color: col(isJ ? joints : surface), roughness: isJ ? 0.35 : 0.45, metalness: isJ ? 0.6 : 0.25 });
        o.frustumCulled = false;
      }
    });
    const mixer = new THREE.AnimationMixer(root);
    const acts = {}; gltf.animations.forEach((a) => { acts[a.name] = mixer.clipAction(a); });
    const bone = (n) => root.getObjectByName(san(n));
    scene.add(root);
    return { root, mixer, acts, bone };
  }
  const student = makeChar('#3b7fd9', '#cfe6ff');
  const friend = makeChar('#8f6ad9', '#f0e4ff');
  const teacher = makeChar('#e6edf7', '#38b6ff');
  const extras = [2, 3, 4].map(() => makeChar('#556079', '#9aa6be'));

  const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _q3 = new THREE.Quaternion();
  function aim(ch, name, childName, dir, w = 1) { // gira o osso para o filho apontar na direção dir (mundo)
    if (w <= 0) return;
    const b = ch.bone(name), c = ch.bone(childName);
    b.updateWorldMatrix(true, false); c.updateWorldMatrix(true, false);
    b.getWorldPosition(_a); c.getWorldPosition(_b);
    const cur = _b.sub(_a).normalize();
    _q.setFromUnitVectors(cur, dir.clone().normalize());
    _q2.identity().slerp(_q, w);
    b.getWorldQuaternion(_q3);
    const nw = _q2.multiply(_q3);
    const parentQ = new THREE.Quaternion(); b.parent.getWorldQuaternion(parentQ);
    b.quaternion.copy(parentQ.invert().multiply(nw));
    b.updateMatrixWorld(true);
  }
  // pose: {clip, time, x, z, ry, sit, raise (mão direita), desk (braços na mesa), lookYaw, lookPitch, leanFwd}
  function pose(ch, st) {
    Object.values(ch.acts).forEach((a) => { a.stop(); });
    const a = ch.acts[st.clip || 'idle']; a.reset(); a.play(); a.setEffectiveWeight(1);
    ch.mixer.setTime(st.time || 0);
    ch.root.position.set(st.x || 0, (st.sit || 0) * -0.43, st.z || 0);
    ch.root.rotation.set(0, st.ry || 0, 0);
    ch.root.updateMatrixWorld(true);
    const ry = st.ry || 0;
    const fwd = V(Math.sin(ry), 0, Math.cos(ry)), up = V(0, 1, 0), right = V(-Math.cos(ry), 0, Math.sin(ry)); // direita do personagem
    const sit = st.sit || 0;
    if (sit > 0) {
      ['Left', 'Right'].forEach((s) => {
        aim(ch, s + 'UpLeg', s + 'Leg', fwd.clone().multiplyScalar(1).add(up.clone().multiplyScalar(-0.08)), sit);
        aim(ch, s + 'Leg', s + 'Foot', up.clone().multiplyScalar(-1).add(fwd.clone().multiplyScalar(0.12)), sit);
        aim(ch, s + 'Foot', s + 'ToeBase', fwd.clone().add(up.clone().multiplyScalar(-0.35)), sit);
      });
    }
    if (st.leanFwd) aim(ch, 'Spine1', 'Spine2', up.clone().add(fwd.clone().multiplyScalar(st.leanFwd)), 1);
    const dk = st.desk || 0;
    if (dk > 0) {
      ['Left', 'Right'].forEach((s) => {
        const side = s === 'Right' ? right : right.clone().multiplyScalar(-1);
        if (s === 'Right' && (st.raise || 0) > 0.5) return;
        aim(ch, s + 'Arm', s + 'ForeArm', fwd.clone().multiplyScalar(0.35).add(up.clone().multiplyScalar(-0.9)).add(side.clone().multiplyScalar(0.12)), dk);
        aim(ch, s + 'ForeArm', s + 'Hand', fwd.clone().add(side.clone().multiplyScalar(-0.35)).add(up.clone().multiplyScalar(0.05)), dk);
        aim(ch, s + 'Hand', s + 'HandMiddle1', fwd.clone().add(side.clone().multiplyScalar(-0.3)).add(up.clone().multiplyScalar(-0.15)), dk);
      });
    }
    const r = st.raise || 0;
    if (r > 0) {
      aim(ch, 'RightArm', 'RightForeArm', up.clone().multiplyScalar(0.95).add(right.clone().multiplyScalar(0.25)).add(fwd.clone().multiplyScalar(0.1)), r);
      aim(ch, 'RightForeArm', 'RightHand', up.clone().add(fwd.clone().multiplyScalar(0.08)), r);
      aim(ch, 'RightHand', 'RightHandMiddle1', up.clone().add(fwd.clone().multiplyScalar(0.05)), r);
    }
    if (st.lookYaw !== undefined || st.lookPitch !== undefined) {
      const yw = st.lookYaw || 0, pt = st.lookPitch || 0;
      const d = fwd.clone().applyAxisAngle(up, yw).add(V(0, Math.sin(pt), 0));
      aim(ch, 'Neck', 'Head', up.clone().add(d.clone().multiplyScalar(0.25)), 1);
      aim(ch, 'Head', 'HeadTop_End', up.clone().add(d.clone().multiplyScalar(0.55)), 1);
    }
    ch.root.updateMatrixWorld(true);
  }
  const wpos = (ch, n) => ch.bone(n).getWorldPosition(new THREE.Vector3());

  // ---------- landmarks (pontos + ligações) ----------
  const DOT = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.45, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  function makeFig(n, edges, opts = {}) {
    const g = new THREE.Group();
    const pgeo = new THREE.BufferGeometry(); pgeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    const lgeo = new THREE.BufferGeometry(); lgeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(edges.length * 6), 3));
    const pm = new THREE.PointsMaterial({ map: DOT, color: col(opts.dot || '#ffffff').multiplyScalar(1.6), size: opts.size || 0.035, sizeAttenuation: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, toneMapped: false });
    const lm = new THREE.LineBasicMaterial({ color: col(opts.line || C.blue).multiplyScalar(1.6), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, toneMapped: false });
    const pts = new THREE.Points(pgeo, pm), lines = new THREE.LineSegments(lgeo, lm);
    pts.renderOrder = lines.renderOrder = 10; pts.frustumCulled = lines.frustumCulled = false;
    g.add(lines, pts); scene.add(g);
    return {
      g, set(P, reveal = 1, alpha = 1) {
        const pa = pgeo.attributes.position.array, la = lgeo.attributes.position.array;
        P.forEach((v, i) => { pa[i * 3] = v.x; pa[i * 3 + 1] = v.y; pa[i * 3 + 2] = v.z; });
        edges.forEach(([a, b], i) => { const q = clamp(reveal * edges.length - i); const A = P[a], B = P[b]; la.set([A.x, A.y, A.z, lerp(A.x, B.x, q), lerp(A.y, B.y, q), lerp(A.z, B.z, q)], i * 6); });
        pgeo.attributes.position.needsUpdate = true; lgeo.attributes.position.needsUpdate = true;
        pgeo.setDrawRange(0, Math.round(n * clamp(reveal * 1.3)));
        pm.opacity = lm.opacity = alpha; g.visible = alpha > 0.01;
      }, mats: [pm, lm],
    };
  }
  const POSE_BONES = ['Head', 'LeftArm', 'RightArm', 'LeftForeArm', 'RightForeArm', 'LeftHand', 'RightHand', 'LeftUpLeg', 'RightUpLeg', 'LeftLeg', 'RightLeg', 'LeftFoot', 'RightFoot', 'Neck'];
  const POSE_EDGES = [[13, 1], [13, 2], [1, 3], [3, 5], [2, 4], [4, 6], [1, 7], [2, 8], [7, 8], [7, 9], [9, 11], [8, 10], [10, 12], [0, 13]];
  const HAND_BONES = ['RightHand'].concat(...['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'].map((f) => [1, 2, 3, 4].map((k) => 'RightHand' + f + k)));
  const HAND_EDGES = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [17, 18], [18, 19], [19, 20], [0, 17]];
  const bodyFig = makeFig(POSE_BONES.length, POSE_EDGES, { size: 0.045 });
  const handFig = makeFig(21, HAND_EDGES, { size: 0.016 });
  const friendHand = makeFig(21, HAND_EDGES, { size: 0.022, line: '#c9a6ff' });
  const bodyPts = (ch) => POSE_BONES.map((n) => wpos(ch, n));
  const handPts = (ch) => HAND_BONES.map((n) => wpos(ch, n.replace('Right', 'Right')));

  // ---------- malha do rosto (MediaPipe canonical face model) ----------
  const FV = [], FF = [];
  objText.split('\n').forEach((l) => { const s = l.trim().split(/\s+/); if (s[0] === 'v') FV.push([+s[1], +s[2], +s[3]]); if (s[0] === 'f') FF.push(s.slice(1).map((x) => parseInt(x.split('/')[0], 10) - 1)); });
  const FE = (() => { const set = new Set(), out = []; FF.forEach((f) => { for (let i = 0; i < f.length; i++) { const a = f[i], b = f[(i + 1) % f.length]; const k = a < b ? a + '_' + b : b + '_' + a; if (!set.has(k)) { set.add(k); out.push([a, b]); } } }); return out; })();
  function faceVerts(brow = 0, smile = 0, mouthOpen = 0) {
    return FV.map(([x, y, z]) => {
      let X = x, Y = y, Z = z;
      // sobrancelhas sobem (região acima dos olhos)
      const bw = smooth(2.6, 4.2, y) * (1 - smooth(6.4, 7.6, y)) * smooth(0.8, 2.2, Math.abs(x));
      Y += brow * 0.9 * bw;
      // sorriso: cantos da boca sobem e abrem
      const mw = smooth(-6.6, -5.4, y) * (1 - smooth(-3.6, -2.6, y));
      const corner = smooth(1.2, 3.6, Math.abs(x));
      Y += smile * 0.75 * mw * corner; X += smile * 0.35 * mw * corner * Math.sign(x);
      // boca abre (lábio de baixo desce)
      Y -= mouthOpen * 0.7 * smooth(-6.6, -5.6, y) * (1 - smooth(-4.9, -4.5, y)) * (1 - smooth(2.6, 3.4, Math.abs(x)));
      return V(X, Y, Z);
    });
  }
  function makeFace(scale) {
    const g = new THREE.Group();
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(FV.length * 3); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const idx = []; FF.forEach((f) => { for (let i = 1; i < f.length - 1; i++) idx.push(f[0], f[i], f[i + 1]); }); geo.setIndex(idx);
    const skin = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: col('#0e2a5a'), roughness: 0.35, metalness: 0.3, transparent: true, opacity: 0.55, side: THREE.DoubleSide, flatShading: true, emissive: col('#071a3a') }));
    const fig = makeFig(FV.length, FE, { size: 0.012 * scale / 0.012, line: '#38b6ff' });
    scene.remove(fig.g); g.add(skin, fig.g); g.scale.setScalar(scale); scene.add(g);
    return {
      g, set(brow, smile, mouth, reveal = 1, alpha = 1) {
        const P = faceVerts(brow, smile, mouth);
        P.forEach((v, i) => { pos[i * 3] = v.x; pos[i * 3 + 1] = v.y; pos[i * 3 + 2] = v.z; });
        geo.attributes.position.needsUpdate = true; geo.computeVertexNormals();
        fig.set(P, reveal, alpha); skin.material.opacity = 0.55 * alpha * clamp(reveal * 1.5); g.visible = alpha > 0.01;
      }, fig, skin,
    };
  }
  const bigFace = makeFace(0.034); // holograma grande
  bigFace.fig.mats[0].size = 0.014;
  const headFace = makeFace(0.0105); // no rosto do aluno
  headFace.fig.mats[0].size = 0.0045;
  const friendFace = makeFace(0.0105); friendFace.fig.mats[0].size = 0.0045; friendFace.fig.mats[1].color.copy(col('#c9a6ff').multiplyScalar(1.6));
  function placeOnHead(face, ch, lift = 0.085, fwdOff = 0.105) {
    const h = ch.bone('Head'); h.updateWorldMatrix(true, false);
    const hp = h.getWorldPosition(new THREE.Vector3()), top = wpos(ch, 'HeadTop_End');
    const up = top.clone().sub(hp).normalize();
    const ry = ch.root.rotation.y; const fwd = V(Math.sin(ry), 0, Math.cos(ry));
    const side = new THREE.Vector3().crossVectors(up, fwd).normalize(); const f2 = new THREE.Vector3().crossVectors(side, up).normalize();
    face.g.position.copy(hp).addScaledVector(up, lift).addScaledVector(f2, fwdOff);
    const m = new THREE.Matrix4().makeBasis(side.negate(), up, f2); face.g.quaternion.setFromRotationMatrix(m);
  }

  // ---------- hologramas e efeitos ----------
  const beam = (() => { // cone de varredura da webcam
    const geo = new THREE.ConeGeometry(0.5, 1, 40, 1, true); geo.translate(0, -0.5, 0); geo.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(geo, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { uA: { value: 0 }, uT: { value: 0 } },
      vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: 'uniform float uA; uniform float uT; varying vec3 vP; void main(){ float d = clamp(-vP.z,0.0,1.0); float s = 0.5+0.5*sin(d*40.0-uT*8.0); gl_FragColor = vec4(vec3(0.22,0.71,1.0)*uA*(1.0-d)*(0.4+0.6*s),1.0); }' }));
    m.frustumCulled = false; scene.add(m); return m;
  })();
  const pulses = (() => { // sinal viajando do aluno até o notebook
    const n = 26, geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: col(C.blue).multiplyScalar(2.5), size: 0.09, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    pts.frustumCulled = false; scene.add(pts); return { pts, n, geo };
  })();
  function setPulse(from, to, q, a) {
    const arr = pulses.geo.attributes.position.array;
    for (let i = 0; i < pulses.n; i++) { const u = clamp(q * 1.4 - (i / pulses.n) * 0.4); const pnt = from.clone().lerp(to, u); pnt.y += Math.sin(u * Math.PI) * 0.9; arr.set([pnt.x, pnt.y, pnt.z], i * 3); }
    pulses.geo.attributes.position.needsUpdate = true; pulses.pts.material.opacity = a; pulses.pts.visible = a > 0.01;
  }
  function badge(size) {
    const g = new THREE.Group();
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(size / 2 + 0.03, size / 2 + 0.03, 0.08, 96), M('#1e7fd6', 0.2, 0.9)); disc.rotation.x = Math.PI / 2; disc.position.z = -0.05;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(size / 2 + 0.03, 0.02, 16, 96), new THREE.MeshBasicMaterial({ color: col(C.blue).multiplyScalar(2), toneMapped: false }));
    const t = new THREE.Texture(IMG['logo.png']); t.needsUpdate = true; t.encoding = THREE.sRGBEncoding;
    const face = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: t, transparent: true, toneMapped: false }));
    const bf = face.clone(); bf.rotation.y = Math.PI; bf.position.z = -0.1;
    g.add(disc, ring, face, bf); scene.add(g); return g;
  }
  const logoHolo = badge(0.9);
  const teamCard = (() => { const t = new THREE.Texture(IMG['equipe.jpg']); t.needsUpdate = true; t.encoding = THREE.sRGBEncoding; const w = 1.9, h = w * IMG['equipe.jpg'].height / IMG['equipe.jpg'].width;
    const g = new THREE.Group(); const fr = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.06, h + 0.06), new THREE.MeshBasicMaterial({ color: col(C.blue).multiplyScalar(1.6), toneMapped: false })); fr.position.z = -0.01;
    g.add(fr, new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, toneMapped: false }))); scene.add(g); return g; })();
  // escudo (privacidade)
  const shield = (() => { const sh = new THREE.Shape(); sh.moveTo(0, 0.44); sh.quadraticCurveTo(0.24, 0.38, 0.38, 0.34); sh.quadraticCurveTo(0.38, -0.12, 0, -0.44); sh.quadraticCurveTo(-0.38, -0.12, -0.38, 0.34); sh.quadraticCurveTo(-0.24, 0.38, 0, 0.44);
    const m = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 4 }), M('#1e7fd6', 0.2, 0.9)); scene.add(m); return m; })();
  // partículas no ar (poeira iluminada)
  const PART = 500, pg = new THREE.BufferGeometry();
  (() => { const r = rng(9), pos = new Float32Array(PART * 3), sp = new Float32Array(PART); for (let i = 0; i < PART; i++) { pos[i * 3] = (r() * 2 - 1) * 4; pos[i * 3 + 1] = r() * 3.6; pos[i * 3 + 2] = -3.5 + r() * 9; sp[i] = r(); } pg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); pg.setAttribute('sp', new THREE.BufferAttribute(sp, 1)); })();
  const pmat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uTime: { value: 0 }, uScale: { value: OH / 2 }, uA: { value: 1 } },
    vertexShader: 'uniform float uTime; uniform float uScale; attribute float sp; varying float vA; void main(){ vec3 p = position; p.y = mod(p.y + uTime*0.04*(0.3+sp), 3.6); p.x += sin(uTime*0.3+sp*20.0)*0.1; vec4 mv = modelViewMatrix*vec4(p,1.0); gl_PointSize = uScale*0.012*(0.5+sp)/-mv.z; vA = 0.2+0.8*sp; gl_Position = projectionMatrix*mv; }',
    fragmentShader: 'uniform float uA; varying float vA; void main(){ float d = length(gl_PointCoord-0.5); if(d>0.5) discard; gl_FragColor = vec4(vec3(1.0,0.9,0.7)*(1.0-d*2.0)*vA*uA,1.0); }' });
  scene.add(new THREE.Points(pg, pmat));

  // pós
  const composer = new THREE.EffectComposer(renderer); composer.setPixelRatio(1); composer.setSize(OW, OH);
  const bloom = new THREE.UnrealBloomPass(new THREE.Vector2(OW, OH), 0.55, 0.45, 1.0);
  const fin = new THREE.ShaderPass({ uniforms: { tDiffuse: { value: null }, uCA: { value: 0.0015 }, uDark: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uCA; uniform float uDark; varying vec2 vUv;
      vec3 toSRGB(vec3 c){ c = max(c,0.0); return mix(c*12.92, 1.055*pow(c, vec3(0.41666))-0.055, step(vec3(0.0031308), c)); }
      vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0); }
      void main(){ vec2 d = vUv-0.5; float r2 = dot(d,d); vec2 off = d*uCA*(0.5+r2*3.0);
        vec3 c = vec3(texture2D(tDiffuse, vUv+off).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv-off).b);
        c = aces(c*0.9); c *= 1.0 - (0.42+uDark*0.3)*smoothstep(0.1, 0.62, r2*1.5); gl_FragColor = vec4(toSRGB(c),1.0); }` });
  composer.addPass(new THREE.RenderPass(scene, camera)); composer.addPass(bloom); composer.addPass(fin);

  // ================= DIREÇÃO DE CADA CENA =================
  // cada cena define câmera (pos/alvo), poses, hologramas e o "escurecer" da sala
  const STU = { x: 0, z: 0.62 - 0.62, ry: 0 }; // aluno sentado na carteira (assento em z = 0)
  function baseScene(lt, t) {
    // pose padrão: todos sentados com os braços na mesa
    pose(student, { clip: 'idle', time: t, ...STU, sit: 1, desk: 1, lookPitch: -0.1 });
    pose(friend, { clip: 'idle', time: t + 1.3, x: -1.7, z: 0, ry: 0, sit: 1, desk: 1, lookPitch: -0.12 });
    extras.forEach((e, k) => { const s = SEATS[k + 2]; pose(e, { clip: 'idle', time: t + k * 0.7, x: s[0], z: s[1] - 0.62, ry: 0, sit: 1, desk: 1, lookPitch: -0.15 }); });
    pose(teacher, { clip: 'idle', time: t, x: 2.9, z: 5.1, ry: Math.PI, lookPitch: 0 });
  }
  const DIRECT = {
    hook(lt, t) {
      pose(student, { clip: 'sad_pose', time: 0, ...STU, sit: 1, desk: 0.6, lookPitch: -0.35 });
      return { cam: V(lerp(2.6, 1.3, eio(p(lt, 0, 6))), lerp(2.6, 1.6, eio(p(lt, 0, 6))), lerp(5.2, 2.6, eio(p(lt, 0, 6)))), look: V(0, 1.0, 0), dark: 0.35 };
    },
    problema(lt, t) {
      const r = lt > 2 && lt < 5 ? Math.sin(p(lt, 2, 5) * Math.PI) * 0.55 : 0; // tenta levantar a mão e desiste
      pose(student, { clip: 'idle', time: t, ...STU, sit: 1, desk: 1, raise: r, lookPitch: 0.05 });
      pose(teacher, { clip: 'idle', time: t, x: 1.2, z: 5.2, ry: 0, lookPitch: 0.1 }); // de costas, escrevendo no quadro
      return { cam: V(-0.7 + Math.sin(lt * 0.2) * 0.1, 1.55, -1.25), look: V(0.9, 1.25, 4.5), dark: 0.2 };
    },
    equipe(lt, t) {
      const q = back(p(lt, 0.3, 1.3));
      logoHolo.visible = true; logoHolo.position.set(0, 1.72, 0.95); logoHolo.scale.setScalar(Math.max(0.01, q) * 0.55); logoHolo.rotation.y = (1 - q) * 6 + Math.sin(lt) * 0.3;
      return { cam: V(Math.sin(lt * 0.25) * 0.25, 1.6, 3.0), look: V(0, 1.45, 0.6), dark: 0.55, holo: 1 };
    },
    webcam(lt, t) {
      const sweep = eo(p(lt, 0.8, 2.2));
      beam.visible = true; beam.position.copy(cam3d.position).add(V(-0.02, 0, -0.06)); beam.lookAt(V(0, 1.1, -0.05)); beam.scale.set(0.9 * sweep + 0.01, 0.9 * sweep + 0.01, 1.05 * sweep + 0.01);
      beam.material.uniforms.uA.value = sweep * 0.55; beam.material.uniforms.uT.value = t;
      bodyFig.set(bodyPts(student), eo(p(lt, 2.0, 3.6)), 1);
      const k = eio(p(lt, 0, 2.6));
      return { cam: V(lerp(0.75, -0.9, k), lerp(1.0, 1.45, k), lerp(1.35, 2.5, k)), look: V(lerp(0.32, 0, k), lerp(0.88, 1.05, k), lerp(0.88, 0.2, k)), dark: 0.45 };
    },
    calibra(lt, t) {
      // o aluno mostra os três tipos de sinal
      const brow = Math.sin(p(lt, 1.6, 2.8) * Math.PI), raise = Math.sin(p(lt, 2.9, 4.3) * Math.PI), lean = Math.sin(p(lt, 4.4, 5.8) * Math.PI);
      pose(student, { clip: 'idle', time: t, ...STU, sit: 1, desk: 1, raise, leanFwd: lean * 0.35, lookPitch: 0 });
      placeOnHead(headFace, student); headFace.set(brow, 0, 0, 1, 0.9);
      handFig.set(handPts(student), 1, raise);
      bodyFig.set(bodyPts(student), 1, 0.85);
      return { cam: V(Math.sin(lt * 0.2) * 0.4, 1.35, 2.35), look: V(0, 1.05, 0), dark: 0.55 };
    },
    rosto(lt, t) {
      const brow = smooth(1.4, 2.0, lt) * (1 - smooth(3.0, 3.6, lt)), smile = smooth(3.4, 4.0, lt);
      bigFace.g.position.set(0, 1.55, 1.25); bigFace.g.rotation.set(0.05, Math.sin(lt * 0.7) * 0.5 + (1 - eo(p(lt, 0, 1))) * 1.5, 0);
      bigFace.set(brow, smile, smile * 0.2, eo(p(lt, 0.1, 1.6)), 1);
      return { cam: V(0, 1.6, 2.85), look: V(0, 1.55, 1.25), dark: 0.85, holo: 1 };
    },
    maos(lt, t) {
      const raise = eio(p(lt, 0.3, 1.3));
      pose(student, { clip: 'idle', time: t, ...STU, sit: 1, desk: 1, raise, lookPitch: 0.1 });
      handFig.set(handPts(student), eo(p(lt, 0.8, 2.0)), 1);
      bodyFig.set(bodyPts(student), eo(p(lt, 3.0, 4.6)), 1);
      placeOnHead(headFace, student); headFace.set(0, 0, 0, eo(p(lt, 3.6, 5)), 0.8);
      const hand = wpos(student, 'RightHandMiddle1');
      const k = eio(p(lt, 2.6, 4.2));
      return { cam: V(lerp(hand.x + 0.15, 0.4, k), lerp(hand.y + 0.05, 1.45, k), lerp(hand.z + 0.75, 2.9, k)), look: V(lerp(hand.x, 0, k), lerp(hand.y, 1.15, k), lerp(hand.z, 0, k)), dark: 0.6 };
    },
    compara(lt, t) {
      pose(student, { clip: 'idle', time: t, ...STU, sit: 1, desk: 1, raise: 1, lookPitch: 0.1 });
      handFig.set(handPts(student), 1, 1); bodyFig.set(bodyPts(student), 1, 1);
      placeOnHead(headFace, student); headFace.set(0, 0, 0, 1, 0.8);
      const ok = p(lt, 4.6, 5.0);
      [handFig, bodyFig].forEach((f) => f.mats[1].color.copy(col(C.blue)).lerp(col(C.ok), ok).multiplyScalar(1.6));
      setPulse(wpos(student, 'RightHand'), V(2.3, 1.1, 3.4), p(lt, 5.4, 6.8), lt > 5.4 ? 1 - p(lt, 6.8, 7.2) : 0);
      return { cam: V(-0.6 + Math.sin(lt * 0.3) * 0.3, 1.5, 2.6), look: V(0.1, 1.25, 0.2), dark: 0.6 };
    },
    alerta(lt, t) {
      const glowA = p(lt, 0.4, 0.8) * (0.4 + 0.3 * Math.sin(lt * 7));
      alertGlow.material.opacity = lt < 6.5 ? glowA : 0;
      // professor no notebook -> vira -> vai até o aluno
      const walk = p(lt, 3.0, 6.0);
      if (walk <= 0) pose(teacher, { clip: 'idle', time: t, x: 2.3, z: 4.35, ry: Math.PI, lookPitch: -0.45, lookYaw: lt > 1.6 ? -0.5 * smooth(1.6, 2.4, lt) : 0 });
      else {
        const from = V(2.3, 0, 4.35), to = V(0.75, 0, 1.0), q = eio(walk), ps = from.clone().lerp(to, q);
        const dir = to.clone().sub(from); const ry = Math.atan2(dir.x, dir.z);
        pose(teacher, { clip: walk < 1 ? 'walk' : 'idle', time: t, x: ps.x, z: ps.z, ry: walk < 1 ? ry : ry + 0.6 * smooth(6, 6.6, lt), lookPitch: -0.1 });
      }
      pose(student, { clip: 'idle', time: t, ...STU, sit: 1, desk: 1, raise: 1 - smooth(4.5, 5.5, lt), lookPitch: 0.05, lookYaw: 0.4 * smooth(4, 5, lt) });
      const k = eio(p(lt, 2.4, 4.6));
      const k0 = eo(p(lt, 0, 1.6));
      return { cam: V(lerp(1.75, 1.0, k) + (1 - k0) * 0.25, lerp(1.25, 2.3, k), lerp(4.15, 5.2, k) + (1 - k0) * -0.2), look: V(lerp(2.28, 1.0, k), lerp(0.99, 0.85, k), lerp(3.36, 1.6, k)), dark: 0.15 };
    },
    genero(lt, t) {
      const r1 = smooth(2.8, 3.5, lt) * (1 - smooth(6.8, 7.4, lt)), b2 = smooth(3.6, 4.2, lt) * (1 - smooth(6.8, 7.4, lt));
      pose(student, { clip: 'idle', time: t, ...STU, sit: 1, desk: 1, raise: r1, lookPitch: 0 });
      pose(friend, { clip: 'idle', time: t + 1.3, x: -1.7, z: 0, ry: 0, sit: 1, desk: 1, lookPitch: 0 });
      handFig.set(handPts(student), 1, r1);
      placeOnHead(friendFace, friend); friendFace.set(b2, b2 * 0.4, 0, 1, 0.9);
      placeOnHead(headFace, student); headFace.set(0, 0, 0, 1, 0.5);
      return { cam: V(-0.85 + Math.sin(lt * 0.2) * 0.2, 1.75, 4.7), look: V(-0.85, 1.0, 0), dark: 0.5 };
    },
    custo(lt, t) {
      const q = back(p(lt, 0.3, 1.2));
      shield.visible = true; shield.position.set(0.0, 1.66, 0.7); shield.scale.setScalar(Math.max(0.01, q) * 0.42); shield.rotation.y = (1 - q) * 4 + Math.sin(lt * 1.1) * 0.4;
      cam3d.rotation.y = Math.PI + 0.25 + Math.sin(lt * 1.5) * 0.08;
      return { cam: V(0.15, 1.45, 2.75), look: V(0.0, 1.38, 1.0), dark: 0.6, holo: 1 };
    },
    testes(lt, t) {
      const raise = Math.sin(p(lt, 0.5, 3.0) * Math.PI);
      pose(student, { clip: 'idle', time: t, ...STU, sit: 1, desk: 1, raise, lookPitch: 0 });
      handFig.set(handPts(student), 1, raise); bodyFig.set(bodyPts(student), 1, 0.9);
      placeOnHead(headFace, student); headFace.set(Math.sin(p(lt, 3.2, 4.6) * Math.PI), 0, 0, 1, 0.8);
      const a = lt * 0.35;
      return { cam: V(Math.sin(a) * 2.4, 1.55, Math.cos(a) * 2.4 + 0.1), look: V(0, 1.05, 0), dark: 0.5 };
    },
    fim(lt, t) {
      const q = back(p(lt, 0.3, 1.3));
      logoHolo.visible = lt < 5.2; logoHolo.position.set(0, 1.5 + eio(p(lt, 4.4, 5.2)) * 1.2, 1.2); logoHolo.scale.setScalar(Math.max(0.01, q) * 0.5); logoHolo.rotation.y = (1 - q) * 6 + Math.sin(lt) * 0.25;
      teamCard.visible = lt > 4.6; teamCard.position.set(0, 1.5 + (1 - eo(p(lt, 4.6, 5.6))) * -0.8, 1.25); teamCard.rotation.set(0, Math.sin(lt * 0.5) * 0.12, 0); teamCard.scale.setScalar(0.4 * eo(p(lt, 4.6, 5.6)) + 0.001);
      return { cam: V(Math.sin(lt * 0.2) * 0.3, 1.55, 3.4), look: V(0, 1.5, 1.2), dark: 0.85, holo: 1 };
    },
  };

  // ---------- camada 2D ----------
  const out = document.createElement('canvas');
  function txt(c, s, x, y, o = {}) {
    c.save(); c.globalAlpha *= o.a ?? 1; c.font = `${o.w || 800} ${o.s || 60}px ${F}`; c.textAlign = o.al || 'center'; c.textBaseline = 'alphabetic';
    if (o.stroke) { c.lineJoin = 'round'; c.lineWidth = o.stroke; c.strokeStyle = 'rgba(3,8,20,0.9)'; c.strokeText(s, x, y); }
    else { c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 16; c.shadowOffsetY = 3; }
    c.fillStyle = o.c || C.white; c.fillText(s, x, y); c.restore();
  }
  function tag(c, s, x, y, a, bg = C.blue, fg = C.ink, size = 34) {
    if (a <= 0) return; c.save(); c.globalAlpha = a; c.font = `800 ${size}px ${F}`; c.letterSpacing = '4px';
    const w = c.measureText(s).width + 56, h = size * 1.55, X = x - w / 2;
    c.beginPath(); c.moveTo(X + 14, y); c.lineTo(X + w, y); c.lineTo(X + w - 14, y + h); c.lineTo(X, y + h); c.closePath(); c.fillStyle = bg; c.fill();
    c.fillStyle = fg; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(s, x + 2, y + h / 2 + 3); c.restore();
  }
  function chip(c, s, x, y, a, o = {}) {
    if (a <= 0) return; c.save(); c.globalAlpha = a; const sz = o.s || 40; c.font = `700 ${sz}px ${F}`;
    const w = c.measureText(s).width + (o.icon ? 110 : 64), h = sz * 1.8, X = o.al === 'left' ? x : x - w / 2;
    c.fillStyle = o.bg || 'rgba(8,24,56,0.86)'; c.beginPath(); c.roundRect(X, y, w, h, h / 2); c.fill(); c.strokeStyle = o.border || 'rgba(56,182,255,0.6)'; c.lineWidth = 3; c.stroke();
    if (o.icon) { c.fillStyle = o.iconBg || C.ok; c.beginPath(); c.arc(X + h / 2 + 4, y + h / 2, h * 0.32, 0, 7); c.fill(); c.fillStyle = C.ink; c.font = `800 ${sz * 0.9}px ${F}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(o.icon, X + h / 2 + 4, y + h / 2 + 3); }
    c.fillStyle = o.c || C.white; c.font = `700 ${sz}px ${F}`; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(s, X + (o.icon ? h + 18 : 32), y + h / 2 + 3); c.restore();
  }
  const inA = (lt, t0, d = 0.4) => eo(p(lt, t0, t0 + d));
  const project = (v) => { const q = v.clone().project(camera); return [(q.x * 0.5 + 0.5) * W, (-q.y * 0.5 + 0.5) * H]; };
  function label(c, s, wp, a, dx = 0, dy = -40) { // rótulo preso a um ponto 3D
    if (a <= 0) return; const [x, y] = project(wp); c.save(); c.globalAlpha = a;
    c.strokeStyle = C.blue; c.lineWidth = 3; c.beginPath(); c.moveTo(x, y); c.lineTo(x + dx, y + dy); c.stroke();
    c.fillStyle = C.blue; c.beginPath(); c.arc(x, y, 7, 0, 7); c.fill(); c.restore();
    chip(c, s, x + dx, y + dy - 34, a, { s: 32 });
  }
  // legendas sincronizadas: blocos de até ~5 palavras, palavra atual em azul
  const CAPS = SC.map((s) => {
    const words = s.text.split(' '); const total = s.text.replace(/\s/g, '').length;
    let accC = 0; const wt = words.map((w) => { const st = accC / total; accC += w.replace(/\s/g, '').length; return [w, st, accC / total]; });
    const blocks = []; let cur = []; wt.forEach((w, i) => { cur.push(w); const end = /[.,:?!…]$/.test(w[0]); if (cur.length >= 5 || (end && cur.length >= 2) || i === wt.length - 1) { blocks.push(cur); cur = []; } });
    return blocks;
  });
  function captions(c, i, lt) {
    const s = SC[i], vt = (lt - s.lead) / s.vdur; if (vt < -0.05 || vt > 1.08) return;
    const blocks = CAPS[i]; let b = blocks.findIndex((bl) => vt < bl[bl.length - 1][2]); if (b < 0) b = blocks.length - 1;
    const bl = blocks[b]; const size = 64; c.save(); c.font = `800 ${size}px ${F}`;
    const lines = []; let ln = []; let lw = 0; const sp = c.measureText(' ').width;
    bl.forEach((w) => { const ww = c.measureText(w[0]).width; if (lw + ww > 900 && ln.length) { lines.push(ln); ln = []; lw = 0; } ln.push([...w, ww]); lw += ww + sp; }); if (ln.length) lines.push(ln);
    const y0 = 1420 - (lines.length - 1) * size * 0.6;
    const pop = back(p(vt, bl[0][1] - 0.02, bl[0][1] + 0.05));
    lines.forEach((l, li) => {
      const tw = l.reduce((a, w) => a + w[3], 0) + sp * (l.length - 1); let x = W / 2 - tw / 2;
      l.forEach((w) => { const on = vt >= w[1] && vt < w[2] + 0.02; txt(c, w[0], x + w[3] / 2, y0 + li * size * 1.15, { s: size * (0.92 + 0.08 * clamp(pop)), w: 800, c: on ? C.blue : C.white, stroke: 12 }); x += w[3] + sp; });
    });
    c.restore();
  }
  const OVER = {
    hook(c, lt) { tag(c, 'GTEeN · MÉRITO CIENTÍFICO', W / 2, 300, inA(lt, 0.4), 'rgba(207,234,255,0.92)'); },
    problema(c, lt) { tag(c, 'O PROBLEMA', W / 2, 300, inA(lt, 0.2)); [['frustração', 5.2], ['atraso', 5.8], ['isolamento', 6.5]].forEach(([s, t0], k) => chip(c, s, W / 2, 470 + k * 100, inA(lt, t0), { s: 40, icon: '!', iconBg: C.red })); },
    equipe(c, lt) { tag(c, 'EQUIPE GTEeN · CURSO G9', W / 2, 300, inA(lt, 0.3)); const q = back(p(lt, 2.6, 3.2)); if (q > 0) { c.save(); c.translate(W / 2, 1240); c.scale(q, q); txt(c, 'VOZ VISÍVEL', 0, 0, { s: 130, w: 800 }); c.restore(); } },
    webcam(c, lt) { tag(c, 'A SOLUÇÃO', W / 2, 300, inA(lt, 0.2)); chip(c, 'webcam comum', W / 2, 430, inA(lt, 0.9), { s: 40, icon: '1', iconBg: C.blue }); chip(c, 'IA MediaPipe (Google)', W / 2, 530, inA(lt, 2.4), { s: 40, icon: '2', iconBg: C.blue }); },
    calibra(c, lt) {
      tag(c, 'PASSO 1 · CALIBRAR', W / 2, 300, inA(lt, 0.2));
      [['rosto', 1.6], ['mão', 2.9], ['postura', 4.4]].forEach(([s, t0], k) => {
        const x = 220 + k * 320, y = 520, a = inA(lt, 0.6 + k * 0.2), pr = eo(p(lt, t0, t0 + 1.1)); if (a <= 0) return;
        c.save(); c.globalAlpha = a; c.fillStyle = 'rgba(8,24,56,0.85)'; c.beginPath(); c.roundRect(x - 135, y - 120, 270, 250, 28); c.fill(); c.strokeStyle = pr >= 1 ? C.ok : 'rgba(56,182,255,0.6)'; c.lineWidth = 4; c.stroke();
        c.strokeStyle = 'rgba(207,234,255,0.2)'; c.lineWidth = 12; c.beginPath(); c.arc(x, y - 20, 62, 0, 7); c.stroke();
        c.strokeStyle = pr >= 1 ? C.ok : C.blue; c.beginPath(); c.arc(x, y - 20, 62, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pr); c.stroke(); c.restore();
        txt(c, Math.round(pr * 100) + '%', x, y - 6, { s: 40, w: 800, a }); txt(c, s.toUpperCase(), x, y + 95, { s: 36, w: 800, c: pr >= 1 ? C.ok : C.ice, a });
      });
    },
    rosto(c, lt) {
      tag(c, 'PASSO 2 · RECONHECER', W / 2, 300, inA(lt, 0.2)); txt(c, 'Face Landmarker · 468 pontos', W / 2, 440, { s: 44, w: 700, c: C.ice, a: inA(lt, 0.6) });
      const g = bigFace.g; const at = (x, y, z) => V(x, y, z).applyMatrix4(g.matrixWorld);
      label(c, 'sobrancelhas', at(-3.2, 4.6, 4.6), inA(lt, 1.3), -170, -120); label(c, 'olhos', at(3.4, 2.6, 4.2), inA(lt, 1.7), 150, -150); label(c, 'boca', at(1.8, -5.6, 5.6), inA(lt, 2.2), 170, 110);
    },
    maos(c, lt) { tag(c, 'MÃOS E CORPO', W / 2, 300, inA(lt, 0.2)); txt(c, 'Hand Landmarker · 21 pontos por mão', W / 2, 440, { s: 42, w: 700, c: C.ice, a: inA(lt, 0.8) * (1 - p(lt, 3.0, 3.4)) }); txt(c, 'Pose Landmarker · cabeça, ombros e braços', W / 2, 440, { s: 42, w: 700, c: C.ice, a: inA(lt, 3.4) }); },
    compara(c, lt) {
      tag(c, 'PASSO 3 · COMPARAR', W / 2, 300, inA(lt, 0.2));
      const r = rng(Math.floor(lt * 8) + 3); const a = inA(lt, 0.6) * (1 - p(lt, 4.6, 5));
      for (let k = 0; k < 6; k++) { const s = `x ${(r() * 0.9 + 0.05).toFixed(3)}  y ${(r() * 0.9 + 0.05).toFixed(3)}  z ${(r() * 0.2 - 0.1).toFixed(3)}`; txt(c, s, W / 2, 440 + k * 52, { s: 34, w: 600, c: k % 2 ? C.ice : C.blue, a: a * (0.5 + 0.5 * ((k + Math.floor(lt * 6)) % 3 === 0)) }); }
      const q = back(p(lt, 4.6, 5.1)); if (q > 0) { c.save(); c.translate(W / 2, 560); c.scale(q, q); chip(c, 'SINAL RECONHECIDO', 0, -40, 1, { s: 48, icon: '✓', bg: 'rgba(5,40,25,0.92)', border: C.ok }); c.restore(); }
    },
    alerta(c, lt) { tag(c, 'PASSO 4 · AVISAR', W / 2, 300, inA(lt, 0.2)); chip(c, 'só o professor vê', W / 2, 430, inA(lt, 1.0), { s: 40, icon: '✓' }); chip(c, 'o aluno não é exposto', W / 2, 530, inA(lt, 1.6), { s: 40, icon: '✓' }); },
    genero(c, lt) {
      tag(c, 'INCLUSÃO SEM PADRÃO', W / 2, 300, inA(lt, 0.2));
      label(c, 'ela: sobrancelhas', wpos(friend, 'HeadTop_End'), inA(lt, 3.6), -40, -120);
      label(c, 'ele: mão levantada', wpos(student, 'RightHandMiddle4'), inA(lt, 2.9), 40, -100);
      const q = back(p(lt, 5.4, 5.9)); if (q > 0) { c.save(); c.translate(W / 2, 1150); c.scale(q, q); chip(c, 'a mesma chance de ser ouvido', 0, -40, 1, { s: 42, icon: '=', iconBg: C.blue }); c.restore(); }
    },
    custo(c, lt) {
      tag(c, 'PRIVACIDADE E CUSTO', W / 2, 300, inA(lt, 0.2));
      chip(c, 'roda no próprio computador', W / 2, 430, inA(lt, 0.7), { s: 38, icon: '✓' }); chip(c, 'não guarda imagens', W / 2, 525, inA(lt, 1.3), { s: 38, icon: '✓' });
      const q = back(p(lt, 3.0, 3.5)); const v = Math.round(50 * eo(p(lt, 3.0, 4.4)));
      if (q > 0) { c.save(); c.translate(W / 2, 1180); c.scale(q, q); txt(c, 'R$ ' + v, 0, 0, { s: 170, w: 800 }); c.restore(); txt(c, 'só a webcam · software gratuito', W / 2, 1250, { s: 40, w: 600, c: C.ice, a: inA(lt, 4.6) }); }
    },
    testes(c, lt) { tag(c, 'O MÉTODO', W / 2, 300, inA(lt, 0.2)); chip(c, 'testes internos feitos', W / 2, 430, inA(lt, 1.0), { s: 40, icon: '✓' }); chip(c, 'próximo: validação com aluno', W / 2, 530, inA(lt, 2.6), { s: 40, icon: '→', iconBg: C.blue }); tag(c, 'ODS 4 · EDUCAÇÃO DE QUALIDADE', W / 2, 650, inA(lt, 3.6), C.white, C.ink, 28); },
    fim(c, lt) {
      const q = back(p(lt, 1.0, 1.6)); if (q > 0) { c.save(); c.translate(W / 2, 470); c.scale(q, q); txt(c, 'VOZ VISÍVEL', 0, 0, { s: 120, w: 800 }); c.restore(); }
      txt(c, 'Tecnologia que dá voz à inclusão.', W / 2, 540, { s: 46, w: 700, c: C.ice, a: inA(lt, 1.8) });
      const a = inA(lt, 2.4); if (a > 0) { c.save(); c.globalAlpha = a; c.fillStyle = 'rgba(201,214,230,0.92)'; c.beginPath(); c.roundRect(W / 2 - 160, 580, 320, 100, 20); c.fill(); c.drawImage(IMG['tbr.png'], W / 2 - 140, 590, 280, 280 * 86 / 300); c.restore(); }
    },
  };
  function chrome(c, t, i) {
    c.fillStyle = 'rgba(207,234,255,0.18)'; c.fillRect(60, 200, W - 120, 6); c.fillStyle = C.blue; c.fillRect(60, 200, (W - 120) * (t / DUR), 6);
    c.save(); c.globalAlpha = 0.9; c.drawImage(IMG['logo.png'], 60, 222, 64, 64); c.restore();
    txt(c, 'VOZ VISÍVEL', 140, 266, { s: 30, w: 800, al: 'left', c: C.white });
  }

  // ---------- quadro ----------
  const hideAll = () => { logoHolo.visible = false; teamCard.visible = false; shield.visible = false; beam.visible = false; pulses.pts.visible = false; [bodyFig, handFig, friendHand].forEach((f) => f.set(Array(f === bodyFig ? POSE_BONES.length : 21).fill(V(0, 0, 0)), 0, 0)); [bigFace, headFace, friendFace].forEach((f) => (f.g.visible = false)); alertGlow.material.opacity = 0; };
  function shot(i, lt, t) {
    hideAll(); baseScene(lt, t);
    const s = SC[i];
    const r = DIRECT[s.id](lt, t);
    [handFig, bodyFig].forEach((f) => { if (s.id !== 'compara') f.mats[1].color.copy(col(C.blue)).multiplyScalar(1.6); });
    return r;
  }
  function renderFrame(t) {
    t = clamp(t, 0, DUR - 1e-3);
    const i = sceneAt(t), s = SC[i], lt = t - s.a;
    // câmera: corte com movimento rápido entre cenas (whip) nos primeiros 0,35 s
    let r = shot(i, lt, t);
    const T = 0.35;
    if (i > 0 && lt < T) {
      const prev = SC[i - 1];
      const pr = DIRECT[prev.id](prev.d, t); // câmera final da cena anterior (sem alterar o que está visível)
      shot(i, lt, t); // refaz o estado da cena atual
      const q = eio(lt / T);
      r = { ...r, cam: pr.cam.clone().lerp(r.cam, q), look: pr.look.clone().lerp(r.look, q), dark: lerp(pr.dark, r.dark, q) };
    }
    camera.position.copy(r.cam); camera.lookAt(r.look);
    camera.updateMatrixWorld(); logoHolo.updateMatrixWorld(); bigFace.g.updateMatrixWorld();
    // luz da sala escurece quando entram os hologramas
    const dark = r.dark || 0;
    amb.intensity = 0.5 * (1 - dark * 0.7); sun.intensity = 1.1 * (1 - dark * 0.75); fill.intensity = 0.7 * (1 - dark * 0.5);
    holoLight.intensity = (r.holo || 0) * 2.2; holoLight.position.set(0, 1.8, 1.4);
    pmat.uniforms.uTime.value = t;
    const tr = i > 0 && lt < T ? Math.sin((lt / T) * Math.PI) : 0;
    fin.uniforms.uCA.value = 0.0015 + tr * 0.02; fin.uniforms.uDark.value = dark;
    composer.render();
    const c = out.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(renderer.domElement, 0, 0, out.width, out.height);
    c.setTransform(out.width / W, 0, 0, out.height / H, 0, 0);
    // degradê para legibilidade em cima e embaixo
    let g = c.createLinearGradient(0, 0, 0, 700); g.addColorStop(0, 'rgba(3,8,20,0.75)'); g.addColorStop(1, 'rgba(3,8,20,0)'); c.fillStyle = g; c.fillRect(0, 0, W, 700);
    g = c.createLinearGradient(0, 1200, 0, H); g.addColorStop(0, 'rgba(3,8,20,0)'); g.addColorStop(1, 'rgba(3,8,20,0.8)'); c.fillStyle = g; c.fillRect(0, 1200, W, H - 1200);
    const a = (i > 0 ? p(lt, 0.2, 0.5) : 1) * (i < SC.length - 1 ? 1 - p(lt, s.d - 0.2, s.d) : 1);
    c.save(); c.globalAlpha = a; OVER[s.id](c, lt); c.restore();
    captions(c, i, lt);
    chrome(c, t, i);
  }
  function setSize(w, h) { OW = w; OH = h; renderer.setSize(w, h, false); composer.setSize(w, h); bloom.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); pmat.uniforms.uScale.value = h / 2; out.width = w; out.height = h; }
  setSize(W, H);
  window.REEL = { DUR, CUES, VOICE_AT: SC.map((s) => ({ id: s.id, t: s.v0 })), SCENES: SC.map((s) => ({ id: s.id, a: s.a, d: s.d })) };
  scene.traverse((o) => { const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; ms.forEach((m) => { if ('envMapIntensity' in m) m.envMapIntensity = 0.3; }); });
  window.__renderAt = (t, scale = 1) => { const w = Math.round(W * scale), h = Math.round(H * scale); if (w !== OW) setSize(w, h); renderFrame(t); return out.toDataURL('image/jpeg', 0.92); };
  window.__ready = true;
})().catch((e) => { console.error(e); window.__error = String((e && e.stack) || e); });
