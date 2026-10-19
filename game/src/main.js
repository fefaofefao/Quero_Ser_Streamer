// Boot + main loop + glue between game rules, UI and native bridge.
import * as E from './economy.js';
import * as G from './game.js';
import { loadState, newState, persist, importState, progressScore, dayKey, msToMidnight } from './state.js';
import { setLang, detectLang, t, lang } from './i18n.js';
import { fmt, fmtTime, fmtMult } from './format.js';
import { bridge } from './bridge.js';
import { sfx, unlockAudio, setAudio, suspendAudio } from './audio.js';
import { $, $$, modal, toast, confirmBox, closeTopModal, modalOpen, esc, bump } from './ui/dom.js';
import { ic, marketBadge } from './ui/icons.js';
import { initFx, stepFx, confetti, sparkles, coinBurst, setArriveHandler } from './ui/fx.js';
import { initScene, stepScene, refreshScene, onHype, setExpr, pushChat, setScenePaused } from './ui/scene.js';
import { initPanels, showTab, refresh as refreshPanel, render as renderPanel, ui, currentTab } from './ui/panels.js';
import * as M from './ui/modals.js';
import { avatarEditor } from './ui/avatarEditor.js';
import { startAutograph } from './ui/autograph.js';
import { playIntro, coachAt, clearCoach } from './ui/intro.js';
import { ads } from './ui/ads.js';
import { avatarFrontSVG } from './art/avatar.js';
import { equipIconSVG } from './art/room.js';
import { PRODUCTS, ECO } from './data.js';

const PRIVACY_URL = 'https://fefaofefao.github.io/quero-ser-streamer/privacy.html';
const SUPPORT_MAIL = 'mailto:fe.m.sampaio@hotmail.com?subject=Quero%20ser%20Streamer';
let S;

// ---------------- layout ----------------
function buildLayout() {
  document.body.innerHTML = `
  <div id="app">
    <header id="top">
      <button id="me-btn" class="me-btn"></button>
      <div class="me-info"><b id="ch-name"></b><small id="rank-line"></small></div>
      <div class="pills">
        <div id="gold-pill" class="pill gold">${ic('gold')}<div><b id="gold-v">0</b><small id="gps-v"></small></div></div>
        <button id="gem-pill" class="pill gem">${ic('gem')}<b id="gem-v">0</b><span class="plus">+</span></button>
        <div id="ff-pill" class="pill ff">${ic('heart')}<b id="ff-v">0</b></div>
      </div>
      <button id="set-btn" class="icon-btn">${ic('gear')}</button>
    </header>
    <section id="stage"></section>
    <div id="hype"><div class="hype-bar"><i></i></div><span class="hype-label"></span><span id="boost-tag"></span></div>
    <nav id="quick">
      <button data-q="autograph">${ic('pen')}<span>${t('autographs')}</span><em class="badge" id="qb-auto"></em></button>
      <button data-q="missions">${ic('missions')}<span>${t('missions')}</span><em class="badge" id="qb-mis"></em></button>
      <button data-q="login">${ic('gift')}<span>${t('login')}</span><em class="badge" id="qb-log"></em></button>
      <button data-q="boost">${ic('rocket')}<span>x2</span><em class="badge timer" id="qb-boost"></em></button>
      <button data-q="shop">${ic('bag')}<span>${t('shop')}</span><em class="badge" id="qb-shop"></em></button>
    </nav>
    <main id="panel"></main>
    <nav id="tabs">
      ${[['channel', 'tv', 'tabChannel'], ['games', 'controller', 'tabGames'], ['setup', 'pc', 'tabSetup'], ['houses', 'house', 'tabHouses'], ['career', 'trophy', 'tabCareer']]
        .map(([id, icn, lbl]) => `<button data-tab="${id}">${ic(icn)}<span>${t(lbl)}</span><em class="badge" id="tb-${id}"></em></button>`).join('')}
    </nav>
  </div>
  <canvas id="fx"></canvas>
  <div id="modals"></div>
  <div id="toasts"></div>`;
}

function renderHudStatic() {
  $('#me-btn').innerHTML = avatarFrontSVG(S.profile.avatar, { expr: 'happy', blink: false });
  $('#ch-name').innerHTML = esc(S.profile.channel || '...') + (S.profile.verified ? ` <span class="verified" title="${t('verified')}">${ic('check')}</span>` : '');
}

