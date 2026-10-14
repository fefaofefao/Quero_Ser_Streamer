// Vector avatar generator. Everything is SVG markup built from parameters so
// it stays crisp at any size. Two views: front bust (facecam, creator, fans)
// and back view (sitting at the desk in the room).

export const SKINS = ['#ffe0c7', '#f7cba4', '#eab38a', '#d49a6a', '#b97c50', '#94603d', '#73472b', '#4f2f1e'];
export const HAIR_COLORS = [
  '#2b1d16', '#5a3825', '#8b5a2b', '#d9a441', '#e8d3a3', '#b8442f', // natural
  '#ff4fa3', '#34d1ff', '#7cf55a', '#b46bff', '#ff8a1f', '#f4f4ff', // neon (unlockable)
];
export const CLOTH_COLORS = ['#e74c3c', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#111827', '#f8fafc', '#14b8a6', '#64748b'];
export const HAIR_STYLES = ['short', 'buzz', 'curly', 'long', 'spiky', 'mohawk', 'bun', 'afro', 'ponytail', 'undercut', 'braids', 'bob'];
export const OUTFITS = ['tee', 'tank', 'sweater', 'hoodie', 'jersey', 'jacket', 'suit', 'cape'];
export const HATS = ['none', 'headset', 'cap', 'capback', 'beanie', 'catset', 'bandana', 'crown'];
export const GLASSES = ['none', 'round', 'square', 'sun', 'star'];
export const NECKS = ['none', 'chain', 'medal', 'scarf'];
export const BODIES = ['slim', 'regular', 'broad'];
export const EXPRESSIONS = ['neutral', 'happy', 'excited', 'wow', 'rage', 'sleepy', 'laugh'];

const OUTLINE = '#2a1f3d';

export function shade(hex, amt) {
  // amt < 0 darkens, > 0 lightens
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const f = (c) => Math.max(0, Math.min(255, Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)));
  r = f(r); g = f(g); b = f(b);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

let uidN = 0;
const uid = (p) => `${p}${(++uidN).toString(36)}`;

export function defaultAvatar() {
  return { skin: 1, body: 1, hair: 0, hairColor: 1, outfit: 0, outfitColor: 1, hat: 'none', glasses: 'none', neck: 'none' };
}

export function randomAvatar(rnd = Math.random) {
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  return {
    skin: Math.floor(rnd() * SKINS.length),
    body: Math.floor(rnd() * 3),
    hair: Math.floor(rnd() * HAIR_STYLES.length),
    hairColor: Math.floor(rnd() * (rnd() < 0.85 ? 6 : 12)),
    outfit: Math.floor(rnd() * 6),
    outfitColor: Math.floor(rnd() * CLOTH_COLORS.length),
    hat: rnd() < 0.3 ? pick(['cap', 'capback', 'beanie', 'bandana', 'headset']) : 'none',
    glasses: rnd() < 0.25 ? pick(['round', 'square', 'sun']) : 'none',
    neck: 'none',
  };
}

// ---------- FRONT VIEW (viewBox 0 0 120 120) ----------
// Head center (60,52), head ~ 64 x 60.

function hairBackFront(style, c, d) {
  switch (style) {
    case 'long': return `<path d="M24 50 C22 22 98 22 96 50 L100 104 C90 110 80 104 78 96 L42 96 C40 104 30 110 20 104 Z" fill="${c}" stroke="${OUTLINE}" stroke-width="2.4" stroke-linejoin="round"/>`;
    case 'bob': return `<path d="M24 52 C20 20 100 20 96 52 L98 82 C92 90 84 88 82 84 L38 84 C36 88 28 90 22 82 Z" fill="${c}" stroke="${OUTLINE}" stroke-width="2.4" stroke-linejoin="round"/>`;
    case 'afro': return `<g fill="${c}" stroke="${OUTLINE}" stroke-width="2.4">${[[60, 30, 36], [32, 44, 20], [88, 44, 20], [30, 64, 15], [90, 64, 15]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g><g fill="${c}">${[[60, 32, 33], [34, 46, 17], [86, 46, 17]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>`;
    case 'braids': return `<g fill="${c}" stroke="${OUTLINE}" stroke-width="2.2">${[0, 1, 2, 3].map(i => `<ellipse cx="${26 - i}" cy="${70 + i * 10}" rx="6.5" ry="6"/><ellipse cx="${94 + i}" cy="${70 + i * 10}" rx="6.5" ry="6"/>`).join('')}</g>`;
    case 'ponytail': return `<path d="M88 34 C112 30 116 62 104 86 C100 70 96 58 86 50 Z" fill="${c}" stroke="${OUTLINE}" stroke-width="2.4" stroke-linejoin="round"/>`;
    case 'curly': return `<g fill="${c}" stroke="${OUTLINE}" stroke-width="2.2">${[[30, 46], [26, 60], [90, 46], [94, 60]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9"/>`).join('')}</g>`;
    default: return '';
  }
}

function hairFrontFront(style, c, d) {
  const hl = shade(c, 0.35);
  const s = `stroke="${OUTLINE}" stroke-width="2.4" stroke-linejoin="round"`;
  switch (style) {
    case 'short': return `<path d="M27 50 C24 20 52 14 66 18 C86 20 98 34 93 52 C88 40 80 34 70 36 C60 40 46 36 40 32 C36 40 32 44 27 50 Z" fill="${c}" ${s}/><path d="M48 24 C58 20 72 21 80 27" stroke="${hl}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>`;
    case 'buzz': return `<path d="M28 48 C26 22 94 22 92 48 C84 36 72 31 60 31 C48 31 36 36 28 48 Z" fill="${c}" ${s} opacity=".95"/>`;
    case 'curly': return `<g fill="${c}" ${s}>${[[34, 34], [46, 24], [60, 21], [74, 24], [86, 34], [40, 42], [80, 42]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="11"/>`).join('')}</g><g fill="${c}">${[[46, 30], [60, 28], [74, 30], [60, 38]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10"/>`).join('')}</g><g fill="${hl}" opacity=".55">${[[44, 22], [58, 18], [72, 22]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3"/>`).join('')}</g>`;
    case 'long': return `<path d="M26 54 C22 18 98 18 94 54 C90 40 82 32 70 30 C64 40 50 44 38 42 C32 46 28 50 26 54 Z" fill="${c}" ${s}/><path d="M44 26 C56 21 70 22 80 28" stroke="${hl}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>`;
    case 'spiky': return `<path d="M26 52 L20 34 L34 36 L30 16 L46 26 L52 6 L62 22 L74 6 L78 26 L94 14 L90 34 L102 34 L94 52 C88 40 78 34 66 36 C56 38 42 36 26 52 Z" fill="${c}" ${s}/>`;
    case 'mohawk': return `<path d="M30 46 C28 30 92 30 90 46 C82 38 38 38 30 46 Z" fill="${shade(c, -0.25)}" ${s} opacity=".6"/><path d="M50 36 L46 10 L56 18 L60 2 L66 18 L74 10 L70 36 Z" fill="${c}" ${s}/>`;
    case 'bun': return `<circle cx="60" cy="14" r="12" fill="${c}" ${s}/><path d="M26 52 C24 22 96 22 94 52 C88 38 74 32 60 32 C46 32 32 38 26 52 Z" fill="${c}" ${s}/>`;
    case 'afro': return '';
    case 'ponytail': return `<path d="M26 52 C24 22 96 22 94 52 C86 40 74 34 62 36 C50 34 34 40 26 52 Z" fill="${c}" ${s}/><path d="M86 30 C94 30 98 36 96 40" stroke="${shade(c, -0.3)}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    case 'undercut': return `<path d="M28 50 C26 30 36 22 50 20 C66 16 92 18 98 40 C86 34 74 36 66 44 C60 40 50 38 40 40 C34 42 30 46 28 50 Z" fill="${c}" ${s}/><path d="M28 50 C27 44 30 40 34 38" stroke="${shade(c, -0.2)}" stroke-width="5" fill="none" opacity=".5"/>`;
    case 'braids': return `<path d="M26 54 C22 20 98 20 94 54 C86 42 72 30 60 32 C48 30 34 42 26 54 Z" fill="${c}" ${s}/><path d="M60 22 L60 34" stroke="${shade(c, -0.3)}" stroke-width="2"/>`;
    case 'bob': return `<path d="M24 56 C20 20 100 20 96 56 C92 44 86 36 78 34 C66 40 50 40 40 34 C32 38 26 46 24 56 Z" fill="${c}" ${s}/><path d="M42 26 C54 21 68 21 80 27" stroke="${hl}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>`;
  }
  return '';
}

