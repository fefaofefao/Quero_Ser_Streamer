// Captures raw gameplay screenshots in pt-BR, en-US and es-419 and composes the Play Store marketing images.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { logoSVG } from '../game/src/art/logo.js';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const LANGS = [['pt', 'pt-BR'], ['en', 'en-US'], ['es', 'es-419']];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

// ---- texts of the marketing frames ----
const FRAMES = {
  pt: [
  ['01-start', 'Do quarto dos avós…', 'com um PC lento e um monitor de tubo'],
  ['02-hype', '…ao topo do mundo!', 'Toque para dar HYPE e faça o chat explodir'],
  ['04-mansion', 'Mansão de astro', '5 casas, piscina, estúdio e muito mais'],
  ['03-setup', 'Monte o setup dos sonhos', 'PC, monitor, cadeira, webcam e extras que mudam o quarto'],
  ['07-autograph', 'Eventos de autógrafos', 'Fãs na fila, combos e fãs especiais com diamantes'],
  ['06-houses', 'Mude de casa', 'Cada mudança multiplica seus ganhos para sempre'],
  ['05-career', 'Vire o nº 1 do mundo', 'Renasça, ganhe Fãs Fiéis e suba no ranking'],
  ['08-create', 'Crie seu streamer', 'Cabelos, roupas, headsets, pets e muito estilo'],
  ],
  en: [
  ['01-start', 'From grandma\u2019s room…', 'with a slow PC and a CRT monitor'],
  ['02-hype', '…to the top of the world!', 'Tap to HYPE and make the chat explode'],
  ['04-mansion', 'Star mansion', '5 houses, a pool, a studio and much more'],
  ['03-setup', 'Build your dream setup', 'PC, monitor, chair, webcam and extras that change your room'],
  ['07-autograph', 'Autograph events', 'Fans in line, combos and special fans with diamonds'],
  ['06-houses', 'Move up in life', 'Every new house multiplies your earnings forever'],
  ['05-career', 'Become #1 in the world', 'Rebirth, earn Loyal Fans and climb the ranking'],
  ['08-create', 'Create your streamer', 'Hair, outfits, headsets, pets and lots of style'],
  ],
  es: [
  ['01-start', 'Del cuarto de los abuelos…', 'con una PC lenta y un monitor de tubo'],
  ['02-hype', '…¡a la cima del mundo!', 'Toca para dar HYPE y haz explotar el chat'],
  ['04-mansion', 'Mansión de estrella', '5 casas, piscina, estudio y mucho más'],
  ['03-setup', 'Arma el setup soñado', 'PC, monitor, silla, webcam y extras que cambian tu cuarto'],
  ['07-autograph', 'Eventos de autógrafos', 'Fans en fila, combos y fans especiales con diamantes'],
  ['06-houses', 'Múdate de casa', 'Cada mudanza multiplica tus ganancias para siempre'],
  ['05-career', 'Sé el #1 del mundo', 'Renace, gana Fans Fieles y sube en el ranking'],
  ['08-create', 'Crea tu streamer', 'Peinados, ropa, auriculares, mascotas y mucho estilo'],
  ],
};
// Feature graphic: [title lines, subtitle]
const FEATURE = {
  pt: ['Quero ser<br>Streamer', 'Do PC lento à mansão de astro'],
  en: ['Idle<br>Streamer', 'Rise to Fame'],
  es: ['Quiero ser<br>Streamer', 'De la PC lenta a la mansión'],
};
const font = fs.readFileSync(path.join(root, 'node_modules/@fontsource/fredoka/files/fredoka-latin-700-normal.woff2')).toString('base64');
let page2;

async function composeFrames(lang, raw, outDir) {
page2 = page2 || await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page2.setViewportSize({ width: 1080, height: 1920 });
const frames = FRAMES[lang];
for (const [i, [img, h, sub]] of frames.entries()) {
  const b64 = fs.readFileSync(path.join(raw, img + '.png')).toString('base64');
  const hue = [270, 300, 200, 330, 20, 160, 250, 290][i];
  await page2.setContent(`<style>@font-face{font-family:F;src:url(data:font/woff2;base64,${font})}
  body{margin:0;width:1080px;height:1920px;overflow:hidden;font-family:F;background:radial-gradient(120% 80% at 50% 0%,hsl(${hue} 80% 55%),hsl(${hue + 20} 70% 18%) 70%);color:#fff}
  .rays{position:absolute;inset:-400px;background:repeating-conic-gradient(from 0deg at 50% 30%,rgba(255,255,255,.07) 0 8deg,transparent 8deg 16deg)}
  h1{position:relative;margin:90px 60px 0;font-size:96px;line-height:1.02;text-align:center;text-shadow:0 8px 0 rgba(0,0,0,.25)}
  p{position:relative;margin:26px 90px 0;font-size:44px;text-align:center;opacity:.92;line-height:1.2}
  .ph{position:absolute;left:50%;top:440px;transform:translateX(-50%) rotate(${i % 2 ? 2 : -2}deg);width:820px;height:1558px;border-radius:70px;background:#0d0a1c;padding:22px;box-shadow:0 40px 80px rgba(0,0,0,.5)}
  .ph img{width:100%;height:100%;object-fit:cover;object-position:top;border-radius:52px;display:block}</style>
  <div class="rays"></div><h1>${h}</h1><p>${sub}</p><div class="ph"><img src="data:image/png;base64,${b64}"></div>`);
  await page2.waitForTimeout(150);
  await page2.screenshot({ path: path.join(outDir, `${String(i + 1).padStart(2, '0')}-${img.slice(3)}.png`) });
}
}

