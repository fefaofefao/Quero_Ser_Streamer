// Procedural audio with WebAudio: no audio files, tiny APK, crisp sound.
let ctx = null, master = null, sfxGain = null, musicGain = null;
let sfxOn = true, musicOn = true, musicTimer = null, step = 0;

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
  sfxGain = ctx.createGain(); sfxGain.gain.value = 0.5; sfxGain.connect(master);
  musicGain = ctx.createGain(); musicGain.gain.value = 0.16; musicGain.connect(master);
  return ctx;
}

export function unlockAudio() {
  const c = ensure();
  if (c && c.state === 'suspended') c.resume();
  if (musicOn && !musicTimer) startMusic();
}

export function setAudio(sfx, music) {
  sfxOn = sfx; musicOn = music;
  if (!music) stopMusic(); else if (ctx) startMusic();
}

export function suspendAudio(paused) {
  if (!ctx) return;
  if (paused) ctx.suspend(); else ctx.resume();
}

function tone(freq, dur, type = 'sine', vol = 0.5, when = 0, slide = 0, dest = null) {
  const c = ensure(); if (!c) return;
  dest = dest || sfxGain;
  const t = c.currentTime + when;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(dest);
  o.start(t); o.stop(t + dur + 0.05);
}

function noise(dur, vol = 0.3, when = 0, filterFreq = 2000, dest = null) {
  const c = ensure(); if (!c) return;
  dest = dest || sfxGain;
  const t = c.currentTime + when;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource(); src.buffer = buf;
  const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = filterFreq; f.Q.value = 0.8;
  const g = c.createGain(); g.gain.value = vol;
  src.connect(f); f.connect(g); g.connect(dest);
  src.start(t);
}

let lastTap = 0;
export const sfx = {
  tap() {
    if (!sfxOn) return;
    const now = performance.now(); if (now - lastTap < 40) return; lastTap = now;
    tone(520 + Math.random() * 180, 0.08, 'triangle', 0.25, 0, 1.6);
  },
  coin() { if (!sfxOn) return; tone(988, 0.08, 'square', 0.12); tone(1319, 0.18, 'square', 0.12, 0.07); },
  buy() { if (!sfxOn) return; tone(660, 0.07, 'triangle', 0.3); tone(880, 0.07, 'triangle', 0.3, 0.05); tone(1175, 0.12, 'triangle', 0.3, 0.1); },
  error() { if (!sfxOn) return; tone(220, 0.15, 'sawtooth', 0.12, 0, 0.7); },
  click() { if (!sfxOn) return; tone(900, 0.04, 'sine', 0.2); },
  open() { if (!sfxOn) return; tone(440, 0.09, 'sine', 0.2, 0, 1.5); },
  levelUp() { if (!sfxOn) return; [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.3, i * 0.08)); },
  fanfare() {
    if (!sfxOn) return;
    [[523, 0], [659, 0.12], [784, 0.24], [1047, 0.36], [784, 0.52], [1047, 0.64]].forEach(([f, w]) => { tone(f, 0.3, 'square', 0.1, w); tone(f / 2, 0.3, 'triangle', 0.2, w); });
    noise(0.8, 0.12, 0.3, 3000);
  },
  cheer() { if (!sfxOn) return; noise(1.2, 0.25, 0, 1500); noise(0.9, 0.15, 0.2, 2600); },
  sign() { if (!sfxOn) return; noise(0.18, 0.25, 0, 4500); noise(0.12, 0.2, 0.15, 3800); },
  whoosh() { if (!sfxOn) return; noise(0.35, 0.2, 0, 900); },
  pop() { if (!sfxOn) return; tone(300, 0.1, 'sine', 0.4, 0, 3); },
  hype() { if (!sfxOn) return; [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, 0.15, 'sawtooth', 0.08, i * 0.04)); },
  notify() { if (!sfxOn) return; tone(1047, 0.1, 'sine', 0.25); tone(1568, 0.2, 'sine', 0.2, 0.1); },
};

// Chill lo-fi loop: chords + bass + soft drums.
const CHORDS = [[57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65], [52, 55, 59, 62]];
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
function startMusic() {
  const c = ensure(); if (!c || musicTimer) return;
  const beat = 60 / 84;
  let next = c.currentTime + 0.1;
  musicTimer = setInterval(() => {
    if (!musicOn || c.state !== 'running') return;
    while (next < c.currentTime + 0.6) {
      const bar = Math.floor(step / 8) % CHORDS.length;
      const s8 = step % 8;
      const when = next - c.currentTime;
      if (s8 === 0) CHORDS[bar].forEach((m, i) => tone(mtof(m), beat * 3.6, 'triangle', 0.09, when + i * 0.02, 0, musicGain));
      if (s8 === 0 || s8 === 3 || s8 === 5) tone(mtof(CHORDS[bar][0] - 12), beat * 0.9, 'sine', 0.35, when, 0, musicGain);
      if (s8 % 4 === 0) tone(110, 0.18, 'sine', 0.5, when, 0.4, musicGain);
      if (s8 % 4 === 2) noise(0.12, 0.08, when, 2500, musicGain);
      noise(0.03, 0.025, when, 8000, musicGain);
      if (Math.random() < 0.28) tone(mtof(CHORDS[bar][Math.floor(Math.random() * 4)] + 12), beat * 0.6, 'sine', 0.06, when, 0, musicGain);
      next += beat / 2; step++;
    }
  }, 150);
}
function stopMusic() { if (musicTimer) { clearInterval(musicTimer); musicTimer = null; } }
