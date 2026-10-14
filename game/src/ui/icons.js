// Hand-made SVG icon set. ic(name, cls) returns an inline <svg>.
const O = '#2a1f3d';
const S = `stroke="${O}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"`;

const P = {
  gold: `<circle cx="12" cy="12" r="9.5" fill="#ffc83d" ${S}/><circle cx="12" cy="12" r="6.2" fill="#ffdb6e" stroke="#e0a21a" stroke-width="1.6"/><path d="M12 8.2v7.6M9.6 10.4c0-1.6 4.8-1.6 4.8 0s-4.8 1.6-4.8 3.2 4.8 1.6 4.8 0" stroke="#b7790e" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M6.5 8 Q8 5.5 11 5" stroke="#fff" stroke-width="1.6" fill="none" opacity=".8" stroke-linecap="round"/>`,
  gem: `<path d="M6 3.5h12l4 5.5-10 12.5L2 9z" fill="#59d8ff" ${S}/><path d="M2 9h20M8.5 3.5 7 9l5 12.5L17 9l-1.5-5.5M7 9l5-5.5L17 9" stroke="#1d8fc2" stroke-width="1.2" fill="none" stroke-linejoin="round"/><path d="M5 8.4 7 5" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`,
  star: `<path d="M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.6L12 17.2l-5.9 3.3 1.3-6.6L2.5 9.3l6.6-.8z" fill="#ffd23f" ${S}/><path d="M9.5 8.8 11 6" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`,
  heart: `<path d="M12 20.5S3 15 3 9.2C3 6.3 5.2 4 7.9 4c1.8 0 3.2 1 4.1 2.4C12.9 5 14.3 4 16.1 4 18.8 4 21 6.3 21 9.2 21 15 12 20.5 12 20.5z" fill="#ff5e8e" ${S}/><path d="M6.5 8.2c.3-1.2 1.2-2 2.3-2.1" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,
  gear: `<path d="M12 2.8l1.6 2.2 2.6-.7.6 2.6 2.6.6-.7 2.6 2.2 1.6-2.2 1.6.7 2.6-2.6.6-.6 2.6-2.6-.7L12 21.2l-1.6-2.2-2.6.7-.6-2.6-2.6-.6.7-2.6L3 12l2.2-1.6-.7-2.6 2.6-.6.6-2.6 2.6.7z" fill="#c7cbe8" ${S}/><circle cx="12" cy="12" r="3.4" fill="#6b6f99" ${S}/>`,
  lock: `<rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="#ffc83d" ${S}/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" ${S}/><circle cx="12" cy="15.5" r="1.6" fill="${O}"/>`,
  check: `<circle cx="12" cy="12" r="9.5" fill="#3ddc97" ${S}/><path d="M7.5 12.4l3 3 6-6.4" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  close: `<path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>`,
  play: `<rect x="2.5" y="5" width="19" height="14" rx="4" fill="#ff4f6d" ${S}/><path d="M10 9l5 3-5 3z" fill="#fff"/>`,
  clock: `<circle cx="12" cy="12" r="9" fill="#fff" ${S}/><path d="M12 7v5l3 2" ${S} fill="none"/>`,
  gift: `<rect x="3.5" y="9" width="17" height="11.5" rx="2" fill="#ff6b9d" ${S}/><rect x="2.5" y="6.5" width="19" height="4.5" rx="1.5" fill="#ff8fb5" ${S}/><path d="M12 6.5v14" stroke="#ffd23f" stroke-width="3"/><path d="M12 6.5c-1.5-3.5-6-3.5-5 0M12 6.5c1.5-3.5 6-3.5 5 0" fill="none" ${S}/>`,
  missions: `<rect x="4.5" y="3.5" width="15" height="18" rx="2.5" fill="#fff4d6" ${S}/><rect x="8.5" y="2" width="7" height="4" rx="1.5" fill="#8b5cf6" ${S}/><path d="M8 10.5l1.4 1.4 2.6-2.6M8 16l1.4 1.4 2.6-2.6M14 11h3M14 16.5h3" stroke="${O}" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  pen: `<path d="M15.5 3.5l5 5L9 20H4v-5z" fill="#ffd23f" ${S}/><path d="M13 6l5 5" ${S}/><path d="M4 15l5 5" stroke="#e0a21a" stroke-width="2"/><path d="M3 22c3-1.5 5 1 8-0.5" stroke="#ff4f6d" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,
  rocket: `<path d="M12 2.5c4 2.5 5.5 7 4.5 11.5h-9C6.5 9.5 8 5 12 2.5z" fill="#f1f5ff" ${S}/><circle cx="12" cy="9" r="2.2" fill="#4cc9f0" ${S}/><path d="M7.5 14l-3 3.5 3.5.5M16.5 14l3 3.5-3.5.5" fill="#ff6b6b" ${S}/><path d="M10 15.5c0 3 2 5.5 2 5.5s2-2.5 2-5.5" fill="#ffb02e" ${S}/>`,
  bag: `<path d="M5 8h14l-1.2 12.5H6.2z" fill="#a78bfa" ${S}/><path d="M9 10V7a3 3 0 0 1 6 0v3" fill="none" ${S}/>`,
  trophy: `<path d="M7 3.5h10v5a5 5 0 0 1-10 0z" fill="#ffd23f" ${S}/><path d="M7 5H4c0 3 1.5 4.5 3.5 4.8M17 5h3c0 3-1.5 4.5-3.5 4.8" fill="none" ${S}/><path d="M12 13.5v3.5M8 20.5h8l-1-3.5H9z" fill="#e0a21a" ${S}/>`,
  chart: `<rect x="3" y="3" width="18" height="18" rx="3" fill="#fff" ${S}/><path d="M7 16v-3M11 16V9M15 16v-5M19 16V7" stroke="#8b5cf6" stroke-width="2.4" stroke-linecap="round"/>`,
  shirt: `<path d="M8 3.5 3 6.5l2 4 2-1V21h10V9.5l2 1 2-4-5-3c-.5 1.8-2 3-4 3s-3.5-1.2-4-3z" fill="#4cc9f0" ${S}/>`,
  rebirth: `<circle cx="12" cy="12" r="9" fill="#ffefe0" ${S}/><path d="M16.5 8.5A5.5 5.5 0 1 0 17.5 13" fill="none" stroke="#ff7a3d" stroke-width="2.4" stroke-linecap="round"/><path d="M14.5 8.3h3V5.3" fill="none" stroke="#ff7a3d" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`,
  house: `<path d="M3 11.5 12 4l9 7.5" fill="none" ${S}/><path d="M5.5 10v10.5h13V10" fill="#ffd8a8" ${S}/><rect x="10" y="14" width="4" height="6.5" fill="#c0603a" ${S}/>`,
  tv: `<rect x="2.5" y="5" width="19" height="13" rx="2.5" fill="#6c5ce7" ${S}/><path d="M8 21h8M9 2.5l3 2.5 3-2.5" ${S} fill="none"/><path d="M5 8.5h6" stroke="#fff" stroke-width="1.6" opacity=".7" stroke-linecap="round"/>`,
  controller: `<path d="M6.5 7h11a4.5 4.5 0 0 1 4.3 5.8l-1.2 4.2a2.5 2.5 0 0 1-4.2 1L14 16h-4l-2.4 2a2.5 2.5 0 0 1-4.2-1l-1.2-4.2A4.5 4.5 0 0 1 6.5 7z" fill="#3ddc97" ${S}/><path d="M7.5 10v3.5M5.8 11.8h3.5" stroke="${O}" stroke-width="1.8" stroke-linecap="round"/><circle cx="16" cy="10.6" r="1.2" fill="${O}"/><circle cx="17.8" cy="12.8" r="1.2" fill="${O}"/>`,
  pc: `<rect x="3" y="4" width="13" height="10" rx="1.8" fill="#4cc9f0" ${S}/><path d="M7 18h5M9.5 14v4" ${S}/><rect x="17.5" y="5" width="4" height="13.5" rx="1" fill="#6b6f99" ${S}/>`,
  user: `<circle cx="12" cy="8.5" r="4.2" fill="#ffd8a8" ${S}/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7z" fill="#8b5cf6" ${S}/>`,
  // channel upgrades
  up_quality: `<rect x="3" y="4" width="18" height="16" rx="3" fill="#e9e3ff" ${S}/><path d="M7.5 8v8M12 8v8M16.5 8v8" stroke="#a5a1c9" stroke-width="2" stroke-linecap="round"/><rect x="5.5" y="9" width="4" height="3" rx="1" fill="#8b5cf6" ${S}/><rect x="10" y="12.5" width="4" height="3" rx="1" fill="#ff6b9d" ${S}/><rect x="14.5" y="10" width="4" height="3" rx="1" fill="#3ddc97" ${S}/>`,
  up_schedule: `<rect x="3" y="5" width="18" height="15.5" rx="2.5" fill="#fff" ${S}/><path d="M3 9.5h18" ${S}/><rect x="3" y="5" width="18" height="4.5" rx="2" fill="#ff4f6d" ${S}/><path d="M8 3v4M16 3v4" ${S}/><circle cx="8.5" cy="14" r="1.4" fill="#8b5cf6"/><circle cx="12.5" cy="14" r="1.4" fill="#8b5cf6"/><circle cx="16.5" cy="14" r="1.4" fill="#d6d3f0"/><circle cx="8.5" cy="17.5" r="1.4" fill="#d6d3f0"/>`,
  up_chat: `<path d="M3.5 5.5a2.5 2.5 0 0 1 2.5-2.5h12a2.5 2.5 0 0 1 2.5 2.5v8a2.5 2.5 0 0 1-2.5 2.5H11l-5 4v-4a2.5 2.5 0 0 1-2.5-2.5z" fill="#4cc9f0" ${S}/><path d="M7.5 8.5h9M7.5 12h6" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`,
  up_clips: `<circle cx="6.5" cy="17" r="3" fill="#fff" ${S}/><circle cx="17.5" cy="17" r="3" fill="#fff" ${S}/><path d="M8.5 15 18 3.5M15.5 15 6 3.5" stroke="#ff4f6d" stroke-width="2.6" stroke-linecap="round"/><path d="M8.5 15 18 3.5M15.5 15 6 3.5" stroke="${O}" stroke-width="1" stroke-linecap="round" opacity=".4"/>`,
  up_thumbs: `<rect x="2.5" y="4" width="19" height="15" rx="2.5" fill="#ffd23f" ${S}/><circle cx="9" cy="11" r="3.4" fill="#ffd8a8" ${S}/><ellipse cx="9" cy="12.3" rx="1" ry="1.2" fill="${O}"/><path d="M14 15l4-5" stroke="#ff4f6d" stroke-width="2.6" stroke-linecap="round"/><path d="M15.5 9.5h3v3" stroke="#ff4f6d" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  up_mods: `<path d="M12 2.5l8 3v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10v-6z" fill="#3ddc97" ${S}/><path d="M8 12l3 3 5-5.5" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  up_collab: `<circle cx="8" cy="8.5" r="3.4" fill="#ffd8a8" ${S}/><circle cx="16" cy="8.5" r="3.4" fill="#f7cba4" ${S}/><path d="M2 20c0-3.6 2.7-6 6-6s6 2.4 6 6zM10 20c0-3.6 2.7-6 6-6s6 2.4 6 6z" fill="#8b5cf6" ${S}/><path d="M10 20c0-3.6 2.7-6 6-6s6 2.4 6 6z" fill="#ff6b9d" ${S}/>`,
  up_sponsor: `<rect x="3" y="7.5" width="18" height="12.5" rx="2.5" fill="#c08457" ${S}/><path d="M9 7.5V5.5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5.5v2" fill="none" ${S}/><path d="M3 12.5h18" ${S}/><rect x="10.5" y="11" width="3" height="3.5" rx=".8" fill="#ffd23f" ${S}/>`,
  up_agency: `<rect x="5" y="3" width="14" height="18" rx="1.5" fill="#a5b4fc" ${S}/>${[7, 11, 15].map(y => `<rect x="8" y="${y - 1}" width="3" height="2.5" fill="#fff"/><rect x="13" y="${y - 1}" width="3" height="2.5" fill="#fff"/>`).join('')}<rect x="10.5" y="17" width="3" height="4" fill="#6b6f99"/>`,
  up_tour: `<rect x="2.5" y="6" width="19" height="11" rx="3" fill="#ff9f1c" ${S}/><rect x="5" y="8.5" width="4" height="3.5" rx="1" fill="#bde0fe"/><rect x="10.5" y="8.5" width="4" height="3.5" rx="1" fill="#bde0fe"/><circle cx="7" cy="18" r="2" fill="${O}"/><circle cx="17" cy="18" r="2" fill="${O}"/><rect x="16" y="8.5" width="3.5" height="6" rx="1" fill="#bde0fe"/>`,
  up_network: `<circle cx="12" cy="5.5" r="2.8" fill="#ff6b9d" ${S}/><circle cx="5" cy="17.5" r="2.8" fill="#4cc9f0" ${S}/><circle cx="19" cy="17.5" r="2.8" fill="#3ddc97" ${S}/><path d="M10.6 8 6.4 15M13.4 8l4.2 7M7.8 17.5h8.4" ${S}/>`,
  up_empire: `<path d="M4 18 3 7l5 4 4-6 4 6 5-4-1 11z" fill="#ffd23f" ${S}/><rect x="4" y="18" width="16" height="3" rx="1" fill="#e0a21a" ${S}/><circle cx="12" cy="13" r="1.8" fill="#ff4f6d"/>`,
  com_forum: `<rect x="3" y="3" width="18" height="18" rx="3" fill="#e0f2fe" ${S}/><path d="M7 8h10M7 12h10M7 16h6" stroke="#38bdf8" stroke-width="2" stroke-linecap="round"/>`,
  com_tournament: `<path d="M7 3.5h10v5a5 5 0 0 1-10 0z" fill="#e5e7eb" ${S}/><path d="M7 5H4c0 3 1.5 4.5 3.5 4.8M17 5h3c0 3-1.5 4.5-3.5 4.8" fill="none" ${S}/><path d="M12 13.5v3.5M8 20.5h8l-1-3.5H9z" fill="#9ca3af" ${S}/>`,
  com_meetup: `<circle cx="6" cy="9" r="2.6" fill="#ffd8a8" ${S}/><circle cx="12" cy="7.5" r="2.8" fill="#f7cba4" ${S}/><circle cx="18" cy="9" r="2.6" fill="#d49a6a" ${S}/><path d="M1.5 19c0-3 2-5 4.5-5s4.5 2 4.5 5zM7 19c0-3.4 2.3-5.6 5-5.6s5 2.2 5 5.6zM13.5 19c0-3 2-5 4.5-5s4.5 2 4.5 5z" fill="#a78bfa" ${S}/>`,
};

