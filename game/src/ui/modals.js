// All modal screens and celebrations.
import * as E from '../economy.js';
import * as G from '../game.js';
import { S } from '../game.js';
import { t, lang } from '../i18n.js';
import { fmt, fmtMult, fmtTime, fmtInt } from '../format.js';
import { modal, confirmBox, toast, $, $$, esc } from './dom.js';
import { ic, marketBadge } from './icons.js';
import { equipIconSVG } from '../art/room.js';
import { avatarFrontSVG } from '../art/avatar.js';
import { sfx } from '../audio.js';
import { confetti, sparkles, coinBurst } from './fx.js';
import { bridge } from '../bridge.js';
import { ACHIEVEMENTS, LOGIN_REWARDS, PRODUCTS, PIGGY_MAX, PIGGY_MIN_BREAK, FREE_GEMS_PER_AD, WEEKLY_TIERS, TIME_WARPS } from '../data.js';
import { ads } from './ads.js';

const ctr = (el) => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
const gemPill = () => $('#gem-pill .ic');
const goldPill = () => $('#gold-pill .ic');
const gemsBurst = (el, n) => { const [x, y] = ctr(el); coinBurst(x, y, Math.min(14, Math.max(4, n / 5)), gemPill(), 'gem'); };
const goldBurst = (el) => { const [x, y] = ctr(el); coinBurst(x, y, 12, goldPill()); };

// ---------------- offline ----------------
export function offlineModal(o, done) {
  const m = modal({
    cls: 'offline', noBackdropClose: true, noClose: true,
    title: t('offlineTitle'), icon: ic('clock'),
    body: `<div class="sleep-art">${avatarFrontSVG(S.profile.avatar, { expr: 'sleepy' })}</div>
      <p class="center">${t('offlineSub', { t: fmtTime(o.sec) })}</p>
      <div class="big-reward">${ic('gold')}<b>${fmt(o.gold)}</b></div>
      ${o.fame > 1 ? `<p class="center small">${ic('star')} +${fmt(o.fame)} ${t('fame')}</p>` : ''}
      ${o.capped ? `<p class="center muted small">${t('offlineCap')}</p>` : ''}`,
    buttons: [
      { label: t('collect'), cls: 'ghost', onClick: (api) => { G.applyOffline(o, 1); goldBurst($('.big-reward', api.el)); sfx.coin(); done && done(); } },
      { label: `${ic('play')} ${t('offlineDouble')} ${fmt(o.gold * 2)}`, cls: 'primary ad', close: false, onClick: (api) => {
        ads.rewarded('offline_double').then(ok => {
          if (!ok) return;
          G.applyOffline(o, 2); goldBurst($('.big-reward', api.el)); sfx.coin(); api.close(); done && done();
        });
      } },
    ],
  });
  return m;
}

// ---------------- daily login ----------------
export function loginModal() {
  const cyc = S.login.cycle;
  const days = LOGIN_REWARDS.map((r, i) => {
    const got = i < cyc || (i === cyc && S.login.claimedToday);
    const today = i === cyc && !S.login.claimedToday;
    const label = r.gems ? `${ic('gem')}<b>${r.gems}</b>` : r.goldMin ? `${ic('gold')}<b>${r.goldMin}m</b>` : `${ic('rocket')}<b>x2 ${r.boostMin}m</b>`;
    return `<div class="day ${got ? 'got' : ''} ${today ? 'today' : ''} ${i === 6 ? 'big' : ''}"><small>${t('loginDay', { n: i + 1 })}</small>${label}${got ? `<span class="tick">${ic('check')}</span>` : ''}</div>`;
  }).join('');
  modal({
    title: t('login'), icon: ic('gift'), cls: 'login',
    body: `<div class="days">${days}</div>`,
    buttons: S.login.claimedToday ? [{ label: t('loginTomorrow'), cls: 'ghost' }] : [{ label: t('loginClaim'), cls: 'primary', onClick: (api) => {
      const r = G.claimLogin();
      if (!r) return;
      sfx.levelUp();
      const el = $('.day.today', api.el) || api.el;
      if (r.gems) gemsBurst(el, r.gems);
      if (r.gold) goldBurst(el);
      if (r.boostMin) toast(ic('rocket') + ' ' + t('boostActive', { t: fmtTime(G.boostLeft()) }));
    } }],
  });
}