// ---- feature graphic 1024x500 ----
async function composeFeature(lang, raw) {
await page2.setViewportSize({ width: 1024, height: 500 });
const shot = fs.readFileSync(path.join(raw, '04-mansion.png')).toString('base64');
const shot2 = fs.readFileSync(path.join(raw, '01-start.png')).toString('base64');
await page2.setContent(`<style>@font-face{font-family:F;src:url(data:font/woff2;base64,${font})}
  body{margin:0;width:1024px;height:500px;overflow:hidden;font-family:F;color:#fff;background:linear-gradient(120deg,#5b2bd6,#b33bd9 55%,#ff4f8b)}
  .rays{position:absolute;inset:-300px;background:repeating-conic-gradient(from 0deg at 30% 50%,rgba(255,255,255,.08) 0 8deg,transparent 8deg 16deg)}
  .logo{position:absolute;left:46px;top:70px;width:200px;height:200px;filter:drop-shadow(0 14px 20px rgba(0,0,0,.35))}
  h1{position:absolute;left:46px;top:285px;margin:0;font-size:68px;line-height:.98;text-shadow:0 6px 0 rgba(0,0,0,.25)}
  h1 small{display:block;font-size:30px;opacity:.9;margin-top:10px}
  .ph{position:absolute;top:36px;width:262px;height:498px;border-radius:30px;background:#0d0a1c;padding:9px;box-shadow:0 20px 40px rgba(0,0,0,.45)}
  .ph img{width:100%;height:100%;object-fit:cover;object-position:top;border-radius:22px}
  .a{left:470px;transform:rotate(-6deg)} .b{left:720px;top:20px;transform:rotate(5deg)}</style>
  <div class="rays"></div><div class="logo">${logoSVG(46)}</div>
  <h1>${FEATURE[lang][0]}<small>${FEATURE[lang][1]}</small></h1>
  <div class="ph a"><img src="data:image/png;base64,${shot2}"></div><div class="ph b"><img src="data:image/png;base64,${shot}"></div>`);
await page2.waitForTimeout(200);
await page2.screenshot({ path: path.join(root, `store/feature-graphic-${LANGS.find((l) => l[0] === lang)[1]}.png`) });
}