function eyes(expr, x1 = 46, x2 = 74, y = 56) {
  const eye = (x) => {
    switch (expr) {
      case 'happy': return `<path d="M${x - 6} ${y + 1} Q${x} ${y - 7} ${x + 6} ${y + 1}" stroke="${OUTLINE}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      case 'laugh': return `<path d="M${x - 6} ${y} L${x + 3} ${y - 3} M${x - 6} ${y} L${x + 3} ${y + 3}" stroke="${OUTLINE}" stroke-width="3" fill="none" stroke-linecap="round" transform="${x > 60 ? `translate(${2 * x},0) scale(-1,1)` : ''}"/>`;
      case 'sleepy': return `<path d="M${x - 6} ${y} Q${x} ${y + 4} ${x + 6} ${y}" stroke="${OUTLINE}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      case 'excited': return `<path d="M${x} ${y - 8} L${x + 2.4} ${y - 2.4} L${x + 8} ${y - 1.5} L${x + 3.6} ${y + 2.2} L${x + 5} ${y + 8} L${x} ${y + 4.8} L${x - 5} ${y + 8} L${x - 3.6} ${y + 2.2} L${x - 8} ${y - 1.5} L${x - 2.4} ${y - 2.4} Z" fill="#ffd23f" stroke="${OUTLINE}" stroke-width="1.8" stroke-linejoin="round"/>`;
      case 'wow': return `<ellipse cx="${x}" cy="${y}" rx="5.6" ry="7.2" fill="#fff" stroke="${OUTLINE}" stroke-width="2.2"/><circle cx="${x}" cy="${y + 0.5}" r="2.6" fill="${OUTLINE}"/>`;
      case 'rage': return `<ellipse cx="${x}" cy="${y + 1}" rx="4.6" ry="5.4" fill="${OUTLINE}"/><circle cx="${x + 1.4}" cy="${y - 1}" r="1.5" fill="#fff"/>`;
      default: return `<ellipse cx="${x}" cy="${y}" rx="4.8" ry="6.2" fill="${OUTLINE}"/><circle cx="${x + 1.6}" cy="${y - 2.2}" r="1.9" fill="#fff"/><circle cx="${x - 1.6}" cy="${y + 2.4}" r=".9" fill="#fff" opacity=".8"/>`;
    }
  };
  let brows = '';
  if (expr === 'rage') brows = `<path d="M${x1 - 7} ${y - 12} L${x1 + 5} ${y - 7} M${x2 + 7} ${y - 12} L${x2 - 5} ${y - 7}" stroke="${OUTLINE}" stroke-width="3" stroke-linecap="round"/>`;
  else if (expr === 'wow') brows = `<path d="M${x1 - 6} ${y - 14} Q${x1} ${y - 18} ${x1 + 6} ${y - 14} M${x2 - 6} ${y - 14} Q${x2} ${y - 18} ${x2 + 6} ${y - 14}" stroke="${OUTLINE}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  else if (expr !== 'sleepy') brows = `<path d="M${x1 - 6} ${y - 11} Q${x1} ${y - 14} ${x1 + 6} ${y - 11} M${x2 - 6} ${y - 11} Q${x2} ${y - 14} ${x2 + 6} ${y - 11}" stroke="${OUTLINE}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".8"/>`;
  return `<g class="av-eyes">${eye(x1)}${eye(x2)}</g>${brows}`;
}

