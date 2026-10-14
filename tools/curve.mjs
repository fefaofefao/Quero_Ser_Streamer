// Prints the gold/s curve with houses beyond HOUSE_CAP disabled, to place gates.
import * as E from '../game/src/economy.js';
const cap = +(process.env.HOUSE_CAP || 1);
for (let h = cap + 1; h < E.HOUSES.length; h++) E.HOUSES[h].cost = 1e300;
if (process.env.RBP) E.RB.p = +process.env.RBP;
if (process.env.RBK) E.RB.k = +process.env.RBK;
await import('./sim.mjs');
