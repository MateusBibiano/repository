// Exporta enem-games.mp4 (1920x1080, 30 fps) a partir de enem-games.html, com o palco 3D.
// Uso: NODE_PATH=$(npm root -g) node src/render.mjs [--workers 3] [--stills 4.5,12,30 --out pasta]
// Requer playwright + ffmpeg. As bibliotecas do CDN são servidas de build/vendor (gerado por build.py).
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const { chromium } = createRequire(import.meta.url)('playwright');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const vendor = path.join(root, 'build', 'vendor');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const FPS = 30, SCALE = 1.5;
const WORKERS = +arg('--workers', 3);

async function openPage(browser) {
  const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  page.on('pageerror', (e) => console.error('pageerror', e.message));
  await page.route('https://cdn.jsdelivr.net/npm/three@0.128.0/**', (r) => {
    const rel = new URL(r.request().url()).pathname.replace('/npm/three@0.128.0/', '');
    r.fulfill({ path: path.join(vendor, 'three', rel), contentType: 'application/javascript' });
  });
  await page.route('https://cdnjs.cloudflare.com/ajax/libs/opentype.js/1.3.4/opentype.min.js', (r) => r.fulfill({ path: path.join(vendor, 'opentype', 'dist', 'opentype.min.js'), contentType: 'application/javascript' }));
  await page.goto('file://' + path.join(root, 'enem-games.html'));
  await page.evaluate(() => document.fonts.ready);
  if (!(await page.evaluate(() => window.__is3D()))) throw new Error('palco 3D não iniciou');
  return page;
}
const launch = () => chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

const stills = arg('--stills');
if (stills) {
  const out = arg('--out', path.join(root, 'build', 'stills'));
  fs.mkdirSync(out, { recursive: true });
  const b = await launch(); const page = await openPage(b);
  for (const t of stills.split(',')) {
    const url = await page.evaluate(([tt, s]) => window.__renderAt(tt, s), [+t, 1]);
    fs.writeFileSync(path.join(out, `s_${String(t).padStart(6, '0')}.jpg`), Buffer.from(url.split(',')[1], 'base64'));
  }
  await b.close();
  console.log('ok stills', out);
  process.exit(0);
}

const b0 = await launch(); const p0 = await openPage(b0);
const DUR = await p0.evaluate(() => window.EnemGames.DUR);
await b0.close();
const total = Math.round(FPS * DUR);
const per = Math.ceil(total / WORKERS);
const parts = [];
const t0 = Date.now();
await Promise.all(Array.from({ length: WORKERS }, async (_, w) => {
  const f0 = w * per, f1 = Math.min(total, f0 + per);
  const file = path.join(root, 'build', `part${w}.mp4`); parts.push(file);
  const browser = await launch(); const page = await openPage(browser);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', file], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let f = f0; f < f1; f++) {
    const url = await page.evaluate(([t, s]) => window.__renderAt(t, s), [f / FPS, SCALE]);
    const buf = Buffer.from(url.split(',')[1], 'base64');
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if ((f - f0) % 150 === 0) console.log(`worker ${w}: ${f - f0}/${f1 - f0} (${Math.round((Date.now() - t0) / 1000)}s)`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  await browser.close();
}));
parts.sort();
const list = path.join(root, 'build', 'parts.txt');
fs.writeFileSync(list, parts.map((p) => `file '${p}'`).join('\n'));
await new Promise((res, rej) => spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list,
  '-i', path.join(root, 'build', 'trilha.wav'), '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart',
  path.join(root, 'build', 'master.mp4')], { stdio: 'inherit' }).on('close', (c) => (c ? rej(new Error('ffmpeg ' + c)) : res())));
// versão final: tira o grão (que pesa muito na compressão) e limita a taxa para ~55 MB
await new Promise((res, rej) => spawn('ffmpeg', ['-y', '-loglevel', 'error', '-i', path.join(root, 'build', 'master.mp4'),
  '-vf', 'hqdn3d=2:2:8:8', '-c:v', 'libx264', '-preset', 'slow', '-crf', '23', '-maxrate', '2.2M', '-bufsize', '4.4M', '-pix_fmt', 'yuv420p',
  '-c:a', 'copy', '-movflags', '+faststart', path.join(root, 'enem-games.mp4')], { stdio: 'inherit' }).on('close', (c) => (c ? rej(new Error('ffmpeg ' + c)) : res())));
console.log('ok enem-games.mp4', Math.round((Date.now() - t0) / 1000) + 's');
