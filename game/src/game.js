// Game rules on top of the economy: actions, timers, missions, achievements.
import * as E from './economy.js';
import { dayKey, weekKey } from './state.js';
import {
  ACHIEVEMENTS, MISSION_POOL, MISSION_GEMS, CHEST_GEMS, WEEKLY_TIERS, LOGIN_REWARDS, PLAQUES, PIGGY_MAX,
  AD_BOOST_MIN, AD_BOOST_MAX_MIN, FREE_GEMS_PER_AD, FREE_GEMS_ADS_PER_DAY,
} from './data.js';

export let S = null;
const subs = {};
export function on(ev, fn) { (subs[ev] = subs[ev] || []).push(fn); }
export function emit(ev, data) { (subs[ev] || []).forEach(fn => fn(data)); }
export function setState(s) { S = s; }

const now = () => Date.now();

// ---------- earnings ----------
export function addGold(v) {
  if (!(v > 0)) return;
  S.gold += v; S.goldRun += v; S.goldAll += v;
  progressMission('gold', v);
}

export function addFame(v) {
  if (!(v > 0)) return;
  S.fame += v; S.fameAll += v;
}

export function addGems(n, source) {
  S.diamonds += n;
  emit('gems', { n, source });
}

function piggyFeed(n) {
  // The piggy bank collects 50% extra of diamonds earned by playing.
  S.iap.piggy = Math.min(PIGGY_MAX, (S.iap.piggy || 0) + Math.ceil(n * 0.5));
}

export function tick(dt) {
  const t = now();
  const g = E.gps(S, t) * hypeMult();
  addGold(g * dt);
  addFame(E.famePerSec(S) * dt);
  S.stats.playSec += dt;
  progressMission('play', dt / 60);
  // hype decays
  if (S.hype > 0) S.hype = Math.max(0, S.hype - dt * (hypeActive() ? 0.06 : 0.18));
  if (S.hypeUntil && S.hypeUntil < t) S.hypeUntil = 0;
  // auto hype talent
  const auto = E.talentLv(S, 'autohype');
  if (auto) { autoAcc += dt * auto; while (autoAcc >= 1) { autoAcc -= 1; tap(true); } }
  checkMarkets();
}
let autoAcc = 0;

// ---------- hype / taps ----------
export function hypeActive() { return S.hypeUntil > now(); }
export function hypeMult() { return hypeActive() ? 2 : 1; }
export function tap(auto = false) {
  const v = E.tapValue(S, now()) * hypeMult();
  addGold(v);
  if (!auto) {
    S.stats.taps++;
    progressMission('taps', 1);
    if (!hypeActive()) {
      S.hype = Math.min(1, S.hype + 0.025 * (1 + 0.15 * (S.equip.mousepad - 1)));
      if (S.hype >= 1) { S.hypeUntil = now() + 12000; S.hype = 1; emit('hype'); }
    }
  }
  return v;
}

// ---------- channel upgrades ----------
export function qtyFor(i, mode) {
  const l = S.upgrades[i];
  if (mode === 'max') return Math.max(1, E.upgradeMaxAfford(S, i, l, S.gold));
  return mode;
}
export function buyUpgrade(i, n) {
  const l = S.upgrades[i];
  const cost = E.upgradeCostN(S, i, l, n);
  if (S.gold < cost || n <= 0) return false;
  S.gold -= cost;
  const before = Math.floor(l / E.STEP);
  S.upgrades[i] += n;
  S.stats.upgrades += n;
  progressMission('upgrades', n);
  if (Math.floor(S.upgrades[i] / E.STEP) > before) emit('step', { i });
  return true;
}
export function upgradeUnlocked(i) { return i === 0 || S.upgrades[i - 1] > 0 || S.upgrades[i] > 0; }

// ---------- communities / markets ----------
export function communityQty(m, k, mode) {
  if (mode === 'max') return Math.max(1, E.communityMaxAfford(m, k, S.community[m][k], S.gold));
  return mode;
}
export function buyCommunity(m, k, n) {
  const l = S.community[m][k];
  const cost = E.communityCostN(m, k, l, n);
  if (S.gold < cost) return false;
  S.gold -= cost;
  S.community[m][k] += n;
  S.stats.community += n;
  progressMission('community', n);
  return true;
}
function checkMarkets() {
  // markets unlock automatically, with a celebration
  while (E.canUnlockMarket(S, S.market + 1)) {
    S.market++;
    const first = S.market > S.maxMarket;
    S.maxMarket = Math.max(S.maxMarket, S.market);
    emit('market', { m: S.market, first });
  }
}

