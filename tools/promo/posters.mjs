// Renders the Google Ads image assets (English) from real game captures.
// node tools/promo/posters.mjs <capturesDir> <outDir>
// capturesDir must contain: room-grandma.png, room-mansion.png, phone-mansion.png, phone-rank1.png, phone-fans.png
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const [capDir, outDir] = process.argv.slice(2);
const b64 = (f, mime = 'image/png') => `data:${mime};base64,${fs.readFileSync(f).toString('base64')}`;
const img = (n) => b64(path.join(capDir, n));
const icon = b64(path.join(root, 'store/icon-512.png'));
const font = (w) => b64(path.join(root, `web/fonts/fredoka-${w}.woff2`), 'font/woff2');
const nunito = b64(path.join(root, 'web/fonts/nunito-800.woff2'), 'font/woff2');

const CSS = `
@font-face { font-family: Fredoka; font-weight: 700; src: url(${font(700)}) format('woff2'); }
@font-face { font-family: Fredoka; font-weight: 600; src: url(${font(600)}) format('woff2'); }
@font-face { font-family: Nunito; font-weight: 800; src: url(${nunito}) format('woff2'); }
* { box-sizing: border-box; }
html, body { margin: 0; overflow: hidden; }
body { position: relative; font-family: Fredoka, sans-serif; color: #fff;
  background: radial-gradient(110% 90% at 50% 30%, #6a35e0 0%, #34187a 45%, #120a2a 100%); }
.rays { position: absolute; left: 50%; top: 45%; width: 3000px; height: 3000px; margin: -1500px 0 0 -1500px; border-radius: 50%;
  background: repeating-conic-gradient(rgba(255,255,255,.055) 0 8deg, transparent 8deg 16deg); }
.star { position: absolute; width: 30px; height: 30px; }
.h { position: absolute; font-weight: 700; text-transform: uppercase; line-height: .98; text-align: center; letter-spacing: .5px;
  text-shadow: 0 5px 0 #2a1060, 0 10px 26px rgba(0,0,0,.45); }
.h em { font-style: normal; color: #ffd23f; }
.h i { font-style: normal; color: #ff7ab6; }
.card { position: absolute; border-radius: 26px; overflow: hidden; border: 6px solid #fff; box-shadow: 0 22px 50px rgba(0,0,0,.55); background: #000; }
.card img { display: block; width: 100%; height: 100%; object-fit: cover; }
.chip { position: absolute; font-weight: 700; font-size: 26px; padding: 8px 20px; border-radius: 999px; color: #2a1f3d; background: #ffd23f; box-shadow: 0 6px 0 rgba(0,0,0,.25); text-transform: uppercase; }
.chip.pink { background: #ff7ab6; color: #fff; }
.phone { position: absolute; border-radius: 46px; background: #0d0820; padding: 14px; box-shadow: 0 0 0 4px #3d2a7a, 0 30px 70px rgba(0,0,0,.6); }
.phone img { display: block; width: 100%; height: 100%; border-radius: 34px; object-fit: cover; object-position: top; }
.brand { position: absolute; display: flex; align-items: center; gap: 16px; }
.brand img { border-radius: 22%; box-shadow: 0 8px 20px rgba(0,0,0,.45); }
.brand b { display: block; font-weight: 700; line-height: 1; text-shadow: 0 3px 0 #2a1060; }
.brand small { display: block; font-family: Nunito, sans-serif; font-weight: 800; color: #ffd23f; margin-top: 4px; }
.pill { position: absolute; display: flex; gap: 14px; }
.pill span { font-family: Nunito, sans-serif; font-weight: 800; padding: 10px 20px; border-radius: 999px; background: rgba(0,0,0,.35); border: 2px solid rgba(255,255,255,.25); }
.arrow { position: absolute; }
`;
const stars = (list) => list.map(([x, y, s, c]) => `<svg class="star" style="left:${x}px;top:${y}px;width:${s}px;height:${s}px" viewBox="0 0 20 20"><path d="M10 0 L12.4 7.6 L20 10 L12.4 12.4 L10 20 L7.6 12.4 L0 10 L7.6 7.6 Z" fill="${c || '#fff'}"/></svg>`).join('');
const brand = (x, y, size, align = '') => `<div class="brand" style="left:${x}px;top:${y}px;${align}"><img src="${icon}" style="width:${size}px;height:${size}px"><div><b style="font-size:${size * 0.42}px">Idle Streamer</b><small style="font-size:${size * 0.27}px">Rise to Fame</small></div></div>`;

