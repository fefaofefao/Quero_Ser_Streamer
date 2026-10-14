// Pure game economy: data tables and formulas. No DOM here, so the balance
// simulator (tools/sim.mjs) runs exactly the same math as the game.

export const BASE_GPS = 1;
// Live tuning knobs (Firebase Remote Config can change them without an update).
export const TUNE = { gold: 1, fame: 1, offline: 1, event: 1 };

// Channel upgrades (Gold generators). cost = base * growth^level
export const UPGRADES = [
  { id: 'quality',    cost: 10      , gps: 0.5      , growth: 1.15 },
  { id: 'schedule',   cost: 130     , gps: 3        , growth: 1.15 },
  { id: 'chat',       cost: 1700    , gps: 18       , growth: 1.15 },
  { id: 'clips',      cost: 2.2e4   , gps: 100      , growth: 1.15 },
  { id: 'thumbs',     cost: 2.9e5   , gps: 620      , growth: 1.15 },
  { id: 'mods',       cost: 3.7e6   , gps: 3600     , growth: 1.15 },
  { id: 'collab',     cost: 4.8e7   , gps: 2.10e4   , growth: 1.15 },
  { id: 'sponsor',    cost: 6.3e8   , gps: 1.30e5   , growth: 1.15 },
  { id: 'agency',     cost: 8.2e9   , gps: 7.50e5   , growth: 1.15 },
  { id: 'tour',       cost: 1.1e11  , gps: 4.60e6   , growth: 1.15 },
  { id: 'network',    cost: 1.4e12  , gps: 2.60e7   , growth: 1.15 },
  { id: 'empire',     cost: 1.8e13  , gps: 1.50e8   , growth: 1.15 },
];

// Every 25 levels an upgrade doubles its output ("degraus" from the GDD).
export const STEP = 25;
export function stepMult(level) { return Math.pow(2, Math.floor(level / STEP)); }
export function nextStep(level) { return (Math.floor(level / STEP) + 1) * STEP; }

// Stream markets. Unlocked by reaching a run-fame threshold.
export const MARKETS = [
  { id: 'blococai',  fame: 0,      mult: 1,    house: 0, color: '#6c5ce7' },
  { id: 'pulopixel', fame: 3e3,    mult: 3,    house: 0, color: '#00b894' },
  { id: 'goltotal',  fame: 2e6,  mult: 10,   house: 0, color: '#27ae60' },
  { id: 'cubocraft', fame: 5.5e10,  mult: 30,   house: 0, color: '#8d6e63' },
  { id: 'turbo',     fame: 2e11,    mult: 100,  house: 1, color: '#e17055' },
  { id: 'zona',      fame: 3e15,    mult: 300,  house: 2, color: '#0984e3' },
  { id: 'alvo',      fame: 3e20, mult: 1000, house: 3, color: '#d63031' },
  { id: 'lendas',    fame: 4e23,   mult: 3000, house: 4, color: '#a55eea' },
];
export function canUnlockMarket(s, m) {
  return m < MARKETS.length && s.fame >= MARKETS[m].fame && s.house >= MARKETS[m].house;
}

// Community actions per market: bought with Gold, they produce Fame/s.
// cost = marketBase * k.cost * growth^level ; fps = marketFps * k.fps * level
export const COMMUNITY = [
  { id: 'forum',      cost: 1,    fps: 1,   growth: 1.17 },
  { id: 'tournament', cost: 30,   fps: 14,  growth: 1.17 },
  { id: 'meetup',     cost: 900,  fps: 190, growth: 1.17 },
];
export const MARKET_ECON = [
  { cost: 50,     fps: 0.5 },
  { cost: 4e3,    fps: 12 },
  { cost: 3e5,    fps: 300 },
  { cost: 3e7,    fps: 9e3 },
  { cost: 3e9,    fps: 2.8e5 },
  { cost: 3e11,   fps: 9e6 },
  { cost: 3e13,   fps: 3e8 },
  { cost: 3e15,   fps: 1e10 },
];

// Houses: bought with Gold, kept after Rebirth.
export const HOUSES = [
  { id: 'room',      cost: 0,      mult: 1,  maxEquip: 2 },
  { id: 'kitnet',    cost: 6.5e12,   mult: 2,  maxEquip: 3 },
  { id: 'apartment', cost: 4e21,  mult: 5,  maxEquip: 4 },
  { id: 'bighouse',  cost: 1.5e25,   mult: 15, maxEquip: 5 },
  { id: 'mansion',   cost: 1e29,  mult: 50, maxEquip: 5 },
];

// Equipment: level 1..5. Bonus tables are multipliers (index = level-1).
export const EQUIPMENT = [
  { id: 'pc',       stat: 'gold',    bonus: [1, 1.6, 2.6, 4.5, 8] },
  { id: 'monitor',  stat: 'gold',    bonus: [1, 1.4, 2, 3.2, 5.5] },
  { id: 'mouse',    stat: 'tap',     bonus: [1, 2, 4, 8, 16] },
  { id: 'mousepad', stat: 'tap',     bonus: [1, 1.5, 2.5, 4, 7] },
  { id: 'chair',    stat: 'offline', bonus: [1, 2, 3, 4, 5] },
  { id: 'webcam',   stat: 'fame',    bonus: [1, 1.6, 2.6, 4.5, 8] },
];
// Cost to go TO level (index = target level). Diamonds + Fãs Fiéis.
export const EQUIP_COST = [null, null,
  { gems: 40,  ff: 0 },
  { gems: 120, ff: 0 },
  { gems: 300, ff: 40 },
  { gems: 700, ff: 250 },
];

