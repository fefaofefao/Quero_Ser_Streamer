// Content tables: chat lines, cosmetics, achievements, missions, rewards, products.
import { HAIR_STYLES, HAIR_COLORS, OUTFITS, HATS, GLASSES, NECKS } from './art/avatar.js';

const NAME_A = ['Pedro', 'Lu', 'Gabi', 'Rafa', 'Duda', 'Leo', 'Bia', 'Theo', 'Mari', 'Caio', 'Nina', 'Davi', 'Juju', 'Enzo', 'Lia', 'Bento', 'Malu', 'Gui', 'Yasmin', 'Kauã', 'Sofi', 'Tito', 'Vini', 'Isa', 'Joca', 'Nanda', 'Zeca', 'Lola'];
const NAME_B = ['Gamer', 'GG', '_77', 'Pro', 'XD', 'zinho', '2010', 'Craft', 'Noob', 'BR', 'TTV', 'Kid', 'Max', '_oficial', 'Plays', '99', 'Ninja', 'Zika', 'Top', 'Lindo'];
export function randomUser() {
  return NAME_A[Math.floor(Math.random() * NAME_A.length)] + NAME_B[Math.floor(Math.random() * NAME_B.length)];
}
export const USER_COLORS = ['#ff6b9d', '#4cc9f0', '#ffd23f', '#7cf55a', '#c084fc', '#fb923c', '#38bdf8', '#f472b6'];

export const CHAT = {
  pt: {
    any: ['KKKKKKK', 'boa noite chat!', 'primeira vez aqui, curti', 'manda salve pro {u}!', 'que jogada!!', 'GG', 'a vovó tá assistindo? ❤️', 'esse PC aguenta? kkk', 'lenda', 'clipa isso!!', 'qual o mouse?', 'POG', 'vem live amanhã?', 'tô no ônibus assistindo', 'sigam o canal!', 'esse cara é bom demais', 'hype hype hype', '❤️❤️❤️', 'eita', 'que isso mano', 'faz o L', 'chat tá voando', 'cadê o lanche?', 'salve do RS!', 'salve do Nordeste!', 'oi mãe tô na live', 'top 1 do mundo em breve', 'contrata ele logo', 'meu streamer favorito', 'o som tá ótimo hoje'],
    early: ['o monitor de tubo é raiz', 'esse mouse de bolinha kkkk', 'tá travando um pouco', 'dá pra ouvir o cooler daqui', 'cadeira de praia é estilo', 'só nós 3 aqui kkk'],
    late: ['mansão absurda', 'o setup tá surreal', 'chegou de jatinho?', 'manda um alô pros 100 mil!', 'virou celebridade', 'esse estúdio é de cinema'],
    hype: ['HYPEEEE', 'AAAAAAA', 'BORAAAA', '🔥🔥🔥', 'NÃO ACREDITO', 'MONSTRO'],
  },
  en: {
    any: ['LMAO', 'hi chat!', 'first time here, love it', 'shoutout to {u}!', 'what a play!!', 'GG', 'is grandma watching? ❤️', 'can that PC handle it? lol', 'legend', 'clip that!!', 'which mouse is that?', 'POG', 'stream tomorrow?', 'watching on the bus', 'follow the channel!', 'this streamer is too good', 'hype hype hype', '❤️❤️❤️', 'whoa', 'no way bro', 'chat is flying', 'where are the snacks?', 'hello from Texas!', 'hi mom im on stream', 'world #1 soon', 'someone sign this streamer', 'my favorite streamer', 'audio sounds great today'],
    early: ['CRT monitor is old school', 'that ball mouse lol', 'a bit laggy', 'I can hear the fan from here', 'beach chair is a vibe', 'just 3 of us here lol'],
    late: ['that mansion is insane', 'setup is unreal', 'did you fly a jet here?', 'shoutout to the 100k!', 'a real celebrity now', 'movie-level studio'],
    hype: ['HYPEEEE', 'AAAAAAA', 'LETS GOOO', '🔥🔥🔥', 'NO WAY', 'BEAST'],
  },
  es: {
    any: ['JAJAJAJA', '¡hola chat!', 'primera vez aquí, me gusta', '¡saludos para {u}!', '¡qué jugada!', 'GG', '¿la abuela está mirando? ❤️', '¿esa PC aguanta? jaja', 'leyenda', '¡clipéalo!', '¿qué mouse es?', 'POG', '¿directo mañana?', 'mirando en el bus', '¡sigan el canal!', 'qué bueno es', 'hype hype hype', '❤️❤️❤️', 'uff', 'no puede ser', 'el chat vuela', '¿y los snacks?', '¡saludos desde México!', 'hola mamá estoy en el directo', 'top 1 del mundo pronto', 'contrátenlo ya', 'mi streamer favorito', 'el audio suena genial'],
    early: ['el monitor de tubo es de culto', 'ese mouse de bolita jaja', 'se traba un poco', 'se escucha el ventilador', 'la silla de playa tiene estilo', 'solo somos 3 jaja'],
    late: ['qué mansión', 'el setup es irreal', '¿llegaste en jet?', '¡saludos a los 100 mil!', 'ya eres celebridad', 'estudio de cine'],
    hype: ['HYPEEEE', 'AAAAAAA', 'VAMOOOS', '🔥🔥🔥', 'NO PUEDE SER', 'BESTIA'],
  },
};