for (const [lang, locale] of LANGS) {
const raw = path.join(root, 'store/raw', locale); const outDir = path.join(root, 'store/screenshots', locale);
fs.mkdirSync(raw, { recursive: true }); fs.mkdirSync(outDir, { recursive: true });
const ctx = await browser.newContext({ viewport: { width: 400, height: 760 }, deviceScaleFactor: 2.7, locale, hasTouch: true, isMobile: true });
const page = await ctx.newPage();
await page.goto('http://localhost:8765/index.html');

async function setup(fn, arg) {
  await page.evaluate(([fnSrc, arg, arg0]) => {
    const S = window.__qss.S;
    Object.assign(S, { introDone: true, tutorial: 9 });
    S.profile.channel = 'LucasGamer'; S.login.claimedToday = true; S.lastSeen = Date.now();
    S.daily.day = ''; S.settings.lang = arg0;
    (new Function('S', 'arg', fnSrc))(S, arg);
    localStorage.setItem('qss_save_v1', JSON.stringify(S));
    window.__noSave = true;
  }, [fn, arg, lang]);
  await page.reload(); await page.waitForTimeout(1600);
  await page.evaluate(() => document.querySelectorAll('.m-x').forEach(b => b.click()));
  await page.waitForTimeout(500);
}
const snap = async (n) => { await page.waitForTimeout(400); await page.screenshot({ path: path.join(raw, n + '.png') }); };

// 1. humble beginnings
await setup(`S.house=0; S.equip={pc:1,monitor:1,mouse:1,mousepad:1,chair:1,webcam:1}; S.gold=1520; S.upgrades[0]=8; S.upgrades[1]=3; S.diamonds=60; S.fame=900; S.fameAll=900; S.profile.avatar={skin:2,body:1,hair:0,hairColor:1,outfit:0,outfitColor:1,hat:'none',glasses:'none',neck:'none'};`);
for (let i = 0; i < 10; i++) { await page.mouse.click(200, 230); await page.waitForTimeout(40); }
await snap('01-start');
// 2. mid game apartment, hype
await setup(`S.house=2; S.market=4; S.maxMarket=4; S.fame=4e13; S.fameAll=8e15; S.gold=3.2e19; S.upgrades=S.upgrades.map((_,i)=>Math.max(0,140-i*11)); S.equip={pc:4,monitor:4,mouse:3,mousepad:4,chair:4,webcam:3}; S.extras={mic:2,rgb:3,green:2,guest:0,pool:0}; S.diamonds=840; S.ff=120; S.ffEarned=300; S.profile.pet='cat'; S.plaques=2; S.bestRank=4000; S.profile.avatar={skin:3,body:1,hair:4,hairColor:7,outfit:3,outfitColor:4,hat:'headset',glasses:'none',neck:'chain'};`);
await page.evaluate(() => { const S = window.__qss.S; S.hype = 1; S.hypeUntil = Date.now() + 12000; window.__qss.G.emit('hype'); });
for (let i = 0; i < 8; i++) { await page.mouse.click(220, 240); await page.waitForTimeout(40); }
await snap('02-hype');
// 3. setup tab
await page.click('[data-tab="setup"]'); await snap('03-setup');
// 4. mansion
await setup(`S.house=4; S.market=7; S.maxMarket=7; S.fame=2e24; S.fameAll=8e24; S.gold=4.4e27; S.upgrades=S.upgrades.map((_,i)=>Math.max(0,260-i*12)); S.equip={pc:5,monitor:5,mouse:5,mousepad:5,chair:5,webcam:5}; S.extras={mic:3,rgb:3,green:3,guest:3,pool:3}; S.diamonds=3120; S.ff=900; S.ffEarned=5200; S.profile.pet='dog'; S.plaques=4; S.bestRank=30; S.profile.verified=true; S.profile.neonColor=1; S.profile.avatar={skin:5,body:2,hair:7,hairColor:9,outfit:5,outfitColor:6,hat:'catset',glasses:'sun',neck:'chain'};`);
await snap('04-mansion');
await page.click('[data-tab="career"]'); await snap('05-career');
// 6. houses tab
await setup(`S.house=1; S.market=3; S.maxMarket=4; S.fame=4e10; S.fameAll=4e12; S.gold=1.1e21; S.upgrades=S.upgrades.map((_,i)=>Math.max(0,110-i*10)); S.equip={pc:3,monitor:3,mouse:2,mousepad:3,chair:3,webcam:2}; S.extras={mic:1,rgb:1,green:0,guest:0,pool:0}; S.diamonds=420;`);
await page.click('[data-tab="houses"]'); await page.evaluate(() => document.querySelector('#panel').scrollTop = 330); await snap('06-houses');
// 7. autograph event
await setup(`S.house=3; S.market=6; S.maxMarket=6; S.fame=1e21; S.fameAll=1e22; S.equip={pc:5,monitor:5,mouse:4,mousepad:4,chair:5,webcam:5};`);
await page.evaluate(() => window.__qss.startAutograph()); await page.waitForTimeout(3300);
for (let i = 0; i < 5; i++) { await page.mouse.click(200, 650); await page.waitForTimeout(260); }
await page.mouse.click(200, 650); await page.waitForTimeout(80);
await snap('07-autograph');
// 8. creator
await page.evaluate(() => { window.__noSave = true; localStorage.clear(); }); await page.reload(); await page.waitForTimeout(800);
for (let i = 0; i < 4; i++) { await page.mouse.click(200, 380); await page.waitForTimeout(250); }
await page.fill('.in-channel', 'LucasGamer'); await page.click('[data-cat="hair"]'); await page.waitForTimeout(100); await page.click('.ae-grid .opt:nth-child(3)');
await snap('08-create');
// intro panel for the feature graphic
await page.evaluate(() => { window.__noSave = true; localStorage.clear(); }); await page.reload(); await page.waitForTimeout(700); await snap('09-intro');
await ctx.close();

// ---- compose marketing frames 1080x1920 ----
await composeFrames(lang, raw, outDir);
await composeFeature(lang, raw);
}
await browser.close();
console.log('store assets done');