// ---------------- missions ----------------
function missionText(m) {
  const v = m.id === 'gold' ? fmt(m.target) : Math.ceil(m.target);
  return t('ms_' + m.id, { n: v, v });
}
export function missionsModal() {
  G.resetDaily();
  const draw = (api) => {
    const rows = S.daily.missions.map((m, i) => {
      const p = Math.min(1, m.progress / m.target);
      const ready = !m.claimed && p >= 1;
      return `<div class="mission ${m.claimed ? 'done' : ''} ${ready ? 'ready' : ''}">
        <div class="ms-main"><b>${missionText(m)}</b><div class="bar"><i style="width:${p * 100}%"></i><span>${m.id === 'gold' ? fmt(m.progress) + '/' + fmt(m.target) : Math.floor(m.progress) + '/' + Math.ceil(m.target)}</span></div></div>
        ${m.claimed ? ic('check') : ready ? `<button class="btn primary sm" data-claim="${i}">${ic('gem')}10</button>` : (S.daily.rerolls < 1 ? `<button class="btn ghost sm" data-reroll="${i}">${ic('play')} ${t('reroll')}</button>` : `<span class="ms-gem">${ic('gem')}10</span>`)}
      </div>`;
    }).join('');
    const chestReady = G.chestReady();
    const weekly = WEEKLY_TIERS.map((w, i) => `<button class="wk ${S.weekly.claimed.includes(i) ? 'got' : S.weekly.done >= w.n ? 'ready' : ''}" data-week="${i}"><b>${w.n}</b>${ic('gem')}<small>${w.gems}</small></button>`).join('');
    api.body.innerHTML = `${rows}
      <div class="chest ${chestReady ? 'ready' : ''} ${S.daily.chest ? 'got' : ''}" data-chest="1">${ic('gift')}<div><b>${t('chest')}</b><small>${t('missionsAll')}</small></div>${S.daily.chest ? ic('check') : `<span>${ic('gem')}25 + ${ic('gold')}</span>`}</div>
      <h3 class="sec">${t('weekly')}</h3><p class="small muted">${t('weeklyDesc', { n: S.weekly.done })}</p>
      <div class="weekly"><div class="bar"><i style="width:${Math.min(100, S.weekly.done / 21 * 100)}%"></i></div>${weekly}</div>`;
  };
  const api = modal({ title: t('dailyMissions'), icon: ic('missions'), cls: 'missions', body: '' });
  draw(api);
  api.body.addEventListener('click', (e) => {
    const c = e.target.closest('[data-claim]');
    if (c) { if (G.claimMission(+c.dataset.claim)) { sfx.coin(); gemsBurst(c, 10); draw(api); } return; }
    const r = e.target.closest('[data-reroll]');
    if (r) { ads.rewarded('mission_reroll').then(ok => { if (ok) { G.rerollMission(+r.dataset.reroll); draw(api); } }); return; }
    const ch = e.target.closest('[data-chest]');
    if (ch && G.chestReady()) { const res = G.claimChest(); sfx.levelUp(); gemsBurst(ch, res.gems); goldBurst(ch); confetti(40); draw(api); return; }
    const w = e.target.closest('[data-week]');
    if (w && G.claimWeekly(+w.dataset.week)) { sfx.levelUp(); gemsBurst(w, 40); draw(api); }
  });
}