let hudT = 0;
function updateHud(now) {
  const g = E.gps(S, Date.now()) * G.hypeMult();
  $('#gold-v').textContent = fmt(S.gold);
  $('#gps-v').textContent = '+' + fmt(g) + '/s';
  $('#gem-v').textContent = fmt(S.diamonds);
  const ffp = $('#ff-pill');
  ffp.style.display = S.ffEarned > 0 ? '' : 'none';
  $('#ff-v').textContent = fmt(S.ff);
  const rank = G.updateRank();
  $('#rank-line').innerHTML = `${ic('trophy')} ${t('worldRank', { n: rank.toLocaleString(lang === 'en' ? 'en-US' : 'pt-BR') })}`;
  // hype bar
  const hb = $('#hype');
  hb.classList.toggle('on', G.hypeActive());
  $('.hype-bar i', hb).style.width = (G.hypeActive() ? Math.max(0, (S.hypeUntil - Date.now()) / 12000) : S.hype) * 100 + '%';
  $('.hype-label', hb).textContent = G.hypeActive() ? t('hypeFull', { n: 2 }) : t('hypeTap');
  const bl = G.boostLeft();
  const x3 = G.x3Left();
  const clip = S.boosts.clipUntil > Date.now() ? (S.boosts.clipUntil - Date.now()) / 1000 : 0;
  $('#boost-tag').innerHTML = [x3 > 0 ? `${ic('rocket')} x3 ${fmtTime(x3)}` : '', bl > 0 ? `${ic('rocket')} x2 ${fmtTime(bl)}` : '', clip > 0 ? `${ic('star')} x${S.boosts.clipMult || 7} ${clip < 60 ? Math.ceil(clip) + 's' : fmtTime(clip)}` : ''].filter(Boolean).slice(0, 2).join(' ');
  $('#qb-boost').textContent = bl > 0 ? fmtTime(bl).split(' ')[0] : '';
  // badges
  G.resetAutographDay();
  $('#qb-auto').textContent = S.autograph.passes || '';
  const ready = S.daily.missions.filter(m => !m.claimed && m.progress >= m.target).length + (G.chestReady() ? 1 : 0);
  $('#qb-mis').textContent = ready || '';
  $('#qb-log').textContent = S.login.claimedToday ? '' : '!';
  $('#qb-shop').textContent = G.monthlyClaimReady() || G.freeGemsLeft() > 0 || G.seasonClaimable() > 0 ? '!' : '';
  // tab badges: affordable things
  const anyUp = E.UPGRADES.some((u, i) => G.upgradeUnlocked(i) && S.gold >= E.upgradeCost(S, i, S.upgrades[i]));
  $('#tb-channel').textContent = anyUp ? '•' : '';
  const anyCom = E.COMMUNITY.some((c, k) => S.gold >= E.communityCost(S.market, k, S.community[S.market][k]));
  $('#tb-games').textContent = anyCom ? '•' : '';
  const anyEq = E.EQUIPMENT.some(e => G.canUpgradeEquip(e.id) === 'ok') || E.EXTRAS.some(e => G.canBuyExtra(e) === 'ok');
  $('#tb-setup').textContent = anyEq ? '•' : '';
  const nh = E.HOUSES[S.house + 1];
  $('#tb-houses').textContent = nh && S.gold >= nh.cost ? '!' : '';
  const rb = G.rebirthInfo();
  $('#tb-career').textContent = (G.achievementsReady() ? '•' : '') || (rb.can && rb.after / rb.before >= 2 ? '!' : '');
}

// ---------------- tutorial ----------------
let tutTaps = 0;
function tutorial() {
  if (!S.introDone) return;
  switch (S.tutorial) {
    case 0: coachAt('#stage .stage-inner', t('tut1'), 'center'); break;
    case 1: coachAt(() => currentTab() === 'channel' ? ['[data-buy="u0"]', 'below'] : ['[data-tab="channel"]', 'above'], t('tut2')); break;
    case 2: coachAt(() => currentTab() === 'games' ? ['[data-buy="c0"]', 'below'] : ['[data-tab="games"]', 'above'], t('tut3')); break;
    default: clearCoach();
  }
}
function tutAdvance(to) { if (S.tutorial < to) { S.tutorial = to; tutorial(); } }

