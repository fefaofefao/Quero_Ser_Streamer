// Full-screen particle layer: coins flying to the counter, confetti, sparkles, floating text.
let cv, ctx, W = 0, H = 0, dpr = 1;
const parts = [];
const texts = [];

export function initFx(canvas) {
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => textCache.clear());
  cv = canvas; ctx = cv.getContext('2d');
  const resize = () => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener('resize', resize);
}

function drawCoin(x, y, r, rot) {
  const sx = Math.abs(Math.cos(rot));
  ctx.save(); ctx.translate(x, y); ctx.scale(Math.max(0.25, sx), 1);
  ctx.fillStyle = '#e0a21a'; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill();
  ctx.fillStyle = '#ffc83d'; ctx.beginPath(); ctx.arc(0, 0, r * 0.78, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff3c4'; ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.3, r * 0.22, 0, 7); ctx.fill();
  ctx.restore();
}
function drawGem(x, y, r, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(rot) * 0.3);
  ctx.fillStyle = '#59d8ff'; ctx.beginPath(); ctx.moveTo(-r, -r * 0.3); ctx.lineTo(-r * 0.5, -r); ctx.lineTo(r * 0.5, -r); ctx.lineTo(r, -r * 0.3); ctx.lineTo(0, r); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#b8f0ff'; ctx.beginPath(); ctx.moveTo(-r * 0.5, -r); ctx.lineTo(0, -r * 0.3); ctx.lineTo(-r, -r * 0.3); ctx.fill();
  ctx.restore();
}
function drawStar(x, y, r, rot, c) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = c; ctx.beginPath();
  for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  ctx.fill(); ctx.restore();
}

// Coins that burst out then fly to a target element.
export function coinBurst(x, y, n = 6, target = null, kind = 'coin') {
  const tr = target ? target.getBoundingClientRect() : null;
  const tx = tr ? tr.left + tr.width / 2 : x, ty = tr ? tr.top + tr.height / 2 : y - 200;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, sp = 80 + Math.random() * 160;
    parts.push({ kind, x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 120, life: 0, phase: 0, tx, ty, delay: 0.22 + Math.random() * 0.25, r: 6 + Math.random() * 3, rot: Math.random() * 6 });
  }
}

export function confetti(n = 120, y0 = -10) {
  const cols = ['#ff4f6d', '#ffd23f', '#3ddc97', '#4cc9f0', '#a78bfa', '#ff9f1c', '#fff'];
  for (let i = 0; i < n; i++) {
    parts.push({ kind: 'conf', x: Math.random() * W, y: y0 - Math.random() * H * 0.3, vx: (Math.random() - 0.5) * 80, vy: 80 + Math.random() * 160, life: 0, max: 3 + Math.random() * 2, c: cols[i % cols.length], w: 5 + Math.random() * 6, h: 3 + Math.random() * 4, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 10 });
  }
}

export function sparkles(x, y, n = 10, c = '#ffd23f') {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, sp = 40 + Math.random() * 140;
    parts.push({ kind: 'spark', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: 0.5 + Math.random() * 0.5, c, r: 3 + Math.random() * 5, rot: Math.random() * 6 });
  }
}

export function floatText(x, y, text, color = '#ffd23f', size = 20) {
  texts.push({ x: x + (Math.random() - 0.5) * 30, y, text, color, size, life: 0 });
  if (texts.length > 18) texts.shift();
}

let onArrive = null;
export function setArriveHandler(fn) { onArrive = fn; }

