// Autograph event: 30 s minigame. Fans line up, tap to sign their items.
import { avatarFrontSVG, randomAvatar } from '../art/avatar.js';
import * as G from '../game.js';
import { S } from '../game.js';
import { t } from '../i18n.js';
import { fmt } from '../format.js';
import { $, modal } from './dom.js';
import { ic } from './icons.js';
import { sfx } from '../audio.js';
import { sparkles, confetti, floatText, coinBurst } from './fx.js';
import { bridge } from '../bridge.js';
import { ads } from './ads.js';

const DURATION = 30;
const ITEMS = ['notebook', 'shirt', 'phone', 'poster', 'cap'];

function itemSVG(kind) {
  const O = '#2a1f3d';
  switch (kind) {
    case 'notebook': return `<rect x="20" y="10" width="160" height="110" rx="8" fill="#fffdf5" stroke="${O}" stroke-width="4"/>${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<circle cx="${34 + i * 19}" cy="10" r="5" fill="none" stroke="${O}" stroke-width="3"/>`).join('')}${[40, 60, 80, 100].map(y => `<path d="M30 ${y} H170" stroke="#bfdbfe" stroke-width="2"/>`).join('')}<path d="M44 20 V116" stroke="#fca5a5" stroke-width="2"/>`;
    case 'shirt': return `<path d="M60 12 20 34l16 28 16-8v66h96V54l16 8 16-28-40-22c-6 14-20 22-40 22S66 26 60 12z" fill="#f8fafc" stroke="${O}" stroke-width="4" stroke-linejoin="round"/><path d="M78 16c6 10 14 14 22 14s16-4 22-14" fill="none" stroke="${O}" stroke-width="3"/>`;
    case 'phone': return `<rect x="62" y="6" width="76" height="120" rx="12" fill="#1f2937" stroke="${O}" stroke-width="4"/><rect x="68" y="16" width="64" height="100" rx="5" fill="#e0e7ff"/><circle cx="100" cy="121" r="2.5" fill="#6b7280"/><rect x="88" y="10" width="24" height="3" rx="1.5" fill="#6b7280"/>`;
    case 'poster': return `<rect x="30" y="6" width="140" height="120" rx="4" fill="#7c3aed" stroke="${O}" stroke-width="4"/><circle cx="100" cy="52" r="26" fill="#ffd8a8" stroke="${O}" stroke-width="3"/><path d="M80 44c6-14 34-14 40 0" fill="#5a3825"/><path d="M40 108 H160" stroke="#fde047" stroke-width="10" stroke-linecap="round"/>`;
    case 'cap': return `<path d="M40 86 C40 30 160 30 160 86 Z" fill="#ef4444" stroke="${O}" stroke-width="4"/><path d="M36 86 C70 76 140 76 188 96 C160 104 110 100 36 94 Z" fill="#b91c1c" stroke="${O}" stroke-width="4"/><circle cx="100" cy="36" r="5" fill="#b91c1c"/>`;
  }
  return '';
}

// Signature squiggle (stroke drawn progressively)
const SIG = 'M40 96 C52 60 62 60 64 84 C66 104 74 70 86 66 C94 64 92 92 100 90 C108 88 112 62 122 66 C132 70 126 92 136 90 C146 88 150 72 162 70';

function venueSVG(v) {
  const bunting = (y, cols) => `<path d="M0 ${y} Q100 ${y + 20} 200 ${y} T400 ${y}" stroke="#555" stroke-width="2" fill="none"/>` + Array.from({ length: 14 }, (_, i) => `<path d="M${i * 30 + 6} ${y + 6 + Math.sin(i / 13 * Math.PI) * 9} l10 0 l-5 14 z" fill="${cols[i % cols.length]}"/>`).join('');
  switch (v) {
    case 'fair': return `<rect width="400" height="700" fill="url(#vsky)"/><rect y="420" width="400" height="280" fill="#d6b88a"/>${bunting(60, ['#ef4444', '#facc15', '#22c55e', '#3b82f6'])}
      <g><rect x="-10" y="250" width="140" height="170" fill="#fef3c7" stroke="#2a1f3d" stroke-width="3"/><path d="M-20 250 L140 250 L120 200 L0 200 Z" fill="#f87171" stroke="#2a1f3d" stroke-width="3"/>${[0, 1, 2, 3].map(i => `<path d="M${-20 + i * 40} 250 q20 24 40 0" fill="#fff" stroke="#2a1f3d" stroke-width="2"/>`).join('')}</g>
      <g><rect x="280" y="260" width="130" height="160" fill="#dbeafe" stroke="#2a1f3d" stroke-width="3"/><path d="M270 260 L420 260 L400 210 L290 210 Z" fill="#60a5fa" stroke="#2a1f3d" stroke-width="3"/></g>
      <circle cx="330" cy="100" r="28" fill="#fde68a"/>`;
    case 'store': return `<rect width="400" height="700" fill="#3b2f63"/><rect y="440" width="400" height="260" fill="#2a2147"/>${[0, 1, 2].map(r => `<rect x="10" y="${120 + r * 100}" width="380" height="10" fill="#6d5bd0"/>` + Array.from({ length: 11 }, (_, i) => `<rect x="${18 + i * 34}" y="${70 + r * 100}" width="26" height="50" rx="3" fill="${['#ef4444', '#22c55e', '#3b82f6', '#f59e0b', '#a855f7', '#ec4899'][(i + r) % 6]}" stroke="#1b1530" stroke-width="2"/>`).join('')).join('')}
      <rect x="120" y="20" width="160" height="40" rx="8" fill="#111" stroke="#22d3ee" stroke-width="3"/><text x="200" y="48" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="22" fill="#22d3ee">GAME STORE</text>`;
    case 'con': return `<rect width="400" height="700" fill="#1e1b4b"/><rect y="430" width="400" height="270" fill="#312e81"/>${[0, 1, 2, 3, 4].map(i => `<rect x="${i * 86 - 6}" y="60" width="60" height="230" rx="6" fill="${['#db2777', '#7c3aed', '#0891b2', '#ea580c', '#16a34a'][i]}" opacity=".85"/><circle cx="${i * 86 + 24}" cy="130" r="18" fill="#fff" opacity=".85"/>`).join('')}
      ${Array.from({ length: 30 }, (_, i) => `<circle cx="${(i * 41) % 400}" cy="${330 + (i % 4) * 22}" r="12" fill="#4c1d95"/>`).join('')}
      <path d="M0 40 H400" stroke="#facc15" stroke-width="6"/><text x="200" y="32" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="22" fill="#facc15">STREAMER CON</text>`;
    case 'stadium': return `<rect width="400" height="700" fill="#0b1027"/>${[0, 1, 2, 3].map(i => `<path d="M${i * 120 - 20} 0 L${i * 120 + 40} 0 L200 420 Z" fill="#fff" opacity=".06"/>`).join('')}
      ${Array.from({ length: 90 }, (_, i) => `<circle cx="${(i * 37) % 410}" cy="${200 + Math.floor(i / 11) * 22}" r="10" fill="${['#1e3a8a', '#312e81', '#4c1d95'][i % 3]}"/><circle cx="${(i * 37) % 410}" cy="${190 + Math.floor(i / 11) * 22}" r="2" fill="#fde047" opacity="${i % 5 ? 0.2 : 0.9}"><animate attributeName="opacity" values=".9;.1;.9" dur="${1 + (i % 4) * 0.4}s" repeatCount="indefinite"/></circle>`).join('')}
      <rect y="420" width="400" height="280" fill="#15803d"/><path d="M0 470 H400 M0 560 H400" stroke="#fff" stroke-width="3" opacity=".5"/>`;
  }
  return '';
}

export function startAutograph(onEnd) {
  const venue = G.venueFor();
  const total = G.fanCount();
  const ov = document.createElement('div');
  ov.className = 'auto-ov';
  ov.innerHTML = `
    <svg class="venue" viewBox="0 0 400 700" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="vsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cc8ff"/><stop offset="1" stop-color="#d9f2ff"/></linearGradient></defs>${venueSVG(venue)}</svg>
    <div class="auto-hud"><div class="ah-time"><svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" class="ring-bg"/><circle cx="20" cy="20" r="17" class="ring"/></svg><b>30</b></div>
      <div class="ah-title">${t('venue_' + venue)}</div><div class="ah-count">${ic('pen')} <b>0</b>/${total}</div></div>
    <div class="queue"></div>
    <div class="table"><div class="me">${avatarFrontSVG(S.profile.avatar, { expr: 'happy' })}</div><div class="desk"></div></div>
    <div class="sign-zone"><div class="sign-card"><svg viewBox="0 0 200 130" class="item"></svg><div class="patience"><i></i></div><span class="who"></span></div><div class="combo"></div></div>
    <div class="auto-start"><b>3</b></div>`;
  document.body.appendChild(ov);
  requestAnimationFrame(() => ov.classList.add('in'));
  sfx.cheer();

  const queueEl = $('.queue', ov), card = $('.sign-card', ov), itemEl = $('.item', ov), comboEl = $('.combo', ov);
  const fans = [];
  let spawned = 0, signed = 0, rareGems = 0, combo = 0, bestCombo = 0, timeLeft = DURATION, running = false, ended = false;
  let cur = null;

  function makeFan() {
    if (spawned >= total) return null;
    spawned++;
    const rare = Math.random() < 0.07;
    const f = {
      av: randomAvatar(), item: ITEMS[Math.floor(Math.random() * ITEMS.length)],
      need: 1 + Math.floor(Math.random() * 3), done: 0, rare,
      patience: 4.5 + Math.random() * 2, el: document.createElement('div'),
    };
    f.el.className = 'fan' + (rare ? ' rare' : '');
    f.el.innerHTML = avatarFrontSVG(f.av, { expr: 'happy' }) + (rare ? '<span class="aura"></span>' : '');
    queueEl.appendChild(f.el);
    return f;
  }
  function layout() {
    fans.forEach((f, i) => {
      f.el.style.transform = `translateX(${i * 64}px) scale(${i === 0 ? 1.15 : 1 - i * 0.03})`;
      f.el.style.zIndex = 50 - i;
      f.el.classList.toggle('front', i === 0);
    });
  }
  function fill() { while (fans.length < 6) { const f = makeFan(); if (!f) break; fans.push(f); } layout(); }
  function present() {
    cur = fans[0] || null;
    if (!cur) { card.classList.remove('show'); return; }
    itemEl.innerHTML = itemSVG(cur.item) + `<path class="sig" d="${SIG}" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100"/>`;
    card.classList.toggle('rare', cur.rare);
    $('.who', card).textContent = cur.rare ? t('autoRare') : '';
    card.classList.remove('show'); void card.offsetWidth; card.classList.add('show');
    cur.t0 = performance.now();
  }
  function leave(f, happy) {
    f.el.classList.add(happy ? 'happy' : 'sad');
    if (happy) f.el.insertAdjacentHTML('beforeend', '<span class="heart">❤</span>');
    f.el.innerHTML = f.el.innerHTML.replace(/<svg[\s\S]*?<\/svg>/, avatarFrontSVG(f.av, { expr: happy ? 'excited' : 'rage' }));
    setTimeout(() => f.el.remove(), 700);
    fans.shift();
    fill();
    present();
  }
  function signTap(e) {
    if (!running || !cur) return;
    cur.done++;
    sfx.sign();
    bridge.vibrate(12);
    const p = Math.min(100, cur.done / cur.need * 100);
    const sig = $('.sig', itemEl); if (sig) sig.style.strokeDashoffset = String(100 - p);
    const r = card.getBoundingClientRect();
    sparkles(e.clientX || r.left + r.width / 2, e.clientY || r.top + r.height / 2, 4, '#4cc9f0');
    if (cur.done >= cur.need) {
      signed++; S.stats.signed++; G.progressMission('signed', 1);
      combo++; bestCombo = Math.max(bestCombo, combo);
      if (cur.rare) { const g = 1 + Math.floor(Math.random() * 3); rareGems += g; floatText(r.left + r.width / 2, r.top, '+' + g + ' 💎', '#59d8ff', 24); sparkles(r.left + r.width / 2, r.top + r.height / 2, 20, '#59d8ff'); }
      if (combo >= 3) { comboEl.textContent = t('combo', { n: combo }); comboEl.classList.remove('pop'); void comboEl.offsetWidth; comboEl.classList.add('pop'); }
      $('.ah-count b', ov).textContent = signed;
      sfx.coin();
      card.classList.add('signed');
      const f = cur; cur = null;
      setTimeout(() => { card.classList.remove('signed'); leave(f, true); }, 220);
    }
  }
  card.addEventListener('pointerdown', signTap);
  $('.queue', ov).addEventListener('pointerdown', (e) => { if (e.target.closest('.fan.front')) signTap(e); });

  // countdown 3-2-1
  let cd = 3;
  const startEl = $('.auto-start', ov);
  const cdi = setInterval(() => {
    cd--;
    if (cd > 0) { $('b', startEl).textContent = cd; sfx.click(); return; }
    clearInterval(cdi);
    $('b', startEl).textContent = 'GO!'; sfx.levelUp();
    setTimeout(() => startEl.remove(), 500);
    running = true; fill(); present();
    last = performance.now(); requestAnimationFrame(loop);
  }, 700);

  let last = 0;
  const ring = $('.ring', ov);
  function loop(now) {
    if (ended) return;
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    timeLeft -= dt;
    $('.ah-time b', ov).textContent = Math.max(0, Math.ceil(timeLeft));
    ring.style.strokeDashoffset = String(107 * (1 - timeLeft / DURATION));
    if (cur) {
      const el = (now - cur.t0) / 1000;
      const left = Math.max(0, 1 - el / cur.patience);
      $('.patience i', card).style.width = left * 100 + '%';
      $('.patience', card).classList.toggle('low', left < 0.3);
      if (left <= 0) { combo = 0; comboEl.textContent = ''; const f = cur; cur = null; sfx.error(); leave(f, false); }
    }
    if (timeLeft <= 0 || (!cur && !fans.length && spawned >= total)) { finish(); return; }
    requestAnimationFrame(loop);
  }

  function finish() {
    ended = true; running = false;
    card.classList.remove('show');
    const perfect = signed >= total;
    const res = G.autographReward(signed, total, rareGems);
    if (perfect) res.gold *= 1.2;
    setTimeout(() => {
      confetti(perfect ? 160 : 80);
      sfx.fanfare();
      const api = modal({
        cls: 'auto-result', noClose: true, noBackdropClose: true, title: t('autoResult'), icon: ic('pen'),
        body: `${perfect ? `<div class="perfect">${t('perfect')}</div>` : ''}
          <div class="ar-row"><span>${t('autoSigned')}</span><b>${signed}/${total}</b></div>
          <div class="ar-row"><span>${t('autoBonus', { p: Math.round(res.frac * 50) })}</span><b>${t('combo', { n: bestCombo })}</b></div>
          ${rareGems ? `<div class="ar-row"><span>${t('autoRare')}</span><b>${ic('gem')} ${rareGems}</b></div>` : ''}
          <div class="big-reward">${ic('gold')}<b>${fmt(res.gold)}</b></div>`,
        buttons: [
          { label: t('collect'), cls: 'ghost', onClick: () => done(1) },
          { label: `${ic('play')} ${t('autoDouble')}`, cls: 'ad', close: false, onClick: (a) => { ads.rewarded('autograph_double').then(ok => { if (ok) { a.close(); done(2); } }); } },
        ],
      });
      function done(mult) {
        G.finishAutograph(res, mult);
        const r = $('.big-reward', api.el).getBoundingClientRect();
        coinBurst(r.left + r.width / 2, r.top + r.height / 2, 14, $('#gold-pill .ic'));
        sfx.coin();
        ov.classList.remove('in');
        setTimeout(() => ov.remove(), 300);
        bridge.log('autograph_done', { signed, total, mult });
        onEnd && onEnd();
      }
    }, 600);
  }
}