// ---------------- events from game rules ----------------
function wireEvents() {
  G.on('hype', () => { onHype(); });
  G.on('market', ({ m, first }) => {
    refreshScene();
    renderPanel();
    if (first) {
      M.marketCelebrate(m);
      bridge.log('market_unlock', { market: E.MARKETS[m].id });
      if (S.tutorial <= 2) tutAdvance(3);
      if (m === 1 && S.tutorial < 4) setTimeout(() => toast(ic('star') + ' ' + t('tut4')), 1500);
    } else toast(marketBadge(E.MARKETS[m].id, 'sm') + ' ' + t('mk_' + E.MARKETS[m].id) + ' ' + fmtMult(E.MARKETS[m].mult));
  });
  G.on('house', ({ h }) => {
    const id = E.HOUSES[h].id;
    refreshScene(true); renderPanel(); renderHudStatic();
    bridge.log('house_buy', { house: id });
    const art = `<div class="move-truck"><svg viewBox="0 0 120 70"><rect x="4" y="16" width="70" height="38" rx="4" fill="#f59e0b" stroke="#2a1f3d" stroke-width="3"/><path d="M74 28h22l14 14v12H74z" fill="#ef4444" stroke="#2a1f3d" stroke-width="3"/><rect x="80" y="32" width="14" height="10" rx="2" fill="#bfdbfe"/><circle cx="24" cy="58" r="8" fill="#2a1f3d"/><circle cx="92" cy="58" r="8" fill="#2a1f3d"/><rect x="12" y="6" width="22" height="14" fill="#d4a373" stroke="#2a1f3d" stroke-width="2"/><rect x="40" y="2" width="18" height="18" fill="#d4a373" stroke="#2a1f3d" stroke-width="2"/></svg></div>`;
    M.celebrate({
      title: t('movingTitle'), sub: t('movingSub', { h: `<b>${t('h_' + id)}</b>` }) + `<br><span class="mult-tag">${t('houseMult', { m: fmtMult(E.HOUSES[h].mult) })}</span>`, art,
      onClose: () => {
        M.letterModal(id, () => {
          ads.interstitial('house_move');
          if (h === 1) bridge.requestReview();
        });
      },
    });
  });
  G.on('rebirth', (info) => {
    refreshScene(true); showTab(currentTab()); renderHudStatic();
    bridge.log('rebirth', { gain: info.gain, count: S.rebirths });
    M.celebrate({
      title: t('rebirthDone'), sub: `${ic('heart')} <b>+${fmt(info.gain)}</b> ${t('ff')}<br>${t('rebirthBonus', { a: fmtMult(info.before), b: fmtMult(info.after) })}`,
      art: `<div class="rb-art">${ic('rebirth', 'xl')}</div>`,
      onClose: () => {
        if (!S.letters.rebirth) { S.letters.rebirth = 1; M.letterModal('rebirth', () => ads.interstitial('rebirth')); }
        else ads.interstitial('rebirth');
      },
    });
  });
  G.on('equip', ({ id, lv, extra }) => {
    refreshScene(true); renderPanel();
    setExpr('excited', 3000);
    bridge.log('equip_upgrade', { id, lv });
    if (!extra) M.celebrate({ title: t('equipUpgraded'), sub: `<b>${t('eq_' + id + '_' + lv)}</b>`, art: `<div class="eq-hero">${equipIconSVG(id, lv)}</div>`, cls: 'small-cel' });
  });
  G.on('plaque', (p) => {
    refreshScene(true);
    setTimeout(() => M.celebrate({ title: t('plaqueTitle'), sub: `<b>${t('plaque_' + p.id)}</b><br>${t('plaqueDesc')}`, art: `<div class="plaque-art p-${p.id}">${ic('star', 'xl')}</div>` }), 400);
  });
  G.on('top1', () => { setTimeout(() => M.letterModal('top'), 1200); S.owned['hat:crown'] = true; });
  G.on('verified', () => { renderHudStatic(); toast(ic('check') + ' ' + t('verified') + '!'); });
  G.on('missionReady', () => { bump($('[data-q="missions"]')); sfx.notify(); });
  G.on('seasonTier', (lv) => { toast(ic('star') + ' ' + t('seasonTierUp', { n: lv })); bump($('[data-q="shop"]')); bridge.log('season_tier', { tier: lv }); });
  G.on('cosmetic', (it) => { refreshScene(true); renderHudStatic(); bridge.log('cosmetic_get', { item: it.key || (it.cat + ':' + it.value) }); });
  G.on('gemshop', ({ id }) => { bridge.log('gem_shop', { id }); });
  G.on('step', ({ i }) => { toast(ic('up_' + E.UPGRADES[i].id) + ' ' + t('up_' + E.UPGRADES[i].id) + ' x2!'); });
  ui.onBuy = (k) => {
    if (k === 'u0' && S.tutorial === 1) tutAdvance(2);
    if (k[0] === 'c' && S.tutorial <= 2) tutAdvance(3);
  };
  document.addEventListener('coach-dismiss', () => { if (S.tutorial <= 2) tutAdvance(S.tutorial + 1); });
  document.addEventListener('stage-tap', () => {
    if (S.tutorial === 0 && ++tutTaps >= 8) tutAdvance(1);
  });
  setArriveHandler((kind) => { bump(kind === 'gem' ? $('#gem-pill') : $('#gold-pill')); });
}