// Market badges (rounded squares with a glyph)
const MK = {
  blococai: ['#6c5ce7', '#a29bfe', `<rect x="7" y="6" width="5" height="5" rx="1" fill="#ffd23f"/><rect x="12" y="6" width="5" height="5" rx="1" fill="#ffd23f"/><rect x="12" y="11" width="5" height="5" rx="1" fill="#ffd23f"/><rect x="5" y="15" width="5" height="5" rx="1" fill="#ff6b9d"/><rect x="10" y="15" width="5" height="5" rx="1" fill="#4cc9f0"/>`],
  pulopixel: ['#00b894', '#55efc4', `<rect x="9" y="5" width="7" height="3" fill="#ff4f6d"/><rect x="8" y="8" width="8" height="5" fill="#ffd8a8"/><rect x="8" y="13" width="8" height="5" fill="#ff4f6d"/><rect x="7" y="18" width="4" height="2" fill="#2a1f3d"/><rect x="13" y="18" width="4" height="2" fill="#2a1f3d"/>`],
  goltotal: ['#27ae60', '#6ee7a1', `<circle cx="12" cy="12.5" r="7" fill="#fff" stroke="#2a1f3d" stroke-width="1.6"/><path d="M12 9.2l2.6 1.9-1 3h-3.2l-1-3z" fill="#2a1f3d"/>`],
  cubocraft: ['#8d6e63', '#c8a27a', `<path d="M12 4.5l7 4v8l-7 4-7-4v-8z" fill="#5dbb4f" stroke="#2a1f3d" stroke-width="1.4"/><path d="M5 8.5l7 4 7-4M12 12.5v8" stroke="#2a1f3d" stroke-width="1.4" fill="none"/><path d="M12 12.5l7-4v8l-7 4z" fill="#8b5a2b"/><path d="M5 8.5l7 4v8l-7-4z" fill="#a0693a"/>`],
  turbo: ['#e17055', '#fab1a0', `<path d="M4 15.5l2-5h12l2 5v3H4z" fill="#e63946" stroke="#2a1f3d" stroke-width="1.4"/><path d="M7.5 10.5l1.5-3h6l1.5 3z" fill="#a8dadc" stroke="#2a1f3d" stroke-width="1.2"/><circle cx="7.5" cy="18.5" r="2" fill="#2a1f3d"/><circle cx="16.5" cy="18.5" r="2" fill="#2a1f3d"/>`],
  zona: ['#0984e3', '#74b9ff', `<circle cx="12" cy="12.5" r="7.5" fill="#7fb069" stroke="#e0aaff" stroke-width="2" stroke-dasharray="3 2"/><circle cx="12" cy="12.5" r="2" fill="#4cc9f0" stroke="#fff" stroke-width="1.2"/><circle cx="8" cy="10" r="1.2" fill="#e63946"/><circle cx="15.5" cy="15.5" r="1.2" fill="#e63946"/>`],
  alvo: ['#d63031', '#ff7675', `<circle cx="12" cy="12.5" r="7" fill="none" stroke="#fff" stroke-width="2"/><circle cx="12" cy="12.5" r="3" fill="none" stroke="#fff" stroke-width="2"/><path d="M12 3.5v4M12 17.5v4M3 12.5h4M17 12.5h4" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`],
  lendas: ['#a55eea', '#d6a2ff', `<path d="M6 18 16.5 7.5M14 5.5l4.5 4.5" stroke="#e5e7eb" stroke-width="2.6" stroke-linecap="round"/><path d="M5 16.5l2.5 2.5M4 19.5l1.5-1.5" stroke="#ffd23f" stroke-width="2.4" stroke-linecap="round"/><path d="M18 18 7.5 7.5" stroke="#c4b5fd" stroke-width="2.6" stroke-linecap="round"/>`],
};

export function ic(name, cls = '') {
  return `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[name] || ''}</svg>`;
}

export function marketBadge(id, cls = '') {
  const [a, b, g] = MK[id] || MK.blococai;
  const gid = 'mb' + id;
  return `<svg class="mk ${cls}" viewBox="0 0 24 24"><defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${b}"/><stop offset="1" stop-color="${a}"/></linearGradient></defs><rect x="1" y="1" width="22" height="22" rx="6" fill="url(#${gid})" stroke="${O}" stroke-width="1.6"/>${g}<path d="M4 6 Q6 3.5 9.5 3.5" stroke="#fff" stroke-width="1.4" fill="none" opacity=".5" stroke-linecap="round"/></svg>`;
}
