// The live stage: room, monitor gameplay, facecam, chat, random stream events.
import { roomSVG, ROOM_DEFS, SCREENS, skyPhase } from '../art/room.js';
import { avatarFrontSVG } from '../art/avatar.js';
import { makeGame, GW, GH } from '../art/games.js';
import * as E from '../economy.js';
import * as G from '../game.js';
import { S } from '../game.js';
import { CHAT, randomUser, USER_COLORS } from '../data.js';
import { t, lang } from '../i18n.js';
import { fmt } from '../format.js';
import { $, esc } from './dom.js';
import { coinBurst, floatText, sparkles, confetti } from './fx.js';
import { sfx } from '../audio.js';
import { bridge } from '../bridge.js';
import { ic } from './icons.js';

let stage, inner, belowSvg, aboveSvg, screen, sctx, face, chatEl, liveEl, evLayer, lagEl, hypeBanner;
let game = null, gameId = '', roomKey = '', faceKey = '';
let expr = 'neutral', exprUntil = 0;
let nextChat = 0, nextEvent = 0, lagActive = false, lagTaps = 0;
let tapCount = 0, lastTapAt = 0;
let transition = 0;
let gameAcc = 0, paused = false;
const GAME_STEP = 1 / 30;

// Freeze the stage while a window covers it: no SVG/CSS animation, no monitor redraw, no chat.
export function setScenePaused(p) {
  if (p === paused || !stage) return;
  paused = p;
  stage.classList.toggle('paused', p);
  for (const svg of stage.querySelectorAll('svg')) { if (p) svg.pauseAnimations && svg.pauseAnimations(); else svg.unpauseAnimations && svg.unpauseAnimations(); }
  if (!p) { const n = performance.now(); nextChat = Math.max(nextChat, n + 800); }
}

export function initScene(root) {
  stage = root;
  stage.innerHTML = `
    <svg width="0" height="0" style="position:absolute">${ROOM_DEFS}</svg>
    <div class="stage-inner">
      <svg class="room room-below" viewBox="0 0 400 340" preserveAspectRatio="xMidYMid meet"></svg>
      <canvas class="screen"></canvas>
      <svg class="room room-above" viewBox="0 0 400 340" preserveAspectRatio="xMidYMid meet"></svg>
      <div class="facecam"><div class="fc-bg"></div><div class="fc-av"></div><div class="fc-noise"></div><span class="fc-q"></span></div>
      <div class="live-badge"><span class="dot"></span><b>${t('live')}</b><span class="vw"></span></div>
      <div class="chat"></div>
      <div class="ev-layer"></div>
      <div class="hype-banner"></div>
      <div class="lag"><div class="spinner"></div><b>${t('lagTitle')}</b><small>${t('lagTap')}</small></div>
    </div>`;
  inner = $('.stage-inner', stage);
  belowSvg = $('.room-below', stage); aboveSvg = $('.room-above', stage);
  screen = $('.screen', stage); sctx = screen.getContext('2d');
  face = $('.facecam', stage); chatEl = $('.chat', stage); liveEl = $('.live-badge', stage);
  evLayer = $('.ev-layer', stage); lagEl = $('.lag', stage); hypeBanner = $('.hype-banner', stage);
  inner.addEventListener('pointerdown', onTap);
  nextEvent = performance.now() + 25000;
  refreshScene(true);
  new ResizeObserver(() => placeScreen()).observe(inner);
}

let arms = [];

function marketColor() { return E.MARKETS[S.market].color; }

export function refreshScene(force = false) {
  const phase = skyPhase();
  const key = JSON.stringify([S.house, S.equip, S.extras, S.plaques, S.profile.avatar, S.profile.pet, S.profile.channel, S.profile.neonColor, phase, S.market]);
  if (force || key !== roomKey) {
    roomKey = key;
    const r = roomSVG({ ...S, profile: { ...S.profile, pet: S.profile.pet } }, { phase, marketColor: marketColor() });
    belowSvg.innerHTML = r.below;
    aboveSvg.innerHTML = r.above;
    arms = [...aboveSvg.querySelectorAll('.arm-r')];
    if (paused) { belowSvg.pauseAnimations(); aboveSvg.pauseAnimations(); }
    placeScreen();
  }
  const id = E.MARKETS[S.market].id;
  if (id !== gameId) { gameId = id; game = makeGame(id); transition = 0.6; }
  renderFace(true);
}