// ---------- houses ----------
export function buyHouse() {
  const h = E.HOUSES[S.house + 1];
  if (!h || S.gold < h.cost) return false;
  S.gold -= h.cost;
  S.house++;
  emit('house', { h: S.house });
  return true;
}

// ---------- equipment & extras ----------
export function equipCost(id) {
  const lv = S.equip[id];
  return lv >= 5 ? null : E.EQUIP_COST[lv + 1];
}
export function canUpgradeEquip(id) {
  const lv = S.equip[id];
  if (lv >= 5) return 'max';
  if (lv + 1 > E.houseMaxEquip(S)) return 'house';
  const c = E.EQUIP_COST[lv + 1];
  if (S.diamonds < c.gems || S.ff < c.ff) return 'cost';
  return 'ok';
}
export function upgradeEquip(id) {
  if (canUpgradeEquip(id) !== 'ok') return false;
  const c = E.EQUIP_COST[S.equip[id] + 1];
  S.diamonds -= c.gems; S.ff -= c.ff;
  S.equip[id]++;
  progressMission('equip', 1);
  emit('equip', { id, lv: S.equip[id] });
  return true;
}
export function canBuyExtra(e) {
  const lv = S.extras[e.id] || 0;
  if (lv >= 3) return 'max';
  if (S.house < e.house) return 'house';
  if (S.diamonds < E.EXTRA_COST[lv + 1]) return 'cost';
  return 'ok';
}
export function buyExtra(e) {
  if (canBuyExtra(e) !== 'ok') return false;
  S.diamonds -= E.EXTRA_COST[(S.extras[e.id] || 0) + 1];
  S.extras[e.id] = (S.extras[e.id] || 0) + 1;
  progressMission('equip', 1);
  emit('equip', { id: e.id, lv: S.extras[e.id], extra: true });
  return true;
}

// ---------- talents & rebirth ----------
export function buyTalent(id) {
  const t = E.talentById(id), lv = E.talentLv(S, id);
  if (lv >= t.max) return false;
  const c = E.talentCost(t, lv);
  if (S.ff < c) return false;
  S.ff -= c;
  S.talents[id] = lv + 1;
  return true;
}
export function rebirthInfo() {
  const gain = E.rebirthGain(S.fame);
  return {
    can: S.maxMarket >= E.REBIRTH_MIN_MARKET && S.market >= E.REBIRTH_MIN_MARKET && gain > 0,
    unlocked: S.maxMarket >= E.REBIRTH_MIN_MARKET,
    gain,
    before: E.ffMult(S),
    after: 1 + E.FF_PER * (S.ffEarned + gain),
  };
}
export function doRebirth() {
  const info = rebirthInfo();
  if (!info.can) return false;
  S.ff += info.gain; S.ffEarned += info.gain; S.rebirths++;
  S.gold = E.headstartGold(S); S.goldRun = 0;
  S.fame = 0; S.market = 0;
  S.upgrades = S.upgrades.map(() => 0);
  S.community = S.community.map(() => [0, 0, 0]);
  S.hype = 0; S.hypeUntil = 0;
  emit('rebirth', info);
  return true;
}

// ---------- offline ----------
export function computeOffline() {
  const t = now();
  const away = Math.max(0, (t - (S.lastSeen || t)) / 1000);
  if (away < 60) return null;
  const { eff, maxSec } = E.offlineParams(S);
  const sec = Math.min(away, maxSec);
  // x2 boost time overlapping the offline window also counts
  const boostSec = Math.max(0, Math.min(sec, (S.boosts.x2Until - S.lastSeen) / 1000));
  const gold = E.gpsNoBoost(S) * (sec + boostSec) * eff;
  const fame = E.famePerSec(S) * sec * eff;
  return { away, sec, gold, fame, capped: away > maxSec };
}
export function applyOffline(o, mult = 1) {
  addGold(o.gold * mult);
  addFame(o.fame);
  checkMarkets();
}

// ---------- boosts ----------
export function addBoost(min) {
  const t = now();
  const base = Math.max(t, S.boosts.x2Until || 0);
  S.boosts.x2Until = Math.min(t + AD_BOOST_MAX_MIN * 60000, base + min * 60000);
}
export function boostLeft() { return Math.max(0, (S.boosts.x2Until - now()) / 1000); }
export function canAdBoost() { return boostLeft() < (AD_BOOST_MAX_MIN - AD_BOOST_MIN) * 60; }
export function freeGemsLeft() { resetDaily(); return FREE_GEMS_ADS_PER_DAY - S.ads.gems; }
export function grantFreeGems() { S.ads.gems++; addGems(FREE_GEMS_PER_AD, 'ad'); }
export function adBoostMinutes() { return AD_BOOST_MIN; }

