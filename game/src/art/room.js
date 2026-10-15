// The streamer's room, drawn as layered SVG (viewBox 0 0 400 340).
// Every equipment level and every house has its own drawing.
import { avatarBack, shade } from './avatar.js';

export const W = 400, H = 340;
const O = '#2a1f3d';
const S = `stroke="${O}" stroke-width="2.2" stroke-linejoin="round"`;
const S1 = `stroke="${O}" stroke-width="1.6" stroke-linejoin="round"`;

// Screen rectangles (where the live game canvas is placed) per monitor level.
export const SCREENS = [
  { x: 152, y: 130, w: 98, h: 72, crt: true },
  { x: 156, y: 134, w: 88, h: 60 },
  { x: 128, y: 118, w: 144, h: 80 },
  { x: 118, y: 108, w: 164, h: 92 },
  { x: 108, y: 112, w: 184, h: 78 },
];

export function skyPhase(date = new Date()) {
  const h = date.getHours() + date.getMinutes() / 60;
  if (h >= 20.5 || h < 5) return 'night';
  if (h < 7) return 'dawn';
  if (h < 17.5) return 'day';
  return 'dusk';
}

const SKY = {
  day: ['#7cc8ff', '#c9ecff'],
  dawn: ['#ffb38a', '#ffe1b8'],
  dusk: ['#6d5bd0', '#ff9d7a'],
  night: ['#0d1440', '#2a2f7a'],
};

function skyGrad(id, phase) {
  const [a, b] = SKY[phase];
  return `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
}

function skyDetails(phase, x, y, w, h) {
  if (phase === 'night') {
    let st = '';
    for (let i = 0; i < 9; i++) {
      const sx = x + ((i * 37) % w), sy = y + ((i * 23) % (h * 0.6)) + 4;
      st += `<circle cx="${sx}" cy="${sy}" r="${i % 3 ? 0.9 : 1.4}" fill="#fff"><animate attributeName="opacity" values="1;.3;1" dur="${2 + (i % 4)}s" repeatCount="indefinite"/></circle>`;
    }
    return st + `<circle cx="${x + w * 0.75}" cy="${y + h * 0.25}" r="7" fill="#fff6d6"/><circle cx="${x + w * 0.75 + 3}" cy="${y + h * 0.25 - 2}" r="6" fill="${SKY.night[0]}"/>`;
  }
  if (phase === 'day') {
    return `<g fill="#fff" opacity=".95"><g><ellipse cx="${x + w * 0.3}" cy="${y + h * 0.28}" rx="12" ry="6"/><ellipse cx="${x + w * 0.3 + 9}" cy="${y + h * 0.24}" rx="9" ry="6"/><animateTransform attributeName="transform" type="translate" values="0 0; 14 0; 0 0" dur="40s" repeatCount="indefinite"/></g><g><ellipse cx="${x + w * 0.72}" cy="${y + h * 0.45}" rx="10" ry="5"/><ellipse cx="${x + w * 0.72 - 7}" cy="${y + h * 0.42}" rx="7" ry="5"/><animateTransform attributeName="transform" type="translate" values="0 0; -10 0; 0 0" dur="34s" repeatCount="indefinite"/></g></g><circle cx="${x + w * 0.82}" cy="${y + h * 0.18}" r="8" fill="#fff3a6" opacity=".9"/>`;
  }
  return `<circle cx="${x + w * 0.5}" cy="${y + h * 0.8}" r="12" fill="#ffe08a" opacity=".9"/>`;
}

// ---------------- HOUSES ----------------
function wallpaperStripes(c, x0, x1, y0, y1, step = 18) {
  let s = '';
  for (let x = x0; x < x1; x += step) s += `<rect x="${x}" y="${y0}" width="${step / 2}" height="${y1 - y0}" fill="${c}"/>`;
  return s;
}

function planks(y0, y1, c1, c2, step = 26) {
  let s = `<rect x="0" y="${y0}" width="${W}" height="${y1 - y0}" fill="${c1}"/>`;
  for (let y = y0 + 12, row = 0; y < y1; y += 12, row++) {
    s += `<path d="M0 ${y} L${W} ${y}" stroke="${c2}" stroke-width="1.2" opacity=".55"/>`;
    for (let x = (row % 2) * step * 1.5; x < W; x += step * 3) s += `<path d="M${x} ${y - 12} L${x} ${y}" stroke="${c2}" stroke-width="1.2" opacity=".5"/>`;
  }
  return s;
}

function windowFrame(x, y, w, h, phase, frame = '#f4efe6', curtain = null, id = 'sky') {
  let s = `<rect x="${x - 5}" y="${y - 5}" width="${w + 10}" height="${h + 10}" rx="3" fill="${frame}" ${S}/>`;
  s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${id})" ${S1}/>`;
  s += skyDetails(phase, x, y, w, h);
  s += `<path d="M${x + w / 2} ${y} L${x + w / 2} ${y + h} M${x} ${y + h / 2} L${x + w} ${y + h / 2}" stroke="${frame}" stroke-width="4"/>`;
  s += `<path d="M${x + 6} ${y + h - 8} L${x + 20} ${y + 6}" stroke="#fff" stroke-width="3" opacity=".25" stroke-linecap="round"/>`;
  if (curtain) {
    s += `<path d="M${x - 12} ${y - 10} L${x + w * 0.28} ${y - 10} C${x + w * 0.2} ${y + h * 0.4} ${x + w * 0.18} ${y + h * 0.8} ${x + w * 0.05} ${y + h + 12} L${x - 12} ${y + h + 12} Z" fill="${curtain}" ${S}/>`;
    s += `<path d="M${x + w + 12} ${y - 10} L${x + w * 0.72} ${y - 10} C${x + w * 0.8} ${y + h * 0.4} ${x + w * 0.82} ${y + h * 0.8} ${x + w * 0.95} ${y + h + 12} L${x + w + 12} ${y + h + 12} Z" fill="${curtain}" ${S}/>`;
    s += `<rect x="${x - 16}" y="${y - 14}" width="${w + 32}" height="5" rx="2.5" fill="#8b5a2b" ${S1}/>`;
  }
  return s;
}

function framedPhoto(x, y) {
  // grandparents photo
  return `<g transform="translate(${x} ${y}) rotate(-3)"><rect x="0" y="0" width="34" height="28" rx="2" fill="#c8954f" ${S}/><rect x="4" y="4" width="26" height="20" fill="#fde9c9"/><circle cx="12" cy="13" r="4" fill="#f2c9a0"/><path d="M8 10 Q12 5 16 10" fill="#d9d9d9"/><circle cx="22" cy="13" r="4" fill="#f2c9a0"/><path d="M18 11 Q22 6 26 11" fill="#bdbdbd"/><path d="M6 24 Q12 17 17 24 Z M17 24 Q22 17 28 24 Z" fill="#7b9acc"/><path d="M19 17 l1.4 .2" stroke="#333" stroke-width=".8"/></g>`;
}

function poster(x, y, w, h, c1, c2, title, rot = 2) {
  return `<g transform="translate(${x} ${y}) rotate(${rot})"><rect width="${w}" height="${h}" fill="${c1}" ${S1}/><rect x="3" y="3" width="${w - 6}" height="${h * 0.62}" fill="${c2}"/>` +
    `<g fill="#fff" opacity=".9"><rect x="${w * 0.3}" y="${h * 0.2}" width="7" height="7"/><rect x="${w * 0.3 + 7}" y="${h * 0.2}" width="7" height="7"/><rect x="${w * 0.3 + 7}" y="${h * 0.2 + 7}" width="7" height="7"/></g>` +
    `<text x="${w / 2}" y="${h * 0.86}" font-family="Fredoka" font-weight="700" font-size="${Math.min(8, w / title.length * 1.7)}" text-anchor="middle" fill="#fff">${title}</text>` +
    `<rect x="${w / 2 - 5}" y="-3" width="10" height="5" fill="#f5f0d8" opacity=".85" transform="rotate(-8 ${w / 2} 0)"/></g>`;
}

function plant(x, y, k = 1) {
  return `<g transform="translate(${x} ${y}) scale(${k})"><path d="M0 0 C-14 -10 -16 -26 -6 -34 C-4 -20 -2 -12 0 0 Z M0 0 C12 -12 20 -24 12 -38 C6 -22 4 -12 0 0 Z M0 0 C-2 -18 2 -34 0 -44 C6 -30 4 -14 0 0 Z" fill="#3fae5a" ${S1}/><path d="M-12 -2 L12 -2 L9 18 L-9 18 Z" fill="#d9774b" ${S}/><rect x="-14" y="-6" width="28" height="6" rx="2" fill="#c0603a" ${S1}/></g>`;
}

function shelf(x, y, w, items = '') {
  return `<g><rect x="${x}" y="${y}" width="${w}" height="6" rx="1.5" fill="#8b5a2b" ${S1}/><path d="M${x + 8} ${y + 6} l0 8 l6 -8 M${x + w - 8} ${y + 6} l0 8 l-6 -8" stroke="${O}" stroke-width="1.6" fill="#6b4423"/>${items}</g>`;
}