// ---------------- purchases ----------------
async function purchase(p, after) {
  if (p === 'restore') { await restore(true); return; }
  if (p === 'cosmetic') { refreshScene(true); renderHudStatic(); persist(S); return; }
  const r = await bridge.buy(p.id);
  if (r && r.ok) {
    applyPurchase(p.id, r.token);
    after && after();
  } else if (r && r.error && r.error !== 'canceled') toast(t('purchaseFailed'));
}
function applyPurchase(id, token) {
  S.iap.tokens = S.iap.tokens || [];
  if (token && S.iap.tokens.includes(token)) return;
  if (token) { S.iap.tokens.push(token); if (S.iap.tokens.length > 60) S.iap.tokens.shift(); }
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;
  const gems = G.grantProduct(p);
  sfx.fanfare(); confetti(100);
  if (gems) setTimeout(() => toast(ic('gem') + ' +' + fmt(gems)), 400);
  toast(ic('check') + ' ' + t('purchased'));
  bridge.log('purchase', { id });
  refreshScene(true); renderPanel();
  persist(S);
}
async function restore(showToast) {
  const r = await bridge.restorePurchases();
  if (!r || !r.ok) return;
  for (const id of r.owned || []) {
    if (id === 'remove_ads') S.iap.removeAds = true;
    if (id === 'gold_boost') S.iap.goldBoost = true;
    if (id === 'starter_pack' && !S.iap.starter) { S.iap.starter = true; S.equip.chair = Math.max(S.equip.chair, 4); }
    if (id === 'monthly_pass' && r.monthlyExpiry) S.iap.monthlyUntil = Math.max(S.iap.monthlyUntil, r.monthlyExpiry);
  }
  if (showToast) toast(ic('check') + ' ' + t('restore'));
}

