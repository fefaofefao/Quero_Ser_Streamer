// Bottom panel tabs. Each tab renders once and then refreshes numbers in place.
import * as E from '../economy.js';
import * as G from '../game.js';
import { S } from '../game.js';
import { t } from '../i18n.js';
import { fmt, fmtMult, fmtTime } from '../format.js';
import { $, $$, esc, bump, toast } from './dom.js';
import { ic, marketBadge } from './icons.js';
import { equipIconSVG, roomSVG, ROOM_DEFS, SCREENS } from '../art/room.js';
import { sfx } from '../audio.js';
import { coinBurst, sparkles, floatText } from './fx.js';
import { RIVALS, TIME_WARPS } from '../data.js';

let host, current = 'channel', sig = '';
let qty = 1;
const QTYS = [1, 10, 25, 'max'];
export const ui = { open: {} }; // hooks set by main (modals)

export function initPanels(el) {
  host = el;
  host.addEventListener('click', onClick);
  setupHold();
}

export function showTab(name) {
  current = name;
  sig = '';
  render();
  host.scrollTop = 0;
}
export function currentTab() { return current; }

// ---------------- signatures (structural changes trigger re-render) ----------------
function signature() {
  switch (current) {
    case 'channel': return 'c' + E.UPGRADES.map((_, i) => G.upgradeUnlocked(i) ? 1 : 0).join('') + qty + S.upgrades.map(l => Math.floor(l / E.STEP)).join(',');
    case 'games': return 'g' + S.market + qty + S.house;
    case 'setup': return 's' + JSON.stringify(S.equip) + JSON.stringify(S.extras) + S.house;
    case 'houses': return 'h' + S.house;
    case 'career': return 'k' + S.rebirths + JSON.stringify(S.talents) + G.rebirthInfo().can + S.maxMarket + (S.ffEarned > 0);
  }
  return current;
}

export function render() {
  sig = signature();
  const fn = { channel: renderChannel, games: renderGames, setup: renderSetup, houses: renderHouses, career: renderCareer }[current];
  host.innerHTML = `<div class="tab tab-${current}">${fn()}</div>`;
  refresh();
}

export function refresh() {
  if (signature() !== sig) { render(); return; }
  const refs = {}, cans = {};
  ({ channel: refChannel, games: refGames, setup: refSetup, houses: refHouses, career: refCareer }[current])(refs, cans);
  for (const el of host.querySelectorAll('[data-r]')) {
    const v = refs[el.dataset.r];
    if (v !== undefined && el._v !== v) { el._v = v; el.innerHTML = v; }
  }
  for (const el of host.querySelectorAll('[data-can]')) {
    const v = cans[el.dataset.can];
    if (v !== undefined) el.classList.toggle('off', !v);
  }
  for (const el of host.querySelectorAll('[data-w]')) {
    const v = refs[el.dataset.w];
    if (v !== undefined) el.style.width = v;
  }
}

function qtyBar() {
  return `<div class="qty">${QTYS.map(q => `<button class="${q === qty ? 'on' : ''}" data-qty="${q}">${q === 'max' ? 'MAX' : 'x' + q}</button>`).join('')}</div>`;
}