// ---------------- achievements ----------------
export function achievementsModal() {
  const label = (a, tier) => {
    if (a.market) return t('ach_market_d', { g: t('mk_' + E.MARKETS[tier].id) });
    if (a.house) return t('ach_house_d', { h: t('h_' + E.HOUSES[tier].id) });
    if (a.big) return t('ach_gold_d', { v: fmt(tier) });
    return t('ach_' + a.id + '_d', { n: fmtInt(tier) });
  };
  const draw = (api) => {
    api.body.innerHTML = ACHIEVEMENTS.map(a => {
      const st = G.achievementState(a);
      const tiers = a.tiers.map((_, i) => `<i class="${i < st.claimed ? 'on' : ''}"></i>`).join('');
      if (st.finished) return `<div class="ach done"><div class="ach-ic">${ic('trophy')}</div><div class="ach-main"><b>${t('ach_' + a.id)}</b><div class="pips">${tiers}</div></div>${ic('check')}</div>`;
      const p = a.rank ? (st.v <= st.tier ? 1 : Math.max(0, 1 - Math.log10(st.v / st.tier) / 2)) : Math.min(1, st.v / st.tier);
      const prog = a.rank ? '#' + fmtInt(st.v) : a.big ? fmt(st.v) + '/' + fmt(st.tier) : fmtInt(Math.min(st.v, st.tier)) + '/' + fmtInt(st.tier);
      return `<div class="ach ${st.done ? 'ready' : ''}"><div class="ach-ic">${ic('trophy')}</div><div class="ach-main"><b>${t('ach_' + a.id)}</b><small>${label(a, st.tier)}</small><div class="bar"><i style="width:${p * 100}%"></i><span>${prog}</span></div><div class="pips">${tiers}</div></div>
        ${st.done ? `<button class="btn primary sm" data-ach="${a.id}">${ic('gem')}${a.gems[st.claimed]}</button>` : `<span class="ms-gem">${ic('gem')}${a.gems[st.claimed]}</span>`}</div>`;
    }).join('');
  };
  const api = modal({ title: t('achievements'), icon: ic('trophy'), cls: 'achievements', body: '' });
  draw(api);
  api.body.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ach]');
    if (!b) return;
    const a = ACHIEVEMENTS.find(x => x.id === b.dataset.ach);
    const g = G.claimAchievement(a);
    if (g) { sfx.levelUp(); gemsBurst(b, g); draw(api); }
  });
}

// ---------------- stats ----------------
export function statsModal() {
  const rows = [
    ['st_goldAll', fmt(S.goldAll)], ['st_fameAll', fmt(S.fameAll)], ['st_taps', fmtInt(S.stats.taps)], ['st_upgrades', fmtInt(S.stats.upgrades)],
    ['st_signed', fmtInt(S.stats.signed)], ['st_events', fmtInt(S.stats.events)], ['st_clips', fmtInt(S.stats.clips)], ['st_rebirths', fmtInt(S.rebirths)],
    ['st_days', fmtInt(S.stats.days)], ['st_playtime', fmtTime(S.stats.playSec)],
  ];
  modal({ title: t('stats'), icon: ic('chart'), cls: 'stats', body: `<div class="stat-list">${rows.map(([k, v]) => `<div><span>${t(k)}</span><b>${v}</b></div>`).join('')}</div>
    <div class="mult-list">
      <div><span>${t('tabGames')}</span><b>${fmtMult(E.MARKETS[S.market].mult)}</b></div>
      <div><span>${t('tabHouses')}</span><b>${fmtMult(E.HOUSES[S.house].mult)}</b></div>
      <div><span>${t('ff')}</span><b>${fmtMult(E.ffMult(S))}</b></div>
      <div><span>${t('tl_charisma')}</span><b>${fmtMult(1 + E.talentLv(S, 'charisma') * 0.15)}</b></div>
      <div><span>${t('tabSetup')}</span><b>${fmtMult(E.goldMultBase(S) / E.MARKETS[S.market].mult / E.HOUSES[S.house].mult / E.ffMult(S) / (1 + E.talentLv(S, 'charisma') * 0.15) / (S.iap.goldBoost ? 2 : 1))}</b></div>
      ${S.iap.goldBoost ? `<div><span>${t('p_gold_boost')}</span><b>x2</b></div>` : ''}
    </div>` });
}

