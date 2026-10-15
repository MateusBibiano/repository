// Grava as telas do app ENEM Games (Firestore falso + relógio controlado) para o vídeo explicativo.
// Uso: NODE_PATH=$(npm root -g) node capture/capture.mjs <caminho/do/index.html> <pasta-de-saída>
// Gera PNGs e um manifest.json com os retângulos (px CSS) dos elementos usados para toques e destaques.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { seed, T0, PINS } from './seed.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');

const [APP, OUT] = process.argv.slice(2);
fs.mkdirSync(OUT, { recursive: true });
const here = path.dirname(new URL(import.meta.url).pathname);
const FONTS = path.join(here, '..', 'src', 'fonts');
const M = 60000;
const FONT_CSS = [['italic', 700, 'BoldItalic'], ['italic', 800, 'ExtraBoldItalic'], ['italic', 900, 'BlackItalic'], ['normal', 700, 'Bold'], ['normal', 800, 'ExtraBold'], ['normal', 900, 'Black']]
  .map(([st, w, f]) => `@font-face{font-family:"Barlow Condensed";font-style:${st};font-weight:${w};src:url(http://fonts.local/BarlowCondensed-${f}.ttf)}`).join('\n')
  + '\n@font-face{font-family:"Saira";font-weight:100 900;src:url(http://fonts.local/Saira.ttf)}';

const manifest = {};
const browser = await chromium.launch();

async function open({ phone = false, tab = 'painel', data = seed(), local = {} } = {}) {
  const ctx = await browser.newContext(phone ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('pageerror', e.message));
  await page.clock.install({ time: T0 });
  await page.addInitScript(([s, tab, local]) => {
    window.__SEED = s; localStorage.setItem('eg_tab', tab);
    Object.entries(local).forEach(([k, v]) => localStorage.setItem(k, v));
  }, [data, tab, local]);
  await page.route('https://www.gstatic.com/firebasejs/**', (r) => (r.request().url().includes('app-compat')
    ? r.fulfill({ path: path.join(here, 'fake-firebase.js'), contentType: 'application/javascript' })
    : r.fulfill({ body: '', contentType: 'application/javascript' })));
  await page.route('https://fonts.googleapis.com/**', (r) => r.fulfill({ body: FONT_CSS, contentType: 'text/css' }));
  await page.route('http://fonts.local/**', (r) => r.fulfill({ path: path.join(FONTS, new URL(r.request().url()).pathname.slice(1)), contentType: 'font/ttf' }));
  await page.goto('file://' + APP);
  await settle(page, 1500);
  await page.evaluate(() => document.fonts.ready);
  return { ctx, page, phone };
}
async function settle(page, ms = 300) { await page.clock.runFor(ms); await page.waitForTimeout(350); }
// retângulo de um elemento em px CSS absolutos da página
async function rect(page, sel, nth = 0) {
  return page.evaluate(([sel, nth]) => {
    const el = typeof sel === 'string' ? document.querySelectorAll(sel)[nth] : null;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return [Math.round(r.x + scrollX), Math.round(r.y + scrollY), Math.round(r.width), Math.round(r.height)];
  }, [sel, nth]);
}
async function rectByText(page, sel, text) {
  return page.evaluate(([sel, text]) => {
    const el = [...document.querySelectorAll(sel)].find((e) => e.textContent.includes(text));
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return [Math.round(r.x + scrollX), Math.round(r.y + scrollY), Math.round(r.width), Math.round(r.height)];
  }, [sel, text]);
}
async function shot(s, id, rects = {}, maxH = 1900, y0 = 0) {
  const { page, phone } = s;
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  const W = phone ? 390 : 1440;
  y0 = Math.max(0, Math.min(Math.round(y0), h - 300));
  const H = Math.min(h - y0, maxH);
  const file = id + '.png';
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(OUT, file), fullPage: true, clip: { x: 0, y: y0, width: W, height: H } });
  const r = {};
  for (const [k, v] of Object.entries(rects)) r[k] = v;
  manifest[id] = { file, w: W, h: H, y0, dsf: phone ? 2 : 1.5, device: phone ? 'phone' : 'laptop', rects: r };
  console.log('shot', id, H);
  return manifest[id];
}
async function flip(s, id, steps, stepMs, maxH, extra) { // sequência de quadros com o relógio avançando
  const files = [];
  for (let i = 0; i < steps; i++) {
    if (i) await settle(s.page, stepMs);
    const m = await shot(s, `${id}_${String(i).padStart(2, '0')}`, {}, maxH);
    files.push(m.file); delete manifest[`${id}_${String(i).padStart(2, '0')}`];
  }
  manifest[id] = { files, y0: 0, w: s.phone ? 390 : 1440, h: null, dsf: s.phone ? 2 : 1.5, device: s.phone ? 'phone' : 'laptop', rects: extra || {} };
  const dims = await s.page.evaluate(() => document.documentElement.scrollHeight);
  manifest[id].h = Math.min(dims, maxH);
}
const tap = async (s, sel, nth = 0) => { await s.page.locator(sel).nth(nth).click(); await settle(s.page, 300); };