// ---------------- CHANNEL ----------------
function renderChannel() {
  let rows = '';
  let shownLocked = false;
  E.UPGRADES.forEach((u, i) => {
    if (!G.upgradeUnlocked(i)) {
      if (shownLocked) return;
      shownLocked = true;
      rows += `<div class="row locked"><div class="r-ic">${ic('lock')}</div><div class="r-main"><b>???</b><small>${t('locked')} · ${t('up_' + E.UPGRADES[i - 1].id)} Nv 1</small></div></div>`;
      return;
    }
    rows += `<div class="row" data-row="u${i}">
      <div class="r-ic">${ic('up_' + u.id)}<span class="lv" data-r="ul${i}"></span></div>
      <div class="r-main"><b>${t('up_' + u.id)}</b><small data-r="up${i}"></small>
        <div class="bar"><i data-w="us${i}"></i><span data-r="ust${i}"></span></div></div>
      <button class="buy hold" data-buy="u${i}" data-can="u${i}"><span data-r="uq${i}"></span><span class="cost">${ic('gold')}<span data-r="uc${i}"></span></span></button>
    </div>`;
  });
  return `<div class="tab-head"><div><small>${t('gold')}/s</small><b data-r="gps"></b></div>${qtyBar()}</div><div class="rows">${rows}</div>`;
}
function refChannel(refs, cans) {
  refs.gps = fmt(E.gps(S, Date.now()) * G.hypeMult()) + (G.hypeActive() ? ' <em class="hype">HYPE</em>' : '');
  const mult = E.goldMultBase(S) * E.boostMult(S, Date.now());
  E.UPGRADES.forEach((u, i) => {
    if (!G.upgradeUnlocked(i)) return;
    const l = S.upgrades[i];
    const n = G.qtyFor(i, qty);
    const cost = E.upgradeCostN(S, i, l, n);
    refs['ul' + i] = l;
    refs['up' + i] = t('produces', { v: fmt(E.upgradeGps(i, Math.max(1, l)) * mult) }) + ` <i>·</i> ${t('up_' + u.id + '_d')}`;
    const st = E.nextStep(l);
    refs['us' + i] = ((l % E.STEP) / E.STEP * 100) + '%';
    refs['ust' + i] = t('nextStep', { n: st });
    refs['uq' + i] = '+' + n;
    refs['uc' + i] = fmt(cost);
    cans['u' + i] = S.gold >= cost;
  });
}

// ---------------- GAMES ----------------
function renderGames() {
  const m = S.market;
  const mk = E.MARKETS[m];
  const next = E.MARKETS[m + 1];
  const nextBlock = next ? `
    <div class="goal">
      <div class="goal-top">${marketBadge(next.id, 'sm')}<div><small>${t('fameGoal', { g: t('mk_' + next.id) })}</small><b data-r="fg"></b></div><span class="mult-tag">${fmtMult(next.mult)}</span></div>
      <div class="bar big"><i data-w="fw"></i><span data-r="fp"></span></div>
      ${S.house < next.house ? `<div class="warn">${ic('house')} ${t('needsHouse', { h: t('h_' + E.HOUSES[next.house].id) })}</div>` : ''}
    </div>` : '';
  let actions = '';
  E.COMMUNITY.forEach((c, k) => {
    actions += `<div class="row">
      <div class="r-ic">${ic('com_' + c.id)}<span class="lv" data-r="cl${k}"></span></div>
      <div class="r-main"><b>${t('com_' + c.id)}</b><small data-r="cp${k}"></small></div>
      <button class="buy hold" data-buy="c${k}" data-can="c${k}"><span data-r="cq${k}"></span><span class="cost">${ic('gold')}<span data-r="cc${k}"></span></span></button>
    </div>`;
  });
  const road = E.MARKETS.map((x, i) => `<div class="road-it ${i < m ? 'done' : i === m ? 'cur' : 'lock'}">${marketBadge(x.id)}<small>${t('mk_' + x.id)}</small><em>${fmtMult(x.mult)}</em></div>`).join('');
  return `
    <div class="market-card" style="--mc:${mk.color}">
      ${marketBadge(mk.id, 'lg')}
      <div class="mc-info"><small>${t('streaming')}</small><b>${t('mk_' + mk.id)}</b><span>${t('mk_' + mk.id + '_g')}</span></div>
      <div class="mc-stats"><span class="mult-tag">${t('marketMult', { m: fmtMult(mk.mult) })}</span><span class="fame-rate" data-r="fr"></span></div>
    </div>
    ${nextBlock}
    <div class="tab-head slim"><b>${t('community', { g: t('mk_' + mk.id) })}</b>${qtyBar()}</div>
    <div class="rows">${actions}</div>
    <div class="road">${road}</div>`;
}
function refGames(refs, cans) {
  const m = S.market;
  const next = E.MARKETS[m + 1];
  refs.fr = ic('star') + t('fameRate', { v: fmt(E.famePerSec(S)) });
  if (next) {
    const p = Math.min(1, S.fame / next.fame);
    refs.fg = `${ic('star')} ${fmt(S.fame)} / ${fmt(next.fame)}`;
    refs.fw = (p * 100) + '%';
    const fps = E.famePerSec(S);
    const eta = fps > 0 ? (next.fame - S.fame) / fps : Infinity;
    refs.fp = p >= 1 ? '100%' : eta < 7 * 86400 ? '~' + fmtTime(eta) : Math.floor(p * 100) + '%';
  }
  E.COMMUNITY.forEach((c, k) => {
    const l = S.community[m][k];
    const n = G.communityQty(m, k, qty);
    const cost = E.communityCostN(m, k, l, n);
    refs['cl' + k] = l;
    refs['cp' + k] = ic('star') + '+' + fmt(E.communityFps(m, k, Math.max(1, l)) * E.fameMult(S)) + '/s <i>·</i> ' + t('com_' + c.id + '_d');
    refs['cq' + k] = '+' + n;
    refs['cc' + k] = fmt(cost);
    cans['c' + k] = S.gold >= cost;
  });
}