function plaque(x, y, kind) {
  const C = { silver: ['#f3f4f6', '#9ca3af'], gold: ['#fff3b0', '#d4a017'], diamond: ['#e0fbff', '#38bdf8'], ruby: ['#ffe4e6', '#e11d48'], legend: ['#f3e8ff', '#8b5cf6'] }[kind];
  return `<g transform="translate(${x} ${y})"><rect x="-11" y="-15" width="22" height="20" rx="3" fill="#3b2a1a" ${S1}/><rect x="-8.5" y="-12.5" width="17" height="15" rx="2" fill="${C[0]}"/><path d="M0 -10.5 l1.8 3.6 4 .6 -2.9 2.8 .7 4 -3.6 -1.9 -3.6 1.9 .7 -4 -2.9 -2.8 4 -.6 z" fill="${C[1]}"/><rect x="-6" y="5" width="12" height="3" rx="1" fill="#d4a017"/></g>`;
}

function trophy(x, y, c = '#fbbf24') {
  return `<g transform="translate(${x} ${y})"><path d="M-7 -18 L7 -18 L6 -9 C5 -5 -5 -5 -6 -9 Z" fill="${c}" ${S1}/><path d="M-7 -16 C-12 -16 -12 -10 -6 -10 M7 -16 C12 -16 12 -10 6 -10" stroke="${O}" stroke-width="1.4" fill="none"/><rect x="-2" y="-6" width="4" height="4" fill="${c}"/><rect x="-6" y="-3" width="12" height="4" rx="1" fill="#6b4423" ${S1}/></g>`;
}

function figurine(x, y, c) {
  return `<g transform="translate(${x} ${y})"><circle cx="0" cy="-12" r="4.5" fill="${c}" ${S1}/><rect x="-3.5" y="-8" width="7" height="8" rx="2" fill="${shade(c, -0.2)}" ${S1}/></g>`;
}

function neonSign(x, y, text, color, onAir) {
  return `<g class="neon">${onAir ? `<text x="${x}" y="${y + 14}" font-family="Fredoka" font-weight="700" font-size="8" text-anchor="middle" fill="#ff4f6d">● ON AIR<animate attributeName="opacity" values="1;.5;1" dur="2s" repeatCount="indefinite"/></text>` : ''}<text x="${x}" y="${y}" font-family="Fredoka" font-weight="700" font-size="14" text-anchor="middle" fill="none" stroke="${color}" stroke-width="5" opacity=".35" filter="url(#glow)">${text}</text><text x="${x}" y="${y}" font-family="Fredoka" font-weight="700" font-size="14" text-anchor="middle" fill="#fff" stroke="${color}" stroke-width="1.4">${text}<animate attributeName="opacity" values="1;1;.6;1;1" keyTimes="0;.9;.92;.94;1" dur="6s" repeatCount="indefinite"/></text></g>`;
}

function bed(x, y) {
  let quilt = '';
  const cols = ['#f87171', '#60a5fa', '#fbbf24', '#34d399', '#a78bfa', '#fb923c'];
  for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) quilt += `<rect x="${x + 4 + i * 18}" y="${y + 14 + j * 14}" width="18" height="14" fill="${cols[(i + j * 2) % cols.length]}" opacity=".9"/>`;
  return `<g><rect x="${x}" y="${y - 30}" width="10" height="80" rx="3" fill="#8b5a2b" ${S}/><rect x="${x}" y="${y + 6}" width="96" height="40" rx="4" fill="#f3f4f6" ${S}/>${quilt}<path d="M${x + 4} ${y + 14} L${x + 94} ${y + 14} L${x + 94} ${y + 42} L${x + 4} ${y + 42} Z" fill="none" ${S1}/><rect x="${x + 12}" y="${y - 6}" width="34" height="16" rx="7" fill="#fff" ${S}/><rect x="${x}" y="${y + 44}" width="96" height="8" fill="#6b4423" ${S1}/></g>`;
}

function lampCord(x, phase) {
  const on = phase === 'night' || phase === 'dusk';
  return `<g class="lamp" style="transform-origin:${x}px 0px"><path d="M${x} 0 L${x} 34" stroke="#333" stroke-width="1.6"/><path d="M${x - 9} 34 L${x + 9} 34 L${x + 6} 42 L${x - 6} 42 Z" fill="#6b7280" ${S1}/><circle cx="${x}" cy="45" r="5" fill="${on ? '#fff3b0' : '#f3f4f6'}" ${S1}/>${on ? `<circle cx="${x}" cy="46" r="40" fill="url(#lampGlow)"/>` : ''}</g>`;
}

function house0(phase) {
  // Humble bedroom at the grandparents' house
  return `
  <rect width="${W}" height="250" fill="#ead7b5"/>
  ${wallpaperStripes('#e2cca6', 0, W, 0, 250, 22)}
  <path d="M332 30 C346 34 352 52 340 62 C330 70 318 58 324 46 C326 40 328 34 332 30 Z" fill="#cdb48a" opacity=".55"/>
  <path d="M60 210 l8 -12 l-3 -10 l7 -8" stroke="#b49a72" stroke-width="1.4" fill="none"/>
  ${windowFrame(32, 52, 74, 64, phase, '#f4efe6', '#e57373')}
  ${framedPhoto(130, 40)}
  ${poster(318, 72, 52, 64, '#4c1d95', '#7c3aed', 'BLOCOCAI', 4)}
  ${planks(250, H, '#a8794c', '#7a5230')}
  <rect x="0" y="244" width="${W}" height="8" fill="#c9a77a" ${S1}/>
  ${bed(-6, 232)}
  <g transform="translate(350 296)"><rect x="-22" y="-26" width="44" height="30" fill="#d4a373" ${S}/><path d="M-22 -26 L-14 -34 L30 -34 L22 -26 Z" fill="#e7bf8c" ${S1}/><path d="M22 -26 L30 -34 L30 -4 L22 4 Z" fill="#b5835a" ${S1}/><text x="0" y="-8" font-size="7" text-anchor="middle" font-family="Fredoka" fill="#7a5230">FRÁGIL</text></g>
  `;
}

function house1(phase) {
  // Rented kitchenette
  return `
  <rect width="${W}" height="250" fill="#cfdbe6"/>
  <rect y="0" width="${W}" height="10" fill="#b8c7d6"/>
  ${windowFrame(286, 46, 84, 70, phase, '#ffffff', null)}
  <g transform="translate(286 116)" opacity=".9">${phase === 'night' ? '<rect x="8" y="-30" width="12" height="30" fill="#334"/><rect x="26" y="-44" width="14" height="44" fill="#2a2a40"/><rect x="48" y="-24" width="16" height="24" fill="#334"/>' : '<rect x="8" y="-30" width="12" height="30" fill="#93a8c6"/><rect x="26" y="-44" width="14" height="44" fill="#7f95b8"/><rect x="48" y="-24" width="16" height="24" fill="#93a8c6"/>'}</g>
  ${poster(126, 34, 46, 58, '#065f46', '#10b981', 'PULO PIXEL', -3)}
  <path d="M20 20 Q60 40 100 20 Q140 40 180 20" stroke="#555" stroke-width="1" fill="none"/>
  ${[30, 55, 80, 105, 130, 155].map((x, i) => `<circle cx="${x}" cy="${26 + (i % 2) * 4}" r="3.2" fill="${['#fde047', '#f472b6', '#60a5fa'][i % 3]}"><animate attributeName="opacity" values="1;.35;1" dur="${1.6 + i * 0.3}s" repeatCount="indefinite"/></circle>`).join('')}
  ${planks(250, H, '#c9b79c', '#a8957a', 40)}
  <rect x="0" y="244" width="${W}" height="8" fill="#e5e7eb" ${S1}/>
  <g><rect x="-4" y="160" width="86" height="92" fill="#f5f5f4" ${S}/><rect x="-4" y="150" width="90" height="12" fill="#a8a29e" ${S}/><rect x="8" y="126" width="40" height="24" rx="3" fill="#e7e5e4" ${S}/><rect x="12" y="130" width="24" height="16" rx="2" fill="#57534e"/><circle cx="42" cy="134" r="2" fill="#44403c"/><rect x="6" y="176" width="32" height="64" rx="2" fill="none" ${S1}/><rect x="44" y="176" width="32" height="64" rx="2" fill="none" ${S1}/><circle cx="34" cy="206" r="2" fill="${O}"/><circle cx="48" cy="206" r="2" fill="${O}"/></g>
  <g transform="translate(362 248)"><rect x="-20" y="-56" width="40" height="58" rx="4" fill="#f8fafc" ${S}/><path d="M-20 -38 L20 -38" stroke="${O}" stroke-width="1.6"/><rect x="12" y="-52" width="3" height="10" rx="1.5" fill="#94a3b8"/><rect x="12" y="-32" width="3" height="14" rx="1.5" fill="#94a3b8"/><rect x="-14" y="-52" width="10" height="7" rx="1" fill="#fca5a5"/></g>
  `;
}