// ---------------- equipment upgrade ----------------
export function equipModal(id, onDone) {
  const lv = S.equip[id];
  if (lv >= 5) return;
  const c = E.EQUIP_COST[lv + 1];
  const st = G.canUpgradeEquip(id);
  modal({
    cls: 'equip-up', title: t('eq_' + id),
    body: `<div class="eq-compare"><div>${equipIconSVG(id, lv)}<small>${t('eq_' + id + '_' + lv)}</small></div><span class="arrow">➜</span><div class="new">${equipIconSVG(id, lv + 1)}<small>${t('eq_' + id + '_' + (lv + 1))}</small></div></div>
      <p class="center cost-line">${ic('gem')} ${c.gems} ${c.ff ? `· ${ic('heart')} ${c.ff}` : ''}</p>
      ${st === 'cost' ? `<p class="center muted">${t('notEnough')}</p>` : ''}`,
    buttons: st === 'ok'
      ? [{ label: t('cancel'), cls: 'ghost' }, { label: t('buy'), cls: 'primary', onClick: () => { if (G.upgradeEquip(id)) onDone && onDone(); } }]
      : [{ label: t('cancel'), cls: 'ghost' }, { label: `${ic('gem')} ${t('shop')}`, cls: 'primary', onClick: () => shopModal() }],
  });
}

export function warpModal(i) {
  const w = TIME_WARPS[i];
  const v = E.gpsNoBoost(S) * w.h * 3600;
  if (S.diamonds < w.gems) { toast(ic('gem') + ' ' + t('notEnough')); shopModal(); return; }
  confirmBox(`${t('timeWarpDesc', { h: w.h })}<br><b class="big-num">${ic('gold')} ${fmt(v)}</b><br>${ic('gem')} ${w.gems}`, () => {
    const got = G.timeWarp(w.h, w.gems);
    if (got) { sfx.coin(); coinBurst(innerWidth / 2, innerHeight / 2, 14, goldPill()); }
  });
}

// ---------------- rebirth ----------------
export function rebirthModal(onDone) {
  const rb = G.rebirthInfo();
  modal({
    cls: 'rebirth', title: t('rebirthTitle'), icon: ic('rebirth'),
    body: `<p>${t('rebirthDesc')}</p>
      <div class="rb-big">${ic('heart')}<b>+${fmt(rb.gain)}</b><small>${t('ff')}</small></div>
      <p class="center"><b>${t('rebirthBonus', { a: fmtMult(rb.before), b: fmtMult(rb.after) })}</b></p>
      <div class="keep">${ic('check')} ${t('rebirthKeep')}</div>
      <div class="lose">${ic('rebirth')} ${t('rebirthLose')}</div>`,
    buttons: [{ label: t('cancel'), cls: 'ghost' }, { label: t('rebirth'), cls: 'primary', onClick: () => { if (G.doRebirth()) onDone && onDone(rb); } }],
  });
}

// ---------------- celebrations ----------------
export function celebrate({ title, sub, art, cls = '', onClose, fanfare = true, buttons }) {
  if (fanfare) sfx.fanfare();
  confetti(140);
  return modal({
    cls: 'celebrate ' + cls, noClose: false,
    body: `<div class="rays"></div><div class="cel-art">${art || ''}</div><h2 class="cel-title">${title}</h2>${sub ? `<p class="center">${sub}</p>` : ''}`,
    buttons: buttons || [{ label: t('continue'), cls: 'primary' }],
    onClose,
  });
}

export function marketCelebrate(m, onClose) {
  const mk = E.MARKETS[m];
  return celebrate({
    title: t('marketUnlocked'), sub: t('marketUnlockedSub', { g: `<b>${t('mk_' + mk.id)}</b>`, m: fmtMult(mk.mult) }),
    art: marketBadge(mk.id, 'hero'), onClose,
  });
}

export function letterModal(key, onClose) {
  sfx.notify();
  const vovo = { skin: 1, body: 1, hair: 6, hairColor: 11, outfit: 2, outfitColor: 5, hat: 'none', glasses: 'round', neck: 'none' };
  const vovoA = { skin: 1, body: 2, hair: 1, hairColor: 11, outfit: 2, outfitColor: 9, hat: 'none', glasses: 'square', neck: 'none' };
  return modal({
    cls: 'letter', onClose,
    body: `<div class="letter-paper"><div class="grands">${avatarFrontSVG(vovo, { expr: 'happy' })}${avatarFrontSVG(vovoA, { expr: 'happy' })}</div>
      <small>${t('letterFrom')}</small><p>${t('letter_' + key)}</p><div class="sig">♥ Vovó & Vovô</div></div>`,
    buttons: [{ label: '❤', cls: 'primary' }],
  });
}

// ---------------- shop ----------------
let priceCache = {};
export function setPrices(p) { priceCache = p || {}; }
const priceOf = (p) => priceCache[p.id] || p.price;