function mouth(expr) {
  switch (expr) {
    case 'happy': return `<path d="M52 70 Q60 78 68 70" stroke="${OUTLINE}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
    case 'laugh':
    case 'excited': return `<path d="M50 68 Q60 84 70 68 Z" fill="#7a1f3d" stroke="${OUTLINE}" stroke-width="2.4" stroke-linejoin="round"/><path d="M54 75 Q60 79 66 75" fill="#ff7a9a"/>`;
    case 'wow': return `<ellipse cx="60" cy="73" rx="4.5" ry="5.5" fill="#7a1f3d" stroke="${OUTLINE}" stroke-width="2.2"/>`;
    case 'rage': return `<path d="M51 74 Q60 66 69 74" stroke="${OUTLINE}" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M53 73 L67 73" stroke="#fff" stroke-width="2"/>`;
    case 'sleepy': return `<ellipse cx="60" cy="72" rx="3" ry="2.4" fill="#7a1f3d"/>`;
    default: return `<path d="M54 70 Q60 74 66 70" stroke="${OUTLINE}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  }
}

function torsoFront(a, w) {
  const col = CLOTH_COLORS[a.outfitColor % CLOTH_COLORS.length];
  const dk = shade(col, -0.25), lt = shade(col, 0.25);
  const skin = SKINS[a.skin];
  const L = 60 - w, R = 60 + w;
  const base = `M${L} 120 L${L + 2} 100 C${L + 4} 90 ${L + 14} 86 ${50} 84 L70 84 C${R - 14} 86 ${R - 4} 90 ${R - 2} 100 L${R} 120 Z`;
  const s = `stroke="${OUTLINE}" stroke-width="2.4" stroke-linejoin="round"`;
  let out = `<path d="${base}" fill="${col}" ${s}/>`;
  switch (OUTFITS[a.outfit]) {
    case 'tee': out += `<path d="M50 84 Q60 94 70 84" fill="${skin}" ${s}/><path d="M${L + 8} 104 L${L + 10} 120 M${R - 8} 104 L${R - 10} 120" stroke="${dk}" stroke-width="2" opacity=".6"/>`; break;
    case 'tank': out = `<path d="${base}" fill="${skin}" ${s}/><path d="M${L + 10} 120 L${L + 12} 96 L50 86 Q60 100 70 86 L${R - 12} 96 L${R - 10} 120 Z" fill="${col}" ${s}/>`; break;
    case 'sweater': out += `<path d="M48 84 Q60 92 72 84 L72 88 Q60 97 48 88 Z" fill="${dk}" ${s}/>` + [0, 1, 2].map(r => `<path d="M${L + 6} ${101 + r * 7} ${Array.from({ length: Math.floor((R - L - 12) / 6) }, (_, i) => `l3 ${i % 2 ? 3 : -3} l3 ${i % 2 ? -3 : 3}`).join(' ')}" stroke="${lt}" stroke-width="1.6" fill="none" opacity=".8"/>`).join('') + `<path d="M56 106 l4 -4 l4 4 l-4 4 z" fill="#ffd23f" opacity=".85"/>`; break;
    case 'hoodie': out += `<path d="M40 88 C44 80 76 80 80 88 C74 96 46 96 40 88 Z" fill="${dk}" ${s}/><path d="M54 92 L53 106 M66 92 L67 106" stroke="#f1f1f1" stroke-width="2" stroke-linecap="round"/><circle cx="53" cy="107" r="1.8" fill="#f1f1f1"/><circle cx="67" cy="107" r="1.8" fill="#f1f1f1"/><path d="M48 112 L72 112 L70 120 L50 120 Z" fill="${dk}" opacity=".5"/>`; break;
    case 'jersey': out += `<path d="M50 84 L60 94 L70 84" fill="none" stroke="#fff" stroke-width="3"/><path d="M${L + 3} 104 L${R - 3} 104" stroke="#fff" stroke-width="4" opacity=".85"/><text x="60" y="119" font-family="Fredoka, sans-serif" font-weight="700" font-size="13" text-anchor="middle" fill="#fff">1</text>`; break;
    case 'jacket': out += `<path d="M50 84 L46 120 M70 84 L74 120" stroke="${OUTLINE}" stroke-width="2"/><path d="M50 84 L58 98 L60 120 L62 98 L70 84 Z" fill="#111827" ${s}/><path d="M50 84 L44 92 L50 100 Z M70 84 L76 92 L70 100 Z" fill="${lt}" ${s}/><path d="M${R - 16} 104 l2.5 5 5.5 .8 -4 3.9 1 5.5 -5 -2.6 -5 2.6 1 -5.5 -4 -3.9 5.5 -.8 z" fill="#ffd23f" stroke="${OUTLINE}" stroke-width="1.2"/>`; break;
    case 'suit': out += `<path d="M52 84 L60 104 L68 84 Z" fill="#fff" ${s}/><path d="M57 88 L60 92 L63 88 L61 104 L60 106 L59 104 Z" fill="#e11d48"/><path d="M50 84 L56 106 L52 120 M70 84 L64 106 L68 120" stroke="${OUTLINE}" stroke-width="2" fill="none"/>`; break;
    case 'cape': out = `<path d="M${L - 6} 120 C${L - 4} 98 ${L + 6} 86 50 84 L70 84 C${R - 6} 86 ${R + 4} 98 ${R + 6} 120 Z" fill="#7c3aed" ${s}/><path d="${base}" fill="${col}" ${s}/><path d="M50 84 Q60 94 70 84" fill="${skin}" ${s}/><path d="M60 98 l4 6 -4 6 -4 -6 z" fill="#ffd23f" stroke="${OUTLINE}" stroke-width="1.4"/>`; break;
  }
  return out;
}

function neckAcc(kind) {
  switch (kind) {
    case 'chain': return `<path d="M48 86 Q60 104 72 86" stroke="#f5c542" stroke-width="2.6" fill="none" stroke-dasharray="3 1.5"/><circle cx="60" cy="98" r="3.4" fill="#f5c542" stroke="${OUTLINE}" stroke-width="1.2"/>`;
    case 'medal': return `<path d="M52 84 L58 100 M68 84 L62 100" stroke="#3b82f6" stroke-width="3.5"/><circle cx="60" cy="104" r="6" fill="#f5c542" stroke="${OUTLINE}" stroke-width="1.6"/><text x="60" y="107.5" font-size="8" text-anchor="middle" font-family="Fredoka" font-weight="700" fill="#8a5a00">1</text>`;
    case 'scarf': return `<path d="M44 86 C52 92 68 92 76 86 L76 92 C68 98 52 98 44 92 Z" fill="#ef4444" stroke="${OUTLINE}" stroke-width="2"/><path d="M68 92 L72 112 L64 112 L62 94 Z" fill="#ef4444" stroke="${OUTLINE}" stroke-width="2"/>`;
  }
  return '';
}

function hatFront(kind, hairC) {
  const s = `stroke="${OUTLINE}" stroke-width="2.4" stroke-linejoin="round"`;
  switch (kind) {
    case 'headset': return `<path d="M24 54 C22 14 98 14 96 54" stroke="#1f2937" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M24 54 C22 14 98 14 96 54" stroke="#4b5563" stroke-width="2.4" fill="none" stroke-linecap="round"/><rect x="16" y="46" width="13" height="22" rx="6" fill="#111827" ${s}/><rect x="91" y="46" width="13" height="22" rx="6" fill="#111827" ${s}/><rect x="18" y="50" width="4" height="14" rx="2" fill="#22d3ee" class="rgb-led"/><rect x="98" y="50" width="4" height="14" rx="2" fill="#22d3ee" class="rgb-led"/><path d="M22 66 C24 78 34 80 44 78" stroke="#111827" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="45" cy="78" r="3" fill="#111827"/>`;
    case 'catset': return `<path d="M30 30 L28 8 L46 22 Z M90 30 L92 8 L74 22 Z" fill="#ff7ab6" ${s}/><path d="M33 26 L32 15 L41 22 Z M87 26 L88 15 L79 22 Z" fill="#ffd1e6"/><path d="M24 54 C22 14 98 14 96 54" stroke="#ff7ab6" stroke-width="6" fill="none" stroke-linecap="round"/><rect x="16" y="46" width="13" height="22" rx="6" fill="#ff7ab6" ${s}/><rect x="91" y="46" width="13" height="22" rx="6" fill="#ff7ab6" ${s}/>`;
    case 'cap': return `<path d="M26 40 C26 12 94 12 94 40 Z" fill="#ef4444" ${s}/><path d="M24 40 C40 34 80 34 108 44 C96 48 70 46 24 44 Z" fill="#b91c1c" ${s}/><circle cx="60" cy="14" r="3" fill="#b91c1c"/><path d="M60 18 l2.4 5 5.4 .8 -3.9 3.8 .9 5.4 -4.8 -2.6 -4.8 2.6 .9 -5.4 -3.9 -3.8 5.4 -.8 z" fill="#fff"/>`;
    case 'capback': return `<path d="M26 40 C26 12 94 12 94 40 Z" fill="#3b82f6" ${s}/><path d="M34 40 C44 37 76 37 86 40" stroke="${OUTLINE}" stroke-width="2" fill="none"/><rect x="52" y="34" width="16" height="7" rx="3" fill="#1d4ed8" ${s}/>`;
    case 'beanie': return `<path d="M24 44 C22 4 98 4 96 44 Z" fill="#f59e0b" ${s}/><rect x="22" y="36" width="76" height="12" rx="6" fill="#d97706" ${s}/><circle cx="60" cy="6" r="7" fill="#fde68a" ${s}/>` + [32, 42, 52, 62, 72, 82].map(x => `<path d="M${x} 38 L${x} 46" stroke="#b45309" stroke-width="2"/>`).join('');
    case 'bandana': return `<path d="M25 40 C30 26 90 26 95 40 L95 46 C80 40 40 40 25 46 Z" fill="#dc2626" ${s}/><circle cx="40" cy="38" r="1.6" fill="#fff"/><circle cx="60" cy="35" r="1.6" fill="#fff"/><circle cx="80" cy="38" r="1.6" fill="#fff"/><path d="M95 42 L106 36 L104 48 Z" fill="#dc2626" ${s}/>`;
    case 'crown': return `<path d="M34 30 L36 8 L48 20 L60 4 L72 20 L84 8 L86 30 Z" fill="#fbbf24" ${s}/><circle cx="60" cy="18" r="3.4" fill="#ef4444"/><circle cx="46" cy="24" r="2.4" fill="#3b82f6"/><circle cx="74" cy="24" r="2.4" fill="#22c55e"/>`;
  }
  return '';
}

