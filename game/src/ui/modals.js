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
import { ACHIEVEMENTS, LOGIN_REWARDS, PRODUCTS, PIGGY_MAX, PIGGY_MIN_BREAK, FREE_GEMS_PER_AD, FREE_GEMS_ADS_PER_DAY, WEEKLY_TIERS, TIME_WARPS } from '../data.js';
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

const O = '#2a1f3d';
function gemShape(x, y, r, c = '#59d8ff') {
  return `<g transform="translate(${x} ${y})"><path d="M${-r} ${-r * 0.3} L${-r * 0.55} ${-r} L${r * 0.55} ${-r} L${r} ${-r * 0.3} L0 ${r} Z" fill="${c}" stroke="${O}" stroke-width="${Math.max(1.2, r * 0.16)}" stroke-linejoin="round"/><path d="M${-r} ${-r * 0.3} L${r} ${-r * 0.3} M${-r * 0.55} ${-r} L${-r * 0.3} ${-r * 0.3} L0 ${r} L${r * 0.3} ${-r * 0.3} L${r * 0.55} ${-r}" stroke="#1d8fc2" stroke-width="${r * 0.08}" fill="none"/><path d="M${-r * 0.6} ${-r * 0.45} L${-r * 0.35} ${-r * 0.8}" stroke="#fff" stroke-width="${r * 0.14}" stroke-linecap="round"/></g>`;
}
// Bigger pack = bigger treasure.
function packArt(i) {
  const sp = `<g class="twinkle">${[[14, 12], [64, 18], [58, 52]].map(([x, y]) => `<path d="M${x} ${y - 5} L${x + 1.5} ${y - 1.5} L${x + 5} ${y} L${x + 1.5} ${y + 1.5} L${x} ${y + 5} L${x - 1.5} ${y + 1.5} L${x - 5} ${y} L${x - 1.5} ${y - 1.5} Z" fill="#fff"/>`).join('')}</g>`;
  let body = '';
  if (i === 0) body = gemShape(40, 36, 18);
  if (i === 1) body = gemShape(28, 44, 12) + gemShape(52, 44, 12, '#7be3ff') + gemShape(40, 28, 15);
  if (i === 2) body = `<path d="M18 30 Q14 60 40 62 Q66 60 62 30 Z" fill="#c08457" stroke="${O}" stroke-width="2.4"/><path d="M24 30 Q40 22 56 30" fill="#a86b3c" stroke="${O}" stroke-width="2.4"/><path d="M30 24 Q40 14 50 24" stroke="#ffd23f" stroke-width="3" fill="none"/>` + gemShape(32, 22, 9) + gemShape(48, 20, 10, '#7be3ff') + gemShape(40, 14, 8);
  if (i >= 3) {
    const big = i === 4;
    body = `${big ? '<circle cx="40" cy="38" r="30" fill="url(#packGlow)"/>' : ''}<rect x="12" y="34" width="56" height="28" rx="4" fill="${big ? '#ffc83d' : '#b8743c'}" stroke="${O}" stroke-width="2.6"/><path d="M12 42 H68" stroke="${O}" stroke-width="2"/><rect x="35" y="38" width="10" height="10" rx="2" fill="${big ? '#fff3b0' : '#ffd23f'}" stroke="${O}" stroke-width="2"/>`
      + gemShape(22, 32, 9) + gemShape(36, 28, 11, '#7be3ff') + gemShape(52, 30, 10) + gemShape(62, 32, 7, '#a78bfa') + (big ? gemShape(44, 18, 10, '#ff8fc8') + gemShape(28, 20, 7) : '')
      + `<path d="M12 34 Q40 ${big ? 4 : 14} 68 34" fill="none" stroke="${O}" stroke-width="2.6"/>`;
  }
  return `<svg viewBox="0 0 80 70"><defs><radialGradient id="packGlow"><stop offset="0" stop-color="#fff6c2" stop-opacity=".9"/><stop offset="1" stop-color="#fff6c2" stop-opacity="0"/></radialGradient></defs>${body}${sp}</svg>`;
}