function placeScreen() {
  const sc = SCREENS[S.equip.monitor - 1];
  const box = inner.getBoundingClientRect();
  const k = box.width / 400;
  screen.style.left = sc.x * k + 'px';
  screen.style.top = sc.y * k + 'px';
  screen.style.width = sc.w * k + 'px';
  screen.style.height = sc.h * k + 'px';
  screen.classList.toggle('crt', !!sc.crt);
  const dpr = Math.min(3, window.devicePixelRatio || 1);
  screen.width = Math.max(10, Math.round(sc.w * k * dpr));
  screen.height = Math.max(10, Math.round(sc.h * k * dpr));
}

// ---------- facecam ----------
export function setExpr(e, ms = 2500) { expr = e; exprUntil = performance.now() + ms; renderFace(); }
function renderFace(force) {
  const now = performance.now();
  let e = expr;
  if (now > exprUntil) {
    e = G.hypeActive() ? 'excited' : (skyPhase() === 'night' && now - lastTapAt > 90000 ? 'sleepy' : 'neutral');
  }
  const key = e + JSON.stringify(S.profile.avatar) + S.equip.webcam + (S.extras.green || 0);
  if (!force && key === faceKey) return;
  faceKey = key;
  $('.fc-av', face).innerHTML = avatarFrontSVG(S.profile.avatar, { expr: e });
  const q = ['240p', '480p', '720p', '1080p', '4K'][S.equip.webcam - 1];
  $('.fc-q', face).textContent = q;
  face.dataset.q = S.equip.webcam;
  face.dataset.g = S.extras.green || 0;
}

// ---------- chat ----------
function chatLine() {
  const L = CHAT[lang] || CHAT.pt;
  let pool = L.any;
  if (G.hypeActive() && Math.random() < 0.7) pool = L.hype;
  else if (Math.random() < 0.3) pool = S.house <= 1 && S.equip.pc <= 2 ? L.early : S.house >= 3 ? L.late : L.any;
  return pool[Math.floor(Math.random() * pool.length)].replace('{u}', randomUser());
}
export function pushChat(text, user, cls = '') {
  const u = user || randomUser();
  const col = USER_COLORS[Math.abs(hash(u)) % USER_COLORS.length];
  const el = document.createElement('div');
  el.className = 'msg ' + cls;
  el.innerHTML = `<b style="color:${col}">${esc(u)}</b> ${esc(text)}`;
  chatEl.appendChild(el);
  while (chatEl.children.length > 5) chatEl.firstChild.remove();
  requestAnimationFrame(() => el.classList.add('in'));
  if (/KKK|LMAO|JAJA/.test(text) && Math.random() < 0.5) setExpr('laugh', 1500);
}
function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }

export function viewers() {
  const base = 2 + Math.pow(10, Math.log10(S.fame + 1) * 0.3);
  return Math.round(base * (1 + 0.04 * Math.sin(performance.now() / 4000)) * (G.hypeActive() ? 1.3 : 1));
}

// ---------- taps ----------
function onTap(e) {
  if (e.target.closest('.ev-item')) return;
  if (lagActive) { fixLag(e); return; }
  const r = inner.getBoundingClientRect();
  const v = G.tap();
  lastTapAt = performance.now();
  tapCount++;
  sfx.tap();
  if (S.settings.vibration && tapCount % 3 === 0) bridge.vibrate(8);
  floatText(e.clientX, e.clientY - 10, '+' + fmt(v), G.hypeActive() ? '#ff7ab6' : '#ffd23f', 18);
  if (tapCount % 4 === 0) coinBurst(e.clientX, e.clientY, 2, $('#gold-pill .ic'));
  // typing nudge on the mouse arm only (no reflow, no restyle of the whole room)
  for (const a of arms) a.animate && a.animate([{ transform: 'none' }, { transform: 'translate(2px, 1px)' }, { transform: 'none' }], { duration: 180, easing: 'ease' });
  if (Math.random() < 0.12) pushChat(chatLine());
  document.dispatchEvent(new CustomEvent('stage-tap', { detail: { x: e.clientX - r.left, y: e.clientY - r.top } }));
}

