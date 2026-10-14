// Renders launcher icons (legacy + adaptive layers) and the Play Store icon from the SVG logo.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { LOGO_DEFS, LOGO_BG, LOGO_FG, logoSVG } from '../game/src/art/logo.js';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const res = path.join(root, 'android/app/src/main/res');
const dens = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
const fgSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-60 -60 632 632">${LOGO_DEFS}${LOGO_FG}</svg>`;
const bgSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${LOGO_DEFS}${LOGO_BG}</svg>`;
const roundSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${LOGO_DEFS}<clipPath id="c"><circle cx="256" cy="256" r="256"/></clipPath><g clip-path="url(#c)">${LOGO_BG}<g transform="translate(256 256) scale(.86) translate(-256 -256)">${LOGO_FG}</g></g></svg>`;
const fonts = fs.readFileSync(path.join(root, 'node_modules/@fontsource/fredoka/files/fredoka-latin-700-normal.woff2')).toString('base64');

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage();
async function render(svg, size, out) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>@font-face{font-family:Fredoka;font-weight:700;src:url(data:font/woff2;base64,${fonts})}html,body{margin:0;background:transparent}svg{width:${size}px;height:${size}px;display:block}</style>${svg}`);
  await page.evaluate(() => document.fonts.ready);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await page.screenshot({ path: out, omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
}
for (const [d, k] of Object.entries(dens)) {
  const dir = path.join(res, 'mipmap-' + d);
  await render(logoSVG(100), Math.round(48 * k), path.join(dir, 'ic_launcher.png'));
  await render(roundSVG, Math.round(48 * k), path.join(dir, 'ic_launcher_round.png'));
  await render(fgSVG, Math.round(108 * k), path.join(dir, 'ic_launcher_foreground.png'));
  await render(bgSVG, Math.round(108 * k), path.join(dir, 'ic_launcher_background.png'));
}
fs.mkdirSync(path.join(root, 'store'), { recursive: true });
await render(logoSVG(0), 512, path.join(root, 'store/icon-512.png'));
await render(logoSVG(100), 512, path.join(root, 'store/icon-512-rounded-preview.png'));
await browser.close();
console.log('icons done');