function piggyArt(fill) {
  const h = 34 * Math.min(1, fill);
  const gems = Array.from({ length: Math.round(fill * 9) }, (_, k) => gemShape(36 + (k % 4) * 11 + (Math.floor(k / 4) % 2) * 5, 76 - Math.floor(k / 4) * 8, 4.2, ['#59d8ff', '#7be3ff', '#a78bfa'][k % 3])).join('');
  return `<svg viewBox="0 0 120 100" class="pig ${fill >= 1 ? 'full' : ''}">
    <defs><clipPath id="belly"><ellipse cx="56" cy="62" rx="30" ry="20"/></clipPath><linearGradient id="pigG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffc2d8"/><stop offset="1" stop-color="#ff8fb5"/></linearGradient></defs>
    <ellipse cx="58" cy="94" rx="40" ry="4" fill="#000" opacity=".25"/>
    <path d="M30 80 v10 M48 84 v8 M70 84 v8 M86 80 v10" stroke="${O}" stroke-width="7" stroke-linecap="round"/>
    <path d="M30 80 v10 M48 84 v8 M70 84 v8 M86 80 v10" stroke="#ff8fb5" stroke-width="4" stroke-linecap="round"/>
    <path d="M14 52 q-10 -4 -8 6" stroke="${O}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <ellipse cx="58" cy="56" rx="46" ry="32" fill="url(#pigG)" stroke="${O}" stroke-width="3"/>
    <path d="M34 28 L30 12 L46 22 Z" fill="#ff8fb5" stroke="${O}" stroke-width="2.6" stroke-linejoin="round"/>
    <ellipse cx="56" cy="62" rx="30" ry="20" fill="#3a2f6a" stroke="${O}" stroke-width="2.4"/>
    <g clip-path="url(#belly)"><rect x="20" y="${82 - h}" width="80" height="${h + 2}" fill="#2b7fbf" opacity=".55"/>${gems}</g>
    <ellipse cx="56" cy="62" rx="30" ry="20" fill="none" stroke="#fff" stroke-width="2" opacity=".35"/>
    <path d="M38 52 Q46 46 52 47" stroke="#fff" stroke-width="3" opacity=".5" fill="none" stroke-linecap="round"/>
    <rect x="48" y="23" width="22" height="5" rx="2.5" fill="${O}"/>
    <ellipse cx="100" cy="54" rx="10" ry="12" fill="#ffb3cd" stroke="${O}" stroke-width="2.6"/>
    <ellipse cx="97" cy="52" rx="1.8" ry="3" fill="${O}"/><ellipse cx="103" cy="52" rx="1.8" ry="3" fill="${O}"/>
    <circle cx="86" cy="38" r="3.4" fill="${O}"/><circle cx="87" cy="37" r="1.1" fill="#fff"/>
    <ellipse cx="80" cy="48" rx="5" ry="3" fill="#ff6b9d" opacity=".5"/>
    <g class="drop">${gemShape(59, 10, 6)}</g>
  </svg>`;
}