export function onHype() {
  sfx.hype();
  setExpr('excited', 12000);
  hypeBanner.innerHTML = `<span>${t('hypeFull', { n: 2 })}</span>`;
  hypeBanner.classList.remove('show'); void hypeBanner.offsetWidth; hypeBanner.classList.add('show');
  const r = inner.getBoundingClientRect();
  sparkles(r.left + r.width / 2, r.top + r.height / 2, 24, '#ff7ab6');
  for (let i = 0; i < 4; i++) setTimeout(() => pushChat(chatLine(), null, 'hype'), i * 250);
  inner.classList.add('hyped');
  setTimeout(() => inner.classList.remove('hyped'), 12000);
}

// ---------- random stream events ----------
function spawnEvent() {
  const lucky = 1 + E.talentLv(S, 'lucky') * 0.12;
  const roll = Math.random();
  if (S.maxMarket >= 1 && roll < 0.08 && !lagActive) { startLag(); return; }
  if (roll < 0.08 + 0.37 * lucky) spawnFloat('clip');
  else if (roll < 0.85) spawnFloat('donation');
  else doRaid();
}

function spawnFloat(kind) {
  const el = document.createElement('button');
  el.className = 'ev-item ev-' + kind;
  const user = randomUser();
  el.innerHTML = kind === 'clip'
    ? `<svg viewBox="0 0 40 40"><defs><linearGradient id="gc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3a6"/><stop offset=".5" stop-color="#ffc83d"/><stop offset="1" stop-color="#e09a12"/></linearGradient></defs><rect x="5" y="12" width="30" height="22" rx="3" fill="url(#gc)" stroke="#2a1f3d" stroke-width="2"/><path d="M5 12 L9 4 L37 9 L35 13 Z" fill="#2a1f3d"/><path d="M12 5.6 L10 11 M19 6.8 L17 12 M26 8 L24 13 M33 9 L31 13" stroke="#ffc83d" stroke-width="2.4"/><path d="M17 18 L25 23 L17 28 Z" fill="#fff"/></svg>`
    : `<span class="don-u">${esc(user)}</span><span class="don-v">${ic('gold')}</span>`;
  const x = 12 + Math.random() * 70, y = 14 + Math.random() * 46;
  el.style.left = x + '%'; el.style.top = y + '%';
  evLayer.appendChild(el);
  requestAnimationFrame(() => el.classList.add('in'));
  const life = setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }, kind === 'clip' ? 9000 : 7000);
  el.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    clearTimeout(life);
    el.classList.add('pop');
    setTimeout(() => el.remove(), 300);
    const bx = e.clientX, by = e.clientY;
    if (kind === 'clip') {
      const kinds = ['mult', 'gold', 'gold', 'gems'];
      const res = G.clipReward(kinds[Math.floor(Math.random() * kinds.length)]);
      sfx.coin(); sparkles(bx, by, 16);
      setExpr('wow');
      if (res.kind === 'mult') floatText(bx, by, t('clipRewardMult', { m: res.m, s: res.s }), '#ffd23f', 22);
      else if (res.kind === 'gems') { floatText(bx, by, t('clipRewardGems', { n: res.n }), '#59d8ff', 22); coinBurst(bx, by, res.n, $('#gem-pill .ic'), 'gem'); }
      else { floatText(bx, by, t('clipRewardGold', { v: fmt(res.v) }), '#ffd23f', 22); coinBurst(bx, by, 10, $('#gold-pill .ic')); }
      pushChat(t('goldenClip'), user, 'sys');
    } else {
      const v = G.donationReward();
      sfx.coin(); coinBurst(bx, by, 8, $('#gold-pill .ic'));
      floatText(bx, by, '+' + fmt(v), '#ffd23f', 22);
      setExpr('happy');
      pushChat(t('donation', { u: user }), user, 'sys');
    }
    bridge.vibrate(20);
  });
}

