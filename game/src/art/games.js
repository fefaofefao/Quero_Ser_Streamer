// Animated "gameplay" shown on the streamer's monitor. One renderer per market.
// Each renderer draws into a canvas context in a fixed 320x180 logical space.

export const GW = 320, GH = 180;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

// ---------- 1. BlocoCai (falling blocks) ----------
function blococai() {
  const COLS = 10, ROWS = 18, C = 9;
  const colors = ['#ff5e7e', '#ffd23f', '#3ddc97', '#4cc9f0', '#a06cd5', '#ff9f1c', '#f15bb5'];
  const shapes = [[[0, 0], [1, 0], [2, 0], [3, 0]], [[0, 0], [1, 0], [0, 1], [1, 1]], [[0, 0], [1, 0], [2, 0], [1, 1]], [[0, 0], [0, 1], [1, 1], [2, 1]], [[2, 0], [0, 1], [1, 1], [2, 1]], [[1, 0], [2, 0], [0, 1], [1, 1]], [[0, 0], [1, 0], [1, 1], [2, 1]]];
  let grid, piece, timer = 0, score = 0, clearing = [], clearT = 0, lines = 0;
  const reset = () => { grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null)); };
  reset();
  const fits = (p, dx, dy) => p.cells.every(([x, y]) => { const nx = p.x + x + dx, ny = p.y + y + dy; return nx >= 0 && nx < COLS && ny < ROWS && (ny < 0 || !grid[ny][nx]); });
  const spawn = () => {
    const i = Math.floor(Math.random() * shapes.length);
    // pick the column where the piece lands lowest (cheap "AI")
    let best = 0, bestY = -1;
    for (let x = 0; x <= COLS - 4; x++) {
      const p = { cells: shapes[i], x, y: 0 };
      if (!fits(p, 0, 0)) continue;
      let y = 0; while (fits(p, 0, y + 1)) y++;
      const score = y + Math.random() * 2;
      if (score > bestY) { bestY = score; best = x; }
    }
    piece = { cells: shapes[i], x: Math.floor(Math.random() * 6), tx: best, y: -1, c: colors[i] };
    if (!fits(piece, 0, 1)) reset();
  };
  spawn();
  return (ctx, dt, hype) => {
    const speed = hype ? 0.035 : 0.07;
    timer += dt;
    if (clearing.length) {
      clearT += dt;
      if (clearT > 0.35) { for (const r of clearing) { grid.splice(r, 1); grid.unshift(Array(COLS).fill(null)); } clearing = []; clearT = 0; }
    } else if (timer > speed) {
      timer = 0;
      if (piece.x < piece.tx && fits(piece, 1, 0)) piece.x++;
      else if (piece.x > piece.tx && fits(piece, -1, 0)) piece.x--;
      if (fits(piece, 0, 1)) piece.y++;
      else {
        for (const [x, y] of piece.cells) if (piece.y + y >= 0) grid[piece.y + y][piece.x + x] = piece.c;
        for (let r = 0; r < ROWS; r++) if (grid[r].every(Boolean)) clearing.push(r);
        if (clearing.length) { score += clearing.length * 100; lines += clearing.length; }
        score += 10;
        spawn();
      }
    }
    const g = ctx.createLinearGradient(0, 0, 0, GH);
    g.addColorStop(0, '#1b1446'); g.addColorStop(1, '#3a1f6e');
    ctx.fillStyle = g; ctx.fillRect(0, 0, GW, GH);
    for (let i = 0; i < 20; i++) { ctx.fillStyle = `rgba(255,255,255,${0.15 + (i % 3) * 0.1})`; ctx.fillRect((i * 53) % GW, (i * 37 + performance.now() / 80) % GH, 1.6, 1.6); }
    const ox = 115, oy = 9;
    ctx.fillStyle = 'rgba(0,0,0,.45)'; rr(ctx, ox - 4, oy - 4, COLS * C + 8, ROWS * C + 8, 4); ctx.fill();
    const cell = (x, y, c, a = 1) => {
      ctx.globalAlpha = a;
      ctx.fillStyle = c; rr(ctx, ox + x * C + 0.5, oy + y * C + 0.5, C - 1, C - 1, 1.6); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(ox + x * C + 1.5, oy + y * C + 1.5, C - 4, 2);
      ctx.globalAlpha = 1;
    };
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (grid[y][x]) cell(x, y, clearing.includes(y) ? '#fff' : grid[y][x], clearing.includes(y) ? 1 - clearT * 2 : 1);
    for (const [x, y] of piece.cells) if (piece.y + y >= 0) cell(piece.x + x, piece.y + y, piece.c);
    ctx.fillStyle = '#fff'; ctx.font = '700 11px Fredoka'; ctx.fillText('SCORE', 230, 30);
    ctx.fillStyle = '#ffd23f'; ctx.font = '700 15px Fredoka'; ctx.fillText(String(score).padStart(6, '0'), 230, 48);
    ctx.fillStyle = '#fff'; ctx.font = '700 11px Fredoka'; ctx.fillText('LINHAS ' + lines, 230, 70);
    ctx.fillStyle = '#a5b4fc'; ctx.font = '700 16px Fredoka'; ctx.fillText('BLOCO', 24, 40); ctx.fillStyle = '#f472b6'; ctx.fillText('CAI', 36, 58);
  };
}