function house2(phase) {
  // Apartment with a dedicated setup room
  const hexes = [[40, 60], [62, 72], [40, 84], [330, 54], [352, 66], [352, 90], [330, 78]];
  return `
  <rect width="${W}" height="250" fill="#2e3156"/>
  <rect width="${W}" height="250" fill="url(#vignette)"/>
  ${hexes.map(([x, y], i) => `<path d="M${x} ${y - 12} l10.4 6 0 12 -10.4 6 -10.4 -6 0 -12 z" fill="${['#4c4f8a', '#5b5fa3', '#3d4078'][i % 3]}" ${S1}/>`).join('')}
  ${windowFrame(118, 26, 58, 44, phase, '#1f2140', null)}
  <g opacity=".95">${[0, 1, 2, 3, 4].map(i => `<rect x="${121 + i * 11}" y="${48 - (i * 7) % 16}" width="8" height="${22 + (i * 7) % 16}" fill="${phase === 'night' ? '#1c1f3f' : '#5c6aa0'}"/>${phase === 'night' ? `<rect x="${123 + i * 11}" y="${52 - (i * 7) % 16}" width="2" height="2" fill="#ffe08a"/><rect x="${126 + i * 11}" y="${58 - (i * 7) % 16}" width="2" height="2" fill="#ffe08a"/>` : ''}`).join('')}</g>
  ${shelf(214, 46, 84, figurine(232, 46, '#f472b6') + figurine(250, 46, '#60a5fa') + trophy(272, 46, '#cbd5e1') + `<rect x="282" y="34" width="10" height="12" fill="#facc15" ${S1}/>`)}
  ${poster(20, 112, 46, 58, '#7c2d12', '#ea580c', 'GOL TOTAL', -2)}
  ${planks(250, H, '#3f3a52', '#2c283d', 50)}
  <rect x="0" y="244" width="${W}" height="8" fill="#23253f" ${S1}/>
  ${plant(360, 300, 1.1)}
  <g transform="translate(14 300)"><rect x="0" y="-36" width="44" height="40" rx="5" fill="#64748b" ${S}/><rect x="4" y="-32" width="36" height="20" rx="3" fill="#475569"/><text x="22" y="-18" font-size="7" font-family="Fredoka" text-anchor="middle" fill="#cbd5e1">SNACKS</text></g>
  `;
}

function house3(phase) {
  // Big house studio
  let slats = '';
  for (let x = 0; x < W; x += 12) slats += `<rect x="${x}" y="0" width="8" height="250" fill="#6b4a2f" opacity=".55"/>`;
  return `
  <rect width="${W}" height="250" fill="#2b2420"/>
  <rect x="0" y="0" width="${W}" height="250" fill="#3a2d24"/>
  ${slats}
  <rect width="${W}" height="250" fill="url(#vignette)"/>
  ${windowFrame(14, 40, 70, 90, phase, '#1a1410', null)}
  ${shelf(300, 50, 90, trophy(312, 50) + trophy(332, 50, '#e5e7eb') + figurine(352, 50, '#a78bfa') + trophy(374, 50, '#fb923c'))}
  ${shelf(300, 100, 90, figurine(314, 100, '#34d399') + figurine(330, 100, '#f87171') + `<rect x="344" y="86" width="40" height="14" rx="2" fill="#1f2937" ${S1}/><text x="364" y="96" font-size="7" font-family="Fredoka" text-anchor="middle" fill="#22d3ee">GG WP</text>`)}
  ${planks(250, H, '#5a3b26', '#3e2818', 60)}
  <rect x="0" y="244" width="${W}" height="8" fill="#1f1611" ${S1}/>
  ${plant(28, 300, 1.3)}
  ${plant(380, 300, 1.2)}
  <ellipse cx="200" cy="318" rx="150" ry="18" fill="#7c2d12" opacity=".5"/><ellipse cx="200" cy="318" rx="140" ry="14" fill="none" stroke="#fbbf24" stroke-width="1.2" opacity=".5"/>
  `;
}

function house4(phase) {
  // Star mansion: glass wall facing the pool
  const sky = phase === 'night' ? 'night' : phase === 'day' ? 'day' : 'dusk';
  let palms = '';
  for (const [x, k] of [[40, 1], [355, 0.85]]) palms += `<g transform="translate(${x} 170) scale(${k})"><path d="M0 0 C2 -30 6 -60 4 -90" stroke="#7c5a3a" stroke-width="7" fill="none" stroke-linecap="round"/><g fill="#2f9e5b" stroke="${O}" stroke-width="1.4"><path d="M4 -90 C-20 -100 -40 -90 -50 -74 C-30 -84 -14 -84 4 -90 Z"/><path d="M4 -90 C24 -104 46 -96 54 -80 C36 -88 20 -88 4 -90 Z"/><path d="M4 -90 C-6 -110 -24 -116 -36 -112 C-18 -106 -8 -100 4 -90 Z"/><path d="M4 -90 C16 -112 34 -118 44 -112 C28 -106 16 -100 4 -90 Z"/><animateTransform attributeName="transform" type="rotate" values="-2 4 -90;2 4 -90;-2 4 -90" dur="5s" repeatCount="indefinite"/></g></g>`;
  return `
  <rect width="${W}" height="250" fill="url(#skyM)"/>
  ${skyDetails(sky, 0, 0, W, 120)}
  <rect x="0" y="150" width="${W}" height="100" fill="#e9e1d3"/>
  <path d="M0 176 L${W} 176 L${W} 250 L0 250 Z" fill="#38bdf8"/>
  <path d="M0 176 L${W} 176" stroke="#f8fafc" stroke-width="5"/>
  ${[0, 1, 2, 3, 4, 5].map(i => `<path d="M${10 + i * 70} ${196 + (i % 2) * 18} q10 -5 20 0 t20 0" stroke="#e0f7ff" stroke-width="2" fill="none" opacity=".8"><animateTransform attributeName="transform" type="translate" values="0 0;8 0;0 0" dur="${3 + i * 0.4}s" repeatCount="indefinite"/></path>`).join('')}
  ${palms}
  ${[0, 100, 200, 300, 400].map(x => `<rect x="${x - 3}" y="0" width="6" height="250" fill="#f8fafc" ${S1}/>`).join('')}
  <rect x="0" y="0" width="${W}" height="8" fill="#f8fafc" ${S1}/>
  <path d="M30 20 L70 120 M230 10 L260 90" stroke="#fff" stroke-width="5" opacity=".18" stroke-linecap="round"/>
  <rect x="0" y="250" width="${W}" height="${H - 250}" fill="#efe9e1"/>
  ${[0, 1, 2, 3].map(i => `<path d="M${i * 120 - 20} 250 L${i * 120 + 60} ${H}" stroke="#d6cfc4" stroke-width="1.4"/>`).join('')}
  <path d="M0 290 L${W} 290" stroke="#d6cfc4" stroke-width="1.2"/>
  <rect x="0" y="244" width="${W}" height="8" fill="#d4af37" ${S1}/>
  ${plant(376, 304, 1.3)}
  `;
}

const HOUSE_FN = [house0, house1, house2, house3, house4];
const NEON_COL = ['#22d3ee', '#f472b6', '#a78bfa', '#facc15'];

// ---------------- DESKS ----------------
function desk(house) {
  const d = [
    { top: '#b07a46', front: '#8b5a2b', leg: '#6b4423' },
    { top: '#f5f5f4', front: '#e7e5e4', leg: '#a8a29e' },
    { top: '#1f2937', front: '#111827', leg: '#0b0f19' },
    { top: '#6b4a2f', front: '#1f1611', leg: '#111' },
    { top: '#f8fafc', front: '#e5e7eb', leg: '#d4af37' },
  ][house];
  return `<path d="M60 228 L340 228 L356 246 L44 246 Z" fill="${d.top}" ${S}/>
  <path d="M44 246 L356 246 L356 256 L44 256 Z" fill="${d.front}" ${S}/>
  <rect x="58" y="256" width="10" height="70" fill="${d.leg}" ${S1}/><rect x="332" y="256" width="10" height="70" fill="${d.leg}" ${S1}/>
  <path d="M64 230 L336 230" stroke="#fff" stroke-width="1.5" opacity=".25"/>
  ${house === 4 ? `<path d="M44 251 L356 251" stroke="#d4af37" stroke-width="1.6"/>` : ''}`;
}

// ---------------- EQUIPMENT ----------------
function monitor(lv, glow) {
  const sc = SCREENS[lv - 1];
  switch (lv) {
    case 1: return `<g><path d="M156 206 L246 206 L256 226 L146 226 Z" fill="#d6cbb0" ${S}/><rect x="138" y="118" width="126" height="98" rx="10" fill="#e8dfc8" ${S}/><rect x="146" y="124" width="110" height="84" rx="12" fill="#3b3a36" ${S1}/><text x="250" y="213" font-size="5" font-family="Fredoka" fill="#8a8170">ⓘ</text><circle cx="246" cy="212" r="2" fill="#4ade80"/><rect x="154" y="210" width="22" height="3" rx="1.5" fill="#bfb49a"/></g>`;
    case 2: return `<g><rect x="190" y="200" width="20" height="22" fill="#6b7280" ${S1}/><path d="M172 226 L228 226 L222 220 L178 220 Z" fill="#4b5563" ${S1}/><rect x="150" y="128" width="100" height="74" rx="4" fill="#9ca3af" ${S}/><rect x="198" y="203" width="4" height="2" fill="#22c55e"/></g>`;
    case 3: return `<g><rect x="192" y="198" width="16" height="26" fill="#1f2937" ${S1}/><path d="M168 228 L232 228 L226 222 L174 222 Z" fill="#111827" ${S1}/><rect x="122" y="112" width="156" height="92" rx="4" fill="#111827" ${S}/><text x="200" y="203" font-size="4.5" text-anchor="middle" font-family="Fredoka" fill="#6b7280">FULL HD</text></g>`;
    case 4: return `<g><path d="M196 200 L204 200 L208 224 L192 224 Z" fill="#374151" ${S1}/><path d="M166 228 L234 228 L228 223 L172 223 Z" fill="#111827" ${S1}/><rect x="114" y="104" width="172" height="100" rx="3" fill="#0b0f19" ${S}/><path d="M118 202 L282 202" stroke="#ef4444" stroke-width="1.6"/><text x="276" y="201" font-size="4" text-anchor="end" font-family="Fredoka" fill="#ef4444">144Hz</text></g>`;
    case 5: return `<g>
      <path d="M196 196 L204 196 L208 224 L192 224 Z" fill="#374151" ${S1}/><path d="M160 228 L240 228 L232 222 L168 222 Z" fill="#111827" ${S1}/>
      <path d="M104 108 Q200 100 296 108 L296 194 Q200 188 104 194 Z" fill="#0b0f19" ${S}/>
      <rect x="140" y="46" width="120" height="54" rx="3" fill="#0b0f19" ${S}/><rect x="143" y="49" width="114" height="47" fill="#111a2e"/>
      ${[0, 1, 2, 3, 4].map(i => `<rect x="147" y="${53 + i * 8.6}" width="${40 + ((i * 37) % 60)}" height="5" rx="2.5" fill="${['#a78bfa', '#22d3ee', '#f472b6', '#facc15', '#34d399'][i]}" opacity=".75"><animate attributeName="width" values="${30 + ((i * 37) % 60)};${50 + ((i * 29) % 50)};${30 + ((i * 37) % 60)}" dur="${2 + i * 0.5}s" repeatCount="indefinite"/></rect>`).join('')}
      <rect x="196" y="100" width="8" height="10" fill="#374151"/>
    </g>`;
  }
  return '';
}

