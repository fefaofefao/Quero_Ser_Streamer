// Smoke test: drives every system through the debug handle and reports JS errors.
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 3).join('\n')));
page.on('console', m => { if (m.type() === 'error' && !/favicon/.test(m.text()) && !/404/.test(m.text())) errors.push('console: ' + m.text()); });
page.on('dialog', d => d.accept());
await page.goto('http://localhost:8765/index.html');
await page.evaluate(() => localStorage.clear());
await page.reload(); await page.waitForTimeout(800);
for (let i = 0; i < 4; i++) { await page.mouse.click(200, 400); await page.waitForTimeout(250); }
await page.fill('.in-channel', 'Smoke'); await page.click('.done'); await page.waitForTimeout(500);
const steps = [
  'tap', 'buyAll', 'tabs', 'market', 'house', 'equip', 'extras', 'rebirth', 'talents', 'events', 'missions', 'achievements', 'shop', 'settings', 'avatar', 'autograph', 'offline', 'warp', 'days',
];
for (const st of steps) {
  await page.evaluate(async (st) => {
    const { G, E, S, M } = window.__qss;
    const $ = (s) => document.querySelector(s);
    const closeAll = () => document.querySelectorAll('.m-x').forEach(b => b.click());
    switch (st) {
      case 'tap': for (let i = 0; i < 60; i++) G.tap(); break;
      case 'buyAll': S.gold = 1e15; for (let r = 0; r < 30; r++) for (let i = 0; i < E.UPGRADES.length; i++) G.buyUpgrade(i, 3); for (let k = 0; k < 3; k++) G.buyCommunity(S.market, k, 5); break;
      case 'tabs': for (const t of ['games', 'setup', 'houses', 'career', 'channel']) { $(`[data-tab="${t}"]`).click(); await new Promise(r => setTimeout(r, 150)); } break;
      case 'market': S.fame = 1e12; G.tick(0.1); closeAll(); break;
      case 'house': S.gold = 1e30; G.buyHouse(); closeAll(); G.buyHouse(); closeAll(); break;
      case 'equip': S.diamonds = 1e5; S.ff = 1e4; for (const e of E.EQUIPMENT) { G.upgradeEquip(e.id); G.upgradeEquip(e.id); } closeAll(); break;
      case 'extras': for (const e of E.EXTRAS) { G.buyExtra(e); G.buyExtra(e); } break;
      case 'rebirth': S.market = 4; S.maxMarket = 4; S.fame = 1e14; M.rebirthModal(); await new Promise(r => setTimeout(r, 200)); document.querySelector('.modal .m-btns .btn.primary').click(); await new Promise(r => setTimeout(r, 300)); closeAll(); break;
      case 'talents': $('[data-tab="career"]').click(); await new Promise(r => setTimeout(r, 200)); for (const t of E.TALENTS) G.buyTalent(t.id); break;
      case 'events': for (const k of ['clip', 'donation', 'raid', 'lag']) window.__qss.forceEvent ? 0 : 0; break;
      case 'missions': M.missionsModal(); await new Promise(r => setTimeout(r, 200)); S.daily.missions.forEach(m => m.progress = m.target); closeAll(); M.missionsModal(); await new Promise(r => setTimeout(r, 200)); document.querySelectorAll('[data-claim]').forEach(b => b.click()); await new Promise(r => setTimeout(r, 200)); document.querySelector('[data-chest]').click(); closeAll(); break;
      case 'achievements': M.achievementsModal(); await new Promise(r => setTimeout(r, 200)); document.querySelectorAll('[data-ach]').forEach(b => b.click()); closeAll(); M.statsModal(); closeAll(); break;
      case 'shop': M.shopModal(() => {}); await new Promise(r => setTimeout(r, 200)); closeAll(); M.boostModal(); closeAll(); M.loginModal(); closeAll(); break;
      case 'settings': $('#set-btn').click(); await new Promise(r => setTimeout(r, 200)); document.querySelectorAll('.tog').forEach(b => b.click()); document.querySelectorAll('.tog').forEach(b => b.click()); closeAll(); break;
      case 'avatar': $('#me-btn').click(); await new Promise(r => setTimeout(r, 200)); for (const c of ['hat', 'glasses', 'neck', 'pet', 'outfit']) { document.querySelector(`[data-cat="${c}"]`)?.click(); await new Promise(r => setTimeout(r, 80)); document.querySelector('.ae-grid .opt:nth-child(2)')?.click(); } document.querySelector('.done').click(); break;
      case 'autograph': M.autographLobby(() => {}); await new Promise(r => setTimeout(r, 200)); closeAll(); break;
      case 'offline': S.lastSeen = Date.now() - 5 * 3600e3; const o = G.computeOffline(); M.offlineModal(o); await new Promise(r => setTimeout(r, 200)); document.querySelector('.offline .m-btns .btn').click(); break;
      case 'warp': M.warpModal(0); await new Promise(r => setTimeout(r, 200)); document.querySelector('.modal .m-btns .btn.primary')?.click(); break;
      case 'days': S.daily.day = ''; S.login.last = ''; S.autograph.day = ''; G.resetDaily(); break;
    }
  }, st);
  await page.waitForTimeout(250);
}
const summary = await page.evaluate(() => { const S = window.__qss.S; return { gold: S.gold, house: S.house, market: S.market, rebirths: S.rebirths, ff: S.ff, gems: S.diamonds, equip: S.equip, missions: S.stats.missions }; });
console.log(JSON.stringify(summary));
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no errors');
await browser.close();