// ---------------- settings ----------------
function settingsModal() {
  const st = S.settings;
  const tog = (k) => `<button class="tog ${st[k] ? 'on' : ''}" data-tog="${k}"><i></i></button>`;
  const cloud = bridge.cloudStatus();
  const api = modal({
    title: t('settings'), icon: ic('gear'), cls: 'settings',
    body: `
      <div class="set-row">${ic('controller')}<span>${t('music')}</span>${tog('music')}</div>
      <div class="set-row">${ic('star')}<span>${t('sfx')}</span>${tog('sfx')}</div>
      <div class="set-row">${ic('pc')}<span>${t('vibration')}</span>${tog('vibration')}</div>
      <div class="set-row">${ic('clock')}<span>${t('notifications')}</span>${tog('notifications')}</div>
      <div class="set-row">${ic('up_chat')}<span>${t('language')}</span><select data-sel="lang"><option value="auto">${t('auto')}</option><option value="pt">Português</option><option value="en">English</option><option value="es">Español</option></select></div>
      <div class="set-row">${ic('chart')}<span>${t('numbers')}</span><select data-sel="numbers"><option value="short">${t('numShort')}</option><option value="sci">${t('numSci')}</option></select></div>
      <div class="cloud-box">${ic('rocket')}<div><b>${t('cloud')}</b><small>${cloud.signedIn ? t('cloudOn', { n: esc(cloud.name || '') }) : t('cloudOff')}</small></div>
        ${cloud.available ? (cloud.signedIn ? `<button class="btn sm primary" data-act="cloudsave">${t('save')}</button>` : `<button class="btn sm primary" data-act="cloud">${t('cloudConnect')}</button>`) : ''}</div>
      <div class="set-links">
        <button class="link" data-act="restore">${t('restore')}</button>
        ${bridge.privacyOptionsRequired() ? `<button class="link" data-act="privopts">${t('privacyOptions')}</button>` : ''}
        <button class="link" data-act="privacy">${t('privacy')}</button>
        <button class="link" data-act="rate">${t('rate')}</button>
        <button class="link" data-act="support">${t('support')}</button>
        <button class="link danger" data-act="reset">${t('reset')}</button>
      </div>
      <p class="center muted small">${t('appName')} · ${t('version', { v: bridge.appVersion() })}<br>FSamp Labs</p>`,
  });
  $('[data-sel="lang"]', api.el).value = st.lang;
  $('[data-sel="numbers"]', api.el).value = st.numbers;
  api.el.addEventListener('click', async (e) => {
    const tg = e.target.closest('[data-tog]');
    if (tg) {
      const k = tg.dataset.tog; st[k] = !st[k]; tg.classList.toggle('on', st[k]);
      setAudio(st.sfx, st.music); sfx.click();
      if (k === 'notifications' && st[k]) bridge.requestNotificationPermission();
      return;
    }
    const a = e.target.closest('[data-act]');
    if (!a) return;
    const act = a.dataset.act;
    if (act === 'privacy') bridge.openUrl(PRIVACY_URL);
    if (act === 'support') bridge.openUrl(SUPPORT_MAIL);
    if (act === 'rate') bridge.rateApp();
    if (act === 'privopts') bridge.showPrivacyOptions();
    if (act === 'restore') restore(true);
    if (act === 'cloud') { const r = await bridge.cloudSignIn(); if (r && r.ok) { api.close(); await cloudCheck(true); settingsModal(); } }
    if (act === 'cloudsave') { const r = await bridge.cloudSave(persist(S)); if (r && r.ok) toast(ic('check') + ' ' + t('cloudSaved')); }
    if (act === 'reset') confirmBox(t('resetConfirm'), () => { const keep = { iap: S.iap }; S = newState(); S.iap = keep.iap; G.setState(S); persist(S); location.reload(); }, t('reset'));
  });
  api.el.addEventListener('change', (e) => {
    const sel = e.target.closest('[data-sel]');
    if (!sel) return;
    st[sel.dataset.sel] = sel.value;
    applyLang();
    persist(S);
    api.close();
    rebuild();
  });
}

function applyLang() { setLang(S.settings.lang === 'auto' ? detectLang() : S.settings.lang, S.settings.numbers); }

// ---------------- cloud ----------------
async function cloudCheck(interactive) {
  const st = bridge.cloudStatus();
  if (!st.available || !st.signedIn) return;
  const r = await bridge.cloudLoad();
  if (!r || !r.ok || !r.data) { if (interactive) { await bridge.cloudSave(persist(S)); toast(ic('check') + ' ' + t('cloudSaved')); } return; }
  const remote = importState(r.data);
  if (!remote) return;
  if (progressScore(remote) > progressScore(S) + 0.5) {
    modal({
      title: t('cloud'), icon: ic('rocket'), noClose: true, noBackdropClose: true,
      body: `<p class="center">${t('cloudFound')}</p><div class="cloud-cmp"><div><small>☁</small><b>${t('h_' + E.HOUSES[remote.house].id)}</b><span>#${E.worldRank(remote.fameAll, remote).toLocaleString()}</span></div><div><small>📱</small><b>${t('h_' + E.HOUSES[S.house].id)}</b><span>#${E.worldRank(S.fameAll, S).toLocaleString()}</span></div></div>`,
      buttons: [
        { label: t('cloudKeep'), cls: 'ghost', onClick: () => { bridge.cloudSave(persist(S)); } },
        { label: t('cloudRestore'), cls: 'primary', onClick: () => { S = remote; G.setState(S); persist(S); location.reload(); } },
      ],
    });
  } else if (interactive) { await bridge.cloudSave(persist(S)); toast(ic('check') + ' ' + t('cloudSaved')); }
}