function glassesFront(kind) {
  const s = `stroke="${OUTLINE}" stroke-width="2.4"`;
  switch (kind) {
    case 'round': return `<circle cx="46" cy="57" r="9" fill="#bfe9ff" fill-opacity=".25" ${s}/><circle cx="74" cy="57" r="9" fill="#bfe9ff" fill-opacity=".25" ${s}/><path d="M55 57 Q60 54 65 57" ${s} fill="none"/>`;
    case 'square': return `<rect x="36" y="49" width="20" height="15" rx="3" fill="#bfe9ff" fill-opacity=".25" ${s}/><rect x="64" y="49" width="20" height="15" rx="3" fill="#bfe9ff" fill-opacity=".25" ${s}/><path d="M56 55 L64 55" ${s}/>`;
    case 'sun': return `<path d="M34 50 L58 50 L56 62 Q46 68 36 62 Z M62 50 L86 50 L84 62 Q74 68 64 62 Z" fill="#111827" ${s} stroke-linejoin="round"/><path d="M58 52 L62 52" ${s}/><path d="M40 53 L46 53 M68 53 L74 53" stroke="#fff" stroke-width="2" opacity=".6" stroke-linecap="round"/>`;
    case 'star': return `<g fill="#ff4fa3" ${s} stroke-linejoin="round"><path d="M46 45 l3.5 7 7.5 1 -5.5 5.3 1.4 7.5 -6.9 -3.6 -6.9 3.6 1.4 -7.5 -5.5 -5.3 7.5 -1 z"/><path d="M74 45 l3.5 7 7.5 1 -5.5 5.3 1.4 7.5 -6.9 -3.6 -6.9 3.6 1.4 -7.5 -5.5 -5.3 7.5 -1 z"/></g>`;
  }
  return '';
}