const posters = [
  {
    name: 'ad-landscape-1200x628', w: 1200, h: 628,
    html: `<div class="rays"></div>${stars([[60, 150, 26], [1120, 120, 30, '#ffd23f'], [600, 560, 22], [1150, 560, 24, '#59d8ff']])}
      <div class="h" style="left:0;right:0;top:34px;font-size:47px;white-space:nowrap">From grandma's <em>old PC</em>... to a <i>star mansion!</i></div>
      <div class="card" style="left:60px;top:190px;width:400px;height:340px;transform:rotate(-4deg)"><img src="${img('room-grandma.png')}"></div>
      <div class="chip" style="left:90px;top:170px;transform:rotate(-4deg)">Day 1</div>
      <svg class="arrow" style="left:478px;top:300px;width:120px;height:90px" viewBox="0 0 120 90"><path d="M8 45 H88 M70 18 L100 45 L70 72" stroke="#2a1060" stroke-width="22" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 45 H88 M70 18 L100 45 L70 72" stroke="#ffd23f" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <div class="card" style="left:620px;top:150px;width:510px;height:434px;transform:rotate(3deg);border-color:#ffd23f;box-shadow:0 0 50px rgba(255,210,63,.45),0 22px 50px rgba(0,0,0,.55)"><img src="${img('room-mansion.png')}"></div>
      <div class="chip pink" style="left:960px;top:128px;transform:rotate(3deg)">#1 Streamer</div>
      ${brand(36, 548, 64)}`,
  },
  {
    name: 'ad-square-setup-1200x1200', w: 1200, h: 1200,
    html: `<div class="rays"></div>${stars([[80, 230, 34], [1080, 200, 40, '#ffd23f'], [110, 1010, 28, '#59d8ff'], [1090, 1000, 30]])}
      <div class="h" style="left:40px;right:40px;top:60px;font-size:96px">Build your <em>dream</em><br><i>stream setup!</i></div>
      <div class="card" style="left:90px;top:330px;width:1020px;height:867px;transform:rotate(-1.5deg);border-color:#ffd23f;border-width:8px;height:620px"><img src="${img('room-mansion.png')}" style="object-position:center 30%"></div>
      <div class="pill" style="left:0;right:0;top:985px;justify-content:center;font-size:30px"><span>8 games to stream</span><span>5 houses</span><span>Pets &amp; outfits</span></div>
      ${brand(370, 1080, 92)}`,
  },
  {
    name: 'ad-square-rank1-1200x1200', w: 1200, h: 1200,
    html: `<div class="rays"></div>${stars([[70, 300, 34, '#ffd23f'], [1100, 330, 34], [600, 1120, 26, '#59d8ff']])}
      <div class="h" style="left:30px;right:30px;top:50px;font-size:84px">Become the <em>#1</em> streamer<br>in the world!</div>
      <div class="phone" style="left:170px;top:300px;width:380px;height:793px;transform:rotate(-5deg)"><img src="${img('phone-fans.png')}"></div>
      <div class="phone" style="left:640px;top:285px;width:390px;height:814px;transform:rotate(4deg)"><img src="${img('phone-rank1.png')}"></div>
      <div class="chip" style="left:130px;top:340px;transform:rotate(-8deg);font-size:34px">Meet your fans!</div>
      <div class="chip pink" style="left:840px;top:300px;transform:rotate(6deg);font-size:34px">World #1</div>
      ${brand(390, 1110, 72)}`,
  },
  {
    name: 'ad-portrait-1200x1500', w: 1200, h: 1500,
    html: `<div class="rays"></div>${stars([[90, 380, 36], [1070, 420, 40, '#ffd23f'], [130, 1250, 30, '#59d8ff'], [1060, 1220, 32]])}
      <div class="h" style="left:30px;right:30px;top:60px;font-size:104px">Tap. Stream.<br><em>Get famous!</em></div>
      <div class="phone" style="left:300px;top:330px;width:600px;height:1000px;transform:rotate(-2deg)"><img src="${img('phone-mansion.png')}"></div>
      <div class="chip" style="left:150px;top:520px;transform:rotate(-8deg);font-size:36px">Earn even offline</div>
      <div class="chip pink" style="left:800px;top:880px;transform:rotate(7deg);font-size:36px">Free to play</div>
      ${brand(390, 1370, 96)}`,
  },
];

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
for (const p of posters) {
  const page = await browser.newPage({ viewport: { width: p.w, height: p.h }, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body style="width:${p.w}px;height:${p.h}px">${p.html}</body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  const file = path.join(outDir, p.name + '.png');
  await page.screenshot({ path: file });
  console.log('wrote', file);
  await page.close();
}
await browser.close();