// ---------- golden clips / donations / raids ----------
export function clipReward(kind) {
  S.stats.clips++;
  progressMission('clips', 1);
  const g = E.gpsNoBoost(S);
  if (kind === 'mult') { S.boosts.clipUntil = now() + 30000; S.boosts.clipMult = 7; return { kind, m: 7, s: 30 }; }
  if (kind === 'gems') { const n = 2 + Math.floor(Math.random() * 3); addGems(n, 'clip'); piggyFeed(n); return { kind, n }; }
  const v = Math.max(50, g * 600); addGold(v); return { kind: 'gold', v };
}
export function donationReward() {
  S.stats.clips++;
  progressMission('clips', 1);
  const v = Math.max(20, E.gpsNoBoost(S) * 60);
  addGold(v);
  return v;
}
export function raidReward() {
  const f = Math.max(10, E.famePerSec(S) * 120);
  addFame(f);
  return f;
}

// ---------- autograph event ----------
export function resetAutographDay() {
  const d = dayKey();
  if (S.autograph.day !== d) {
    S.autograph.day = d;
    S.autograph.passes = maxPasses();
    S.autograph.extraUsed = false;
  }
}
export function maxPasses() { return 3 + (monthlyActive() ? 1 : 0); }
export function venueFor() {
  if (S.market >= 6 || S.house >= 4) return 'stadium';
  if (S.market >= 4) return 'con';
  if (S.market >= 2) return 'store';
  return 'fair';
}
export function fanCount() {
  // more fame => more fans in line (30 s event)
  const L = Math.log10(1 + S.fame);
  return Math.max(8, Math.min(40, Math.round(8 + L * 1.6)));
}
export function autographReward(signed, total, rareGems) {
  const frac = total ? signed / total : 0;
  const base = E.gpsNoBoost(S) * 600;
  const gold = Math.max(500, base * (1 + 0.5 * frac) * E.eventMult(S));
  return { gold, frac, gems: rareGems };
}
export function finishAutograph(res, mult = 1) {
  addGold(res.gold * mult);
  if (res.gems) { addGems(res.gems, 'fan'); piggyFeed(res.gems); }
  S.stats.events++;
  progressMission('event', 1);
}

// ---------- daily: login, missions, weekly ----------
export function monthlyActive() { return S.iap.monthlyUntil > now(); }

export function resetDaily() {
  const d = dayKey();
  if (S.ads.day !== d) { S.ads.day = d; S.ads.gems = 0; S.ads.boost = 0; }
  if (S.daily.day !== d) {
    S.daily.day = d;
    S.daily.chest = false;
    S.daily.rerolls = 0;
    S.daily.missions = rollMissions(3);
  }
  const w = weekKey();
  if (S.weekly.week !== w) { S.weekly.week = w; S.weekly.done = 0; S.weekly.claimed = []; }
  if (S.login.last !== d) {
    if (S.login.claimedToday) S.login.cycle = (S.login.cycle + 1) % LOGIN_REWARDS.length;
    S.login.claimedToday = false;
    S.login.last = d;
    S.stats.days++;
  }
  resetAutographDay();
}

