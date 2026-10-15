// Dev helper: screenshots of the shop, season pass and avatar editor. node tools/shop.mjs <outDir>
import { chromium } from 'playwright-core';
const out = process.argv[2] || '/tmp/shop';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto('http://localhost:8765/index.html');
await page.waitForTimeout(600);
await page.evaluate(() => {
  const S = window.__qss.S;
  S.introDone = true; S.tutorial = 9; S.profile.channel = 'FernandoGG'; S.house = 2;
  S.gold = 1e15; S.diamonds = 2400; S.market = 3; S.maxMarket = 3;
  S.equip = { pc: 3, monitor: 3, mouse: 3, mousepad: 2, chair: 3, webcam: 2 };
  S.login.claimedToday = true; S.iap.piggy = 420;
  S.season = { id: Math.floor((Date.now() - Date.UTC(2026, 9, 1)) / (30 * 86400000)), xp: 3700, premium: false, free: [1, 2, 3], prem: [] };
  localStorage.setItem('qss_save_v1', JSON.stringify(S));
});
await page.reload();
await page.waitForTimeout(1200);
await page.evaluate(() => document.querySelectorAll('.m-x').forEach(b => b.click()));
await page.waitForTimeout(300);
await page.click('[data-q="shop"]');
await page.waitForTimeout(700);
await page.screenshot({ path: `${out}/shop-1.png` });
const body = page.locator('.shop .m-body');
for (let i = 2; i <= 5; i++) { await body.evaluate((el, i) => el.scrollTo(0, (i - 1) * 640), i); await page.waitForTimeout(300); await page.screenshot({ path: `${out}/shop-${i}.png` }); }
await body.evaluate(el => el.scrollTo(0, 0));
await page.click('[data-season]');
await page.waitForTimeout(700);
await page.screenshot({ path: `${out}/season.png` });
await page.evaluate(() => document.querySelectorAll('.m-x').forEach(b => b.click()));
await page.waitForTimeout(300);
await page.evaluate(() => document.querySelectorAll('.m-x').forEach(b => b.click()));
await page.waitForTimeout(300);
await page.click('#me-btn'); await page.waitForTimeout(500);
for (const c of ['outfit', 'hat', 'glasses', 'pet', 'theme']) { await page.click(`[data-cat="${c}"]`); await page.waitForTimeout(250); await page.locator('.avatar-editor').screenshot({ path: `${out}/ae-${c}.png` }); }
console.log('errors:', JSON.stringify(errors));
await browser.close();