// ---------- 2. Pulo Pixel (platformer) ----------
function pulopixel() {
  let x = 0, vy = 0, py = 0, onGround = true, coins = 0, t = 0;
  const ground = 140;
  const gaps = [];
  for (let i = 0; i < 12; i++) gaps.push({ x: 200 + i * 160 + rnd(0, 60), w: rnd(26, 40), coin: true, enemy: Math.random() < 0.5 });
  return (ctx, dt, hype) => {
    const sp = (hype ? 150 : 90) * dt;
    x += sp; t += dt;
    const sx = 80;
    const near = gaps.find(g => g.x - x > 30 && g.x - x < 30 + sp * 3 + 20);
    if (onGround && near) { vy = -230; onGround = false; }
    vy += 600 * dt; py += vy * dt;
    if (py >= 0) { py = 0; vy = 0; onGround = true; }
    for (const g of gaps) if (g.x - x < -100) { g.x += 160 * 12; g.coin = true; g.enemy = Math.random() < 0.5; }
    const sky = ctx.createLinearGradient(0, 0, 0, GH); sky.addColorStop(0, '#5ec8ff'); sky.addColorStop(1, '#c7f0ff');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, GW, GH);
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 4; i++) { const cx = ((i * 120 - x * 0.2) % 480 + 480) % 480 - 40; ctx.beginPath(); ctx.ellipse(cx, 30 + i * 9, 22, 9, 0, 0, 7); ctx.ellipse(cx + 16, 25 + i * 9, 14, 9, 0, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#56c271';
    for (let i = 0; i < 4; i++) { const hx = ((i * 140 - x * 0.45) % 560 + 560) % 560 - 70; ctx.beginPath(); ctx.ellipse(hx, ground + 10, 70, 46, 0, Math.PI, 0); ctx.fill(); }
    // ground with gaps
    ctx.fillStyle = '#8d5524';
    let gx = -((x) % 32);
    for (; gx < GW; gx += 16) {
      const wx = gx + x;
      const inGap = gaps.some(g => wx > g.x && wx < g.x + g.w);
      if (inGap) continue;
      ctx.fillStyle = '#8d5524'; ctx.fillRect(gx, ground, 16, GH - ground);
      ctx.fillStyle = '#4caf50'; ctx.fillRect(gx, ground, 16, 6);
      ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fillRect(gx + 15, ground + 6, 1, GH);
    }
    for (const g of gaps) {
      const gxs = g.x - x;
      if (g.coin) {
        const cy = ground - 50 + Math.sin(t * 5 + g.x) * 3;
        if (Math.abs(gxs + g.w / 2 - sx) < 10 && py < -30) { g.coin = false; coins++; }
        ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.ellipse(gxs + g.w / 2, cy, 5 * Math.abs(Math.cos(t * 4)) + 1, 6, 0, 0, 7); ctx.fill();
      }
      if (g.enemy) {
        const ex = gxs + g.w + 60 + Math.sin(t * 2 + g.x) * 14;
        ctx.fillStyle = '#9b5de5'; ctx.beginPath(); ctx.ellipse(ex, ground - 7, 9, 8, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(ex - 9, ground - 7, 18, 6);
        ctx.fillStyle = '#fff'; ctx.fillRect(ex - 5, ground - 11, 3, 4); ctx.fillRect(ex + 2, ground - 11, 3, 4);
      }
    }
    // hero
    const hy = ground + py;
    ctx.save(); ctx.translate(sx, hy);
    ctx.fillStyle = '#ef476f'; rr(ctx, -7, -22, 14, 14, 4); ctx.fill();
    ctx.fillStyle = '#ffd6a5'; ctx.beginPath(); ctx.arc(0, -27, 7, 0, 7); ctx.fill();
    ctx.fillStyle = '#ef476f'; ctx.fillRect(-8, -35, 16, 5); ctx.fillRect(0, -32, 10, 3);
    ctx.fillStyle = '#073b4c'; ctx.fillRect(2, -29, 2, 3);
    const leg = onGround ? Math.sin(t * 18) * 3 : 2;
    ctx.fillStyle = '#118ab2'; ctx.fillRect(-6, -8, 5, 8 + leg); ctx.fillRect(1, -8, 5, 8 - leg);
    ctx.restore();
    ctx.fillStyle = '#fff'; ctx.font = '700 12px Fredoka'; ctx.fillText('🪙 x' + coins, 10, 18);
    ctx.fillText('MUNDO 1-' + (1 + Math.floor(x / 2000) % 4), 230, 18);
  };
}

// ---------- 3. Gol Total (soccer, top view) ----------
function goltotal() {
  const players = [];
  for (let i = 0; i < 5; i++) players.push({ team: 0, x: rnd(40, 150), y: rnd(30, 150), tx: 0, ty: 0 });
  for (let i = 0; i < 5; i++) players.push({ team: 1, x: rnd(170, 280), y: rnd(30, 150), tx: 0, ty: 0 });
  let ball = { x: 160, y: 90, vx: 0, vy: 0 }, score = [0, 0], goalT = 0, clock = 0;
  return (ctx, dt, hype) => {
    clock += dt * (hype ? 2 : 1);
    for (const p of players) {
      const d = Math.hypot(ball.x - p.x, ball.y - p.y);
      const sp = (hype ? 70 : 45) * dt;
      p.x += (ball.x - p.x) / (d + 1) * sp * (p.team ? 0.95 : 1) + rnd(-0.4, 0.4);
      p.y += (ball.y - p.y) / (d + 1) * sp + rnd(-0.4, 0.4);
      if (d < 8) { const dir = p.team ? -1 : 1; ball.vx = dir * rnd(90, 170); ball.vy = rnd(-70, 70); }
    }
    ball.x += ball.vx * dt; ball.y += ball.vy * dt; ball.vx *= 0.985; ball.vy *= 0.985;
    if (ball.y < 14 || ball.y > 166) ball.vy *= -1;
    if (ball.x < 12 || ball.x > 308) {
      if (ball.y > 68 && ball.y < 112) { score[ball.x < 12 ? 1 : 0]++; goalT = 1.6; }
      ball = { x: 160, y: 90, vx: 0, vy: 0 };
    }
    for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? '#2e9e4f' : '#33ad57'; ctx.fillRect(i * 40, 0, 40, GH); }
    ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 2;
    ctx.strokeRect(8, 8, 304, 164); ctx.beginPath(); ctx.moveTo(160, 8); ctx.lineTo(160, 172); ctx.stroke();
    ctx.beginPath(); ctx.arc(160, 90, 22, 0, 7); ctx.stroke();
    ctx.strokeRect(8, 56, 30, 68); ctx.strokeRect(282, 56, 30, 68);
    ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(2, 70, 6, 40); ctx.fillRect(312, 70, 6, 40);
    for (const p of players) {
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(p.x + 1.5, p.y + 2, 6, 4, 0, 0, 7); ctx.fill();
      ctx.fillStyle = p.team ? '#ef476f' : '#ffd23f'; ctx.beginPath(); ctx.arc(p.x, p.y, 5.5, 0, 7); ctx.fill();
      ctx.strokeStyle = '#1b1b2f'; ctx.lineWidth = 1.2; ctx.stroke();
    }
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ball.x, ball.y, 3.2, 0, 7); ctx.fill(); ctx.strokeStyle = '#222'; ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,.55)'; rr(ctx, 110, 4, 100, 18, 6); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '700 12px Fredoka'; ctx.textAlign = 'center';
    ctx.fillText(`AMA ${score[0]} x ${score[1]} VER   ${String(Math.floor(clock / 2) % 90).padStart(2, '0')}'`, 160, 17);
    if (goalT > 0) {
      goalT -= dt;
      ctx.font = '700 34px Fredoka'; ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = '#1b1b2f'; ctx.lineWidth = 5;
      const sc = 1 + Math.sin(goalT * 10) * 0.08;
      ctx.save(); ctx.translate(160, 100); ctx.scale(sc, sc); ctx.strokeText('GOOOL!', 0, 0); ctx.fillText('GOOOL!', 0, 0); ctx.restore();
    }
    ctx.textAlign = 'left';
  };
}

