// Renders the promo videos frame by frame (virtual time) and encodes them with ffmpeg.
// Usage: node tools/promo/capture.mjs <outDir> [v|h|both] [seconds]
// Needs: a static server on :8790 serving the repo root, ffmpeg with libx264, tools/promo/music.wav
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
const here = path.dirname(new URL(import.meta.url).pathname);
const out = process.argv[2] || here;
const which = process.argv[3] || 'both';
const secs = +(process.argv[4] || 30);
const FPS = 30;
const vt = fs.readFileSync(path.join(here, 'vt.js'), 'utf8');
const music = path.join(here, 'music.wav');
const modes = which === 'both' ? ['v', 'h'] : [which];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
for (const mode of modes) {
  const vp = mode === 'v' ? { width: 405, height: 720, dpr: 1080 / 405 } : { width: 960, height: 540, dpr: 2 };
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.dpr });
  page.on('pageerror', e => console.log('pageerror', e.message));
  page.on('console', m => { if (m.type() === 'error') console.log('console', m.text()); });
  await page.addInitScript(vt);
  await page.goto(`http://localhost:8790/tools/promo/director.html?mode=${mode}`);
  await page.evaluate(() => window.__ready);
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.__warmup(45));
  const file = path.join(out, mode === 'v' ? 'idle-streamer-ad-vertical-1080x1920.mp4' : 'idle-streamer-ad-horizontal-1920x1080.mp4');
  const args = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-'];
  if (fs.existsSync(music)) args.push('-i', music);
  args.push('-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-movflags', '+faststart');
  if (fs.existsSync(music)) args.push('-c:a', 'aac', '-b:a', '192k', '-shortest');
  args.push(file);
  const ff = spawn('ffmpeg', args, { stdio: ['pipe', 'inherit', 'inherit'] });
  const total = Math.round(secs * FPS);
  const t0 = Date.now();
  for (let f = 0; f < total; f++) {
    await page.evaluate((f) => window.__frame(f), f);
    const buf = await page.screenshot({ type: 'jpeg', quality: 93 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 150 === 0) console.log(mode, 'frame', f, '/', total, Math.round((Date.now() - t0) / 1000) + 's');
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  console.log('wrote', file);
  await page.close();
}
await browser.close();
