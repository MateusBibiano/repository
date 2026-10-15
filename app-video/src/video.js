/* Vídeo explicativo do app ENEM Games.
   Telas reais do app (capturadas com dados de demonstração) exibidas num celular e num
   notebook 3D (Three.js r128), com câmera, destaques, toques, avisos e legendas.
   Tudo é função do tempo t: window.__renderAt(t) desenha um quadro determinístico. */
(async function () {
  const W = 1280, H = 720;
  const C = { bg: '#08090c', s1: '#111319', s2: '#181b23', line: '#2a2f3c', fg: '#f5f6f8', muted: '#8c93a3', y: '#ffc400', ok: '#00d26a', bad: '#ff2e4d', warn: '#ff9f1a' };
  const DISP = '"Barlow Condensed", "Arial Narrow", sans-serif';
  const BODY = '"Saira", system-ui, sans-serif';
  const MAN = window.MANIFEST;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const p = (t, a, b) => clamp((t - a) / (b - a));
  const lerp = (a, b, x) => a + (b - a) * x;
  const eo = (x) => 1 - Math.pow(1 - x, 3);
  const eio = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const back = (x) => { const c1 = 1.7, c3 = c1 + 1; return x <= 0 ? 0 : 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
  function rng(seed) { return function () { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const col = (h) => new THREE.Color(h).convertSRGBToLinear();

  // ---------- imagens ----------
  const IMG = {};
  const files = new Set([MAN.__logo]);
  Object.values(MAN).forEach((m) => { if (m && m.file) files.add(m.file); if (m && m.files) m.files.forEach((f) => files.add(f)); });
  await Promise.all([...files].map((f) => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(); im.onerror = () => rej(new Error(f)); im.src = 'shots/' + f; IMG[f] = im; })));
  await document.fonts.ready;

  // ================= ROTEIRO =================
  // view: nome da captura, ou {flip, t0, t1}; scroll: [[t, y css]]; cam: [[t, alvo, dist, órbita]]
  // hl: destaques {t0, t1, r, label}; taps: [{t, r}]; toast: {t0, t1, text, kind}; caps: legendas
  const SHOTS = [
    { id: 'intro', d: 6.5, dev: 'none', frame: 'center', cues: [[0.2, 'whoosh'], [0.6, 'hit']] },
    { id: 'abas', d: 13, dev: 'laptop', frame: 'up', views: [[0, 'painel']],
      cam: [[0, 'dev', 21, 0.35], [2.2, 'tabs', 9.5, 0.12], [9.6, 'live', 8, 0.1]],
      hl: [{ t0: 2.6, t1: 4.8, r: 'tabPainel', label: 'PAINEL · todo mundo acompanha' }, { t0: 4.8, t1: 7, r: 'tabPosto', label: 'MEU POSTO · professor de cada sala' }, { t0: 7, t1: 9.4, r: 'tabAdmin', label: 'ORGANIZAÇÃO · coordenação do evento' }, { t0: 9.9, t1: 12.6, r: 'live', label: 'AO VIVO · atualiza sozinho' }],
      caps: [{ t0: 0.4, t1: 12.6, tag: 'O APP', title: 'Um link, três abas', sub: 'Abre no navegador do celular ou do computador. Não precisa instalar nada.' }],
      cues: [[2.6, 'tick'], [4.8, 'tick'], [7, 'tick'], [9.9, 'tick']] },
    { id: 'painel', d: 19, dev: 'laptop', frame: 'up', views: [[0, { flip: 'painel', t0: 0, t1: 16 }]],
      scroll: [[0, 0], [9.2, 470], [15.2, 700]],
      cam: [[0, 'dev', 19, -0.25], [1.2, 'heroN', 8.5, 0.1], [4.2, 'nowgrid', 13.5, 0.06], [9.6, 'team1', 7.5, 0.08], [12.6, 'team4', 7.5, 0.08], [15.6, 'legend', 12, 0.05]],
      hl: [{ t0: 1.6, t1: 4.1, r: 'heroN', label: 'Desafios validados e equipes em andamento' }, { t0: 4.6, t1: 8.9, r: 'nowgrid', label: 'Quem está em cada sala, com o cronômetro' },
        { t0: 9.9, t1: 12.4, r: 'dots1', label: '13 quadrados: 9 salas + 4 esportivos' }, { t0: 12.9, t1: 15.4, r: 'wait4', label: 'Em espera: quando pode tentar de novo' }, { t0: 15.9, t1: 18.6, r: 'legend', label: 'Legenda das cores' }],
      caps: [{ t0: 0.3, t1: 18.7, tag: 'ABA PAINEL', title: 'O placar ao vivo', sub: 'Ideal para o telão: mostra as salas ocupadas e o progresso de cada equipe.' }],
      cues: [[1.6, 'tick'], [4.6, 'tick'], [9.9, 'tick'], [12.9, 'tick'], [15.9, 'tick']] },
    { id: 'login', d: 14, dev: 'phone', frame: 'right', views: [[0, 'posto_pick'], [3.6, 'posto_login']],
      scroll: [[0, 0], [3.6, 1050]],
      cam: [[0, 'dev', 14.5, 0.35], [1.2, 'mat', 7.5, 0.1], [4.4, 'login', 8.5, 0.1], [7.8, 'dev', 13.5, 0.2]],
      taps: [{ t: 2.7, r: 'mat' }, { t: 8.6, r: 'unlock' }], toast: { t0: 9, t1: 11.4, text: 'Posto liberado', kind: 'ok' },
      hl: [{ t0: 1.4, t1: 3.2, r: 'mat', label: 'Toque na sua sala' }, { t0: 4.8, t1: 8.3, r: 'pin', label: 'Senha do posto' }],
      caps: [{ t0: 0.3, t1: 4.2, tag: 'MEU POSTO · PASSO 1', title: 'Escolha o seu posto', sub: 'Cada professor abre a sala ou o desafio que vai cuidar.' },
        { t0: 4.2, t1: 13.7, tag: 'MEU POSTO · PASSO 2', title: 'Digite a senha do posto', sub: 'A organização passa a senha de cada posto. O celular lembra depois do primeiro acesso.' }],
      cues: [[2.7, 'tap'], [8.6, 'tap'], [9, 'ping']] },
    { id: 'posto', d: 12, dev: 'phone', frame: 'right', views: [[0, 'posto_open']],
      scroll: [[0, 0], [5.2, 640], [8.8, 1060]],
      cam: [[0, 'dev', 13, -0.3], [1, 'chips', 7.2, 0.1], [3.4, 'q11', 8, 0.1], [5.6, 'cooling', 8, 0.08], [8.8, 'away', 8, 0.08], [10.6, 'done', 8, 0.08]],
      hl: [{ t0: 1.3, t1: 3.2, r: 'chips', label: 'Resumo do posto' }, { t0: 3.6, t1: 5.4, r: 'q11', label: 'Aguardando: pode começar' }, { t0: 5.8, t1: 8.6, r: 'cooling', label: 'Em espera de 10 min' }, { t0: 9, t1: 10.4, r: 'away', label: 'Está em outra sala' }, { t0: 10.8, t1: 11.8, r: 'done', label: 'Já concluiu' }],
      caps: [{ t0: 0.3, t1: 11.8, tag: 'MEU POSTO', title: 'A fila de equipes', sub: 'Cada equipe aparece com a situação dela neste posto.' }],
      cues: [[1.3, 'tick'], [3.6, 'tick'], [5.8, 'tick'], [9, 'tick'], [10.8, 'tick']] },
    { id: 'iniciar', d: 15, dev: 'phone', frame: 'right', views: [[0, 'posto_open'], [1.9, 'posto_started'], [3.6, { flip: 'posto_clock', t0: 3.6, t1: 9.6 }]],
      scroll: [[0, 1000], [1.9, 300]],
      cam: [[0, 'start11', 8, 0.1], [2.2, 'q11c', 8.6, 0.08], [10, 'clock3', 7.6, 0.08], [12.6, 'q11c', 8.6, 0.06]],
      taps: [{ t: 1.2, r: 'start11' }], toast: { t0: 1.9, t1: 4.2, text: 'Tempo iniciado', kind: '' },
      hl: [{ t0: 0.2, t1: 1.6, r: 'start11', label: 'Iniciar tempo' }, { t0: 4, t1: 9.8, r: 'clock11', label: 'Cronômetro da equipe' }, { t0: 10.2, t1: 12.4, r: 'clock3', label: 'Passou de 10 min: vermelho' }],
      caps: [{ t0: 0.2, t1: 14.8, tag: 'MEU POSTO · PASSO 3', title: 'A equipe entrou? Iniciar tempo', sub: 'O cronômetro corre sozinho: fica laranja aos 8 min e vermelho depois de 10.' }],
      cues: [[1.2, 'tap'], [1.9, 'ping'], [3.6, 'clockrun', 6]] },
    { id: 'concluiu', d: 12, dev: 'phone', frame: 'right', views: [[0, { flip: 'posto_clock', t0: -100, t1: -99 }], [1.6, 'posto_done'], [6.6, 'posto_undo_armed']],
      scroll: [[0, 300], [1.6, 240]],
      cam: [[0, 'doneBtn', 7.8, 0.1], [1.8, 'q11d', 7.6, 0.08], [5.6, 'undo', 7.4, 0.08]],
      taps: [{ t: 0.9, r: 'doneBtn' }, { t: 6.3, r: 'undo' }], toast: { t0: 1.6, t1: 4.6, text: 'Desafio validado ✓', kind: 'ok' },
      hl: [{ t0: 2.4, t1: 5.4, r: 'q11d', label: 'Validado com o tempo da equipe' }, { t0: 6.8, t1: 11.6, r: 'undo', label: 'Toque de novo para confirmar' }],
      caps: [{ t0: 0.2, t1: 5.8, tag: 'MEU POSTO · PASSO 4', title: 'Terminou? Toque em CONCLUIU', sub: 'O desafio fica validado no passaporte da equipe, com o tempo registrado.' },
        { t0: 5.8, t1: 11.8, tag: 'ERROU O TOQUE?', title: 'Desfazer validação', sub: 'Ações que apagam dados pedem dois toques. Se não confirmar, nada muda.' }],
      cues: [[0.9, 'tap'], [1.6, 'validate'], [6.3, 'tap']] },
    { id: 'sync', d: 9, dev: 'both', frame: 'center', views: [[0, 'painel_live_a'], [3.4, 'painel_live_b']], phoneViews: [[0, 'posto_done']], phoneScroll: [[0, 240]],
      scroll: [[0, 700]],
      cam: [[0, 'both', 30, 0], [4.2, 'team11', 9, 0.1]],
      hl: [{ t0: 4.6, t1: 8.6, r: 'team11', label: 'Equipe 11: Matemática acesa' }],
      caps: [{ t0: 0.4, t1: 8.8, tag: 'AO VIVO', title: 'Validou no celular, apareceu no painel', sub: 'Não precisa atualizar a página: o placar muda na hora.' }],
      cues: [[3.4, 'validate']] },
    { id: 'falhou', d: 15, dev: 'phone', frame: 'right', views: [[0, 'posto_fail_armed'], [2.2, 'posto_failed'], [3.6, { flip: 'posto_cool', t0: 4, t1: 9 }], [10.4, 'posto_retry']],
      scroll: [[0, 260], [2.2, 230]],
      cam: [[0, 'fail', 7.6, 0.1], [2.4, 'q3f', 8, 0.08], [10.4, 'retry', 8, 0.08]],
      taps: [{ t: 1.6, r: 'fail' }], toast: { t0: 2.2, t1: 4.4, text: 'Registrado: não concluiu', kind: '' },
      hl: [{ t0: 0.2, t1: 1.5, r: 'fail', label: 'Confirmar' }, { t0: 4.2, t1: 9.8, r: 'q3f', label: 'O app conta os 10 min de espera' }, { t0: 10.8, t1: 14.6, r: 'retry', label: 'Espera cumprida: nova tentativa' }],
      caps: [{ t0: 0.2, t1: 14.8, tag: 'NÃO CONCLUIU', title: 'Tempo esgotado: NÃO CONCLUIU', sub: 'Dois toques para confirmar. A equipe espera 10 minutos ou volta quando outra equipe liberar a vaga.' }],
      cues: [[0.4, 'tap'], [1.6, 'tap'], [2.2, 'buzz'], [4, 'clockrun', 5], [10.4, 'ping']] },
    { id: 'cancelar', d: 10, dev: 'phone', frame: 'right', views: [[0, 'posto_cancel_armed'], [4.8, 'posto_open']],
      scroll: [[0, 250], [4.8, 1180]],
      cam: [[0, 'cancel', 7.6, 0.1], [4.8, 'away', 7.8, 0.08]],
      hl: [{ t0: 0.4, t1: 4.4, r: 'cancel', label: 'Iniciou por engano? Cancelar' }, { t0: 5.2, t1: 9.6, r: 'away', label: 'Equipe ocupada em outra sala' }],
      caps: [{ t0: 0.2, t1: 4.6, tag: 'CANCELAR', title: 'Começou por engano?', sub: 'CANCELAR apaga aquele tempo (também com dois toques).' },
        { t0: 4.6, t1: 9.8, tag: 'PROTEÇÃO', title: 'Uma sala de cada vez', sub: 'Se a equipe já está em outra sala, o app não deixa iniciar outro desafio.' }],
      cues: [[0.4, 'tap'], [5.2, 'tick']] },
    { id: 'esportivo', d: 13, dev: 'phone', frame: 'right', views: [[0, 'esportivo'], [8, 'esportivo_locked']],
      scroll: [[0, 0], [4.6, 420], [8, 200]],
      cam: [[0, 'dev', 13.5, -0.3], [1.2, 'rule', 7, 0.1], [4.6, 'open', 8, 0.08], [8, 'locked', 7.8, 0.08]],
      hl: [{ t0: 1.6, t1: 4.4, r: 'rule', label: 'Regra de liberação' }, { t0: 5, t1: 7.8, r: 'open', label: 'Área completa: liberado' }, { t0: 8.4, t1: 12.6, r: 'lockedNeed', label: 'O que ainda falta' }],
      caps: [{ t0: 0.3, t1: 12.8, tag: 'DESAFIOS ESPORTIVOS', title: 'Esportivo só com a área completa', sub: 'O posto da quadra mostra quem já pode jogar e o que falta para os outros.' }],
      cues: [[0.3, 'whoosh'], [1.6, 'tick'], [5, 'unlock'], [8.4, 'tick']] },
    { id: 'orglogin', d: 7, dev: 'laptop', frame: 'up', views: [[0, 'org_login'], [4.2, 'org_ranking']],
      cam: [[0, 'dev', 19, 0.3], [1, 'login', 10, 0.1], [4.4, 'dev', 17.5, 0.08]],
      taps: [{ t: 3.4, r: 'enter' }],
      hl: [{ t0: 1.4, t1: 3.2, r: 'pin', label: 'Senha da organização' }],
      caps: [{ t0: 0.3, t1: 6.8, tag: 'ABA ORGANIZAÇÃO', title: 'Área da organização', sub: 'Com a senha da organização: ranking, equipes, senhas e controle do evento.' }],
      cues: [[3.4, 'tap']] },
    { id: 'ranking', d: 10, dev: 'laptop', frame: 'up', views: [[0, 'org_ranking']], scroll: [[0, 0], [5.6, 180]],
      cam: [[0, 'podium', 13, 0.1], [3.2, 'crit', 7.5, 0.06], [5.6, 'table', 15, 0.05]],
      hl: [{ t0: 0.5, t1: 3, r: 'podium', label: 'Pódio ao vivo' }, { t0: 3.5, t1: 5.4, r: 'crit', label: 'Critérios de desempate' }, { t0: 6, t1: 9.6, r: 'table', label: 'Concluídos, tempo total e média' }],
      caps: [{ t0: 0.2, t1: 9.8, tag: 'ORGANIZAÇÃO · RANKING', title: 'Quem está na frente', sub: 'Ordem: mais desafios concluídos e, no empate, menor tempo total.' }],
      cues: [[0.5, 'tick'], [3.5, 'tick'], [6, 'tick']] },
    { id: 'acesso', d: 9, dev: 'laptop', frame: 'up', views: [[0, 'org_acesso'], [3.6, 'org_via']],
      cam: [[0, 'pick', 13, 0.08], [3.8, 'chip', 8, 0.08]],
      taps: [{ t: 2.8, r: 'fis' }],
      hl: [{ t0: 0.5, t1: 2.6, r: 'fis', label: 'Entra em qualquer posto' }, { t0: 4.2, t1: 8.6, r: 'chip', label: 'Sem senha do posto' }],
      caps: [{ t0: 0.2, t1: 8.8, tag: 'ORGANIZAÇÃO · ACESSAR POSTOS', title: 'Ajuda em qualquer sala', sub: 'A organização abre qualquer posto para validar no lugar do professor.' }],
      cues: [[2.8, 'tap']] },
    { id: 'equipes', d: 12, dev: 'laptop', frame: 'up', views: [[0, 'org_equipes'], [5.6, 'org_postos']],
      cam: [[0, 'qty', 11, 0.08], [2.8, 'names', 11, -0.06], [5.8, 'pins', 11, 0.08], [8.8, 'names', 11, -0.06]],
      hl: [{ t0: 0.4, t1: 2.6, r: 'qty', label: 'Quantidade de equipes' }, { t0: 3, t1: 5.4, r: 'names', label: 'Nomes das equipes' }, { t0: 6, t1: 8.6, r: 'pins', label: 'Senha de cada posto' }, { t0: 9, t1: 11.6, r: 'names', label: 'Nome, local e responsável' }],
      caps: [{ t0: 0.2, t1: 5.6, tag: 'ORGANIZAÇÃO · EQUIPES', title: 'Equipes', sub: 'Defina quantas equipes existem e dê nome a elas.' },
        { t0: 5.6, t1: 11.8, tag: 'ORGANIZAÇÃO · POSTOS E SENHAS', title: 'Postos e senhas', sub: 'Troque as senhas antes do evento e confira local e responsável de cada posto.' }],
      cues: [[0.4, 'tick'], [3, 'tick'], [6, 'tick'], [9, 'tick']] },
    { id: 'evento', d: 9, dev: 'laptop', frame: 'up', views: [[0, 'org_evento']],
      cam: [[0, 'resumo', 11, 0.08], [3, 'reset', 9, 0.06], [6.6, 'sair', 11, -0.06]],
      hl: [{ t0: 0.4, t1: 2.8, r: 'resumo', label: 'Resumo do evento' }, { t0: 3.2, t1: 6.4, r: 'resetBtn', label: 'Apaga tudo: dois toques' }, { t0: 6.8, t1: 8.6, r: 'sair', label: 'Sair deste aparelho' }],
      caps: [{ t0: 0.2, t1: 8.8, tag: 'ORGANIZAÇÃO · EVENTO', title: 'Controle do evento', sub: 'Zerar apaga todos os tempos e validações. Use só antes de começar.' }],
      cues: [[0.4, 'tick'], [3.2, 'buzz'], [6.8, 'tick']] },
    { id: 'dicas', d: 10, dev: 'both', frame: 'center', views: [[0, 'org_ranking']], phoneViews: [[0, 'posto_open']], phoneScroll: [[0, 0]],
      cam: [[0, 'both', 33, 0.15]], cues: [[0.6, 'hit'], [1.6, 'tick'], [2.6, 'tick'], [3.6, 'tick']] },
    { id: 'fim', d: 6, dev: 'none', frame: 'center', cues: [[0.3, 'whoosh'], [0.9, 'finale']] },
  ];
  let acc = 0;
  SHOTS.forEach((s) => { s.a = acc; acc += s.d; s.b = acc; s.views = s.views || []; s.cam = s.cam || [[0, 'dev', 16, 0]]; s.hl = s.hl || []; s.taps = s.taps || []; s.caps = s.caps || []; s.scroll = s.scroll || [[0, 0]]; });
  const DUR = acc;
  const CUES = [];
  SHOTS.forEach((s, i) => { if (i) CUES.push({ t: s.a - 0.15, k: 'whoosh' }); s.cues.forEach(([t, k, d]) => CUES.push({ t: s.a + t, k, d })); });
  const shotAt = (t) => { let i = 0; SHOTS.forEach((s, k) => { if (t >= s.a) i = k; }); return i; };

  // ---------- telas (canvas) ----------
  const DEV = {
    phone: { cssW: 390, cssH: 844, bar: 44, dsf: 2, worldW: 3.84 },
    laptop: { cssW: 1440, cssH: 900, bar: 40, dsf: 1.5, worldW: 15.6 },
  };
  Object.values(DEV).forEach((d) => { d.worldH = (d.worldW * d.cssH) / d.cssW; d.k = d.worldW / d.cssW; d.winH = d.cssH - d.bar; });
  function viewAt(views, lt) { let v = views[0] ? views[0][1] : null; views.forEach(([t, vv]) => { if (lt >= t) v = vv; }); return v; }
  function viewInfo(v, lt) { // -> {m (manifest), file}
    if (!v) return null;
    if (typeof v === 'string') return { name: v, m: MAN[v], file: MAN[v].file || MAN[v].files[0] };
    const m = MAN[v.flip];
    const n = m.files.length;
    const k = v.t1 < 0 ? n - 1 : Math.round(clamp((lt - v.t0) / (v.t1 - v.t0)) * (n - 1));
    return { name: v.flip, m, file: m.files[k] };
  }
  function keyed(list, lt, def = 0) { // [[t, y]] com transição suave
    let y = list.length ? list[0][1] : def;
    for (let j = 1; j < list.length; j++) if (lt > list[j][0]) y = lerp(y, list[j][1], eio(clamp((lt - list[j][0]) / 0.9)));
    return y;
  }
  // retângulo de um elemento (px CSS da janela do app) na captura atual
  function rectIn(info, name, scroll) {
    if (!info) return null;
    let r = info.m.rects[name];
    if (!r) { // procura em capturas irmãs (ex.: q11c = q11 do cronômetro)
      const alias = { q11c: ['posto_clock', 'q11'], q11d: ['posto_done', 'q11'], q3f: ['posto_failed', 'q3'], clock11: ['posto_clock', 'clock11'], clock3: ['posto_clock', 'clock3'], doneBtn: ['posto_clock', 'doneBtn'] }[name];
      if (alias) r = MAN[alias[0]].rects[alias[1]];
    }
    if (!r) return null;
    return [r[0], r[1] - (info.m.y0 || 0) - scroll, r[2], r[3]];
  }

  function makeScreen(kind) {
    const d = DEV[kind];
    const cv = document.createElement('canvas');
    cv.width = d.cssW * d.dsf; cv.height = d.cssH * d.dsf;
    const tex = new THREE.CanvasTexture(cv);
    tex.encoding = THREE.sRGBEncoding; tex.minFilter = THREE.LinearMipmapLinearFilter;
    return { cv, ctx: cv.getContext('2d'), tex, d };
  }
  function cutPath(x, c, X, Y, w, h, k) { c.beginPath(); c.moveTo(X + k, Y); c.lineTo(X + w, Y); c.lineTo(X + w - k, Y + h); c.lineTo(X, Y + h); c.closePath(); }
  function drawScreen(scr, info, scroll, lt, shot, kind, extra) {
    const { cv, ctx: c, d } = scr;
    const s = d.dsf;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = C.bg; c.fillRect(0, 0, cv.width, cv.height);
    c.setTransform(s, 0, 0, s, 0, 0);
    // barra superior: status do celular ou aba do navegador
    if (kind === 'phone') {
      c.fillStyle = '#000'; c.fillRect(0, 0, d.cssW, d.bar);
      c.fillStyle = C.fg; c.font = `600 15px ${BODY}`; c.textBaseline = 'middle'; c.fillText('20:05', 30, 24);
      c.fillRect(330, 18, 26, 12); c.fillStyle = '#000'; c.fillRect(332, 20, 18, 8); c.fillStyle = C.fg; c.fillRect(332, 20, 16, 8);
      [0, 1, 2, 3].forEach((i) => c.fillRect(300 + i * 5, 28 - i * 3, 3, 3 + i * 3));
    } else {
      c.fillStyle = '#1b1d24'; c.fillRect(0, 0, d.cssW, d.bar);
      c.fillStyle = '#2a2d36'; c.beginPath(); c.roundRect(90, 6, 230, 34, [8, 8, 0, 0]); c.fill();
      c.fillStyle = C.fg; c.font = `500 13px ${BODY}`; c.textBaseline = 'middle'; c.fillText('ENEM Games 2026', 112, 23);
      ['#ff5f57', '#febc2e', '#28c840'].forEach((cc, i) => { c.fillStyle = cc; c.beginPath(); c.arc(22 + i * 20, 20, 6, 0, 7); c.fill(); });
      c.fillStyle = '#111319'; c.beginPath(); c.roundRect(340, 9, 520, 24, 12); c.fill();
      c.fillStyle = C.muted; c.font = `400 12px ${BODY}`; c.fillText('enem-games-g9 · placar ao vivo', 356, 21);
    }
    if (info) {
      const im = IMG[info.file];
      const maxS = Math.max(0, info.m.h - d.winH);
      const sc = clamp(scroll, 0, maxS);
      c.save(); c.beginPath(); c.rect(0, d.bar, d.cssW, d.winH); c.clip();
      c.drawImage(im, 0, sc * info.m.dsf, d.cssW * info.m.dsf, d.winH * info.m.dsf, 0, d.bar, d.cssW, d.winH);
      // destaque: escurece o resto e contorna o elemento
      (extra.hl || []).forEach(({ r, a }) => {
        if (!r || a <= 0) return;
        const [x, y, w, h] = [r[0] - 4, r[1] + d.bar - 4, r[2] + 8, r[3] + 8];
        c.save(); c.globalAlpha = a * 0.62; c.fillStyle = '#000';
        c.beginPath(); c.rect(0, d.bar, d.cssW, d.winH); c.rect(x + w, y, -w, h); c.fill('evenodd'); c.restore();
        c.save(); c.globalAlpha = a; c.strokeStyle = C.y; c.lineWidth = 3; c.strokeRect(x, y, w, h);
        const L = Math.min(18, w / 3, h / 2); c.lineWidth = 6;
        [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]].forEach(([px, py, sx, sy]) => { c.beginPath(); c.moveTo(px + sx * L, py); c.lineTo(px, py); c.lineTo(px, py + sy * L); c.stroke(); });
        c.restore();
      });
      // toques
      (extra.taps || []).forEach(({ r, q }) => {
        if (!r || q <= 0 || q >= 1) return;
        const x = r[0] + r[2] / 2, y = r[1] + r[3] / 2 + d.bar;
        const press = q < 0.35 ? eo(q / 0.35) : 1 - eo((q - 0.35) / 0.65);
        c.save();
        c.globalAlpha = 0.5 * press; c.fillStyle = '#fff'; c.beginPath(); c.arc(x, y, 22, 0, 7); c.fill();
        if (q > 0.3) { const rq = (q - 0.3) / 0.7; c.globalAlpha = 1 - rq; c.strokeStyle = C.y; c.lineWidth = 4; c.beginPath(); c.arc(x, y, 22 + rq * 40, 0, 7); c.stroke(); }
        c.restore();
      });
      c.restore();
    }
    // aviso (toast) igual ao do app
    const ts = extra.toast;
    if (ts && ts.a > 0) {
      c.save(); c.globalAlpha = ts.a;
      c.font = `italic 800 ${kind === 'phone' ? 17 : 17}px ${DISP}`;
      c.letterSpacing = '0.7px';
      const txt = ts.text.toUpperCase(); const tw = c.measureText(txt).width + 44;
      const x = d.cssW / 2 - tw / 2, y = d.cssH - 72 + (1 - ts.a) * 16;
      cutPath(null, c, x, y, tw, 46, 12);
      c.fillStyle = ts.kind === 'ok' ? C.ok : ts.kind === 'err' ? C.bad : C.fg; c.fill();
      c.fillStyle = ts.kind === 'ok' ? '#03150b' : ts.kind === 'err' ? '#fff' : '#08090c';
      c.textBaseline = 'middle'; c.textAlign = 'center'; c.fillText(txt, d.cssW / 2, y + 24);
      c.restore();
    }
    scr.tex.needsUpdate = true;
  }

  // ---------- Three.js ----------
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  let OW = 1920, OH = 1080;
  renderer.setSize(OW, OH, false);
  const envScene = new THREE.Scene(); envScene.background = col('#050608');
  const devScene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer);
  const envTex = pm.fromScene(new THREE.RoomEnvironment(), 0.04).texture;
  devScene.environment = envTex; envScene.environment = envTex;
  function lights(sc) {
    sc.add(new THREE.AmbientLight(0xffffff, 0.3));
    const k = new THREE.DirectionalLight(col('#fff3d6'), 1.5); k.position.set(5, 8, 10); sc.add(k);
    const a = new THREE.PointLight(col('#ffc400'), 2.4, 60); a.position.set(-12, 5, 6); sc.add(a);
    const b = new THREE.PointLight(col('#5b7cff'), 1.6, 60); b.position.set(12, -4, 8); sc.add(b);
  }
  lights(envScene); lights(devScene);
  const camera = new THREE.PerspectiveCamera(35, OW / OH, 0.1, 400);

  // estúdio: piso, faixas diagonais amarelas (como os cortes do app), luzes, partículas
  const floorMat = new THREE.ShaderMaterial({
    extensions: { derivatives: true },
    uniforms: { uTime: { value: 0 } },
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }',
    fragmentShader: `uniform float uTime; varying vec3 vW;
      void main(){ vec2 c = vW.xz/2.5; vec2 g = abs(fract(c-0.5)-0.5)/fwidth(c); float l = 1.0-min(min(g.x,g.y),1.0);
        float d = length(vW.xz-vec2(0.0,-8.0)); float fade = exp(-d*0.04);
        float sweep = smoothstep(0.0,1.0,1.0-abs(fract(vW.x*0.02 - uTime*0.08)-0.5)*5.0);
        vec3 col = mix(vec3(0.10,0.11,0.16), vec3(1.0,0.66,0.0), sweep*0.8)*l*fade*1.3 + vec3(0.01,0.012,0.02)*fade;
        gl_FragColor = vec4(col,1.0); }`,
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), floorMat); floor.rotation.x = -Math.PI / 2; floor.position.y = -7.5; envScene.add(floor);
  function slab(w, h, skew) { const s = new THREE.Shape(); s.moveTo(-w / 2 + skew, h / 2); s.lineTo(w / 2 + skew, h / 2); s.lineTo(w / 2 - skew, -h / 2); s.lineTo(-w / 2 - skew, -h / 2); s.closePath(); return new THREE.ShapeGeometry(s); }
  const slabs = [];
  [[-30, 2, -40, 5, 40, '#ffc400', 1.4], [-20, 4, -46, 2.2, 44, '#ffc400', 0.9], [22, 3, -42, 6, 42, '#ffc400', 1.2], [33, 1, -48, 2.5, 46, '#ff2e4d', 0.8], [0, 14, -60, 60, 1.2, '#ffc400', 1.0], [-8, -2, -52, 1.2, 40, '#5b7cff', 0.7], [10, -1, -55, 1.6, 40, '#00d26a', 0.5]].forEach(([x, y, z, w, h, c, i], k) => {
    const m = new THREE.Mesh(slab(w, h, h * 0.12), new THREE.MeshBasicMaterial({ color: col(c).multiplyScalar(i), transparent: true, opacity: 0.95 }));
    m.position.set(x, y, z); m.userData = { ph: k, base: col(c).multiplyScalar(i) }; envScene.add(m); slabs.push(m);
  });
  const bars = [];
  (() => { const r = rng(4); for (let i = 0; i < 18; i++) { const side = i % 2 ? 1 : -1;
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.5 + r() * 2.5, 0.22, 0.22), new THREE.MeshStandardMaterial({ color: col(i % 5 === 0 ? '#ff2e4d' : i % 3 === 0 ? '#f5f6f8' : '#ffc400'), metalness: 0.6, roughness: 0.3, emissive: col('#3a2a00') }));
    m.userData = { x: side * (16 + r() * 18), y: -5 + r() * 16, z: -8 - r() * 26, ph: r() * 6, sp: 0.2 + r() * 0.4 }; m.rotation.z = -0.25; envScene.add(m); bars.push(m); } })();
  const PART = 700; const pg = new THREE.BufferGeometry();
  (() => { const r = rng(9), pos = new Float32Array(PART * 3), sp = new Float32Array(PART);
    for (let i = 0; i < PART; i++) { pos[i * 3] = (r() * 2 - 1) * 40; pos[i * 3 + 1] = r() * 26 - 7; pos[i * 3 + 2] = -4 - r() * 44; sp[i] = 0.2 + r() * 0.6; }
    pg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); pg.setAttribute('sp', new THREE.BufferAttribute(sp, 1)); })();
  const pmat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uTime: { value: 0 }, uScale: { value: OH / 2 } },
    vertexShader: 'uniform float uTime; uniform float uScale; attribute float sp; varying float vA; void main(){ vec3 p = position; p.y = mod(p.y + 7.0 + uTime*sp, 26.0) - 7.0; vec4 mv = modelViewMatrix*vec4(p,1.0); gl_PointSize = uScale*0.08*(0.6+sp)/-mv.z; vA = 0.3+0.7*fract(sp*7.0); gl_Position = projectionMatrix*mv; }',
    fragmentShader: 'varying float vA; void main(){ float d = length(gl_PointCoord-0.5); if(d>0.5) discard; gl_FragColor = vec4(vec3(1.0,0.8,0.3)*(1.0-d*2.0)*vA,1.0); }' });
  envScene.add(new THREE.Points(pg, pmat));

  // dispositivos
  const metal = new THREE.MeshStandardMaterial({ color: col('#1c1f26'), metalness: 0.85, roughness: 0.28 });
  const metalLight = new THREE.MeshStandardMaterial({ color: col('#3a3e48'), metalness: 0.9, roughness: 0.25 });
  function roundRectShape(w, h, r) { const s = new THREE.Shape(); s.moveTo(-w / 2 + r, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r); s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2); s.lineTo(-w / 2 + r, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2); return s; }
  const phoneScr = makeScreen('phone'), lapScr = makeScreen('laptop');
  const phone = new THREE.Group();
  (() => {
    const d = DEV.phone;
    const body = new THREE.Mesh(new THREE.ExtrudeGeometry(roundRectShape(d.worldW + 0.36, d.worldH + 0.36, 0.62), { depth: 0.34, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 4, curveSegments: 16 }), [metal, metalLight]);
    body.position.z = -0.4;
    const scr = new THREE.Mesh(new THREE.ShapeGeometry(roundRectShape(d.worldW, d.worldH, 0.48)), new THREE.MeshBasicMaterial({ map: phoneScr.tex, toneMapped: false }));
    // UV da forma: normaliza para 0..1
    const uv = scr.geometry.attributes.uv, pos = scr.geometry.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / d.worldW + 0.5, pos.getY(i) / d.worldH + 0.5);
    scr.position.z = 0.012;
    const island = new THREE.Mesh(new THREE.ShapeGeometry(roundRectShape(1.05, 0.3, 0.15)), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    island.position.set(0, d.worldH / 2 - 0.26, 0.02);
    phone.add(body, scr, island); phone.userData.screen = scr;
  })();
  const laptop = new THREE.Group();
  (() => {
    const d = DEV.laptop;
    const lid = new THREE.Group();
    const lidBody = new THREE.Mesh(new THREE.ExtrudeGeometry(roundRectShape(d.worldW + 0.7, d.worldH + 0.9, 0.35), { depth: 0.22, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 3 }), [metal, metalLight]);
    lidBody.position.set(0, -0.1, -0.28);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(d.worldW, d.worldH), new THREE.MeshBasicMaterial({ map: lapScr.tex, toneMapped: false }));
    scr.position.z = 0.01;
    lid.add(lidBody, scr);
    const base = new THREE.Mesh(new THREE.BoxGeometry(d.worldW + 1.4, 0.32, 11), metalLight);
    base.position.set(0, -d.worldH / 2 - 0.62, 5.2);
    const pad = new THREE.Mesh(new THREE.BoxGeometry(5, 0.02, 3.2), metal); pad.position.set(0, -d.worldH / 2 - 0.45, 8);
    const keys = new THREE.Mesh(new THREE.BoxGeometry(d.worldW - 1, 0.02, 4.6), new THREE.MeshStandardMaterial({ color: col('#0e1014'), roughness: 0.6 })); keys.position.set(0, -d.worldH / 2 - 0.45, 3.4);
    laptop.add(lid, base, pad, keys); laptop.userData.screen = scr; laptop.userData.lid = lid;
  })();
  devScene.add(phone, laptop);
  // logo (abertura e final)
  const logoTex = new THREE.Texture(IMG[MAN.__logo]); logoTex.needsUpdate = true; logoTex.encoding = THREE.sRGBEncoding;
  const la = IMG[MAN.__logo].height / IMG[MAN.__logo].width;
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 4.4 * la), new THREE.MeshBasicMaterial({ map: logoTex, transparent: true, toneMapped: false }));
  devScene.add(logo);

  // pós-processamento
  const composer = new THREE.EffectComposer(renderer);
  composer.setPixelRatio(1); composer.setSize(OW, OH);
  const bloom = new THREE.UnrealBloomPass(new THREE.Vector2(OW, OH), 0.9, 0.6, 0.55);
  const devPass = new THREE.RenderPass(devScene, camera); devPass.clear = false;
  const fin = new THREE.ShaderPass({
    uniforms: { tDiffuse: { value: null }, uCA: { value: 0.002 }, uTime: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uCA; uniform float uTime; varying vec2 vUv;
      vec3 toSRGB(vec3 c){ c = max(c,0.0); return mix(c*12.92, 1.055*pow(c, vec3(0.41666))-0.055, step(vec3(0.0031308), c)); }
      void main(){ vec2 d = vUv-0.5; float r2 = dot(d,d); vec2 off = d*uCA*(0.4+r2*3.0);
        vec3 c = vec3(texture2D(tDiffuse, vUv+off).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv-off).b);
        c *= 1.0 - 0.5*smoothstep(0.15, 0.65, r2*1.5); c = toSRGB(c);
        gl_FragColor = vec4(c,1.0); }`,
  });
  composer.addPass(new THREE.RenderPass(envScene, camera)); composer.addPass(bloom); composer.addPass(devPass); composer.addPass(fin);

  // ---------- disposição dos aparelhos ----------
  const BASEPOS = { // posição e giro de cada aparelho por tipo de cena
    phone: { x: 0, y: 0, z: 0, ry: -0.18 }, laptop: { x: 0, y: 0.6, z: 0, ry: 0.1 },
    bothPhone: { x: -11, y: -0.6, z: 3, ry: 0.32 }, bothLaptop: { x: 4.5, y: 0.8, z: -2, ry: -0.22 },
  };
  function devState(kind, i, lt) {
    const uses = (s) => s.dev === kind || s.dev === 'both';
    const pose = (s) => (s.dev === 'both' ? (kind === 'phone' ? BASEPOS.bothPhone : BASEPOS.bothLaptop) : BASEPOS[kind]);
    const s = SHOTS[i], prev = SHOTS[i - 1];
    const T = 1.0, q = eio(clamp(lt / T));
    let vis = uses(s), pos = { ...pose(s) }, off = 0;
    if (uses(s) && prev && !uses(prev)) off = 1 - q; // entrando
    else if (!uses(s) && prev && uses(prev) && lt < T) { vis = true; pos = { ...pose(prev) }; off = -q; } // saindo
    else if (uses(s) && prev && uses(prev)) { const a = pose(prev); pos = { x: lerp(a.x, pos.x, q), y: lerp(a.y, pos.y, q), z: lerp(a.z, pos.z, q), ry: lerp(a.ry, pos.ry, q) }; }
    return { vis, pos, off };
  }
  function placeDevice(obj, st, t, kind) {
    obj.visible = st.vis;
    const sway = Math.sin(t * 0.5 + (kind === 'phone' ? 0 : 2)) * 0.05;
    const o = st.off; // >0 entrando por baixo, <0 saindo para cima
    obj.position.set(st.pos.x + o * (kind === 'phone' ? 10 : -12), st.pos.y - Math.abs(o) * 14 * (o > 0 ? 1 : -1), st.pos.z - Math.abs(o) * 8);
    obj.rotation.set(o * 0.9 + Math.sin(t * 0.37) * 0.025, st.pos.ry + sway + o * (kind === 'phone' ? -1.2 : 1.2), o * 0.25);
  }
  const tmpV = new THREE.Vector3(), tmpN = new THREE.Vector3();
  function screenPoint(dev, kind, cx, cy, out) { // px CSS da tela (com barra) -> mundo
    const d = DEV[kind];
    out.set((cx - d.cssW / 2) * d.k, -(cy - d.cssH / 2) * d.k, 0.02);
    dev.userData.screen.updateMatrixWorld(true);
    return dev.userData.screen.localToWorld(out);
  }
  function screenNormal(dev, out) { const sc = dev.userData.screen; sc.updateMatrixWorld(true); return out.set(0, 0, 1).transformDirection(sc.matrixWorld); }

  // estado da câmera para um alvo
  function camEval(shot, key, lt, ctx) {
    const [_, target, dist0, orb] = key;
    const dist = shot.dev === 'phone' && target !== 'dev' ? dist0 * 1.3 : dist0;
    const kind = shot.dev === 'both' ? 'laptop' : shot.dev;
    if (target === 'both' || shot.dev === 'none') {
      return { pos: new THREE.Vector3(Math.sin(orb || 0) * dist, 1.2, Math.cos(orb || 0) * dist), look: new THREE.Vector3(-2, 0, 0) };
    }
    const dev = kind === 'phone' ? phone : laptop, d = DEV[kind];
    let cx = d.cssW / 2, cy = d.cssH / 2;
    if (target !== 'dev') {
      const r = rectIn(ctx.info, target, ctx.scroll);
      if (r) { cx = r[0] + r[2] / 2; cy = r[1] + r[3] / 2 + d.bar; }
    }
    const look = screenPoint(dev, kind, cx, cy, new THREE.Vector3());
    const n = screenNormal(dev, new THREE.Vector3());
    const up = new THREE.Vector3(0, 1, 0);
    const side = new THREE.Vector3().crossVectors(up, n).normalize();
    const pos = look.clone().addScaledVector(n, dist * Math.cos(orb || 0)).addScaledVector(side, dist * Math.sin(orb || 0)).addScaledVector(up, dist * 0.04);
    return { pos, look };
  }
  function shotCtx(i, lt) {
    const s = SHOTS[i];
    const scroll = keyed(s.scroll, lt);
    return { info: viewInfo(viewAt(s.views, lt), lt), scroll };
  }
  function ctxFor(i, key, lt, cur) { // usa a tela atual; se o alvo não existe nela, usa a tela do momento do quadro-chave
    const t = key[1];
    if (t === 'dev' || t === 'both' || rectIn(cur.info, t, cur.scroll)) return cur;
    return shotCtx(i, key[0] + 0.5);
  }
  function camRaw(i, lt) {
    const s = SHOTS[i];
    const ctx = shotCtx(i, lt);
    let st = camEval(s, s.cam[0], lt, ctxFor(i, s.cam[0], lt, ctx));
    for (let j = 1; j < s.cam.length; j++) {
      if (lt <= s.cam[j][0]) break;
      const q = eio(clamp((lt - s.cam[j][0]) / 1.0));
      const nx = camEval(s, s.cam[j], lt, ctxFor(i, s.cam[j], lt, ctx));
      st = { pos: st.pos.lerp(nx.pos, q), look: st.look.lerp(nx.look, q) };
    }
    return st;
  }
  const FRAME = { right: [-0.2, 0], up: [0, 0.135], center: [0, 0] };
  function frameOf(i, lt) {
    const f = FRAME[SHOTS[i].frame];
    if (i > 0 && lt < 1) { const g = FRAME[SHOTS[i - 1].frame], q = eio(lt); return [lerp(g[0], f[0], q), lerp(g[1], f[1], q)]; }
    return f;
  }

  // ---------- camada 2D (legendas, rótulos) ----------
  const out2d = document.createElement('canvas');
  function T2(c, s, x, y, o = {}) {
    c.save(); c.globalAlpha *= o.a ?? 1;
    c.font = `${o.it ? 'italic ' : ''}${o.w || 600} ${o.s || 28}px ${o.f || BODY}`;
    c.fillStyle = o.c || C.fg; c.textAlign = o.al || 'left'; c.textBaseline = o.bl || 'middle';
    c.letterSpacing = (o.ls || 0) + 'px'; c.fillText(s, x, y); c.restore();
  }
  function wrap(c, text, font, maxW) {
    c.save(); c.font = font; const words = text.split(' '); const lines = []; let ln = '';
    words.forEach((w) => { const t = ln ? ln + ' ' + w : w; if (c.measureText(t).width > maxW && ln) { lines.push(ln); ln = w; } else ln = t; });
    if (ln) lines.push(ln); c.restore(); return lines;
  }
  function caption(c, cap, lt, frame) {
    const a = Math.min(eo(p(lt, cap.t0, cap.t0 + 0.45)), 1 - p(lt, cap.t1 - 0.3, cap.t1));
    if (a <= 0) return;
    const slide = (1 - eo(p(lt, cap.t0, cap.t0 + 0.5))) * -40;
    c.save(); c.globalAlpha = a;
    const left = frame === 'right';
    const x = left ? 70 + slide : 60 + slide, maxW = left ? 470 : 760;
    const titleLines = wrap(c, cap.title.toUpperCase(), `italic 900 ${left ? 52 : 46}px ${DISP}`, maxW);
    const subLines = wrap(c, cap.sub, `500 ${left ? 21 : 20}px ${BODY}`, maxW);
    const th = titleLines.length * (left ? 50 : 44), sh = subLines.length * 29;
    const h = 44 + 16 + th + 14 + sh;
    const y = left ? H / 2 - h / 2 + 10 : H - h - 46;
    // painel
    c.fillStyle = 'rgba(8,9,12,0.82)';
    c.beginPath(); c.moveTo(x - 24, y - 16); c.lineTo(x + maxW + 40, y - 16); c.lineTo(x + maxW + 20, y + h + 18); c.lineTo(x - 44, y + h + 18); c.closePath(); c.fill();
    c.fillStyle = C.y; c.fillRect(x - 24, y - 16, 6, h + 34);
    // etiqueta
    c.font = `italic 800 18px ${DISP}`; c.letterSpacing = '2.5px';
    const tw = c.measureText(cap.tag).width + 34;
    c.beginPath(); c.moveTo(x + 9, y); c.lineTo(x + tw, y); c.lineTo(x + tw - 9, y + 32); c.lineTo(x, y + 32); c.closePath(); c.fillStyle = C.y; c.fill();
    c.fillStyle = '#08090c'; c.textBaseline = 'middle'; c.fillText(cap.tag, x + 15, y + 17); c.letterSpacing = '0px';
    titleLines.forEach((l, k) => T2(c, l, x, y + 44 + 16 + k * (left ? 50 : 44) + (left ? 22 : 18), { f: DISP, it: true, w: 900, s: left ? 52 : 46 }));
    subLines.forEach((l, k) => T2(c, l, x, y + 44 + 16 + th + 14 + k * 29 + 12, { s: left ? 21 : 20, w: 500, c: '#c9cdd6' }));
    c.restore();
  }
  function tagLabel(c, text, x, y, a) {
    if (a <= 0) return;
    c.save(); c.globalAlpha = a;
    c.font = `italic 800 21px ${DISP}`; c.letterSpacing = '1px';
    const w = c.measureText(text.toUpperCase()).width + 36;
    let X = clamp(x, 20, W - w - 20), Y = clamp(y - 44, 70, H - 60);
    c.beginPath(); c.moveTo(X + 10, Y); c.lineTo(X + w, Y); c.lineTo(X + w - 10, Y + 36); c.lineTo(X, Y + 36); c.closePath();
    c.fillStyle = C.y; c.fill();
    c.fillStyle = '#08090c'; c.textBaseline = 'middle'; c.fillText(text.toUpperCase(), X + 17, Y + 19);
    c.restore();
  }
  function hudBar(c, t, i) {
    T2(c, 'ENEM', 40, 40, { f: DISP, it: true, w: 900, s: 26 });
    c.font = `italic 900 26px ${DISP}`; const ew = c.measureText('ENEM ').width;
    T2(c, 'GAMES', 40 + ew, 40, { f: DISP, it: true, w: 900, s: 26, c: C.y });
    T2(c, 'COMO USAR O APP', 166, 41, { s: 15, w: 600, c: C.muted, ls: 3 });
    const pr = t / DUR;
    c.fillStyle = 'rgba(140,147,163,0.25)'; c.fillRect(40, H - 14, W - 80, 4);
    c.fillStyle = C.y; c.fillRect(40, H - 14, (W - 80) * pr, 4);
  }
  function introOverlay(c, lt, shot) {
    const big = shot.id === 'intro';
    const a = big ? 1 : 1;
    if (big) {
      const q = eo(p(lt, 1.6, 2.3));
      c.save(); c.globalAlpha = q;
      T2(c, 'COMO USAR O APP', W / 2, 548 + (1 - q) * 20, { f: DISP, it: true, w: 900, s: 72, al: 'center' });
      c.restore();
      const q2 = eo(p(lt, 2.4, 3.0));
      c.save(); c.globalAlpha = q2;
      T2(c, 'Placar ao vivo · validação nas salas · ranking', W / 2, 606, { s: 24, w: 500, c: '#c9cdd6', al: 'center' });
      c.restore();
    } else {
      const q = back(p(lt, 1.2, 1.8));
      c.save(); c.globalAlpha = clamp(q);
      T2(c, 'BOM JOGO!', W / 2, 560, { f: DISP, it: true, w: 900, s: 96, al: 'center', c: C.y });
      c.restore();
      c.save(); c.globalAlpha = eo(p(lt, 2, 2.6));
      T2(c, 'Dúvidas no dia? Procure a organização.', W / 2, 628, { s: 24, w: 500, c: '#c9cdd6', al: 'center' });
      c.restore();
    }
  }
  function tipsOverlay(c, lt) {
    const tips = [
      ['2 TOQUES', 'Ações que apagam dados pedem confirmação.'],
      ['INTERNET', 'Use o celular conectado: tudo sincroniza na hora.'],
      ['SENHAS', 'Cada professor só precisa da senha do seu posto.'],
    ];
    T2(c, 'DICAS RÁPIDAS', W / 2, 150, { f: DISP, it: true, w: 900, s: 64, al: 'center', a: eo(p(lt, 0.3, 0.8)) });
    tips.forEach(([h, s], k) => {
      const q = back(p(lt, 1.4 + k * 1.0, 2.0 + k * 1.0));
      const x = 120 + k * 360, y = 260;
      c.save(); c.globalAlpha = clamp(q); c.translate(x + 160, y + 120); c.scale(Math.max(0.01, q), Math.max(0.01, q)); c.translate(-(x + 160), -(y + 120));
      c.fillStyle = 'rgba(17,19,25,0.92)'; c.beginPath(); c.moveTo(x + 18, y); c.lineTo(x + 330, y); c.lineTo(x + 312, y + 240); c.lineTo(x, y + 240); c.closePath(); c.fill();
      c.fillStyle = C.y; c.beginPath(); c.moveTo(x + 18, y); c.lineTo(x + 330, y); c.lineTo(x + 326, y + 8); c.lineTo(x + 17, y + 8); c.closePath(); c.fill();
      T2(c, String(k + 1), x + 40, y + 70, { f: DISP, it: true, w: 900, s: 64, c: C.y });
      T2(c, h, x + 92, y + 72, { f: DISP, it: true, w: 900, s: 40 });
      wrap(c, s, `500 22px ${BODY}`, 260).forEach((l, j) => T2(c, l, x + 40, y + 140 + j * 32, { s: 22, w: 500, c: '#c9cdd6' }));
      c.restore();
    });
  }

  // ---------- quadro ----------
  function renderFrame(t) {
    t = clamp(t, 0, DUR - 1e-3);
    const i = shotAt(t), s = SHOTS[i], lt = t - s.a;
    // aparelhos
    const ps = devState('phone', i, lt), ls = devState('laptop', i, lt);
    placeDevice(phone, ps, t, 'phone'); placeDevice(laptop, ls, t, 'laptop');
    laptop.userData.lid.rotation.x = -0.08;
    // conteúdo das telas (o aparelho que está saindo mantém a última tela)
    const fill = (scr, kind, st) => {
      if (!st.vis) return;
      let si = i, slt = lt;
      if (!(s.dev === kind || s.dev === 'both')) { si = i - 1; slt = SHOTS[si].d; }
      const sh = SHOTS[si];
      const isPhoneInBoth = sh.dev === 'both' && kind === 'phone';
      const views = isPhoneInBoth ? sh.phoneViews : sh.views;
      const scroll = keyed(isPhoneInBoth ? sh.phoneScroll : sh.scroll, slt);
      const info = viewInfo(viewAt(views, slt), slt);
      const extra = {};
      if (!isPhoneInBoth) {
        extra.hl = sh.hl.map((h) => ({ r: rectIn(info, h.r, scroll), a: Math.min(eo(p(slt, h.t0, h.t0 + 0.35)), 1 - p(slt, h.t1 - 0.3, h.t1)) }));
        extra.taps = sh.taps.map((tp) => ({ r: rectIn(viewInfo(viewAt(views, tp.t), tp.t), tp.r, keyed(sh.scroll, tp.t)), q: p(slt, tp.t - 0.35, tp.t + 0.6) }));
        if (sh.toast) extra.toast = { text: sh.toast.text, kind: sh.toast.kind, a: Math.min(eo(p(slt, sh.toast.t0, sh.toast.t0 + 0.25)), 1 - p(slt, sh.toast.t1 - 0.25, sh.toast.t1)) };
      }
      drawScreen(scr, info, scroll, slt, sh, kind, extra);
    };
    fill(phoneScr, 'phone', ps); fill(lapScr, 'laptop', ls);
    // logo
    const logoShot = s.dev === 'none' ? s : null;
    logo.visible = !!logoShot || (i > 0 && SHOTS[i - 1].dev === 'none' && lt < 1);
    if (logo.visible) {
      if (logoShot) { const q = back(p(lt, 0.2, 1.2)); logo.scale.setScalar(Math.max(0.01, q)); logo.position.set(0, 3.1 + (1 - q) * 3, 0); logo.rotation.set(0, (1 - q) * 2.5 + Math.sin(lt * 0.9) * 0.18, 0); }
      else { const q = eio(lt); logo.position.set(0, 2.2 + q * 10, -q * 10); logo.rotation.y = q * 1.5; }
    }
    // câmera
    let cs = camRaw(i, lt);
    if (i > 0 && lt < 1) { const pc = camRaw(i - 1, SHOTS[i - 1].d), q = eio(lt); cs = { pos: pc.pos.lerp(cs.pos, q), look: pc.look.lerp(cs.look, q) }; }
    if (s.dev === 'none') cs = { pos: new THREE.Vector3(Math.sin(lt * 0.3) * 1.2, 1.4, 17 - lt * 0.4), look: new THREE.Vector3(0, 1.0, 0) };
    camera.position.copy(cs.pos); camera.lookAt(cs.look);
    const [fx, fy] = frameOf(i, lt);
    camera.setViewOffset(OW, OH, fx * OW, fy * OH, OW, OH);
    // estúdio
    floorMat.uniforms.uTime.value = t; pmat.uniforms.uTime.value = t;
    slabs.forEach((m) => m.material.color.copy(m.userData.base).multiplyScalar(0.75 + 0.35 * Math.sin(t * 1.3 + m.userData.ph)));
    bars.forEach((m) => { const u = m.userData; m.position.set(u.x + Math.sin(t * u.sp + u.ph) * 1.2, u.y + Math.sin(t * u.sp * 1.3 + u.ph) * 0.8, u.z); m.rotation.y = t * u.sp; });
    const trans = i > 0 && lt < 1 ? Math.sin(eio(lt) * Math.PI) : 0;
    fin.uniforms.uCA.value = 0.002 + trans * 0.012;
    bloom.strength = 0.85 + trans * 0.4;
    composer.render();
    // composição final + 2D
    const c = out2d.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.drawImage(renderer.domElement, 0, 0, out2d.width, out2d.height);
    c.setTransform(out2d.width / W, 0, 0, out2d.height / H, 0, 0);
    if (s.dev === 'none') introOverlay(c, lt, s);
    if (s.id === 'dicas') tipsOverlay(c, lt);
    // rótulos dos destaques, presos ao elemento na tela
    if (s.dev !== 'none' && s.dev !== 'both' || s.id === 'sync') {
      const kind = s.dev === 'both' ? 'laptop' : s.dev;
      const dev = kind === 'phone' ? phone : laptop;
      const ctx = shotCtx(i, lt);
      s.hl.forEach((h) => {
        const a = Math.min(eo(p(lt, h.t0 + 0.15, h.t0 + 0.5)), 1 - p(lt, h.t1 - 0.3, h.t1));
        if (a <= 0 || !h.label) return;
        const r = rectIn(ctx.info, h.r, ctx.scroll); if (!r) return;
        const d = DEV[kind];
        const wp = screenPoint(dev, kind, r[0], r[1] + d.bar, new THREE.Vector3());
        wp.project(camera);
        const x = (wp.x * 0.5 + 0.5) * W, y = (-wp.y * 0.5 + 0.5) * H;
        tagLabel(c, h.label, x, y, a);
      });
    }
    s.caps.forEach((cap) => caption(c, cap, lt, s.frame));
    hudBar(c, t, i);
  }
  function setSize(w, h) {
    OW = w; OH = h; renderer.setSize(w, h, false); composer.setSize(w, h); bloom.setSize(w, h);
    camera.aspect = w / h; camera.updateProjectionMatrix(); pmat.uniforms.uScale.value = h / 2;
    out2d.width = w; out2d.height = h;
  }
  setSize(1920, 1080);
  window.APPVIDEO = { DUR, CUES, SHOTS: SHOTS.map(({ id, a, b }) => ({ id, a, b })), renderFrame, setSize, canvas: out2d };
  window.__renderAt = (t, scale = 1.5) => {
    const w = Math.round(1280 * scale), h = Math.round(720 * scale);
    if (w !== OW) setSize(w, h);
    renderFrame(t);
    return out2d.toDataURL('image/jpeg', 0.92);
  };
  window.__ready = true;
})().catch((e) => { console.error('erro no vídeo', e); window.__error = String(e && e.stack || e); });