function doRaid() {
  const user = randomUser();
  const n = Math.max(5, Math.round(viewers() * (0.3 + Math.random())));
  G.raidReward();
  pushChat(t('raid', { u: user, n: fmt(n) }), user, 'sys raid');
  setExpr('wow');
  sfx.cheer();
  const r = inner.getBoundingClientRect();
  sparkles(r.left + r.width * 0.8, r.top + 20, 14, '#a78bfa');
}

function startLag() {
  lagActive = true; lagTaps = 0;
  lagEl.classList.add('show');
  setExpr('rage', 4000);
  setTimeout(() => { if (lagActive) endLag(false); }, 9000);
}
function fixLag(e) {
  lagTaps++;
  sfx.click();
  sparkles(e.clientX, e.clientY, 4, '#4cc9f0');
  if (lagTaps >= 5) endLag(true);
}
function endLag(fixed) {
  lagActive = false;
  lagEl.classList.remove('show');
  if (fixed) {
    const v = G.donationReward();
    const r = inner.getBoundingClientRect();
    floatText(r.left + r.width / 2, r.top + r.height / 2, '+' + fmt(v), '#4cc9f0', 22);
    setExpr('happy');
    sfx.levelUp();
  }
}

// ---------- per frame ----------
export function stepScene(dt, now) {
  if (paused) return;
  // live game on the monitor, redrawn at 30 fps
  gameAcc += dt;
  if (game && screen.width > 10 && gameAcc >= GAME_STEP) {
    dt = Math.min(gameAcc, 0.1); gameAcc = 0;
    const w = screen.width, h = screen.height;
    const k = S.equip.monitor <= 2 ? w / GW : Math.max(w / GW, h / GH);
    if (S.equip.monitor <= 2) { sctx.fillStyle = '#0b0820'; sctx.fillRect(0, 0, w, h); }
    sctx.setTransform(k, 0, 0, k, (w - GW * k) / 2, (h - GH * k) / 2);
    try { game(sctx, Math.min(dt, 0.07), G.hypeActive()); } catch (e) { /* keep running */ }
    sctx.setTransform(1, 0, 0, 1, 0, 0);
    if (transition > 0) {
      transition -= dt;
      const img = sctx.getImageData(0, 0, Math.min(w, 200), Math.min(h, 120));
      for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; }
      sctx.putImageData(img, 0, 0);
      sctx.drawImage(screen, 0, 0, Math.min(w, 200), Math.min(h, 120), 0, 0, w, h);
    }
    if (S.equip.monitor === 1) {
      sctx.fillStyle = 'rgba(0,0,0,.18)';
      const step = Math.max(2, Math.round(h / 60));
      for (let y = 0; y < h; y += step * 2) sctx.fillRect(0, y, w, step);
    }
  }
  if (now > nextChat) {
    pushChat(chatLine());
    const rate = Math.min(5, 0.5 + Math.log10(S.fame + 10) * 0.35) * (G.hypeActive() ? 2.5 : 1);
    nextChat = now + (2500 + Math.random() * 3500) / rate;
  }
  if (now > nextEvent && !document.querySelector('.ev-item')) {
    if (S.tutorial >= 3) spawnEvent();
    const lucky = 1 + E.talentLv(S, 'lucky') * 0.12;
    nextEvent = now + (45000 + Math.random() * 60000) / lucky;
  }
  if (Math.floor(now / 500) !== Math.floor((now - dt * 1000) / 500)) {
    $('.vw', liveEl).innerHTML = `<svg viewBox="0 0 24 24" class="eye"><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="12" cy="12" r="3.2" fill="currentColor"/></svg>${fmt(viewers())}`;
    liveEl.title = t('viewers', { n: fmt(viewers()) });
    renderFace();
  }
}

export function stageRect() { return inner.getBoundingClientRect(); }
export function forceEvent(kind) { kind === 'lag' ? startLag() : kind === 'raid' ? doRaid() : spawnFloat(kind); }