// Offline: [efficiency, max hours] per chair level.
export const OFFLINE = [
  [0.25, 2], [0.35, 4], [0.5, 6], [0.65, 9], [0.8, 12],
];

// Extra gear unlocked by houses. 3 levels each, bought with Diamonds.
export const EXTRAS = [
  { id: 'mic',    house: 1, stat: 'gold',  bonus: [1, 1.5, 2.2, 3.2] },
  { id: 'rgb',    house: 1, stat: 'fame',  bonus: [1, 1.5, 2.2, 3.2] },
  { id: 'green',  house: 2, stat: 'event', bonus: [1, 1.25, 1.5, 2] },
  { id: 'guest',  house: 3, stat: 'gold',  bonus: [1, 1.6, 2.5, 4] },
  { id: 'pool',   house: 4, stat: 'all',   bonus: [1, 1.5, 2.2, 3.5] },
];
export const EXTRA_COST = [null, 100, 250, 550];

// Rebirth talents, paid with Fãs Fiéis. cost = base * growth^level
export const TALENTS = [
  { id: 'charisma', base: 1,  growth: 1.35, max: 60, per: 0.15 },  // +15% gold
  { id: 'viral',    base: 1,  growth: 1.35, max: 60, per: 0.15 },  // +15% fame
  { id: 'fingers',  base: 2,  growth: 1.5,  max: 25, per: 0.3 },   // +30% tap
  { id: 'nights',   base: 5,  growth: 1.8,  max: 8,  per: 1 },     // +1h offline cap
  { id: 'fanclub',  base: 4,  growth: 1.6,  max: 15, per: 0.1 },   // +10% autograph
  { id: 'headstart',base: 3,  growth: 1.7,  max: 15, per: 1 },     // start gold
  { id: 'deal',     base: 4,  growth: 1.6,  max: 20, per: 0.02 },  // -2% upgrade cost
  { id: 'autohype', base: 10, growth: 2.2,  max: 5,  per: 1 },     // auto taps/s
  { id: 'lucky',    base: 6,  growth: 1.7,  max: 10, per: 0.12 },  // golden clips
];

export function talentCost(t, level) { return Math.ceil(t.base * Math.pow(t.growth, level)); }
export function talentLv(s, id) { return (s.talents && s.talents[id]) || 0; }
export function talentById(id) { return TALENTS.find(t => t.id === id); }

// Fãs Fiéis earned when rebirthing, from the fame of the current run.
export const RB = { min: 1e6, k: 1, p: 0.2 };
export function rebirthGain(fameRun) {
  if (fameRun < RB.min) return 0;
  return Math.floor(RB.k * Math.pow(fameRun / RB.min, RB.p));
}
export const FF_PER = 0.1;
export function ffMult(s) { return 1 + FF_PER * (s.ffEarned || 0); }
// How much stronger (gold mult) the player gets by rebirthing now.
export function rebirthRatio(s, gain) {
  return (1 + FF_PER * ((s.ffEarned || 0) + gain)) / (1 + FF_PER * (s.ffEarned || 0));
}
export const REBIRTH_MIN_MARKET = 3; // must have unlocked CuboCraft

export function upgradeCost(s, i, level) {
  const u = UPGRADES[i];
  const disc = 1 - talentLv(s, 'deal') * talentById('deal').per;
  return u.cost * Math.pow(u.growth, level) * disc;
}

// Total cost of buying n levels starting at level l (geometric series).
export function upgradeCostN(s, i, l, n) {
  const u = UPGRADES[i];
  const first = upgradeCost(s, i, l);
  return first * (Math.pow(u.growth, n) - 1) / (u.growth - 1);
}

// Max levels affordable with gold.
export function upgradeMaxAfford(s, i, l, gold) {
  const u = UPGRADES[i];
  const first = upgradeCost(s, i, l);
  if (gold < first) return 0;
  return Math.floor(Math.log(gold * (u.growth - 1) / first + 1) / Math.log(u.growth));
}

export function upgradeGps(i, level) {
  if (level <= 0) return 0;
  return UPGRADES[i].gps * level * stepMult(level);
}

export function communityCost(m, k, level) {
  const c = COMMUNITY[k];
  return MARKET_ECON[m].cost * c.cost * Math.pow(c.growth, level);
}
export function communityCostN(m, k, l, n) {
  const c = COMMUNITY[k];
  return communityCost(m, k, l) * (Math.pow(c.growth, n) - 1) / (c.growth - 1);
}
export function communityMaxAfford(m, k, l, gold) {
  const c = COMMUNITY[k];
  const first = communityCost(m, k, l);
  if (gold < first) return 0;
  return Math.floor(Math.log(gold * (c.growth - 1) / first + 1) / Math.log(c.growth));
}
export function communityFps(m, k, level) {
  if (level <= 0) return 0;
  return MARKET_ECON[m].fps * COMMUNITY[k].fps * level * stepMult(level);
}

