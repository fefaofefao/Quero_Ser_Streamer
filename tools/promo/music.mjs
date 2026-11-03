// Synthesizes the 30 s promo soundtrack (original, royalty-free) synced to the director timeline.
// node tools/promo/music.mjs [out.wav]
import fs from 'node:fs';
import path from 'node:path';
const out = process.argv[2] || path.join(path.dirname(new URL(import.meta.url).pathname), 'music.wav');
const SR = 44100, DUR = 30, N = SR * DUR;
const L = new Float32Array(N), R = new Float32Array(N);
const BPM = 124, BEAT = 60 / BPM, S16 = BEAT / 4;
const DROP = 3.6, END = 26.6;
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
let seed = 3; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

function add(i, l, r) { if (i >= 0 && i < N) { L[i] += l; R[i] += r; } }
// oscillator voice with ADSR-ish envelope and optional lowpass
function voice(t0, dur, freq, { type = 'saw', vol = 0.2, a = 0.005, rel = 0.08, pan = 0, cutoff = 0, glide = 0, detune = 0 } = {}) {
  const s0 = Math.floor(t0 * SR), n = Math.floor((dur + rel) * SR);
  let ph = 0, ph2 = 0, lp = 0;
  const k = cutoff ? 1 - Math.exp(-2 * Math.PI * cutoff / SR) : 1;
  for (let j = 0; j < n; j++) {
    const t = j / SR;
    const f = freq * (glide ? Math.pow(glide, Math.min(1, t / dur)) : 1);
    ph += f / SR; ph2 += f * (1 + detune) / SR;
    const w = (p) => type === 'saw' ? 2 * (p % 1) - 1 : type === 'square' ? ((p % 1) < 0.5 ? 1 : -1) : type === 'tri' ? 1 - 4 * Math.abs((p % 1) - 0.5) : Math.sin(2 * Math.PI * p);
    let v = detune ? (w(ph) + w(ph2)) * 0.5 : w(ph);
    if (cutoff) { lp += k * (v - lp); v = lp; }
    const env = t < a ? t / a : t < dur ? 1 : Math.max(0, 1 - (t - dur) / rel);
    v *= env * vol;
    add(s0 + j, v * (1 - pan) , v * (1 + pan));
  }
}
function kick(t0, vol = 0.9) {
  const s0 = Math.floor(t0 * SR), n = Math.floor(0.32 * SR); let ph = 0;
  for (let j = 0; j < n; j++) { const t = j / SR; const f = 48 + 130 * Math.exp(-t * 28); ph += f / SR; const v = Math.sin(2 * Math.PI * ph) * Math.exp(-t * 9) * vol; add(s0 + j, v, v); }
}
function noise(t0, dur, { vol = 0.2, hp = 0, decay = 30, pan = 0, sweep = 0 } = {}) {
  const s0 = Math.floor(t0 * SR), n = Math.floor(dur * SR); let prev = 0, lp = 0;
  for (let j = 0; j < n; j++) {
    const t = j / SR; let x = rnd() * 2 - 1;
    if (hp) { const y = x - prev; prev = x; x = y; }
    if (sweep) { const c = 400 + (sweep - 400) * (t / dur); const k = 1 - Math.exp(-2 * Math.PI * c / SR); lp += k * (x - lp); x = lp * 2.2; }
    const env = sweep ? Math.pow(t / dur, 1.6) : Math.exp(-t * decay);
    const v = x * env * vol; add(s0 + j, v * (1 - pan), v * (1 + pan));
  }
}
const clap = (t, vol = 0.35) => { noise(t, 0.18, { vol, hp: 1, decay: 22 }); noise(t + 0.012, 0.12, { vol: vol * 0.7, hp: 1, decay: 30 }); };
const hat = (t, vol = 0.12, open = false) => noise(t, open ? 0.2 : 0.05, { vol, hp: 1, decay: open ? 14 : 70, pan: 0.2 });
const coin = (t, vol = 0.16) => { voice(t, 0.07, mtof(95), { type: 'square', vol, rel: 0.02 }); voice(t + 0.07, 0.22, mtof(100), { type: 'square', vol, rel: 0.12 }); };
const riser = (t1, len = 0.65) => noise(t1 - len, len, { vol: 0.35, sweep: 9000 });
const impact = (t) => { kick(t, 1); noise(t, 0.9, { vol: 0.28, hp: 0, decay: 4 }); };