// ---------------- notifications ----------------
function scheduleNotifications() {
  if (!S.settings.notifications) { bridge.scheduleNotifications([]); return; }
  const list = [];
  const now = new Date();
  G.resetAutographDay();
  if (S.autograph.passes < G.maxPasses()) {
    const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 10, 0, 0);
    list.push({ id: 1, at: at.getTime(), title: t('autoTitle'), body: t('n_passes') });
  }
  const { maxSec } = E.offlineParams(S);
  if (maxSec >= 3600) list.push({ id: 2, at: Date.now() + maxSec * 1000, title: t('appName'), body: t('n_offline') });
  const gift = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 19, 0, 0);
  list.push({ id: 3, at: gift.getTime(), title: t('login'), body: t('n_daily') });
  bridge.scheduleNotifications(list);
}

// ---------------- main loop ----------------
let last = 0, saveT = 0, panelT = 0, cloudT = 0, sceneT = 0;
function loop(now) {
  const dt = Math.min(1, (now - last) / 1000 || 0);
  last = now;
  G.tick(dt);
  // a window or the autograph event covers the stage: freeze what nobody can see
  const covered = modalOpen() || !!autoOv();
  setScenePaused(covered);
  stepScene(dt, now);
  stepFx(dt);
  hudT += dt; panelT += dt; saveT += dt; cloudT += dt; sceneT += dt;
  if (hudT > 0.2) { hudT = 0; updateHud(now); }
  if (panelT > 0.25) { panelT = 0; if (!covered) refreshPanel(); }
  if (saveT > 10) { saveT = 0; persist(S); }
  if (sceneT > 60) { sceneT = 0; refreshScene(); G.resetDaily(); }
  if (cloudT > 300) { cloudT = 0; const st = bridge.cloudStatus(); if (st.signedIn) bridge.cloudSave(persist(S)); }
  requestAnimationFrame(loop);
}

let ovEl = null;
function autoOv() { if (!ovEl || !ovEl.isConnected) ovEl = document.querySelector('.auto-ov'); return ovEl; }

function setTabActive(name) { $$('#tabs [data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === name)); }

function bindUi() {
  $('#tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]'); if (!b) return;
    sfx.click(); setTabActive(b.dataset.tab); showTab(b.dataset.tab);
    if (b.dataset.tab === 'setup' && S.tutorial === 3 && S.equip.pc === 1 && S.diamonds >= 40) { S.tutorial = 4; coachAt('[data-eq="pc"]', t('tut5')); setTimeout(clearCoach, 4000); }
  });
  $('#quick').addEventListener('click', (e) => {
    const b = e.target.closest('[data-q]'); if (!b) return;
    sfx.click();
    const q = b.dataset.q;
    if (q === 'autograph') M.autographLobby(() => startAutograph(() => { if (S.settings.notifications && !S.askedNotif) { S.askedNotif = true; bridge.requestNotificationPermission(); } }));
    if (q === 'missions') M.missionsModal();
    if (q === 'login') M.loginModal();
    if (q === 'boost') M.boostModal();
    if (q === 'shop') M.shopModal(purchase);
  });
  $('#gem-pill').addEventListener('click', () => { sfx.click(); M.shopModal(purchase); });
  $('#set-btn').addEventListener('click', () => { sfx.click(); settingsModal(); });
  $('#me-btn').addEventListener('click', () => { sfx.click(); avatarEditor({ onDone: () => { renderHudStatic(); refreshScene(true); } }); });
  $('#gold-pill').addEventListener('click', () => toast(ic('gold') + ' ' + t('goldDesc')));
  $('#ff-pill').addEventListener('click', () => toast(ic('heart') + ' ' + t('ffDesc')));
  ui.open.equip = (id) => M.equipModal(id, () => {});
  ui.open.warp = (i) => M.warpModal(i);
  ui.open.rebirth = () => M.rebirthModal();
  ui.open.achievements = () => M.achievementsModal();
  ui.open.stats = () => M.statsModal();
  ui.open.avatar = () => avatarEditor({ onDone: () => { renderHudStatic(); refreshScene(true); } });
  ui.open.shop = () => M.shopModal(purchase);
  document.addEventListener('pointerdown', unlockAudio, { once: false, passive: true });
}