// ---------------- SETUP ----------------
function statText(stat, m) {
  return stat === 'offline' ? '' : t('stat_' + stat, { m: fmtMult(m) });
}
function offlineText(lv) {
  const [eff, h] = E.OFFLINE[lv - 1];
  return t('stat_offline', { p: Math.round(eff * 100), h: h + E.talentLv(S, 'nights') });
}
function renderSetup() {
  const cards = E.EQUIPMENT.map(eq => {
    const lv = S.equip[eq.id];
    const nextLv = Math.min(5, lv + 1);
    const pips = [1, 2, 3, 4, 5].map(i => `<i class="${i <= lv ? 'on' : ''} ${i > E.houseMaxEquip(S) ? 'cap' : ''}"></i>`).join('');
    const stat = eq.stat === 'offline' ? offlineText(lv) : statText(eq.stat, eq.bonus[lv - 1]);
    const nextStat = lv < 5 ? (eq.stat === 'offline' ? offlineText(nextLv) : statText(eq.stat, eq.bonus[nextLv - 1])) : '';
    const c = E.EQUIP_COST[nextLv];
    const st = G.canUpgradeEquip(eq.id);
    let btn;
    if (st === 'max') btn = `<div class="maxed">${ic('check')} ${t('maxed')}</div>`;
    else if (st === 'house') btn = `<div class="need">${ic('house')} ${t('equipNeedsHouse', { n: nextLv })}</div>`;
    else btn = `<button class="buy gem" data-eq="${eq.id}" data-can="e${eq.id}">${ic('gem')}${c.gems}${c.ff ? ` ${ic('heart')}${c.ff}` : ''}</button>`;
    return `<div class="eq-card" data-card="${eq.id}">
      <div class="eq-art">${equipIconSVG(eq.id, lv)}</div>
      <div class="eq-info"><small>${t('eq_' + eq.id)} · ${t('level', { n: lv })}</small><b>${t('eq_' + eq.id + '_' + lv)}</b>
      <div class="pips">${pips}</div><span class="stat">${stat}</span>${nextStat ? `<span class="next">→ ${nextStat}</span>` : ''}</div>
      ${btn}
    </div>`;
  }).join('');
  const extras = E.EXTRAS.map(e => {
    const lv = S.extras[e.id] || 0;
    const st = G.canBuyExtra(e);
    const name = lv ? t('ex_' + e.id + '_' + lv) : t('ex_' + e.id);
    const stat = t('stat_' + e.stat, { m: fmtMult(e.bonus[lv]) });
    let btn;
    if (st === 'max') btn = `<div class="maxed">${ic('check')}</div>`;
    else if (st === 'house') btn = `<div class="need">${ic('lock')} ${t('exNeedsHouse', { h: t('h_' + E.HOUSES[e.house].id) })}</div>`;
    else btn = `<button class="buy gem" data-ex="${e.id}" data-can="x${e.id}">${ic('gem')}${E.EXTRA_COST[lv + 1]}</button>`;
    return `<div class="row ex-row ${st === 'house' ? 'locked' : ''}"><div class="r-ic">${ic(e.id === 'mic' ? 'tv' : e.id === 'rgb' ? 'star' : e.id === 'green' ? 'user' : e.id === 'guest' ? 'up_collab' : 'gift')}<span class="lv">${lv}/3</span></div>
      <div class="r-main"><b>${name}</b><small>${stat}${lv < 3 && st !== 'house' ? ` → ${fmtMult(e.bonus[lv + 1])}` : ''}</small></div>${btn}</div>`;
  }).join('');
  const warps = TIME_WARPS.map((w, i) => `<button class="warp" data-warp="${i}" data-can="w${i}">${ic('clock')}<b>${w.h}h</b><small data-r="wv${i}"></small><span>${ic('gem')}${w.gems}</span></button>`).join('');
  return `<div class="eq-grid">${cards}</div>
    <h3 class="sec">${ic('star')} ${t('extras')}</h3><div class="rows">${extras}</div>
    <h3 class="sec">${ic('clock')} ${t('timeWarp')}</h3><div class="warps">${warps}</div>`;
}
function refSetup(refs, cans) {
  E.EQUIPMENT.forEach(eq => { cans['e' + eq.id] = G.canUpgradeEquip(eq.id) === 'ok'; });
  E.EXTRAS.forEach(e => { cans['x' + e.id] = G.canBuyExtra(e) === 'ok'; });
  TIME_WARPS.forEach((w, i) => { refs['wv' + i] = '+' + fmt(E.gpsNoBoost(S) * w.h * 3600); cans['w' + i] = S.diamonds >= w.gems; });
}