// Front bust. opts: { expr, mouthOpen (talk anim), blink }
export function avatarFront(a, opts = {}) {
  const expr = opts.expr || 'neutral';
  const skin = SKINS[a.skin % SKINS.length];
  const skinD = shade(skin, -0.14);
  const hairC = HAIR_COLORS[a.hairColor % HAIR_COLORS.length];
  const style = HAIR_STYLES[a.hair % HAIR_STYLES.length];
  const w = [26, 31, 37][a.body] || 31;
  const id = uid('av');
  const s = `stroke="${OUTLINE}" stroke-width="2.4" stroke-linejoin="round"`;
  const hideHairTop = a.hat === 'beanie' || a.hat === 'cap' || a.hat === 'capback' || a.hat === 'crown' && false;
  return `
  <defs>
    <radialGradient id="${id}c" cx=".5" cy=".4" r=".6"><stop offset="0" stop-color="${shade(skin, 0.12)}"/><stop offset="1" stop-color="${skin}"/></radialGradient>
  </defs>
  ${hairBackFront(style, hairC)}
  ${torsoFront(a, w)}
  <path d="M52 76 L52 88 Q60 92 68 88 L68 76 Z" fill="${skinD}" stroke="${OUTLINE}" stroke-width="2.2"/>
  ${neckAcc(a.neck)}
  <ellipse cx="27" cy="58" rx="6" ry="8" fill="${skin}" ${s}/><ellipse cx="93" cy="58" rx="6" ry="8" fill="${skin}" ${s}/>
  <path d="M60 22 C80 22 93 34 93 54 C93 74 80 84 60 84 C40 84 27 74 27 54 C27 34 40 22 60 22 Z" fill="url(#${id}c)" ${s}/>
  <ellipse cx="41" cy="67" rx="6" ry="3.6" fill="#ff7a9a" opacity=".35"/><ellipse cx="79" cy="67" rx="6" ry="3.6" fill="#ff7a9a" opacity=".35"/>
  <g class="${opts.blink === false ? '' : 'blinker'}" style="transform-origin:60px 56px">${eyes(expr)}</g>
  <path d="M59 62 Q61 65 59 66" stroke="${skinD}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <g class="av-mouth">${mouth(expr)}</g>
  ${hideHairTop ? '' : hairFrontFront(style, hairC)}
  ${glassesFront(a.glasses)}
  ${hatFront(a.hat, hairC)}
  ${expr === 'rage' ? `<path d="M88 28 l6 -2 -2 6 m4 4 l6 -2 -2 6" stroke="#ef4444" stroke-width="2.4" fill="none" stroke-linecap="round"/>` : ''}
  ${expr === 'sleepy' ? `<text x="92" y="26" font-family="Fredoka" font-weight="700" font-size="14" fill="#8b5cf6">z</text><text x="100" y="16" font-family="Fredoka" font-weight="700" font-size="10" fill="#8b5cf6">z</text>` : ''}
  ${expr === 'wow' ? `<path d="M96 40 C100 46 100 52 96 54 C92 52 92 46 96 40 Z" fill="#7dd3fc" stroke="${OUTLINE}" stroke-width="1.4"/>` : ''}
  `;
}

export function avatarFrontSVG(a, opts = {}) {
  return `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" class="${opts.cls || ''}">${avatarFront(a, opts)}</svg>`;
}

// ---------- BACK VIEW (in room coordinates, centered at cx, head center y) ----------
// Returns { body, head, armR } layers so the chair can be drawn between them.