// ---------- 4. CuboCraft (block building / survival) ----------
function cubocraft() {
  const B = 12;
  let cols = [];
  const gen = (i) => 7 + Math.round(Math.sin(i * 0.4) * 1.5 + Math.sin(i * 0.13) * 2);
  let off = 0, t = 0, mining = 0;
  return (ctx, dt, hype) => {
    t += dt; off += dt * (hype ? 26 : 12);
    const day = (Math.sin(t * 0.08) + 1) / 2;
    const sky = ctx.createLinearGradient(0, 0, 0, GH);
    sky.addColorStop(0, `rgb(${40 + 80 * day},${60 + 140 * day},${120 + 120 * day})`); sky.addColorStop(1, `rgb(${120 + 100 * day},${160 + 80 * day},${220})`);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, GW, GH);
    ctx.fillStyle = day > 0.4 ? '#fff6a5' : '#f1f5ff'; ctx.fillRect(250, 22, 18, 18);
    const first = Math.floor(off / B);
    for (let c = 0; c < GW / B + 2; c++) {
      const i = first + c, h = gen(i), x = c * B - (off % B);
      for (let r = 0; r < h; r++) {
        const y = GH - (r + 1) * B;
        let col = r === h - 1 ? '#5dbb4f' : r > h - 4 ? '#8b5a2b' : '#7d7d85';
        if (r < h - 4 && (i * 7 + r * 13) % 17 === 0) col = '#5ec8e5';
        if (r < h - 4 && (i * 5 + r * 11) % 23 === 0) col = '#e9c46a';
        ctx.fillStyle = col; ctx.fillRect(x, y, B, B);
        ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(x, y + B - 2, B, 2); ctx.fillRect(x + B - 2, y, 2, B);
        if (r === h - 1) { ctx.fillStyle = '#7fd36b'; ctx.fillRect(x, y, B, 3); }
      }
      if ((i * 31) % 13 === 0) { // tree
        const y = GH - h * B;
        ctx.fillStyle = '#6b4423'; ctx.fillRect(x + 4, y - 30, 5, 30);
        ctx.fillStyle = '#2f9e44'; ctx.fillRect(x - 8, y - 46, 28, 20);
      }
    }
    const px = 90, ph = gen(Math.floor((off + px) / B)), py = GH - ph * B;
    mining += dt;
    ctx.fillStyle = '#4cc9f0'; ctx.fillRect(px - 5, py - 16, 10, 10);
    ctx.fillStyle = '#2b2d42'; ctx.fillRect(px - 5, py - 6, 10, 6);
    ctx.fillStyle = '#f1c27d'; ctx.fillRect(px - 5, py - 26, 10, 10);
    ctx.fillStyle = '#4a2c1d'; ctx.fillRect(px - 5, py - 26, 10, 3);
    ctx.save(); ctx.translate(px + 7, py - 14); ctx.rotate(Math.sin(mining * 12) * 0.8);
    ctx.fillStyle = '#8b5a2b'; ctx.fillRect(0, -1, 10, 2); ctx.fillStyle = '#adb5bd'; ctx.fillRect(8, -5, 3, 10); ctx.restore();
    for (let i = 0; i < 4; i++) { ctx.fillStyle = '#c9a66b'; ctx.fillRect(px + 16 + Math.sin(mining * 9 + i) * 6, py - 6 - ((mining * 30 + i * 7) % 14), 2, 2); }
    ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(100, 160, 120, 16);
    for (let i = 0; i < 9; i++) { ctx.strokeStyle = i === 2 ? '#fff' : 'rgba(255,255,255,.4)'; ctx.strokeRect(101 + i * 13, 161, 12, 14); }
    ['#7d7d85', '#8b5a2b', '#e9c46a', '#5ec8e5', '#5dbb4f'].forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(104 + i * 13, 164, 6, 8); });
    for (let i = 0; i < 10; i++) { ctx.fillStyle = '#ef233c'; ctx.fillRect(100 + i * 9, 150, 6, 6); }
  };
}