// ---------------- HOUSES ----------------
function houseThumb(h) {
  const cap = E.HOUSES[h].maxEquip;
  const eq = {}; for (const k in S.equip) eq[k] = Math.min(S.equip[k], cap);
  const fake = { ...S, house: h, equip: eq, plaques: Math.min(S.plaques, h + 1), extras: h > S.house ? {} : S.extras };
  const r = roomSVG(fake, { phase: 'day' });
  const sc = SCREENS[eq.monitor - 1];
  return `<svg viewBox="0 0 400 340" class="house-thumb">${r.below}<rect x="${sc.x}" y="${sc.y}" width="${sc.w}" height="${sc.h}" fill="#5b4bd6"/>${r.above}</svg>`;
}
function renderHouses() {
  return E.HOUSES.map((h, i) => {
    const owned = i <= S.house;
    const isNext = i === S.house + 1;
    let foot;
    if (i === S.house) foot = `<div class="cur-tag">${ic('check')} ${t('houseCurrent')}</div>`;
    else if (owned) foot = `<div class="cur-tag dim">${ic('check')}</div>`;
    else if (isNext) foot = `<button class="buy big-buy" data-house="${i}" data-can="h${i}">${t('moveIn')} <span class="cost">${ic('gold')}${fmt(h.cost)}</span></button><div class="bar"><i data-w="hw"></i><span data-r="hp"></span></div>`;
    else foot = `<div class="need">${ic('lock')} ${fmt(h.cost)} ${t('gold')}</div>`;
    return `<div class="house-card ${owned ? 'owned' : ''} ${isNext ? 'next' : ''} ${i > S.house + 1 ? 'far' : ''}">
      <div class="hc-art">${i <= S.house + 1 ? houseThumb(i) : `<div class="mystery">${ic('house')}</div>`}<span class="mult-tag">${t('houseMult', { m: fmtMult(h.mult) })}</span></div>
      <div class="hc-info"><b>${i + 1}. ${t('h_' + h.id)}</b><small>${t('h_' + h.id + '_d')}</small><small>${ic('pc')} ${t('houseEquip', { n: h.maxEquip })}</small></div>
      ${foot}</div>`;
  }).join('') + `<p class="hint">${ic('heart')} ${t('houseKeep')}</p>`;
}
function refHouses(refs, cans) {
  const h = E.HOUSES[S.house + 1];
  if (h) {
    cans['h' + (S.house + 1)] = S.gold >= h.cost;
    refs.hw = Math.min(100, S.gold / h.cost * 100) + '%';
    const g = E.gps(S, Date.now());
    const eta = g > 0 ? (h.cost - S.gold) / g : Infinity;
    refs.hp = S.gold >= h.cost ? '100%' : eta < 7 * 86400 ? '~' + fmtTime(eta) : Math.floor(S.gold / h.cost * 100) + '%';
  }
}