function hairBack(style, c, cx, cy, r) {
  const s = `stroke="${OUTLINE}" stroke-width="2.4" stroke-linejoin="round"`;
  const hl = shade(c, 0.28);
  const dk = shade(c, -0.22);
  const base = `<path d="M${cx - r - 1} ${cy + 2} C${cx - r - 2} ${cy - r - 6} ${cx + r + 2} ${cy - r - 6} ${cx + r + 1} ${cy + 2} C${cx + r} ${cy + r * 0.7} ${cx - r} ${cy + r * 0.7} ${cx - r - 1} ${cy + 2} Z" fill="${c}" ${s}/>`;
  const shine = `<path d="M${cx - r * 0.55} ${cy - r * 0.62} Q${cx} ${cy - r * 0.95} ${cx + r * 0.5} ${cy - r * 0.66}" stroke="${hl}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>`;
  const strands = `<path d="M${cx - r * 0.35} ${cy - r * 0.2} q${r * 0.1} ${r * 0.4} 0 ${r * 0.75} M${cx + r * 0.2} ${cy - r * 0.3} q${r * 0.12} ${r * 0.45} 0 ${r * 0.85}" stroke="${dk}" stroke-width="1.8" fill="none" opacity=".55" stroke-linecap="round"/>`;
  switch (style) {
    case 'buzz': return `<path d="M${cx - r} ${cy + 2} C${cx - r} ${cy - r - 4} ${cx + r} ${cy - r - 4} ${cx + r} ${cy + 2} C${cx + r} ${cy + r * 0.55} ${cx - r} ${cy + r * 0.55} ${cx - r} ${cy + 2} Z" fill="${c}" ${s} opacity=".92"/>`;
    case 'long': return `<path d="M${cx - r - 2} ${cy} C${cx - r - 4} ${cy - r - 6} ${cx + r + 4} ${cy - r - 6} ${cx + r + 2} ${cy} L${cx + r + 4} ${cy + r * 1.6} C${cx + r * 0.4} ${cy + r * 1.8} ${cx - r * 0.4} ${cy + r * 1.8} ${cx - r - 4} ${cy + r * 1.6} Z" fill="${c}" ${s}/>${shine}${strands}`;
    case 'bob': return `<path d="M${cx - r - 3} ${cy} C${cx - r - 4} ${cy - r - 6} ${cx + r + 4} ${cy - r - 6} ${cx + r + 3} ${cy} L${cx + r + 3} ${cy + r * 0.95} C${cx + r * 0.4} ${cy + r * 1.1} ${cx - r * 0.4} ${cy + r * 1.1} ${cx - r - 3} ${cy + r * 0.95} Z" fill="${c}" ${s}/>${shine}`;
    case 'curly': return `<g fill="${c}" ${s}>${[[-0.8, -0.3], [-0.45, -0.8], [0, -0.95], [0.45, -0.8], [0.8, -0.3], [-0.7, 0.3], [0.7, 0.3], [-0.3, 0.45], [0.3, 0.45], [0, 0]].map(([x, y]) => `<circle cx="${cx + x * r}" cy="${cy + y * r}" r="${r * 0.42}"/>`).join('')}</g><g fill="${c}">${[[-0.3, -0.3], [0.3, -0.3], [0, 0.15]].map(([x, y]) => `<circle cx="${cx + x * r}" cy="${cy + y * r}" r="${r * 0.42}"/>`).join('')}</g>`;
    case 'afro': return `<g fill="${c}" ${s}>${[[0, -0.35, 1.25], [-0.75, 0.1, 0.75], [0.75, 0.1, 0.75]].map(([x, y, k]) => `<circle cx="${cx + x * r}" cy="${cy + y * r}" r="${r * k}"/>`).join('')}</g><circle cx="${cx}" cy="${cy - 0.3 * r}" r="${r * 1.15}" fill="${c}"/><g fill="${dk}" opacity=".35">${[[-0.5, -0.8], [0.3, -1], [0.7, -0.4], [-0.2, -0.2], [0.4, 0.2]].map(([x, y]) => `<circle cx="${cx + x * r}" cy="${cy + y * r}" r="${r * 0.08}"/>`).join('')}</g>`;
    case 'spiky': return `<path d="M${cx - r - 2} ${cy + 4} L${cx - r - 10} ${cy - r * 0.3} L${cx - r * 0.8} ${cy - r * 0.5} L${cx - r * 0.9} ${cy - r * 1.3} L${cx - r * 0.3} ${cy - r * 0.9} L${cx} ${cy - r * 1.6} L${cx + r * 0.3} ${cy - r * 0.9} L${cx + r * 0.95} ${cy - r * 1.3} L${cx + r * 0.8} ${cy - r * 0.5} L${cx + r + 10} ${cy - r * 0.3} L${cx + r + 2} ${cy + 4} C${cx + r} ${cy + r * 0.7} ${cx - r} ${cy + r * 0.7} ${cx - r - 2} ${cy + 4} Z" fill="${c}" ${s}/>${shine}`;
    case 'mohawk': return `<path d="M${cx - r} ${cy + 2} C${cx - r} ${cy - r - 4} ${cx + r} ${cy - r - 4} ${cx + r} ${cy + 2} C${cx + r} ${cy + r * 0.55} ${cx - r} ${cy + r * 0.55} ${cx - r} ${cy + 2} Z" fill="${dk}" ${s} opacity=".5"/><path d="M${cx - r * 0.25} ${cy + r * 0.5} L${cx - r * 0.3} ${cy - r * 1.05} L${cx - r * 0.1} ${cy - r * 1.55} L${cx + r * 0.12} ${cy - r * 1.6} L${cx + r * 0.3} ${cy - r * 1.05} L${cx + r * 0.25} ${cy + r * 0.5} Z" fill="${c}" ${s}/>`;
    case 'bun': return `${base}<circle cx="${cx}" cy="${cy - r * 1.05}" r="${r * 0.48}" fill="${c}" ${s}/><path d="M${cx - r * 0.3} ${cy - r * 0.7} Q${cx} ${cy - r * 0.55} ${cx + r * 0.3} ${cy - r * 0.7}" stroke="#ff4fa3" stroke-width="3" fill="none"/>${strands}`;
    case 'ponytail': return `${base}<path d="M${cx - r * 0.18} ${cy - r * 0.3} C${cx - r * 0.3} ${cy + r * 0.8} ${cx + r * 0.3} ${cy + r * 1.2} ${cx + r * 0.1} ${cy + r * 1.65} C${cx + r * 0.6} ${cy + r * 1.2} ${cx + r * 0.4} ${cy + r * 0.4} ${cx + r * 0.2} ${cy - r * 0.3} Z" fill="${c}" ${s}/><rect x="${cx - r * 0.22}" y="${cy - r * 0.38}" width="${r * 0.44}" height="${r * 0.2}" rx="3" fill="#ff4fa3" stroke="${OUTLINE}" stroke-width="1.6"/>${shine}`;
    case 'braids': return `${base}${[-1, 1].map(sd => [0, 1, 2, 3].map(i => `<ellipse cx="${cx + sd * r * 0.55}" cy="${cy + r * 0.55 + i * r * 0.33}" rx="${r * 0.2}" ry="${r * 0.19}" fill="${c}" ${s}/>`).join('')).join('')}${shine}`;
    case 'undercut': return `<path d="M${cx - r} ${cy + 2} C${cx - r} ${cy - r - 4} ${cx + r} ${cy - r - 4} ${cx + r} ${cy + 2} C${cx + r} ${cy + r * 0.55} ${cx - r} ${cy + r * 0.55} ${cx - r} ${cy + 2} Z" fill="${dk}" ${s} opacity=".65"/><path d="M${cx - r - 2} ${cy - r * 0.15} C${cx - r} ${cy - r * 1.25} ${cx + r} ${cy - r * 1.35} ${cx + r + 6} ${cy - r * 0.45} C${cx + r * 0.4} ${cy - r * 0.6} ${cx - r * 0.4} ${cy - r * 0.45} ${cx - r - 2} ${cy - r * 0.15} Z" fill="${c}" ${s}/>`;
    default: return `${base}${shine}${strands}`;
  }
}