function rebuild() {
  buildLayout();
  initFx($('#fx'));
  initScene($('#stage'));
  initPanels($('#panel'));
  bindUi();
  renderHudStatic();
  setTabActive('channel');
  showTab('channel');
  tutorial();
}

// ---------------- native lifecycle ----------------
function wireNative() {
  bridge.on('pause', () => { persist(S); scheduleNotifications(); suspendAudio(true); const st = bridge.cloudStatus(); if (st.signedIn) bridge.cloudSave(persist(S)); });
  bridge.on('resume', () => {
    suspendAudio(false);
    const o = G.computeOffline();
    if (o && o.sec > 120) M.offlineModal(o);
    S.lastSeen = Date.now();
    G.resetDaily();
  });
  bridge.on('back', () => {
    if (document.querySelector('.auto-ov')) return;
    if (!closeTopModal()) confirmBox(t('appName') + ' — ' + t('close') + '?', () => { persist(S); bridge.exitApp(); });
  });
  bridge.on('purchase', (d) => { if (d && d.productId) applyPurchase(d.productId, d.token); });
  bridge.on('prices', (d) => { M.setPrices(d || {}); });
  window.__insets = (top, bottom) => {
    document.documentElement.style.setProperty('--sat', top + 'px');
    document.documentElement.style.setProperty('--sab', bottom + 'px');
  };
  document.addEventListener('visibilitychange', () => { if (document.hidden) { persist(S); scheduleNotifications(); } });
}

// Live balancing from Firebase Remote Config key "game_config", e.g. {"gold":1.2,"fame":1}
// Diamond economy under "eco", e.g. {"eco":{"missionGems":5,"chestGems":10,"weeklyGems":[20,40,80],"achMult":0.5,"adGems":5,"piggyMax":900,"piggyRate":0.25,"firstBuyMult":2}}
function applyRemoteConfig() {
  const rc = bridge.remoteConfig() || {};
  for (const k of ['gold', 'fame', 'offline', 'event']) if (typeof rc[k] === 'number' && rc[k] > 0 && rc[k] < 100) E.TUNE[k] = rc[k];
  const eco = rc.eco && typeof rc.eco === 'object' ? rc.eco : {};
  for (const k of Object.keys(ECO)) {
    const v = eco[k];
    if (Array.isArray(ECO[k])) { if (Array.isArray(v) && v.length === ECO[k].length && v.every(n => typeof n === 'number' && n >= 0 && n < 10000)) ECO[k] = v; }
    else if (typeof v === 'number' && v >= 0 && v < 100000) ECO[k] = v;
  }
}

// ---------------- boot ----------------
async function boot() {
  S = loadState();
  const fresh = !S;
  if (!S) S = newState();
  G.setState(S);
  applyLang();
  setAudio(S.settings.sfx, S.settings.music);
  wireEvents();
  wireNative();
  applyRemoteConfig();
  G.resetDaily();
  const offline = fresh ? null : G.computeOffline();
  rebuild();
  bridge.queryProducts(PRODUCTS.map(p => p.id)).then(r => { if (r && r.products) M.setPrices(r.products); });
  requestAnimationFrame((n) => { last = n; requestAnimationFrame(loop); });
  document.body.classList.add('ready');
  bridge.ready();
  const splash = document.getElementById('splash');
  if (splash) { splash.classList.add('out'); setTimeout(() => splash.remove(), 500); }

  if (!S.introDone) {
    playIntro(() => avatarEditor({
      creating: true, onDone: () => {
        S.introDone = true; S.created = Date.now();
        renderHudStatic(); refreshScene(true); persist(S);
        bridge.log('tutorial_begin');
        tutorial();
      },
    }));
    return;
  }
  const afterOffline = () => {
    if (!S.login.claimedToday) setTimeout(() => M.loginModal(), 300);
    restore(false);
    setTimeout(() => cloudCheck(false), 1500);
  };
  if (offline) M.offlineModal(offline, afterOffline); else afterOffline();
  S.lastSeen = Date.now();
}

// debug helpers for screenshots / QA in the browser
window.__qss = { G, E, get S() { return S; }, refreshScene, renderPanel, showTab, setExpr, pushChat, startAutograph, M };

window.addEventListener('load', boot);