// ---------------- CAREER ----------------
function ladder(rank) {
  const rows = [];
  const names = RIVALS;
  const around = [rank * 0.62, rank * 0.8, rank, rank * 1.25, rank * 1.6].map(r => Math.max(1, Math.round(r)));
  const uniq = [...new Set(around)].sort((a, b) => a - b);
  uniq.forEach((r, i) => {
    const me = r === rank;
    const name = me ? esc(S.profile.channel || t('rankYou')) : names[(r * 7 + i) % names.length];
    rows.push(`<div class="lad ${me ? 'me' : ''}"><span>#${r.toLocaleString()}</span><b>${name}</b>${me && S.profile.verified ? ic('check') : ''}</div>`);
  });
  return rows.join('');
}
function renderCareer() {
  const rank = E.worldRank(S.fameAll, S);
  const rb = G.rebirthInfo();
  let rebirthBody;
  if (!rb.unlocked) rebirthBody = `<p class="need">${ic('lock')} ${t('rebirthNeed', { g: t('mk_' + E.MARKETS[E.REBIRTH_MIN_MARKET].id) })}</p>`;
  else rebirthBody = `<div class="rb-gain"><b data-r="rbg"></b><small data-r="rbb"></small></div>
      <button class="buy big-buy rebirth-btn" data-rebirth="1" data-can="rb">${ic('rebirth')} ${t('rebirth')}</button>
      <small class="muted" data-r="rbl"></small>`;
  const talents = S.ffEarned > 0 || S.rebirths > 0 ? `<h3 class="sec">${ic('heart')} ${t('talents')} <span class="ff-have" data-r="ffh"></span></h3>
    <div class="talents">${E.TALENTS.map(tl => {
      const lv = E.talentLv(S, tl.id);
      return `<button class="talent ${lv >= tl.max ? 'max' : ''}" data-talent="${tl.id}" data-can="t${tl.id}"><b>${t('tl_' + tl.id)}</b><small>${t('tl_' + tl.id + '_d')}</small><span class="tl-lv">${lv}/${tl.max}</span><span class="tl-cost">${lv >= tl.max ? t('maxed') : ic('heart') + E.talentCost(tl, lv)}</span></button>`;
    }).join('')}</div>` : '';
  return `
    <div class="rank-card">
      <div class="rc-top">${ic('trophy')}<div><small>${t('rankTitle')}</small><b data-r="rank"></b></div></div>
      <div class="ladder" data-r="ladder"></div>
      <small class="muted">${t('rankGoal')}</small>
    </div>
    <div class="quick-grid">
      <button class="qg" data-open="achievements">${ic('trophy')}<span>${t('achievements')}</span><em class="badge" data-r="achb"></em></button>
      <button class="qg" data-open="avatar">${ic('shirt')}<span>${t('customize')}</span></button>
      <button class="qg" data-open="stats">${ic('chart')}<span>${t('stats')}</span></button>
    </div>
    <div class="rebirth-card">
      <div class="rb-head">${ic('rebirth')}<div><b>${t('rebirthTitle')}</b><small>${t('rebirthCount', { n: S.rebirths })} · ${t('ffBonus', { m: fmtMult(E.ffMult(S)) })}</small></div></div>
      ${rebirthBody}
    </div>
    ${talents}`;
}
function refCareer(refs, cans) {
  const rank = E.worldRank(S.fameAll, S);
  refs.rank = '#' + rank.toLocaleString();
  refs.ladder = ladder(rank);
  const n = G.achievementsReady();
  refs.achb = n ? String(n) : '';
  const rb = G.rebirthInfo();
  refs.rbg = ic('heart') + ' ' + t('rebirthGain', { n: fmt(rb.gain) });
  refs.rbb = t('rebirthBonus', { a: fmtMult(rb.before), b: fmtMult(rb.after) });
  refs.rbl = rb.gain > 0 ? '' : t('rebirthLow');
  cans.rb = rb.can;
  refs.ffh = ic('heart') + fmt(S.ff);
  E.TALENTS.forEach(tl => { const lv = E.talentLv(S, tl.id); cans['t' + tl.id] = lv < tl.max && S.ff >= E.talentCost(tl, lv); });
}