// Elements drawn ON TOP of the live canvas (bezels, CRT glass).
export function monitorOverlay(lv) {
  if (lv === 1) return `<rect x="146" y="124" width="110" height="84" rx="12" fill="none" stroke="#3b3a36" stroke-width="7"/><rect x="149" y="127" width="104" height="78" rx="11" fill="url(#crtGlass)"/><path d="M156 134 Q170 128 196 130" stroke="#fff" stroke-width="3" opacity=".22" fill="none" stroke-linecap="round"/>`;
  if (lv === 5) return `<path d="M104 108 Q200 100 296 108 L296 194 Q200 188 104 194 Z" fill="none" stroke="#0b0f19" stroke-width="3"/>`;
  return '';
}

function softbox(sx, flip) {
  return `<g><path d="M${sx} 246 L${sx} 104" stroke="#374151" stroke-width="3"/><g transform="translate(${sx} 92) rotate(${flip ? 16 : -16})"><path d="M-18 -20 L18 -20 L11 20 L-11 20 Z" fill="#111827" ${S}/><path d="M-14 -16 L14 -16 L9 16 L-9 16 Z" fill="#fffbea"/><path d="M-14 -16 L14 -16 L9 16 L-9 16 Z" fill="url(#softGlow)"/></g><path d="M${sx} 100 L${sx + (flip ? -120 : 120)} 230" stroke="#fffbea" stroke-width="30" opacity=".06" stroke-linecap="round"/></g>`;
}

function pc(lv) {
  switch (lv) {
    case 1: return `<g><rect x="296" y="146" width="46" height="84" rx="3" fill="#e8dfc8" ${S}/><rect x="302" y="154" width="34" height="9" rx="1" fill="#d6cbb0" ${S1}/><rect x="302" y="168" width="34" height="6" rx="1" fill="#d6cbb0" ${S1}/><rect x="318" y="170" width="12" height="1.5" fill="#555"/><circle cx="306" cy="188" r="3" fill="#d6cbb0" ${S1}/><rect x="314" y="185" width="8" height="5" rx="1" fill="#f97316" ${S1}/><text x="319" y="196" font-size="3.6" font-family="Fredoka" text-anchor="middle" fill="#8a8170">TURBO</text><circle cx="332" cy="188" r="1.6" fill="#22c55e"><animate attributeName="opacity" values="1;.2;1;1;.2;1" dur="1.3s" repeatCount="indefinite"/></circle>${[0, 1, 2, 3, 4].map(i => `<path d="M302 ${206 + i * 4} L336 ${206 + i * 4}" stroke="#bfb49a" stroke-width="1.4"/>`).join('')}</g>`;
    case 2: return `<g><rect x="300" y="160" width="38" height="70" rx="3" fill="#1f2937" ${S}/><rect x="305" y="166" width="28" height="6" rx="1" fill="#374151"/><circle cx="319" cy="184" r="3.6" fill="#374151" stroke="#60a5fa" stroke-width="1.2"/><circle cx="319" cy="184" r="1.2" fill="#60a5fa"><animate attributeName="opacity" values="1;.4;1" dur="2s" repeatCount="indefinite"/></circle>${[0, 1, 2, 3].map(i => `<path d="M306 ${202 + i * 5} L332 ${202 + i * 5}" stroke="#4b5563" stroke-width="1.4"/>`).join('')}</g>`;
    case 3: return `<g><rect x="292" y="140" width="50" height="90" rx="4" fill="#111827" ${S}/><rect x="297" y="146" width="32" height="78" rx="2" fill="#1e293b" stroke="#60a5fa" stroke-width="1"/><g class="spin" style="transform-origin:313px 168px"><circle cx="313" cy="168" r="10" fill="#0ea5e9" opacity=".25"/><path d="M313 158 L315 168 L313 178 L311 168 Z M303 168 L313 166 L323 168 L313 170 Z" fill="#7dd3fc"/></g><rect x="300" y="190" width="26" height="10" rx="1.5" fill="#334155"/><rect x="300" y="204" width="26" height="14" rx="1.5" fill="#22c55e" opacity=".35"/><circle cx="337" cy="148" r="2" fill="#60a5fa"/></g>`;
    case 4:
    case 5: {
      const big = `<g><rect x="290" y="128" width="56" height="102" rx="4" fill="#0b0f19" ${S}/><rect x="295" y="134" width="38" height="90" rx="2" fill="#111827" stroke="#a78bfa" stroke-width="1"/>
        ${[148, 174, 200].map((y, i) => `<g class="spin" style="transform-origin:314px ${y}px;animation-duration:${0.9 + i * 0.2}s"><circle cx="314" cy="${y}" r="11" fill="none" stroke="url(#rgbGrad)" stroke-width="3"/><path d="M314 ${y - 9} L316 ${y} L314 ${y + 9} L312 ${y} Z M305 ${y} L314 ${y - 2} L323 ${y} L314 ${y + 2} Z" fill="#c4b5fd" opacity=".8"/></g>`).join('')}
        <rect x="338" y="134" width="3" height="90" rx="1.5" fill="url(#rgbGrad)"/></g>`;
      if (lv === 4) return big;
      return big + `<g><rect x="350" y="180" width="38" height="50" rx="3" fill="#0b0f19" ${S}/><rect x="354" y="186" width="30" height="38" rx="2" fill="#111827" stroke="#22d3ee" stroke-width="1"/><text x="369" y="208" font-size="6" font-family="Fredoka" text-anchor="middle" fill="#22d3ee">LIVE</text><circle cx="369" cy="196" r="2" fill="#ef4444"><animate attributeName="opacity" values="1;.2;1" dur="1s" repeatCount="indefinite"/></circle></g>`;
    }
  }
  return '';
}

function webcam(lv, monLv) {
  const sc = SCREENS[monLv - 1];
  const top = monLv === 1 ? 118 : monLv === 5 ? 102 : sc.y - 4;
  const x = 200;
  switch (lv) {
    case 1: return `<g><path d="M${x - 5} ${top} L${x + 5} ${top} L${x + 3} ${top - 5} L${x - 3} ${top - 5} Z" fill="#9ca3af" ${S1}/><circle cx="${x}" cy="${top - 10}" r="7" fill="#f5f5f4" ${S1}/><circle cx="${x}" cy="${top - 10}" r="3.4" fill="#1f2937"/><circle cx="${x + 1}" cy="${top - 11}" r="1" fill="#fff"/><circle cx="${x + 5}" cy="${top - 15}" r="1.2" fill="#ef4444"><animate attributeName="opacity" values="1;.2;1" dur="1.2s" repeatCount="indefinite"/></circle></g>`;
    case 2: return `<g><rect x="${x - 12}" y="${top - 10}" width="24" height="10" rx="5" fill="#1f2937" ${S1}/><circle cx="${x}" cy="${top - 5}" r="3.2" fill="#0ea5e9"/><circle cx="${x + 1}" cy="${top - 6}" r="1" fill="#fff"/></g>`;
    case 3: return `<g><rect x="${x - 16}" y="${top - 12}" width="32" height="12" rx="6" fill="#111827" ${S1}/><circle cx="${x}" cy="${top - 6}" r="4.4" fill="#1e3a8a" stroke="#60a5fa" stroke-width="1"/><circle cx="${x + 1.4}" cy="${top - 7.4}" r="1.3" fill="#fff"/><circle cx="${x + 11}" cy="${top - 6}" r="1.2" fill="#22c55e"/></g>`;
    case 4:
    case 5: {
      const cam = `<g><path d="M92 228 L100 196 L108 228 M100 196 L100 228" stroke="#374151" stroke-width="2.4" fill="none"/><rect x="88" y="178" width="26" height="18" rx="3" fill="#111827" ${S}/><circle cx="114" cy="187" r="7" fill="#1f2937" ${S1}/><circle cx="114" cy="187" r="4" fill="#312e81" stroke="#818cf8" stroke-width="1"/><circle cx="115.5" cy="185.5" r="1.2" fill="#fff"/><rect x="92" y="174" width="10" height="4" rx="1" fill="#374151"/><circle cx="96" cy="183" r="1.4" fill="#ef4444"><animate attributeName="opacity" values="1;.2;1" dur="1s" repeatCount="indefinite"/></circle><text x="100" y="193" font-size="4" font-family="Fredoka" fill="#9ca3af">4K</text></g>`;
      if (lv === 4) return cam;
      const softbox_unused = (sx, flip) => `<g><path d="M${sx} 330 L${sx} 120" stroke="#374151" stroke-width="3"/><path d="M${sx - 8} 330 L${sx} 300 L${sx + 8} 330" stroke="#374151" stroke-width="2.4" fill="none"/><g transform="translate(${sx} 110) rotate(${flip ? 18 : -18})"><path d="M-20 -24 L20 -24 L12 22 L-12 22 Z" fill="#111827" ${S}/><path d="M-16 -20 L16 -20 L10 18 L-10 18 Z" fill="#fffbea"/><path d="M-16 -20 L16 -20 L10 18 L-10 18 Z" fill="url(#softGlow)"/></g></g>`;
      return cam;
    }
  }
  return '';
}