function extraBonus(s, stat) {
  let m = 1;
  for (const e of EXTRAS) {
    const lv = (s.extras && s.extras[e.id]) || 0;
    if (e.stat === stat || e.stat === 'all') m *= e.bonus[lv];
  }
  return m;
}

function equipBonus(s, stat) {
  let m = 1;
  for (const e of EQUIPMENT) if (e.stat === stat) m *= e.bonus[(s.equip[e.id] || 1) - 1];
  return m;
}

export function rawGps(s) {
  let g = BASE_GPS;
  for (let i = 0; i < UPGRADES.length; i++) g += upgradeGps(i, s.upgrades[i] || 0);
  return g;
}

// Multiplier excluding temporary boosts.
export function goldMultBase(s) {
  return MARKETS[s.market].mult
    * HOUSES[s.house].mult
    * equipBonus(s, 'gold')
    * extraBonus(s, 'gold')
    * (1 + talentLv(s, 'charisma') * talentById('charisma').per)
    * ffMult(s)
    * (s.iap && s.iap.goldBoost ? 2 : 1)
    * TUNE.gold;
}

export function boostMult(s, now) {
  let m = 1;
  if (s.boosts && s.boosts.x2Until > now) m *= 2;
  if (s.boosts && s.boosts.clipUntil > now) m *= (s.boosts.clipMult || 7);
  return m;
}

export function gps(s, now) { return rawGps(s) * goldMultBase(s) * boostMult(s, now || 0); }
export function gpsNoBoost(s) { return rawGps(s) * goldMultBase(s); }

export function famePerSec(s) {
  let f = 0;
  for (let i = 0; i < UPGRADES.length; i++) f += (s.upgrades[i] || 0) * 0.1 * Math.pow(3, i);
  for (let m = 0; m <= s.market; m++) {
    const lv = s.community[m] || [0, 0, 0];
    for (let k = 0; k < COMMUNITY.length; k++) f += communityFps(m, k, lv[k]);
  }
  return f * fameMult(s);
}

export function fameMult(s) {
  return equipBonus(s, 'fame')
    * extraBonus(s, 'fame')
    * (1 + talentLv(s, 'viral') * talentById('viral').per)
    * (1 + 0.5 * Math.min(s.house, 4))
    * TUNE.fame;
}

// Value of a single tap (hype): a slice of gold/s scaled by mouse gear.
export function tapValue(s, now) {
  const base = Math.max(1, gpsNoBoost(s) * 0.05) + 1;
  return base * equipBonus(s, 'tap') * (1 + talentLv(s, 'fingers') * talentById('fingers').per) * boostMult(s, now || 0);
}

export function offlineParams(s) {
  const lv = (s.equip.chair || 1) - 1;
  const [eff, hours] = OFFLINE[lv];
  const extraH = talentLv(s, 'nights') + (s.iap && s.iap.monthlyUntil > Date.now() ? 2 : 0);
  return { eff: Math.min(1, eff * TUNE.offline), maxSec: (hours + extraH) * 3600 };
}

export function eventMult(s) {
  return extraBonus(s, 'event') * (1 + talentLv(s, 'fanclub') * talentById('fanclub').per) * TUNE.event;
}

export function houseMaxEquip(s) { return HOUSES[s.house].maxEquip; }

// Next market fame target (or null at the last one).
export function nextMarketFame(s) {
  return s.market + 1 < MARKETS.length ? MARKETS[s.market + 1].fame : null;
}

// Starting gold after rebirth from the "headstart" talent.
export function headstartGold(s) {
  const lv = talentLv(s, 'headstart');
  return lv ? 100 * Math.pow(12, lv) : 0;
}

// World ranking from lifetime fame (fictional). 1 = biggest streamer alive.
// Piecewise log curve fitted to the balance simulator (#1 around day 140).
const RANK_CURVE = [[0, 7], [5, 6.6], [10.5, 5.7], [16.4, 4.7], [20.5, 3.3], [22.7, 2.3], [23.8, 1.7], [24.7, 0.9], [25.1, 0]];
export function worldRank(fameAll, s) {
  const L = Math.log10(Math.max(1, fameAll));
  let lr = 0;
  if (L >= RANK_CURVE[RANK_CURVE.length - 1][0]) lr = 0;
  else for (let i = 1; i < RANK_CURVE.length; i++) {
    const [x0, y0] = RANK_CURVE[i - 1], [x1, y1] = RANK_CURVE[i];
    if (L <= x1) { lr = y0 + (y1 - y0) * (L - x0) / (x1 - x0); break; }
  }
  let r = Math.max(1, Math.round(Math.pow(10, lr)));
  if (s && r === 1 && (s.house < 4 || s.market < 7)) r = 2;
  return r;
}