export function shopModal(onPurchase) {
  if (!S.offers.starterUntil && !S.iap.starter) S.offers.starterUntil = Date.now() + 48 * 3600e3;
  const draw = (api) => {
    const P = (id) => PRODUCTS.find(p => p.id === id);
    const left = G.freeGemsLeft();
    const free = `<div class="sh-free ${left > 0 ? '' : 'done'}">
      <div class="sf-art">${ic('gem', 'xl')}<span class="sf-plus">+${FREE_GEMS_PER_AD}</span></div>
      <div class="sf-info"><b>${t('freeGems')}</b><small>${left > 0 ? t('freeLeft', { r: left, m: FREE_GEMS_ADS_PER_DAY }) : t('freeGemsNone')}</small>
        <div class="sf-dots">${Array.from({ length: FREE_GEMS_ADS_PER_DAY }, (_, i) => `<i class="${i < FREE_GEMS_ADS_PER_DAY - left ? 'used' : ''}"></i>`).join('')}</div></div>
      ${left > 0 ? `<button class="btn ad sm pulse" data-freegems="1">${ic('play')} ${t('watchGet')}</button>` : ic('check')}</div>`;

    let starter = '';
    if (!S.iap.starter) {
      const ms = S.offers.starterUntil - Date.now();
      starter = `<div class="sh-hero">
        <div class="ribbon">${t('starterRibbon')}</div>
        <div class="hero-top"><div class="hero-art">${equipIconSVG('chair', 4)}</div>
          <div class="hero-info"><b>${t('p_starter')}</b><span class="value-tag">${t('valueX', { n: 5 })}</span>
          ${ms > 0 ? `<small class="timer">${ic('clock')} ${t('offerEnds', { t: fmtTime(ms / 1000) })}</small>` : `<small class="timer">${t('onlyOnce')}</small>`}</div></div>
        <div class="chips"><span>${ic('user')} ${t('eq_chair_4')}</span><span>${ic('gem')} 300</span><span>${ic('rocket')} x2 · 2h</span></div>
        <button class="btn buy-hero" data-buy="starter_pack">${priceOf(P('starter_pack'))}</button></div>`;
    }

    const vip = S.iap.removeAds ? '' : `<div class="sh-card vip">
      <div class="card-art"><div class="crown">👑</div><div class="noads">${ic('play')}</div></div>
      <div class="card-info"><b>${t('p_remove_ads')}</b><ul><li>${ic('check')} ${t('vipPerk1')}</li><li>${ic('check')} ${t('vipPerk2')}</li></ul></div>
      <button class="btn gold-btn sm" data-buy="remove_ads">${priceOf(P('remove_ads'))}</button></div>`;

    const goldB = S.iap.goldBoost ? '' : `<div class="sh-card goldb">
      <div class="card-art"><div class="spin-rays"></div>${ic('gold', 'xl')}<span class="x2">x2</span></div>
      <div class="card-info"><b>${t('p_gold_boost')}</b><span class="forever">${t('forever')}</span><small>${t('goldPerk')}</small></div>
      <button class="btn gold-btn sm" data-buy="gold_boost">${priceOf(P('gold_boost'))}</button></div>`;

    const act = G.monthlyActive();
    const monthly = `<div class="sh-card monthly ${act ? 'active' : ''}">
      <div class="card-art">${ic('missions', 'xl')}<span class="m30">30</span></div>
      <div class="card-info"><b>${t('p_monthly')}</b>
        ${act ? `<small>${t('monthlyActive', { d: new Date(S.iap.monthlyUntil).toLocaleDateString() })}</small>` : `<span class="big-val">${t('monthValue', { n: fmtInt(150 + 40 * 30) })}</span><small>${t('perDay')} · ${t('monthPerks')}</small>`}</div>
      ${act ? (G.monthlyClaimReady() ? `<button class="btn primary sm pulse" data-monthly="1">${ic('gem')} 40</button>` : ic('check')) : `<button class="btn primary sm" data-buy="monthly_pass">${priceOf(P('monthly_pass'))}</button>`}</div>`;

    const piggy = S.iap.piggy || 0;
    const fill = piggy / PIGGY_MAX;
    const canBreak = piggy >= PIGGY_MIN_BREAK;
    const piggyCard = `<div class="sh-piggy ${canBreak ? 'ready' : ''}">
      <div class="pg-art">${piggyArt(fill)}${fill >= 1 ? `<span class="pg-full">${t('piggyFull')}</span>` : ''}</div>
      <div class="pg-info"><b>${t('p_piggy')}</b><small>${t('piggyHow')}</small>
        <div class="pg-count">${ic('gem')}<b>${fmtInt(piggy)}</b><span>/ ${fmtInt(PIGGY_MAX)}</span></div>
        <div class="bar pg-bar"><i style="width:${fill * 100}%"></i><em style="left:${PIGGY_MIN_BREAK / PIGGY_MAX * 100}%"></em></div>
        ${canBreak ? `<button class="btn pig-btn" data-buy="piggy_bank">🔨 ${t('piggyBreak')} · ${priceOf(P('piggy_bank'))}</button>` : `<div class="pg-lock">${ic('lock')} ${t('piggyLocked', { n: PIGGY_MIN_BREAK })}</div>`}</div></div>`;

    const gemPacks = PRODUCTS.filter(p => p.gems);
    const baseRate = gemPacks[0].gems / parseFloat(String(gemPacks[0].price).replace(/[^\d,]/g, '').replace(',', '.'));
    const packs = gemPacks.map((p, i) => {
      const price = parseFloat(String(p.price).replace(/[^\d,]/g, '').replace(',', '.'));
      const extra = i ? Math.round((p.gems / price / baseRate - 1) * 100) : 0;
      return `<button class="pack p${i} ${p.tag ? 'tag-' + p.tag : ''}" data-buy="${p.id}">
        ${p.tag ? `<em class="ptag">${t(p.tag === 'best' ? 'bestValue' : 'bestDeal')}</em>` : ''}
        <div class="pk-art">${packArt(i)}</div><b>${fmtInt(p.gems)}</b>${extra > 0 ? `<span class="extra">${t('extraPct', { p: extra })}</span>` : ''}<span class="pk-price">${priceOf(p)}</span></button>`;
    }).join('');

    api.body.innerHTML = `
      <div class="sh-banner"><div><small>${t('youHave')}</small><b>${ic('gem')} ${fmtInt(S.diamonds)}</b></div><span>${t('shopTag')}</span></div>
      ${free}${starter}
      <h3 class="sec">${ic('star')} ${t('shopSpecial')}</h3>
      ${monthly}${vip}${goldB}${piggyCard}
      <h3 class="sec">${ic('gem')} ${t('shopGems')}</h3>
      <div class="packs">${packs}</div>
      <button class="link" data-restore="1">${t('restore')}</button>`;
  };
  const api = modal({ title: t('shop'), icon: ic('bag'), cls: 'shop', body: '' });
  draw(api);
  const tick = setInterval(() => { const tm = api.el.querySelector('.timer'); if (!api.el.isConnected) { clearInterval(tick); return; } if (tm && S.offers.starterUntil > Date.now()) tm.innerHTML = `${ic('clock')} ${t('offerEnds', { t: fmtTime((S.offers.starterUntil - Date.now()) / 1000) })}`; }, 1000);
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