export function shopModal(onPurchase) {
  const draw = (api) => {
    const special = [];
    if (!S.iap.starter) special.push(PRODUCTS.find(p => p.id === 'starter_pack'));
    if (!S.iap.removeAds) special.push(PRODUCTS.find(p => p.id === 'remove_ads'));
    if (!S.iap.goldBoost) special.push(PRODUCTS.find(p => p.id === 'gold_boost'));
    special.push(PRODUCTS.find(p => p.id === 'monthly_pass'));
    const card = (p, title, desc, art) => `<div class="offer offer-${p.id}"><div class="of-art">${art}</div><div class="of-info"><b>${title}</b><small>${desc}</small></div><button class="btn primary sm" data-buy="${p.id}">${priceOf(p)}</button></div>`;
    const specials = special.map(p => {
      if (p.id === 'starter_pack') return card(p, t('p_starter'), t('p_starter_d'), equipIconSVG('chair', 4)) ;
      if (p.id === 'remove_ads') return card(p, t('p_remove_ads'), t('p_remove_ads_d'), `<div class="noads">${ic('play')}</div>`);
      if (p.id === 'gold_boost') return card(p, t('p_gold_boost'), t('p_gold_boost_d'), ic('gold', 'xl'));
      if (p.id === 'monthly_pass') {
        const act = G.monthlyActive();
        const d = new Date(S.iap.monthlyUntil).toLocaleDateString();
        return `<div class="offer offer-monthly ${act ? 'active' : ''}"><div class="of-art">${ic('missions', 'xl')}</div><div class="of-info"><b>${t('p_monthly')}</b><small>${act ? t('monthlyActive', { d }) : t('p_monthly_d')}</small></div>
          ${act ? (G.monthlyClaimReady() ? `<button class="btn primary sm" data-monthly="1">${ic('gem')}40</button>` : ic('check')) : `<button class="btn primary sm" data-buy="${p.id}">${priceOf(p)}</button>`}</div>`;
      }
      return '';
    }).join('');
    const piggy = S.iap.piggy || 0;
    const pig = PRODUCTS.find(p => p.id === 'piggy_bank');
    const piggyCard = `<div class="offer piggy"><div class="of-art"><svg viewBox="0 0 40 32"><ellipse cx="20" cy="18" rx="15" ry="11" fill="#ff9fc0" stroke="#2a1f3d" stroke-width="2"/><circle cx="33" cy="16" r="4.5" fill="#ffb8d0" stroke="#2a1f3d" stroke-width="2"/><circle cx="32" cy="15" r="1" fill="#2a1f3d"/><circle cx="34" cy="15" r="1" fill="#2a1f3d"/><rect x="15" y="6" width="9" height="2.4" rx="1.2" fill="#2a1f3d"/><path d="M10 27v3M28 27v3" stroke="#2a1f3d" stroke-width="3" stroke-linecap="round"/><path d="M7 10l-2-4 5 2" fill="#ff9fc0" stroke="#2a1f3d" stroke-width="1.6"/></svg></div>
      <div class="of-info"><b>${t('p_piggy')}</b><small>${t('p_piggy_d')}</small><div class="bar"><i style="width:${piggy / PIGGY_MAX * 100}%"></i><span>${t('piggyFill', { n: piggy, m: PIGGY_MAX })}</span></div></div>
      <button class="btn primary sm ${piggy < PIGGY_MIN_BREAK ? 'off' : ''}" data-buy="${pig.id}">${priceOf(pig)}</button></div>`;
    const left = G.freeGemsLeft();
    const free = `<div class="offer free"><div class="of-art">${ic('gem', 'xl')}</div><div class="of-info"><b>${t('freeGems')}</b><small>${left > 0 ? t('freeGemsDesc', { n: FREE_GEMS_PER_AD, r: left }) : t('freeGemsNone')}</small></div>${left > 0 ? `<button class="btn ad sm" data-freegems="1">${ic('play')} +${FREE_GEMS_PER_AD}</button>` : ''}</div>`;
    const packs = PRODUCTS.filter(p => p.gems).map((p, i) => `<button class="pack ${p.tag ? 'tag-' + p.tag : ''}" data-buy="${p.id}">${p.tag ? `<em>${t(p.tag === 'best' ? 'bestValue' : 'popular')}</em>` : ''}<div class="gems-pile">${Array.from({ length: Math.min(5, i + 1) }, () => ic('gem')).join('')}</div><b>${fmtInt(p.gems)}</b><span>${priceOf(p)}</span></button>`).join('');
    api.body.innerHTML = `${free}<h3 class="sec">${t('shopSpecial')}</h3>${specials}${piggyCard}<h3 class="sec">${t('shopGems')}</h3><div class="packs">${packs}</div>
      <button class="link" data-restore="1">${t('restore')}</button>`;
  };
  const api = modal({ title: t('shop'), icon: ic('bag'), cls: 'shop', body: '' });
  draw(api);
  api.body.addEventListener('click', async (e) => {
    const fg = e.target.closest('[data-freegems]');
    if (fg) {
      const ok = await ads.rewarded('free_gems');
      if (ok) { G.grantFreeGems(); sfx.coin(); gemsBurst(fg, FREE_GEMS_PER_AD); draw(api); }
      return;
    }
    const mo = e.target.closest('[data-monthly]');
    if (mo) { if (G.claimMonthly()) { sfx.coin(); gemsBurst(mo, 40); draw(api); } return; }
    const rs = e.target.closest('[data-restore]');
    if (rs) { onPurchase && onPurchase('restore'); return; }
    const b = e.target.closest('[data-buy]');
    if (b) {
      if (b.classList.contains('off')) { sfx.error(); return; }
      const p = PRODUCTS.find(x => x.id === b.dataset.buy);
      onPurchase && onPurchase(p, () => { draw(api); });
    }
  });
  return api;
}

