// Avatar creation and customization (cosmetics, some locked by rank/house + diamonds).
import { avatarFrontSVG, SKINS, HAIR_COLORS, CLOTH_COLORS, HAIR_STYLES, OUTFITS, HATS, GLASSES, NECKS, BODIES, randomAvatar } from '../art/avatar.js';
import { petSVG, themeThumb } from '../art/room.js';
import { S } from '../game.js';
import * as G from '../game.js';
import * as E from '../economy.js';
import { cosmeticCatalog, cosmeticKey } from '../data.js';
import { t } from '../i18n.js';
import { modal, toast, $, esc, confirmBox } from './dom.js';
import { ic } from './icons.js';
import { sfx } from '../audio.js';
import { sparkles } from './fx.js';
import { fmtInt } from '../format.js';

const NEON = ['#22d3ee', '#f472b6', '#a78bfa', '#facc15'];
const CATS = ['skin', 'body', 'hair', 'hairColor', 'outfit', 'outfitColor', 'hat', 'glasses', 'neck', 'pet', 'theme', 'neon'];
const THEMES = ['none', 'sakura', 'snow', 'neoncity', 'galaxy', 'fireworks'];

function catalog() { return cosmeticCatalog(); }
function itemFor(cat, value) { return catalog().find(i => i.cat === cat && i.value === value); }

function unlockState(it, creating) {
  if (!it || (!it.req && !it.price && !it.premium)) return { ok: true };
  if (S.owned[cosmeticKey(it)]) return { ok: true };
  if (creating) return { ok: false, reason: '' };
  if (it.premium) return { ok: false, premium: true, reason: it.season ? t('seasonOnly') : t('weeklyOnly') };
  const rank = S.bestRank;
  if (it.req && it.req.rank && rank > it.req.rank) return { ok: false, reason: t('unlockRank', { n: fmtInt(it.req.rank) }), locked: true };
  if (it.req && it.req.house && S.house < it.req.house) return { ok: false, reason: t('unlockHouse', { h: t('h_' + E.HOUSES[it.req.house].id) }), locked: true };
  if (it.price) return { ok: false, price: it.price };
  return { ok: true };
}

function thumb(cat, value, av) {
  switch (cat) {
    case 'skin': return `<span class="sw" style="background:${SKINS[value]}"></span>`;
    case 'hairColor': return `<span class="sw ${value >= 6 ? 'neon' : ''}" style="background:${HAIR_COLORS[value]}"></span>`;
    case 'outfitColor': return `<span class="sw" style="background:${CLOTH_COLORS[value]}"></span>`;
    case 'neon': return `<span class="sw neon" style="background:${NEON[value]}"></span>`;
    case 'pet': return value === 'none' ? `<span class="none">∅</span>` : `<svg viewBox="-30 -46 60 56">${petSVG(value, 0, 6)}</svg>`;
    case 'theme': return value === 'none' ? `<span class="none">∅</span>` : themeThumb(value);
    default: {
      const a = { ...av, [cat]: value };
      return avatarFrontSVG(a, { blink: false, expr: 'happy' });
    }
  }
}

function options(cat) {
  switch (cat) {
    case 'skin': return SKINS.map((_, i) => i);
    case 'body': return BODIES.map((_, i) => i);
    case 'hair': return HAIR_STYLES.map((_, i) => i);
    case 'hairColor': return HAIR_COLORS.map((_, i) => i);
    case 'outfit': return OUTFITS.map((_, i) => i);
    case 'outfitColor': return CLOTH_COLORS.map((_, i) => i);
    case 'hat': return HATS;
    case 'glasses': return GLASSES;
    case 'neck': return NECKS;
    case 'pet': return ['none', 'hamster', 'cat', 'dog', 'parrot', 'penguin', 'robot', 'dragon'];
    case 'theme': return THEMES;
    case 'neon': return [0, 1, 2, 3];
  }
  return [];
}

function getVal(draft, cat) {
  if (cat === 'pet') return draft.pet;
  if (cat === 'theme') return draft.theme;
  if (cat === 'neon') return draft.neonColor;
  return draft.avatar[cat];
}
function setVal(draft, cat, v) {
  if (cat === 'pet') draft.pet = v;
  else if (cat === 'theme') draft.theme = v;
  else if (cat === 'neon') draft.neonColor = v;
  else draft.avatar[cat] = v;
}

