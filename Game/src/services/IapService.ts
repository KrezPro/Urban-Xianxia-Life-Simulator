import { Platform } from 'react-native';
import { AdsConstants } from '../constants/AdsConstants';

// Guarded require для react-native-iap
let RNIap: any = null;

try {
  RNIap = require('react-native-iap');
} catch (e) {
  RNIap = null;
}

export interface IapProduct {
  productId: string;
  title: string;
  description: string;
  price: string;
  currency: string;
}

export interface IapServiceResult {
  success: boolean;
  error?: string;
  product?: IapProduct;
}

class IapServiceClass {
  private initialized = false;
  private cachedProduct: IapProduct | null = null;

  async initialize(): Promise<void> {
    if (this.initialized || !RNIap) {
      this.initialized = true;
      return;
    }
    try {
      await RNIap.initConnection();
      this.initialized = true;
    } catch (e) {
      console.warn('[IapService] init failed:', e);
      this.initialized = true;
    }
  }

  async fetchRemoveAdsProduct(): Promise<IapProduct | null> {
    if (this.cachedProduct) {
      return this.cachedProduct;
    }
    if (!RNIap) {
      // Fallback для dev-режима
      return {
        productId: AdsConstants.REMOVE_ADS_PRODUCT_ID,
        title: 'Remove Ads',
        description: 'Disable all ads',
        price: '$0.99',
        currency: 'USD',
      };
    }
    try {
      const products = await RNIap.getProducts({
        skus: [AdsConstants.REMOVE_ADS_PRODUCT_ID],
      });
      if (products && products.length > 0) {
        const p = products[0];
        this.cachedProduct = {
          productId: p.productId,
          title: p.title,
          description: p.description,
          price: p.localizedPrice || '$0.99',
          currency: p.currency || 'USD',
        };
        return this.cachedProduct;
      }
      return null;
    } catch (e) {
      console.warn('[IapService] fetchProduct failed:', e);
      return null;
    }
  }

  async purchaseRemoveAds(): Promise<IapServiceResult> {
    if (!RNIap) {
      // Dev-симуляция
      if (__DEV__) {
        console.log('[IapService] DEV: simulating purchase');
        return { success: true };
      }
      return { success: false, error: 'IAP not available' };
    }
    try {
      const purchase = await RNIap.requestPurchase({
        sku: AdsConstants.REMOVE_ADS_PRODUCT_ID,
      });
      // Acknowledge/finish transaction (обязательно для non-consumable)
      if (Platform.OS === 'android') {
        await RNIap.finishTransaction({ purchase, isConsumable: false });
      } else {
        await RNIap.finishTransaction({ purchase });
      }
      return { success: true };
    } catch (e: any) {
      console.warn('[IapService] purchase failed:', e);
      // Коды ошибок: E_USER_CANCELLED, E_ALREADY_OWNED и т.д.
      const code = e?.code || e?.message || 'Unknown';
      if (code === 'E_USER_CANCELLED' || code === 'PURCHASE_CANCELLED') {
        return { success: false, error: 'cancelled' };
      }
      if (code === 'E_ALREADY_OWNED' || code === 'ITEM_ALREADY_OWNED') {
        return { success: true }; // Уже куплено
      }
      return { success: false, error: code };
    }
  }

  async restoreRemoveAds(): Promise<IapServiceResult> {
    if (!RNIap) {
      if (__DEV__) {
        return { success: false, error: 'IAP not available' };
      }
      return { success: false, error: 'IAP not available' };
    }
    try {
      const purchases = await RNIap.getAvailablePurchases();
      const found = (purchases || []).some(
        (p: any) => p.productId === AdsConstants.REMOVE_ADS_PRODUCT_ID
      );
      return { success: found, error: found ? undefined : 'not_found' };
    } catch (e: any) {
      console.warn('[IapService] restore failed:', e);
      return { success: false, error: e?.message || 'Unknown' };
    }
  }
}

export const IapService = new IapServiceClass();