function missionTarget(m) {
  const tier = 1 + Math.min(4, S.house) * 0.25 + Math.min(10, S.rebirths) * 0.05;
  if (m.rel) return Math.max(1000, E.gpsNoBoost(S) * m.base * 3);
  if (m.id === 'event' || m.id === 'equip') return m.base;
  return Math.ceil(m.base * tier);
}
function rollMissions(n, exclude = []) {
  const pool = MISSION_POOL.filter(m => !exclude.includes(m.id));
  const out = [];
  while (out.length < n && pool.length) {
    const i = Math.floor(Math.random() * pool.length);
    const m = pool.splice(i, 1)[0];
    if (m.gear && S.diamonds < 40) continue;
    out.push({ id: m.id, target: missionTarget(m), progress: 0, claimed: false });
  }
  return out;
}
export function rerollMission(idx) {
  const cur = S.daily.missions.map(m => m.id);
  const [m] = rollMissions(1, cur);
  if (m) { S.daily.missions[idx] = m; S.daily.rerolls++; }
}
export function progressMission(id, v) {
  if (!S || !S.daily || !S.daily.missions) return;
  for (const m of S.daily.missions) {
    if (m.id === id && !m.claimed && m.progress < m.target) {
      m.progress = Math.min(m.target, m.progress + v);
      if (m.progress >= m.target) emit('missionReady', m);
    }
  }
}
export function claimMission(i) {
  const m = S.daily.missions[i];
  if (!m || m.claimed || m.progress < m.target) return false;
  m.claimed = true;
  addGems(MISSION_GEMS, 'mission'); piggyFeed(MISSION_GEMS);
  S.stats.missions++;
  S.weekly.done++;
  return true;
}
export function chestReady() { return !S.daily.chest && S.daily.missions.length && S.daily.missions.every(m => m.claimed); }
export function claimChest() {
  if (!chestReady()) return null;
  S.daily.chest = true;
  const gold = Math.max(1000, E.gpsNoBoost(S) * 900);
  addGems(CHEST_GEMS, 'chest'); piggyFeed(CHEST_GEMS); addGold(gold);
  return { gems: CHEST_GEMS, gold };
}
export function claimWeekly(i) {
  const tier = WEEKLY_TIERS[i];
  if (!tier || S.weekly.claimed.includes(i) || S.weekly.done < tier.n) return false;
  S.weekly.claimed.push(i);
  addGems(tier.gems, 'weekly'); piggyFeed(tier.gems);
  return true;
}
export function loginReward() { return LOGIN_REWARDS[S.login.cycle]; }
export function claimLogin() {
  if (S.login.claimedToday) return null;
  const r = loginReward();
  S.login.claimedToday = true;
  const out = { ...r };
  if (r.gems) { addGems(r.gems, 'login'); piggyFeed(r.gems); }
  if (r.goldMin) { out.gold = Math.max(500, E.gpsNoBoost(S) * r.goldMin * 60); addGold(out.gold); }
  if (r.boostMin) addBoost(r.boostMin);
  return out;
}

// ---------- achievements ----------
export function statValue(a) {
  switch (a.stat) {
    case 'rankInv': return S.bestRank;
    case 'maxMarket': return S.maxMarket;
    case 'house': return S.house;
    case 'rebirths': return S.rebirths;
    case 'goldAll': return S.goldAll;
    case 'maxedGear': return Object.values(S.equip).filter(l => l >= 5).length;
    default: return S.stats[a.stat] || 0;
  }
}
export function achievementState(a) {
  const claimed = S.achievements[a.id] || 0;
  const v = statValue(a);
  const tier = a.tiers[claimed];
  const done = tier !== undefined && (a.rank ? v <= tier : v >= tier);
  return { claimed, v, tier, done, finished: claimed >= a.tiers.length };
}
export function claimAchievement(a) {
  const st = achievementState(a);
  if (!st.done) return 0;
  const gems = a.gems[st.claimed];
  S.achievements[a.id] = st.claimed + 1;
  addGems(gems, 'achievement'); piggyFeed(gems);
  return gems;
}
export function achievementsReady() { return ACHIEVEMENTS.filter(a => achievementState(a).done).length; }

// ---------- ranking ----------
export function updateRank() {
  const r = E.worldRank(S.fameAll, S);
  if (r < S.bestRank) {
    const prev = S.bestRank;
    S.bestRank = r;
    while (S.plaques < PLAQUES.length && r <= PLAQUES[S.plaques].rank) { S.plaques++; emit('plaque', PLAQUES[S.plaques - 1]); }
    if (r === 1 && prev > 1) emit('top1');
  }
  if (S.bestRank <= 1000 && !S.profile.verified) { S.profile.verified = true; emit('verified'); }
  return r;
}

// ---------- shop grants ----------
export function grantProduct(p) {
  if (p.gems) addGems(p.gems, 'iap');
  switch (p.special) {
    case 'removeAds': S.iap.removeAds = true; break;
    case 'goldBoost': S.iap.goldBoost = true; break;
    case 'starter':
      S.iap.starter = true;
      S.equip.chair = Math.max(S.equip.chair, 4);
      addGems(300, 'iap'); addBoost(120);
      break;
    case 'monthly':
      S.iap.monthlyUntil = Math.max(now(), S.iap.monthlyUntil) + 30 * 86400000;
      addGems(150, 'iap');
      S.autograph.passes++;
      break;
    case 'piggy':
      addGems(S.iap.piggy || 0, 'piggy'); S.iap.piggy = 0;
      break;
  }
}
export function monthlyClaimReady() { return monthlyActive() && S.iap.monthlyClaim !== dayKey(); }
export function claimMonthly() {
  if (!monthlyClaimReady()) return false;
  S.iap.monthlyClaim = dayKey();
  addGems(40, 'monthly');
  return true;
}
export function timeWarp(h, gems) {
  if (S.diamonds < gems) return 0;
  S.diamonds -= gems;
  const v = E.gpsNoBoost(S) * h * 3600;
  addGold(v);
  addFame(E.famePerSec(S) * h * 3600);
  return v;
}