function hatBack(kind, cx, cy, r) {
  const s = `stroke="${OUTLINE}" stroke-width="2.4" stroke-linejoin="round"`;
  switch (kind) {
    case 'headset': return `<path d="M${cx - r - 3} ${cy + 2} C${cx - r - 3} ${cy - r - 8} ${cx + r + 3} ${cy - r - 8} ${cx + r + 3} ${cy + 2}" stroke="#1f2937" stroke-width="5.5" fill="none" stroke-linecap="round"/><rect x="${cx - r - 8}" y="${cy - 6}" width="10" height="18" rx="5" fill="#111827" ${s}/><rect x="${cx + r - 2}" y="${cy - 6}" width="10" height="18" rx="5" fill="#111827" ${s}/><rect x="${cx - r - 6.5}" y="${cy - 2}" width="3" height="10" rx="1.5" fill="#22d3ee" class="rgb-led"/><rect x="${cx + r + 3.5}" y="${cy - 2}" width="3" height="10" rx="1.5" fill="#22d3ee" class="rgb-led"/>`;
    case 'catset': return `<path d="M${cx - r * 0.75} ${cy - r * 0.6} L${cx - r * 0.85} ${cy - r * 1.45} L${cx - r * 0.2} ${cy - r * 0.95} Z M${cx + r * 0.75} ${cy - r * 0.6} L${cx + r * 0.85} ${cy - r * 1.45} L${cx + r * 0.2} ${cy - r * 0.95} Z" fill="#ff7ab6" ${s}/><path d="M${cx - r - 3} ${cy + 2} C${cx - r - 3} ${cy - r - 8} ${cx + r + 3} ${cy - r - 8} ${cx + r + 3} ${cy + 2}" stroke="#ff7ab6" stroke-width="5.5" fill="none" stroke-linecap="round"/><rect x="${cx - r - 8}" y="${cy - 6}" width="10" height="18" rx="5" fill="#ff7ab6" ${s}/><rect x="${cx + r - 2}" y="${cy - 6}" width="10" height="18" rx="5" fill="#ff7ab6" ${s}/>`;
    case 'cap': return `<path d="M${cx - r - 1} ${cy - r * 0.15} C${cx - r} ${cy - r * 1.25} ${cx + r} ${cy - r * 1.25} ${cx + r + 1} ${cy - r * 0.15} Z" fill="#ef4444" ${s}/><rect x="${cx - r * 0.3}" y="${cy - r * 0.38}" width="${r * 0.6}" height="${r * 0.22}" rx="3" fill="#b91c1c" ${s}/>`;
    case 'capback': return `<path d="M${cx - r - 1} ${cy - r * 0.15} C${cx - r} ${cy - r * 1.25} ${cx + r} ${cy - r * 1.25} ${cx + r + 1} ${cy - r * 0.15} Z" fill="#3b82f6" ${s}/><path d="M${cx - r * 0.7} ${cy - r * 0.2} C${cx - r * 0.4} ${cy + r * 0.25} ${cx + r * 0.4} ${cy + r * 0.25} ${cx + r * 0.7} ${cy - r * 0.2} Z" fill="#1d4ed8" ${s}/>`;
    case 'beanie': return `<path d="M${cx - r - 2} ${cy - r * 0.05} C${cx - r - 2} ${cy - r * 1.55} ${cx + r + 2} ${cy - r * 1.55} ${cx + r + 2} ${cy - r * 0.05} Z" fill="#f59e0b" ${s}/><rect x="${cx - r - 3}" y="${cy - r * 0.32}" width="${2 * r + 6}" height="${r * 0.36}" rx="5" fill="#d97706" ${s}/><circle cx="${cx}" cy="${cy - r * 1.35}" r="${r * 0.3}" fill="#fde68a" ${s}/>`;
    case 'bandana': return `<path d="M${cx - r - 1} ${cy - r * 0.2} C${cx - r} ${cy - r * 1.1} ${cx + r} ${cy - r * 1.1} ${cx + r + 1} ${cy - r * 0.2} L${cx + r + 1} ${cy + r * 0.05} C${cx + r * 0.3} ${cy - r * 0.2} ${cx - r * 0.3} ${cy - r * 0.2} ${cx - r - 1} ${cy + r * 0.05} Z" fill="#dc2626" ${s}/><path d="M${cx - 3} ${cy - r * 0.1} l-6 ${r * 0.7} l9 -3 l9 3 l-6 ${-r * 0.7} z" fill="#dc2626" ${s}/>`;
    case 'crown': return `<path d="M${cx - r * 0.6} ${cy - r * 0.75} L${cx - r * 0.65} ${cy - r * 1.55} L${cx - r * 0.25} ${cy - r * 1.15} L${cx} ${cy - r * 1.7} L${cx + r * 0.25} ${cy - r * 1.15} L${cx + r * 0.65} ${cy - r * 1.55} L${cx + r * 0.6} ${cy - r * 0.75} Z" fill="#fbbf24" ${s}/>`;
  }
  return '';
}