// ---------------- interactions ----------------
function buyFromButton(btn, silent = false) {
  const k = btn.dataset.buy;
  let ok = false;
  if (k[0] === 'u') { const i = +k.slice(1); ok = G.buyUpgrade(i, G.qtyFor(i, qty)); }
  else if (k[0] === 'c') { const kk = +k.slice(1); ok = G.buyCommunity(S.market, kk, G.communityQty(S.market, kk, qty)); }
  if (ok) {
    sfx.buy();
    bump(btn.closest('.row'));
    const r = btn.getBoundingClientRect();
    if (!silent) sparkles(r.left + r.width / 2, r.top + r.height / 2, 6, k[0] === 'c' ? '#ffd23f' : '#3ddc97');
    if (ui.onBuy) ui.onBuy(k);
  } else if (!silent) { sfx.error(); btn.classList.add('shake'); setTimeout(() => btn.classList.remove('shake'), 300); }
  refresh();
  return ok;
}

function onClick(e) {
  const q = e.target.closest('[data-qty]');
  if (q) { qty = q.dataset.qty === 'max' ? 'max' : +q.dataset.qty; sfx.click(); sig = ''; render(); return; }
  const b = e.target.closest('[data-buy]');
  if (b) { if (!b._held) buyFromButton(b); b._held = false; return; }
  const eq = e.target.closest('[data-eq]');
  if (eq) { ui.open.equip && ui.open.equip(eq.dataset.eq); return; }
  const ex = e.target.closest('[data-ex]');
  if (ex) {
    const def = E.EXTRAS.find(x => x.id === ex.dataset.ex);
    if (G.buyExtra(def)) { sfx.levelUp(); const r = ex.getBoundingClientRect(); sparkles(r.left + r.width / 2, r.top, 14, '#59d8ff'); render(); }
    else { sfx.error(); ui.open.shop && S.diamonds < E.EXTRA_COST[(S.extras[def.id] || 0) + 1] && toast(ic('gem') + ' ' + t('notEnough')); }
    return;
  }
  const w = e.target.closest('[data-warp]');
  if (w) { ui.open.warp && ui.open.warp(+w.dataset.warp); return; }
  const h = e.target.closest('[data-house]');
  if (h) { if (G.buyHouse()) { render(); } else sfx.error(); return; }
  const rb = e.target.closest('[data-rebirth]');
  if (rb) { ui.open.rebirth && ui.open.rebirth(); return; }
  const tl = e.target.closest('[data-talent]');
  if (tl) {
    if (G.buyTalent(tl.dataset.talent)) { sfx.levelUp(); const r = tl.getBoundingClientRect(); sparkles(r.left + r.width / 2, r.top + r.height / 2, 10, '#ff5e8e'); sig = ''; render(); }
    else sfx.error();
    return;
  }
  const o = e.target.closest('[data-open]');
  if (o) { ui.open[o.dataset.open] && ui.open[o.dataset.open](); }
}

// Hold a buy button to keep buying.
function setupHold() {
  let timer = null, btn = null, count = 0;
  const stop = () => { clearTimeout(timer); timer = null; btn = null; };
  host.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('[data-buy]');
    if (!b) return;
    btn = b; count = 0;
    const loop = () => {
      if (!btn) return;
      const cur = host.querySelector(`[data-buy="${btn.dataset.buy}"]`) || btn;
      btn = cur;
      if (buyFromButton(cur, true)) { count++; cur._held = true; }
      timer = setTimeout(loop, Math.max(60, 160 - count * 8));
    };
    timer = setTimeout(loop, 420);
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => host.addEventListener(ev, stop));
  host.addEventListener('scroll', stop, { passive: true });
}
