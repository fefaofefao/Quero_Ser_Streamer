// Dev helper: deterministic room screenshots (animations frozen) for before/after comparisons.
// node tools/roomdiff.mjs <outDir>
import { chromium } from 'playwright-core';
const out = process.argv[2];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2 });
const errs = []; page.on('pageerror', e => errs.push(e.message));
await page.goto('http://localhost:8765/index.html'); await page.waitForTimeout(500);
const cases = [];
for (let h = 0; h < 5; h++) cases.push({ h, theme: ['none', 'sakura', 'snow', 'neoncity', 'galaxy'][h], pet: ['cat', 'penguin', 'robot', 'dog', 'dragon'][h], rgb: Math.min(3, h), pool: h >= 4 ? 3 : 0, guest: h >= 3 ? 3 : 0, eq: Math.min(5, h + 1) });
cases.push({ h: 4, theme: 'fireworks', pet: 'parrot', rgb: 3, pool: 3, guest: 3, eq: 5 });
for (const [i, c] of cases.entries()) {
  await page.evaluate((c) => {
    const S = window.__qss.S;
    Object.assign(S, { introDone: true, tutorial: 9, house: c.h, plaques: c.h, market: 0 });
    S.profile.channel = 'FernandoGG'; S.login.claimedToday = true; S.profile.theme = c.theme; S.profile.pet = c.pet;
    S.profile.avatar = { ...S.profile.avatar, outfit: 11, hat: 'goldset' };
    S.equip = { pc: c.eq, monitor: c.eq, mouse: c.eq, mousepad: c.eq, chair: c.eq, webcam: c.eq };
    S.extras = { mic: Math.min(3, c.h), rgb: c.rgb, green: 0, guest: c.guest, pool: c.pool };
    localStorage.setItem('qss_save_v1', JSON.stringify(S));
  }, c);
  await page.reload(); await page.waitForTimeout(1000);
  await page.evaluate(() => {
    document.querySelectorAll('.m-wrap, .modal-wrap').forEach(m => m.remove());
    const st = document.createElement('style');
    st.textContent = '*{animation:none!important;transition:none!important} .chat,.screen,.ev-layer,.live-badge,#fx{visibility:hidden!important}';
    document.head.appendChild(st);
    document.querySelectorAll('#stage svg').forEach(s => { s.pauseAnimations && s.pauseAnimations(); s.setCurrentTime && s.setCurrentTime(1.25); });
  });
  await page.waitForTimeout(300);
  await page.locator('.stage-inner').screenshot({ path: `${out}/case${i}.png` });
}
console.log('errors', JSON.stringify(errs));
await browser.close();