// ===================== PAINEL (notebook) =====================
{
  const data = seed();
  const s = await open({ tab: 'painel', data });
  const rects = {
    tabs: await rect(s.page, 'nav.tabs'), tabPainel: await rect(s.page, '#tab-painel'), tabPosto: await rect(s.page, '#tab-posto'), tabAdmin: await rect(s.page, '#tab-admin'),
    live: await rect(s.page, '#live'), heroN: await rect(s.page, '.hero-n'), nowgrid: await rect(s.page, '.nowgrid'),
    nowMat: await rect(s.page, '.now', 0), teams: await rect(s.page, '.teams'), team1: await rect(s.page, '.team', 0),
    team4: await rect(s.page, '.team', 3), wait4: await rect(s.page, '.team .st.wait', 0), legend: await rect(s.page, '.legend'),
    dots1: await rect(s.page, '.team .dots', 0), team11: await rect(s.page, '.team', 10),
  };
  await flip(s, 'painel', 16, 1000, 1700, rects); // relógios andando, ao vivo
  // atualização ao vivo: a Equipe 11 conclui Matemática (mesma validação feita no celular)
  await s.page.evaluate(() => window.__fs.set('runs/t11__mat', { team: 't11', station: 'mat', status: 'running', start: Date.now() - 8 * 60000 - 46000 }));
  await settle(s.page, 400);
  await shot(s, 'painel_live_a', { team11: rects.team11, heroN: rects.heroN }, 1700);
  await s.page.evaluate(() => { const r = window.__fs.get('runs/t11__mat'); const end = Date.now(); window.__fs.set('runs/t11__mat', Object.assign({}, r, { status: 'done', end, dur: end - r.start })); });
  await settle(s.page, 400);
  await shot(s, 'painel_live_b', { team11: rects.team11, heroN: rects.heroN }, 1700);
  await s.ctx.close();
}

