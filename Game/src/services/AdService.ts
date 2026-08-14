import { Platform } from 'react-native';
import { AdsConstants } from '../constants/AdsConstants';

// Guarded require: Metro статически включает пакет в бандл,
// рантайм-ошибка отсутствия нативки ловится в try/catch
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
  // Нативный модуль недоступен (dev-клиент без prebuild)
  InterstitialAd = null;
  RewardedAd = null;
}

export interface AdServiceResult {
  success: boolean;
  error?: string;
}

class AdServiceClass {
  private initialized = false;
  private interstitialInstance: any = null;
  private rewardedInstance: any = null;

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    if (!AdsConstants.ADS_ENABLED) {
      this.initialized = true;
      return;
    }
    if (!mobileAds) {
      this.initialized = true;
      return;
    }
    try {
      await mobileAds().initialize();
      this.initialized = true;
      this.loadInterstitial();
      this.loadRewarded();
    } catch (e) {
      console.warn('[AdService] init failed:', e);
      this.initialized = true;
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
    }
  }

  async showDeathInterstitial(): Promise<AdServiceResult> {
    if (!AdsConstants.ADS_ENABLED) {
      return { success: false, error: 'Ads disabled' };
    }
    if (!this.interstitialInstance) {
      // В dev-режиме без нативки симулируем успех для тестирования логики
      if (__DEV__) {
        console.log('[AdService] DEV: simulating interstitial');
        return { success: true };
      }
      return { success: false, error: 'Ad not loaded' };
    }
    try {
      await this.interstitialInstance.show();
      this.loadInterstitial(); // Предзагрузка следующей
      return { success: true };
    } catch (e: any) {
      console.warn('[AdService] showDeathInterstitial failed:', e);
      return { success: false, error: e?.message || 'Unknown error' };
    }
  }

  async showDaoRewarded(): Promise<AdServiceResult> {
    if (!AdsConstants.ADS_ENABLED) {
      return { success: false, error: 'Ads disabled' };
    }
    if (!this.rewardedInstance) {
      if (__DEV__) {
        console.log('[AdService] DEV: simulating rewarded');
        return { success: true };
      }
      return { success: false, error: 'Ad not loaded' };
    }
    try {
      let rewarded = false;
      const unsubscribe = this.rewardedInstance.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        () => {
          rewarded = true;
        }
      );
      await this.rewardedInstance.show();
      // Даём время на callback
      await new Promise((resolve) => setTimeout(resolve, 500));
      unsubscribe();
      this.loadRewarded(); // Предзагрузка следующей
      return { success: rewarded, error: rewarded ? undefined : 'No reward earned' };
    } catch (e: any) {
      console.warn('[AdService] showDaoRewarded failed:', e);
      return { success: false, error: e?.message || 'Unknown error' };
    }
  }
}

export const AdService = new AdServiceClass();