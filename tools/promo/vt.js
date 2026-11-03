// Virtual time for frame-perfect capture: the page only moves when __vt.advance(ms) is called.
// Covers timers, requestAnimationFrame, performance.now/Date, CSS/WAAPI animations and SVG SMIL.
(() => {
  if (window === window.top) return; // only the game frame runs on virtual time
  let vnow = 0;
  const t0 = Date.now();
  const RealDate = Date;
  class VDate extends RealDate {
    constructor(...a) { if (a.length) super(...a); else super(t0 + vnow); }
    static now() { return t0 + vnow; }
  }
  window.Date = VDate;
  performance.now = () => vnow;
  const timers = new Map(); let tid = 1;
  const rafs = new Map(); let rid = 1;
  window.setTimeout = (fn, ms = 0, ...args) => { const id = tid++; timers.set(id, { t: vnow + Math.max(0, +ms || 0), fn, args }); return id; };
  window.setInterval = (fn, ms = 0, ...args) => { const id = tid++; const every = Math.max(1, +ms || 0); timers.set(id, { t: vnow + every, fn, args, every }); return id; };
  window.clearTimeout = window.clearInterval = (id) => { timers.delete(id); };
  window.requestAnimationFrame = (fn) => { const id = rid++; rafs.set(id, fn); return id; };
  window.cancelAnimationFrame = (id) => { rafs.delete(id); };
  const born = new WeakMap();
  window.__vt = {
    get now() { return vnow; },
    advance(ms) {
      const end = vnow + ms;
      for (let guard = 0; guard < 5000; guard++) {
        let pick = null;
        for (const [id, t] of timers) if (t.t <= end && (!pick || t.t < pick[1].t)) pick = [id, t];
        if (!pick) break;
        const [id, t] = pick;
        vnow = Math.max(vnow, t.t);
        if (t.every) t.t += t.every; else timers.delete(id);
        try { typeof t.fn === 'function' ? t.fn(...(t.args || [])) : 0; } catch (e) { console.error(e); }
      }
      vnow = end;
      const cbs = [...rafs.values()]; rafs.clear();
      for (const cb of cbs) { try { cb(vnow); } catch (e) { console.error(e); } }
      for (const a of document.getAnimations()) {
        if (!born.has(a)) born.set(a, vnow);
        try { a.pause(); a.currentTime = vnow - born.get(a); } catch (e) { /* ignore */ }
      }
      for (const s of document.querySelectorAll('svg')) if (s.pauseAnimations) { s.pauseAnimations(); s.setCurrentTime(vnow / 1000); }
    },
  };
})();