function mousepad(lv) {
  switch (lv) {
    case 1: return `<path d="M244 233 L286 233 L290 243 L240 243 Z" fill="#60a5fa" ${S1}/><path d="M248 235 L254 235 M262 238 L270 238" stroke="#bfdbfe" stroke-width="1.2" opacity=".8"/><path d="M276 233 C280 236 284 236 286 233" fill="#93c5fd"/>`;
    case 2: return `<path d="M240 232 L292 232 L297 244 L235 244 Z" fill="#374151" ${S1}/>`;
    case 3: return `<path d="M232 231 L300 231 L306 245 L226 245 Z" fill="#111827" ${S1}/><path d="M240 235 L256 235 L260 241 L244 241 Z" fill="#ef4444" opacity=".8"/><text x="282" y="242" font-size="5" font-family="Fredoka" text-anchor="middle" fill="#ef4444">GAMER</text>`;
    case 4: return `<path d="M210 230 L318 230 L326 246 L202 246 Z" fill="#0f172a" stroke="url(#rgbGrad)" stroke-width="2.4" stroke-linejoin="round"/>`;
    case 5: return `<path d="M64 229.5 L336 229.5 L353 245.5 L47 245.5 Z" fill="#0f172a" stroke="url(#rgbGrad)" stroke-width="2.6" stroke-linejoin="round"/><path d="M90 238 L130 238" stroke="#a78bfa" stroke-width="1" opacity=".5"/><text x="300" y="243" font-size="5.5" font-family="Fredoka" text-anchor="middle" fill="#a78bfa" opacity=".8">PRO DESK MAT</text>`;
  }
  return '';
}

function mouse(lv) {
  const x = 266, y = 236;
  switch (lv) {
    case 1: return `<g><path d="M${x + 2} ${y - 6} C${x + 20} ${y - 40} ${x + 40} ${y - 10} 300 210" stroke="#d6cbb0" stroke-width="1.6" fill="none"/><ellipse cx="${x}" cy="${y}" rx="7" ry="5.5" fill="#e8dfc8" ${S1}/><path d="M${x - 6} ${y - 1.5} L${x + 6} ${y - 1.5}" stroke="${O}" stroke-width=".9"/></g>`;
    case 2: return `<g><path d="M${x + 2} ${y - 5} C${x + 20} ${y - 30} ${x + 30} ${y - 10} 304 214" stroke="#6b7280" stroke-width="1.4" fill="none"/><ellipse cx="${x}" cy="${y}" rx="6" ry="5" fill="#9ca3af" ${S1}/><path d="M${x} ${y - 5} L${x} ${y - 1}" stroke="${O}" stroke-width=".9"/></g>`;
    case 3: return `<g><ellipse cx="${x}" cy="${y}" rx="6.5" ry="5.2" fill="#111827" ${S1}/><path d="M${x - 2} ${y + 1} L${x + 2} ${y + 1}" stroke="#ef4444" stroke-width="1.6"/><path d="M${x} ${y - 5} L${x} ${y - 1.5}" stroke="#ef4444" stroke-width="1.2"/></g>`;
    case 4: return `<g><ellipse cx="${x}" cy="${y}" rx="6" ry="5" fill="#f8fafc" ${S1}/><path d="M${x} ${y - 5} L${x} ${y - 1}" stroke="#94a3b8" stroke-width="1"/><circle cx="${x}" cy="${y + 2}" r="1" fill="#22d3ee"/></g>`;
    case 5: return `<g><ellipse cx="${x}" cy="${y}" rx="6.5" ry="5.2" fill="#0b0f19" stroke="url(#rgbGrad)" stroke-width="1.8"/><path d="M${x} ${y - 5} L${x} ${y - 1}" stroke="#fbbf24" stroke-width="1.2"/></g>`;
  }
  return '';
}

function keyboard(lv) {
  const c = lv >= 3 ? '#111827' : lv === 2 ? '#d1d5db' : '#e8dfc8';
  const k = lv >= 3 ? 'url(#rgbGrad)' : '#9ca3af';
  return `<g><path d="M140 232 L210 232 L213 243 L136 243 Z" fill="${c}" ${S1}/>${[0, 1].map(r => `<path d="M${142 - r} ${235.5 + r * 4} L${208 + r} ${235.5 + r * 4}" stroke="${k}" stroke-width="2" stroke-dasharray="3 1.4" opacity="${lv >= 3 ? 0.9 : 0.8}"/>`).join('')}</g>`;
}

function chairBack(lv, cx) {
  switch (lv) {
    case 1: return `<g><path d="M${cx - 44} 336 L${cx - 40} 268 M${cx + 44} 336 L${cx + 40} 268" stroke="#9ca3af" stroke-width="4" stroke-linecap="round"/><path d="M${cx - 40} 268 L${cx + 40} 268 L${cx + 42} 318 L${cx - 42} 318 Z" fill="#fff" ${S}/>${[0, 1, 2, 3, 4].map(i => `<rect x="${cx - 40 + i * 16.4}" y="269" width="8.2" height="48" fill="${i % 2 ? '#38bdf8' : '#fb923c'}" opacity=".95"/>`).join('')}<path d="M${cx - 40} 268 L${cx + 40} 268 L${cx + 42} 318 L${cx - 42} 318 Z" fill="none" ${S}/><path d="M${cx - 46} 318 L${cx + 46} 318" stroke="#9ca3af" stroke-width="4" stroke-linecap="round"/></g>`;
    case 2: return `<g><path d="M${cx - 36} 336 L${cx - 34} 262 M${cx + 36} 336 L${cx + 34} 262" stroke="#8b5a2b" stroke-width="6" stroke-linecap="round"/><path d="M${cx - 38} 258 Q${cx} 250 ${cx + 38} 258 L${cx + 38} 272 Q${cx} 264 ${cx - 38} 272 Z" fill="#a16207" ${S}/>${[-18, -6, 6, 18].map(dx => `<rect x="${cx + dx - 3}" y="270" width="6" height="40" fill="#a16207" ${S1}/>`).join('')}<path d="M${cx - 38} 308 L${cx + 38} 308 L${cx + 38} 318 L${cx - 38} 318 Z" fill="#92400e" ${S1}/></g>`;
    case 3: return `<g><path d="M${cx} 318 L${cx} 334 M${cx - 30} 338 L${cx + 30} 338" stroke="#374151" stroke-width="5" stroke-linecap="round"/><circle cx="${cx - 30}" cy="338" r="3" fill="#111"/><circle cx="${cx + 30}" cy="338" r="3" fill="#111"/><path d="M${cx - 38} 256 Q${cx} 246 ${cx + 38} 256 L${cx + 34} 318 Q${cx} 324 ${cx - 34} 318 Z" fill="#4b5563" ${S}/><path d="M${cx - 30} 262 Q${cx} 254 ${cx + 30} 262 L${cx + 27} 312 Q${cx} 317 ${cx - 27} 312 Z" fill="url(#mesh)" opacity=".9"/></g>`;
    case 4: return `<g><path d="M${cx} 318 L${cx} 334 M${cx - 34} 338 L${cx + 34} 338" stroke="#111" stroke-width="5" stroke-linecap="round"/><circle cx="${cx - 34}" cy="338" r="3.4" fill="#111"/><circle cx="${cx + 34}" cy="338" r="3.4" fill="#111"/>
      <path d="M${cx - 46} 252 C${cx - 50} 280 ${cx - 46} 304 ${cx - 36} 322 L${cx + 36} 322 C${cx + 46} 304 ${cx + 50} 280 ${cx + 46} 252 C${cx + 30} 242 ${cx - 30} 242 ${cx - 46} 252 Z" fill="#111827" ${S}/>
      <path d="M${cx - 30} 252 C${cx - 32} 280 ${cx - 28} 302 ${cx - 22} 318 L${cx + 22} 318 C${cx + 28} 302 ${cx + 32} 280 ${cx + 30} 252 Z" fill="#dc2626" ${S1}/>
      <path d="M${cx - 10} 252 L${cx - 8} 318 M${cx + 10} 252 L${cx + 8} 318" stroke="#111827" stroke-width="5"/>
      <path d="M${cx - 9} 286 l9 -10 l9 10 l-9 10 z" fill="#fbbf24" ${S1}/></g>`;
    case 5: return `<g><path d="M${cx} 318 L${cx} 334 M${cx - 36} 338 L${cx + 36} 338" stroke="#d4af37" stroke-width="5" stroke-linecap="round"/><circle cx="${cx - 36}" cy="338" r="3.4" fill="#111"/><circle cx="${cx + 36}" cy="338" r="3.4" fill="#111"/>
      <path d="M${cx - 50} 300 L${cx - 54} 270 L${cx - 44} 268 L${cx - 40} 300 Z M${cx + 50} 300 L${cx + 54} 270 L${cx + 44} 268 L${cx + 40} 300 Z" fill="#1f2937" ${S1}/>
      <path d="M${cx - 44} 250 C${cx - 48} 284 ${cx - 44} 306 ${cx - 34} 324 L${cx + 34} 324 C${cx + 44} 306 ${cx + 48} 284 ${cx + 44} 250 C${cx + 26} 240 ${cx - 26} 240 ${cx - 44} 250 Z" fill="#f8fafc" ${S}/>
      <path d="M${cx - 34} 254 C${cx - 36} 284 ${cx - 32} 304 ${cx - 26} 320 L${cx + 26} 320 C${cx + 32} 304 ${cx + 36} 284 ${cx + 34} 254 Z" fill="#111827"/>
      ${[264, 276, 288, 300, 312].map(y => `<path d="M${cx - 30} ${y} Q${cx} ${y + 3} ${cx + 30} ${y}" stroke="#d4af37" stroke-width="1" fill="none" opacity=".75" stroke-dasharray="2 2"/>`).join('')}
      <rect x="${cx - 18}" y="296" width="36" height="14" rx="7" fill="#d4af37" ${S1}/></g>`;
  }
  return '';
}

