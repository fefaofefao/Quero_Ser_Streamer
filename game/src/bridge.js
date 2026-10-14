// Thin async wrapper over the Android JavascriptInterface ("AndroidBridge").
// In a desktop browser (development / web demo) everything is simulated.

const native = typeof window !== 'undefined' ? window.AndroidBridge : null;
let cbSeq = 0;
const pending = new Map();
const listeners = {};

if (typeof window !== 'undefined') {
  window.__nativeCb = (id, json) => {
    const p = pending.get(id);
    if (!p) return;
    pending.delete(id);
    let data = null;
    try { data = json ? JSON.parse(json) : null; } catch (e) { data = { ok: false }; }
    p(data || { ok: false });
  };
  window.__nativeEvent = (name, json) => {
    let data = null;
    try { data = json ? JSON.parse(json) : null; } catch (e) { /* ignore */ }
    (listeners[name] || []).forEach(fn => fn(data));
  };
}

function call(method, ...args) {
  return new Promise((resolve) => {
    if (!native || typeof native[method] !== 'function') { resolve(null); return; }
    const id = 'c' + (++cbSeq);
    pending.set(id, resolve);
    try { native[method](...args, id); } catch (e) { pending.delete(id); resolve({ ok: false, error: String(e) }); }
  });
}

function sync(method, ...args) {
  if (!native || typeof native[method] !== 'function') return undefined;
  try { return native[method](...args); } catch (e) { return undefined; }
}

// --- Web fallbacks -------------------------------------------------------
function fakeAd() {
  return new Promise((resolve) => {
    const el = document.createElement('div');
    el.className = 'fake-ad';
    el.innerHTML = '<div><b>Anúncio de teste</b><small>O anúncio real do AdMob aparece aqui no Android</small><i></i></div>';
    document.body.appendChild(el);
    setTimeout(() => { el.remove(); resolve({ ok: true, rewarded: true }); }, 1600);
  });
}

export const bridge = {
  isNative: !!native,
  on(name, fn) { (listeners[name] = listeners[name] || []).push(fn); },

  ready() { sync('ready'); },
  loadSave() { return sync('loadSave') || null; },
  writeSave(json) { sync('writeSave', json); },

  async showRewarded(placement) {
    if (!native) return fakeAd();
    const r = await call('showRewarded', placement);
    return r || { ok: false };
  },
  showInterstitial(placement) { if (native) sync('showInterstitial', placement); },
  rewardedReady() { const r = sync('isRewardedReady'); return r === undefined ? true : !!r; },

  async queryProducts(ids) {
    if (!native) return { ok: true, products: {} };
    return (await call('queryProducts', JSON.stringify(ids))) || { ok: false, products: {} };
  },
  async buy(productId) {
    if (!native) {
      // Browser demo: purchases are simulated.
      return { ok: window.confirm(`[DEMO] Simular compra de "${productId}"?`), productId };
    }
    return (await call('buy', productId)) || { ok: false };
  },
  async restorePurchases() { if (!native) return { ok: true, owned: [] }; return (await call('restorePurchases')) || { ok: false, owned: [] }; },
  consumeAck(token) { sync('consumeAck', token); },

  vibrate(ms) { if (native) sync('vibrate', ms | 0); else if (navigator.vibrate) navigator.vibrate(ms); },
  log(name, params = {}) { sync('logEvent', name, JSON.stringify(params)); },
  scheduleNotifications(list) { sync('scheduleNotifications', JSON.stringify(list)); },
  requestNotificationPermission() { sync('requestNotificationPermission'); },
  notificationsAllowed() { const r = sync('notificationsAllowed'); return r === undefined ? true : !!r; },

  cloudStatus() { const r = sync('cloudStatus'); try { return r ? JSON.parse(r) : { available: false }; } catch (e) { return { available: false }; } },
  async cloudSignIn() { return (await call('cloudSignIn')) || { ok: false }; },
  async cloudSave(json) { return (await call('cloudSave', json)) || { ok: false }; },
  async cloudLoad() { return (await call('cloudLoad')) || { ok: false }; },

  remoteConfig() { const r = sync('getRemoteConfig'); try { return r ? JSON.parse(r) : {}; } catch (e) { return {}; } },
  openUrl(url) { if (native) sync('openUrl', url); else window.open(url, '_blank'); },
  rateApp() { sync('rateApp'); },
  requestReview() { sync('requestReview'); },
  privacyOptionsRequired() { return !!sync('isPrivacyOptionsRequired'); },
  showPrivacyOptions() { sync('showPrivacyOptions'); },
  appVersion() { return sync('getAppVersion') || 'web'; },
  exitApp() { sync('exitApp'); },
  setImmersive(on) { sync('setImmersive', !!on); },
};
