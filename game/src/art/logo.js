// App logo / icon (also rendered to PNG launcher icons by tools/icons.mjs).
import { avatarFront } from './avatar.js';

const HERO = { skin: 1, body: 1, hair: 4, hairColor: 1, outfit: 3, outfitColor: 4, hat: 'headset', glasses: 'none', neck: 'none' };

export const LOGO_DEFS = `<defs>
  <linearGradient id="bgL" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7c4dff"/><stop offset=".55" stop-color="#b44dff"/><stop offset="1" stop-color="#ff4f8b"/></linearGradient>
  <radialGradient id="shine" cx=".5" cy=".38" r=".6"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
</defs>`;

export const LOGO_BG = `<rect width="512" height="512" fill="url(#bgL)"/>
  <g opacity=".13" fill="#fff">${Array.from({ length: 12 }, (_, i) => `<path d="M256 256 L${256 + Math.cos(i / 12 * Math.PI * 2) * 520} ${256 + Math.sin(i / 12 * Math.PI * 2) * 520} L${256 + Math.cos((i + 0.5) / 12 * Math.PI * 2) * 520} ${256 + Math.sin((i + 0.5) / 12 * Math.PI * 2) * 520} Z"/>`).join('')}</g>
  <rect width="512" height="512" fill="url(#shine)"/>`;

const coin = (x, y, r, rot) => `<g transform="translate(${x} ${y}) rotate(${rot})"><ellipse rx="${r}" ry="${r}" fill="#e0a21a" stroke="#2a1f3d" stroke-width="7"/><ellipse rx="${r * 0.72}" ry="${r * 0.72}" fill="#ffd23f"/><path transform="scale(${r / 40})" d="M0 -20 l6 12 13 2 -9.5 9 2.3 13 -11.8 -6.2 -11.8 6.2 2.3 -13 -9.5 -9 13 -2 z" fill="#fff3b0" stroke="#b7790e" stroke-width="3" stroke-linejoin="round"/><path d="M${-r * 0.5} ${-r * 0.3} q${r * 0.2} ${-r * 0.35} ${r * 0.55} ${-r * 0.35}" stroke="#fff" stroke-width="${r * 0.14}" fill="none" stroke-linecap="round" opacity=".8"/></g>`;

export const LOGO_FG = `
  <g transform="translate(46 70) scale(3.5)">${avatarFront(HERO, { expr: 'excited', blink: false })}</g>
  <g transform="translate(372 108) rotate(12)">
    <rect x="-82" y="-36" width="164" height="72" rx="22" fill="#ff2d55" stroke="#2a1f3d" stroke-width="10"/>
    <circle cx="-46" cy="0" r="11" fill="#fff"/>
    <text x="16" y="17" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="48" fill="#fff">LIVE</text>
  </g>
  ${coin(92, 420, 42, -18)}${coin(140, 470, 30, 12)}`;

export function logoSVG(round = 112) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${LOGO_DEFS}<clipPath id="cl"><rect width="512" height="512" rx="${round}"/></clipPath><g clip-path="url(#cl)">${LOGO_BG}${LOGO_FG}</g></svg>`;
}