// Back view, sitting. cx: center x, y: shoulder line y. Scale 1 ~ room units.
export function avatarBack(a, cx, y, opts = {}) {
  const skin = SKINS[a.skin % SKINS.length];
  const skinD = shade(skin, -0.16);
  const hairC = HAIR_COLORS[a.hairColor % HAIR_COLORS.length];
  const style = HAIR_STYLES[a.hair % HAIR_STYLES.length];
  const col = CLOTH_COLORS[a.outfitColor % CLOTH_COLORS.length];
  const outfit = OUTFITS[a.outfit];
  const torsoCol = outfit === 'tank' ? skin : col;
  const dk = shade(col, -0.25);
  const w = [20, 24, 29][a.body] || 24;
  const r = 25;
  const hy = y - 30;
  const s = `stroke="${OUTLINE}" stroke-width="2.4" stroke-linejoin="round"`;
  let torso = `<path d="M${cx - w - 6} ${y + 70} L${cx - w - 4} ${y + 14} C${cx - w - 3} ${y + 2} ${cx - w + 6} ${y - 4} ${cx - 10} ${y - 5} L${cx + 10} ${y - 5} C${cx + w - 6} ${y - 4} ${cx + w + 3} ${y + 2} ${cx + w + 4} ${y + 14} L${cx + w + 6} ${y + 70} Z" fill="${torsoCol}" ${s}/>`;
  if (outfit === 'tank') torso += `<path d="M${cx - w + 2} ${y + 70} L${cx - w + 4} ${y + 6} L${cx - 9} ${y - 3} Q${cx} ${y + 10} ${cx + 9} ${y - 3} L${cx + w - 4} ${y + 6} L${cx + w - 2} ${y + 70} Z" fill="${col}" ${s}/>`;
  if (outfit === 'hoodie') torso += `<path d="M${cx - 16} ${y - 4} C${cx - 18} ${y + 22} ${cx + 18} ${y + 22} ${cx + 16} ${y - 4} Z" fill="${dk}" ${s}/>`;
  if (outfit === 'jersey') torso += `<text x="${cx}" y="${y + 40}" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="26" fill="#fff" stroke="${OUTLINE}" stroke-width="1.2">1</text><path d="M${cx - w - 4} ${y + 12} L${cx + w + 4} ${y + 12}" stroke="#fff" stroke-width="4" opacity=".85"/>`;
  if (outfit === 'jacket') torso += `<path d="M${cx - 12} ${y + 26} l3 6 6.6 1 -4.8 4.6 1.2 6.6 -6 -3.2 -6 3.2 1.2 -6.6 -4.8 -4.6 6.6 -1 z" fill="#ffd23f" stroke="${OUTLINE}" stroke-width="1.4" transform="translate(12 0)"/><path d="M${cx - w - 4} ${y + 10} L${cx - w - 5} ${y + 60} M${cx + w + 4} ${y + 10} L${cx + w + 5} ${y + 60}" stroke="${shade(col, 0.3)}" stroke-width="3"/>`;
  if (outfit === 'sweater') torso += [0, 1, 2].map(i => `<path d="M${cx - w} ${y + 16 + i * 9} ${Array.from({ length: Math.floor(w / 3) }, (_, k) => `l3 ${k % 2 ? 3 : -3} l3 ${k % 2 ? -3 : 3}`).join(' ')}" stroke="${shade(col, 0.3)}" stroke-width="1.6" fill="none" opacity=".8"/>`).join('');
  if (outfit === 'cape') torso = `<path d="M${cx - w - 10} ${y + 72} C${cx - w - 8} ${y + 10} ${cx - w} ${y - 4} ${cx - 10} ${y - 6} L${cx + 10} ${y - 6} C${cx + w} ${y - 4} ${cx + w + 8} ${y + 10} ${cx + w + 10} ${y + 72} Z" fill="#7c3aed" ${s}/><path d="M${cx - 10} ${y - 6} Q${cx} ${y + 4} ${cx + 10} ${y - 6}" fill="#fbbf24" stroke="${OUTLINE}" stroke-width="1.6"/>`;
  if (outfit === 'suit') torso += `<path d="M${cx} ${y - 4} L${cx} ${y + 70}" stroke="${dk}" stroke-width="2" opacity=".6"/>`;
  // arms reaching forward (to keyboard and mouse)
  const armL = `<path class="arm-l" d="M${cx - w - 2} ${y + 10} C${cx - w - 14} ${y + 28} ${cx - w - 10} ${y + 46} ${cx - w + 2} ${y + 52}" stroke="${OUTLINE}" stroke-width="15" fill="none" stroke-linecap="round"/><path class="arm-l" d="M${cx - w - 2} ${y + 10} C${cx - w - 14} ${y + 28} ${cx - w - 10} ${y + 46} ${cx - w + 2} ${y + 52}" stroke="${outfit === 'tank' ? skin : col}" stroke-width="10.5" fill="none" stroke-linecap="round"/>`;
  const armR = `<g class="arm-r"><path d="M${cx + w + 2} ${y + 10} C${cx + w + 18} ${y + 22} ${cx + w + 26} ${y + 34} ${cx + w + 34} ${y + 30}" stroke="${OUTLINE}" stroke-width="15" fill="none" stroke-linecap="round"/><path d="M${cx + w + 2} ${y + 10} C${cx + w + 18} ${y + 22} ${cx + w + 26} ${y + 34} ${cx + w + 34} ${y + 30}" stroke="${outfit === 'tank' ? skin : col}" stroke-width="10.5" fill="none" stroke-linecap="round"/><circle cx="${cx + w + 38}" cy="${y + 29}" r="6" fill="${skin}" ${s}/></g>`;
  const neck = `<path d="M${cx - 8} ${hy + 16} L${cx - 8} ${y - 2} L${cx + 8} ${y - 2} L${cx + 8} ${hy + 16} Z" fill="${skinD}" ${s}/>`;
  const ears = `<ellipse cx="${cx - r - 1}" cy="${hy + 3}" rx="5" ry="7" fill="${skin}" ${s}/><ellipse cx="${cx + r + 1}" cy="${hy + 3}" rx="5" ry="7" fill="${skin}" ${s}/>`;
  const skull = `<path d="M${cx - r} ${hy} C${cx - r} ${hy - r - 2} ${cx + r} ${hy - r - 2} ${cx + r} ${hy} C${cx + r} ${hy + r * 0.85} ${cx - r} ${hy + r * 0.85} ${cx - r} ${hy} Z" fill="${skin}" ${s}/>`;
  const hairHidden = ['beanie'].includes(a.hat);
  const head = `<g class="head">${neck}${ears}${skull}${hairHidden ? '' : hairBack(style, hairC, cx, hy, r)}${hatBack(a.hat, cx, hy, r)}</g>`;
  return { torso: `<g class="torso">${armL}${torso}</g>`, head, armR };
}
