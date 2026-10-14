// Balance simulator: plays ~150 days of a "typical" free player (with
// rewarded ads) using the same economy module as the game, and prints when
// each milestone is reached. Usage: node tools/sim.mjs [days] [sessionsPerDay]
import * as E from '../game/src/economy.js';

const ACTIVE = 180;         // seconds per session

export function runSim(opts = {}) {
  const DAYS = opts.days || 150, SESS = opts.sess || 6, PAYER = !!opts.payer, TRACE = !!opts.trace;
  const daily = [];
  const firsts = {};

  const s = {
    gold: 0, fame: 0, fameAll: 0, diamonds: 50, ff: 0, ffEarned: 0,
    upgrades: E.UPGRADES.map(() => 0), community: E.MARKETS.map(() => [0, 0, 0]),
    market: 0, house: 0, rebirths: 0,
    equip: { pc: 1, monitor: 1, mouse: 1, mousepad: 1, chair: 1, webcam: 1 },
    extras: { mic: 0, rgb: 0, green: 0, guest: 0, pool: 0 }, talents: {},
    boosts: {}, iap: PAYER ? { goldBoost: true } : {},
  };

  let t = 8 * 3600 - 1;
  const log = [];
  const mark = (what) => log.push(`d${(t / 86400).toFixed(1).padStart(6)}  ${what}`);
  let maxMarket = 0;
  let runStart = 0, lastProgress = 0;

  function checkMarkets() {
    while (E.canUnlockMarket(s, s.market + 1)) {
      s.market++; lastProgress = t;
      if (s.market > maxMarket) { maxMarket = s.market; firsts['m' + s.market] = t / 86400; mark(`market ${s.market} ${E.MARKETS[s.market].id}  (run ${((t - runStart) / 3600).toFixed(1)}h, rebirths ${s.rebirths})`); }
    }
  }

  function earn(sec, eff = 1) {
    const g = E.gpsNoBoost(s) * sec * eff;
    const f = E.famePerSec(s) * sec * eff;
    s.gold += g; s.fame += f; s.fameAll += f;
    checkMarkets();
  }

  function buyStuff() {
    // House first: save for it when reachable within ~3h of income.
    const nh = E.HOUSES[s.house + 1];
    if (nh) {
      if (s.gold >= nh.cost) {
        s.gold -= nh.cost; s.house++; lastProgress = t; firsts['h' + s.house] = t / 86400;
        mark(`HOUSE ${s.house} ${nh.id}`);
      } else if (nh.cost < E.gpsNoBoost(s) * 3 * 3600) return; // saving
    }
    for (let guard = 0; guard < 5000; guard++) {
      const g = E.gpsNoBoost(s);
      // best channel upgrade by payback
      let best = null;
      for (let i = 0; i < E.UPGRADES.length; i++) {
        if (i > 0 && s.upgrades[i - 1] === 0) break;
        const l = s.upgrades[i];
        const c = E.upgradeCost(s, i, l);
        const dg = (E.upgradeGps(i, l + 1) - E.upgradeGps(i, l)) * E.goldMultBase(s);
        const pb = c / dg;
        if (!best || pb < best.pb) best = { type: 'u', i, c, pb };
      }
      // best community upgrade (fame)
      let bestC = null;
      if (s.market + 1 < E.MARKETS.length) {
        for (let m = 0; m <= s.market; m++) for (let k = 0; k < 3; k++) {
          const l = s.community[m][k];
          const c = E.communityCost(m, k, l);
          const df = (E.communityFps(m, k, l + 1) - E.communityFps(m, k, l)) * E.fameMult(s);
          const pb = c / df;
          if (!bestC || pb < bestC.pb) bestC = { type: 'c', m, k, c, pb };
        }
      }
      // Fame is worth buying when the next market is far away.
      let pick = best;
      if (bestC) {
        const need = E.MARKETS[s.market + 1].fame - s.fame;
        const fps = E.famePerSec(s);
        const eta = need / Math.max(fps, 1e-9);
        if (eta > 300 && bestC.c < best.c * 3) pick = bestC;
      }
      if (!pick || s.gold < pick.c) break;
      s.gold -= pick.c;
      if (pick.type === 'u') s.upgrades[pick.i]++; else s.community[pick.m][pick.k]++;
      if (g === 0) break;
    }
  }

  function buyEquip() {
    const order = ['pc', 'webcam', 'monitor', 'chair', 'mouse', 'mousepad'];
    let did = true;
    while (did) {
      did = false;
      for (const id of order) {
        const lv = s.equip[id];
        if (lv >= E.houseMaxEquip(s)) continue;
        const c = E.EQUIP_COST[lv + 1];
        if (s.diamonds >= c.gems && s.ff >= c.ff) {
          s.diamonds -= c.gems; s.ff -= c.ff; s.equip[id]++; did = true;
          mark(`equip ${id} -> ${s.equip[id]}`);
        }
      }
      for (const e of E.EXTRAS) {
        const lv = s.extras[e.id];
        if (s.house < e.house || lv >= 3) continue;
        const c = E.EXTRA_COST[lv + 1];
        if (s.diamonds >= c + 300) { s.diamonds -= c; s.extras[e.id]++; did = true; mark(`extra ${e.id} -> ${s.extras[e.id]}`); }
      }
    }
  }

  function buyTalents() {
    const pref = ['charisma', 'viral', 'headstart', 'deal', 'nights', 'fanclub', 'autohype', 'fingers', 'lucky'];
    let did = true;
    while (did) {
      did = false;
      let cheapest = null;
      for (const id of pref) {
        const tt = E.talentById(id), lv = E.talentLv(s, id);
        if (lv >= tt.max) continue;
        const c = E.talentCost(tt, lv);
        if (!cheapest || c < cheapest.c) cheapest = { id, c };
      }
      // keep FF for equipment when one is close
      const reserve = Object.values(s.equip).some(l => l >= 3 && l < E.houseMaxEquip(s)) ? 15 : 0;
      if (cheapest && s.ff - reserve >= cheapest.c) { s.ff -= cheapest.c; s.talents[cheapest.id] = (s.talents[cheapest.id] || 0) + 1; did = true; }
    }
  }

  function maybeRebirth() {
    if (s.market < E.REBIRTH_MIN_MARKET) return;
    const gain = E.rebirthGain(s.fame);
    const runH = (t - runStart) / 3600;
    const stalled = (t - lastProgress) > 12 * 3600;
    const ratio = E.rebirthRatio(s, gain);
    if (gain >= 2 && ((ratio >= 1.6 && runH > 2) || (stalled && ratio >= 1.15))) {
      s.ff += gain; s.ffEarned += gain; s.rebirths++; if (!firsts.r1) firsts.r1 = t / 86400;
      mark(`REBIRTH #${s.rebirths} +${gain} FF (total ${s.ffEarned}) run ${runH.toFixed(1)}h market ${s.market}`);
      s.gold = E.headstartGold(s); s.fame = 0; s.market = 0;
      s.upgrades = s.upgrades.map(() => 0); s.community = s.community.map(() => [0, 0, 0]);
      runStart = t; lastProgress = t;
      buyTalents();
    }
  }

  const sessionTimes = Array.from({ length: SESS }, (_, i) => 8 * 3600 + i * (15 * 3600 / Math.max(1, SESS - 1)));
  const rankMarks = [1e6, 1e5, 1e4, 1000, 100, 10, 1];
  let nextRank = 0;

  for (let day = 0; day < DAYS; day++) {
    if (opts.onDay) opts.onDay(day, s, E);
    s.diamonds += 70 + (day < 30 ? 25 : 8) + (PAYER ? 60 : 0);
    let autographs = 3;
    for (let si = 0; si < SESS; si++) {
      const start = day * 86400 + sessionTimes[si];
      // offline period
      if (t < start) {
        const off = start - t;
        const { eff, maxSec } = E.offlineParams(s);
        const dbl = si % 2 === 0 ? 2 : 1; // watches the x2 ad half the time
        earn(Math.min(off, maxSec), eff * dbl);
        t = start;
      }
      buyEquip();
      maybeRebirth();
      buyStuff();
      const act = (day === 0 && si === 0) ? 900 : ACTIVE;
      for (let a = 0; a < act; a += 5) {
        // active play: taps + boost x2 half the time
        const boost = si % 2 === 0 ? 2 : 1;
        earn(5, boost);
        s.gold += E.tapValue(s, 0) * 3 * 2; // ~3 taps/s for ~2 of these 5s
        t += 5;
        if (a % 30 === 0) buyStuff();
      if (opts.minute && day === 0 && si === 0 && a % 60 === 0) mark(`  min ${a / 60} gps ${E.gpsNoBoost(s).toExponential(2)} fame ${s.fame.toExponential(2)} fps ${E.famePerSec(s).toExponential(2)} m${s.market} up ${s.upgrades.join(',')} com ${s.community.slice(0, s.market + 1).map(a => a.join('/')).join(' ')}`);
      }
      if (autographs > 0 && si % 2 === 1) { autographs--; s.gold += E.gpsNoBoost(s) * 600 * 1.35 * E.eventMult(s); buyStuff(); }
      if (TRACE && day < 2) mark(`  trace gps ${E.gpsNoBoost(s).toExponential(2)} gold ${s.gold.toExponential(2)} fame ${s.fame.toExponential(2)} fps ${E.famePerSec(s).toExponential(2)} m${s.market} up ${s.upgrades.join(',')} com ${s.community.slice(0,s.market+1).map(a=>a.join('/')).join(' ')}`);
      while (nextRank < rankMarks.length && E.worldRank(s.fameAll) <= rankMarks[nextRank]) {
        mark(`world rank <= ${rankMarks[nextRank]}`); nextRank++;
      }
    }
    daily.push({ day: day + 1, fameAll: s.fameAll, extras: Object.values(s.extras).join(''), gps: E.gpsNoBoost(s), house: s.house, market: s.market, ff: s.ffEarned, rank: E.worldRank(s.fameAll) });
    if ([1, 3, 7, 14, 30, 60, 90, 120, 150].includes(day + 1)) {
      mark(`== end of day ${day + 1}: gps ${E.gpsNoBoost(s).toExponential(2)} fame ${s.fame.toExponential(2)} market ${s.market} house ${s.house} FFtot ${s.ffEarned} gems ${s.diamonds} equip ${Object.values(s.equip).join('')} rank ${E.worldRank(s.fameAll)}`);
    }
  }


  return { log, daily, firsts };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { log } = runSim({ days: +(process.argv[2] || 150), sess: +(process.argv[3] || 6), payer: process.argv.includes('--payer'), trace: process.argv.includes('--trace') });
  const filter = process.argv.includes('--all') ? () => true : (l) => !/  (equip|extra) /.test(l);
  console.log(log.filter(filter).join('\n'));
}