// progression: vi - IV - I - V in C (Am F C G), one bar each
const PROG = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];
const BAR = BEAT * 4;
for (let bar = 0; bar * BAR < END; bar++) {
  const t = bar * BAR, ch = PROG[bar % 4];
  const full = t >= DROP - 0.01;
  // pads
  for (const m of ch) voice(t, BAR * 0.98, mtof(m + 12), { type: 'saw', vol: full ? 0.045 : 0.03, a: 0.08, rel: 0.2, cutoff: full ? 2600 : 1200, detune: 0.006, pan: (m % 3 - 1) * 0.3 });
  // bass (offbeat 8ths after the drop)
  if (full) for (let k = 0; k < 8; k++) { const tt = t + k * BEAT / 2; if (k % 2 === 1 || k === 0) voice(tt, BEAT / 2 * 0.8, mtof(ch[0] - 12), { type: 'saw', vol: 0.16, cutoff: 700, rel: 0.03 }); }
  // arp plucks 16ths
  for (let k = 0; k < 16; k++) {
    const tt = t + k * S16; if (tt >= END) break;
    const note = [ch[0], ch[1], ch[2], ch[1] + 12][k % 4] + 24;
    if (!full && k % 2) continue;
    voice(tt, S16 * 0.6, mtof(note), { type: 'square', vol: 0.035, cutoff: 3200, rel: 0.05, pan: k % 2 ? 0.35 : -0.35 });
  }
}
// drums
for (let t = 0; t < END; t += BEAT) {
  const b = Math.round(t / BEAT);
  if (t >= DROP - 0.01) { kick(t); if (b % 2 === 1) clap(t); }
  else if (b % 2 === 0) kick(t, 0.45);
  hat(t + BEAT / 2, t >= DROP ? 0.12 : 0.07, t >= DROP && b % 4 === 3);
  if (t >= DROP) { hat(t + BEAT / 4, 0.05); hat(t + 3 * BEAT / 4, 0.05); }
}
// scene transitions
for (const t of [3.6, 8.2, 12.8, 17.6, 22.8]) { riser(t); impact(t); }
// game moments
for (let t = 0.45; t < 8.1; t += 0.13 * 4) voice(t, 0.05, mtof(84 + Math.floor(rnd() * 5)), { type: 'tri', vol: 0.06, rel: 0.04 }); // tap blips
coin(4.95); coin(5.1, 0.12); coin(6.8);
for (const t of [8.3, 9.9, 11.1]) { coin(t, 0.14); voice(t + 0.05, 0.5, mtof(84), { type: 'tri', vol: 0.1, rel: 0.3 }); }
for (const [i, t] of [13.1, 14.0, 14.9, 15.8].entries()) { coin(t); [0, 4, 7, 12].forEach((s, k) => voice(t + k * 0.05, 0.18, mtof(76 + i * 2 + s), { type: 'tri', vol: 0.08, rel: 0.1 })); }
for (let t = 18.95; t < 22.7; t += 0.44) noise(t, 0.12, { vol: 0.12, hp: 1, decay: 25, pan: -0.3 }); // signing swishes
[0, 4, 7, 12, 16].forEach((s, k) => voice(25.75 + k * 0.07, 0.4, mtof(79 + s), { type: 'tri', vol: 0.1, rel: 0.3 })); // #1 fanfare
// end card: big chord + sparkle, then fade
impact(END);
for (const m of [60, 64, 67, 72, 76]) voice(END, 2.6, mtof(m), { type: 'saw', vol: 0.05, a: 0.01, rel: 0.6, cutoff: 3000, detune: 0.008 });
for (let k = 0; k < 10; k++) voice(END + 0.15 + k * 0.11, 0.12, mtof(84 + [0, 4, 7, 12, 16][k % 5]), { type: 'tri', vol: 0.06, rel: 0.15, pan: k % 2 ? 0.4 : -0.4 });
for (let t = END; t < 29.3; t += BEAT) { kick(t, 0.7); hat(t + BEAT / 2, 0.08); }

// master: soft clip, normalize, fade out
let peak = 0;
for (let i = 0; i < N; i++) { L[i] = Math.tanh(L[i] * 1.2); R[i] = Math.tanh(R[i] * 1.2); peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i])); }
const g = 0.89 / peak;
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  const t = i / SR, fade = t > 28.8 ? Math.max(0, (30 - t) / 1.2) : t < 0.05 ? t / 0.05 : 1;
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * g * fade)) * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * g * fade)) * 32767), 46 + i * 4);
}
fs.writeFileSync(out, buf);
console.log('wrote', out);