// Fictional streamers for the world ranking.
export const RIVALS = ['Xandão Gamer', 'LadyPixel', 'Tio Turbo', 'MegaMago', 'Nanda Clutch', 'ZeroLag', 'Capitã Cubo', 'Bolinha TV', 'Furacão99', 'Mestre Moba', 'Gigi Speedrun', 'Doutor Headshot', 'Pipoca Plays', 'Rainha do Lag', 'Zé Combo'];

// ---------- Cosmetics ----------
// req: { rank } or { house }; price in diamonds (0 = free once unlocked)
export function cosmeticCatalog() {
  const items = [];
  HAIR_STYLES.forEach((id, i) => items.push({ cat: 'hair', value: i, price: i < 4 ? 0 : [60, 60, 80, 90, 90, 100, 120, 120][i - 4], req: i < 4 ? null : { rank: [400000, 200000, 100000, 50000, 20000, 10000, 5000, 2000][i - 4] } }));
  HAIR_COLORS.forEach((c, i) => items.push({ cat: 'hairColor', value: i, price: i < 6 ? 0 : 50, req: i < 6 ? null : { rank: [300000, 150000, 80000, 30000, 10000, 3000][i - 6] } }));
  OUTFITS.slice(0, 8).forEach((id, i) => items.push({ cat: 'outfit', value: i, price: [0, 0, 0, 80, 120, 150, 250, 400][i], req: i < 3 ? null : { rank: [0, 0, 0, 300000, 100000, 20000, 2000, 100][i] } }));
  HATS.slice(0, 8).forEach((id, i) => items.push({ cat: 'hat', value: id, price: [0, 40, 60, 60, 70, 150, 80, 1000][i], req: i === 0 ? null : { rank: [0, 450000, 250000, 250000, 120000, 30000, 60000, 1][i] } }));
  GLASSES.slice(0, 5).forEach((id, i) => items.push({ cat: 'glasses', value: id, price: [0, 40, 40, 80, 200][i], req: i === 0 ? null : { rank: [0, 350000, 350000, 40000, 1000][i] } }));
  NECKS.forEach((id, i) => items.push({ cat: 'neck', value: id, price: [0, 150, 300, 60][i], req: i === 0 ? null : { rank: [0, 8000, 500, 150000][i] } }));
  ['none', 'hamster', 'cat', 'dog', 'parrot'].forEach((id, i) => items.push({ cat: 'pet', value: id, price: [0, 120, 200, 200, 300][i], req: i === 0 ? null : { house: [0, 1, 1, 2, 3][i] } }));
  [0, 1, 2, 3].forEach(i => items.push({ cat: 'neon', value: i, price: i ? 50 : 0, req: { house: 3 } }));
  items.push({ cat: 'theme', value: 'none', price: 0, req: null });
  return items.concat(premiumCatalog());
}

