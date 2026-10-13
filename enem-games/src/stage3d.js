/* ENEM GAMES 2026 — palco 3D (Three.js r128).
   As cenas 2D de scenes.js viram texturas em telões dentro de uma arena 3D;
   transições, vinhetas de capítulo, logo, medalha, pizza, picolés e confete são 3D.
   Tudo é função do tempo t, então o resultado é determinístico (player e exportação). */
(function () {
  const G = window.EnemGames;
  const U = 80; // pixels da cena por unidade 3D (telão de 16 x 9)
  const px2x = (px) => (px - 640) / U, px2y = (py) => -(py - 360) / U;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const p = (t, a, b) => clamp((t - a) / (b - a));
  const lerp = (a, b, x) => a + (b - a) * x;
  const eo = (x) => 1 - Math.pow(1 - x, 3);
  const eio = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const back = (x) => { const c1 = 1.9, c3 = c1 + 1; return x <= 0 ? 0 : 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
  function rng(seed) { return function () { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const col = (h) => new THREE.Color(h).convertSRGBToLinear();

  function loadFont() {
    const b64 = window.__BUNGEE_TTF_B64;
    const bin = atob(b64); const buf = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    const json = new THREE.TTFLoader().parse(buf.buffer);
    return new THREE.Font(json);
  }

  function create(opts) {
    let OW = opts.width, OH = opts.height;
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(1);
    renderer.setSize(OW, OH, false);
    const font = loadFont();

    // ---------- materiais e utilidades 3D ----------
    const MAT = {
      creamFront: new THREE.MeshStandardMaterial({ color: col('#f7f1e3'), metalness: 0.25, roughness: 0.3 }),
      creamSide: new THREE.MeshStandardMaterial({ color: col('#7d86b8'), metalness: 0.5, roughness: 0.35 }),
      goldFront: new THREE.MeshStandardMaterial({ color: col('#ffbf3c'), metalness: 0.9, roughness: 0.22, emissive: col('#3a2200') }),
      goldSide: new THREE.MeshStandardMaterial({ color: col('#b06a00'), metalness: 0.9, roughness: 0.3 }),
    };
    function textGeo(str, size, depth) {
      const g = new THREE.TextGeometry(str, { font, size, height: depth, curveSegments: 5, bevelEnabled: true, bevelThickness: depth * 0.22, bevelSize: size * 0.025, bevelSegments: 3 });
      g.computeBoundingBox();
      return g;
    }
    function textMesh(str, size, depth, mats, center = true) {
      const g = textGeo(str, size, depth);
      if (center) { const b = g.boundingBox; g.translate(-(b.max.x + b.min.x) / 2, -(b.max.y + b.min.y) / 2, -depth / 2); }
      return new THREE.Mesh(g, mats);
    }
    function advance(ch, size) { const gl = font.data.glyphs[ch] || font.data.glyphs['?']; return (gl.ha * size) / font.data.resolution; }

    // ---------- cenas ----------
    const BG = col('#050920');
    const envScene = new THREE.Scene();
    envScene.background = BG;
    const contentScene = new THREE.Scene();
    const propScene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new THREE.RoomEnvironment(), 0.04).texture;
    envScene.environment = envTex; propScene.environment = envTex;
    function lights(sc) {
      sc.add(new THREE.AmbientLight(0xffffff, 0.25));
      const key = new THREE.DirectionalLight(col('#fff1d6'), 1.6); key.position.set(4, 7, 9); sc.add(key);
      const rimA = new THREE.PointLight(col('#ffb627'), 2.2, 40); rimA.position.set(-9, 4, 4); sc.add(rimA);
      const rimB = new THREE.PointLight(col('#4ea8ff'), 2.0, 40); rimB.position.set(9, -3, 5); sc.add(rimB);
    }
    lights(envScene); lights(propScene);

    const camera = new THREE.PerspectiveCamera(40, OW / OH, 0.1, 300);

    // ---------- arena ----------
    const floorMat = new THREE.ShaderMaterial({
      extensions: { derivatives: true },
      uniforms: { uTime: { value: 0 }, uA: { value: col('#3b4fd8') }, uB: { value: col('#ff8c42') } },
      vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }',
      fragmentShader: `uniform float uTime; uniform vec3 uA; uniform vec3 uB; varying vec3 vW;
        void main(){
          vec2 c = vW.xz/2.0; vec2 g = abs(fract(c-0.5)-0.5)/fwidth(c); float l = 1.0-min(min(g.x,g.y),1.0);
          float d = length(vW.xz-vec2(0.0,-6.0)); float fade = exp(-d*0.045);
          float sweep = smoothstep(0.0,1.0,1.0-abs(fract(vW.z*0.04 + uTime*0.12)-0.5)*6.0);
          vec3 cA = mix(uB, uA, smoothstep(-30.0, 8.0, vW.z));
          vec3 col = cA*l*fade*(1.1+sweep*1.6) + vec3(0.02,0.03,0.09)*fade;
          gl_FragColor = vec4(col,1.0);
        }`,
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), floorMat);
    floor.rotation.x = -Math.PI / 2; floor.position.y = -5.8; envScene.add(floor);

    const ARCH_COLS = ['#ff8c42', '#c77dff', '#2ec4b6', '#4ea8ff', '#ffb627'];
    const arches = ARCH_COLS.map((c, k) => {
      const m = new THREE.Mesh(new THREE.TorusGeometry(15 + k * 2.2, 0.09, 8, 160, Math.PI), new THREE.MeshBasicMaterial({ color: col(c) }));
      m.position.set(0, -5.8, -16 - k * 8); envScene.add(m); m.userData.base = col(c); return m;
    });

    function glowTexture(inner, outer) {
      const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
      const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, inner); g.addColorStop(0.25, outer); g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g; x.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); return t;
    }
    const glowT = glowTexture('rgba(255,250,230,1)', 'rgba(255,190,80,0.35)');
    const stadium = [[-26, 14, -30], [26, 14, -30], [-12, 16, -42], [12, 16, -42]].map(([x, y, z]) => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowT, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
      s.position.set(x, y, z); s.scale.set(9, 9, 1); envScene.add(s); return s;
    });

    const beamMat = (c) => new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: { uC: { value: col(c) }, uI: { value: 0.16 } },
      vertexShader: 'varying float vY; void main(){ vY = uv.y; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 uC; uniform float uI; varying float vY; void main(){ gl_FragColor = vec4(uC*uI*pow(vY,1.6),1.0); }',
    });
    const beams = [[-20, '#ffb627'], [-8, '#4ea8ff'], [8, '#c77dff'], [20, '#ffb627']].map(([x, c], i) => {
      const geo = new THREE.ConeGeometry(4.5, 34, 40, 1, true); geo.translate(0, -17, 0);
      const m = new THREE.Mesh(geo, beamMat(c)); m.position.set(x, 18, -22); m.userData.ph = i * 1.7; envScene.add(m); return m;
    });

    const SHAPE_COLS = ['#ff8c42', '#c77dff', '#2ec4b6', '#4ea8ff', '#ffb627', '#ff5d8f'];
    const shapes = [];
    (() => {
      const r = rng(5);
      const geos = [new THREE.IcosahedronGeometry(0.9, 0), new THREE.OctahedronGeometry(0.9, 0), new THREE.TorusGeometry(0.75, 0.22, 16, 48), new THREE.SphereGeometry(0.8, 32, 16), new THREE.BoxGeometry(1.1, 1.1, 1.1), new THREE.TetrahedronGeometry(1, 0)];
      for (let i = 0; i < 30; i++) {
        const front = i < 8;
        const x = front ? (r() < 0.5 ? -1 : 1) * (11 + r() * 7) : (r() * 2 - 1) * 28;
        const m = new THREE.Mesh(geos[i % geos.length], new THREE.MeshStandardMaterial({ color: col(SHAPE_COLS[i % SHAPE_COLS.length]), metalness: 0.65, roughness: 0.22 }));
        m.userData = { x, y: -3 + r() * 11, z: front ? -2 - r() * 4 : -9 - r() * 24, s: 0.5 + r() * 1.1, rx: r() * 0.8 - 0.4, ry: r() * 0.8 - 0.4, ph: r() * 6 };
        envScene.add(m); shapes.push(m);
      }
    })();

    const PART = 900;
    const partGeo = new THREE.BufferGeometry();
    (() => {
      const r = rng(9), pos = new Float32Array(PART * 3), sp = new Float32Array(PART);
      for (let i = 0; i < PART; i++) { pos[i * 3] = (r() * 2 - 1) * 34; pos[i * 3 + 1] = r() * 22 - 6; pos[i * 3 + 2] = -1.5 - r() * 36; sp[i] = 0.2 + r() * 0.6; }
      partGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); partGeo.setAttribute('sp', new THREE.BufferAttribute(sp, 1));
    })();
    const partMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uScale: { value: OH / 2 } },
      vertexShader: `uniform float uTime; uniform float uScale; attribute float sp; varying float vA;
        void main(){ vec3 p = position; p.y = mod(p.y + 6.0 + uTime*sp, 22.0) - 6.0; p.x += sin(uTime*0.3+position.z)*0.4;
          vec4 mv = modelViewMatrix*vec4(p,1.0); gl_PointSize = uScale*0.09*(0.6+sp)/-mv.z; vA = 0.35+0.65*fract(sp*7.0); gl_Position = projectionMatrix*mv; }`,
      fragmentShader: 'varying float vA; void main(){ float d = length(gl_PointCoord-0.5); if(d>0.5) discard; gl_FragColor = vec4(vec3(1.0,0.78,0.42)*(1.0-d*2.0)*vA, 1.0); }',
    });
    envScene.add(new THREE.Points(partGeo, partMat));

    // ---------- telões (2 slots para as transições) ----------
    let CS = 2; // escala da textura de conteúdo
    function makeSlot() {
      const canvas = document.createElement('canvas');
      canvas.width = 1280 * CS; canvas.height = 720 * CS;
      const ctx = canvas.getContext('2d');
      const tex = new THREE.CanvasTexture(canvas);
      tex.encoding = THREE.sRGBEncoding; tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(16, 9), mat);
      const outer = new THREE.Group(), inner = new THREE.Group();
      outer.add(inner); inner.add(plane); contentScene.add(outer);
      const outerP = new THREE.Group(), innerP = new THREE.Group();
      outerP.add(innerP); propScene.add(outerP);
      return { canvas, ctx, tex, mat, plane, outer, inner, outerP, innerP };
    }
    const slots = [makeSlot(), makeSlot()];
    function resizeSlots() {
      slots.forEach((s) => { s.canvas.width = 1280 * CS; s.canvas.height = 720 * CS; s.tex.dispose(); });
    }
    const NO_BACKING = { intro: true };
    function drawContent(slot, idx, lt) {
      const seg = G.SEGS[idx];
      const x = slot.ctx;
      x.setTransform(1, 0, 0, 1, 0, 0);
      x.clearRect(0, 0, slot.canvas.width, slot.canvas.height);
      x.setTransform(CS, 0, 0, CS, 0, 0);
      if (!NO_BACKING[seg.id]) {
        x.beginPath(); x.roundRect(6, 6, 1268, 708, 34);
        const g = x.createLinearGradient(0, 0, 0, 720); g.addColorStop(0, 'rgba(18,28,74,0.86)'); g.addColorStop(1, 'rgba(9,14,40,0.86)');
        x.fillStyle = g; x.fill();
        x.lineWidth = 3; x.strokeStyle = 'rgba(255,182,39,0.45)'; x.stroke();
        x.beginPath(); x.roundRect(14, 14, 1252, 692, 28); x.lineWidth = 1.5; x.strokeStyle = 'rgba(154,166,214,0.18)'; x.stroke();
      }
      G.drawSeg(x, idx, lt);
      slot.tex.needsUpdate = true;
    }

    // ---------- objetos 3D por segmento ----------
    const props = {};
    function buildLogo() {
      const grp = new THREE.Group();
      const letters = [];
      [['ENEM', 1.7, 0.95, [MAT.creamFront, MAT.creamSide], 0.1, 0.1], ['GAMES', 1.4, -0.85, [MAT.goldFront, MAT.goldSide], 0.75, 0.08]].forEach(([w, size, y, mats, t0, st]) => {
        const total = [...w].reduce((a, ch) => a + advance(ch, size), 0);
        let xx = -total / 2;
        [...w].forEach((ch, i) => {
          const g = textGeo(ch, size, size * 0.38);
          g.translate(0, -size * 0.36, -size * 0.19);
          const m = new THREE.Mesh(g, mats);
          const holder = new THREE.Group(); holder.add(m);
          holder.userData = { x: xx, y, t0: t0 + i * st }; xx += advance(ch, size);
          grp.add(holder); letters.push(holder);
        });
      });
      return {
        group: grp, update(lt) {
          letters.forEach((h) => {
            const q = back(p(lt, h.userData.t0, h.userData.t0 + 0.7));
            h.position.set(h.userData.x, h.userData.y + (1 - q) * 7, (1 - q) * 3);
            h.rotation.set((1 - q) * -1.6, (1 - q) * 0.8, 0);
            h.visible = lt >= h.userData.t0;
          });
          grp.rotation.y = Math.sin(lt * 0.7) * 0.16;
          grp.rotation.x = Math.sin(lt * 0.5) * 0.05 - 0.04;
          grp.position.set(0, 0.25, 0.6);
        },
      };
    }
    function buildBumper(seg) {
      const grp = new THREE.Group();
      const c = G.GROUP_COLORS[seg.g];
      const accentF = new THREE.MeshStandardMaterial({ color: col(c), metalness: 0.75, roughness: 0.25, emissive: col(c).multiplyScalar(0.18) });
      const accentS = new THREE.MeshStandardMaterial({ color: col(c).multiplyScalar(0.45), metalness: 0.8, roughness: 0.3 });
      const num = textMesh(String(seg.g + 1).padStart(2, '0'), 3.4, 1.1, [accentF, accentS]);
      num.position.set(0, 1.0, 0);
      const name = textMesh(G.GROUPS[seg.g].toUpperCase(), 0.85, 0.3, [MAT.creamFront, MAT.creamSide]);
      const nb = name.geometry.boundingBox; const nw = nb.max.x - nb.min.x;
      if (nw > 15) name.scale.setScalar(15 / nw);
      name.position.set(0, -2.15, 0.2);
      const cap = textMesh('CAPÍTULO', 0.42, 0.12, [MAT.goldFront, MAT.goldSide]);
      cap.position.set(0, 3.55, 0);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.06, 8, 160), new THREE.MeshBasicMaterial({ color: col(c) }));
      ring.position.set(0, 0.9, -1.4);
      const ring2 = new THREE.Mesh(new THREE.TorusGeometry(4.3, 0.025, 8, 160), new THREE.MeshBasicMaterial({ color: col('#f7f1e3') }));
      ring2.position.set(0, 0.9, -1.8);
      grp.add(num, name, cap, ring, ring2);
      return {
        group: grp, update(lt) {
          const q = back(p(lt, 0.05, 0.9));
          num.rotation.y = (1 - q) * 1.4 + Math.sin(lt * 1.3) * 0.12;
          num.rotation.x = Math.sin(lt * 0.9) * 0.06;
          const nq = back(p(lt, 0.45, 1.05));
          name.position.y = -2.15 - (1 - nq) * 1.5; name.visible = lt > 0.45;
          name.rotation.x = (1 - nq) * 1.2;
          cap.visible = lt > 0.3; cap.position.y = 3.55 + (1 - eo(p(lt, 0.3, 0.8))) * 1.2;
          ring.scale.setScalar(0.4 + 0.6 * eo(p(lt, 0.1, 0.9)) + 0.03 * Math.sin(lt * 6));
          ring.rotation.set(Math.sin(lt * 0.8) * 0.35, Math.cos(lt * 0.6) * 0.35, 0);
          ring2.rotation.set(Math.cos(lt * 0.7) * 0.5, Math.sin(lt * 0.5) * 0.5, lt * 0.3);
          ring2.scale.setScalar(eo(p(lt, 0.25, 1.1)));
        },
      };
    }
    function wedgeShape(r, a0, a1) { const s = new THREE.Shape(); s.moveTo(0, 0); s.absarc(0, 0, r, a0, a1, false); s.lineTo(0, 0); return s; }
    function buildPizza() {
      const grp = new THREE.Group(), spin = new THREE.Group(); grp.add(spin);
      const crustM = new THREE.MeshStandardMaterial({ color: col('#d98b2b'), roughness: 0.65, metalness: 0.05 });
      const cheeseM = new THREE.MeshStandardMaterial({ color: col('#ffc93c'), roughness: 0.5, metalness: 0.05 });
      const pepM = new THREE.MeshStandardMaterial({ color: col('#d64045'), roughness: 0.4 });
      const basilM = new THREE.MeshStandardMaterial({ color: col('#3a9d4a'), roughness: 0.5 });
      const r = rng(7), wedges = [];
      for (let i = 0; i < 8; i++) {
        const a0 = (i * Math.PI) / 4 + 0.012, a1 = a0 + Math.PI / 4 - 0.024, mid = (a0 + a1) / 2;
        const w = new THREE.Group();
        const crust = new THREE.Mesh(new THREE.ExtrudeGeometry(wedgeShape(2, a0, a1), { depth: 0.26, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06, bevelSegments: 3, curveSegments: 10 }), crustM);
        const cheese = new THREE.Mesh(new THREE.ExtrudeGeometry(wedgeShape(1.72, a0 + 0.02, a1 - 0.02), { depth: 0.08, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2, curveSegments: 10 }), cheeseM);
        cheese.position.z = 0.3;
        w.add(crust, cheese);
        for (let k = 0; k < 2; k++) {
          const d = 0.55 + r() * 0.85, a = lerp(a0 + 0.12, a1 - 0.12, r());
          const pep = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.07, 24), pepM);
          pep.rotation.x = Math.PI / 2; pep.position.set(Math.cos(a) * d, Math.sin(a) * d, 0.45); w.add(pep);
        }
        const bd = 0.4 + r() * 1.1, ba = lerp(a0, a1, r());
        const basil = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 6), basilM); basil.scale.set(1.3, 0.7, 0.4);
        basil.position.set(Math.cos(ba) * bd, Math.sin(ba) * bd, 0.44); w.add(basil);
        w.userData.mid = mid; spin.add(w); wedges.push(w);
      }
      return {
        group: grp, update(lt) {
          const s = back(p(lt, 0.8, 1.5));
          grp.scale.setScalar(Math.max(0.001, s));
          grp.position.set(0, px2y(380), 0.8);
          grp.rotation.set(-0.55 + Math.sin(lt * 0.8) * 0.06, Math.sin(lt * 0.6) * 0.2, 0);
          spin.rotation.z = lt * 0.45;
          const pop = eo(p(lt, 2.0, 2.6));
          const w = wedges[1];
          w.position.set(Math.cos(w.userData.mid) * pop * 0.6, Math.sin(w.userData.mid) * pop * 0.6, pop * 0.55);
          w.rotation.set(0, 0, 0);
        },
      };
    }
    function starShape(R, r) { const s = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + (i * Math.PI) / 5, rad = i % 2 ? r : R; const x = Math.cos(a) * rad, y = Math.sin(a) * rad; if (i) s.lineTo(x, y); else s.moveTo(x, y); } return s; }
    function buildMedal() {
      const grp = new THREE.Group(), body = new THREE.Group(); grp.add(body);
      const gold = new THREE.MeshStandardMaterial({ color: col('#ffbf3c'), metalness: 0.95, roughness: 0.18 });
      const goldD = new THREE.MeshStandardMaterial({ color: col('#c27b00'), metalness: 0.95, roughness: 0.25 });
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.16, 64), gold); disc.rotation.x = Math.PI / 2;
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.07, 16, 64), goldD);
      const st = new THREE.Mesh(new THREE.ExtrudeGeometry(starShape(0.42, 0.18), { depth: 0.06, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.02, bevelSegments: 2 }), new THREE.MeshStandardMaterial({ color: col('#fff3c4'), metalness: 0.8, roughness: 0.2 }));
      st.position.z = 0.09;
      const st2 = st.clone(); st2.rotation.y = Math.PI; st2.position.z = -0.09;
      body.add(disc, rim, st, st2);
      const ribA = new THREE.Mesh(new THREE.BoxGeometry(0.34, 1.35, 0.04), new THREE.MeshStandardMaterial({ color: col('#ff5d5d'), roughness: 0.5 }));
      ribA.position.set(-0.3, 1.32, -0.06); ribA.rotation.z = 0.3;
      const ribB = new THREE.Mesh(new THREE.BoxGeometry(0.34, 1.35, 0.04), new THREE.MeshStandardMaterial({ color: col('#4ea8ff'), roughness: 0.5 }));
      ribB.position.set(0.3, 1.32, -0.08); ribB.rotation.z = -0.3;
      grp.add(ribA, ribB);
      return {
        group: grp, update(lt) {
          const m = eo(p(lt, 0.4, 1.0));
          grp.scale.setScalar(1.25);
          grp.position.set(px2x(330), px2y(345) + (1 - m) * 4, 0.6);
          grp.visible = lt > 0.35;
          body.rotation.y = (1 - m) * Math.PI * 3 + Math.sin(lt * 1.4) * 0.45;
          grp.rotation.z = Math.sin(lt * 2.2) * 0.05 * (1 - p(lt, 0, 6));
        },
      };
    }
    function popsicleGeo() {
      const w = 0.65, h = 1.15, rt = 0.3, rb = 0.1, s = new THREE.Shape();
      s.moveTo(-w / 2 + rb, -h / 2); s.lineTo(w / 2 - rb, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + rb);
      s.lineTo(w / 2, h / 2 - rt); s.quadraticCurveTo(w / 2, h / 2, w / 2 - rt, h / 2); s.lineTo(-w / 2 + rt, h / 2);
      s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - rt); s.lineTo(-w / 2, -h / 2 + rb); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + rb, -h / 2);
      const g = new THREE.ExtrudeGeometry(s, { depth: 0.24, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.07, bevelSegments: 4, curveSegments: 12 });
      g.translate(0, 0, -0.12); return g;
    }
    const POP_GEO = { body: null, stick: null };
    function popsicleMesh(c) {
      if (!POP_GEO.body) { POP_GEO.body = popsicleGeo(); POP_GEO.stick = new THREE.BoxGeometry(0.14, 0.62, 0.08); }
      const g = new THREE.Group();
      const b = new THREE.Mesh(POP_GEO.body, new THREE.MeshStandardMaterial({ color: col(c), roughness: 0.28, metalness: 0.1, emissive: col(c).multiplyScalar(0.12) }));
      const st = new THREE.Mesh(POP_GEO.stick, new THREE.MeshStandardMaterial({ color: col('#d9b27c'), roughness: 0.7 }));
      st.position.y = -0.82; g.add(b, st); return g;
    }
    function buildDessert() {
      const grp = new THREE.Group();
      const big = popsicleMesh('#ff5d8f'); grp.add(big);
      const r = rng(99), cols = ['#ffb627', '#4ea8ff', '#2ec4b6', '#c77dff', '#ff8c42', '#ff5d8f'];
      const fall = [];
      for (let i = 0; i < 14; i++) {
        const m = popsicleMesh(cols[i % cols.length]); grp.add(m);
        m.userData = { x: (i % 2 ? 1 : -1) * (4.6 + r() * 3.2), z: 0.5 + r() * 2.5, sp: 2.2 + r() * 1.8, off: r() * 14, s: 0.55 + r() * 0.45, ry: (r() - 0.5) * 6, rz: (r() - 0.5) * 3 };
        fall.push(m);
      }
      return {
        group: grp, update(lt) {
          const q = back(p(lt, 0.5, 1.1));
          big.scale.setScalar(Math.max(0.001, 2.3 * q));
          big.position.set(0, px2y(345), 0.9);
          big.rotation.set(0.1, lt * 0.9, Math.sin(lt * 2) * 0.1);
          fall.forEach((m) => {
            const u = m.userData, tt = lt - 0.2;
            m.visible = tt > 0;
            m.scale.setScalar(u.s);
            m.position.set(u.x, 7 - ((tt * u.sp + u.off) % 15), u.z);
            m.rotation.set(0.3, tt * u.ry, tt * u.rz);
          });
        },
      };
    }
    function buildConfetti(t0, seed, sides = false) {
      const N = 170, r = rng(seed);
      const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.13, 0.24), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, toneMapped: false }), N);
      const cols = ['#ffb627', '#ff5d5d', '#2ec4b6', '#4ea8ff', '#c77dff', '#ff8c42', '#f7f1e3'];
      const data = [];
      for (let i = 0; i < N; i++) { mesh.setColorAt(i, col(cols[i % cols.length])); data.push({ x: sides ? (r() < 0.5 ? -1 : 1) * (4.4 + r() * 5) : (r() * 2 - 1) * 9.5, z: 0.4 + r() * 3.5, y0: 5.5 + r() * 6, v: 1.6 + r() * 1.6, sw: r() * 6, rx: r() * 8, ry: r() * 8 }); }
      const dummy = new THREE.Object3D();
      return {
        group: mesh, update(lt) {
          const tt = lt - t0;
          mesh.visible = tt > 0;
          data.forEach((d, i) => {
            dummy.position.set(d.x + Math.sin(tt * 1.5 + d.sw) * 0.4, d.y0 - tt * d.v, d.z);
            dummy.rotation.set(tt * d.rx, tt * d.ry, d.sw);
            dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix);
          });
          mesh.instanceMatrix.needsUpdate = true;
        },
      };
    }
    function combo(...items) { const g = new THREE.Group(); items.forEach((it) => g.add(it.group)); return { group: g, update(lt) { items.forEach((it) => it.update(lt)); } }; }
    function propFor(idx) {
      if (idx in props) return props[idx];
      const seg = G.SEGS[idx];
      let pr = null;
      if (seg.kind === 'bumper') pr = buildBumper(seg);
      else if (seg.id === 'intro') pr = buildLogo();
      else if (seg.id === 'pizza') pr = buildPizza();
      else if (seg.id === 'premiacao') pr = combo(buildMedal(), buildConfetti(3.2, 21));
      else if (seg.id === 'sobremesa') pr = buildDessert();
      else if (seg.id === 'fim') pr = buildConfetti(3.5, 33, true);
      if (pr) pr.group.traverse((o) => { if (o.material && 'envMapIntensity' in o.material) o.material.envMapIntensity = o.material.metalness > 0.5 ? 0.9 : 0.25; });
      props[idx] = pr;
      return pr;
    }

    // ---------- pós-processamento ----------
    const composer = new THREE.EffectComposer(renderer);
    composer.setPixelRatio(1); composer.setSize(OW, OH);
    const envPass = new THREE.RenderPass(envScene, camera);
    const bloom = new THREE.UnrealBloomPass(new THREE.Vector2(OW, OH), 0.95, 0.55, 0.5);
    const contentPass = new THREE.RenderPass(contentScene, camera); contentPass.clear = false;
    const propPass = new THREE.RenderPass(propScene, camera); propPass.clear = false;
    const finalPass = new THREE.ShaderPass({
      uniforms: { tDiffuse: { value: null }, uCA: { value: 0 }, uTime: { value: 0 }, uFlash: { value: 0 }, uVig: { value: 0.55 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: `uniform sampler2D tDiffuse; uniform float uCA; uniform float uTime; uniform float uFlash; uniform float uVig; varying vec2 vUv;
        vec3 toSRGB(vec3 c){ c = max(c, 0.0); return mix(c*12.92, 1.055*pow(c, vec3(0.41666))-0.055, step(vec3(0.0031308), c)); }
        void main(){
          vec2 d = vUv-0.5; float r2 = dot(d,d);
          vec2 off = d*uCA*(0.4+r2*3.0);
          vec3 c = vec3(texture2D(tDiffuse, vUv+off).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv-off).b);
          float band = exp(-pow((vUv.x - (uFlash*1.6-0.3))*5.0, 2.0)) * sin(uFlash*3.14159);
          c += vec3(1.0,0.82,0.55)*band*0.35;
          c *= 1.0 - uVig*smoothstep(0.12, 0.62, r2*1.5);
          c = toSRGB(c);
          float n = fract(sin(dot(vUv*vec2(12.9898,78.233)+uTime, vec2(1.0)))*43758.5453);
          c += (n-0.5)*0.03;
          gl_FragColor = vec4(c, 1.0);
        }`,
    });
    composer.addPass(envPass); composer.addPass(bloom); composer.addPass(contentPass); composer.addPass(propPass); composer.addPass(finalPass);

    // ---------- transições ----------
    function resetRig(slot) {
      [slot.outer, slot.outerP].forEach((o) => { o.position.set(0, 0, 0); o.rotation.set(0, 0, 0); o.scale.setScalar(1); o.visible = true; });
      [slot.inner, slot.innerP].forEach((o) => o.position.set(0, 0, 0));
      slot.mat.opacity = 1;
    }
    function applyRig(slot, type, role, q) {
      resetRig(slot);
      if (role === 'solo') return;
      const out = role === 'out';
      const set = (fn) => { fn(slot.outer, slot.inner); fn(slot.outerP, slot.innerP); };
      if (type === 'cube') {
        set((o, i) => { o.position.z = -8; i.position.z = 8; o.rotation.y = out ? -q * Math.PI / 2 : (1 - q) * Math.PI / 2; });
      } else if (type === 'slide') {
        set((o) => { o.position.x = out ? -q * 20 : (1 - q) * 20; o.position.z = -(out ? q : 1 - q) * 5; o.rotation.y = out ? q * 0.9 : -(1 - q) * 0.9; });
      } else if (type === 'flip') {
        const vis = out ? q < 0.5 : q >= 0.5;
        set((o) => { o.visible = vis; o.position.z = -Math.sin(q * Math.PI) * 4; o.rotation.y = out ? Math.min(1, q * 2) * Math.PI / 2 : -(1 - Math.max(0, (q - 0.5) * 2)) * Math.PI / 2; });
      } else if (type === 'swing') {
        set((o, i) => {
          if (out) { o.position.y = 4.5; i.position.y = -4.5; o.rotation.x = q * 1.45; }
          else { o.position.y = -4.5; i.position.y = 4.5; o.rotation.x = -(1 - q) * 1.45; }
        });
        if (out) slot.mat.opacity = 1 - q * 0.7;
      } else if (type === 'fly') {
        set((o) => { o.position.z = out ? q * 13 : -(1 - q) * 30; o.rotation.z = out ? q * 0.15 : -(1 - q) * 0.25; });
        slot.mat.opacity = out ? 1 - q : q;
      }
    }
    function camFor(seg, lt, t) {
      const base = { x: Math.sin(t * 0.21) * 0.55, y: 0.12 + Math.sin(t * 0.17) * 0.22, z: 14.6 };
      if (seg.kind === 'bumper') { const k = eio(p(lt, 0, seg.d)); return { x: lerp(-2.4, 1.6, k), y: lerp(1.4, 0.2, k), z: lerp(16.5, 12.8, k) }; }
      if (seg.id === 'intro') { const k = eo(p(lt, 0, 3.5)); return { x: lerp(3, base.x, k), y: lerp(-1.5, base.y, k), z: lerp(22, 14.6, k) }; }
      return base;
    }

    function renderFrame(t) {
      t = clamp(t, 0, G.DUR);
      const i = G.segAt(t), seg = G.SEGS[i], lt = t - seg.a;
      const act = [];
      let q = 0, type = null;
      if (i > 0 && lt < G.OVER) {
        q = eio(lt / G.OVER); type = seg.tin;
        act.push({ idx: i - 1, role: 'out' }, { idx: i, role: 'in' });
      } else act.push({ idx: i, role: 'solo' });
      Object.values(props).forEach((pr) => { if (pr) pr.group.visible = false; });
      slots.forEach((s) => { s.plane.visible = false; });
      act.forEach((a, k) => {
        const slot = slots[k], s = G.SEGS[a.idx], slt = t - s.a;
        applyRig(slot, type, a.role, q);
        if (s.kind === 'scene') { slot.plane.visible = true; drawContent(slot, a.idx, slt); }
        const pr = propFor(a.idx);
        if (pr) { slot.innerP.add(pr.group); pr.group.visible = true; pr.update(slt); }
      });
      // câmera (mistura entre os segmentos na transição)
      let cam = camFor(seg, lt, t);
      if (act.length === 2) {
        const pr = G.SEGS[i - 1], c0 = camFor(pr, t - pr.a, t);
        cam = { x: lerp(c0.x, cam.x, q), y: lerp(c0.y, cam.y, q), z: lerp(c0.z, cam.z, q) };
        if (type !== 'fly') cam.z += Math.sin(q * Math.PI) * 3.2;
      }
      camera.position.set(cam.x, cam.y, cam.z);
      camera.lookAt(cam.x * 0.25, 0, 0);
      // arena
      floorMat.uniforms.uTime.value = t;
      partMat.uniforms.uTime.value = t;
      arches.forEach((m, k) => { m.material.color.copy(m.userData.base).multiplyScalar(1.2 + 0.8 * Math.sin(t * 1.6 - k * 0.7)); });
      beams.forEach((b) => { b.rotation.z = Math.sin(t * 0.35 + b.userData.ph) * 0.35; b.rotation.x = Math.sin(t * 0.27 + b.userData.ph) * 0.15; });
      stadium.forEach((s, k) => { const f = 1 + 0.08 * Math.sin(t * 3 + k); s.scale.set(9 * f, 9 * f, 1); });
      shapes.forEach((m) => { const u = m.userData; m.position.set(u.x + Math.sin(t * 0.2 + u.ph) * 0.8, u.y + Math.sin(t * 0.5 + u.ph) * 0.7, u.z); m.rotation.set(t * u.rx + u.ph, t * u.ry, 0); m.scale.setScalar(u.s); });
      // pós
      const amt = act.length === 2 ? Math.sin(q * Math.PI) : 0;
      finalPass.uniforms.uCA.value = 0.0035 + amt * 0.028;
      finalPass.uniforms.uFlash.value = act.length === 2 && type !== 'fly' ? q : 0;
      finalPass.uniforms.uTime.value = (t * 30) % 1000;
      bloom.strength = 0.95 + amt * 0.6;
      composer.render();
    }

    function setSize(w, h) {
      OW = w; OH = h;
      renderer.setSize(w, h, false); composer.setSize(w, h); bloom.setSize(w, h);
      camera.aspect = w / h; camera.updateProjectionMatrix();
      partMat.uniforms.uScale.value = h / 2;
      const ncs = clamp((w / 1280) * 1.15, 1, 2);
      if (Math.abs(ncs - CS) > 0.05) { CS = ncs; resizeSlots(); }
    }
    setSize(OW, OH);
    return { canvas: renderer.domElement, renderFrame, setSize };
  }

  window.Stage3D = { create };
})();
