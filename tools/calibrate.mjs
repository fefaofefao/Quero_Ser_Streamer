// Binary-searches market fame thresholds and house costs (log space) so the
// simulated player reaches each one around a target day. Order matters: each
// gate is tuned with all later gates disabled.
import * as E from '../game/src/economy.js';
import { runSim } from './sim.mjs';

const S1 = 8 / 24; // first session starts at 08:00 of day 0
const plan = [
  ['m1', S1 + 3 / 1440],
  ['m2', S1 + 12 / 1440],
  ['m3', 1.0],
  ['h1', 2.0],
  ['m4', 2.6],
  ['h2', 12],
  ['m5', 13],
  ['h3', 38],
  ['m6', 40],
  ['h4', 90],
  ['m7', 93],
];
const nice = (x) => { const k = Math.floor(Math.log10(x)); const m = Math.round(x / 10 ** k * 2) / 2; return m * 10 ** k; };
const ref = (key) => key[0] === 'm' ? E.MARKETS[+key[1]] : E.HOUSES[+key[1]];
const field = (key) => key[0] === 'm' ? 'fame' : 'cost';

for (const [key] of plan) ref(key)[field(key)] = 1e300;
let prevLog = 1;
for (const [key, day] of plan) {
  let lo = prevLog, hi = prevLog + 30;
  const run = () => (runSim({ days: Math.ceil(day * 1.7) + 2 }).firsts[key] ?? Infinity);
  for (let it = 0; it < 16; it++) {
    const mid = (lo + hi) / 2;
    ref(key)[field(key)] = 10 ** mid;
    if (run() < day) lo = mid; else hi = mid;
  }
  ref(key)[field(key)] = nice(10 ** ((lo + hi) / 2));
  if (key[0] === 'm') prevLog = Math.log10(ref(key).fame);
  console.log(`${key} ${field(key)} = ${ref(key)[field(key)].toExponential(1)}  -> day ${run().toFixed(3)} (target ${day.toFixed(3)})`);
}
const { log, firsts } = runSim({ days: 150 });
console.log(JSON.stringify(Object.fromEntries(Object.entries(firsts).map(([k, v]) => [k, +v.toFixed(2)]))));
console.log(log.filter(l => /end of/.test(l)).join('\n'));