// Floating numbers are drawn once into a small bitmap (outline + fill) and then just blitted.
const textCache = new Map();
function textSprite(text, color, size) {
  const key = text + '|' + color + '|' + size;
  let sp = textCache.get(key);
  if (sp) return sp;
  const scale = dpr * 1.15; // a bit above screen resolution so the pop-in scale stays crisp
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  g.font = `700 ${size}px Fredoka, sans-serif`;
  const w = Math.ceil(g.measureText(text).width + 12), h = Math.ceil(size * 1.6);
  c.width = Math.ceil(w * scale); c.height = Math.ceil(h * scale);
  g.scale(scale, scale);
  g.font = `700 ${size}px Fredoka, sans-serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 5; g.strokeStyle = 'rgba(30,18,60,.85)'; g.lineJoin = 'round';
  g.strokeText(text, w / 2, h / 2); g.fillStyle = color; g.fillText(text, w / 2, h / 2);
  sp = { c, w, h };
  textCache.set(key, sp);
  if (textCache.size > 60) textCache.delete(textCache.keys().next().value);
  return sp;
}

// Only the area painted last frame is cleared (not the whole screen).
let dirty = null, box = null;
const grow = (x, y, r) => {
  if (!box) box = { x0: x - r, y0: y - r, x1: x + r, y1: y + r };
  else { if (x - r < box.x0) box.x0 = x - r; if (y - r < box.y0) box.y0 = y - r; if (x + r > box.x1) box.x1 = x + r; if (y + r > box.y1) box.y1 = y + r; }
};
export function stepFx(dt) {
  if (!ctx) return;
  if (dirty) { ctx.clearRect(dirty.x0 - 2, dirty.y0 - 2, dirty.x1 - dirty.x0 + 4, dirty.y1 - dirty.y0 + 4); dirty = null; }
  if (!parts.length && !texts.length) return;
  box = null;
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.life += dt;
    if (p.kind === 'coin' || p.kind === 'gem') {
      if (p.life < p.delay) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 500 * dt; p.vx *= 0.96; }
      else {
        const k = Math.min(1, (p.life - p.delay) * 2.4);
        const e = k * k;
        p.x += (p.tx - p.x) * e * 0.5; p.y += (p.ty - p.y) * e * 0.5;
        if (Math.hypot(p.tx - p.x, p.ty - p.y) < 12 || p.life > 2) { parts.splice(i, 1); onArrive && onArrive(p.kind); continue; }
      }
      p.rot += dt * 10;
      p.kind === 'coin' ? drawCoin(p.x, p.y, p.r, p.rot) : drawGem(p.x, p.y, p.r, p.rot);
      grow(p.x, p.y, p.r + 2);
    } else if (p.kind === 'conf') {
      p.x += p.vx * dt + Math.sin(p.life * 3 + p.rot) * 0.6; p.y += p.vy * dt; p.rot += p.vr * dt;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(1, Math.cos(p.life * 6 + p.rot));
      ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
      grow(p.x, p.y, Math.max(p.w, p.h));
      if (p.life > p.max || p.y > H + 20) parts.splice(i, 1);
    } else if (p.kind === 'spark') {
      p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.92; p.vy *= 0.92; p.rot += dt * 4;
      ctx.globalAlpha = Math.max(0, 1 - p.life / p.max);
      drawStar(p.x, p.y, p.r * (1 - p.life / p.max * 0.5), p.rot, p.c);
      ctx.globalAlpha = 1;
      grow(p.x, p.y, p.r + 2);
      if (p.life > p.max) parts.splice(i, 1);
    }
  }
  for (let i = texts.length - 1; i >= 0; i--) {
    const tx = texts[i];
    tx.life += dt;
    const k = tx.life / 1.1;
    if (k >= 1) { texts.splice(i, 1); continue; }
    const sc = k < 0.15 ? 0.6 + k / 0.15 * 0.5 : 1.1 - Math.min(0.1, (k - 0.15));
    const sp = textSprite(tx.text, tx.color, tx.size);
    const cx = tx.x, cy = tx.y - k * 60 - tx.size * 0.35; // same baseline position as before
    const w = sp.w * sc, h = sp.h * sc;
    ctx.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
    ctx.drawImage(sp.c, cx - w / 2, cy - h / 2, w, h);
    grow(cx, cy, Math.max(w, h) / 2 + 2);
  }
  ctx.globalAlpha = 1;
  dirty = box;
}

export function fxBusy() { return parts.length + texts.length; }