function extras(s, layer) {
  const e = s.extras || {};
  let out = '';
  if (layer === 'wall') {
    if (e.rgb >= 2) out += `<rect x="96" y="96" width="208" height="122" rx="10" fill="none" stroke="url(#rgbGrad)" stroke-width="6" opacity=".6" filter="url(#glow)"/>`;
    if (e.rgb >= 3 && s.house <= 2) out += [[70, 40], [86, 50], [70, 60], [330, 150], [346, 160], [330, 170]].map(([x, y], i) => `<path d="M${x} ${y - 9} l7.8 4.5 0 9 -7.8 4.5 -7.8 -4.5 0 -9 z" fill="url(#rgbGrad)" opacity=".85" ${S1}/>`).join('');

  }
  if (layer === 'wall') {
    if (e.pool >= 2) out += `<g transform="translate(104 150)"><ellipse cx="0" cy="40" rx="18" ry="6" fill="#f472b6" ${S1}/><path d="M6 38 C6 22 18 18 16 8 C14 2 6 4 8 10" stroke="#f472b6" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="8" cy="6" r="2" fill="#111"/><animateTransform attributeName="transform" type="translate" values="104 150;108 152;104 150" dur="4s" repeatCount="indefinite"/></g>`;
  }
  if (layer === 'deskBack') {
    if (e.mic >= 1) {
      if (e.mic === 1) out += `<g><rect x="104" y="214" width="16" height="14" rx="2" fill="#374151" ${S1}/><rect x="108" y="192" width="8" height="24" rx="4" fill="#6b7280" ${S1}/><path d="M108 200 L116 200 M108 206 L116 206" stroke="#9ca3af" stroke-width="1"/></g>`;
      else out += `<g><path d="M70 228 L80 150 L158 168" stroke="#111827" stroke-width="4" fill="none" stroke-linejoin="round"/><path d="M70 228 L80 150 L158 168" stroke="#4b5563" stroke-width="1.6" fill="none"/><rect x="64" y="222" width="14" height="8" rx="2" fill="#111827"/><g transform="translate(160 172) rotate(20)"><rect x="-7" y="-4" width="14" height="30" rx="7" fill="${e.mic === 3 ? '#111827' : '#d1d5db'}" ${S1}/>${e.mic === 3 ? '<rect x="-7" y="8" width="14" height="3" fill="#d4af37"/>' : '<path d="M-6 4 L6 4 M-6 8 L6 8 M-6 12 L6 12" stroke="#6b7280" stroke-width="1"/>'}</g>${e.mic >= 2 ? `<circle cx="144" cy="184" r="9" fill="#111827" opacity=".35" ${S1}/>` : ''}</g>`;
      if (e.mic === 3 && s.house < 3) out += `<g transform="translate(250 18)"><rect x="-26" y="-9" width="52" height="18" rx="4" fill="#1f0a0a" ${S1}/><text x="0" y="4" font-size="9" font-family="Fredoka" font-weight="700" text-anchor="middle" fill="#ef4444">ON AIR<animate attributeName="opacity" values="1;.55;1" dur="2s" repeatCount="indefinite"/></text></g>`;
    }
  }
  if (layer === 'deskFront') {
    if (e.rgb >= 1) out += `<path d="M44 256 L356 256" stroke="url(#rgbGrad)" stroke-width="3.4" filter="url(#glow)"/>`;
  }
  if (layer === 'floor') {
    if (e.guest >= 1) {
      out += `<g transform="translate(40 0)"><path d="M-30 270 L50 270 L58 282 L-38 282 Z" fill="#475569" ${S1}/><rect x="-34" y="282" width="6" height="40" fill="#334155"/><rect x="48" y="282" width="6" height="40" fill="#334155"/>${e.guest >= 2 ? `<rect x="-6" y="236" width="38" height="28" rx="2" fill="#0b0f19" ${S1}/><rect x="-3" y="239" width="32" height="22" fill="#1e3a8a"/><rect x="11" y="264" width="4" height="6" fill="#374151"/>` : ''}</g>`;
    }

    if (e.pool >= 3) out += [60, 140, 260, 340].map((x, i) => `<circle cx="${x}" cy="${206 + (i % 2) * 14}" r="4" fill="${['#fde047', '#f472b6', '#22d3ee', '#a78bfa'][i]}" opacity=".85"><animate attributeName="opacity" values=".9;.3;.9" dur="${1.4 + i * 0.3}s" repeatCount="indefinite"/></circle>`).join('');
  }
  return out;
}

const PLAQUE_SPOTS = [
  [[262, 40], [288, 40], [262, 66], [288, 66], [275, 92]],
  [[200, 50], [226, 50], [252, 50], [213, 76], [239, 76]],
  [[222, 84], [248, 84], [274, 84], [196, 84], [300, 84]],
  [[104, 64], [130, 64], [104, 92], [130, 92], [117, 38]],
  [[36, 128], [36, 160], [36, 192], [24, 224], [48, 224]],
];
function plaques(s) {
  const kinds = ['silver', 'gold', 'diamond', 'ruby', 'legend'];
  const got = Math.min(5, s.plaques || 0);
  let out = '';
  if (s.house === 4) {
    out += `<g><rect x="6" y="104" width="60" height="142" rx="4" fill="#f8fafc" ${S}/><rect x="12" y="110" width="48" height="130" rx="2" fill="#dbeafe" opacity=".6"/>${[136, 168, 200, 232].map(y => `<rect x="12" y="${y}" width="48" height="3" fill="#d4af37"/>`).join('')}${trophy(52, 136)}${trophy(52, 168, '#e5e7eb')}<path d="M16 116 L30 140" stroke="#fff" stroke-width="3" opacity=".5"/></g>`;
  }
  const spots = PLAQUE_SPOTS[s.house];
  for (let i = 0; i < got; i++) out += plaque(spots[i][0], spots[i][1], kinds[i]);
  return out;
}

function snacks(house) {
  return `<g><rect x="84" y="214" width="9" height="16" rx="2" fill="#22c55e" ${S1}/><rect x="84" y="217" width="9" height="4" fill="#15803d"/><ellipse cx="114" cy="236" rx="14" ry="4.4" fill="#f8fafc" ${S1}/>${[0, 1, 2].map(i => `<circle cx="${108 + i * 6}" cy="${233 - (i % 2)}" r="3.4" fill="#d6a565" ${S1}/>`).join('')}</g>`;
}