// Premium cosmetics: sold only in the weekly shop (or as season pass rewards).
export const RARITY = { common: 300, rare: 500, epic: 800, legendary: 1200 };
export const RARITY_ORDER = ['common', 'rare', 'epic', 'legendary'];
const PREMIUM = [
  ['outfit', 'racer', 'common'], ['glasses', 'heart', 'common'], ['hat', 'bunnyset', 'common'], ['theme', 'sakura', 'common'],
  ['outfit', 'varsity', 'rare'], ['glasses', 'visor', 'rare'], ['pet', 'penguin', 'rare'], ['theme', 'snow', 'rare'],
  ['outfit', 'neonhood', 'epic'], ['hat', 'vr', 'epic'], ['pet', 'robot', 'epic'], ['theme', 'neoncity', 'epic'],
  ['outfit', 'astro', 'legendary'], ['hat', 'goldset', 'legendary'], ['pet', 'dragon', 'legendary'], ['theme', 'galaxy', 'legendary'],
];
// Season pass exclusives, one per season (cycling).
export const SEASON_ITEMS = [['outfit', 'champion'], ['theme', 'fireworks']];
let premCache = null;
export function premiumCatalog() {
  if (premCache) return premCache;
  const val = (cat, id) => cat === 'outfit' ? OUTFITS.indexOf(id) : id;
  premCache = PREMIUM.map(([cat, id, rarity]) => ({ cat, value: val(cat, id), id, rarity, price: RARITY[rarity], premium: true }))
    .concat(SEASON_ITEMS.map(([cat, id]) => ({ cat, value: val(cat, id), id, rarity: 'legendary', price: 0, premium: true, season: true })));
  return premCache;
}

// ---------- Diamond shop (repeatable) ----------
export const GEM_SHOP = [
  { id: 'pass', gems: 30, perDay: 3 },                 // extra autograph pass
  { id: 'x3', gems: 60, min: 60, maxMin: 240 },        // Gold x3 for 1 hour (stacks up to 4h)
  { id: 'viral', gems: 40, min: 5, mult: 10 },         // viral clip: x10 for 5 minutes
];

// ---------- Season pass ----------
export const SEASON = {
  epoch: Date.UTC(2026, 9, 1), days: 30, tiers: 30, xpPerTier: 500,
  xp: { mission: 100, chest: 150, event: 60, login: 50, weekly: 100 },
};
// Reward for tier i (1..30) on a track ('free' | 'prem').
export function seasonTier(i, track, seasonId = 0) {
  if (track === 'free') {
    if (i % 5 === 0) return { gems: 10 };
    if (i % 3 === 0) return { boostMin: 30 };
    return { goldMin: 20 + i * 2 };
  }
  if (i === SEASON.tiers) { const [cat, id] = SEASON_ITEMS[seasonId % SEASON_ITEMS.length]; const it = premiumCatalog().find(x => x.season && x.cat === cat && x.id === id); return { item: cosmeticKey(it), gems: 200 }; }
  if (i % 5 === 0) return { gems: 100 };
  if (i % 4 === 0) return { pass: 1 };
  if (i % 3 === 0) return { goldMin: 120 };
  return { gems: 30 };
}

export function cosmeticKey(it) { return it.cat + ':' + it.value; }

// ---------- Achievements ----------
// Each has a stat getter key and tiers; reward diamonds.
export const ACHIEVEMENTS = [
  { id: 'taps', stat: 'taps', tiers: [100, 1000, 10000, 50000, 200000], gems: [5, 10, 20, 40, 80] },
  { id: 'upgrades', stat: 'upgrades', tiers: [10, 100, 1000, 5000, 20000], gems: [5, 10, 25, 50, 100] },
  { id: 'signed', stat: 'signed', tiers: [10, 100, 500, 2000, 8000], gems: [5, 15, 30, 60, 120] },
  { id: 'events', stat: 'events', tiers: [1, 10, 50, 150, 400], gems: [5, 15, 30, 60, 120] },
  { id: 'clips', stat: 'clips', tiers: [1, 10, 50, 200, 600], gems: [5, 10, 25, 50, 100] },
  { id: 'rebirths', stat: 'rebirths', tiers: [1, 5, 10, 25, 50], gems: [20, 40, 60, 100, 200] },
  { id: 'missions', stat: 'missions', tiers: [10, 50, 150, 300, 600], gems: [10, 25, 50, 80, 150] },
  { id: 'login', stat: 'days', tiers: [3, 7, 30, 60, 120], gems: [10, 20, 50, 100, 200] },
  { id: 'equip', stat: 'maxedGear', tiers: [1, 3, 6], gems: [50, 100, 250] },
  { id: 'gold', stat: 'goldAll', tiers: [1e6, 1e12, 1e18, 1e24, 1e30], gems: [10, 20, 40, 80, 160], big: true },
  { id: 'rank', stat: 'rankInv', tiers: [100000, 10000, 1000, 100, 10, 1], gems: [10, 20, 40, 80, 150, 500], rank: true },
  { id: 'market', stat: 'maxMarket', tiers: [1, 2, 3, 4, 5, 6, 7], gems: [5, 10, 15, 25, 40, 60, 100], market: true },
  { id: 'house', stat: 'house', tiers: [1, 2, 3, 4], gems: [25, 50, 100, 200], house: true },
];