// ===================== MEU POSTO (celular) =====================
{
  const data = seed();
  // Matemática: Equipe 3 em andamento há 3 min; Equipe 11 ainda não fez Matemática
  data['runs/t03__mat'] = { team: 't03', station: 'mat', status: 'running', start: T0 - 3 * M - 10000 };
  delete data['runs/t11__mat'];
  const s = await open({ phone: true, tab: 'posto', data });
  await shot(s, 'posto_pick', { mat: await rect(s.page, '[data-pick="mat"]'), title: await rect(s.page, '.section-h') }, 1300);
  await tap(s, '[data-pick="mat"]');
  await s.page.locator('#pin').scrollIntoViewIfNeeded();
  const loginR = await rect(s.page, '.login');
  await s.page.fill('#pin', PINS.mat);
  await settle(s.page, 200);
  manifest.__loginScroll = loginR;
  await shot(s, 'posto_login', { login: loginR, pin: await rect(s.page, '#pin'), unlock: await rect(s.page, '#unlock') }, 3200);
  await tap(s, '#unlock');
  await settle(s.page, 3200); // espera o aviso "Posto liberado" sumir
  await s.page.evaluate(() => window.scrollTo(0, 0));
  const t11btn = await s.page.evaluate(() => [...document.querySelectorAll('.qt')].findIndex((c) => c.textContent.includes('11 · Equipe 11')));
  await shot(s, 'posto_open', {
    hero: await rect(s.page, '.station-hero'), chips: await rect(s.page, '.station-hero .row'),
    qrun: await rect(s.page, '.qt.run'), q11: await rect(s.page, '.qt', t11btn),
    start11: await rect(s.page, `.qt:nth-child(${t11btn + 1}) [data-act="start"]`),
    away: await rect(s.page, '.qt.away'), cooling: await rect(s.page, '.qt.cooling'), locked: await rect(s.page, '.qt.locked'),
    done: await rect(s.page, '.qt.done'),
  }, 1900);
  // iniciar o tempo da Equipe 11
  await s.page.locator(`.qt:nth-child(${t11btn + 1}) [data-act="start"]`).click();
  await settle(s.page, 300);
  const r11 = async () => s.page.evaluate(() => { const i = [...document.querySelectorAll('.qt')].findIndex((c) => c.textContent.includes('11 · Equipe 11')); return i; });
  let i11 = await r11();
  await shot(s, 'posto_started', { toast: await rect(s.page, '#toast'), q11: await rect(s.page, '.qt', i11), q3: await rect(s.page, '.qt', 0) }, 1100);
  // cronômetro: 0 -> ~8:45 (amarelo -> laranja); a Equipe 3 passa de 10 min (vermelho)
  await flip(s, 'posto_clock', 36, 14600, 1100, { q11: await rect(s.page, '.qt', i11), q3: await rect(s.page, '.qt', 0), clock11: await rect(s.page, '.qt .clock', 1), clock3: await rect(s.page, '.qt .clock', 0) });
  i11 = await r11();
  const doneBtn = await rect(s.page, `.qt:nth-child(${i11 + 1}) [data-act="done"]`);
  manifest.posto_clock.rects.doneBtn = doneBtn;
  manifest.posto_clock.rects.failBtn3 = await rect(s.page, '.qt:nth-child(1) [data-act="fail"]');
  manifest.posto_clock.rects.cancelBtn3 = await rect(s.page, '.qt:nth-child(1) [data-act="cancel"]');
  await s.page.locator(`.qt:nth-child(${i11 + 1}) [data-act="done"]`).click();
  await settle(s.page, 300);
  const iDone = await s.page.evaluate(() => [...document.querySelectorAll('.qt')].findIndex((c) => c.textContent.includes('11 · Equipe 11')));
  const q11d = await rect(s.page, '.qt', iDone);
  await shot(s, 'posto_done', { q11: q11d, undo: await rect(s.page, `.qt:nth-child(${iDone + 1}) [data-act="undo"]`) }, 1100, q11d[1] - 520);
  // desfazer: primeiro toque arma a confirmação
  await s.page.locator(`.qt:nth-child(${iDone + 1}) [data-act="undo"]`).click();
  await settle(s.page, 200);
  await shot(s, 'posto_undo_armed', { q11: q11d, undo: await rect(s.page, `.qt:nth-child(${iDone + 1}) [data-act="undo"]`) }, 1100, q11d[1] - 520);
  await settle(s.page, 4000); // a confirmação expira sozinha
  // cancelar (Equipe 3) armado
  await s.page.evaluate(() => window.scrollTo(0, 0));
  await s.page.locator('.qt:nth-child(1) [data-act="cancel"]').click(); await settle(s.page, 200);
  await shot(s, 'posto_cancel_armed', { q3: await rect(s.page, '.qt', 0), cancel: await rect(s.page, '.qt:nth-child(1) [data-act="cancel"]') }, 1100);
  await settle(s.page, 4000);
  // não concluiu (Equipe 3): dois toques
  await s.page.locator('.qt:nth-child(1) [data-act="fail"]').click(); await settle(s.page, 200);
  await shot(s, 'posto_fail_armed', { q3: await rect(s.page, '.qt', 0), fail: await rect(s.page, '.qt:nth-child(1) [data-act="fail"]') }, 1100);
  await s.page.locator('.qt:nth-child(1) [data-act="fail"]').click(); await settle(s.page, 300);
  const iCool = await s.page.evaluate(() => [...document.querySelectorAll('.qt')].findIndex((c) => c.textContent.includes('3 · Equipe 3')));
  await shot(s, 'posto_failed', { toast: await rect(s.page, '#toast'), q3: await rect(s.page, '.qt', iCool) }, 1100);
  await flip(s, 'posto_cool', 24, 25000, 1100, { q3: await rect(s.page, '.qt', iCool) });
  await settle(s.page, 40000);
  const iAgain = await s.page.evaluate(() => [...document.querySelectorAll('.qt')].findIndex((c) => c.textContent.includes('3 · Equipe 3')));
  await s.page.evaluate(() => window.scrollTo(0, 0));
  await shot(s, 'posto_retry', { q3: await rect(s.page, '.qt', iAgain), retry: await rect(s.page, `.qt:nth-child(${iAgain + 1}) [data-act="start"]`) }, 1500);
  await s.ctx.close();
}

