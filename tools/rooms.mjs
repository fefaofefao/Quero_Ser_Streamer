// Dev helper: screenshot the room in every house. node tools/rooms.mjs <outDir> [jsonPatch]
import { chromium } from 'playwright-core';
const out = process.argv[2] || '/tmp/rooms';
const patch = process.argv[3] ? JSON.parse(process.argv[3]) : {};
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
page.on('pageerror', e => console.log('pageerror:', e.message));
await page.goto('http://localhost:8765/index.html');
await page.waitForTimeout(600);
for (let h = 0; h < 5; h++) {
  await page.evaluate(([h, patch]) => {
    const S = window.__qss.S;
    S.introDone = true; S.tutorial = 9; S.profile.channel = 'FernandoGG'; S.house = h;
    S.equip = { pc: 4, monitor: 4, mouse: 3, mousepad: 3, chair: 4, webcam: 3 };
    S.extras = { mic: 2, rgb: 2, green: 2, guest: h >= 3 ? 2 : 0, pool: h >= 4 ? 2 : 0 };
    S.login.claimedToday = true;
    const deep = (d, s) => { for (const k in s) { if (s[k] && typeof s[k] === 'object' && !Array.isArray(s[k])) deep(d[k] = d[k] || {}, s[k]); else d[k] = s[k]; } };
    deep(S, patch);
    localStorage.setItem('qss_save_v1', JSON.stringify(S));
  }, [h, patch]);
  await page.reload();
  await page.waitForTimeout(1200);
  await page.evaluate(() => document.querySelectorAll('.m-x').forEach(b => b.click()));
  await page.waitForTimeout(400);
  await page.locator('#stage').screenshot({ path: `${out}/room-h${h}.png` });
}
await browser.close();