// ---------- 5. Turbo Racha (pseudo 3D racer) ----------
function turbo() {
  let z = 0, curve = 0, tc = 0, t = 0, pos = 1;
  const cars = Array.from({ length: 4 }, (_, i) => ({ z: 200 + i * 300, lane: rnd(-0.6, 0.6), c: pick(['#ffd23f', '#4cc9f0', '#06d6a0', '#f15bb5']) }));
  return (ctx, dt, hype) => {
    const sp = hype ? 520 : 320;
    z += sp * dt; t += dt;
    if (Math.random() < 0.01) tc = rnd(-1, 1);
    curve += (tc - curve) * dt * 0.8;
    const hor = 70;
    const sky = ctx.createLinearGradient(0, 0, 0, hor); sky.addColorStop(0, '#ff7e5f'); sky.addColorStop(1, '#feb47b');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, GW, hor);
    ctx.fillStyle = '#6a4c93';
    ctx.beginPath(); ctx.moveTo(0, hor); for (let i = 0; i <= 8; i++) ctx.lineTo(i * 40 - curve * 30, hor - 18 - (i % 3) * 10); ctx.lineTo(GW, hor); ctx.fill();
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(160 - curve * 50, hor - 6, 14, Math.PI, 0); ctx.fill();
    for (let y = hor; y < GH; y += 2) {
      const p = (y - hor) / (GH - hor);
      const w = 20 + p * 260;
      const cx = 160 + curve * (1 - p) * (1 - p) * 120;
      const stripe = Math.floor((1 / (p + 0.05)) * 6 + z / 40) % 2;
      ctx.fillStyle = stripe ? '#3fae5a' : '#36a150'; ctx.fillRect(0, y, GW, 2);
      ctx.fillStyle = stripe ? '#ef476f' : '#fff'; ctx.fillRect(cx - w / 2 - p * 14, y, p * 14, 2); ctx.fillRect(cx + w / 2, y, p * 14, 2);
      ctx.fillStyle = '#525866'; ctx.fillRect(cx - w / 2, y, w, 2);
      if (stripe) { ctx.fillStyle = '#fff'; ctx.fillRect(cx - p * 2, y, p * 4, 2); }
    }
    for (const c of cars) {
      c.z -= (sp - 220) * dt;
      if (c.z < -40) { c.z = 1100; c.lane = rnd(-0.6, 0.6); pos = Math.max(1, pos - 1); }
      if (c.z > 1200) c.z = -30;
      const p = Math.max(0.02, Math.min(1, 1 - c.z / 1100));
      const y = hor + p * p * (GH - hor);
      const w = 20 + p * p * 260;
      const cx = 160 + curve * (1 - p * p) * (1 - p * p) * 120 + c.lane * w / 2;
      const s = p * p * 1.3;
      if (s < 0.05) continue;
      ctx.fillStyle = c.c; rr(ctx, cx - 16 * s, y - 14 * s, 32 * s, 12 * s, 3 * s); ctx.fill();
      ctx.fillStyle = '#1b1b2f'; ctx.fillRect(cx - 14 * s, y - 3 * s, 8 * s, 4 * s); ctx.fillRect(cx + 6 * s, y - 3 * s, 8 * s, 4 * s);
      ctx.fillStyle = '#ff595e'; ctx.fillRect(cx - 14 * s, y - 10 * s, 5 * s, 3 * s); ctx.fillRect(cx + 9 * s, y - 10 * s, 5 * s, 3 * s);
    }
    // player car
    const bob = Math.sin(t * 30) * 0.6;
    const px = 160 - curve * 18;
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(px, 172, 34, 5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#e63946'; rr(ctx, px - 32, 140 + bob, 64, 26, 7); ctx.fill();
    ctx.fillStyle = '#c1121f'; rr(ctx, px - 22, 130 + bob, 44, 14, 5); ctx.fill();
    ctx.fillStyle = '#a8dadc'; rr(ctx, px - 18, 132 + bob, 36, 9, 3); ctx.fill();
    ctx.fillStyle = '#1b1b2f'; ctx.fillRect(px - 34, 160, 12, 10); ctx.fillRect(px + 22, 160, 12, 10);
    ctx.fillStyle = '#ffd166'; ctx.fillRect(px - 28, 146 + bob, 10, 5); ctx.fillRect(px + 18, 146 + bob, 10, 5);
    if (hype) { ctx.fillStyle = `rgba(76,201,240,${0.5 + Math.random() * 0.5})`; ctx.beginPath(); ctx.moveTo(px - 8, 166); ctx.lineTo(px, 180); ctx.lineTo(px + 8, 166); ctx.fill(); }
    ctx.fillStyle = 'rgba(0,0,0,.5)'; rr(ctx, 6, 6, 74, 32, 6); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '700 11px Fredoka'; ctx.fillText('POS ' + pos + '/8', 12, 19);
    ctx.fillStyle = '#ffd166'; ctx.fillText(Math.round(sp * 0.6) + ' km/h', 12, 33);
    if (Math.random() < 0.002) pos = Math.min(8, pos + 1);
  };
}