// creating=true: first run (name + channel, only free items)
export function avatarEditor({ creating = false, onDone } = {}) {
  const draft = { avatar: { ...S.profile.avatar }, pet: S.profile.pet || 'none', theme: S.profile.theme || 'none', neonColor: S.profile.neonColor || 0, channel: S.profile.channel, name: S.profile.name };
  let cat = 'hair';
  const cats = creating ? ['skin', 'body', 'hair', 'hairColor', 'outfit', 'outfitColor'] : CATS.filter(c => c !== 'neon' || S.house >= 3);
  const api = modal({
    cls: 'avatar-editor' + (creating ? ' creating' : ''), noClose: creating, noBackdropClose: true,
    title: creating ? t('createTitle') : t('customize'), icon: ic('shirt'),
    body: '',
  });
  let exprI = 0;
  const draw = () => {
    const opts = options(cat);
    const cur = getVal(draft, cat);
    const grid = opts.map(v => {
      const it = itemFor(cat, v);
      const st = unlockState(it, creating);
      const hiddenWhenCreating = creating && !st.ok;
      if (hiddenWhenCreating) return '';
      const sel = v === cur;
      const rar = it && it.premium ? ' rar-' + it.rarity : '';
      return `<button class="opt ${sel ? 'sel' : ''} ${st.ok ? '' : 'lk'}${rar}" data-v="${v}">${thumb(cat, v, draft.avatar)}${st.locked ? `<span class="lock">${ic('lock')}</span>` : st.premium ? `<span class="lock prem">${ic(it.season ? 'star' : 'bag')}</span>` : st.price ? `<span class="price">${ic('gem')}${st.price}</span>` : ''}</button>`;
    }).join('');
    api.body.innerHTML = `
      <div class="ae-top">
        <div class="ae-preview">${avatarFrontSVG(draft.avatar, { expr: ['happy', 'neutral', 'excited', 'laugh'][exprI % 4] })}</div>
        ${creating ? `<div class="ae-fields">
          <label>${t('channelName')}<input maxlength="18" class="in-channel" placeholder="${t('channelPh')}" value="${esc(draft.channel)}"></label>
          <button class="btn ghost sm rand">${ic('rebirth')} ${t('randomize')}</button></div>` : ''}
      </div>
      <div class="ae-cats">${cats.map(c => `<button class="${c === cat ? 'on' : ''}" data-cat="${c}">${t(c === 'neon' ? 'neon' : c)}</button>`).join('')}</div>
      <div class="ae-grid cat-${cat}">${grid}</div>
      <div class="m-btns"><button class="btn primary done">${creating ? t('start') : t('save')}</button></div>`;
  };
  draw();
  api.body.addEventListener('input', (e) => { if (e.target.classList.contains('in-channel')) draft.channel = e.target.value.replace(/[<>]/g, ''); });
  api.body.addEventListener('click', (e) => {
    const c = e.target.closest('[data-cat]');
    if (c) { cat = c.dataset.cat; sfx.click(); draw(); return; }
    if (e.target.closest('.rand')) {
      const r = randomAvatar();
      r.hair = Math.floor(Math.random() * 4); r.hairColor = Math.floor(Math.random() * 6); r.outfit = Math.floor(Math.random() * 3);
      r.hat = 'none'; r.glasses = 'none';
      Object.assign(draft.avatar, r); exprI++; sfx.pop(); draw(); return;
    }
    const o = e.target.closest('.opt');
    if (o) {
      const raw = o.dataset.v;
      const v = ['hat', 'glasses', 'neck', 'pet', 'theme'].includes(cat) ? raw : +raw;
      const it = itemFor(cat, v);
      const st = unlockState(it, creating);
      if (st.locked) { sfx.error(); toast(ic('lock') + ' ' + st.reason); return; }
      if (st.premium) {
        setVal(draft, cat, v); exprI++; sfx.pop(); draw();
        const inShop = !it.season && G.weeklyShop().some(w => cosmeticKey(w) === cosmeticKey(it));
        if (inShop) {
          confirmBox(`${t('rarity_' + it.rarity)} · ${t('confirmBuyGems', { n: it.price })}`, () => {
            const r = G.buyCosmetic(it);
            if (r === 'cost') { toast(ic('gem') + ' ' + t('notEnough')); return; }
            sfx.levelUp(); const rr = o.getBoundingClientRect(); sparkles(rr.left + rr.width / 2, rr.top + rr.height / 2, 16); draw();
          });
        } else toast(ic(it.season ? 'star' : 'bag') + ' ' + st.reason);
        return;
      }
      if (st.price) {
        confirmBox(t('confirmBuyGems', { n: st.price }), () => {
          if (S.diamonds < st.price) { toast(ic('gem') + ' ' + t('notEnough')); return; }
          S.diamonds -= st.price; S.owned[cosmeticKey(it)] = true;
          setVal(draft, cat, v); sfx.levelUp();
          const r = o.getBoundingClientRect(); sparkles(r.left + r.width / 2, r.top + r.height / 2, 12);
          draw();
        });
        return;
      }
      setVal(draft, cat, v); exprI++; sfx.pop(); draw();
      return;
    }
    if (e.target.closest('.done')) {
      if (creating) {
        const ch = (draft.channel || '').trim();
        if (ch.length < 2) { sfx.error(); const inp = $('.in-channel', api.el); inp.classList.add('shake'); inp.focus(); setTimeout(() => inp.classList.remove('shake'), 400); return; }
        draft.channel = ch;
      }
      // never save an item that is not owned (premium previews)
      for (const c of ['outfit', 'hat', 'glasses']) { const it = itemFor(c, draft.avatar[c]); if (it && it.premium && !S.owned[cosmeticKey(it)]) draft.avatar[c] = S.profile.avatar[c]; }
      for (const c of ['pet', 'theme']) { const it = itemFor(c, draft[c]); if (it && it.premium && !S.owned[cosmeticKey(it)]) draft[c] = S.profile[c] || 'none'; }
      S.profile.avatar = draft.avatar; S.profile.pet = draft.pet; S.profile.theme = draft.theme; S.profile.neonColor = draft.neonColor;
      if (creating) S.profile.channel = draft.channel;
      sfx.buy();
      api.close();
      onDone && onDone();
    }
  });
  return api;
}

