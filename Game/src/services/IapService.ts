import { Platform } from 'react-native';
import { AdsConstants } from '../constants/AdsConstants';

let RNIap: any = null;
try {
  RNIap = require('react-native-iap');
} catch (e) {
  RNIap = null;
}

let executionEnvironment = '';
try {
  const ConstantsModule = require('expo-constants');
  executionEnvironment = ConstantsModule?.default?.executionEnvironment || '';
} catch (e) {
  executionEnvironment = '';
}
const IS_EXPO_GO = executionEnvironment === 'expo-go';

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

const NOISE_PATTERNS = [
  'nitro runtime not installed',
  '[rn-iap]',
  'nitro-modules',
  'turbomodule',
  'native module',
];

const isNoise = (text: string): boolean => {
  const lower = text.toLowerCase();
  return NOISE_PATTERNS.some((pattern) => lower.includes(pattern));
};

const withSuppressedNativeNoise = async <T>(runner: () => Promise<T>): Promise<T> => {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    const text = args
      .map((arg) => (typeof arg === 'string' ? arg : arg?.message || ''))
      .join(' ');
    if (isNoise(text)) {
      return;
    }
    originalError(...args);
  };
  try {
    return await runner();
  } finally {
    console.error = originalError;
  }
};

const isNativeRuntimeError = (error: any): boolean => {
  return isNoise(`${error?.message || ''} ${error?.code || ''}`);
};

class IapServiceClass {
  private initialized = false;
  private nativeBroken = false;
  private cachedProduct: IapProduct | null = null;

  private hasNative(): boolean {
    return !!RNIap && !this.nativeBroken && !IS_EXPO_GO;
  }

  private rememberNativeError(error: any): void {
    if (isNativeRuntimeError(error)) {
      this.nativeBroken = true;
    }
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    if (!this.hasNative()) {
      return;
    }
    try {
      await withSuppressedNativeNoise(() => RNIap.initConnection());
    } catch (e) {
      this.rememberNativeError(e);
      if (!this.nativeBroken) {
        console.warn('[IapService] init failed:', e);
      }
    }
  }

  async fetchRemoveAdsProduct(): Promise<IapProduct | null> {
    if (this.cachedProduct) {
      return this.cachedProduct;
    }
    if (!this.hasNative()) {
      return {
        productId: AdsConstants.REMOVE_ADS_PRODUCT_ID,
        title: 'Remove Ads',
        description: 'Disable all ads',
        price: '$0.99',
        currency: 'USD',
      };
    }
    try {
      let products: any[] = [];
      try {
        products = await withSuppressedNativeNoise(() =>
          RNIap.getProducts({ skus: [AdsConstants.REMOVE_ADS_PRODUCT_ID] })
        );
      } catch {
        products = await withSuppressedNativeNoise(() =>
          RNIap.getProducts({ sku: AdsConstants.REMOVE_ADS_PRODUCT_ID })
        );
      }
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
      this.rememberNativeError(e);
      if (!this.nativeBroken) {
        console.warn('[IapService] fetchProduct failed:', e);
      }
      return null;
    }
  }

  async purchaseRemoveAds(): Promise<IapServiceResult> {
    if (!this.hasNative()) {
      if (__DEV__) {
        console.log('[IapService] DEV: simulating purchase');
        return { success: true };
      }
      return { success: false, error: 'iap_unavailable' };
    }
    try {
      let purchase: any = null;
      try {
        purchase = await withSuppressedNativeNoise(() =>
          RNIap.requestPurchase({ sku: AdsConstants.REMOVE_ADS_PRODUCT_ID })
        );
      } catch {
        purchase = await withSuppressedNativeNoise(() =>
          RNIap.requestPurchase({ skus: [AdsConstants.REMOVE_ADS_PRODUCT_ID] })
        );
      }
      if (Platform.OS === 'android') {
        await withSuppressedNativeNoise(() =>
          RNIap.finishTransaction({ purchase, isConsumable: false })
        );
      } else {
        await withSuppressedNativeNoise(() => RNIap.finishTransaction({ purchase }));
      }
      return { success: true };
    } catch (e: any) {
      this.rememberNativeError(e);
      if (this.nativeBroken && __DEV__) {
        console.log('[IapService] DEV: native broken, simulating purchase');
        return { success: true };
      }
      const code = e?.code || e?.message || 'Unknown';
      if (code === 'E_USER_CANCELLED' || code === 'PURCHASE_CANCELLED') {
        return { success: false, error: 'cancelled' };
      }
      if (code === 'E_ALREADY_OWNED' || code === 'ITEM_ALREADY_OWNED') {
        return { success: true };
      }
      if (!this.nativeBroken) {
        console.warn('[IapService] purchase failed:', e);
      }
      return { success: false, error: code };
    }
  }

  async restoreRemoveAds(): Promise<IapServiceResult> {
    if (!this.hasNative()) {
      return { success: false, error: 'iap_unavailable' };
    }
    try {
      const purchases = await withSuppressedNativeNoise(() => RNIap.getAvailablePurchases());
      const found = (purchases || []).some(
        (p: any) => p.productId === AdsConstants.REMOVE_ADS_PRODUCT_ID
      );
      return { success: found, error: found ? undefined : 'not_found' };
    } catch (e) {
      this.rememberNativeError(e);
      if (!this.nativeBroken) {
        console.warn('[IapService] restore failed:', e);
      }
      return { success: false, error: 'iap_unavailable' };
    }
  }
}

export const IapService = new IapServiceClass();