// ---------- 6. Última Zona (battle royale, top view) ----------
function zona() {
  let t = 0, r = 140, alive = 64, kills = 0;
  const cx = 170, cy = 92;
  const bots = Array.from({ length: 14 }, () => ({ x: rnd(20, 300), y: rnd(20, 160), vx: rnd(-20, 20), vy: rnd(-20, 20) }));
  const me = { x: 150, y: 100, tx: 150, ty: 100 };
  const shots = [];
  return (ctx, dt, hype) => {
    t += dt;
    r -= dt * 2.2; if (r < 30) { r = 140; alive = 64; }
    if (Math.random() < dt * 0.6) alive = Math.max(2, alive - 1);
    ctx.fillStyle = '#7fb069'; ctx.fillRect(0, 0, GW, GH);
    ctx.fillStyle = '#6a994e';
    for (let i = 0; i < 18; i++) { ctx.beginPath(); ctx.arc((i * 71) % GW, (i * 47) % GH, 10 + (i % 3) * 4, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#d4a373'; ctx.fillRect(60, 40, 40, 30); ctx.fillRect(220, 110, 50, 34); ctx.fillStyle = '#bc6c25'; ctx.fillRect(60, 40, 40, 6); ctx.fillRect(220, 110, 50, 6);
    ctx.strokeStyle = '#a3b18a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, 120); ctx.quadraticCurveTo(160, 60, 320, 140); ctx.stroke();
    // storm
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, GW, GH); ctx.arc(cx, cy, r, 0, Math.PI * 2, true);
    ctx.fillStyle = 'rgba(123, 44, 191, .45)'; ctx.fill(); ctx.restore();
    ctx.strokeStyle = '#e0aaff'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]); ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke(); ctx.setLineDash([]);
    for (const b of bots) {
      b.x += b.vx * dt; b.y += b.vy * dt;
      const d = Math.hypot(b.x - cx, b.y - cy);
      if (d > r - 10) { b.vx += (cx - b.x) * dt; b.vy += (cy - b.y) * dt; }
      if (b.x < 5 || b.x > 315) b.vx *= -1; if (b.y < 5 || b.y > 175) b.vy *= -1;
      ctx.fillStyle = '#e63946'; ctx.beginPath(); ctx.arc(b.x, b.y, 3.5, 0, 7); ctx.fill();
    }
    if (Math.hypot(me.tx - me.x, me.ty - me.y) < 4) { const a = rnd(0, 6.28), rr2 = rnd(0, r * 0.6); me.tx = cx + Math.cos(a) * rr2; me.ty = cy + Math.sin(a) * rr2; }
    me.x += (me.tx - me.x) * dt * 1.5; me.y += (me.ty - me.y) * dt * 1.5;
    if (Math.random() < dt * (hype ? 3 : 1.2)) {
      const target = bots[Math.floor(Math.random() * bots.length)];
      shots.push({ x: me.x, y: me.y, tx: target.x, ty: target.y, life: 0.25 });
      if (Math.random() < 0.3) { kills++; target.x = rnd(20, 300); target.y = rnd(20, 160); }
    }
    for (let i = shots.length - 1; i >= 0; i--) {
      const s = shots[i]; s.life -= dt;
      ctx.strokeStyle = `rgba(255,214,10,${s.life * 4})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.tx, s.ty); ctx.stroke();
      if (s.life <= 0) shots.splice(i, 1);
    }
    ctx.fillStyle = '#4cc9f0'; ctx.beginPath(); ctx.arc(me.x, me.y, 5, 0, 7); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,.55)'; rr(ctx, 230, 6, 84, 32, 6); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '700 11px Fredoka'; ctx.fillText('👤 ' + alive + ' vivos', 238, 19); ctx.fillStyle = '#ffd60a'; ctx.fillText('💀 ' + kills + ' abates', 238, 33);
  };
}

// ---------- 7. Alvo Tático (FPS) ----------
function alvo() {
  let t = 0, flash = 0, recoil = 0, kills = 0;
  const targets = [];
  const feed = [];
  const names = ['xNinja', 'Pedrinho', 'TioGamer', 'LuluPro', 'Ryzen', 'Zézin', 'Kaká_77'];
  return (ctx, dt, hype) => {
    t += dt;
    const sway = Math.sin(t * 1.3) * 6;
    const sky = ctx.createLinearGradient(0, 0, 0, 100); sky.addColorStop(0, '#89c2d9'); sky.addColorStop(1, '#e9f5db');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, GW, GH);
    ctx.fillStyle = '#d6ccc2'; ctx.fillRect(0, 100, GW, 80);
    // buildings
    const blds = [[10, 40, 70, 60, '#c9ada7'], [90, 56, 50, 44, '#b5838d'], [180, 30, 60, 70, '#9a8c98'], [250, 50, 70, 50, '#c9ada7']];
    for (const [x, y, w, h, c] of blds) {
      ctx.fillStyle = c; ctx.fillRect(x + sway, y, w, h);
      ctx.fillStyle = '#4a4e69'; for (let i = 0; i < 3; i++) ctx.fillRect(x + 8 + i * 18 + sway, y + 12, 10, 12);
    }
    ctx.fillStyle = '#a68a64'; ctx.fillRect(40 + sway, 110, 60, 22); ctx.fillRect(220 + sway, 120, 50, 18);
    if (targets.length < 2 && Math.random() < dt * 1.5) targets.push({ x: rnd(30, 290), y: rnd(70, 110), life: rnd(1, 2), hit: false });
    for (let i = targets.length - 1; i >= 0; i--) {
      const tg = targets[i]; tg.life -= dt;
      const x = tg.x + sway;
      ctx.fillStyle = tg.hit ? 'rgba(239,71,111,.5)' : '#3d405b';
      ctx.beginPath(); ctx.arc(x, tg.y - 14, 6, 0, 7); ctx.fill(); ctx.fillRect(x - 6, tg.y - 8, 12, 18);
      ctx.fillStyle = '#e07a5f'; ctx.fillRect(x - 6, tg.y - 16, 12, 3);
      if (!tg.hit && tg.life < (hype ? 0.9 : 0.5)) { tg.hit = true; flash = 0.08; recoil = 1; kills++; feed.unshift({ n: pick(names), life: 3 }); if (feed.length > 3) feed.pop(); }
      if (tg.life <= 0) targets.splice(i, 1);
    }
    // crosshair
    ctx.strokeStyle = '#06d6a0'; ctx.lineWidth = 2;
    const g = 4 + recoil * 6;
    ctx.beginPath(); ctx.moveTo(160 - g - 7, 90); ctx.lineTo(160 - g, 90); ctx.moveTo(160 + g, 90); ctx.lineTo(160 + g + 7, 90); ctx.moveTo(160, 90 - g - 7); ctx.lineTo(160, 90 - g); ctx.moveTo(160, 90 + g); ctx.lineTo(160, 90 + g + 7); ctx.stroke();
    recoil = Math.max(0, recoil - dt * 5);
    // weapon
    ctx.save(); ctx.translate(230, 150 + recoil * 8 + Math.sin(t * 3) * 2); ctx.rotate(-0.25 - recoil * 0.1);
    ctx.fillStyle = '#2b2d42'; rr(ctx, -10, -10, 90, 22, 4); ctx.fill();
    ctx.fillStyle = '#8d99ae'; ctx.fillRect(-30, -6, 30, 8); ctx.fillStyle = '#edf2f4'; ctx.fillRect(10, -14, 30, 5);
    ctx.fillStyle = '#ffb4a2'; rr(ctx, 30, 8, 20, 24, 6); ctx.fill();
    ctx.restore();
    if (flash > 0) { flash -= dt; ctx.fillStyle = 'rgba(255,214,10,.9)'; ctx.beginPath(); ctx.arc(196, 126, 12 + Math.random() * 6, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.fillRect(0, 0, GW, GH); }
    ctx.font = '700 10px Fredoka';
    feed.forEach((f, i) => { f.life -= dt / 3; ctx.fillStyle = `rgba(0,0,0,${0.5 * Math.max(0, f.life)})`; rr(ctx, 190, 8 + i * 15, 124, 13, 4); ctx.fill(); ctx.fillStyle = `rgba(255,255,255,${Math.max(0, f.life)})`; ctx.fillText('VOCÊ  ⌖  ' + f.n, 196, 18 + i * 15); });
    ctx.fillStyle = 'rgba(0,0,0,.5)'; rr(ctx, 6, 150, 70, 24, 5); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '700 13px Fredoka'; ctx.fillText('❤ 100', 12, 166);
    ctx.fillStyle = 'rgba(0,0,0,.5)'; rr(ctx, 130, 6, 60, 16, 5); ctx.fill(); ctx.fillStyle = '#ffd60a'; ctx.font = '700 10px Fredoka'; ctx.fillText(kills + ' ABATES', 138, 18);
  };
}

// ---------- 8. Lendas da Arena (MOBA) ----------
function lendas() {
  let t = 0;
  const minions = [];
  const fx = [];
  const hero = { x: 120, y: 100, tx: 140, ty: 90 };
  const enemy = { x: 220, y: 80, hp: 1 };
  return (ctx, dt, hype) => {
    t += dt;
    ctx.fillStyle = '#2d6a4f'; ctx.fillRect(0, 0, GW, GH);
    ctx.fillStyle = '#40916c';
    for (let i = 0; i < 12; i++) { ctx.beginPath(); ctx.arc((i * 83) % GW, (i * 59) % GH, 16, 0, 7); ctx.fill(); }
    ctx.strokeStyle = '#d8c3a5'; ctx.lineWidth = 22; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-10, 170); ctx.lineTo(330, 10); ctx.stroke();
    ctx.strokeStyle = '#457b9d'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(0, 20); ctx.quadraticCurveTo(160, 120, 320, 160); ctx.stroke();
    // towers
    for (const [x, y, c] of [[40, 150, '#4cc9f0'], [280, 30, '#ef476f']]) {
      ctx.fillStyle = '#6c757d'; ctx.fillRect(x - 8, y - 24, 16, 24); ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x - 10, y - 24); ctx.lineTo(x, y - 36); ctx.lineTo(x + 10, y - 24); ctx.fill();
    }
    if (Math.random() < dt * 2) { minions.push({ x: 40, y: 150, side: 0 }); minions.push({ x: 280, y: 30, side: 1 }); }
    for (let i = minions.length - 1; i >= 0; i--) {
      const m = minions[i];
      const dir = m.side ? -1 : 1;
      m.x += dir * 22 * dt; m.y -= dir * 10.3 * dt;
      ctx.fillStyle = m.side ? '#ef476f' : '#4cc9f0'; ctx.beginPath(); ctx.arc(m.x, m.y, 3, 0, 7); ctx.fill();
      if (m.x > 160 && !m.side || m.x < 160 && m.side) { if (Math.random() < 0.02) { fx.push({ x: m.x, y: m.y, r: 2, c: '#ffd166', life: 0.4 }); minions.splice(i, 1); } }
    }
    if (Math.hypot(hero.tx - hero.x, hero.ty - hero.y) < 3) { hero.tx = rnd(110, 190); hero.ty = rnd(60, 120); }
    hero.x += (hero.tx - hero.x) * dt * 2; hero.y += (hero.ty - hero.y) * dt * 2;
    enemy.x = 210 + Math.sin(t) * 20; enemy.y = 75 + Math.cos(t * 1.3) * 10;
    if (Math.random() < dt * (hype ? 4 : 1.6)) {
      const kind = pick(['bolt', 'nova', 'slash']);
      fx.push({ kind, x: hero.x, y: hero.y, tx: enemy.x, ty: enemy.y, life: 0.5, r: 4, c: pick(['#c77dff', '#4cc9f0', '#ffd166']) });
      enemy.hp -= 0.08; if (enemy.hp < 0) { enemy.hp = 1; fx.push({ x: enemy.x, y: enemy.y, r: 6, c: '#fff', life: 0.6, boom: true }); }
    }
    for (let i = fx.length - 1; i >= 0; i--) {
      const f = fx[i]; f.life -= dt;
      ctx.globalAlpha = Math.max(0, f.life * 2);
      if (f.kind === 'bolt') { const k = 1 - f.life * 2; ctx.fillStyle = f.c; ctx.beginPath(); ctx.arc(f.x + (f.tx - f.x) * k, f.y + (f.ty - f.y) * k, 4, 0, 7); ctx.fill(); }
      else if (f.kind === 'nova') { ctx.strokeStyle = f.c; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(f.x, f.y, (0.5 - f.life) * 70, 0, 7); ctx.stroke(); }
      else { ctx.fillStyle = f.c; ctx.beginPath(); ctx.arc(f.x, f.y, f.r + (0.6 - f.life) * (f.boom ? 40 : 10), 0, 7); ctx.fill(); }
      ctx.globalAlpha = 1;
      if (f.life <= 0) fx.splice(i, 1);
    }
    const unit = (u, c, hp) => {
      ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(u.x, u.y + 7, 8, 3, 0, 0, 7); ctx.fill();
      ctx.fillStyle = c; ctx.beginPath(); ctx.arc(u.x, u.y, 7, 0, 7); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = '#000'; ctx.fillRect(u.x - 10, u.y - 14, 20, 3); ctx.fillStyle = hp > 0.3 ? '#52b788' : '#e63946'; ctx.fillRect(u.x - 10, u.y - 14, 20 * hp, 3);
    };
    unit(hero, '#7b2cbf', 0.8); unit(enemy, '#d00000', Math.max(0, enemy.hp));
    ctx.fillStyle = 'rgba(0,0,0,.6)'; rr(ctx, 100, 150, 120, 26, 6); ctx.fill();
    ['#c77dff', '#4cc9f0', '#ffd166', '#ef476f'].forEach((c, i) => { ctx.fillStyle = c; rr(ctx, 106 + i * 28, 154, 22, 18, 4); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(106 + i * 28, 154, 22, 18 * ((t * 0.3 + i * 0.25) % 1)); ctx.fillStyle = '#fff'; ctx.font = '700 9px Fredoka'; ctx.fillText('QWER'[i], 114 + i * 28, 166); });
    ctx.fillStyle = 'rgba(0,0,0,.5)'; rr(ctx, 6, 6, 70, 16, 5); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = '700 10px Fredoka'; ctx.fillText('⚔ 12 / 3 / 9', 12, 18);
  };
}

const FACTORIES = { blococai, pulopixel, goltotal, cubocraft, turbo, zona, alvo, lendas };
export function makeGame(id) { return (FACTORIES[id] || blococai)(); }
export const GAME_IDS = Object.keys(FACTORIES);
