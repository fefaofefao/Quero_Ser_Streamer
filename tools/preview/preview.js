import { roomSVG, ROOM_DEFS, SCREENS, equipIconSVG } from '../../game/src/art/room.js';
import { avatarFrontSVG, randomAvatar, defaultAvatar, EXPRESSIONS, HAIR_STYLES } from '../../game/src/art/avatar.js';

const params = new URLSearchParams(location.search);
const mode = params.get('mode') || 'rooms';
const root = document.getElementById('root');

function baseState(house, lv, extras = {}) {
  return {
    house, plaques: house, extras,
    equip: { pc: lv, monitor: lv, mouse: lv, mousepad: lv, chair: lv, webcam: lv },
    profile: { avatar: { ...defaultAvatar(), hair: house * 2 % 12, hat: house >= 2 ? 'headset' : 'none', outfit: house + 1 }, channel: 'FernandoGG', pet: ['none', 'cat', 'dog', 'parrot', 'hamster'][house] },
  };
}

if (mode === 'rooms') {
  const phase = params.get('phase') || 'day';
  for (let h = 0; h < 5; h++) {
    const lv = Math.min(5, h + 1);
    const ex = h >= 1 ? { mic: Math.min(3, h), rgb: Math.min(3, h), green: h >= 2 ? h - 1 : 0, guest: h >= 3 ? h - 2 : 0, pool: h >= 4 ? 3 : 0 } : {};
    const s = baseState(h, lv, ex);
    const r = roomSVG(s, { phase });
    const sc = SCREENS[lv - 1];
    root.insertAdjacentHTML('beforeend', `<div class="cell"><svg viewBox="0 0 400 340">${ROOM_DEFS}${r.below}<rect x="${sc.x}" y="${sc.y}" width="${sc.w}" height="${sc.h}" fill="#5b4bd6"/>${r.above}</svg><p>house ${h} lv ${lv}</p></div>`);
  }
}
if (mode === 'equip') {
  for (const id of ['pc', 'monitor', 'mouse', 'mousepad', 'chair', 'webcam']) {
    for (let lv = 1; lv <= 5; lv++) root.insertAdjacentHTML('beforeend', `<div class="icon">${equipIconSVG(id, lv)}<p>${id} ${lv}</p></div>`);
  }
}
if (mode === 'avatars') {
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 12; i++) root.insertAdjacentHTML('beforeend', `<div class="icon">${avatarFrontSVG({ ...randomAvatar(rnd), hair: i }, { expr: EXPRESSIONS[i % EXPRESSIONS.length], blink: false })}<p>${HAIR_STYLES[i]} ${EXPRESSIONS[i % EXPRESSIONS.length]}</p></div>`);
  const hats = ['headset', 'catset', 'cap', 'capback', 'beanie', 'bandana', 'crown'];
  hats.forEach((h, i) => root.insertAdjacentHTML('beforeend', `<div class="icon">${avatarFrontSVG({ ...defaultAvatar(), hat: h, outfit: i % 8, glasses: ['none', 'round', 'square', 'sun', 'star'][i % 5], neck: ['none', 'chain', 'medal', 'scarf'][i % 4], skin: i, body: i % 3 }, { expr: 'happy', blink: false })}<p>${h}</p></div>`));
}
import { makeGame, GAME_IDS, GW, GH } from '../../game/src/art/games.js';
if (mode === 'games') {
  const runs = GAME_IDS.map(id => {
    const c = document.createElement('canvas'); c.width = GW * 2; c.height = GH * 2; c.style.width = GW + 'px';
    const wrap = document.createElement('div'); wrap.className = 'cell'; wrap.style.width = '330px'; wrap.appendChild(c); root.appendChild(wrap);
    const ctx = c.getContext('2d'); ctx.scale(2, 2);
    return { ctx, g: makeGame(id) };
  });
  let last = performance.now();
  const loop = (now) => { const dt = Math.min(0.05, (now - last) / 1000); last = now; runs.forEach((r, i) => r.g(r.ctx, dt, i % 2)); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
}
