// Exporta enem-games.mp4 (1920x1080, 30 fps) a partir de enem-games.html.
// Uso: node src/render.mjs   (requer playwright + ffmpeg)
import { createRequire } from 'node:module';
// playwright pode estar instalado globalmente: rode com NODE_PATH=$(npm root -g)
const { chromium } = createRequire(import.meta.url)('playwright');
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FPS = 30, SCALE = 1.5;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
await page.goto('file://' + path.join(root, 'enem-games.html'));
await page.evaluate(() => document.fonts.ready);
const DUR = await page.evaluate(() => window.EnemGames.DUR);

const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
  '-i', path.join(root, 'build', 'trilha.wav'),
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
  '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart',
  path.join(root, 'enem-games.mp4')], { stdio: ['pipe', 'inherit', 'inherit'] });

const total = Math.round(FPS * DUR);
for (let f = 0; f < total; f++) {
  const url = await page.evaluate(([t, s]) => window.__renderAt(t, s), [f / FPS, SCALE]);
  const buf = Buffer.from(url.split(',')[1], 'base64');
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  if (f % 150 === 0) console.log(`quadro ${f}/${total}`);
}
ff.stdin.end();
await new Promise((r) => ff.on('close', r));
await browser.close();
console.log('ok enem-games.mp4');
