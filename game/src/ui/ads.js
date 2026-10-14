// Ad policy: rewarded ads are always optional; VIP players get rewards instantly.
// Interstitials only after a house move or rebirth, with a cooldown.
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
    suspendAudio(true);
    try {
      const r = await bridge.showRewarded(placement);
      if (r && r.ok && r.rewarded !== false) {
        S.stats.ads = (S.stats.ads || 0) + 1;
        bridge.log('ad_rewarded', { placement });
        return true;
      }
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
    bridge.showInterstitial(placement);
  },
};