// ---------- Missions ----------
export const MISSION_POOL = [
  { id: 'taps', base: 150 },
  { id: 'upgrades', base: 15 },
  { id: 'community', base: 8 },
  { id: 'event', base: 1 },
  { id: 'signed', base: 20 },
  { id: 'clips', base: 2 },
  { id: 'gold', base: 600, rel: true }, // seconds of gold/s
  { id: 'play', base: 5 },
  { id: 'equip', base: 1, gear: true },
];
// Diamond faucets. Live-tunable from Remote Config ("game_config" -> "eco").
export const ECO = {
  missionGems: 5,
  chestGems: 10,
  weeklyGems: [20, 40, 80],
  achMult: 0.5,       // achievements pay half of the table below
  adGems: 5,          // diamonds per rewarded ad in the shop
  adGemsPerDay: 5,
  piggyMax: 900,
  piggyRate: 0.25,    // share of earned diamonds that also drops in the piggy bank
  firstBuyMult: 2,    // first purchase of each diamond pack
};
export const WEEKLY_TIERS = [{ n: 7 }, { n: 14 }, { n: 21 }];
export const weeklyGems = (i) => ECO.weeklyGems[i] || 0;
export const achGems = (a, tier) => Math.max(1, Math.round(a.gems[tier] * ECO.achMult));

// ---------- Daily login (7-day cycle) ----------
export const LOGIN_REWARDS = [
  { gems: 10 },
  { goldMin: 30 },
  { gems: 15 },
  { goldMin: 60 },
  { gems: 25 },
  { boostMin: 60 },
  { gems: 60 },
];

// ---------- Store products (IDs to create in Play Console) ----------
export const PRODUCTS = [
  { id: 'starter_pack', kind: 'inapp', special: 'starter', price: 'R$ 4,99' },
  { id: 'remove_ads', kind: 'inapp', special: 'removeAds', price: 'R$ 19,90' },
  { id: 'gold_boost', kind: 'inapp', special: 'goldBoost', price: 'R$ 24,90' },
  { id: 'monthly_pass', kind: 'subs', special: 'monthly', price: 'R$ 14,90/mês' },
  { id: 'piggy_bank', kind: 'inapp', consumable: true, special: 'piggy', price: 'R$ 9,90' },
  { id: 'gems_small', kind: 'inapp', consumable: true, gems: 120, price: 'R$ 4,99' },
  { id: 'gems_medium', kind: 'inapp', consumable: true, gems: 650, price: 'R$ 19,90', tag: 'popular' },
  { id: 'gems_large', kind: 'inapp', consumable: true, gems: 1400, price: 'R$ 39,90' },
  { id: 'gems_huge', kind: 'inapp', consumable: true, gems: 3000, price: 'R$ 79,90' },
  { id: 'gems_mega', kind: 'inapp', consumable: true, gems: 8000, price: 'R$ 179,90', tag: 'best' },
  { id: 'passe_temporada', kind: 'inapp', consumable: true, special: 'season', price: 'R$ 19,90' },
];
export const PIGGY_MIN_BREAK = 300;
export const AD_BOOST_MIN = 30;
export const AD_BOOST_MAX_MIN = 240;
export const TIME_WARPS = [{ h: 1, gems: 25 }, { h: 4, gems: 80 }, { h: 12, gems: 200 }];

// Rank thresholds that hang a plaque on the wall.
export const PLAQUES = [{ rank: 100000, id: 'silver' }, { rank: 10000, id: 'gold' }, { rank: 1000, id: 'diamond' }, { rank: 100, id: 'ruby' }, { rank: 1, id: 'legend' }];