// ---------------- autograph lobby ----------------
export function autographLobby(start) {
  G.resetAutographDay();
  const passes = S.autograph.passes;
  const msLeft = (() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1) - n; })();
  const venue = G.venueFor();
  modal({
    cls: 'auto-lobby', title: t('autoTitle'), icon: ic('pen'),
    body: `<div class="venue-tag">${t('venue_' + venue)}</div><p class="center">${t('autoDesc')}</p>
      <div class="passes">${Array.from({ length: G.maxPasses() }, (_, i) => `<span class="pass ${i < passes ? 'on' : ''}">${ic('pen')}</span>`).join('')}</div>
      <p class="center small">${t('autoPasses', { n: passes, m: G.maxPasses() })}${passes < G.maxPasses() ? ' · ' + t('autoRefill', { t: fmtTime(msLeft / 1000) }) : ''}</p>
      <p class="center small muted">${t('autoBase')} ≈ ${ic('gold')} ${fmt(E.gpsNoBoost(S) * 600)}</p>`,
    buttons: passes > 0
      ? [{ label: t('autoStart'), cls: 'primary', onClick: () => { S.autograph.passes--; start(); } }]
      : (!S.autograph.extraUsed ? [{ label: `${ic('play')} ${t('autoExtra')}`, cls: 'ad', close: false, onClick: (api) => { ads.rewarded('autograph_pass').then(ok => { if (ok) { S.autograph.extraUsed = true; api.close(); start(); } }); } }] : [{ label: t('close'), cls: 'ghost' }]),
  });
}

// ---------------- boost ----------------
export function boostModal() {
  const left = G.boostLeft();
  modal({
    cls: 'boost', title: t('boostTitle'), icon: ic('rocket'),
    body: `<div class="boost-art">${ic('rocket', 'xl')}<b>x2</b></div><p class="center">${t('boostDesc')}</p>${left > 0 ? `<p class="center"><b>${t('boostActive', { t: fmtTime(left) })}</b></p>` : ''}`,
    buttons: G.canAdBoost() ? [{ label: `${ic('play')} +30 min`, cls: 'ad', onClick: () => { ads.rewarded('boost_x2').then(ok => { if (ok) { G.addBoost(G.adBoostMinutes()); sfx.levelUp(); toast(ic('rocket') + ' ' + t('boostActive', { t: fmtTime(G.boostLeft()) })); } }); } }] : [{ label: t('ok'), cls: 'ghost' }],
  });
}
