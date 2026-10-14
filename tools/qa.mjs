// QA driver: plays through the intro/creation and takes phone screenshots.
import { chromium } from 'playwright-core';
const out = process.argv[2] || '/tmp/claude-0/shots';
const scenario = process.argv[3] || 'new';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
const shot = async (n) => { await page.screenshot({ path: `${out}/${n}.png` }); };
await page.goto('http://localhost:8765/index.html');
if (scenario === 'new') {
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForTimeout(900);
  await shot('01-intro');
  for (let i = 0; i < 4; i++) { await page.mouse.click(200, 450); await page.waitForTimeout(350); }
  await page.waitForTimeout(500);
  await shot('02-create');
  await page.fill('.in-channel', 'FernandoGG');
  await page.click('[data-cat="hair"]'); await page.waitForTimeout(100);
  await page.click('.ae-grid .opt:nth-child(3)');
  await page.click('.done');
  await page.waitForTimeout(800);
  await shot('03-main');
  for (let i = 0; i < 12; i++) { await page.mouse.click(206, 200); await page.waitForTimeout(60); }
  await page.waitForTimeout(400);
  await shot('04-tapped');
}
if (scenario === 'mid') {
  await page.evaluate(() => {
    const q = window.__qss; const S = q.S;
    S.introDone = true; S.tutorial = 5; S.profile.channel = 'FernandoGG';
    S.house = +(new URLSearchParams(location.search).get('h') || 2);
    S.gold = 1e22; S.diamonds = 2500; S.ff = 300; S.ffEarned = 400; S.rebirths = 3;
    S.market = 4; S.maxMarket = 5; S.fame = 1e14; S.fameAll = 1e16;
    S.upgrades = S.upgrades.map((_, i) => Math.max(0, 120 - i * 9));
    S.equip = { pc: 4, monitor: 4, mouse: 3, mousepad: 3, chair: 4, webcam: 3 };
    S.extras = { mic: 2, rgb: 2, green: 2, guest: 0, pool: 0 };
    S.profile.pet = 'cat'; S.login.claimedToday = true; S.plaques = 2; S.bestRank = 5000;
    localStorage.setItem('qss_save_v1', JSON.stringify(S));
  });
  await page.reload();
  await page.waitForTimeout(1500);
  await page.evaluate(() => document.querySelectorAll('.m-x').forEach(b => b.click()));
  await page.waitForTimeout(500);
  await shot('10-mid-channel');
  for (const tab of ['games', 'setup', 'houses', 'career']) {
    await page.click(`[data-tab="${tab}"]`); await page.waitForTimeout(500); await shot('11-' + tab);
  }
}
if (scenario === 'modals') {
  await page.evaluate(() => { const S = window.__qss.S; S.introDone = true; S.tutorial = 5; S.profile.channel = 'FernandoGG'; S.market = 2; S.maxMarket = 3; S.fame = 1e8; S.gold = 1e9; S.upgrades[0] = 40; S.upgrades[1] = 30; S.upgrades[2] = 20; S.login.claimedToday = false; localStorage.setItem('qss_save_v1', JSON.stringify(S)); });
  await page.reload(); await page.waitForTimeout(1500);
  await shot('20-login');
  await page.click('.m-btns .btn.primary'); await page.waitForTimeout(900);
  await shot('21-login-claimed');
  await page.evaluate(() => document.querySelectorAll('.m-x').forEach(b => b.click())); await page.waitForTimeout(400);
  await page.click('[data-q="missions"]'); await page.waitForTimeout(600); await shot('22-missions');
  await page.evaluate(() => document.querySelectorAll('.m-x').forEach(b => b.click())); await page.waitForTimeout(400);
  await page.click('[data-q="shop"]'); await page.waitForTimeout(600); await shot('23-shop');
  await page.evaluate(() => document.querySelectorAll('.m-x').forEach(b => b.click())); await page.waitForTimeout(400);
  await page.evaluate(() => window.__qss.M.marketCelebrate(3)); await page.waitForTimeout(900); await shot('24-celebrate');
  await page.evaluate(() => document.querySelectorAll('.m-x').forEach(b => b.click())); await page.waitForTimeout(400);
  await page.evaluate(() => window.__qss.M.letterModal('kitnet')); await page.waitForTimeout(700); await shot('25-letter');
  await page.evaluate(() => document.querySelectorAll('.m-btns .btn').forEach(b => b.click())); await page.waitForTimeout(400);
  await page.evaluate(() => window.__qss.startAutograph()); await page.waitForTimeout(3200);
  for (let i = 0; i < 6; i++) { await page.mouse.click(206, 760); await page.waitForTimeout(120); }
  await shot('26-autograph');
  await page.waitForTimeout(29000); await shot('27-auto-result');
}
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no errors');
await browser.close();
