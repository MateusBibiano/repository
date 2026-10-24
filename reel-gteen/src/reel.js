/* Reel vertical (1080x1920) — Mérito Científico da equipe GTEeN: projeto "Voz Visível".
   Cena 3D em Three.js r128 + camada 2D de tipografia. Cada cena fica numa "estação"
   empilhada na vertical; a câmera desce de uma para a outra. Tudo é função do tempo t. */
(async function () {
  const W = 1080, H = 1920;
  const C = { navy: '#07142e', navy2: '#0b1f45', ink: '#050b18', blue: '#38b6ff', blue2: '#1e7fd6', ice: '#cfeaff', white: '#f3f8ff', ok: '#3ddc84', warn: '#ffb627', red: '#ff4d6d' };
  const F = '"League Spartan", "Arial Black", sans-serif';
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const p = (t, a, b) => clamp((t - a) / (b - a));
  const lerp = (a, b, x) => a + (b - a) * x;
  const eo = (x) => 1 - Math.pow(1 - x, 3);
  const eio = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const back = (x) => { const c1 = 1.7, c3 = c1 + 1; return x <= 0 ? 0 : 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
  function rng(seed) { return function () { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const col = (h) => new THREE.Color(h).convertSRGBToLinear();

  const IMG = {};
  await Promise.all(['logo.png', 'equipe.jpg', 'interface.png', 'tbr.png'].map((f) => new Promise((res, rej) => { const im = new Image(); im.onload = res; im.onerror = () => rej(new Error(f)); im.src = 'assets/' + f; IMG[f] = im; })));
  await document.fonts.load(`800 40px ${F}`); await document.fonts.load(`500 40px ${F}`); await document.fonts.ready;

  // ================= ROTEIRO =================
  const SCENES = [
    { id: 'hook', d: 5 }, { id: 'apresenta', d: 6 }, { id: 'problema', d: 8.5 }, { id: 'solucao', d: 6.5 },
    { id: 'rosto', d: 5.5 }, { id: 'maos', d: 5.5 }, { id: 'postura', d: 5.5 }, { id: 'compara', d: 6.5 },
    { id: 'alerta', d: 7.5 }, { id: 'privacidade', d: 6.5 }, { id: 'custo', d: 6 }, { id: 'ciencia', d: 7.5 },
    { id: 'equipe', d: 6.5 }, { id: 'fim', d: 5 },
  ];
  let acc = 0;
  SCENES.forEach((s, i) => { s.a = acc; acc += s.d; s.b = acc; s.y = -i * 40; });
  const DUR = acc;
  const sceneAt = (t) => { let i = 0; SCENES.forEach((s, k) => { if (t >= s.a) i = k; }); return i; };
  const CUES = [];
  const cue = (id, t, k, d) => { const s = SCENES.find((x) => x.id === id); CUES.push({ t: s.a + t, k, d }); };
  SCENES.forEach((s, i) => { if (i) CUES.push({ t: s.a - 0.1, k: 'whoosh' }); });
  [['hook', 0.2, 'riser'], ['hook', 1.6, 'boom'], ['apresenta', 0.4, 'hit'], ['apresenta', 2.6, 'chime'], ['problema', 3.2, 'tick'], ['problema', 3.8, 'tick'], ['problema', 4.4, 'tick'],
    ['solucao', 0.6, 'hit'], ['rosto', 0.5, 'chime'], ['maos', 1.8, 'ping'], ['postura', 1.8, 'ping'], ['compara', 3.4, 'validate'], ['alerta', 1.2, 'riser'], ['alerta', 2.0, 'ping'],
    ['privacidade', 1.0, 'tick'], ['privacidade', 1.6, 'tick'], ['privacidade', 2.2, 'tick'], ['privacidade', 2.8, 'tick'], ['custo', 0.6, 'countdown', 1.4], ['custo', 2.1, 'boom'],
    ['ciencia', 1.0, 'tick'], ['ciencia', 1.6, 'tick'], ['ciencia', 2.2, 'tick'], ['ciencia', 4.0, 'unlock'], ['equipe', 0.5, 'hit'], ['fim', 0.4, 'finale']].forEach((c) => cue(...c));

  // ---------- Three.js ----------
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  let OW = W, OH = H;
  renderer.setSize(OW, OH, false);
  const scene = new THREE.Scene();
  scene.background = col('#040a1a');
  scene.fog = new THREE.FogExp2(col('#040a1a'), 0.012);
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new THREE.RoomEnvironment(), 0.04).texture;
  scene.add(new THREE.AmbientLight(0xffffff, 0.3));
  const key = new THREE.DirectionalLight(col('#e8f4ff'), 1.4); key.position.set(6, 10, 12); scene.add(key);
  const rimA = new THREE.PointLight(col('#38b6ff'), 3, 60); scene.add(rimA);
  const rimB = new THREE.PointLight(col('#7a5cff'), 1.6, 60); scene.add(rimB);
  const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 400);
  const VIS_H = 2 * 22 * Math.tan((22.5 * Math.PI) / 180); // altura visível a 22 unidades
  const px2y = (py) => ((960 - py) / 1920) * VIS_H; // px da tela -> y relativo à estação

  // fundo: lâminas diagonais (como a capa), partículas e rede de pontos
  const slabs = [];
  function slabGeo(w, h) { const s = new THREE.Shape(); s.moveTo(-w / 2, -h / 2); s.lineTo(w / 2, -h / 2 + w * 0.9); s.lineTo(w / 2, h / 2 + w * 0.9); s.lineTo(-w / 2, h / 2); s.closePath(); return new THREE.ShapeGeometry(s); }
  (() => {
    const r = rng(3);
    for (let i = 0; i < 46; i++) {
      const c = [C.blue, C.blue2, '#123b7a', C.blue, '#0e2a5c'][i % 5];
      const m = new THREE.Mesh(slabGeo(1.5 + r() * 5, 6 + r() * 16), new THREE.MeshBasicMaterial({ color: col(c).multiplyScalar(i % 5 === 0 ? 1.15 : 0.55), transparent: true, opacity: 0.9, depthWrite: false }));
      m.position.set((r() < 0.5 ? -1 : 1) * (5 + r() * 16), 10 - r() * (SCENES.length * 40 + 20), -14 - r() * 26);
      m.rotation.z = -0.62 + (r() - 0.5) * 0.1; m.userData = { ph: r() * 6, base: m.material.color.clone() };
      scene.add(m); slabs.push(m);
    }
  })();
  const PART = 1400, pg = new THREE.BufferGeometry();
  (() => { const r = rng(9), pos = new Float32Array(PART * 3), sp = new Float32Array(PART);
    for (let i = 0; i < PART; i++) { pos[i * 3] = (r() * 2 - 1) * 26; pos[i * 3 + 1] = 15 - r() * (SCENES.length * 40 + 30); pos[i * 3 + 2] = -3 - r() * 36; sp[i] = r(); }
    pg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); pg.setAttribute('sp', new THREE.BufferAttribute(sp, 1)); })();
  const pmat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uTime: { value: 0 }, uScale: { value: OH / 2 } },
    vertexShader: 'uniform float uTime; uniform float uScale; attribute float sp; varying float vA; void main(){ vec3 p = position; p.x += sin(uTime*0.4+sp*20.0)*0.6; p.y += sin(uTime*0.3+sp*9.0)*0.5; vec4 mv = modelViewMatrix*vec4(p,1.0); gl_PointSize = uScale*0.06*(0.5+sp)/-mv.z; vA = 0.25+0.75*sp; gl_Position = projectionMatrix*mv; }',
    fragmentShader: 'varying float vA; void main(){ float d = length(gl_PointCoord-0.5); if(d>0.5) discard; gl_FragColor = vec4(vec3(0.35,0.75,1.0)*(1.0-d*2.0)*vA,1.0); }' });
  scene.add(new THREE.Points(pg, pmat));

  // ---------- figuras de landmarks ----------
  const lineMat = (c, o = 0.9) => new THREE.LineBasicMaterial({ color: col(c), transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false });
  const dotMat = (c, size) => new THREE.PointsMaterial({ color: col(c), size, sizeAttenuation: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  function figure(points, edges, c, dot = 0.16) { // pontos + ligações, atualizáveis
    const g = new THREE.Group();
    const pgeo = new THREE.BufferGeometry(); pgeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points.length * 3), 3));
    const lgeo = new THREE.BufferGeometry(); lgeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(edges.length * 6), 3));
    const pts = new THREE.Points(pgeo, dotMat('#ffffff', dot)); const lines = new THREE.LineSegments(lgeo, lineMat(c));
    g.add(lines, pts);
    g.userData = { set(ps, reveal = 1) {
      const pa = pgeo.attributes.position.array, la = lgeo.attributes.position.array;
      ps.forEach((v, i) => { pa[i * 3] = v[0]; pa[i * 3 + 1] = v[1]; pa[i * 3 + 2] = v[2]; });
      edges.forEach(([a, b], i) => { const q = clamp(reveal * edges.length - i); const A = ps[a], B = ps[b]; la.set([A[0], A[1], A[2], lerp(A[0], B[0], q), lerp(A[1], B[1], q), lerp(A[2], B[2], q)], i * 6); });
      pgeo.attributes.position.needsUpdate = true; lgeo.attributes.position.needsUpdate = true;
      pgeo.setDrawRange(0, Math.round(points.length * clamp(reveal * 1.2)));
    }, mats: [pts.material, lines.material] };
    return g;
  }
  // rosto: contorno, olhos, sobrancelhas, nariz, boca e malha interna
  const FACE = (() => {
    const pts = [], edges = []; const add = (x, y, z) => pts.push([x, y, z]) - 1;
    const loop = (arr, closed) => { for (let i = 0; i < arr.length - (closed ? 0 : 1); i++) edges.push([arr[i], arr[(i + 1) % arr.length]]); };
    const zf = (x, y) => Math.sqrt(Math.max(0, 1 - (x / 2.6) ** 2 - (y / 3.4) ** 2)) * 1.6;
    const outline = []; for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2; const x = Math.cos(a) * 2.4 * (a > Math.PI ? 0.86 + 0.14 * Math.abs(Math.cos(a)) : 1), y = Math.sin(a) * 3.1 + 0.2; outline.push(add(x, y, zf(x, y) * 0.3)); } loop(outline, true);
    [-1, 1].forEach((sx) => {
      const eye = []; for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; const x = sx * 0.95 + Math.cos(a) * 0.48, y = 0.75 + Math.sin(a) * 0.2; eye.push(add(x, y, zf(x, y))); } loop(eye, true);
      const iris = []; for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; const x = sx * 0.95 + Math.cos(a) * 0.13, y = 0.75 + Math.sin(a) * 0.13; iris.push(add(x, y, zf(x, y) + 0.02)); } loop(iris, true);
      const brow = []; for (let i = 0; i < 8; i++) { const u = i / 7; const x = sx * (0.45 + u * 0.95), y = 1.35 + Math.sin(u * Math.PI) * 0.22 - u * 0.1; brow.push(add(x, y, zf(x, y))); } loop(brow, false);
    });
    const nose = []; [[0, 0.9], [0, 0.4], [0, -0.1], [-0.3, -0.45], [0, -0.55], [0.3, -0.45]].forEach(([x, y]) => nose.push(add(x, y, zf(x, y) + (y < 0.5 ? 0.35 : 0.1)))); loop(nose.slice(0, 4), false); edges.push([nose[3], nose[4]], [nose[4], nose[5]], [nose[5], nose[2]]);
    const mouth = []; for (let i = 0; i < 20; i++) { const a = (i / 20) * Math.PI * 2; const x = Math.cos(a) * 0.85, y = -1.35 + Math.sin(a) * (Math.sin(a) > 0 ? 0.18 : 0.3); mouth.push(add(x, y, zf(x, y))); } loop(mouth, true);
    const lip = []; for (let i = 0; i < 9; i++) { const x = -0.6 + i * 0.15, y = -1.35; lip.push(add(x, y, zf(x, y))); } loop(lip, false);
    const r = rng(12), inner = [];
    for (let i = 0; i < 180; i++) { const x = (r() * 2 - 1) * 2.3, y = (r() * 2 - 1) * 3.0; if ((x / 2.3) ** 2 + ((y - 0.2) / 3.0) ** 2 < 0.92) inner.push(add(x, y, zf(x, y))); }
    // triangulação aproximada: liga cada ponto interno ao vizinho mais próximo
    inner.forEach((a, k) => { let best = -1, bd = 1e9; inner.forEach((b, j) => { if (j === k) return; const d = (pts[a][0] - pts[b][0]) ** 2 + (pts[a][1] - pts[b][1]) ** 2; if (d < bd && d > 0.02) { bd = d; best = b; } }); if (best >= 0 && k % 2 === 0) edges.push([a, best]); });
    return { pts, edges };
  })();
  // mão: 21 pontos (topologia do MediaPipe)
  const HAND_EDGES = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [17, 18], [18, 19], [19, 20], [0, 17]];
  function handPose(open) { // 0 = relaxada (dedos dobrados), 1 = levantada e aberta
    const curl = 1 - open, pts = [[0, -2.6, 0]];
    const fingers = [{ b: [-0.9, -1.9], a: 2.3, L: [0.7, 0.6, 0.5] }, { b: [-0.55, -0.3], a: 1.68, L: [0.95, 0.6, 0.45] }, { b: [0, -0.15], a: 1.57, L: [1.05, 0.65, 0.5] }, { b: [0.5, -0.25], a: 1.46, L: [0.95, 0.6, 0.45] }, { b: [0.95, -0.55], a: 1.3, L: [0.75, 0.45, 0.4] }];
    fingers.forEach((f, fi) => {
      let x = f.b[0], y = f.b[1], z = 0, pitch = 0; pts.push([x, y, z]);
      f.L.forEach((L) => { pitch += curl * (fi === 0 ? 0.5 : 1.1); x += Math.cos(f.a) * L * Math.cos(pitch); y += Math.sin(f.a) * L * Math.cos(pitch); z += L * Math.sin(pitch); pts.push([x, y, z]); });
    });
    return pts;
  }
  // corpo: 13 pontos principais (cabeça, ombros, cotovelos, punhos, quadris, joelhos, tornozelos)
  const POSE_EDGES = [[1, 2], [1, 3], [3, 5], [2, 4], [4, 6], [1, 7], [2, 8], [7, 8], [7, 9], [9, 11], [8, 10], [10, 12], [0, 1], [0, 2]];
  function bodyPose(raise, slump = 0) {
    const sh = 2.2 - slump * 0.3;
    const P = [[0, 3.4 - slump * 0.4, 0.2 + slump * 0.4], [-1.1, sh, 0], [1.1, sh, 0], [-1.5, 0.6, 0.2], [lerp(1.5, 1.6, raise), lerp(0.6, 3.6, raise), 0.2], [-1.3, -0.9, 0.6], [lerp(1.3, 1.7, raise), lerp(-0.9, 5.2, raise), lerp(0.6, 0.1, raise)],
      [-0.7, -1.4, 0], [0.7, -1.4, 0], [-0.8, -3.5, 0.3], [0.8, -3.5, 0.3], [-0.8, -5.5, 0], [0.8, -5.5, 0]];
    return P;
  }
  // ---------- objetos por estação ----------
  const ST = {}; // id -> {group, update(lt)}
  const station = (id, build) => { const s = SCENES.find((x) => x.id === id); const g = new THREE.Group(); g.position.y = s.y; scene.add(g); ST[id] = { group: g, ...build(g) }; };
  const metal = (c, m = 0.8, r = 0.25) => new THREE.MeshStandardMaterial({ color: col(c), metalness: m, roughness: r });
  function texPlane(im, w, opts = {}) {
    const t = new THREE.Texture(im); t.needsUpdate = true; t.encoding = THREE.sRGBEncoding; t.anisotropy = 8;
    const h = (w * im.height) / im.width;
    return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: true, toneMapped: false, side: THREE.DoubleSide, ...opts }));
  }
  function logoBadge(size) {
    const g = new THREE.Group();
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(size / 2 + 0.12, size / 2 + 0.12, 0.35, 96), metal('#1e7fd6', 0.9, 0.2)); disc.rotation.x = Math.PI / 2; disc.position.z = -0.2;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(size / 2 + 0.12, 0.08, 16, 96), new THREE.MeshBasicMaterial({ color: col(C.blue).multiplyScalar(1.6) }));
    const face = texPlane(IMG['logo.png'], size); face.position.z = 0.0;
    const backFace = texPlane(IMG['logo.png'], size); backFace.position.z = -0.4; backFace.rotation.y = Math.PI;
    g.add(disc, ring, face, backFace); return g;
  }
  function webcam() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(1.4, 48, 32), metal('#121a2b', 0.6, 0.3)); body.scale.set(1.35, 1, 0.9);
    const lensRing = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.12, 16, 64), metal('#9fb3cc', 0.95, 0.15)); lensRing.position.z = 1.15;
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.72, 48), new THREE.MeshStandardMaterial({ color: col('#081a3a'), metalness: 0.2, roughness: 0.05, emissive: col('#0b3a7a') })); lens.position.z = 1.16;
    const glint = new THREE.Mesh(new THREE.CircleGeometry(0.18, 24), new THREE.MeshBasicMaterial({ color: col('#9fdcff') })); glint.position.set(-0.22, 0.24, 1.17);
    const led = new THREE.Mesh(new THREE.CircleGeometry(0.09, 16), new THREE.MeshBasicMaterial({ color: col('#3ddc84').multiplyScalar(2) })); led.position.set(1.05, 0.25, 1.0);
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.4, 16), metal('#2a3550')); stand.position.y = -1.6;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.1, 0.25, 48), metal('#1a2338')); base.position.y = -2.3;
    g.add(body, lensRing, lens, glint, led, stand, base); g.userData.led = led; return g;
  }
  function monitor(im) {
    const g = new THREE.Group();
    const wv = 7.4, scr = texPlane(im, wv); const hv = scr.geometry.parameters.height;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(wv + 0.5, hv + 0.5, 0.35), metal('#0e1526', 0.7, 0.3)); frame.position.z = -0.2;
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.6, 0.3), metal('#1a2338')); neck.position.set(0, -hv / 2 - 0.8, -0.3);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.2, 1.6), metal('#1a2338')); foot.position.set(0, -hv / 2 - 1.6, 0);
    scr.position.z = 0.0; g.add(frame, scr, neck, foot); g.userData = { w: wv, h: hv }; return g;
  }

  // gancho
  station('hook', (g) => {
    const f = figure(FACE.pts, FACE.edges, C.blue, 0.12); f.position.set(0, px2y(1010), -2); f.scale.setScalar(1.35); g.add(f);
    return { update(lt) { f.userData.set(FACE.pts, eo(p(lt, 0.1, 2.6))); f.rotation.y = Math.sin(lt * 0.6) * 0.35; f.userData.mats.forEach((m) => (m.opacity = 0.55)); } };
  });
  station('apresenta', (g) => {
    const b = logoBadge(4.6); b.position.set(0, px2y(760), 0); g.add(b);
    return { update(lt) { const q = back(p(lt, 0.1, 1.1)); b.scale.setScalar(Math.max(0.01, q)); b.rotation.y = (1 - q) * Math.PI * 3 + Math.sin(lt * 1.2) * 0.25; } };
  });
  station('problema', (g) => {
    const f = figure(bodyPose(0, 1), POSE_EDGES, '#7f93b8', 0.32); f.position.set(-0.4, px2y(900), 0); f.scale.setScalar(0.6); g.add(f);
    const qm = new THREE.Group(); g.add(qm);
    return { update(lt) { f.userData.set(bodyPose(0, 1), eo(p(lt, 0.2, 1.6))); f.rotation.y = 0.35 + Math.sin(lt * 0.5) * 0.1; } };
  });
  station('solucao', (g) => {
    const cam = webcam(); cam.position.set(0, px2y(1010), 0); g.add(cam);
    return { update(lt) { const q = back(p(lt, 0.2, 1.1)); cam.scale.setScalar(Math.max(0.01, q) * 1.25); cam.rotation.set(0.08, Math.sin(lt * 0.8) * 0.45 + (1 - q) * 2, 0); cam.userData.led.material.color.copy(col('#3ddc84')).multiplyScalar(1 + Math.sin(lt * 8) * 0.8 + 1); } };
  });
  station('rosto', (g) => {
    const f = figure(FACE.pts, FACE.edges, C.blue, 0.13); f.position.set(0, px2y(1000), 0); f.scale.setScalar(1.15); g.add(f);
    return { update(lt) { f.userData.set(FACE.pts, eo(p(lt, 0.2, 2.6))); f.rotation.y = Math.sin(lt * 0.9) * 0.55; f.rotation.x = Math.sin(lt * 0.6) * 0.1; } };
  });
  station('maos', (g) => {
    const f = figure(handPose(0), HAND_EDGES, C.blue, 0.3); f.position.set(0, px2y(1040), 0); f.scale.setScalar(1.25); g.add(f);
    return { update(lt) { const o = eio(p(lt, 1.0, 2.0)); f.userData.set(handPose(o), eo(p(lt, 0.1, 1.0))); f.rotation.y = Math.sin(lt * 0.8) * 0.4; f.rotation.z = (1 - o) * 0.5; f.position.y = px2y(1040) + o * 0.6; } };
  });
  station('postura', (g) => {
    const f = figure(bodyPose(0), POSE_EDGES, C.blue, 0.38); f.position.set(0, px2y(1060), 0); f.scale.setScalar(0.72); g.add(f);
    return { update(lt) { const r = eio(p(lt, 1.0, 2.0)); f.userData.set(bodyPose(r), eo(p(lt, 0.1, 1.0))); f.rotation.y = 0.3 + Math.sin(lt * 0.7) * 0.4; } };
  });
  station('compara', (g) => {
    const fa = figure(FACE.pts, FACE.edges, C.blue, 0.1); fa.scale.setScalar(0.45); fa.position.set(-2.3, px2y(900), 0);
    const ha = figure(handPose(1), HAND_EDGES, C.blue, 0.22); ha.scale.setScalar(0.55); ha.position.set(2.4, px2y(880), 0);
    const bo = figure(bodyPose(1), POSE_EDGES, C.blue, 0.26); bo.scale.setScalar(0.32); bo.position.set(0, px2y(1000), 0);
    g.add(fa, ha, bo);
    return { update(lt) { fa.userData.set(FACE.pts, 1); ha.userData.set(handPose(1), 1); bo.userData.set(bodyPose(1), 1);
      const ok = p(lt, 3.3, 3.6); [fa, ha, bo].forEach((f, k) => { f.rotation.y = Math.sin(lt * 0.8 + k) * 0.4; f.userData.mats[1].color.copy(col(C.blue)).lerp(col(C.ok), ok); }); } };
  });
  station('alerta', (g) => {
    const m = monitor(IMG['interface.png']); m.position.set(0, px2y(1000), 0); g.add(m);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: col(C.blue).multiplyScalar(2.2), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.add(glow);
    // card "Pedido / Gesto" da interface: x 720..1240, y 287..393 de 1275x717
    const { w, h } = m.userData; const cx = ((720 + 1240) / 2 / 1275 - 0.5) * w, cy = -(((287 + 393) / 2) / 717 - 0.5) * h;
    glow.position.set(cx, cy, 0.03); glow.scale.set((520 / 1275) * w * 1.04, (106 / 717) * h * 1.15, 1);
    return { update(lt) { const q = back(p(lt, 0.1, 1.0)); m.scale.setScalar(Math.max(0.01, q)); m.rotation.set(-0.08, Math.sin(lt * 0.5) * 0.18 + (1 - q) * 1.2, 0);
      glow.material.opacity = p(lt, 2.0, 2.3) * (0.35 + 0.25 * Math.sin(lt * 7)); } };
  });
  station('privacidade', (g) => {
    const sh = new THREE.Shape(); sh.moveTo(0, 2.2); sh.quadraticCurveTo(1.2, 1.9, 1.9, 1.7); sh.quadraticCurveTo(1.9, -0.6, 0, -2.2); sh.quadraticCurveTo(-1.9, -0.6, -1.9, 1.7); sh.quadraticCurveTo(-1.2, 1.9, 0, 2.2);
    const shield = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.4, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.12, bevelSegments: 4 }), metal('#1e7fd6', 0.9, 0.2));
    const ck = new THREE.Shape(); ck.moveTo(-0.9, 0.1); ck.lineTo(-0.35, -0.5); ck.lineTo(0.95, 0.85); ck.lineTo(0.7, 1.05); ck.lineTo(-0.35, -0.05); ck.lineTo(-0.65, 0.3); ck.closePath();
    const check = new THREE.Mesh(new THREE.ExtrudeGeometry(ck, { depth: 0.2, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 2 }), new THREE.MeshStandardMaterial({ color: col('#f3f8ff'), metalness: 0.3, roughness: 0.3 }));
    check.position.z = 0.55;
    const s = new THREE.Group(); s.add(shield, check); s.position.set(0, px2y(640), 0); g.add(s);
    return { update(lt) { const q = back(p(lt, 0.1, 1.0)); s.scale.setScalar(Math.max(0.01, q) * 0.9); s.rotation.y = (1 - q) * 3 + Math.sin(lt * 1.1) * 0.35; } };
  });
  station('custo', (g) => {
    const cam = webcam(); cam.scale.setScalar(0.8); cam.position.set(0, px2y(1360), 0); g.add(cam);
    return { update(lt) { cam.rotation.y = Math.sin(lt * 0.9) * 0.6; } };
  });
  station('ciencia', (g) => {
    const f = figure(FACE.pts, FACE.edges, '#2a6fd0', 0.08); f.scale.setScalar(1.6); f.position.set(0, px2y(980), -6); g.add(f);
    return { update(lt) { f.userData.set(FACE.pts, 1); f.rotation.y = lt * 0.3; f.userData.mats.forEach((m) => (m.opacity = 0.35)); } };
  });
  station('equipe', (g) => {
    const ph = texPlane(IMG['equipe.jpg'], 9.2, { transparent: false }); ph.position.set(0, px2y(900), 0);
    const fr = new THREE.Mesh(new THREE.PlaneGeometry(9.5, ph.geometry.parameters.height + 0.3), new THREE.MeshBasicMaterial({ color: col(C.blue).multiplyScalar(1.4) })); fr.position.set(0, px2y(900), -0.35);
    const grp = new THREE.Group(); grp.add(fr, ph); g.add(grp);
    return { update(lt) { const q = eo(p(lt, 0.1, 1.0)); grp.rotation.set((1 - q) * 0.9, Math.sin(lt * 0.5) * 0.12, 0); grp.position.z = -(1 - q) * 12; } };
  });
  station('fim', (g) => {
    const b = logoBadge(3.8); b.position.set(0, px2y(640), 0); g.add(b);
    const tbr = texPlane(IMG['tbr.png'], 4.2); tbr.position.set(0, px2y(1420), 0.05); g.add(tbr);
    const card = new THREE.Mesh(new THREE.PlaneGeometry(5, 1.75), new THREE.MeshBasicMaterial({ color: col('#c9d6e6').multiplyScalar(0.42), transparent: true, toneMapped: false })); card.position.set(0, px2y(1420), 0); g.add(card);
    return { update(lt) { const q = back(p(lt, 0.1, 1.0)); b.scale.setScalar(Math.max(0.01, q)); b.rotation.y = (1 - q) * Math.PI * 2 + Math.sin(lt) * 0.3; tbr.material.opacity = card.material.opacity = eo(p(lt, 1.6, 2.2)); } };
  });

  // pós-processamento
  const composer = new THREE.EffectComposer(renderer);
  composer.setPixelRatio(1); composer.setSize(OW, OH);
  const bloom = new THREE.UnrealBloomPass(new THREE.Vector2(OW, OH), 1.0, 0.6, 0.5);
  const fin = new THREE.ShaderPass({
    uniforms: { tDiffuse: { value: null }, uCA: { value: 0.002 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uCA; varying vec2 vUv;
      vec3 toSRGB(vec3 c){ c = max(c,0.0); return mix(c*12.92, 1.055*pow(c, vec3(0.41666))-0.055, step(vec3(0.0031308), c)); }
      void main(){ vec2 d = vUv-0.5; float r2 = dot(d,d); vec2 off = vec2(0.0, d.y)*uCA*(0.5+r2*3.0);
        vec3 c = vec3(texture2D(tDiffuse, vUv+off).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv-off).b);
        c *= 1.0 - 0.45*smoothstep(0.12, 0.6, r2*1.6); gl_FragColor = vec4(toSRGB(c),1.0); }`,
  });
  composer.addPass(new THREE.RenderPass(scene, camera)); composer.addPass(bloom); composer.addPass(fin);

  // ---------- tipografia 2D ----------
  const out = document.createElement('canvas');
  function txt(c, s, x, y, o = {}) {
    c.save(); c.globalAlpha *= o.a ?? 1;
    c.font = `${o.w || 800} ${o.s || 60}px ${F}`; c.fillStyle = o.c || C.white; c.textAlign = o.al || 'center'; c.textBaseline = 'alphabetic';
    c.letterSpacing = (o.ls || 0) + 'px';
    if (o.shadow !== false) { c.shadowColor = 'rgba(0,0,0,0.55)'; c.shadowBlur = 18; c.shadowOffsetY = 4; }
    c.fillText(s, x, y); c.restore();
  }
  function wrap(c, text, font, maxW) { c.save(); c.font = font; const out = []; let ln = ''; text.split(' ').forEach((w) => { const t = ln ? ln + ' ' + w : w; if (c.measureText(t).width > maxW && ln) { out.push(ln); ln = w; } else ln = t; }); if (ln) out.push(ln); c.restore(); return out; }
  // frase com palavras aparecendo uma a uma (pop)
  function words(c, text, x, y, size, t0, lt, o = {}) {
    const font = `${o.w || 800} ${size}px ${F}`;
    const lines = wrap(c, text, font, o.maxW || 940);
    let k = 0;
    lines.forEach((ln, li) => {
      c.save(); c.font = font; const ws = ln.split(' '); const sp = c.measureText(' ').width + size * 0.03;
      const isHl = (w) => o.hl && o.hl.includes(w.replace(/[.,!?:]/g, ''));
      const widths = ws.map((w) => c.measureText(w).width + (isHl(w) ? size * 0.36 : 0)); const total = widths.reduce((a, b) => a + b, 0) + sp * (ws.length - 1);
      let xx = (o.al === 'left' ? x : x - total / 2); c.restore();
      ws.forEach((w, wi) => {
        const q = back(p(lt, t0 + k * (o.step || 0.07), t0 + k * (o.step || 0.07) + 0.4));
        const hl = isHl(w);
        c.save(); c.translate(xx + widths[wi] / 2, y + li * size * 1.08); c.scale(Math.max(0.01, q), Math.max(0.01, q));
        if (hl && q > 0) { c.fillStyle = C.blue; c.globalAlpha = clamp(q); c.beginPath(); const pw = widths[wi], ph = size * 0.92; c.moveTo(-pw / 2 + 10, -size * 0.8); c.lineTo(pw / 2 + 4, -size * 0.8); c.lineTo(pw / 2 - 10, -size * 0.8 + ph); c.lineTo(-pw / 2 - 4, -size * 0.8 + ph); c.closePath(); c.fill(); }
        txt(c, w, 0, 0, { s: size, w: o.w || 800, c: hl ? C.ink : o.c || C.white, a: clamp(q * 1.5), shadow: !hl });
        c.restore();
        xx += widths[wi] + sp; k++;
      });
    });
    return lines.length;
  }
  function tag(c, s, x, y, a, bg = C.blue, fg = C.ink, size = 34) {
    if (a <= 0) return;
    c.save(); c.globalAlpha = a; c.font = `800 ${size}px ${F}`; c.letterSpacing = '4px';
    const w = c.measureText(s).width + 56, h = size * 1.55;
    const X = x - w / 2;
    c.beginPath(); c.moveTo(X + 14, y); c.lineTo(X + w, y); c.lineTo(X + w - 14, y + h); c.lineTo(X, y + h); c.closePath(); c.fillStyle = bg; c.fill();
    c.fillStyle = fg; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(s, x + 2, y + h / 2 + 3); c.restore();
  }
  function chip(c, s, x, y, a, opts = {}) {
    if (a <= 0) return;
    c.save(); c.globalAlpha = a; c.font = `700 ${opts.s || 40}px ${F}`;
    const w = c.measureText(s).width + (opts.icon ? 110 : 64), h = (opts.s || 40) * 1.8;
    const X = opts.al === 'left' ? x : x - w / 2;
    c.fillStyle = opts.bg || 'rgba(11,31,69,0.88)'; c.beginPath(); c.roundRect(X, y, w, h, h / 2); c.fill();
    c.strokeStyle = opts.border || 'rgba(56,182,255,0.55)'; c.lineWidth = 3; c.stroke();
    if (opts.icon) { c.fillStyle = opts.iconBg || C.ok; c.beginPath(); c.arc(X + h / 2 + 4, y + h / 2, h * 0.32, 0, 7); c.fill(); c.fillStyle = C.ink; c.font = `800 ${(opts.s || 40) * 0.9}px ${F}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(opts.icon, X + h / 2 + 4, y + h / 2 + 3); }
    c.fillStyle = opts.c || C.white; c.font = `700 ${opts.s || 40}px ${F}`; c.textAlign = 'left'; c.textBaseline = 'middle';
    c.fillText(s, X + (opts.icon ? h + 18 : 32), y + h / 2 + 3); c.restore();
    return w;
  }
  const inA = (lt, t0, d = 0.4) => eo(p(lt, t0, t0 + d));

  const OVER = {
    hook(c, lt) {
      words(c, 'E se um aluno pudesse', W / 2, 640, 74, 0.2, lt, { w: 700 });
      words(c, 'PEDIR AJUDA', W / 2, 800, 128, 1.1, lt, { hl: ['PEDIR', 'AJUDA'], step: 0.15 });
      words(c, 'sem dizer uma palavra?', W / 2, 1430, 74, 2.0, lt, { w: 700 });
    },
    apresenta(c, lt) {
      tag(c, 'EQUIPE GTEeN APRESENTA', W / 2, 330, inA(lt, 0.6));
      words(c, 'VOZ VISÍVEL', W / 2, 1290, 150, 1.2, lt, { step: 0.18 });
      const q = inA(lt, 2.2);
      wrap(c, 'Sistema inteligente de comunicação para ambientes escolares inclusivos', `600 46px ${F}`, 880).forEach((l, i) => txt(c, l, W / 2, 1390 + i * 56, { s: 46, w: 600, c: C.ice, a: q }));
      tag(c, 'MÉRITO CIENTÍFICO · TBR 2026', W / 2, 1530, inA(lt, 2.8), C.white, C.ink, 32);
    },
    problema(c, lt) {
      tag(c, 'O PROBLEMA', W / 2, 300, inA(lt, 0.2));
      words(c, 'Muitos alunos com deficiência não conseguem avisar o professor que precisam de ajuda', W / 2, 440, 62, 0.4, lt, { hl: ['ajuda'], step: 0.05, maxW: 920 });
      [['frustração', 3.2], ['atraso na aprendizagem', 3.8], ['isolamento', 4.4]].forEach(([s, t0], k) => chip(c, s, W / 2, 1150 + k * 104, inA(lt, t0), { s: 38, icon: '!', iconBg: C.red }));
      words(c, '...e o professor nem sempre percebe.', W / 2, 1530, 54, 5.4, lt, { w: 700 });
    },
    solucao(c, lt) {
      tag(c, 'A SOLUÇÃO', W / 2, 300, inA(lt, 0.2));
      words(c, 'Uma webcam comum + MediaPipe, do Google', W / 2, 440, 66, 0.5, lt, { hl: ['webcam', 'MediaPipe'], step: 0.07 });
      words(c, 'reconhece sinais combinados com cada aluno', W / 2, 1330, 58, 2.4, lt, { w: 700, step: 0.06 });
      chip(c, 'sem telas extras', W / 2 - 200, 1480, inA(lt, 4.0), { s: 36, icon: '✓' });
      chip(c, 'nada para vestir', W / 2 + 200, 1480, inA(lt, 4.4), { s: 36, icon: '✓' });
    },
    rosto(c, lt) { stepHead(c, lt, '1', 'ROSTO', 'Face Landmarker: centenas de pontos seguem olhos, sobrancelhas e boca'); },
    maos(c, lt) { stepHead(c, lt, '2', 'MÃOS', 'Hand Landmarker: 21 pontos por mão reconhecem o gesto combinado'); },
    postura(c, lt) { stepHead(c, lt, '3', 'POSTURA', 'Pose Landmarker: cabeça, ombros, braços e tronco'); },
    compara(c, lt) {
      tag(c, 'COMO DECIDE', W / 2, 300, inA(lt, 0.2));
      words(c, 'Os pontos viram coordenadas (x, y, z)', W / 2, 440, 62, 0.4, lt, { hl: ['coordenadas'], step: 0.06 });
      words(c, 'e são comparados com o perfil calibrado do aluno', W / 2, 1310, 56, 1.6, lt, { w: 700, step: 0.05, hl: ['calibrado'] });
      const q = back(p(lt, 3.3, 3.8));
      if (q > 0) { c.save(); c.translate(W / 2, 1530); c.scale(q, q); chip(c, 'PEDIDO RECONHECIDO', 0, -40, 1, { s: 46, icon: '✓', bg: 'rgba(5,40,25,0.92)', border: C.ok }); c.restore(); }
    },
    alerta(c, lt) {
      tag(c, 'O ALERTA', W / 2, 300, inA(lt, 0.2));
      words(c, 'Um aviso discreto aparece só no computador do professor', W / 2, 440, 60, 0.4, lt, { hl: ['discreto'], step: 0.05 });
      txt(c, 'interface do protótipo · Equipe GTEeN', W / 2, 1300, { s: 30, w: 500, c: '#8fb4e0', a: inA(lt, 1.2) });
      words(c, 'Sem expor o aluno para a turma.', W / 2, 1450, 56, 3.4, lt, { w: 700, hl: ['expor'] });
    },
    privacidade(c, lt) {
      tag(c, 'PRIVACIDADE', W / 2, 300, inA(lt, 0.2));
      [['Só sinais autorizados e calibrados', 1.0], ['Processamento no próprio computador', 1.6], ['Trabalha com pontos, não guarda imagens', 2.2], ['Não substitui o professor: aproxima', 2.8]]
        .forEach(([s, t0], k) => chip(c, s, 90, 980 + k * 118, inA(lt, t0), { s: 38, icon: '✓', al: 'left' }));
    },
    custo(c, lt) {
      tag(c, 'QUANTO CUSTA', W / 2, 300, inA(lt, 0.2));
      const v = Math.round(50 * eo(p(lt, 0.6, 2.0)));
      const q = back(p(lt, 0.5, 1.0));
      c.save(); c.translate(W / 2, 700); c.scale(q, q); txt(c, 'R$ ' + v, 0, 0, { s: 230, w: 800, c: C.white }); c.restore();
      txt(c, 'valor aproximado do protótipo', W / 2, 790, { s: 44, w: 600, c: C.ice, a: inA(lt, 2.0) });
      [['Webcam simples: R$ 50', 2.6], ['Computador: o da escola', 3.1], ['Software: gratuito e aberto', 3.6]].forEach(([s, t0], k) => chip(c, s, W / 2, 900 + k * 112, inA(lt, t0), { s: 40 }));
    },
    ciencia(c, lt) {
      tag(c, 'O MÉTODO', W / 2, 300, inA(lt, 0.2));
      words(c, 'Pesquisa aplicada, quali-quantitativa', W / 2, 440, 62, 0.4, lt, { hl: ['aplicada'], step: 0.07 });
      txt(c, 'O que é medido:', W / 2, 640, { s: 42, w: 600, c: C.ice, a: inA(lt, 0.9) });
      [['taxa de acerto', 1.0], ['tempo de resposta', 1.6], ['falsos positivos e negativos', 2.2]].forEach(([s, t0], k) => chip(c, s, W / 2, 680 + k * 108, inA(lt, t0), { s: 40 }));
      chip(c, 'Testes internos realizados', W / 2, 1110, inA(lt, 3.4), { s: 40, icon: '✓' });
      chip(c, 'Próximo: validação com aluno na escola', W / 2, 1222, inA(lt, 4.0), { s: 38, icon: '→', iconBg: C.blue });
      tag(c, 'ODS 4 · EDUCAÇÃO DE QUALIDADE', W / 2, 1400, inA(lt, 5.0), C.white, C.ink, 30);
    },
    equipe(c, lt) {
      tag(c, 'QUEM FAZ', W / 2, 300, inA(lt, 0.2));
      words(c, 'Equipe GTEeN', W / 2, 1330, 100, 0.9, lt, { step: 0.15 });
      txt(c, 'Curso G9 · Itajubá | MG', W / 2, 1410, { s: 46, w: 600, c: C.ice, a: inA(lt, 1.6) });
      txt(c, 'Técnico: Prof. Me. Mateus Bibiano Francisco', W / 2, 1500, { s: 34, w: 500, c: '#a9c8ec', a: inA(lt, 2.2) });
      txt(c, 'Mentor: Rafael Neves de Moraes Castro', W / 2, 1548, { s: 34, w: 500, c: '#a9c8ec', a: inA(lt, 2.4) });
    },
    fim(c, lt) {
      words(c, 'VOZ VISÍVEL', W / 2, 1060, 140, 0.6, lt, { step: 0.18 });
      words(c, 'Tecnologia que dá voz à inclusão.', W / 2, 1160, 56, 1.2, lt, { w: 700, hl: ['voz'] });
      txt(c, 'Torneio Brasil de Robótica · Temporada 2026', W / 2, 1560, { s: 34, w: 600, c: '#a9c8ec', a: inA(lt, 2.2) });
    },
  };
  function stepHead(c, lt, n, title, sub) {
    tag(c, 'COMO FUNCIONA', W / 2, 300, inA(lt, 0.1));
    const q = back(p(lt, 0.2, 0.7));
    c.save(); c.font = `800 200px ${F}`; const nw = c.measureText(n).width; c.font = `800 104px ${F}`; const tw = c.measureText(title).width; c.restore();
    const x0 = W / 2 - (nw + 36 + tw) / 2;
    c.save(); c.translate(x0 + nw / 2, 520); c.scale(q, q); txt(c, n, 0, 0, { s: 200, w: 800, c: C.blue }); c.restore();
    words(c, title, x0 + nw + 36, 500, 104, 0.4, lt, { al: 'left' });
    words(c, sub, W / 2, 1400, 54, 1.0, lt, { w: 700, step: 0.05, hl: ['21', 'centenas'] });
  }
  function frame(c, t) {
    // barra de progresso no topo, discreta
    c.fillStyle = 'rgba(207,234,255,0.18)'; c.fillRect(60, 200, W - 120, 6);
    c.fillStyle = C.blue; c.fillRect(60, 200, (W - 120) * (t / DUR), 6);
    txt(c, 'GTEeN · VOZ VISÍVEL', W / 2, 180, { s: 26, w: 700, c: '#8fb4e0', ls: 4, shadow: false });
  }

  function renderFrame(t) {
    t = clamp(t, 0, DUR - 1e-3);
    const i = sceneAt(t), s = SCENES[i], lt = t - s.a;
    // estações próximas visíveis
    SCENES.forEach((x, k) => { if (ST[x.id]) { ST[x.id].group.visible = Math.abs(k - i) <= 1; if (Math.abs(k - i) <= 1) ST[x.id].update(t - x.a); } });
    // câmera desce entre as estações
    const T = 0.8, q = i > 0 ? eio(clamp(lt / T)) : 1;
    const y0 = i > 0 ? SCENES[i - 1].y : s.y, y = lerp(y0, s.y, q);
    const sway = Math.sin(t * 0.35) * 0.7;
    camera.position.set(sway, y + 0.6, 22 + Math.sin(q * Math.PI) * 4);
    camera.lookAt(sway * 0.3, y, 0);
    rimA.position.set(-8, y + 6, 8); rimB.position.set(8, y - 6, 6);
    pmat.uniforms.uTime.value = t;
    slabs.forEach((m) => m.material.color.copy(m.userData.base).multiplyScalar(0.8 + 0.3 * Math.sin(t * 1.1 + m.userData.ph)));
    const tr = i > 0 && lt < T ? Math.sin(q * Math.PI) : 0;
    fin.uniforms.uCA.value = 0.002 + tr * 0.03; bloom.strength = 1.0 + tr * 0.5;
    composer.render();
    const c = out.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(renderer.domElement, 0, 0, out.width, out.height);
    c.setTransform(out.width / W, 0, 0, out.height / H, 0, 0);
    // texto entra depois que a câmera chega, e sai no fim da cena
    const a = (i > 0 ? p(lt, 0.25, 0.6) : 1) * (i < SCENES.length - 1 ? 1 - p(lt, s.d - 0.25, s.d) : 1);
    c.save(); c.globalAlpha = a; OVER[s.id](c, lt); c.restore();
    frame(c, t);
  }
  function setSize(w, h) { OW = w; OH = h; renderer.setSize(w, h, false); composer.setSize(w, h); bloom.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); pmat.uniforms.uScale.value = h / 2; out.width = w; out.height = h; }
  setSize(W, H);
  window.REEL = { DUR, CUES, renderFrame };
  window.__renderAt = (t, scale = 1) => { const w = Math.round(W * scale), h = Math.round(H * scale); if (w !== OW) setSize(w, h); renderFrame(t); return out.toDataURL('image/jpeg', 0.92); };
  window.__ready = true;
})().catch((e) => { console.error(e); window.__error = String((e && e.stack) || e); });
