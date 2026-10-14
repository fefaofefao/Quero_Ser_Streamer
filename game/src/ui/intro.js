// Story intro (comic panels) and the light guided tutorial.
import { avatarFrontSVG } from '../art/avatar.js';
import { roomSVG, SCREENS } from '../art/room.js';
import { newState } from '../state.js';
import { S } from '../game.js';
import { t } from '../i18n.js';
import { $ } from './dom.js';
import { sfx } from '../audio.js';

const VOVO = { skin: 1, body: 1, hair: 6, hairColor: 11, outfit: 2, outfitColor: 5, hat: 'none', glasses: 'round', neck: 'none' };
const VOVOA = { skin: 1, body: 2, hair: 1, hairColor: 11, outfit: 2, outfitColor: 9, hat: 'none', glasses: 'square', neck: 'none' };
const KID = { skin: 2, body: 0, hair: 0, hairColor: 1, outfit: 0, outfitColor: 1, hat: 'none', glasses: 'none', neck: 'none' };

function panel(i) {
  switch (i) {
    case 0: return `<svg viewBox="0 0 300 260"><defs><radialGradient id="ph" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#9be7ff" stop-opacity=".7"/><stop offset="1" stop-color="#9be7ff" stop-opacity="0"/></radialGradient></defs>
      <rect width="300" height="260" fill="#151a3d"/><rect x="200" y="30" width="70" height="60" fill="#0d1440" stroke="#2a2f6a" stroke-width="6"/><circle cx="246" cy="52" r="9" fill="#fff6d6"/><circle cx="250" cy="49" r="8" fill="#0d1440"/>
      <rect x="0" y="190" width="300" height="70" fill="#3b2f63"/><rect x="10" y="170" width="230" height="40" rx="10" fill="#f3f4f6"/><rect x="10" y="185" width="230" height="40" rx="6" fill="#7c3aed"/>
      <circle cx="150" cy="140" r="90" fill="url(#ph)"/>
      <g transform="translate(70 40) scale(1.3)">${avatarFrontSVG(KID, { expr: 'wow', blink: false }).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g>
      <g transform="translate(150 160) rotate(-8)"><rect x="-18" y="-30" width="36" height="58" rx="6" fill="#111827" stroke="#2a1f3d" stroke-width="3"/><rect x="-14" y="-24" width="28" height="44" rx="2" fill="#6c5ce7"/><path d="M-6 -6 L6 0 L-6 6 Z" fill="#fff"/></g></svg>`;
    case 1: return `<svg viewBox="0 0 300 260"><rect width="300" height="260" fill="#fde7c7"/><rect y="200" width="300" height="60" fill="#c08457"/>
      <g transform="translate(0 50) scale(1.15)">${avatarFrontSVG(VOVO, { expr: 'happy', blink: false }).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g>
      <g transform="translate(170 46) scale(1.15)">${avatarFrontSVG(VOVOA, { expr: 'happy', blink: false }).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g>
      <g transform="translate(150 200)"><rect x="-70" y="-70" width="140" height="80" rx="6" fill="#ef4444" stroke="#2a1f3d" stroke-width="4"/><rect x="-10" y="-70" width="20" height="80" fill="#facc15" stroke="#2a1f3d" stroke-width="3"/><path d="M0 -70 C-30 -110 -60 -80 0 -70 C60 -80 30 -110 0 -70" fill="#facc15" stroke="#2a1f3d" stroke-width="3"/></g></svg>`;
    case 2: return `<svg viewBox="0 0 300 260"><rect width="300" height="260" fill="#ffe8f0"/>
      <g transform="translate(-6 70) scale(1.5)">${avatarFrontSVG(VOVO, { expr: 'happy', blink: false }).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g>
      <path d="M150 30 h135 a12 12 0 0 1 12 12 v70 a12 12 0 0 1 -12 12 h-95 l-30 26 l6 -26 h-16 a12 12 0 0 1 -12 -12 v-70 a12 12 0 0 1 12 -12z" fill="#fff" stroke="#2a1f3d" stroke-width="3"/>
      <text x="222" y="78" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="34" fill="#ff4f6d">♥</text></svg>`;
    case 3: {
      const s = newState(); s.profile.avatar = S.profile.avatar || KID;
      const r = roomSVG(s, { phase: 'day' });
      const sc = SCREENS[0];
      return `<svg viewBox="0 0 400 340">${r.below}<rect x="${sc.x}" y="${sc.y}" width="${sc.w}" height="${sc.h}" fill="#3b3a80"/><text x="${sc.x + sc.w / 2}" y="${sc.y + sc.h / 2 + 6}" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="16" fill="#fff">LIVE?</text>${r.above}
        <g transform="translate(320 150)"><path d="M0 0 C-20 -26 -40 -6 0 0 C40 -6 20 -26 0 0" fill="#ef4444" stroke="#2a1f3d" stroke-width="3"/><circle r="5" fill="#ef4444" stroke="#2a1f3d" stroke-width="2"/></g></svg>`;
    }
  }
  return '';
}

export function playIntro(done) {
  const texts = ['intro1', 'intro2', 'intro3', 'intro4'];
  let i = 0;
  const el = document.createElement('div');
  el.className = 'intro';
  document.body.appendChild(el);
  const show = () => {
    el.innerHTML = `<div class="comic in"><div class="panel">${panel(i)}</div><p>${t(texts[i])}</p><div class="dots">${texts.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div><small class="tap">▶</small></div><button class="skip">${t('next')} ›</button>`;
  };
  show();
  el.addEventListener('click', (e) => {
    sfx.click();
    if (e.target.closest('.skip') && i < texts.length - 1) i = texts.length - 1;
    else i++;
    if (i >= texts.length) { el.classList.add('out'); setTimeout(() => el.remove(), 400); done(); return; }
    show();
  });
}

// ---------- tutorial coach ----------
let coach = null;
export function coachAt(target, text, place = 'below') {
  clearCoach();
  if (!target) return;
  coach = document.createElement('div');
  coach.className = 'coach ' + place;
  coach.innerHTML = `<div class="hand"><svg viewBox="0 0 40 48"><path d="M14 22V8a4 4 0 0 1 8 0v12l2-1a4 4 0 0 1 5 2l1 1a4 4 0 0 1 5 3v10c0 7-5 11-12 11h-3c-4 0-7-2-9-5l-6-9a3.5 3.5 0 0 1 5.5-4.2L14 26z" fill="#fff" stroke="#2a1f3d" stroke-width="2.6" stroke-linejoin="round"/></svg></div><div class="bubble">${text}</div>`;
  document.body.appendChild(coach);
  const place2 = () => {
    if (!coach) return;
    const r = target.getBoundingClientRect();
    coach.style.left = r.left + r.width / 2 + 'px';
    coach.style.top = (place === 'above' ? r.top : r.top + r.height / 2) + 'px';
    const cx = r.left + r.width / 2, half = 135;
    const clamped = Math.min(window.innerWidth - half - 8, Math.max(half + 8, cx));
    coach.style.setProperty('--bx', `calc(50% + ${clamped - cx}px)`);
  };
  place2();
  coach._t = setInterval(place2, 300);
}
export function clearCoach() { if (coach) { clearInterval(coach._t); coach.remove(); coach = null; } }