// ===================== ESPORTIVO (celular) =====================
{
  const data = seed();
  // Equipes 6 e 7: Natureza completa, esportivo ainda não feito (liberado)
  for (const t of ['t06', 't07']) {
    delete data['runs/' + t + '__ef2'];
    ['qui', 'fis', 'bio'].forEach((st, k) => { if (!data['runs/' + t + '__' + st] || data['runs/' + t + '__' + st].status !== 'done') data['runs/' + t + '__' + st] = { team: t, station: st, status: 'done', start: T0 - (60 - k * 12) * M, end: T0 - (53 - k * 12) * M, dur: 7 * M }; });
  }
  const s = await open({ phone: true, tab: 'posto', data, local: { eg_station: 'ef2', eg_unlocked: JSON.stringify({ ef2: PINS.ef2 }) } });
  await shot(s, 'esportivo', {
    hero: await rect(s.page, '.station-hero'), rule: await rect(s.page, '.unlock-rule'),
    open: await rectByText(s.page, '.qt', 'Liberado'),
  }, 1300);
  const lk = await rect(s.page, '.qt.locked');
  await shot(s, 'esportivo_locked', { locked: lk, lockedNeed: await rect(s.page, '.qt.locked .need'), locked2: await rect(s.page, '.qt.locked', 1) }, 1100, lk[1] - 300);
  await s.ctx.close();
}

// ===================== ORGANIZAÇÃO (notebook) =====================
{
  const data = seed();
  const s = await open({ tab: 'admin', data });
  await s.page.fill('#orgpin', PINS.org);
  await settle(s.page, 200);
  await shot(s, 'org_login', { login: await rect(s.page, '.login'), pin: await rect(s.page, '#orgpin'), enter: await rect(s.page, '#orgin') }, 900);
  await tap(s, '#orgin');
  await shot(s, 'org_ranking', { subtabs: await rect(s.page, '.subtabs'), podium: await rect(s.page, '.podium'), table: await rect(s.page, '.tablewrap'), crit: await rect(s.page, '.section-h p') }, 1500);
  const sub = async (k) => { await tap(s, `[data-sub="${k}"]`); };
  await sub('acesso');
  await shot(s, 'org_acesso', { pick: await rect(s.page, '.pick'), fis: await rect(s.page, '[data-orggo="fis"]'), sub: await rect(s.page, '[data-sub="acesso"]') }, 1100);
  await tap(s, '[data-orggo="fis"]');
  await shot(s, 'org_via', { hero: await rect(s.page, '.station-hero'), chip: await rectByText(s.page, '.station-hero .chip', 'Acesso da organização') }, 1100);
  await tap(s, '#backorg');
  await sub('equipes');
  await shot(s, 'org_equipes', { qty: await rect(s.page, '.admin-grid .card', 0), names: await rect(s.page, '.admin-grid .card', 1), sub: await rect(s.page, '[data-sub="equipes"]') }, 1100);
  await sub('postos');
  await shot(s, 'org_postos', { pins: await rect(s.page, '.admin-grid .card', 0), names: await rect(s.page, '.admin-grid .card', 1), sub: await rect(s.page, '[data-sub="postos"]') }, 1100);
  await sub('evento');
  await tap(s, '#reset');
  await shot(s, 'org_evento', { resumo: await rect(s.page, '.admin-grid .card', 0), reset: await rect(s.page, '.admin-grid .card', 1), resetBtn: await rect(s.page, '#reset'), sair: await rect(s.page, '.admin-grid .card', 2), sub: await rect(s.page, '[data-sub="evento"]') }, 1100);
  await s.ctx.close();
}

// logo do app (para a abertura do vídeo)
{
  const html = fs.readFileSync(APP, 'utf8');
  const m = html.match(/const LOGO = "data:image\/webp;base64,([^"]+)"/);
  if (m) { fs.writeFileSync(path.join(OUT, 'logo.webp'), Buffer.from(m[1], 'base64')); manifest.__logo = 'logo.webp'; }
}
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1));
await browser.close();
console.log('ok', Object.keys(manifest).length, 'capturas');