export function petSVG(kind, x, y) {
  switch (kind) {
    case 'cat': return `<g class="pet" transform="translate(${x} ${y})"><path class="tail" d="M14 -4 C26 -6 28 -18 22 -24" stroke="${O}" stroke-width="6" fill="none" stroke-linecap="round"/><path class="tail" d="M14 -4 C26 -6 28 -18 22 -24" stroke="#fb923c" stroke-width="3.6" fill="none" stroke-linecap="round"/><ellipse cx="2" cy="-8" rx="16" ry="10" fill="#fb923c" ${S1}/><circle cx="-12" cy="-20" r="9" fill="#fb923c" ${S1}/><path d="M-19 -26 L-20 -34 L-13 -28 Z M-6 -27 L-4 -34 L-9 -28 Z" fill="#fb923c" ${S1}/><path d="M-16 -21 q2 -2 4 0 M-10 -21 q2 -2 4 0" stroke="${O}" stroke-width="1.4" fill="none"/><path d="M-12 -17 l-1.4 1.4 M-12 -17 l1.4 1.4" stroke="${O}" stroke-width="1"/><path d="M-4 -10 l4 0 M6 -12 l4 0" stroke="#ea580c" stroke-width="2"/></g>`;
    case 'dog': return `<g class="pet" transform="translate(${x} ${y})"><path class="tail" d="M16 -10 q10 -6 8 -14" stroke="#c08a5b" stroke-width="5" fill="none" stroke-linecap="round"/><ellipse cx="4" cy="-8" rx="16" ry="11" fill="#e2b98b" ${S1}/><circle cx="-12" cy="-20" r="11" fill="#e2b98b" ${S1}/><ellipse cx="-12" cy="-15" rx="6" ry="4.5" fill="#5b3a29"/><ellipse cx="-22" cy="-20" rx="4" ry="7" fill="#5b3a29" ${S1}/><ellipse cx="-2" cy="-20" rx="4" ry="7" fill="#5b3a29" ${S1}/><circle cx="-15" cy="-22" r="1.6" fill="${O}"/><circle cx="-9" cy="-22" r="1.6" fill="${O}"/><path d="M-12 -12 q0 4 2 5" stroke="#f472b6" stroke-width="2.4" stroke-linecap="round"/></g>`;
    case 'hamster': return `<g class="pet" transform="translate(${x} ${y})"><ellipse cx="0" cy="-8" rx="11" ry="9" fill="#f5c78e" ${S1}/><ellipse cx="2" cy="-5" rx="6" ry="5" fill="#fff4e0"/><circle cx="-7" cy="-16" r="3" fill="#f5c78e" ${S1}/><circle cx="5" cy="-16" r="3" fill="#f5c78e" ${S1}/><circle cx="-3" cy="-10" r="1.3" fill="${O}"/><circle cx="3" cy="-10" r="1.3" fill="${O}"/><circle cx="0" cy="-7" r="1" fill="#f472b6"/></g>`;
    case 'parrot': return `<g class="pet" transform="translate(${x} ${y})"><path class="tail" d="M2 0 L6 18 L-2 16 Z" fill="#2563eb" ${S1}/><ellipse cx="0" cy="-8" rx="8" ry="12" fill="#22c55e" ${S1}/><circle cx="0" cy="-20" r="7" fill="#ef4444" ${S1}/><path d="M5 -20 q6 2 2 6 Z" fill="#fbbf24" ${S1}/><circle cx="2" cy="-22" r="1.4" fill="${O}"/><path d="M-6 -8 q-4 6 2 10" stroke="#16a34a" stroke-width="3" fill="none"/></g>`;
    case 'penguin': return `<g class="pet" transform="translate(${x} ${y})"><path class="tail" d="M10 -4 L18 -2 L12 2 Z" fill="#1f2937" ${S1}/><ellipse cx="0" cy="-12" rx="12" ry="14" fill="#1f2937" ${S1}/><ellipse cx="0" cy="-9" rx="8" ry="10" fill="#f8fafc"/><circle cx="0" cy="-27" r="9" fill="#1f2937" ${S1}/><ellipse cx="0" cy="-25" rx="6" ry="5" fill="#f8fafc"/><circle cx="-2.6" cy="-27" r="1.3" fill="${O}"/><circle cx="2.6" cy="-27" r="1.3" fill="${O}"/><path d="M-2.6 -23.5 L2.6 -23.5 L0 -20.5 Z" fill="#f59e0b" ${S1}/><path d="M-11 -14 q-6 6 -2 12 M11 -14 q6 6 2 12" stroke="#1f2937" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M-7 1 l-4 1 M7 1 l4 1" stroke="#f59e0b" stroke-width="3" stroke-linecap="round"/><path d="M-7 -33 q7 -5 14 0" stroke="#ef4444" stroke-width="3" fill="none" stroke-linecap="round"/></g>`;
    case 'robot': return `<g class="pet" transform="translate(${x} ${y})"><ellipse cx="0" cy="0" rx="13" ry="3" fill="#000" opacity=".2"/><rect x="-10" y="-16" width="20" height="14" rx="4" fill="#cbd5e1" ${S1}/><rect x="-5" y="-12" width="10" height="5" rx="1.5" fill="#22d3ee" class="rgb-led"/><rect x="-11" y="-34" width="22" height="16" rx="5" fill="#e2e8f0" ${S1}/><rect x="-8" y="-31" width="16" height="10" rx="3" fill="#0f172a"/><circle cx="-3.5" cy="-26" r="2" fill="#22d3ee" class="rgb-led"/><circle cx="3.5" cy="-26" r="2" fill="#22d3ee" class="rgb-led"/><path d="M0 -34 L0 -40" stroke="${O}" stroke-width="1.6"/><circle class="tail" cx="0" cy="-41" r="2.6" fill="#f472b6" ${S1}/><path d="M-10 -10 l-5 4 M10 -10 l5 4" stroke="#94a3b8" stroke-width="3" stroke-linecap="round"/><rect x="-8" y="-3" width="5" height="4" rx="1" fill="#64748b"/><rect x="3" y="-3" width="5" height="4" rx="1" fill="#64748b"/></g>`;
    case 'dragon': return `<g class="pet" transform="translate(${x} ${y})"><path class="tail" d="M12 -6 C24 -4 28 -14 24 -20 L30 -20 L26 -14" stroke="#7c3aed" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><g class="wing"><path d="M2 -18 C6 -36 22 -38 26 -30 C20 -30 18 -26 18 -22 C14 -24 10 -22 8 -18 Z" fill="#c4b5fd" ${S1}/></g><ellipse cx="2" cy="-9" rx="13" ry="10" fill="#8b5cf6" ${S1}/><ellipse cx="2" cy="-6" rx="7" ry="5" fill="#fde68a"/><circle cx="-11" cy="-21" r="9" fill="#8b5cf6" ${S1}/><path d="M-16 -28 L-18 -35 L-12 -30 Z M-8 -29 L-6 -36 L-4 -29 Z" fill="#fbbf24" ${S1}/><circle cx="-14" cy="-22" r="1.6" fill="${O}"/><circle cx="-8" cy="-22" r="1.6" fill="${O}"/><path d="M-15 -16 q4 3 8 0" stroke="${O}" stroke-width="1.2" fill="none"/><path d="M-20 -18 q-4 -2 -6 0" stroke="#fb923c" stroke-width="2" fill="none" stroke-linecap="round" class="rgb-led"/></g>`;
  }
  return '';
}

