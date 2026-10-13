/* ENEM GAMES 2026 — animação do regulamento em 60 s.
   Tudo é desenhado a partir do tempo t (segundos), então qualquer quadro
   pode ser renderizado de forma determinística (player e exportação MP4). */
(function () {
  const W = 1280, H = 720, DUR = 60;
  const DISP = '"Bungee", Impact, sans-serif';
  const BODY = '"Barlow Condensed", "Arial Narrow", sans-serif';
  const C = {
    night: '#0b1230', night2: '#16214f', line: '#2b3a7a', cream: '#f7f1e3', dim: '#9aa6d6',
    amber: '#ffb627', coral: '#ff5d5d', ink: '#141c3f', paper: '#f4ecd8', ok: '#3ddc84',
  };
  const AREAS = [
    { k: 'LIN', n: 'Linguagens', c: '#ff8c42' },
    { k: 'HUM', n: 'Humanas', c: '#c77dff' },
    { k: 'NAT', n: 'Natureza', c: '#2ec4b6' },
    { k: 'MAT', n: 'Matemática', c: '#4ea8ff' },
  ];
  const TEAMS = ['#ffb627', '#ff5d5d', '#2ec4b6', '#4ea8ff', '#c77dff', '#ff8c42'];
  const CHAPTERS = [
    { a: 0, b: 5, n: 'Enem Games' },
    { a: 5, b: 15, n: 'Abertura' },
    { a: 15, b: 24, n: 'Os desafios' },
    { a: 24, b: 36, n: 'A jornada' },
    { a: 36, b: 45, n: 'Tempo e vagas' },
    { a: 45, b: 50, n: 'Conduta' },
    { a: 50, b: 55, n: 'Premiação' },
    { a: 55, b: 60, n: 'Pizza & picolé' },
  ];

  let ctx;

  // ---------- utilidades ----------
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const p = (t, a, b) => clamp((t - a) / (b - a));
  const lerp = (a, b, x) => a + (b - a) * x;
  const eo = (x) => 1 - Math.pow(1 - x, 3);
  const eio = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const back = (x) => { const c1 = 1.9, c3 = c1 + 1; return x <= 0 ? 0 : 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
  function rng(seed) { return function () { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const mmss = (s) => { s = Math.max(0, Math.round(s)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
  const hhmm = (m) => { m = Math.floor(m); return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };

  function T(s, x, y, o = {}) {
    ctx.save();
    ctx.globalAlpha *= o.a ?? 1;
    const f = o.f || BODY;
    ctx.font = `${o.w ?? (f === DISP ? 400 : 600)} ${o.s || 32}px ${f}`;
    ctx.fillStyle = o.c || C.cream;
    ctx.textAlign = o.al || 'center';
    ctx.textBaseline = o.bl || 'middle';
    ctx.letterSpacing = (o.ls || 0) + 'px';
    if (o.shadow) { ctx.shadowColor = o.shadow; ctx.shadowBlur = 24; }
    ctx.fillText(s, x, y);
    ctx.restore();
  }
  function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
  function fillRR(x, y, w, h, r, c) { rr(x, y, w, h, r); ctx.fillStyle = c; ctx.fill(); }
  function strokeRR(x, y, w, h, r, c, lw = 2, dash) { rr(x, y, w, h, r); ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.setLineDash(dash || []); ctx.stroke(); ctx.setLineDash([]); }
  function circle(x, y, r, c) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill(); }
  function ring(x, y, r, c, lw = 2, dash) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.setLineDash(dash || []); ctx.stroke(); ctx.setLineDash([]); }
  function withT(x, y, s, rot, fn) { ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot); if (s !== 1) ctx.scale(s, s); fn(); ctx.restore(); }
  function alpha(a, fn) { ctx.save(); ctx.globalAlpha *= a; fn(); ctx.restore(); }

  // ---------- ícones ----------
  function team(x, y, col, s = 1, a = 1) {
    alpha(a, () => withT(x, y, s, 0, () => {
      ring(0, 0, 30, col + '66', 2);
      for (let i = 0; i < 5; i++) {
        const an = -Math.PI / 2 + (i * Math.PI * 2) / 5;
        circle(Math.cos(an) * 17, Math.sin(an) * 17, 8, col);
      }
    }));
  }
  function check(x, y, s, col = C.ok) {
    withT(x, y, s, 0, () => {
      circle(0, 0, 16, col);
      ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(-2, 6); ctx.lineTo(8, -6);
      ctx.strokeStyle = C.ink; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
    });
  }
  function cross(x, y, s, col = C.coral) {
    withT(x, y, s, 0, () => {
      ctx.beginPath(); ctx.moveTo(-40, -40); ctx.lineTo(40, 40); ctx.moveTo(40, -40); ctx.lineTo(-40, 40);
      ctx.strokeStyle = col; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.stroke();
    });
  }
  function lock(x, y, s, open, col = C.cream) {
    withT(x, y, s, 0, () => {
      ctx.beginPath();
      const lift = open * 12;
      ctx.arc(0, -10 - lift, 10, Math.PI, 0);
      ctx.lineTo(10, -2 - lift * (open > 0.5 ? 1 : 0));
      ctx.moveTo(-10, -10 - lift); ctx.lineTo(-10, -2 - lift);
      ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.stroke();
      fillRR(-15, -4, 30, 24, 5, col);
    });
  }
  function ball(x, y, r, col = C.cream, rot = 0) {
    withT(x, y, 1, rot, () => {
      ring(0, 0, r, col, 3);
      ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(r, 0);
      ctx.moveTo(0, -r); ctx.bezierCurveTo(r * 0.7, -r * 0.5, r * 0.7, r * 0.5, 0, r);
      ctx.moveTo(0, -r); ctx.bezierCurveTo(-r * 0.7, -r * 0.5, -r * 0.7, r * 0.5, 0, r);
      ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.stroke();
    });
  }
  function book(x, y, s, col = C.cream, rot = 0) {
    withT(x, y, s, rot, () => {
      ctx.beginPath(); ctx.moveTo(0, -18); ctx.quadraticCurveTo(-18, -26, -36, -20); ctx.lineTo(-36, 22); ctx.quadraticCurveTo(-18, 16, 0, 24);
      ctx.quadraticCurveTo(18, 16, 36, 22); ctx.lineTo(36, -20); ctx.quadraticCurveTo(18, -26, 0, -18); ctx.lineTo(0, 24);
      ctx.strokeStyle = col; ctx.lineWidth = 3.5; ctx.lineJoin = 'round'; ctx.stroke();
    });
  }
  function phone(x, y, s, col = C.cream, rot = 0) {
    withT(x, y, s, rot, () => {
      fillRR(-22, -40, 44, 80, 9, col);
      fillRR(-17, -32, 34, 58, 3, C.night2);
      circle(0, 33, 3.5, C.night2);
    });
  }
  function envelope(x, y, s, flap) {
    withT(x, y, s, 0, () => {
      fillRR(-110, -70, 220, 140, 10, C.paper);
      ctx.beginPath(); ctx.moveTo(-110, 70); ctx.lineTo(0, 0); ctx.lineTo(110, 70); ctx.strokeStyle = '#d7c9a6'; ctx.lineWidth = 3; ctx.stroke();
      // aba: flap 0 = aberta (para cima), 1 = fechada
      const fy = lerp(-160, 10, flap);
      ctx.beginPath(); ctx.moveTo(-110, -70); ctx.lineTo(0, fy); ctx.lineTo(110, -70); ctx.closePath();
      ctx.fillStyle = flap > 0.5 ? '#e8dcbc' : '#efe4c8'; ctx.fill(); ctx.strokeStyle = '#d7c9a6'; ctx.stroke();
      if (flap > 0.95) { circle(0, 6, 16, C.coral); T('G9', 0, 7, { f: DISP, s: 13, c: C.paper }); }
    });
  }
  function passport(x, y, s, col = '#1f6f78', rot = 0) {
    withT(x, y, s, rot, () => {
      fillRR(-26, -34, 52, 68, 5, col);
      ring(0, -6, 11, C.amber, 2.5);
      ctx.beginPath(); ctx.moveTo(-11, -6); ctx.lineTo(11, -6); ctx.moveTo(0, -17); ctx.lineTo(0, 5); ctx.strokeStyle = C.amber; ctx.lineWidth = 2; ctx.stroke();
      fillRR(-14, 14, 28, 4, 2, C.amber);
    });
  }
  function clipboard(x, y, s) {
    withT(x, y, s, 0, () => {
      fillRR(-170, -150, 340, 300, 16, C.paper);
      fillRR(-50, -168, 100, 34, 8, C.amber);
    });
  }
  function medal(x, y, s, swing) {
    withT(x, y, s, swing, () => {
      ctx.beginPath(); ctx.moveTo(-46, -150); ctx.lineTo(-10, -40); ctx.lineTo(10, -40); ctx.lineTo(-20, -150); ctx.closePath(); ctx.fillStyle = C.coral; ctx.fill();
      ctx.beginPath(); ctx.moveTo(46, -150); ctx.lineTo(10, -40); ctx.lineTo(-10, -40); ctx.lineTo(20, -150); ctx.closePath(); ctx.fillStyle = '#4ea8ff'; ctx.fill();
      circle(0, 10, 62, '#e09a12');
      circle(0, 10, 52, C.amber);
      star(0, 10, 28, 12, '#fff3c4');
      T('ENEM GAMES', 0, 50, { f: DISP, s: 9, c: '#7a4d00' });
    });
  }
  function star(x, y, R, r, col) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rad = i % 2 ? r : R; ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad); }
    ctx.closePath(); ctx.fillStyle = col; ctx.fill();
  }
  function school(x, y, s) {
    withT(x, y, s, 0, () => {
      ctx.beginPath(); ctx.moveTo(-60, -10); ctx.lineTo(0, -50); ctx.lineTo(60, -10); ctx.closePath(); ctx.fillStyle = C.amber; ctx.fill();
      fillRR(-50, -10, 100, 60, 3, C.cream);
      fillRR(-12, 18, 24, 32, 2, C.night2);
      fillRR(-40, 2, 18, 16, 2, C.night2); fillRR(22, 2, 18, 16, 2, C.night2);
      T('G9', 0, -22, { f: DISP, s: 14, c: C.ink });
    });
  }
  const PEPS = (() => { const r = rng(7), a = []; for (let i = 0; i < 9; i++) { const ang = r() * Math.PI * 2, d = 0.25 + r() * 0.5; a.push([Math.cos(ang) * d, Math.sin(ang) * d]); } return a; })();
  function pizza(x, y, r, rot, popped = 0) {
    withT(x, y, 1, rot, () => {
      for (let i = 0; i < 8; i++) {
        const a0 = (i * Math.PI) / 4, a1 = a0 + Math.PI / 4;
        const off = i === 1 ? popped * r * 0.28 : 0;
        const mid = (a0 + a1) / 2;
        ctx.save(); ctx.translate(Math.cos(mid) * off, Math.sin(mid) * off);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r, a0, a1); ctx.closePath(); ctx.fillStyle = '#d98b2b'; ctx.fill();
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r * 0.86, a0, a1); ctx.closePath(); ctx.fillStyle = '#ffd166'; ctx.fill();
        ctx.strokeStyle = '#e8b04b'; ctx.lineWidth = 3; ctx.stroke();
        ctx.save(); ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r * 0.86, a0, a1); ctx.closePath(); ctx.clip();
        PEPS.forEach(([px, py]) => circle(px * r, py * r, r * 0.1, '#d64045'));
        ctx.restore();
        ctx.restore();
      }
      PEPS.slice(0, 5).forEach(([px, py], i) => circle(-py * r * 0.9, px * r * 0.9, r * 0.035, i % 2 ? '#3a7d44' : '#3a7d44'));
    });
  }
  function popsicle(x, y, s, rot, col) {
    withT(x, y, s, rot, () => {
      fillRR(-6, 30, 12, 46, 5, '#d9b27c');
      fillRR(-26, -56, 52, 92, [26, 26, 10, 10], col);
      fillRR(-26, -56, 52, 30, [26, 26, 0, 0], '#ffffff55');
      fillRR(-16, -40, 7, 50, 4, '#ffffff66');
    });
  }

  // ---------- fundo e HUD ----------
  const STARS = (() => { const r = rng(42), a = []; for (let i = 0; i < 70; i++) a.push([r() * W, r() * H, r() * 1.6 + 0.4, r() * 6]); return a; })();
  function background(t) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, C.night); g.addColorStop(1, C.night2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    STARS.forEach(([x, y, r, ph]) => circle(x, y, r, `rgba(247,241,227,${0.12 + 0.18 * (0.5 + 0.5 * Math.sin(t * 1.3 + ph))})`));
    // linhas de quadra
    ctx.strokeStyle = 'rgba(140,160,255,0.07)'; ctx.lineWidth = 3;
    ctx.strokeRect(36, 76, W - 72, H - 112);
    ctx.beginPath(); ctx.moveTo(W / 2, 76); ctx.lineTo(W / 2, H - 36); ctx.stroke();
    ring(W / 2, (H + 40) / 2, 120, 'rgba(140,160,255,0.07)', 3);
  }
  const CLOCK = [[0, 1050], [5, 1050], [15, 1078], [15.01, 1080], [24, 1080], [36, 1210], [45, 1235], [50, 1255], [51.5, 1260], [55, 1260], [60, 1275]];
  function eventMinutes(t) {
    for (let i = 1; i < CLOCK.length; i++) if (t <= CLOCK[i][0]) return lerp(CLOCK[i - 1][1], CLOCK[i][1], p(t, CLOCK[i - 1][0], CLOCK[i][0]));
    return CLOCK[CLOCK.length - 1][1];
  }
  function chapterIndex(t) { for (let i = CHAPTERS.length - 1; i >= 0; i--) if (t >= CHAPTERS[i].a) return i; return 0; }
  function hud(t) {
    T('ENEM GAMES', 40, 40, { f: DISP, s: 20, c: C.amber, al: 'left' });
    T('CURSO G9 · 2026', 212, 41, { s: 18, c: C.dim, al: 'left', ls: 2 });
    const ci = chapterIndex(t);
    T(`${ci + 1}/8 · ${CHAPTERS[ci].n.toUpperCase()}`, W / 2, 41, { s: 19, c: C.dim, ls: 3 });
    const m = eventMinutes(t);
    const live = m >= 1080 && m < 1260;
    fillRR(1120, 20, 120, 42, 21, m >= 1260 ? C.coral : live ? C.amber : C.line);
    T(hhmm(m), 1180, 42, { f: DISP, s: 22, c: live || m >= 1260 ? C.ink : C.cream });
    T(m < 1080 ? 'ANTES DA LARGADA' : m < 1260 ? 'DESAFIOS EM ANDAMENTO' : 'ENCERRADO', 1106, 42, { s: 16, c: C.dim, al: 'right', ls: 2 });
    // barra de progresso por capítulo
    CHAPTERS.forEach((c, i) => {
      const x0 = 40 + (c.a / DUR) * (W - 80) + 2, w = ((c.b - c.a) / DUR) * (W - 80) - 4;
      fillRR(x0, H - 14, w, 4, 2, 'rgba(154,166,214,0.25)');
      const f = p(t, c.a, c.b);
      if (f > 0) fillRR(x0, H - 14, w * f, 4, 2, C.amber);
    });
  }
  function title(s, y, a = 1, size = 44, col = C.cream) { T(s, W / 2, y, { f: DISP, s: size, c: col, a }); }
  function eyebrow(s, y, a = 1, col = C.amber) { T(s, W / 2, y, { s: 22, c: col, a, ls: 5, w: 600 }); }

  // ---------- cena 1: abertura do vídeo ----------
  function wordDrop(word, cx, y, size, col, t0, lt, stagger = 0.1) {
    ctx.font = `400 ${size}px ${DISP}`;
    const ws = [...word].map((ch) => ctx.measureText(ch).width);
    const total = ws.reduce((a, b) => a + b, 0);
    let x = cx - total / 2;
    [...word].forEach((ch, i) => {
      const q = back(p(lt, t0 + i * stagger, t0 + i * stagger + 0.55));
      T(ch, x + ws[i] / 2, y - (1 - q) * 260, { f: DISP, s: size, c: col, a: clamp(q * 2) });
      x += ws[i];
    });
  }
  function sIntro(lt) {
    const sp = eo(p(lt, 0.2, 1.6));
    alpha(sp, () => {
      book(250, 250 + Math.sin(lt * 2) * 8, 1.6, AREAS[3].c, -0.2);
      ball(1030, 250 + Math.cos(lt * 2) * 8, 34, AREAS[0].c, lt * 0.8);
      phone(210, 520 + Math.sin(lt * 1.7) * 6, 0.9, AREAS[2].c, 0.25);
      passport(1075, 520 + Math.cos(lt * 1.6) * 6, 1.3, AREAS[1].c, -0.15);
    });
    wordDrop('ENEM', W / 2, 290, 150, C.cream, 0.1, lt);
    const g = back(p(lt, 0.8, 1.5));
    withT(W / 2, 430, lerp(0.3, 1, g), 0, () => T('GAMES', 0, 0, { f: DISP, s: 120, c: C.amber, a: clamp(g * 2) }));
    T('O regulamento da noite em 1 minuto', W / 2, 535, { s: 38, w: 600, a: eo(p(lt, 1.7, 2.3)) });
    const b = eo(p(lt, 2.3, 2.9));
    alpha(b, () => {
      fillRR(W / 2 - 170, 580, 340, 46, 23, C.line);
      T('18h às 21h · na escola', W / 2, 604, { s: 26, c: C.cream, ls: 1 });
    });
  }

  // ---------- cena 2: abertura / credenciamento ----------
  const SORT = (() => {
    const r = rng(11), dots = [];
    for (let i = 0; i < 30; i++) dots.push({ x: 180 + r() * 920, y: 260 + r() * 360, ph: r() * 6, sp: 0.6 + r() * 0.8, team: 0, slot: 0, delay: r() * 0.6 });
    const order = dots.map((_, i) => i).sort(() => r() - 0.5);
    order.forEach((di, k) => { dots[di].team = Math.floor(k / 5); dots[di].slot = k % 5; });
    return dots;
  })();
  const TEAM_POS = [[340, 360], [640, 360], [940, 360], [340, 540], [640, 540], [940, 540]];
  function stepChips(active, a) {
    const items = ['1  Regras', '2  Sorteio', '3  Passaporte', 'Celulares'];
    const w = 190, gap = 14, x0 = W / 2 - (items.length * w + (items.length - 1) * gap) / 2;
    items.forEach((s, i) => {
      const on = i === active, done = i < active;
      alpha(a, () => {
        fillRR(x0 + i * (w + gap), 92, w, 40, 20, on ? C.amber : done ? C.line : 'rgba(43,58,122,0.45)');
        T(s, x0 + i * (w + gap) + w / 2, 113, { s: 22, c: on ? C.ink : done ? C.cream : C.dim, ls: 1 });
        if (done) check(x0 + i * (w + gap) + w - 22, 112, 0.6);
      });
    });
  }
  function sOpening(lt) {
    const phase = lt < 2.6 ? 0 : lt < 6 ? 1 : lt < 8 ? 2 : 3;
    stepChips(phase, eo(p(lt, 0, 0.4)));
    // fase A: regras
    if (lt < 2.9) {
      const a = Math.min(eo(p(lt, 0.1, 0.5)), 1 - p(lt, 2.5, 2.9));
      alpha(a, () => {
        title('Explicação das regras', 190, 1, 40);
        clipboard(W / 2, 440, 1.25);
        const lines = ['Início 18h · limite 21h', 'Cada desafio: até 10 min', 'A equipe anda sempre completa'];
        lines.forEach((s, i) => {
          const q = eo(p(lt, 0.6 + i * 0.45, 1.0 + i * 0.45));
          T(s, W / 2 - 178, 360 + i * 80, { s: 32, c: C.ink, al: 'left', a: q });
          if (q > 0) check(W / 2 - 200, 360 + i * 80, back(q) * 0.9);
        });
      });
    }
    // fase B e C: sorteio + passaporte
    if (lt >= 2.6 && lt < 8.4) {
      const a = Math.min(eo(p(lt, 2.6, 3.0)), 1 - p(lt, 8.0, 8.4));
      alpha(a, () => {
        title(lt < 6 ? 'Sorteio das equipes' : 'Passaporte de Certificação', 190, 1, 40);
        if (lt >= 6) T('cada área concluída ganha um registro', W / 2, 232, { s: 26, c: C.dim, a: eo(p(lt, 6.1, 6.5)) });
        SORT.forEach((d) => {
          const shuffle = p(lt, 2.6, 3.8);
          const jx = Math.sin(lt * 6 * d.sp + d.ph) * 40 * shuffle, jy = Math.cos(lt * 5 * d.sp + d.ph) * 30 * shuffle;
          const go = eio(p(lt, 3.8 + d.delay, 4.9 + d.delay));
          const [cx, cy] = TEAM_POS[d.team];
          const an = -Math.PI / 2 + (d.slot * Math.PI * 2) / 5;
          const tx = cx + Math.cos(an) * 17, ty = cy + Math.sin(an) * 17;
          const x = lerp(d.x + jx, tx, go), y = lerp(d.y + jy, ty, go);
          circle(x, y, 8, go > 0.6 ? TEAMS[d.team] : C.dim);
        });
        TEAM_POS.forEach(([x, y], i) => {
          const q = eo(p(lt, 5.0 + i * 0.08, 5.4 + i * 0.08));
          ring(x, y, 30, TEAMS[i] + '66', 2 * q);
          T('EQUIPE ' + 'ABCDEF'[i], x, y + 58, { s: 22, c: TEAMS[i], a: q, ls: 2 });
          const f = eo(p(lt, 6.2 + i * 0.15, 6.8 + i * 0.15));
          if (f > 0) passport(lerp(W / 2, x + 70, f), lerp(130, y, f), lerp(0.5, 0.8, f), '#1f6f78', (1 - f) * 2);
        });
      });
    }
    // fase D: celulares
    if (lt >= 8) {
      const a = eo(p(lt, 8.1, 8.5)) * (1 - p(lt, 9.75, 10));
      alpha(a, () => {
        title('Celulares no envelope', 190, 1, 40);
        T('recolhidos no início e devolvidos só no final', W / 2, 232, { s: 26, c: C.dim });
        const flap = eio(p(lt, 9.1, 9.5));
        envelope(W / 2, 470, 1.1, flap);
        if (flap < 0.6) {
          for (let i = 0; i < 4; i++) {
            const f = eio(p(lt, 8.3 + i * 0.15, 8.9 + i * 0.15));
            phone(W / 2 - 75 + i * 50, lerp(240, 470, f), 0.8, TEAMS[i], (1 - f) * (i % 2 ? 0.6 : -0.6));
          }
        }
        if (flap >= 0.6) envelope(W / 2, 470, 1.1, flap);
      });
    }
  }

  // ---------- cena 3: tipos de desafio ----------
  const CARD_X = [245, 515, 785, 1055];
  const DONE_ORDER = [1, 3, 0, 2];
  function sKinds(lt) {
    title('Dois tipos de desafio', 112, eo(p(lt, 0, 0.4)), 42);
    T('ACADÊMICOS · na ordem que a equipe quiser', 64, 188, { s: 26, al: 'left', a: eo(p(lt, 0.3, 0.7)), ls: 1 });
    AREAS.forEach((ar, i) => {
      const x = CARD_X[i];
      const k = DONE_ORDER.indexOf(i);
      const tDone = 3.0 + k * 1.15;
      const done = p(lt, tDone, tDone + 0.3);
      const unlock = eo(p(lt, tDone + 0.45, tDone + 0.85));
      // conector
      const ca = eo(p(lt, 1.6, 2.2));
      alpha(ca, () => {
        ctx.beginPath(); ctx.moveTo(x, 352); ctx.lineTo(x, 458);
        ctx.strokeStyle = unlock > 0 ? ar.c : C.line; ctx.lineWidth = 4; ctx.setLineDash([8, 8]); ctx.lineDashOffset = -lt * 30; ctx.stroke(); ctx.setLineDash([]);
        if (done > 0 && unlock < 1) circle(x, lerp(352, 458, p(lt, tDone + 0.1, tDone + 0.6)), 8, ar.c);
      });
      // card acadêmico
      const q = back(p(lt, 0.3 + i * 0.15, 0.8 + i * 0.15));
      withT(x, 290, q, 0, () => {
        fillRR(-115, -60, 230, 120, 18, done > 0 ? ar.c : C.night2);
        strokeRR(-115, -60, 230, 120, 18, ar.c, 3);
        book(0, -14, 0.8, done > 0 ? C.ink : ar.c);
        T(ar.n, 0, 32, { s: 30, w: 800, c: done > 0 ? C.ink : C.cream });
        if (done > 0) {
          check(92, -38, back(done) * 1.1);
          withT(-92, -38, back(done), 0, () => { circle(0, 0, 17, C.ink); T(String(k + 1) + 'º', 1, 1, { s: 20, w: 800, c: ar.c }); });
        }
      });
      // card esportivo
      const q2 = back(p(lt, 1.3 + i * 0.15, 1.8 + i * 0.15));
      withT(x, 520, q2, 0, () => {
        fillRR(-115, -60, 230, 120, 18, unlock > 0.5 ? ar.c + '33' : 'rgba(22,33,79,0.9)');
        strokeRR(-115, -60, 230, 120, 18, unlock > 0.5 ? ar.c : C.line, 3, unlock > 0.5 ? null : [6, 6]);
        ball(-70, -2, 22, unlock > 0.5 ? ar.c : C.dim, lt * unlock);
        T('Esporte', -38, -16, { s: 22, c: unlock > 0.5 ? C.cream : C.dim, al: 'left' });
        T(ar.n, -38, 14, { s: 26, w: 800, c: unlock > 0.5 ? ar.c : C.dim, al: 'left' });
        withT(92, -38, 0.6, 0, () => lock(0, 0, 1, unlock, unlock > 0.5 ? C.ok : C.dim));
      });
    });
    alpha(eo(p(lt, 1.3, 1.7)), () => {
      ctx.font = `600 26px ${BODY}`; ctx.letterSpacing = '1px';
      const lw = ctx.measureText('ESPORTIVOS · só depois do acadêmico da mesma área').width; ctx.letterSpacing = '0px';
      fillRR(52, 412, lw + 26, 40, 20, C.night2);
      T('ESPORTIVOS · só depois do acadêmico da mesma área', 64, 432, { s: 26, al: 'left', ls: 1, c: C.amber });
    });
    T('Cada acadêmico concluído vira um registro no Passaporte', W / 2, 640, { s: 28, c: C.dim, a: eo(p(lt, 7.3, 7.8)) });
  }

  // ---------- cena 4: jornada de uma equipe ----------
  const NODES = [
    { x: 110, y: 610, type: 'start' },
    { x: 190, y: 300, type: 'ac', a: 1 },
    { x: 330, y: 460, type: 'sp', a: 1 },
    { x: 430, y: 220, type: 'ac', a: 3 },
    { x: 690, y: 220, type: 'ac', a: 0 },
    { x: 560, y: 390, type: 'sp', a: 3 },
    { x: 790, y: 430, type: 'ac', a: 2 },
    { x: 640, y: 580, type: 'sp', a: 0 },
    { x: 420, y: 610, type: 'sp', a: 2 },
  ];
  const TIMES = [432, 365, 520, 333, 550, 408, 475, 277];
  const HOP0 = 0.9, HOP = 1.35, MOVE = 0.55;
  function journeyState(lt) {
    // índice do desafio atual e fração de cada etapa
    const k = Math.floor((lt - HOP0) / HOP);
    return { k, f: (lt - HOP0) / HOP - k };
  }
  function acDoneAt(area) { const idx = NODES.findIndex((n) => n.type === 'ac' && n.a === area); return HOP0 + (idx - 1) * HOP + HOP; }
  function spDoneAt(area) { const idx = NODES.findIndex((n) => n.type === 'sp' && n.a === area); return HOP0 + (idx - 1) * HOP + HOP; }
  function sJourney(lt) {
    T('A NOITE DE UMA EQUIPE', 60, 112, { f: DISP, s: 34, al: 'left', a: eo(p(lt, 0, 0.4)) });
    T('exemplo: Equipe A, sempre completa, escolhendo seu caminho', 62, 150, { s: 24, al: 'left', c: C.dim, a: eo(p(lt, 0.2, 0.6)) });
    const ma = eo(p(lt, 0.2, 0.8));
    // trilha percorrida
    const { k, f } = journeyState(lt);
    alpha(ma, () => {
      ctx.beginPath(); ctx.moveTo(NODES[0].x, NODES[0].y);
      for (let i = 1; i < NODES.length; i++) ctx.lineTo(NODES[i].x, NODES[i].y);
      ctx.strokeStyle = 'rgba(154,166,214,0.18)'; ctx.lineWidth = 3; ctx.setLineDash([4, 10]); ctx.stroke(); ctx.setLineDash([]);
      if (lt > HOP0) {
        ctx.beginPath(); ctx.moveTo(NODES[0].x, NODES[0].y);
        const last = Math.min(k, NODES.length - 2);
        for (let i = 1; i <= last; i++) ctx.lineTo(NODES[i].x, NODES[i].y);
        if (k < NODES.length - 1) {
          const m = eio(clamp(f / (MOVE / HOP)));
          const A = NODES[k], B = NODES[k + 1];
          ctx.lineTo(lerp(A.x, B.x, m), lerp(A.y, B.y, m));
        }
        ctx.strokeStyle = C.amber; ctx.lineWidth = 4; ctx.stroke();
      }
      // nós
      NODES.forEach((n, i) => {
        const q = back(p(lt, 0.2 + i * 0.05, 0.6 + i * 0.05));
        withT(n.x, n.y, q, 0, () => {
          if (n.type === 'start') {
            fillRR(-56, -20, 112, 40, 20, C.line); T('LARGADA', 0, 1, { s: 20, ls: 2 });
            return;
          }
          const ar = AREAS[n.a];
          const doneT = HOP0 + (i - 1) * HOP + HOP - 0.05;
          const done = lt >= doneT;
          if (n.type === 'ac') {
            circle(0, 0, 38, done ? ar.c : C.night);
            ring(0, 0, 38, ar.c, 3);
            book(0, -6, 0.55, done ? C.ink : ar.c);
            T(ar.k, 0, 18, { f: DISP, s: 13, c: done ? C.ink : ar.c });
          } else {
            const open = lt >= acDoneAt(n.a);
            fillRR(-34, -34, 68, 68, 14, done ? ar.c : C.night);
            strokeRR(-34, -34, 68, 68, 14, open ? ar.c : C.line, 3, open ? null : [5, 5]);
            ball(0, -5, 15, done ? C.ink : open ? ar.c : C.dim);
            T(ar.k, 0, 22, { f: DISP, s: 11, c: done ? C.ink : open ? ar.c : C.dim });
            if (!open) withT(26, -30, 0.6, 0, () => lock(0, 0, 1, 0, C.dim));
          }
          // anel de 10 min enquanto a equipe está no desafio
          if (k === i - 1 && f > MOVE / HOP) {
            const tf = p(f, MOVE / HOP, 0.97);
            ctx.beginPath(); ctx.arc(0, 0, 50, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * tf * (TIMES[i - 1] / 600));
            ctx.strokeStyle = C.amber; ctx.lineWidth = 6; ctx.stroke();
            ring(0, 0, 50, 'rgba(255,182,39,0.2)', 6);
          }
          if (done) check(32, -32, back(p(lt, doneT, doneT + 0.3)) * 0.8);
        });
      });
      // equipe
      let tx = NODES[0].x, ty = NODES[0].y;
      if (lt > HOP0) {
        if (k >= NODES.length - 1) { tx = NODES[NODES.length - 1].x; ty = NODES[NODES.length - 1].y; }
        else { const m = eio(clamp(f / (MOVE / HOP))); tx = lerp(NODES[k].x, NODES[k + 1].x, m); ty = lerp(NODES[k].y, NODES[k + 1].y, m); }
      }
      withT(tx, ty - 58, 1, 0, () => {
        fillRR(-38, -38, 76, 76, 38, 'rgba(11,18,48,0.85)');
        team(0, 0, TEAMS[0], 0.95);
      });
    });
    // passaporte
    const pa = eo(p(lt, 0.4, 1.0));
    withT(1050, 410 + (1 - pa) * 60, 1, 0, () => alpha(pa, () => {
      fillRR(-180, -250, 360, 500, 18, C.paper);
      fillRR(-180, -250, 360, 64, [18, 18, 0, 0], '#1f6f78');
      T('PASSAPORTE DE CERTIFICAÇÃO', 0, -226, { f: DISP, s: 15, c: C.paper });
      T('EQUIPE A', 0, -202, { s: 20, c: C.amber, ls: 3 });
      T('ÁREAS ACADÊMICAS', -150, -160, { s: 18, c: '#5b6488', al: 'left', ls: 2 });
      AREAS.forEach((ar, i) => {
        const sx = -78 + (i % 2) * 156, sy = -95 + Math.floor(i / 2) * 118;
        ring(sx, sy, 46, '#c9bd9c', 2.5, [6, 6]);
        T(ar.n, sx, sy + 62, { s: 18, c: '#5b6488' });
        const ts = acDoneAt(AREAS.indexOf(ar));
        const sp = p(lt, ts - 0.05, ts + 0.2);
        if (sp > 0) {
          withT(sx, sy, lerp(1.8, 1, eo(sp)), -0.25, () => alpha(clamp(sp * 3), () => {
            ring(0, 0, 42, ar.c, 5); ring(0, 0, 33, ar.c, 2);
            T(ar.k, 0, -4, { f: DISP, s: 20, c: ar.c });
            T('OK ✓', 0, 18, { s: 16, w: 800, c: ar.c });
          }));
        }
      });
      T('ESPORTIVOS', -150, 120, { s: 18, c: '#5b6488', al: 'left', ls: 2 });
      AREAS.forEach((ar, i) => {
        const bx = -150 + i * 78;
        fillRR(bx, 140, 66, 34, 8, lt >= spDoneAt(i) ? ar.c : '#e6dcc2');
        T(ar.k, bx + 33, 158, { s: 18, w: 800, c: lt >= spDoneAt(i) ? C.ink : '#a99d7f' });
      });
      // tempo acumulado
      let total = 0;
      for (let i = 0; i < TIMES.length; i++) {
        const s0 = HOP0 + i * HOP + MOVE, s1 = HOP0 + (i + 1) * HOP - 0.05;
        total += TIMES[i] * p(lt, s0, s1);
      }
      T('TEMPO TOTAL', -150, 212, { s: 18, c: '#5b6488', al: 'left', ls: 2 });
      T(mmss(total), 150, 212, { f: DISP, s: 26, c: C.ink, al: 'right' });
    }));
    const end = eo(p(lt, 11.7, 12));
    if (end > 0) {
      fillRR(270, 660 - end * 6, 300, 40, 20, C.ok);
      T('8 de 8 desafios concluídos', 420, 681 - end * 6, { s: 22, w: 800, c: C.ink });
    }
  }

  // ---------- cena 5: tempo e vagas ----------
  function countdownRing(x, y, r, frac, col, label, size = 64) {
    ring(x, y, r, 'rgba(154,166,214,0.18)', 14);
    ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
    ctx.strokeStyle = col; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.stroke(); ctx.lineCap = 'butt';
    T(label, x, y + 4, { f: DISP, s: size, c: col });
  }
  function sRules(lt) {
    // parte 1
    if (lt < 4.9) {
      const a = Math.min(eo(p(lt, 0, 0.4)), 1 - p(lt, 4.5, 4.9));
      alpha(a, () => {
        title('Cada desafio: até 10 minutos', 112, 1, 40);
        // sala
        fillRR(80, 200, 520, 400, 22, 'rgba(22,33,79,0.9)');
        strokeRR(80, 200, 520, 400, 22, C.line, 3);
        fillRR(586, 420, 20, 110, 4, C.amber); // porta
        T('SALA DO DESAFIO', 340, 236, { s: 24, ls: 3, c: C.dim });
        T('máximo 2 equipes por vez', 340, 566, { s: 26, c: C.amber });
        [0, 1].forEach((i) => {
          strokeRR(120 + i * 230, 290, 210, 220, 16, C.line, 2, [8, 8]);
          T('VAGA ' + (i + 1), 225 + i * 230, 320, { s: 20, c: C.dim, ls: 2 });
        });
        team(225, 420, TEAMS[0], 1.3);
        // equipe B sai quando o tempo acaba
        const exit = eio(p(lt, 3.7, 4.5));
        const bx = lerp(455, 700, exit), by = lerp(420, 475, exit);
        team(bx, by, lt > 3.5 ? C.coral : TEAMS[3], 1.3);
        T('EQUIPE B', bx, by + 56, { s: 20, c: lt > 3.5 ? C.coral : TEAMS[3], ls: 2 });
        // equipe C chega e espera
        const arr = eo(p(lt, 0.6, 1.4));
        const cx = lerp(1300, 700, arr);
        if (exit < 0.3) {
          team(cx, 330, TEAMS[2], 1.1);
          T('aguarda vaga', cx, 384, { s: 20, c: TEAMS[2], a: arr });
        }
        // cronômetro
        const cd = p(lt, 0.8, 3.5);
        const left = 600 * (1 - cd);
        const col = cd >= 1 ? C.coral : C.amber;
        countdownRing(990, 390, 150, 1 - cd, col, mmss(left), 60);
        T('EQUIPE B NO DESAFIO', 990, 590, { s: 22, ls: 3, c: C.dim, a: 1 - p(lt, 3.5, 3.6) });
        if (cd >= 1) {
          const fl = 0.6 + 0.4 * Math.sin(lt * 20);
          T('TEMPO ESGOTADO', 990, 590, { f: DISP, s: 28, c: C.coral, a: fl });
        }
      });
    }
    // parte 2
    if (lt >= 4.6) {
      const a = eo(p(lt, 4.6, 5.0)) * (1 - p(lt, 8.75, 9));
      alpha(a, () => {
        title('Não concluiu? Duas opções', 112, 1, 40);
        // opção 1
        fillRR(70, 170, 550, 470, 22, 'rgba(22,33,79,0.9)');
        T('OPÇÃO 1', 110, 214, { f: DISP, s: 28, c: C.amber, al: 'left' });
        T('Sai do espaço e espera 10 minutos', 110, 258, { s: 28, al: 'left' });
        T('antes de tentar de novo.', 110, 290, { s: 28, al: 'left' });
        const w1 = p(lt, 5.4, 8.3);
        countdownRing(345, 455, 105, 1 - w1, w1 >= 1 ? C.ok : C.amber, w1 >= 1 ? 'VOLTA!' : mmss(600 * (1 - w1)), w1 >= 1 ? 34 : 40);
        team(165, 560, C.coral, 0.9);
        // opção 2
        fillRR(660, 170, 550, 470, 22, 'rgba(22,33,79,0.9)');
        T('OPÇÃO 2', 700, 214, { f: DISP, s: 28, c: C.amber, al: 'left' });
        T('Cede a vaga: outra equipe usa o espaço', 700, 258, { s: 28, al: 'left' });
        T('e, quando o tempo dela acaba, volta.', 700, 290, { s: 28, al: 'left' });
        strokeRR(830, 350, 210, 200, 16, C.line, 2, [8, 8]);
        T('VAGA', 935, 378, { s: 20, c: C.dim, ls: 2 });
        const cin = eio(p(lt, 5.3, 6.0)), cout = eio(p(lt, 7.4, 7.9));
        const cX = cout > 0 ? lerp(935, 1160, cout) : lerp(1160, 935, cin);
        team(cX, 460, TEAMS[2], 1.1);
        const bin = eio(p(lt, 7.8, 8.5));
        team(lerp(745, 935, bin), lerp(590, 460, bin), C.coral, bin > 0.9 ? 1.1 : 0.9);
        const bar = p(lt, 6.0, 7.4);
        fillRR(850, 520, 170, 10, 5, 'rgba(154,166,214,0.25)');
        fillRR(850, 520, 170 * bar, 10, 5, TEAMS[2]);
        T(bin > 0.9 ? 'vez da Equipe B' : 'Equipe C usando a vaga', 935, 612, { s: 22, c: bin > 0.9 ? C.coral : TEAMS[2] });
      });
    }
  }

  // ---------- cena 6: conduta ----------
  function sConduct(lt) {
    title('Regras de conduta', 112, eo(p(lt, 0, 0.4)), 42);
    const cards = [
      { x: 230, t1: 'Sem celular ou', t2: 'eletrônicos', draw: (lt) => { phone(0, 0, 1.3, C.cream); cross(0, 0, eo(p(lt, 0.8, 1.1)) * 0.9); } },
      { x: 640, t1: 'Ninguém circula', t2: 'sozinho', draw: (lt) => { team(0, 0, TEAMS[0], 1.6); ring(0, 0, 62, C.amber, 3, [6, 6]); } },
      { x: 1050, t1: 'Tudo dentro da escola,', t2: 'com respeito', draw: () => school(0, 0, 1.15) },
    ];
    cards.forEach((c, i) => {
      const q = back(p(lt, 0.2 + i * 0.2, 0.7 + i * 0.2));
      withT(c.x, 330, q, 0, () => {
        fillRR(-180, -130, 360, 260, 22, 'rgba(22,33,79,0.9)');
        withT(0, -35, 1, 0, () => c.draw(lt));
        T(c.t1, 0, 66, { s: 30, w: 800 });
        T(c.t2, 0, 100, { s: 30, w: 800, c: C.amber });
      });
    });
    T('PENALIDADES · decididas pela Comissão de Organização', W / 2, 518, { s: 22, ls: 2, c: C.dim, a: eo(p(lt, 1.6, 2.0)) });
    const pen = ['Advertência oral', 'Fora de um desafio', 'Suspensão + Opção 1', 'Aluno excluído', 'Equipe excluída'];
    pen.forEach((s, i) => {
      const q = eo(p(lt, 1.9 + i * 0.25, 2.3 + i * 0.25));
      const x = 58 + i * 236;
      alpha(q, () => {
        fillRR(x, 548 + (1 - q) * 20, 220, 64, 14, `rgba(255,93,93,${0.15 + i * 0.18})`);
        T(s, x + 110, 581 + (1 - q) * 20, { s: 24, w: 800 });
        if (i < 4) T('›', x + 228, 581, { s: 30, c: C.coral });
      });
    });
  }

  // ---------- cena 7: premiação ----------
  function sAwards(lt) {
    title('21:00 · fim dos desafios', 112, eo(p(lt, 0, 0.4)), 42);
    const m = eo(p(lt, 0.3, 0.9));
    alpha(m, () => {
      medal(330, 360 + (1 - m) * -200, 1.25, Math.sin(lt * 3) * 0.08 * (1 - p(lt, 0, 4)));
      T('MEDALHA DE CONCLUSÃO', 330, 520, { f: DISP, s: 24, c: C.amber });
      T('para toda equipe que concluir', 330, 560, { s: 28 });
      T('todos os desafios', 330, 592, { s: 28 });
    });
    const pod = [
      { x: 780, h: 150, n: '2', c: TEAMS[3], tm: '01:58:47', d: 1.4 },
      { x: 950, h: 220, n: '1', c: TEAMS[0], tm: '01:52:10', d: 1.7 },
      { x: 1120, h: 110, n: '3', c: TEAMS[2], tm: '02:05:03', d: 1.1 },
    ];
    pod.forEach((b) => {
      const q = eo(p(lt, b.d, b.d + 0.5));
      const h = b.h * q;
      fillRR(b.x - 80, 600 - h, 160, h, [10, 10, 0, 0], b.c);
      if (q > 0.6) {
        T(b.n + 'º', b.x, 600 - h + 42, { f: DISP, s: 40, c: C.ink });
        T(b.tm, b.x, 600 - h + 82, { s: 22, w: 800, c: C.ink });
        team(b.x, 600 - h - 44, b.c, 0.85);
      }
      if (b.n === '1' && q >= 1) {
        const cr = back(p(lt, 2.3, 2.7));
        withT(b.x, 600 - h - 100, cr, 0, () => {
          ctx.beginPath(); ctx.moveTo(-24, 14); ctx.lineTo(-28, -12); ctx.lineTo(-12, 0); ctx.lineTo(0, -18); ctx.lineTo(12, 0); ctx.lineTo(28, -12); ctx.lineTo(24, 14); ctx.closePath();
          ctx.fillStyle = C.amber; ctx.fill();
        });
      }
    });
    fillRR(660, 600, 580, 3, 1, C.line);
    T('Campeã: menor tempo total acumulado', 950, 640, { s: 28, c: C.amber, a: eo(p(lt, 2.4, 2.9)) });
  }

  // ---------- cena 8: pizza & picolé ----------
  const POPS = (() => { const r = rng(99), a = []; const cols = ['#ff5d8f', '#ffb627', '#4ea8ff', '#2ec4b6', '#c77dff', '#ff8c42']; for (let i = 0; i < 16; i++) a.push({ x: 60 + r() * 1160, d: r() * 2.2, sp: 260 + r() * 220, rot: r() * 6, vr: (r() - 0.5) * 3, s: 0.55 + r() * 0.45, c: cols[i % cols.length] }); return a; })();
  function sFinale(lt) {
    T('E PRA FECHAR A NOITE...', W / 2, 112, { f: DISP, s: 34, a: eo(p(lt, 0, 0.4)) });
    ctx.save(); ctx.beginPath(); ctx.rect(0, 72, W, H - 72); ctx.clip();
    POPS.forEach((o) => {
      const tt = lt - 0.4 - o.d;
      if (tt <= 0) return;
      const y = -100 + ((tt * o.sp) % 920);
      popsicle(o.x, y, o.s, o.rot + tt * o.vr, o.c);
    });
    ctx.restore();
    const pz = back(p(lt, 0.4, 1.1));
    withT(W / 2, 360, pz, 0, () => pizza(0, 0, 150, lt * 0.5, eo(p(lt, 1.6, 2.2))));
    const big = back(p(lt, 1.2, 1.8));
    withT(W / 2, 590, big, 0, () => {
      fillRR(-420, -58, 840, 150, 28, 'rgba(11,18,48,0.92)');
      T('PIZZA & PICOLÉ!', 0, 0, { f: DISP, s: 76, c: C.amber });
    });
    T('Nos vemos no ENEM GAMES!', W / 2, 655, { s: 32, w: 800, a: eo(p(lt, 2.6, 3.1)) });
  }

  const SCENES = [sIntro, sOpening, sKinds, sJourney, sRules, sConduct, sAwards, sFinale];

  function render(context, t) {
    ctx = context;
    t = clamp(t, 0, DUR);
    background(t);
    const i = chapterIndex(t);
    const c = CHAPTERS[i];
    const lt = t - c.a;
    const fade = i === CHAPTERS.length - 1 ? 1 : 1 - p(t, c.b - 0.25, c.b);
    alpha(Math.min(i === 0 ? 1 : p(t, c.a, c.a + 0.2), fade), () => SCENES[i](lt));
    // flash de largada às 18h
    if (t >= 15 && t < 16.4) {
      const q = 1 - p(t, 15.6, 16.4);
      const s = back(p(t, 15, 15.4));
      alpha(q, () => withT(W / 2, H / 2, s, -0.06, () => {
        fillRR(-300, -70, 600, 140, 20, C.amber);
        T('18:00 · LARGADA!', 0, 4, { f: DISP, s: 48, c: C.ink });
      }));
    }
    hud(t);
  }

  window.EnemGames = { render, W, H, DUR, CHAPTERS };
})();
