// Game rules on top of the economy: actions, timers, missions, achievements.
import * as E from './economy.js';
import { dayKey, weekKey } from './state.js';
import {
  ACHIEVEMENTS, MISSION_POOL, WEEKLY_TIERS, LOGIN_REWARDS, PLAQUES, ECO, weeklyGems, achGems,
  AD_BOOST_MIN, AD_BOOST_MAX_MIN, GEM_SHOP, SEASON, seasonTier, premiumCatalog, cosmeticKey,
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
  // The piggy bank collects a share of the diamonds earned by playing (never shrinks old saves).
  const cur = S.iap.piggy || 0;
  S.iap.piggy = Math.max(cur, Math.min(ECO.piggyMax, cur + Math.ceil(n * ECO.piggyRate)));
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
export function freeGemsLeft() { resetDaily(); return Math.max(0, ECO.adGemsPerDay - S.ads.gems); }
export function grantFreeGems() { S.ads.gems++; addGems(ECO.adGems, 'ad'); }
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
    S.autograph.bought = 0;
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
  addSeasonXp(SEASON.xp.event);
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
  addGems(ECO.missionGems, 'mission'); piggyFeed(ECO.missionGems);
  S.stats.missions++;
  S.weekly.done++;
  addSeasonXp(SEASON.xp.mission);
  return true;
}
export function chestReady() { return !S.daily.chest && S.daily.missions.length && S.daily.missions.every(m => m.claimed); }
export function claimChest() {
  if (!chestReady()) return null;
  S.daily.chest = true;
  const gold = Math.max(1000, E.gpsNoBoost(S) * 900);
  addGems(ECO.chestGems, 'chest'); piggyFeed(ECO.chestGems); addGold(gold);
  addSeasonXp(SEASON.xp.chest);
  return { gems: ECO.chestGems, gold };
}
export function claimWeekly(i) {
  const tier = WEEKLY_TIERS[i];
  if (!tier || S.weekly.claimed.includes(i) || S.weekly.done < tier.n) return false;
  S.weekly.claimed.push(i);
  const g = weeklyGems(i);
  addGems(g, 'weekly'); piggyFeed(g);
  addSeasonXp(SEASON.xp.weekly);
  return g;
}
export function loginReward() { return LOGIN_REWARDS[S.login.cycle]; }
export function claimLogin() {
  if (S.login.claimedToday) return null;
  const r = loginReward();
  S.login.claimedToday = true;
  const out = { ...r };
  if (r.gems) { addGems(r.gems, 'login'); piggyFeed(r.gems); }
  addSeasonXp(SEASON.xp.login);
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
  const gems = achGems(a, st.claimed);
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
export function isFirstBuy(id) { return !(S.iap.firsts && S.iap.firsts[id]); }
export function grantProduct(p) {
  let gems = 0;
  if (p.gems) {
    gems = p.gems * (isFirstBuy(p.id) ? ECO.firstBuyMult : 1);
    S.iap.firsts = S.iap.firsts || {};
    S.iap.firsts[p.id] = true;
    addGems(gems, 'iap');
  }
  switch (p.special) {
    case 'season': resetSeason(); S.season.premium = true; break;
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
  return gems;
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

// ---------- diamond shop: repeatable boosts ----------
const MIN = 60000;
export function gemShopState(id) {
  const it = GEM_SHOP.find(x => x.id === id);
  if (!it) return 'none';
  resetDaily();
  if (id === 'pass' && (S.autograph.bought || 0) >= it.perDay) return 'limit';
  if (id === 'x3' && x3Left() >= it.maxMin * 60 - 1) return 'limit';
  if (S.diamonds < it.gems) return 'cost';
  return 'ok';
}
export function buyGemShop(id) {
  const it = GEM_SHOP.find(x => x.id === id);
  if (gemShopState(id) !== 'ok') return false;
  S.diamonds -= it.gems;
  const t = now();
  if (id === 'pass') { S.autograph.passes++; S.autograph.bought = (S.autograph.bought || 0) + 1; }
  if (id === 'x3') S.boosts.x3Until = Math.min(t + it.maxMin * MIN, Math.max(t, S.boosts.x3Until || 0) + it.min * MIN);
  if (id === 'viral') { S.boosts.clipUntil = t + it.min * MIN; S.boosts.clipMult = it.mult; S.stats.clips++; progressMission('clips', 1); }
  emit('gemshop', { id });
  return true;
}
export function x3Left() { return Math.max(0, ((S.boosts.x3Until || 0) - now()) / 1000); }

// ---------- weekly premium cosmetics ----------
// mulberry32 over an FNV hash of the week key: well spread even for consecutive weeks
function seeded(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  let a = h >>> 0;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export function weeklyShop() {
  const rnd = seeded('qss-week-' + weekKey());
  const pool = premiumCatalog().filter(i => !i.season);
  const pick = (rar) => { const c = pool.filter(i => rar.includes(i.rarity)); return c[Math.floor(rnd() * c.length)]; };
  return [pick(['common', 'rare']), pick(['epic']), pick(['legendary'])].filter(Boolean);
}
export function weeklyShopEnds() {
  const d = new Date(); const m = new Date(d.getFullYear(), d.getMonth(), d.getDate() + ((8 - d.getDay()) % 7 || 7));
  return m - d;
}
export function buyCosmetic(it) {
  const k = cosmeticKey(it);
  if (S.owned[k]) return 'owned';
  if (S.diamonds < it.price) return 'cost';
  S.diamonds -= it.price;
  S.owned[k] = true;
  // wear it right away
  if (it.cat === 'pet' || it.cat === 'theme') S.profile[it.cat] = it.value;
  else S.profile.avatar[it.cat] = it.value;
  emit('cosmetic', it);
  return 'ok';
}

// ---------- season pass ----------
export function seasonIndex(t = now()) { return Math.max(0, Math.floor((t - SEASON.epoch) / (SEASON.days * 86400000))); }
export function seasonEndsIn() { return SEASON.epoch + (seasonIndex() + 1) * SEASON.days * 86400000 - now(); }
export function resetSeason() {
  const id = seasonIndex();
  if (!S.season || S.season.id !== id) S.season = { id, xp: 0, premium: false, free: [], prem: [] };
  return S.season;
}
export function addSeasonXp(n) {
  if (!S || !n) return;
  const se = resetSeason();
  const before = seasonLevel();
  se.xp += n;
  if (seasonLevel() > before) emit('seasonTier', seasonLevel());
}
export function seasonLevel() { return Math.min(SEASON.tiers, Math.floor((S.season ? S.season.xp : 0) / SEASON.xpPerTier)); }
export function seasonClaimable() {
  const se = resetSeason(); const lv = seasonLevel();
  let n = 0;
  for (let i = 1; i <= lv; i++) {
    if (!se.free.includes(i)) n++;
    if (se.premium && !se.prem.includes(i)) n++;
  }
  return n;
}
export function claimSeason(i, track) {
  const se = resetSeason();
  if (i > seasonLevel() || i < 1) return null;
  const list = track === 'prem' ? se.prem : se.free;
  if (track === 'prem' && !se.premium) return null;
  if (list.includes(i)) return null;
  list.push(i);
  const r = seasonTier(i, track, se.id);
  grantSeasonReward(r);
  return r;
}
function grantSeasonReward(r) {
  if (r.gems) addGems(r.gems, 'season');
  if (r.goldMin) { r.gold = Math.max(500, E.gpsNoBoost(S) * r.goldMin * 60); addGold(r.gold); }
  if (r.boostMin) addBoost(r.boostMin);
  if (r.pass) S.autograph.passes += r.pass;
  if (r.item) { S.owned[r.item] = true; emit('cosmetic', { key: r.item }); }
}