// Room themes (premium cosmetics): an animated overlay over the walls, pointer-events off.
function rnd01(i) { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
export function themeOverlay(kind) {
  const P = (n, f) => Array.from({ length: n }, (_, i) => f(i, rnd01(i + 1), rnd01(i + 77)));
  switch (kind) {
    case 'sakura': return `<g class="theme" pointer-events="none"><rect width="${W}" height="250" fill="#fbcfe8" opacity=".18"/>${P(24, (i, a, b) => `<path d="M0 -6 C5 -6 6 0 0 6 C-6 0 -5 -6 0 -6 Z" fill="${i % 3 ? '#f472b6' : '#fbcfe8'}" stroke="#be185d" stroke-width=".6" opacity=".95"><animateTransform attributeName="transform" type="translate" values="${(a * 420).toFixed(0)} -10; ${(a * 420 - 40).toFixed(0)} 260" dur="${(7 + b * 6).toFixed(1)}s" begin="-${(b * 12).toFixed(1)}s" repeatCount="indefinite"/></path>`).join('')}</g>`;
    case 'snow': return `<g class="theme" pointer-events="none"><rect width="${W}" height="60" fill="url(#frost)" opacity=".5"/>${P(26, (i, a, b) => `<circle r="${(1.2 + b * 2).toFixed(1)}" fill="#fff" opacity=".85"><animateTransform attributeName="transform" type="translate" values="${(a * 400).toFixed(0)} -6; ${(a * 400 + 18).toFixed(0)} 256" dur="${(6 + b * 7).toFixed(1)}s" begin="-${(a * 13).toFixed(1)}s" repeatCount="indefinite"/></circle>`).join('')}</g>`;
    case 'neoncity': return `<g class="theme" pointer-events="none"><rect width="${W}" height="250" fill="#4c1d95" opacity=".14"/><path d="M0 238 L30 238 L30 206 L52 206 L52 222 L74 222 L74 196 L96 196 L96 238 M304 238 L304 200 L326 200 L326 214 L350 214 L350 186 L374 186 L374 238 L400 238" fill="none" stroke="#f472b6" stroke-width="2.4" filter="url(#glow)" opacity=".9"><animate attributeName="opacity" values=".9;.5;.9" dur="2.4s" repeatCount="indefinite"/></path><path d="M6 12 L394 12" stroke="#22d3ee" stroke-width="3" filter="url(#glow)" opacity=".8"/><path d="M6 12 L394 12" stroke="#a5f3fc" stroke-width="1.2"/></g>`;
    case 'galaxy': return `<g class="theme" pointer-events="none"><rect width="${W}" height="250" fill="#1e1b4b" opacity=".45"/><ellipse cx="90" cy="70" rx="90" ry="40" fill="#a855f7" opacity=".35" filter="url(#soft)"/><ellipse cx="320" cy="120" rx="80" ry="34" fill="#22d3ee" opacity=".25" filter="url(#soft)"/>${P(40, (i, a, b) => `<circle cx="${(a * 400).toFixed(0)}" cy="${(b * 240).toFixed(0)}" r="${(0.9 + rnd01(i + 200) * 1.6).toFixed(1)}" fill="${i % 5 ? '#fff' : '#c4b5fd'}"><animate attributeName="opacity" values="1;.2;1" dur="${(1.6 + b * 2.4).toFixed(1)}s" begin="-${(a * 3).toFixed(1)}s" repeatCount="indefinite"/></circle>`).join('')}<g transform="translate(272 46)"><circle r="9" fill="#fb923c" opacity=".85"/><ellipse rx="15" ry="3.6" fill="none" stroke="#fde68a" stroke-width="1.6" transform="rotate(-18)"/></g></g>`;
    case 'fireworks': return `<g class="theme" pointer-events="none"><rect width="${W}" height="250" fill="#0b1030" opacity=".16"/>${[[70, 60, '#f472b6', 0], [330, 50, '#facc15', 1.1], [200, 30, '#22d3ee', 2.2], [120, 120, '#a78bfa', 3.1]].map(([x, y, c, d]) => `<g transform="translate(${x} ${y})">${Array.from({ length: 10 }, (_, k) => { const an = k * 36 * Math.PI / 180; return `<line x1="0" y1="0" x2="${(Math.cos(an) * 22).toFixed(1)}" y2="${(Math.sin(an) * 22).toFixed(1)}" stroke="${c}" stroke-width="2.4" stroke-linecap="round" opacity="0"><animate attributeName="opacity" values="0;1;0;0" keyTimes="0;.15;.5;1" dur="3.4s" begin="${d}s" repeatCount="indefinite"/></line>`; }).join('')}<circle r="4" fill="#fff" opacity="0"><animate attributeName="opacity" values="0;1;0;0" keyTimes="0;.1;.3;1" dur="3.4s" begin="${d}s" repeatCount="indefinite"/></circle></g>`).join('')}</g>`;
  }
  return '';
}

// Square thumbnail of a room theme: a tiny generic room behind the overlay.
export function themeThumb(kind) {
  return `<svg viewBox="75 0 250 250"><rect x="0" width="${W}" height="250" fill="#6d5fae"/>${wallpaperStripes('#5f519c', 0, W, 0, 200, 22)}<rect x="96" y="40" width="64" height="58" rx="4" fill="#9bd4ff" ${S}/><path d="M128 40 L128 98 M96 69 L160 69" stroke="${O}" stroke-width="2.2"/><rect y="200" width="${W}" height="50" fill="#4a3d7a"/><rect x="150" y="96" width="120" height="74" rx="6" fill="#1f1840" ${S}/><rect x="156" y="102" width="108" height="62" rx="3" fill="#6c5ce7" opacity=".85"/><rect x="120" y="176" width="190" height="12" rx="3" fill="#b07a4f" ${S}/>${themeOverlay(kind)}</svg>`;
}

function petPlacement(s) {
  const pet = s.profile && s.profile.pet;
  if (!pet || pet === 'none') return '';
  if (pet === 'parrot') return petSVG('parrot', 330, s.equip.pc >= 4 ? 128 : 146);
  if (pet === 'hamster') return petSVG('hamster', 126, 228);
  if (s.house === 0 && pet === 'cat') return petSVG('cat', 50, 240);
  return petSVG(pet, 372, 330);
}

export const ROOM_DEFS = `
<defs>
  <linearGradient id="rgbGrad" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#ff3b8d"><animate attributeName="stop-color" values="#ff3b8d;#a855f7;#22d3ee;#4ade80;#facc15;#ff3b8d" dur="4s" repeatCount="indefinite"/></stop>
    <stop offset=".5" stop-color="#22d3ee"><animate attributeName="stop-color" values="#22d3ee;#4ade80;#facc15;#ff3b8d;#a855f7;#22d3ee" dur="4s" repeatCount="indefinite"/></stop>
    <stop offset="1" stop-color="#a855f7"><animate attributeName="stop-color" values="#a855f7;#22d3ee;#4ade80;#facc15;#ff3b8d;#a855f7" dur="4s" repeatCount="indefinite"/></stop>
  </linearGradient>
  <radialGradient id="lampGlow"><stop offset="0" stop-color="#fff3b0" stop-opacity=".55"/><stop offset="1" stop-color="#fff3b0" stop-opacity="0"/></radialGradient>
  <radialGradient id="softGlow" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fde68a" stop-opacity=".2"/></radialGradient>
  <radialGradient id="vignette" cx=".5" cy=".45" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></radialGradient>
  <radialGradient id="crtGlass" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".12"/><stop offset=".7" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></radialGradient>
  <pattern id="mesh" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="#374151"/><path d="M0 0 L4 4 M4 0 L0 4" stroke="#6b7280" stroke-width=".6"/></pattern>
  <linearGradient id="frost" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e0f2fe"/><stop offset="1" stop-color="#e0f2fe" stop-opacity="0"/></linearGradient>
  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.4"/></filter>
  <filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6"/></filter>
</defs>`;

// Full room. Returns SVG inner markup split in two: below and above the live canvas.
export function roomSVG(s, opts = {}) {
  const phase = opts.phase || skyPhase();
  const house = s.house;
  const eq = s.equip;
  const avatar = s.profile.avatar;
  const cx = 196;
  const back = avatarBack(avatar, cx, 252);
  const marketColor = opts.marketColor || '#6c5ce7';
  const skyId = 'sky';
  const neon = house >= 3 ? neonSign(162, house === 4 ? 28 : 32, (s.profile.channel || 'LIVE').slice(0, 16), NEON_COL[(s.profile.neonColor || 0) % NEON_COL.length], (s.extras || {}).mic >= 3) : '';
  const below = `
    <defs>${skyGrad(skyId, phase)}${skyGrad('skyM', phase === 'night' ? 'night' : phase === 'day' ? 'day' : 'dusk')}</defs>
    <g class="house">${HOUSE_FN[house](phase)}</g>
    ${themeOverlay(s.profile.theme)}
    ${house <= 1 ? lampCord(house === 0 ? 226 : 100, phase) : ''}
    ${neon}
    ${plaques(s)}
    ${extras(s, 'wall')}
    <ellipse cx="200" cy="160" rx="120" ry="70" fill="${marketColor}" opacity="${phase === 'night' ? 0.35 : 0.18}" filter="url(#soft)" class="screen-glow"/>
    ${eq.webcam >= 5 ? softbox(78, false) + softbox(322, true) : ''}
    ${desk(house)}
    ${extras(s, 'deskBack')}
    ${monitor(eq.monitor)}
  `;
  const above = `
    ${monitorOverlay(eq.monitor)}
    ${webcam(eq.webcam, eq.monitor)}
    ${pc(eq.pc)}
    ${snacks(house)}
    ${mousepad(eq.mousepad)}
    ${keyboard(eq.pc)}
    ${mouse(eq.mouse)}
    ${extras(s, 'deskFront')}
    ${extras(s, 'floor')}
    <g class="streamer">
      ${back.torso}
      ${chairBack(eq.chair, cx)}
      ${back.armR}
      ${back.head}
    </g>
    ${petPlacement(s)}
    ${phase === 'night' && house < 2 ? `<rect width="${W}" height="${H}" fill="#0b1030" opacity=".18" pointer-events="none"/>` : ''}
  `;
  return { below, above };
}

// Small equipment icons for the shop cards (re-uses the same drawings).
export function equipIconSVG(id, lv) {
  const vb = {
    pc: [282, 120, 112, 116], monitor: [96, 40, 208, 192], mouse: [252, 222, 30, 28], mousepad: [40, 222, 320, 30],
    chair: [140, 236, 112, 104], webcam: [80, 96, 140, 136],
  }[id];
  let body = '';
  const fake = { equip: { monitor: 3 }, extras: {} };
  if (id === 'pc') body = pc(lv);
  if (id === 'monitor') body = monitor(lv) + `<rect x="${SCREENS[lv - 1].x}" y="${SCREENS[lv - 1].y}" width="${SCREENS[lv - 1].w}" height="${SCREENS[lv - 1].h}" fill="url(#scrG)"/>` + monitorOverlay(lv);
  if (id === 'mouse') body = `<rect x="252" y="228" width="28" height="17" rx="4" fill="#ffffff" opacity=".08"/>` + mouse(lv).replace(/<path d="M\d+ \d+ C[^"]*" stroke="#[0-9a-f]+" stroke-width="1\.[46]" fill="none"\/>/, '');
  if (id === 'mousepad') body = mousepad(lv);
  if (id === 'chair') body = chairBack(lv, 196);
  if (id === 'webcam') body = lv >= 4 ? webcam(4, 3) : webcam(lv, 3);
  let v = vb;
  if (id === 'webcam' && lv < 4) v = [176, 89, 48, 30]; // centered on the cam at x=200
  if (id === 'webcam' && lv >= 4) v = [76, 166, 56, 66];
  if (id === 'mouse') v = [250, 226, 32, 21];
  if (id === 'mousepad' && lv <= 3) v = [222, 222, 90, 28];
  if (id === 'mousepad' && lv === 4) v = [196, 224, 136, 26];
  if (id === 'monitor' && lv === 5) v = [96, 40, 208, 192];
  if (id === 'monitor' && lv === 1) v = [128, 106, 146, 126];
  if (id === 'monitor' && lv === 2) v = [140, 120, 120, 110];
  if (id === 'pc' && lv === 5) v = [282, 120, 112, 116];
  return `<svg viewBox="${v.join(' ')}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="scrG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6c5ce7"/><stop offset="1" stop-color="#00cec9"/></linearGradient></defs>${ROOM_DEFS}${body}</svg>`;
}
