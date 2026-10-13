/* ENEM GAMES 2026 — animação do funcionamento da noite.
   Tudo é desenhado a partir do tempo t (segundos), então qualquer quadro
   pode ser renderizado de forma determinística (player e exportação MP4).
   A lista SCENES define a ordem, a duração e os sons (cues) de cada cena. */
(function () {
  const W = 1280, H = 720;
  const DISP = '"Bungee", Impact, sans-serif';
  const BODY = '"Barlow Condensed", "Arial Narrow", sans-serif';
  const C = {
    night: '#0b1230', night2: '#16214f', panel: 'rgba(22,33,79,0.92)', line: '#2b3a7a', cream: '#f7f1e3', dim: '#9aa6d6',
    amber: '#ffb627', coral: '#ff5d5d', ink: '#141c3f', paper: '#f4ecd8', ok: '#3ddc84',
  };
  const AREAS = [
    { k: 'LIN', n: 'Linguagens', c: '#ff8c42' },
    { k: 'HUM', n: 'Humanas', c: '#c77dff' },
    { k: 'NAT', n: 'Natureza', c: '#2ec4b6' },
    { k: 'MAT', n: 'Matemática', c: '#4ea8ff' },
  ];
  // salas do evento (conforme o mapa de estandes)
  const ROOMS = [
    { id: 'POR', a: 0, n: 'Língua Portuguesa', short: 'Português', loc: 'Sala dos Professores', who: 'Renan', ic: 'book' },
    { id: 'ESP', a: 0, n: 'Espanhol', short: 'Espanhol', loc: 'Sala M12', who: 'Eloiza + Paulo', ic: 'bubble' },
    { id: 'ART', a: 0, n: 'Arte', short: 'Arte', loc: 'Sala F92', who: 'André', ic: 'palette' },
    { id: 'HG', a: 1, n: 'História e Geografia', short: 'Hist. e Geo.', loc: 'Sala M31', who: 'Castañeda', ic: 'globe' },
    { id: 'FIL', a: 1, n: 'Filosofia', short: 'Filosofia', loc: 'Sala F61', who: 'Arthur', ic: 'think' },
    { id: 'QUI', a: 2, n: 'Química', short: 'Química', loc: 'Lab. de Química', who: 'Brunão', ic: 'flask' },
    { id: 'BIO', a: 2, n: 'Biologia', short: 'Biologia', loc: 'Sala F82', who: 'Dani Sinzatto', ic: 'leaf' },
    { id: 'FIS', a: 2, n: 'Física', short: 'Física', loc: 'Sala de Arte', who: 'Kleber + Pâmela', ic: 'atom' },
    { id: 'MAT', a: 3, n: 'Matemática', short: 'Matemática', loc: 'Sala M21', who: 'Rafinha', ic: 'calc' },
  ];
  const roomsOf = (a) => ROOMS.filter((r) => r.a === a);
  const TEAMS = ['#ffb627', '#ff5d5d', '#2ec4b6', '#4ea8ff', '#c77dff', '#ff8c42', '#ff5d8f', '#a3e635'];

  let ctx;
  let G3D = false; // no modo 3D, logo, medalha, pizza e picolés são objetos 3D (stage3d.js)

  // ---------- utilidades ----------
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const p = (t, a, b) => clamp((t - a) / (b - a));
  const lerp = (a, b, x) => a + (b - a) * x;
  const eo = (x) => 1 - Math.pow(1 - x, 3);
  const eio = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const back = (x) => { const c1 = 1.9, c3 = c1 + 1; return x <= 0 ? 0 : 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
  function rng(seed) { return function () { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const mmss = (s) => { s = Math.max(0, Math.round(s)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
  const hmmss = (s) => { s = Math.max(0, Math.round(s)); return Math.floor(s / 3600) + ':' + mmss(s % 3600); };
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
    ctx.fillText(s, x, y);
    ctx.restore();
  }
  function textW(s, size, f = BODY, w = 600) { ctx.save(); ctx.font = `${w} ${size}px ${f}`; const m = ctx.measureText(s).width; ctx.restore(); return m; }
  function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
  function fillRR(x, y, w, h, r, c) { rr(x, y, w, h, r); ctx.fillStyle = c; ctx.fill(); }
  function strokeRR(x, y, w, h, r, c, lw = 2, dash) { rr(x, y, w, h, r); ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.setLineDash(dash || []); ctx.stroke(); ctx.setLineDash([]); }
  function circle(x, y, r, c) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill(); }
  function ring(x, y, r, c, lw = 2, dash) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.setLineDash(dash || []); ctx.stroke(); ctx.setLineDash([]); }
  function line(x1, y1, x2, y2, c, lw = 3, dash) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.setLineDash(dash || []); ctx.stroke(); ctx.setLineDash([]); }
  function withT(x, y, s, rot, fn) { ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot); if (s !== 1) ctx.scale(s, s); fn(); ctx.restore(); }
  function alpha(a, fn) { if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a; fn(); ctx.restore(); }
  const pop = (lt, t0, dur = 0.45) => back(p(lt, t0, t0 + dur));
  const fadeIn = (lt, t0, dur = 0.4) => eo(p(lt, t0, t0 + dur));

  // ---------- ícones ----------
  function team(x, y, col, s = 1, a = 1) { // trio
    alpha(a, () => withT(x, y, s, 0, () => {
      ring(0, 0, 28, col + '66', 2);
      for (let i = 0; i < 3; i++) { const an = -Math.PI / 2 + (i * Math.PI * 2) / 3; circle(Math.cos(an) * 13, Math.sin(an) * 13, 9, col); }
    }));
  }
  function check(x, y, s, col = C.ok) {
    if (s <= 0) return;
    withT(x, y, s, 0, () => {
      circle(0, 0, 16, col);
      ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(-2, 6); ctx.lineTo(8, -6);
      ctx.strokeStyle = C.ink; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
    });
  }
  function cross(x, y, s, col = C.coral) {
    if (s <= 0) return;
    withT(x, y, s, 0, () => {
      ctx.beginPath(); ctx.moveTo(-40, -40); ctx.lineTo(40, 40); ctx.moveTo(40, -40); ctx.lineTo(-40, 40);
      ctx.strokeStyle = col; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.stroke();
    });
  }
  function lock(x, y, s, open, col = C.cream) {
    withT(x, y, s, 0, () => {
      const lift = open * 12;
      ctx.beginPath(); ctx.arc(0, -10 - lift, 10, Math.PI, 0);
      ctx.lineTo(10, -2 - (open > 0.5 ? lift : 0));
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
  function runner(x, y, s, col) {
    withT(x, y, s, 0, () => {
      circle(8, -30, 9, col);
      ctx.strokeStyle = col; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(4, -16); ctx.lineTo(-4, 8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-4, 8); ctx.lineTo(12, 18); ctx.lineTo(8, 34); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-4, 8); ctx.lineTo(-16, 22); ctx.lineTo(-28, 20); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(2, -10); ctx.lineTo(18, -4); ctx.lineTo(24, -14); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(2, -10); ctx.lineTo(-12, -4); ctx.lineTo(-20, -14); ctx.stroke();
    });
  }
  function roomIcon(kind, x, y, s, col) {
    withT(x, y, s, 0, () => {
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      switch (kind) {
        case 'book':
          ctx.beginPath(); ctx.moveTo(0, -18); ctx.quadraticCurveTo(-18, -26, -34, -20); ctx.lineTo(-34, 22); ctx.quadraticCurveTo(-18, 16, 0, 24);
          ctx.quadraticCurveTo(18, 16, 34, 22); ctx.lineTo(34, -20); ctx.quadraticCurveTo(18, -26, 0, -18); ctx.lineTo(0, 24); ctx.stroke();
          break;
        case 'bubble':
          rr(-34, -28, 68, 44, 12); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(-14, 16); ctx.lineTo(-22, 32); ctx.lineTo(2, 16); ctx.stroke();
          T('¡Hola!', 0, -5, { s: 20, w: 800, c: col });
          break;
        case 'palette':
          ctx.beginPath(); ctx.ellipse(0, 0, 34, 26, -0.2, 0, Math.PI * 2); ctx.stroke();
          [[-16, -8, '#ff5d5d'], [0, -14, '#ffb627'], [16, -6, '#4ea8ff'], [14, 10, '#3ddc84']].forEach(([a, b, c]) => circle(a, b, 5.5, c));
          ring(-12, 12, 6, col, 3);
          break;
        case 'globe':
          ring(0, 0, 28, col, 4);
          ctx.beginPath(); ctx.ellipse(0, 0, 12, 28, 0, 0, Math.PI * 2); ctx.moveTo(-28, 0); ctx.lineTo(28, 0);
          ctx.moveTo(-24, -14); ctx.lineTo(24, -14); ctx.moveTo(-24, 14); ctx.lineTo(24, 14); ctx.lineWidth = 3; ctx.stroke();
          break;
        case 'think':
          ring(0, 0, 28, col, 4);
          T('?', 0, 3, { f: DISP, s: 34, c: col });
          break;
        case 'flask':
          ctx.beginPath(); ctx.moveTo(-9, -30); ctx.lineTo(-9, -8); ctx.lineTo(-28, 26); ctx.lineTo(28, 26); ctx.lineTo(9, -8); ctx.lineTo(9, -30); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(-14, 4); ctx.lineTo(14, 4); ctx.lineTo(24, 22); ctx.lineTo(-24, 22); ctx.closePath(); ctx.globalAlpha *= 0.6; ctx.fill();
          break;
        case 'leaf':
          ctx.beginPath(); ctx.moveTo(-26, 26); ctx.bezierCurveTo(-30, -16, 4, -30, 28, -28); ctx.bezierCurveTo(28, 4, 8, 28, -26, 26); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(-26, 26); ctx.lineTo(14, -14); ctx.stroke();
          break;
        case 'atom':
          ctx.lineWidth = 3;
          for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(0, 0, 32, 12, (i * Math.PI) / 3, 0, Math.PI * 2); ctx.stroke(); }
          circle(0, 0, 6, col);
          break;
        case 'calc':
          rr(-24, -32, 48, 64, 8); ctx.stroke();
          fillRR(-16, -24, 32, 14, 3, col);
          for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) circle(-12 + i * 12, 2 + j * 11, 3.5, col);
          break;
      }
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
      const fy = lerp(-160, 10, flap);
      ctx.beginPath(); ctx.moveTo(-110, -70); ctx.lineTo(0, fy); ctx.lineTo(110, -70); ctx.closePath();
      ctx.fillStyle = flap > 0.5 ? '#e8dcbc' : '#efe4c8'; ctx.fill(); ctx.strokeStyle = '#d7c9a6'; ctx.stroke();
      if (flap > 0.95) { circle(0, 6, 16, C.coral); T('G9', 0, 7, { f: DISP, s: 13, c: C.paper }); }
    });
  }
  function clockIcon(x, y, s, col, h = 0) {
    withT(x, y, s, 0, () => {
      ring(0, 0, 30, col, 5);
      ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -20); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(h) * 14, Math.sin(h) * 14); ctx.stroke();
    });
  }
  function boardIcon(x, y, s, col) {
    withT(x, y, s, 0, () => {
      strokeRR(-34, -30, 68, 44, 4, col, 4);
      line(-20, 2, -6, -10, col, 4); line(-6, -10, 6, -2, col, 4); line(6, -2, 20, -16, col, 4);
      line(0, 14, -16, 36, col, 4); line(0, 14, 16, 36, col, 4);
    });
  }
  function diceIcon(x, y, s, col, rot = 0) {
    withT(x, y, s, rot, () => {
      strokeRR(-26, -26, 52, 52, 10, col, 4);
      [[-12, -12], [12, -12], [0, 0], [-12, 12], [12, 12]].forEach(([a, b]) => circle(a, b, 5, col));
    });
  }
  function clipIcon(x, y, s, col) {
    withT(x, y, s, 0, () => {
      strokeRR(-24, -30, 48, 62, 6, col, 4);
      fillRR(-12, -36, 24, 12, 4, col);
      for (let i = 0; i < 3; i++) { line(-12, -10 + i * 14, -6, -4 + i * 14, col, 3); line(-6, -4 + i * 14, 0, -14 + i * 14, col, 3); line(4, -8 + i * 14, 14, -8 + i * 14, col, 3); }
    });
  }
  function flagIcon(x, y, s, wave = 0) {
    withT(x, y, s, 0, () => {
      fillRR(-30, -34, 5, 72, 2, C.cream);
      const cw = 12, rows = 4, cols = 5;
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
        const yo = Math.sin(wave + i * 0.8) * 3;
        ctx.fillStyle = (i + j) % 2 ? C.cream : C.ink;
        ctx.fillRect(-25 + i * cw, -34 + j * cw + yo, cw, cw);
      }
    });
  }
  function medal(x, y, s, swing) {
    withT(x, y, s, swing, () => {
      ctx.beginPath(); ctx.moveTo(-46, -150); ctx.lineTo(-10, -40); ctx.lineTo(10, -40); ctx.lineTo(-20, -150); ctx.closePath(); ctx.fillStyle = C.coral; ctx.fill();
      ctx.beginPath(); ctx.moveTo(46, -150); ctx.lineTo(10, -40); ctx.lineTo(-10, -40); ctx.lineTo(20, -150); ctx.closePath(); ctx.fillStyle = '#4ea8ff'; ctx.fill();
      circle(0, 10, 62, '#e09a12'); circle(0, 10, 52, C.amber);
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
        const a0 = (i * Math.PI) / 4, a1 = a0 + Math.PI / 4, mid = (a0 + a1) / 2;
        const off = i === 1 ? popped * r * 0.28 : 0;
        ctx.save(); ctx.translate(Math.cos(mid) * off, Math.sin(mid) * off);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r, a0, a1); ctx.closePath(); ctx.fillStyle = '#d98b2b'; ctx.fill();
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r * 0.86, a0, a1); ctx.closePath(); ctx.fillStyle = '#ffd166'; ctx.fill();
        ctx.strokeStyle = '#e8b04b'; ctx.lineWidth = 3; ctx.stroke();
        ctx.save(); ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r * 0.86, a0, a1); ctx.closePath(); ctx.clip();
        PEPS.forEach(([px, py]) => circle(px * r, py * r, r * 0.1, '#d64045'));
        ctx.restore(); ctx.restore();
      }
      PEPS.slice(0, 5).forEach(([px, py]) => circle(-py * r * 0.9, px * r * 0.9, r * 0.035, '#3a7d44'));
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
  function bulletText(lines, x, y, lt, t0, gap, step, size = 32) {
    lines.forEach((ln, i) => {
      const q = fadeIn(lt, t0 + i * step, 0.5);
      alpha(q, () => {
        circle(x + 10, y + i * gap, 7, ln.c || C.amber);
        T(ln.t, x + 34 - (1 - q) * 20, y + i * gap, { s: size, al: 'left', w: 600, c: C.cream });
      });
    });
  }

  // ---------- fundo ----------
  const STARS = (() => { const r = rng(42), a = []; for (let i = 0; i < 70; i++) a.push([r() * W, r() * H, r() * 1.6 + 0.4, r() * 6]); return a; })();
  function background(t) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, C.night); g.addColorStop(1, C.night2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    STARS.forEach(([x, y, r, ph]) => circle(x, y, r, `rgba(247,241,227,${0.12 + 0.18 * (0.5 + 0.5 * Math.sin(t * 1.3 + ph))})`));
    ctx.strokeStyle = 'rgba(140,160,255,0.07)'; ctx.lineWidth = 3;
    ctx.strokeRect(36, 76, W - 72, H - 112);
    ctx.beginPath(); ctx.moveTo(W / 2, 76); ctx.lineTo(W / 2, H - 36); ctx.stroke();
    ring(W / 2, (H + 40) / 2, 120, 'rgba(140,160,255,0.07)', 3);
  }
  function title(s, y, a = 1, size = 44, col = C.cream) { T(s, W / 2, y, { f: DISP, s: size, c: col, a }); }
  function sub(s, y, a = 1, col = C.dim, size = 28) { T(s, W / 2, y, { s: size, c: col, a }); }

  // ================= CENAS =================

  // 1. abertura do vídeo
  function wordDrop(word, cx, y, size, col, t0, lt, stagger = 0.1) {
    ctx.font = `400 ${size}px ${DISP}`;
    const ws = [...word].map((ch) => ctx.measureText(ch).width);
    let x = cx - ws.reduce((a, b) => a + b, 0) / 2;
    [...word].forEach((ch, i) => {
      const q = back(p(lt, t0 + i * stagger, t0 + i * stagger + 0.55));
      T(ch, x + ws[i] / 2, y - (1 - q) * 260, { f: DISP, s: size, c: col, a: clamp(q * 2) });
      x += ws[i];
    });
  }
  function sIntro(lt) {
    alpha(fadeIn(lt, 0.2, 1.2), () => {
      roomIcon('calc', 240, 250 + Math.sin(lt * 2) * 8, 1.5, AREAS[3].c);
      roomIcon('flask', 1040, 250 + Math.cos(lt * 2) * 8, 1.5, AREAS[2].c);
      roomIcon('bubble', 230, 520 + Math.sin(lt * 1.7) * 6, 1.3, AREAS[0].c);
      ball(1050, 520 + Math.cos(lt * 1.6) * 6, 36, AREAS[1].c, lt * 0.8);
    });
    if (!G3D) {
      wordDrop('ENEM', W / 2, 290, 150, C.cream, 0.1, lt);
      const g = back(p(lt, 0.8, 1.5));
      withT(W / 2, 430, lerp(0.3, 1, g), 0, () => T('GAMES', 0, 0, { f: DISP, s: 120, c: C.amber, a: clamp(g * 2) }));
    }
    T('Como vai funcionar a nossa noite', W / 2, 535, { s: 40, w: 600, a: fadeIn(lt, 1.8, 0.6) });
    alpha(fadeIn(lt, 2.6, 0.5), () => {
      fillRR(W / 2 - 190, 580, 380, 48, 24, C.line);
      T('18h às 22h30 · Curso G9', W / 2, 605, { s: 28, c: C.cream, ls: 1 });
    });
  }

  // 2. cronograma de abertura (18h → 18h30)
  const OPEN_STEPS = [
    { h: '18h00', t: 'Início', d: 'Às 18h, todo mundo na escola.', ic: (x, y, c, lt) => clockIcon(x, y, 1, c, lt * 0.5) },
    { h: '', t: 'Explicação da dinâmica', d: 'Explicamos todas as regras do ENEM GAMES.', ic: (x, y, c) => boardIcon(x, y, 1, c) },
    { h: '', t: 'Sorteio das equipes', d: 'As equipes são sorteadas: trios.', ic: (x, y, c, lt) => diceIcon(x, y, 1, c, Math.sin(lt * 3) * 0.2) },
    { h: '', t: 'Preparação', d: 'Celulares recolhidos e tudo pronto para começar.', ic: (x, y, c) => clipIcon(x, y, 1, c) },
    { h: '18h30', t: 'Largada!', d: 'As equipes começam a escolher o itinerário.', ic: (x, y, c, lt) => flagIcon(x + 4, y, 0.9, lt * 4) },
  ];
  const OPEN_T0 = 0.8, OPEN_STEP = 2.6;
  function sOpening(lt) {
    title('Abertura · 18h às 18h30', 112, fadeIn(lt, 0), 40);
    const xs = OPEN_STEPS.map((_, i) => 168 + i * 236);
    const prog = clamp((lt - OPEN_T0) / (OPEN_STEP * (OPEN_STEPS.length - 1)));
    alpha(fadeIn(lt, 0.2), () => {
      line(xs[0], 300, xs[xs.length - 1], 300, C.line, 6);
      line(xs[0], 300, lerp(xs[0], xs[xs.length - 1], eio(prog)), 300, C.amber, 6);
    });
    let active = -1;
    OPEN_STEPS.forEach((s, i) => {
      const t0 = OPEN_T0 + i * OPEN_STEP;
      const on = lt >= t0;
      if (on) active = i;
      const q = pop(lt, 0.2 + i * 0.12);
      withT(xs[i], 300, q, 0, () => {
        const cur = on && (i === OPEN_STEPS.length - 1 || lt < t0 + OPEN_STEP);
        fillRR(-104, -110, 208, 220, 20, cur ? C.amber : on ? C.night2 : 'rgba(22,33,79,0.6)');
        strokeRR(-104, -110, 208, 220, 20, on ? C.amber : C.line, 3);
        const ic = cur ? C.ink : on ? C.amber : C.dim;
        s.ic(0, -40, ic, lt);
        if (s.h) T(s.h, 0, 26, { f: DISP, s: 26, c: ic });
        const words = s.t.split(' ');
        if (s.t.length > 12) {
          const mid = Math.ceil(words.length / 2);
          T(words.slice(0, mid).join(' '), 0, 34, { s: 27, w: 800, c: cur ? C.ink : C.cream });
          T(words.slice(mid).join(' '), 0, 64, { s: 27, w: 800, c: cur ? C.ink : C.cream });
        } else T(s.t, 0, s.h ? 64 : 44, { s: 28, w: 800, c: cur ? C.ink : C.cream });
        if (on && !cur) check(84, -90, 0.8);
      });
    });
    if (active >= 0) {
      const a = fadeIn(lt, OPEN_T0 + active * OPEN_STEP, 0.4);
      alpha(a, () => {
        fillRR(140, 500, 1000, 90, 45, C.panel);
        T(OPEN_STEPS[active].d, W / 2, 545 + (1 - a) * 10, { s: 38, w: 600 });
      });
    }
  }
  const openingClock = (lt) => 1080 + 30 * clamp((lt - OPEN_T0) / (OPEN_STEP * (OPEN_STEPS.length - 1)));

  // 3. equipes em trios
  const TRIO_POS = [];
  for (let j = 0; j < 2; j++) for (let i = 0; i < 4; i++) TRIO_POS.push([250 + i * 260, 300 + j * 160]);
  const SORT = (() => {
    const r = rng(11), dots = [];
    for (let i = 0; i < 24; i++) dots.push({ x: 160 + r() * 960, y: 230 + r() * 300, ph: r() * 6, sp: 0.6 + r() * 0.8, delay: r() * 0.6 });
    const order = dots.map((_, i) => i).sort(() => r() - 0.5);
    order.forEach((di, k) => { dots[di].team = Math.floor(k / 3); dots[di].slot = k % 3; });
    return dots;
  })();
  function sTrios(lt) {
    title('Equipes em trios', 112, fadeIn(lt, 0), 44);
    sub('sorteadas na abertura', 160, fadeIn(lt, 0.3));
    SORT.forEach((d) => {
      const shuffle = p(lt, 0.4, 1.4) * (1 - p(lt, 2.4, 3.0));
      const jx = Math.sin(lt * 6 * d.sp + d.ph) * 40 * shuffle, jy = Math.cos(lt * 5 * d.sp + d.ph) * 30 * shuffle;
      const go = eio(p(lt, 2.2 + d.delay, 3.3 + d.delay));
      const [cx, cy] = TRIO_POS[d.team];
      const an = -Math.PI / 2 + (d.slot * Math.PI * 2) / 3;
      circle(lerp(d.x + jx, cx + Math.cos(an) * 13, go), lerp(d.y + jy, cy + Math.sin(an) * 13, go), 9, go > 0.6 ? TEAMS[d.team] : C.dim);
    });
    TRIO_POS.forEach(([x, y], i) => {
      const q = fadeIn(lt, 3.6 + i * 0.07);
      ring(x, y, 28, TEAMS[i] + '66', 2 * q);
      T('EQUIPE ' + (i + 1), x, y + 50, { s: 22, c: TEAMS[i], a: q, ls: 2 });
    });
    alpha(fadeIn(lt, 4.6), () => {
      fillRR(240, 580, 800, 64, 32, C.amber);
      T('O trio anda sempre junto. Ninguém circula sozinho.', W / 2, 612, { s: 32, w: 800, c: C.ink });
    });
  }

  // 4. celulares
  function sPhones(lt) {
    title('Celulares no envelope', 112, fadeIn(lt, 0), 44);
    sub('é proibido usar celular ou qualquer eletrônico durante as provas', 162, fadeIn(lt, 0.3));
    const flap = eio(p(lt, 2.4, 2.8));
    envelope(W / 2, 400, 1.2, flap);
    if (flap < 0.6) for (let i = 0; i < 4; i++) {
      const f = eio(p(lt, 0.8 + i * 0.2, 1.5 + i * 0.2));
      phone(W / 2 - 75 + i * 50, lerp(220, 400, f), 0.8, TEAMS[i], (1 - f) * (i % 2 ? 0.6 : -0.6));
    }
    if (flap >= 0.6) envelope(W / 2, 400, 1.2, flap);
    alpha(fadeIn(lt, 3.2), () => {
      fillRR(270, 570, 740, 64, 32, C.panel);
      T('Recolhidos no início · devolvidos no encerramento', W / 2, 602, { s: 32, w: 600 });
    });
  }

  // 5. passaporte digital
  const APP_W = 330, APP_H = 540;
  function appScreen(x, y, lt, events, opts = {}) {
    // celular com o app do passaporte; events: [{t, room, dur}] validações
    const w = APP_W, h = APP_H;
    withT(x, y, 1, 0, () => {
      fillRR(-w / 2 - 12, -h / 2 - 12, w + 24, h + 24, 42, '#05081a');
      fillRR(-w / 2, -h / 2, w, h, 32, C.paper);
      fillRR(-w / 2, -h / 2, w, 92, [32, 32, 0, 0], '#1f6f78');
      T('PASSAPORTE DIGITAL', 0, -h / 2 + 34, { f: DISP, s: 16, c: C.paper });
      T(opts.team || 'Equipe 7 · trio', 0, -h / 2 + 64, { s: 20, c: C.amber, ls: 2 });
      const done = new Set(events.filter((e) => lt >= e.t).map((e) => e.room));
      AREAS.forEach((ar, ai) => {
        const ry = -h / 2 + 130 + ai * 82;
        T(ar.n.toUpperCase(), -w / 2 + 22, ry, { s: 18, c: '#5b6488', al: 'left', ls: 2, w: 700 });
        roomsOf(ai).forEach((rm, k) => {
          const bx = -w / 2 + 22 + k * 76, by = ry + 14;
          const ev = events.find((e) => e.room === rm.id);
          const on = done.has(rm.id);
          fillRR(bx, by, 68, 30, 8, on ? ar.c : '#e6dcc2');
          T(rm.id, bx + 34, by + 16, { s: 18, w: 800, c: on ? C.ink : '#a99d7f' });
          if (on) check(bx + 64, by + 2, pop(lt, ev.t, 0.35) * 0.55);
        });
        const all = roomsOf(ai).every((rm) => done.has(rm.id));
        const sp = events.find((e) => e.room === 'SP-' + ar.k);
        const spDone = sp && lt >= sp.t;
        const sx = w / 2 - 40, sy = ry + 29;
        circle(sx, sy, 18, spDone ? ar.c : all ? '#ffffff' : '#e6dcc2');
        if (all) ball(sx, sy, 11, spDone ? C.ink : ar.c);
        else withT(sx, sy + 2, 0.5, 0, () => lock(0, 0, 1, 0, '#a99d7f'));
      });
      let total = 0;
      events.forEach((e) => { if (e.dur) total += e.dur * p(lt, e.t - (e.span || 0.6), e.t); });
      line(-w / 2 + 22, h / 2 - 70, w / 2 - 22, h / 2 - 70, '#d7c9a6', 2);
      T('TEMPO TOTAL', -w / 2 + 22, h / 2 - 38, { s: 18, c: '#5b6488', al: 'left', ls: 2, w: 700 });
      T(hmmss(total), w / 2 - 22, h / 2 - 38, { f: DISP, s: 24, c: C.ink, al: 'right' });
      // aviso de validação
      const toast = opts.toast || 1.2;
      const last = events.filter((e) => lt >= e.t).pop();
      if (last && lt < last.t + toast) {
        const a = Math.min(fadeIn(lt, last.t, 0.2), 1 - p(lt, last.t + toast - 0.25, last.t + toast));
        alpha(a, () => {
          fillRR(-w / 2 + 14, -h / 2 + 100, w - 28, 44, 12, C.ink);
          const rm = ROOMS.find((r) => r.id === last.room);
          const label = rm ? rm.short : 'Esporte ' + AREAS.find((ar) => 'SP-' + ar.k === last.room).k;
          T('✓ ' + label + ' validado', 0, -h / 2 + 123, { s: 22, w: 800, c: C.ok });
        });
      }
    });
  }
  const PASS_EVENTS = [
    { t: 6.4, room: 'MAT', dur: 452 },
    { t: 7.6, room: 'QUI', dur: 397 },
    { t: 8.8, room: 'BIO', dur: 512 },
    { t: 10.0, room: 'FIS', dur: 344 },
  ];
  function sPassport(lt) {
    T('PASSAPORTE DIGITAL', 80, 130, { f: DISP, s: 42, al: 'left', a: fadeIn(lt, 0) });
    T('nada de papel: agora o passaporte é um aplicativo', 82, 178, { s: 28, al: 'left', c: C.dim, a: fadeIn(lt, 0.3) });
    bulletText([
      { t: 'A Organização controla o passaporte no app.' },
      { t: 'Concluiu uma sala? A validação é registrada.' },
      { t: 'Validou as salas da área: libera o esporte.' },
      { t: 'O app soma o tempo total da equipe.' },
    ], 80, 260, lt, 1.0, 66, 1.4, 31);
    alpha(fadeIn(lt, 7.0), () => {
      fillRR(80, 540, 580, 110, 20, C.panel);
      T('ORGANIZAÇÃO', 110, 575, { s: 22, c: C.amber, al: 'left', ls: 3, w: 700 });
      T('Carol · Renato · Bibi', 110, 617, { f: DISP, s: 28, al: 'left' });
    });
    const a = fadeIn(lt, 0.5, 0.6);
    alpha(a, () => appScreen(960, 400 + (1 - a) * 60, lt, PASS_EVENTS));
    PASS_EVENTS.forEach((e) => { // toque de validação
      const q = p(lt, e.t - 0.35, e.t + 0.2);
      if (q > 0 && q < 1) {
        const rm = ROOMS.find((r) => r.id === e.room);
        const k = roomsOf(rm.a).indexOf(rm);
        const bx = 960 - APP_W / 2 + 22 + k * 76 + 34, by = 400 - APP_H / 2 + 130 + rm.a * 82 + 29;
        ring(bx, by, 10 + q * 26, `rgba(255,182,39,${1 - q})`, 4);
      }
    });
  }

  // 6. áreas e salas — visão geral
  function sAreas(lt) {
    title('4 áreas · 9 salas', 112, fadeIn(lt, 0), 44);
    sub('algumas áreas têm mais de uma sala de desafio', 160, fadeIn(lt, 0.3));
    AREAS.forEach((ar, ai) => {
      const x = 205 + ai * 290;
      withT(x, 222, pop(lt, 0.4 + ai * 0.2), 0, () => T(ar.n.toUpperCase(), 0, 0, { f: DISP, s: 26, c: ar.c }));
      const rms = roomsOf(ai);
      rms.forEach((rm, k) => {
        withT(x, 284 + k * 70, pop(lt, 1.0 + ai * 0.35 + k * 0.18), 0, () => {
          fillRR(-125, -28, 250, 56, 14, ar.c);
          T(rm.n, 0, 2, { s: rm.n.length > 16 ? 24 : 28, w: 800, c: C.ink });
        });
      });
      T(rms.length + (rms.length > 1 ? ' salas' : ' sala'), x, 284 + 3 * 70 - 8, { s: 26, c: C.dim, a: fadeIn(lt, 2.6 + ai * 0.15) });
    });
    alpha(fadeIn(lt, 3.8), () => {
      fillRR(190, 570, 900, 64, 32, C.amber);
      T('Ordem livre: cada equipe monta o próprio itinerário', W / 2, 602, { s: 32, w: 800, c: C.ink });
    });
  }

  // 7-10. detalhe de cada área
  function sArea(ai) {
    return function (lt) {
      const ar = AREAS[ai];
      const rms = roomsOf(ai);
      T('ÁREA', W / 2, 98, { s: 22, c: C.dim, ls: 6, a: fadeIn(lt, 0) });
      title(ar.n, 140, fadeIn(lt, 0.1), 48, ar.c);
      const n = rms.length;
      const cw = n === 3 ? 350 : n === 2 ? 380 : 440, gap = 34;
      const x0 = W / 2 - (n * cw + (n - 1) * gap) / 2;
      rms.forEach((rm, k) => {
        const cx = x0 + k * (cw + gap) + cw / 2;
        withT(cx, 370, pop(lt, 0.5 + k * 0.45, 0.5), 0, () => {
          fillRR(-cw / 2, -170, cw, 340, 22, C.panel);
          fillRR(-cw / 2, -170, cw, 120, [22, 22, 0, 0], ar.c);
          roomIcon(rm.ic, -cw / 2 + 62, -110, 1, C.ink);
          if (rm.n.length > 12) {
            const parts = rm.n.split(' ');
            const mid = Math.ceil(parts.length / 2);
            T(parts.slice(0, mid).join(' '), -cw / 2 + 112, -128, { s: 32, w: 800, c: C.ink, al: 'left' });
            T(parts.slice(mid).join(' '), -cw / 2 + 112, -94, { s: 32, w: 800, c: C.ink, al: 'left' });
          } else T(rm.n, -cw / 2 + 112, -110, { s: 38, w: 800, c: C.ink, al: 'left' });
          T('LOCAL', -cw / 2 + 30, -14, { s: 20, c: C.dim, al: 'left', ls: 3 });
          T(rm.loc, -cw / 2 + 30, 26, { s: rm.loc.length > 16 ? 34 : 40, w: 800, al: 'left', c: C.amber });
          T('PROFESSOR', -cw / 2 + 30, 82, { s: 20, c: C.dim, al: 'left', ls: 3 });
          T(rm.who, -cw / 2 + 30, 120, { s: 36, w: 800, al: 'left' });
        });
      });
      alpha(fadeIn(lt, 1.0 + n * 0.45), () => {
        const msg = n > 1 ? `Concluiu as ${n} salas? Libera o Esporte · ${ar.n}` : `Concluiu a sala? Libera o Esporte · ${ar.n}`;
        const tw = textW(msg, 30, BODY, 800) + 110;
        fillRR(W / 2 - tw / 2, 580, tw, 60, 30, C.night2);
        strokeRR(W / 2 - tw / 2, 580, tw, 60, 30, ar.c, 2);
        ball(W / 2 - tw / 2 + 40, 610, 15, ar.c, lt);
        T(msg, W / 2 + 22, 611, { s: 30, w: 800 });
      });
    };
  }

  // 11. desafios esportivos
  function sSports(lt) {
    title('Desafios esportivos', 112, fadeIn(lt, 0), 44);
    sub('um por área, com a equipe de Educação Física', 160, fadeIn(lt, 0.3));
    alpha(fadeIn(lt, 0.6), () => {
      fillRR(70, 210, 330, 330, 22, C.panel);
      runner(235, 278, 1.3, '#2ec4b6');
      T('ED. FÍSICA', 235, 350, { s: 22, c: '#2ec4b6', ls: 3, w: 700 });
      ['Valência', 'Alex', 'Matheus Maciel'].forEach((nm, i) => T(nm, 235, 398 + i * 44, { s: 32, w: 800, a: fadeIn(lt, 1.0 + i * 0.2) }));
    });
    const unlockAt = [6.6, 7.6, 5.0, 3.4];
    const roomDone = { MAT: 2.8, QUI: 3.8, BIO: 4.2, FIS: 4.6, HG: 6.9, FIL: 7.2, POR: 5.6, ESP: 5.9, ART: 6.2 };
    AREAS.forEach((ar, ai) => {
      const x = 640 + (ai % 2) * 390, y = 290 + Math.floor(ai / 2) * 170;
      const ul = eo(p(lt, unlockAt[ai], unlockAt[ai] + 0.4));
      withT(x, y, pop(lt, 0.8 + ai * 0.15), 0, () => {
        fillRR(-180, -70, 360, 140, 20, ul > 0.5 ? ar.c + '33' : 'rgba(22,33,79,0.9)');
        strokeRR(-180, -70, 360, 140, 20, ul > 0.5 ? ar.c : C.line, 3, ul > 0.5 ? null : [7, 7]);
        ball(-130, -12, 24, ul > 0.5 ? ar.c : C.dim, lt * ul);
        T('Esporte', -92, -34, { s: 22, al: 'left', c: C.dim });
        T(ar.n, -92, -4, { s: 32, w: 800, al: 'left', c: ul > 0.5 ? ar.c : C.cream });
        withT(150, -40, 0.7, 0, () => lock(0, 0, 1, ul, ul > 0.5 ? C.ok : C.dim));
        roomsOf(ai).forEach((rm, k) => {
          const d = lt >= roomDone[rm.id];
          fillRR(-92 + k * 76, 26, 68, 28, 8, d ? ar.c : 'rgba(154,166,214,0.18)');
          T(rm.id, -92 + k * 76 + 34, 41, { s: 18, w: 800, c: d ? C.ink : C.dim });
        });
      });
    });
    alpha(fadeIn(lt, 2.0), () => {
      fillRR(70, 580, 1140, 64, 32, C.amber);
      T('Só libera depois que a equipe conclui TODAS as salas da área', W / 2, 612, { s: 32, w: 800, c: C.ink });
    });
  }

  // 12. tempo e vagas
  function countdownRing(x, y, r, frac, col, label, size = 64) {
    ring(x, y, r, 'rgba(154,166,214,0.18)', 14);
    ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
    ctx.strokeStyle = col; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.stroke(); ctx.lineCap = 'butt';
    T(label, x, y + 4, { f: DISP, s: size, c: col });
  }
  function sTimer(lt) {
    title('Cada sala: até 10 minutos', 112, fadeIn(lt, 0), 42);
    alpha(fadeIn(lt, 0.3), () => {
      fillRR(80, 180, 540, 430, 22, C.panel);
      strokeRR(80, 180, 540, 430, 22, C.line, 3);
      fillRR(606, 420, 20, 110, 4, C.amber);
      T('SALA M21 · MATEMÁTICA', 350, 218, { s: 24, ls: 3, c: C.dim });
      [0, 1].forEach((i) => {
        strokeRR(120 + i * 240, 260, 220, 230, 16, C.line, 2, [8, 8]);
        T('VAGA ' + (i + 1), 230 + i * 240, 290, { s: 20, c: C.dim, ls: 2 });
      });
      team(230, 390, TEAMS[0], 1.4);
      T('EQUIPE 1', 230, 450, { s: 20, c: TEAMS[0], ls: 2 });
      const exit = eio(p(lt, 6.0, 7.0));
      const out = lt > 5.6;
      const bx = lerp(470, 720, exit), by = lerp(390, 470, exit);
      team(bx, by, out ? C.coral : TEAMS[3], 1.4);
      T('EQUIPE 2', bx, by + 60, { s: 20, c: out ? C.coral : TEAMS[3], ls: 2 });
      const arr = eo(p(lt, 1.6, 2.5));
      const cx = lerp(1330, 720, arr);
      if (exit < 0.3) { team(cx, 300, TEAMS[2], 1.2); T('EQUIPE 3 aguarda', cx, 352, { s: 20, c: TEAMS[2], a: arr }); }
      alpha(fadeIn(lt, 1.0), () => {
        fillRR(150, 520, 400, 56, 28, C.amber);
        T('No máximo 2 equipes por sala', 350, 549, { s: 28, w: 800, c: C.ink });
      });
    });
    const cd = p(lt, 1.6, 5.6);
    const col = cd >= 1 ? C.coral : C.amber;
    alpha(fadeIn(lt, 0.6), () => countdownRing(990, 380, 150, 1 - cd, col, mmss(600 * (1 - cd)), 60));
    T('EQUIPE 2 NO DESAFIO', 990, 580, { s: 24, ls: 3, c: C.dim, a: fadeIn(lt, 0.8) * (1 - p(lt, 5.6, 5.7)) });
    if (cd >= 1) T('TEMPO ESGOTADO', 990, 580, { f: DISP, s: 30, c: C.coral, a: 0.6 + 0.4 * Math.sin(lt * 14) });
  }

  // 13. não concluiu: duas opções
  function sOptions(lt) {
    title('Não concluiu em 10 min? Duas opções', 112, fadeIn(lt, 0), 38);
    alpha(fadeIn(lt, 0.4), () => {
      fillRR(70, 170, 550, 480, 22, C.panel);
      T('OPÇÃO 1', 110, 214, { f: DISP, s: 30, c: C.amber, al: 'left' });
      T('Sai da sala e espera 10 minutos', 110, 262, { s: 31, al: 'left' });
      T('antes de tentar de novo.', 110, 298, { s: 31, al: 'left' });
      const w1 = p(lt, 2.2, 7.6);
      countdownRing(345, 470, 105, 1 - w1, w1 >= 1 ? C.ok : C.amber, w1 >= 1 ? 'VOLTA!' : mmss(600 * (1 - w1)), w1 >= 1 ? 34 : 40);
      team(160, 590, C.coral, 0.9);
    });
    alpha(fadeIn(lt, 1.2), () => {
      fillRR(660, 170, 550, 480, 22, C.panel);
      T('OPÇÃO 2', 700, 214, { f: DISP, s: 30, c: C.amber, al: 'left' });
      T('Cede a vaga: espera outra equipe usar', 700, 262, { s: 31, al: 'left' });
      T('a sala e, quando o tempo dela acabar, volta.', 700, 298, { s: 31, al: 'left' });
      strokeRR(830, 360, 210, 200, 16, C.line, 2, [8, 8]);
      T('VAGA', 935, 388, { s: 20, c: C.dim, ls: 2 });
      const cin = eio(p(lt, 2.6, 3.4)), cout = eio(p(lt, 6.4, 7.0));
      team(cout > 0 ? lerp(935, 1170, cout) : lerp(1170, 935, cin), 470, TEAMS[2], 1.1);
      const bin = eio(p(lt, 6.9, 7.7));
      team(lerp(745, 935, bin), lerp(600, 470, bin), C.coral, bin > 0.9 ? 1.1 : 0.9);
      const bar = p(lt, 3.4, 6.4);
      fillRR(850, 530, 170, 10, 5, 'rgba(154,166,214,0.25)');
      fillRR(850, 530, 170 * bar, 10, 5, TEAMS[2]);
      T(bin > 0.9 ? 'vez da Equipe 2' : 'Equipe 3 usando a vaga', 935, 618, { s: 24, c: bin > 0.9 ? C.coral : TEAMS[2] });
    });
  }

  // 14. conduta
  function sConduct(lt) {
    title('Regras de conduta', 112, fadeIn(lt, 0), 42);
    const cards = [
      { x: 230, t1: 'Sem celular ou', t2: 'eletrônicos', draw: () => { phone(0, 0, 1.3, C.cream); cross(0, 0, eo(p(lt, 1.0, 1.3)) * 0.9); } },
      { x: 640, t1: 'Trio sempre', t2: 'completo', draw: () => { team(0, 0, TEAMS[0], 1.7); ring(0, 0, 62, C.amber, 3, [6, 6]); } },
      { x: 1050, t1: 'Só dentro da escola,', t2: 'com respeito', draw: () => school(0, 0, 1.15) },
    ];
    cards.forEach((c, i) => {
      withT(c.x, 320, pop(lt, 0.3 + i * 0.4, 0.5), 0, () => {
        fillRR(-185, -130, 370, 260, 22, C.panel);
        withT(0, -35, 1, 0, c.draw);
        T(c.t1, 0, 66, { s: 32, w: 800 });
        T(c.t2, 0, 102, { s: 32, w: 800, c: C.amber });
      });
    });
    T('PENALIDADES · decididas pela Comissão de Organização', W / 2, 512, { s: 24, ls: 2, c: C.dim, a: fadeIn(lt, 3.0) });
    const pen = ['Advertência oral', 'Fora de um desafio', 'Suspensão + Opção 1', 'Aluno excluído', 'Equipe excluída'];
    pen.forEach((s, i) => {
      const q = fadeIn(lt, 3.4 + i * 0.45, 0.4);
      const x = 58 + i * 236;
      alpha(q, () => {
        fillRR(x, 548 + (1 - q) * 20, 220, 70, 14, `rgba(255,93,93,${0.15 + i * 0.18})`);
        T(s, x + 110, 584 + (1 - q) * 20, { s: 26, w: 800 });
        if (i < 4) T('›', x + 228, 584, { s: 30, c: C.coral });
      });
    });
  }

  // 15. a jornada de uma equipe (18h30 → 21h)
  const NODES = [
    { x: 450, y: 420, id: 'START' },
    { x: 610, y: 540, id: 'MAT' },
    { x: 770, y: 590, id: 'SP-MAT', a: 3 },
    { x: 560, y: 250, id: 'HG' },
    { x: 730, y: 270, id: 'FIL' },
    { x: 650, y: 400, id: 'SP-HUM', a: 1 },
    { x: 300, y: 235, id: 'ESP' },
    { x: 140, y: 250, id: 'POR' },
    { x: 190, y: 370, id: 'ART' },
    { x: 330, y: 340, id: 'SP-LIN', a: 0 },
    { x: 120, y: 490, id: 'QUI' },
    { x: 230, y: 590, id: 'BIO' },
    { x: 380, y: 570, id: 'FIS' },
    { x: 290, y: 470, id: 'SP-NAT', a: 2 },
  ];
  const J0 = 1.4, JH = 1.0, JM = 0.45;
  const JTIMES = [452, 333, 520, 365, 410, 488, 301, 540, 397, 512, 344, 377, 425];
  const JOURNEY_EVENTS = NODES.slice(1).map((n, i) => ({ t: J0 + (i + 1) * JH - 0.05, room: n.id, dur: JTIMES[i], span: JH - JM - 0.05 }));
  const J_END = J0 + 13 * JH;
  function sJourney(lt) {
    T('UMA NOITE DE EXEMPLO', 60, 112, { f: DISP, s: 34, al: 'left', a: fadeIn(lt, 0) });
    T('a Equipe 7 escolhe seu caminho; a Organização valida no app', 62, 150, { s: 24, al: 'left', c: C.dim, a: fadeIn(lt, 0.2) });
    const k = Math.floor((lt - J0) / JH), f = (lt - J0) / JH - k;
    const doneT = (i) => J0 + i * JH - 0.05;
    const areaDone = (a) => Math.max(...NODES.map((n, i) => { const rm = ROOMS.find((r) => r.id === n.id); return rm && rm.a === a ? doneT(i) : -1; }));
    alpha(fadeIn(lt, 0.2, 0.6), () => {
      [['LINGUAGENS', 220, 190, 0], ['HUMANAS', 645, 200, 1], ['NATUREZA', 110, 650, 2], ['MATEMÁTICA', 690, 655, 3]].forEach(([s, x, y, a]) => T(s, x, y, { s: 18, ls: 3, c: AREAS[a].c, w: 700 }));
      ctx.beginPath(); ctx.moveTo(NODES[0].x, NODES[0].y);
      for (let i = 1; i < NODES.length; i++) ctx.lineTo(NODES[i].x, NODES[i].y);
      ctx.strokeStyle = 'rgba(154,166,214,0.15)'; ctx.lineWidth = 3; ctx.setLineDash([4, 10]); ctx.stroke(); ctx.setLineDash([]);
      if (lt > J0) {
        ctx.beginPath(); ctx.moveTo(NODES[0].x, NODES[0].y);
        for (let i = 1; i <= Math.min(k, NODES.length - 1); i++) ctx.lineTo(NODES[i].x, NODES[i].y);
        if (k < NODES.length - 1) { const m = eio(clamp(f / (JM / JH))); ctx.lineTo(lerp(NODES[k].x, NODES[k + 1].x, m), lerp(NODES[k].y, NODES[k + 1].y, m)); }
        ctx.strokeStyle = C.amber; ctx.lineWidth = 4; ctx.stroke();
      }
      NODES.forEach((n, i) => {
        withT(n.x, n.y, pop(lt, 0.2 + i * 0.04, 0.4), 0, () => {
          if (n.id === 'START') { fillRR(-60, -20, 120, 40, 20, C.line); T('18h30', 0, 1, { f: DISP, s: 18 }); return; }
          const done = lt >= doneT(i);
          const rm = ROOMS.find((r) => r.id === n.id);
          if (rm) {
            const ar = AREAS[rm.a];
            circle(0, 0, 32, done ? ar.c : C.night);
            ring(0, 0, 32, ar.c, 3);
            roomIcon(rm.ic, 0, 0, 0.5, done ? C.ink : ar.c);
            T(rm.short, 0, 48, { s: 18, w: 700, c: ar.c });
          } else {
            const ar = AREAS[n.a];
            const open = lt >= areaDone(n.a);
            fillRR(-30, -30, 60, 60, 14, done ? ar.c : C.night);
            strokeRR(-30, -30, 60, 60, 14, open ? ar.c : C.line, 3, open ? null : [5, 5]);
            ball(0, 0, 15, done ? C.ink : open ? ar.c : C.dim);
            T('Esporte', 0, 46, { s: 18, w: 700, c: open ? ar.c : C.dim });
            if (!open) withT(24, -26, 0.55, 0, () => lock(0, 0, 1, 0, C.dim));
          }
          if (k === i - 1 && f > JM / JH) {
            const tf = p(f, JM / JH, 0.95);
            ctx.beginPath(); ctx.arc(0, 0, 42, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * tf * (JTIMES[i - 1] / 600));
            ctx.strokeStyle = C.amber; ctx.lineWidth = 5; ctx.stroke();
          }
          if (done) check(26, -26, pop(lt, doneT(i), 0.3) * 0.7);
        });
      });
      let tx = NODES[0].x, ty = NODES[0].y;
      if (lt > J0) {
        if (k >= NODES.length - 1) { tx = NODES[NODES.length - 1].x; ty = NODES[NODES.length - 1].y; }
        else { const m = eio(clamp(f / (JM / JH))); tx = lerp(NODES[k].x, NODES[k + 1].x, m); ty = lerp(NODES[k].y, NODES[k + 1].y, m); }
      }
      withT(tx, ty - 50, 1, 0, () => { circle(0, 0, 34, 'rgba(11,18,48,0.85)'); team(0, 0, TEAMS[6], 0.95); });
    });
    const a = fadeIn(lt, 0.4, 0.6);
    alpha(a, () => appScreen(1060, 410 + (1 - a) * 60, lt, JOURNEY_EVENTS, { toast: 0.9 }));
    alpha(fadeIn(lt, J_END + 0.1, 0.3), () => {
      fillRR(270, 398, 360, 44, 22, C.ok);
      T('Tudo concluído: 9 salas + 4 esportes', 450, 421, { s: 24, w: 800, c: C.ink });
    });
  }
  const journeyClock = (lt) => 1110 + 150 * p(lt, J0, J_END + 0.6);

  // 17. pizza (depois da premiação)
  function sPizza(lt) {
    title('Depois da premiação...', 112, fadeIn(lt, 0), 44);
    sub('hora de recarregar as energias', 160, fadeIn(lt, 0.3));
    if (!G3D) withT(W / 2, 380, pop(lt, 0.8, 0.7), 0, () => pizza(0, 0, 160, lt * 0.4, eo(p(lt, 2.0, 2.6))));
    withT(W / 2, 610, pop(lt, 1.6, 0.5), 0, () => { fillRR(-300, -50, 600, 100, 26, 'rgba(11,18,48,0.92)'); T('PIZZA!', 0, 4, { f: DISP, s: 72, c: C.amber }); });
  }

  // 16. premiação (logo depois dos desafios)
  function sAwards(lt) {
    title('Fim dos desafios: premiação!', 112, fadeIn(lt, 0), 42);
    sub('na sala do PV', 160, fadeIn(lt, 0.3), C.amber, 30);
    const m = fadeIn(lt, 0.4, 0.6);
    alpha(m, () => {
      if (!G3D) medal(330, 340 + (1 - m) * -200, 1.25, Math.sin(lt * 3) * 0.08 * (1 - p(lt, 0, 5)));
      T('MEDALHA DE CONCLUSÃO', 330, 505, { f: DISP, s: 24, c: C.amber });
      T('para toda equipe que concluir', 330, 548, { s: 30 });
      T('todos os desafios', 330, 582, { s: 30 });
    });
    const pod = [
      { x: 780, h: 150, n: '2', c: TEAMS[3], tm: '1:58:47', d: 2.2 },
      { x: 950, h: 220, n: '1', c: TEAMS[6], tm: '1:52:10', d: 2.6 },
      { x: 1120, h: 110, n: '3', c: TEAMS[2], tm: '2:05:03', d: 1.8 },
    ];
    pod.forEach((b) => {
      const q = eo(p(lt, b.d, b.d + 0.5));
      const h = b.h * q;
      fillRR(b.x - 80, 590 - h, 160, h, [10, 10, 0, 0], b.c);
      if (q > 0.6) {
        T(b.n + 'º', b.x, 590 - h + 42, { f: DISP, s: 40, c: C.ink });
        T(b.tm, b.x, 590 - h + 82, { s: 22, w: 800, c: C.ink });
        team(b.x, 590 - h - 40, b.c, 0.9);
      }
      if (b.n === '1' && q >= 1) {
        withT(b.x, 590 - h - 92, pop(lt, 3.3, 0.4), 0, () => {
          ctx.beginPath(); ctx.moveTo(-24, 14); ctx.lineTo(-28, -12); ctx.lineTo(-12, 0); ctx.lineTo(0, -18); ctx.lineTo(12, 0); ctx.lineTo(28, -12); ctx.lineTo(24, 14); ctx.closePath();
          ctx.fillStyle = C.amber; ctx.fill();
        });
      }
    });
    fillRR(660, 590, 580, 3, 1, C.line);
    T('Pódio: os 3 menores tempos totais', 950, 628, { s: 30, w: 800, c: C.amber, a: fadeIn(lt, 3.4) });
    T('campeã = concluiu tudo no menor tempo', 950, 664, { s: 24, c: C.dim, a: fadeIn(lt, 3.8) });
  }

  // 18. 22h: sobremesa
  const POPS = (() => { const r = rng(99), a = []; const cols = ['#ff5d8f', '#ffb627', '#4ea8ff', '#2ec4b6', '#c77dff', '#ff8c42']; for (let i = 0; i < 18; i++) a.push({ x: 60 + r() * 1160, d: r() * 2.2, sp: 200 + r() * 180, rot: r() * 6, vr: (r() - 0.5) * 3, s: 0.55 + r() * 0.45, c: cols[i % cols.length] }); return a; })();
  function sDessert(lt) {
    if (!G3D) {
    ctx.save(); ctx.beginPath(); ctx.rect(0, 72, W, H - 72); ctx.clip();
    POPS.forEach((o) => {
      const tt = lt - 0.2 - o.d;
      if (tt <= 0) return;
      popsicle(o.x, -100 + ((tt * o.sp) % 920), o.s, o.rot + tt * o.vr, o.c);
    });
    ctx.restore();
    }
    withT(W / 2, 112, 1, 0, () => { fillRR(-280, -36, 560, 72, 24, 'rgba(11,18,48,0.92)'); T('22H · SOBREMESA', 0, 2, { f: DISP, s: 42, a: fadeIn(lt, 0) }); });
    if (!G3D) withT(W / 2, 370, pop(lt, 0.5, 0.6), Math.sin(lt * 2) * 0.08, () => popsicle(0, 0, 2.3, 0, '#ff5d8f'));
    withT(W / 2, 600, pop(lt, 1.2, 0.5), 0, () => { fillRR(-300, -56, 600, 112, 28, 'rgba(11,18,48,0.92)'); T('PICOLÉ!', 0, 4, { f: DISP, s: 80, c: C.amber }); });
  }

  // 19. 22h30: encerramento
  function sEnd(lt) {
    withT(W / 2 - 250, 175, pop(lt, 0.2, 0.5), 0, () => flagIcon(0, 0, 1.4, lt * 4));
    T('22h30', W / 2 + 40, 150, { f: DISP, s: 60, c: C.amber, a: fadeIn(lt, 0.2) });
    T('ENCERRAMENTO', W / 2 + 40, 210, { f: DISP, s: 34, a: fadeIn(lt, 0.4) });
    alpha(fadeIn(lt, 1.0), () => {
      fillRR(340, 260, 600, 56, 28, C.panel);
      T('celulares devolvidos · todo mundo pra casa', W / 2, 289, { s: 28 });
    });
    const rows = [
      { h: 'ORGANIZAÇÃO', n: 'Carol · Renato · Bibi', c: C.amber, y: 360 },
      { h: 'EDUCAÇÃO FÍSICA', n: 'Valência · Alex · Matheus Maciel', c: '#2ec4b6', y: 432 },
      { h: 'PROFESSORES DAS SALAS', n: 'Rafinha · Brunão · Castañeda · Dani Sinzatto · Kleber · Pâmela', c: '#c77dff', y: 504 },
      { h: '', n: 'Arthur · Eloiza · Paulo · André · Renan', c: '#c77dff', y: 562 },
    ];
    rows.forEach((g, i) => {
      const a = fadeIn(lt, 1.6 + i * 0.4);
      if (g.h) T(g.h, W / 2, g.y, { s: 18, c: g.c, ls: 4, w: 700, a });
      T(g.n, W / 2, g.h ? g.y + 28 : g.y, { s: 28, w: 700, a });
    });
    withT(W / 2, 645, pop(lt, 3.6, 0.5), 0, () => T('NOS VEMOS NO ENEM GAMES!', 0, 0, { f: DISP, s: 44, c: C.amber }));
  }

  // ================= ROTEIRO =================
  const GROUPS = ['Abertura', 'Equipes e celulares', 'Passaporte digital', 'Áreas e salas', 'Esportivos', 'Regras das salas', 'A noite', 'Premiação e pizza', 'Sobremesa e fim'];
  const SCENES = [
    { id: 'intro', d: 6, g: 0, f: sIntro, clock: 1080, st: 'BEM-VINDOS', cues: [[0.1, 'whoosh'], [1.0, 'hit']] },
    { id: 'abertura', d: 14.5, g: 0, f: sOpening, clock: openingClock, st: 'ABERTURA', cues: [0, 1, 2, 3, 4].map((i) => [OPEN_T0 + i * OPEN_STEP, i === 4 ? 'horn' : 'step']) },
    { id: 'trios', d: 9, g: 1, f: sTrios, clock: 1100, st: 'COMO FUNCIONA', cues: [[0.4, 'shuffle'], [3.6, 'chime'], [4.6, 'hit']] },
    { id: 'celulares', d: 7, g: 1, f: sPhones, clock: 1105, st: 'COMO FUNCIONA', cues: [[2.6, 'seal']] },
    { id: 'passaporte', d: 13, g: 2, f: sPassport, clock: 'REGRAS', st: 'COMO FUNCIONA', cues: [1.0, 2.4, 3.8, 5.2].map((t) => [t, 'tick']).concat(PASS_EVENTS.map((e) => [e.t, 'validate']), [[10.4, 'unlock']]) },
    { id: 'areas', d: 9, g: 3, f: sAreas, clock: 'REGRAS', st: 'COMO FUNCIONA', cues: [[1.0, 'chime'], [3.8, 'hit']] },
    { id: 'area-lin', d: 8, g: 3, f: sArea(0), clock: 'REGRAS', st: 'COMO FUNCIONA', cues: [[0.5, 'card'], [0.95, 'card'], [1.4, 'card']] },
    { id: 'area-hum', d: 7, g: 3, f: sArea(1), clock: 'REGRAS', st: 'COMO FUNCIONA', cues: [[0.5, 'card'], [0.95, 'card']] },
    { id: 'area-nat', d: 8, g: 3, f: sArea(2), clock: 'REGRAS', st: 'COMO FUNCIONA', cues: [[0.5, 'card'], [0.95, 'card'], [1.4, 'card']] },
    { id: 'area-mat', d: 6, g: 3, f: sArea(3), clock: 'REGRAS', st: 'COMO FUNCIONA', cues: [[0.5, 'card']] },
    { id: 'esportivos', d: 11, g: 4, f: sSports, clock: 'REGRAS', st: 'COMO FUNCIONA', cues: [[3.4, 'unlock'], [5.0, 'unlock'], [6.6, 'unlock'], [7.6, 'unlock']] },
    { id: 'tempo', d: 9, g: 5, f: sTimer, clock: 'REGRAS', st: 'COMO FUNCIONA', cues: [[1.6, 'countdown', 4.0], [5.6, 'buzzer']] },
    { id: 'opcoes', d: 9, g: 5, f: sOptions, clock: 'REGRAS', st: 'COMO FUNCIONA', cues: [[7.6, 'chime']] },
    { id: 'conduta', d: 10, g: 5, f: sConduct, clock: 'REGRAS', st: 'COMO FUNCIONA', cues: [[1.0, 'buzzer-soft']].concat([0, 1, 2, 3, 4].map((i) => [3.4 + i * 0.45, 'down'])) },
    { id: 'jornada', d: 16.5, g: 6, f: sJourney, clock: journeyClock, st: 'DESAFIOS EM ANDAMENTO', cues: [[0.2, 'horn']].concat(JOURNEY_EVENTS.map((e) => [e.t, 'validate']), [[J_END + 0.1, 'fanfare']]) },
    { id: 'premiacao', d: 9, g: 7, f: sAwards, clock: 'SALA DO PV', st: 'FIM DOS DESAFIOS', cues: [[0.5, 'fanfare'], [1.8, 'hit'], [2.2, 'hit'], [2.6, 'hit'], [3.3, 'sparkle']] },
    { id: 'pizza', d: 7, g: 7, f: sPizza, clock: 'PIZZA', st: 'DEPOIS DA PREMIAÇÃO', cues: [[0.8, 'pop'], [1.6, 'fanfare']] },
    { id: 'sobremesa', d: 6, g: 8, f: sDessert, clock: 1320, st: 'SOBREMESA', cues: [[0.5, 'pop'], [1.2, 'fanfare']] },
    { id: 'fim', d: 9, g: 8, f: sEnd, clock: 1350, st: 'ENCERRAMENTO', cues: [[0.2, 'hit'], [3.6, 'finale']] },
  ];
  // ---------- linha do tempo: cenas + vinhetas de capítulo, com sobreposição para as transições ----------
  const OVER = 0.9; // duração de cada transição
  const GROUP_COLORS = ['#ffb627', '#ff5d5d', '#2ec4b6', '#4ea8ff', '#ff8c42', '#c77dff', '#a3e635', '#ffb627', '#ff5d8f'];
  const SEGS = [];
  SCENES.forEach((s, i) => {
    if (i > 0 && s.g !== SCENES[i - 1].g) {
      SEGS.push({ kind: 'bumper', id: 'cap-' + (s.g + 1), g: s.g, d: 2.9, clock: typeof s.clock === 'function' ? s.clock(0) : s.clock, st: 'PRÓXIMO CAPÍTULO', cues: [[0.05, 'riser'], [0.85, 'boom']] });
    }
    SEGS.push({ kind: 'scene', id: s.id, g: s.g, f: s.f, d: s.d + OVER, clock: s.clock, st: s.st, cues: s.cues });
  });
  const TRANS = ['cube', 'slide', 'flip', 'swing'];
  let acc = 0, ti = 0;
  SEGS.forEach((s, i) => {
    s.a = acc; s.b = acc + s.d; acc = s.b - OVER;
    if (i > 0) s.tin = s.kind === 'bumper' || SEGS[i - 1].kind === 'bumper' ? 'fly' : TRANS[ti++ % TRANS.length];
  });
  const DUR = SEGS[SEGS.length - 1].b;
  const CHAPTERS = GROUPS.map((n, gi) => { const ss = SEGS.filter((s) => s.g === gi); return { n, a: ss[0].a, b: ss[ss.length - 1].b }; });
  const CUES = [];
  SEGS.forEach((s, i) => {
    if (i > 0 && s.kind === 'scene' && SEGS[i - 1].kind === 'scene') CUES.push({ t: s.a + 0.15, k: 'whoosh' });
    if (i > 0 && SEGS[i - 1].kind === 'bumper') CUES.push({ t: s.a + 0.1, k: 'whoosh' });
    s.cues.forEach(([t, k, d]) => CUES.push({ t: s.a + t, k, d }));
  });

  function segAt(t) { let i = 0; for (let k = 0; k < SEGS.length; k++) if (t >= SEGS[k].a) i = k; return i; }

  function hud(t, sc, lt) {
    T('ENEM GAMES', 40, 40, { f: DISP, s: 20, c: C.amber, al: 'left' });
    T('CURSO G9 · 2026', 212, 41, { s: 18, c: C.dim, al: 'left', ls: 2 });
    T(`${sc.g + 1}/${GROUPS.length} · ${GROUPS[sc.g].toUpperCase()}`, W / 2, 41, { s: 19, c: C.dim, ls: 3 });
    const ck = typeof sc.clock === 'function' ? sc.clock(lt) : sc.clock;
    const isTime = typeof ck === 'number';
    const label = isTime ? hhmm(ck) : ck;
    const pw = isTime ? 120 : Math.max(120, textW(label, 18, DISP, 400) + 36);
    const live = isTime && ck >= 1110 && ck < 1260;
    const late = isTime && ck >= 1260;
    fillRR(1240 - pw, 20, pw, 42, 21, late ? C.coral : live ? C.amber : C.line);
    T(label, 1240 - pw / 2, 42, { f: DISP, s: isTime ? 22 : 18, c: live || late ? C.ink : C.cream });
    T(sc.st, 1226 - pw, 42, { s: 16, c: C.dim, al: 'right', ls: 2 });
    CHAPTERS.forEach((c) => {
      const x0 = 40 + (c.a / DUR) * (W - 80) + 2, w = ((c.b - c.a) / DUR) * (W - 80) - 4;
      fillRR(x0, H - 14, w, 4, 2, 'rgba(154,166,214,0.25)');
      const f = p(t, c.a, c.b);
      if (f > 0) fillRR(x0, H - 14, w * f, 4, 2, C.amber);
    });
  }

  function bumper2D(s, lt) { // usado só sem WebGL
    T('CAPÍTULO', W / 2, 250, { s: 28, c: C.dim, ls: 8, a: fadeIn(lt, 0.2) });
    withT(W / 2, 360, pop(lt, 0.1, 0.6), 0, () => T(String(s.g + 1).padStart(2, '0'), 0, 0, { f: DISP, s: 150, c: GROUP_COLORS[s.g] }));
    T(GROUPS[s.g].toUpperCase(), W / 2, 490, { f: DISP, s: 48, a: fadeIn(lt, 0.5) });
  }
  function drawSeg(context, i, lt) {
    ctx = context;
    const s = SEGS[i];
    if (s.kind === 'scene') s.f(lt); else if (!G3D) bumper2D(s, lt);
  }
  function drawHud(context, t) {
    ctx = context;
    t = clamp(t, 0, DUR);
    const s = SEGS[segAt(t)];
    hud(t, s, t - s.a);
  }
  // render 2D completo (sem WebGL): fundo + cenas com fusão + HUD
  function render(context, t) {
    ctx = context;
    t = clamp(t, 0, DUR);
    background(t);
    const i = segAt(t), lt = t - SEGS[i].a;
    if (i > 0 && lt < OVER) {
      const q = lt / OVER;
      alpha(1 - q, () => drawSeg(context, i - 1, t - SEGS[i - 1].a));
      alpha(q, () => drawSeg(context, i, lt));
    } else drawSeg(context, i, lt);
    drawHud(context, t);
  }

  window.EnemGames = {
    render, drawSeg, drawHud, segAt, set3D: (v) => { G3D = !!v; },
    W, H, DUR, OVER, CHAPTERS, GROUPS, GROUP_COLORS, CUES, C, AREAS,
    SEGS: SEGS.map(({ id, kind, g, a, b, d, tin }) => ({ id, kind, g, a, b, d, tin })),
    SCENES: SEGS.filter((s) => s.kind === 'scene').map(({ id, a, b }) => ({ id, a, b })),
  };
})();
