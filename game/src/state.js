// Save data: creation, migration, persistence (localStorage + native bridge).
import * as E from './economy.js';
import { defaultAvatar } from './art/avatar.js';
import { bridge } from './bridge.js';

export const SAVE_KEY = 'qss_save_v1';
export const VERSION = 1;

export function dayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function weekKey(d = new Date()) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); // monday
  return dayKey(x);
}
export function msToMidnight(now = new Date()) {
  const m = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return m - now;
}

export function newState() {
  const now = Date.now();
  return {
    v: VERSION, created: now, lastSeen: now, lastTick: now,
    profile: { name: '', channel: '', avatar: defaultAvatar(), pet: 'none', neonColor: 0, verified: false },
    owned: {},                 // cosmetics bought: { 'hair:5': true }
    gold: 0, goldRun: 0, goldAll: 0,
    fame: 0, fameAll: 0,
    diamonds: 50, ff: 0, ffEarned: 0,
    upgrades: E.UPGRADES.map(() => 0),
    community: E.MARKETS.map(() => [0, 0, 0]),
    market: 0, maxMarket: 0, house: 0, rebirths: 0,
    equip: { pc: 1, monitor: 1, mouse: 1, mousepad: 1, chair: 1, webcam: 1 },
    extras: { mic: 0, rgb: 0, green: 0, guest: 0, pool: 0 },
    talents: {},
    boosts: { x2Until: 0, clipUntil: 0, clipMult: 7 },
    hype: 0,
    plaques: 0, bestRank: 10_000_000,
    autograph: { day: '', passes: 3, extraUsed: false, best: 0 },
    daily: { day: '', missions: [], chest: false, rerolls: 0 },
    weekly: { week: '', done: 0, claimed: [] },
    login: { last: '', cycle: 0, claimedToday: false, days: 0 },
    ads: { day: '', gems: 0, boost: 0 },
    achievements: {},          // id -> tiers claimed count
    stats: { taps: 0, upgrades: 0, community: 0, signed: 0, events: 0, clips: 0, missions: 0, playSec: 0, days: 0 },
    iap: { removeAds: false, starter: false, goldBoost: false, monthlyUntil: 0, monthlyClaim: '', piggy: 0 },
    settings: { music: true, sfx: true, vibration: true, notifications: true, lang: 'auto', numbers: 'short' },
    tutorial: 0, introDone: false, letters: {},
    offers: { starterUntil: 0 },
    cloud: { lastSync: 0 },
  };
}

// Fill any missing fields after updates.
function migrate(s) {
  const base = newState();
  const fill = (dst, src) => {
    for (const k in src) {
      if (dst[k] === undefined) dst[k] = src[k];
      else if (src[k] && typeof src[k] === 'object' && !Array.isArray(src[k]) && typeof dst[k] === 'object') fill(dst[k], src[k]);
    }
  };
  fill(s, base);
  while (s.upgrades.length < E.UPGRADES.length) s.upgrades.push(0);
  while (s.community.length < E.MARKETS.length) s.community.push([0, 0, 0]);
  s.v = VERSION;
  return s;
}

export function loadState() {
  let raw = null;
  try { raw = bridge.loadSave(); } catch (e) { /* ignore */ }
  try {
    const ls = localStorage.getItem(SAVE_KEY);
    if (ls && (!raw || safeParse(ls)?.lastSeen > safeParse(raw)?.lastSeen)) raw = ls;
  } catch (e) { /* storage blocked */ }
  const s = raw ? safeParse(raw) : null;
  return s ? migrate(s) : null;
}

function safeParse(t) { try { return JSON.parse(t); } catch (e) { return null; } }

export function serialize(s) { return JSON.stringify(s); }

export function persist(s) {
  if (typeof window !== 'undefined' && window.__noSave) return serialize(s);
  s.lastSeen = Date.now();
  const json = serialize(s);
  try { localStorage.setItem(SAVE_KEY, json); } catch (e) { /* ignore */ }
  try { bridge.writeSave(json); } catch (e) { /* ignore */ }
  return json;
}

export function importState(json) {
  const s = safeParse(json);
  return s && s.v ? migrate(s) : null;
}

// A rough "how far along" score, to compare local vs cloud saves.
export function progressScore(s) {
  return (s.house || 0) * 1e4 + (s.ffEarned ? Math.log10(1 + s.ffEarned) * 100 : 0) + Math.log10(1 + (s.fameAll || 0)) + (s.stats?.playSec || 0) / 1e6;
}
