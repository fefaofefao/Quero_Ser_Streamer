// Ad policy: rewarded ads are always optional; VIP players get rewards instantly.
// Interstitials only at natural breaks (house move, rebirth, new game unlocked, gear celebration,
// end of the autograph event), never in the first 15 minutes, with a cooldown.
// Every outcome is logged to Analytics (ad_result) so fill problems show up in Firebase.
import { bridge } from '../bridge.js';
import { S } from '../game.js';
import { toast } from './dom.js';
import { t } from '../i18n.js';
import { ic } from './icons.js';
import { suspendAudio } from '../audio.js';

let lastInterstitial = 0;
const INTERSTITIAL_COOLDOWN = 4 * 60 * 1000;
let busy = false;

export const ads = {
  async rewarded(placement) {
    if (busy) return false;
    if (S.iap.removeAds) { toast(ic('check') + ' ' + t('noAds')); bridge.log('ad_skip_vip', { placement }); return true; }
    busy = true;
    if (bridge.isNative && !bridge.rewardedReady()) toast(ic('play') + ' ' + t('adLoading'));
    suspendAudio(true);
    try {
      // never stay "busy" forever if the native side does not answer
      const r = await Promise.race([bridge.showRewarded(placement), new Promise(res => setTimeout(() => res({ ok: false, timeout: true }), 90000))]);
      if (r && r.ok && r.rewarded !== false) {
        S.stats.ads = (S.stats.ads || 0) + 1;
        bridge.log('ad_rewarded', { placement });
        bridge.log('ad_result', { placement, type: 'rewarded', result: 'rewarded' });
        return true;
      }
      bridge.log('ad_result', { placement, type: 'rewarded', result: r && r.timeout ? 'timeout' : r && r.ok ? 'closed_early' : 'not_available' });
      if (!r || !r.ok) toast(t('adFailed'));
      return false;
    } finally {
      busy = false;
      suspendAudio(false);
    }
  },
  interstitial(placement) {
    if (S.iap.removeAds) return;
    const now = Date.now();
    if (now - lastInterstitial < INTERSTITIAL_COOLDOWN) return;
    if ((S.stats.playSec || 0) < 15 * 60) return; // never in the first 15 minutes of play
    lastInterstitial = now;
    bridge.log('ad_result', { placement, type: 'interstitial', result: 'show_called' });
    bridge.showInterstitial(placement);
  },
  // Load the interstitial only when it can actually be shown soon (fewer wasted requests).
  prepare() {
    if (S.iap.removeAds || (S.stats.playSec || 0) < 14 * 60) return;
    bridge.prepareInterstitial();
  },
};
