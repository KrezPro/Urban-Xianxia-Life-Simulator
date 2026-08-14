import { Platform } from 'react-native';
import { AdsConstants } from '../constants/AdsConstants';

// Guarded literal require (урок DataForAI 18/19): Metro статически включает пакет
// в бандл, рантайм-ошибка отсутствия нативки ловится в try/catch.
let InterstitialAd: any = null;
let RewardedAd: any = null;
let AdEventType: any = null;
let RewardedAdEventType: any = null;
let mobileAds: any = null;

try {
  const admob = require('react-native-google-mobile-ads');
  InterstitialAd = admob.InterstitialAd;
  RewardedAd = admob.RewardedAd;
  AdEventType = admob.AdEventType;
  RewardedAdEventType = admob.RewardedAdEventType;
  mobileAds = admob.default;
} catch (e) {
  InterstitialAd = null;
  RewardedAd = null;
  AdEventType = null;
  RewardedAdEventType = null;
  mobileAds = null;
}

export interface AdServiceResult {
  success: boolean;
  error?: string;
}

const REWARDED_TIMEOUT_MS = 120000;

class AdServiceClass {
  private initialized = false;
  private interstitialInstance: any = null;
  private rewardedInstance: any = null;

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    if (!AdsConstants.ADS_ENABLED || !mobileAds) {
      return;
    }
    try {
      await mobileAds().initialize();
      this.loadInterstitial();
      this.loadRewarded();
    } catch (e) {
      console.warn('[AdService] init failed:', e);
    }
  }

  private getAdUnitId(type: 'interstitial' | 'rewarded'): string {
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    return AdsConstants.testAdUnits[platform][type];
  }

  private loadInterstitial(): void {
    if (!InterstitialAd || !AdsConstants.ADS_ENABLED) {
      return;
    }
    try {
      this.interstitialInstance = InterstitialAd.createForAdRequest(
        this.getAdUnitId('interstitial'),
        { requestNonPersonalizedAdsOnly: false }
      );
      this.interstitialInstance.load();
    } catch (e) {
      console.warn('[AdService] loadInterstitial failed:', e);
      this.interstitialInstance = null;
    }
  }

  private loadRewarded(): void {
    if (!RewardedAd || !AdsConstants.ADS_ENABLED) {
      return;
    }
    try {
      this.rewardedInstance = RewardedAd.createForAdRequest(
        this.getAdUnitId('rewarded'),
        { requestNonPersonalizedAdsOnly: false }
      );
      this.rewardedInstance.load();
    } catch (e) {
      console.warn('[AdService] loadRewarded failed:', e);
      this.rewardedInstance = null;
    }
  }

  /**
   * Interstitial после смерти (правило 5/8/далее проверяется в adsUtils).
   * Ошибка рекламы никогда не блокирует игру: возвращаем success=false.
   */
  async showDeathInterstitial(): Promise<AdServiceResult> {
    if (!AdsConstants.ADS_ENABLED) {
      return { success: false, error: 'ads_disabled' };
    }
    if (!this.interstitialInstance) {
      if (__DEV__) {
        console.log('[AdService] DEV: simulating interstitial');
        return { success: true };
      }
      return { success: false, error: 'ad_not_loaded' };
    }
    try {
      await this.interstitialInstance.show();
      this.loadInterstitial();
      return { success: true };
    } catch (e: any) {
      console.warn('[AdService] showDeathInterstitial failed:', e);
      this.loadInterstitial();
      return { success: false, error: e?.message || 'unknown' };
    }
  }

  /**
   * Rewarded в Дао (+10% и Защита). Награда засчитывается ТОЛЬКО если
   * пользователь досмотрел видео (EARNED_REWARD) до закрытия рекламы.
   */
  showDaoRewarded(): Promise<AdServiceResult> {
    return new Promise((resolve) => {
      if (!AdsConstants.ADS_ENABLED) {
        resolve({ success: false, error: 'ads_disabled' });
        return;
      }
      if (!this.rewardedInstance || !AdEventType || !RewardedAdEventType) {
        if (__DEV__) {
          console.log('[AdService] DEV: simulating rewarded');
          resolve({ success: true });
        } else {
          resolve({ success: false, error: 'ad_not_loaded' });
        }
        return;
      }
      let earned = false;
      let settled = false;
      const unsubscribers: Array<() => void> = [];
      const finish = (success: boolean, error?: string) => {
        if (settled) {
          return;
        }
        settled = true;
        unsubscribers.forEach((unsubscribe) => {
          try {
            unsubscribe();
          } catch {
            // ignore
          }
        });
        this.loadRewarded();
        resolve({ success, error });
      };
      try {
        unsubscribers.push(
          this.rewardedInstance.addAdEventListener(
            RewardedAdEventType.EARNED_REWARD,
            () => {
              earned = true;
            }
          )
        );
        unsubscribers.push(
          this.rewardedInstance.addAdEventListener(AdEventType.CLOSED, () => {
            finish(earned, earned ? undefined : 'no_reward');
          })
        );
        unsubscribers.push(
          this.rewardedInstance.addAdEventListener(AdEventType.ERROR, () => {
            finish(false, 'ad_error');
          })
        );
        setTimeout(() => {
          finish(earned, 'timeout');
        }, REWARDED_TIMEOUT_MS);
        this.rewardedInstance.show().catch((e: any) => {
          finish(false, e?.message || 'show_failed');
        });
      } catch (e: any) {
        finish(false, e?.message || 'unknown');
      }
    });
  }
}

export const AdService = new AdServiceClass();