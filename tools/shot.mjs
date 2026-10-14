// Screenshot helper: node tools/shot.mjs <url> <out.png> [width] [height] [dpr] [fullPage]
import { chromium } from 'playwright-core';
const [url, out, w = 1300, h = 1100, dpr = 1, full = '1'] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: +dpr });
page.on('console', m => { if (m.type() === 'error') console.log('console:', m.text()); });
page.on('pageerror', e => console.log('pageerror:', e.message));
await page.goto(url);
await page.waitForTimeout(+(process.env.WAIT || 800));
await page.screenshot({ path: out, fullPage: full === '1' });
await browser.close();
