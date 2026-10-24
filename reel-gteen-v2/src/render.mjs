// Renderiza o reel narrado (1080x1920, 30 fps) a partir de build/reel2.html.
// Uso: NODE_PATH=$(npm root -g) node src/render.mjs [--workers 3] [--stills 3,10,20 --out pasta]
// Antes: python3 src/voice.py <modelo>  e  python3 src/build.py
import { createRequire } from 'node:module';
import { spawn, spawnSync } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const { chromium } = createRequire(import.meta.url)('playwright');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const FPS = 30, SCALE = 1, WORKERS = +arg('--workers', 3);
const TYPES = { '.html': 'text/html', '.js': 'application/javascript', '.png': 'image/png', '.webp': 'image/webp', '.ttf': 'font/ttf', '.json': 'application/json', '.jpg': 'image/jpeg', '.glb': 'model/gltf-binary', '.obj': 'text/plain' };

const server = http.createServer((req, res) => {
  const f = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const URL0 = `http://127.0.0.1:${server.address().port}/build/reel2.html`;
const launch = () => chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
async function openPage(b) {
  const page = await b.newPage({ viewport: { width: 600, height: 1000 } });
  page.on('pageerror', (e) => console.error('pageerror', e.message));
  page.on('console', (m) => { if (m.type() === 'error') console.error('console', m.text()); });
  await page.goto(URL0);
  await page.waitForFunction(() => window.__ready || window.__error, null, { timeout: 120000 });
  const err = await page.evaluate(() => window.__error);
  if (err) throw new Error(err);
  return page;
}
const grab = async (page, t, s) => Buffer.from((await page.evaluate(([t, s]) => window.__renderAt(t, s), [t, s])).split(',')[1], 'base64');

const stills = arg('--stills');
if (stills) {
  const out = arg('--out', path.join(root, 'build', 'stills'));
  fs.mkdirSync(out, { recursive: true });
  const b = await launch(); const page = await openPage(b);
  for (const t of stills.split(',')) fs.writeFileSync(path.join(out, `s_${String(t).padStart(6, '0')}.jpg`), await grab(page, +t, 1));
  await b.close(); server.close();
  console.log('ok stills', out);
  process.exit(0);
}

// trilha a partir das cues
const b0 = await launch(); const p0 = await openPage(b0);
const { DUR, CUES, VAT } = await p0.evaluate(() => ({ DUR: window.REEL.DUR, CUES: window.REEL.CUES, VAT: window.REEL.VOICE_AT }));
await b0.close();
fs.writeFileSync(path.join(root, 'build', 'cues.json'), JSON.stringify({ dur: DUR, cues: CUES, voice_at: VAT }));
spawnSync('python3', [path.join(root, 'src', 'audio.py'), path.join(root, 'build', 'cues.json'), path.join(root, 'build', 'voice'), path.join(root, 'build', 'trilha.wav')], { stdio: 'inherit' });

const total = Math.round(FPS * DUR), per = Math.ceil(total / WORKERS), parts = [], t0 = Date.now();
await Promise.all(Array.from({ length: WORKERS }, async (_, w) => {
  const f0 = w * per, f1 = Math.min(total, f0 + per);
  const file = path.join(root, 'build', `part${w}.mp4`); parts[w] = file;
  const b = await launch(); const page = await openPage(b);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', file], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let f = f0; f < f1; f++) {
    const buf = await grab(page, f / FPS, SCALE);
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if ((f - f0) % 150 === 0) console.log(`worker ${w}: ${f - f0}/${f1 - f0} (${Math.round((Date.now() - t0) / 1000)}s)`);
  }
  ff.stdin.end(); await new Promise((r) => ff.on('close', r)); await b.close();
}));
server.close();
const list = path.join(root, 'build', 'parts.txt');
fs.writeFileSync(list, parts.map((p) => `file '${p}'`).join('\n'));
const run = (args) => new Promise((res, rej) => spawn('ffmpeg', args, { stdio: 'inherit' }).on('close', (c) => (c ? rej(new Error('ffmpeg ' + c)) : res())));
await run(['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-i', path.join(root, 'build', 'trilha.wav'), '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-shortest', path.join(root, 'build', 'master.mp4')]);
await run(['-y', '-loglevel', 'error', '-i', path.join(root, 'build', 'master.mp4'), '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-maxrate', '8M', '-bufsize', '16M', '-r', '30', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-movflags', '+faststart', path.join(root, 'reel-voz-visivel-narrado.mp4')]);
console.log('ok reel-voz-visivel-narrado.mp4', Math.round((Date.now() - t0) / 1000) + 's');
