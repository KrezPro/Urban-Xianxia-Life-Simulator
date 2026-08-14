import { Platform } from 'react-native';
import { AdsConstants } from '../constants/AdsConstants';

// Guarded literal require (уроки DataForAI 18/19): Metro статически включает пакет
// в бандл, рантайм-ошибка отсутствия нативки ловится в try/catch.
let RNIap: any = null;

try {
  RNIap = require('react-native-iap');
} catch (e) {
  RNIap = null;
}

// Детект Expo Go: кастомных нативных модулей (react-native-iap, nitro) там нет.
// Без этой проверки initConnection кидает "Nitro runtime not installed yet".
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

const isNativeRuntimeError = (error: any): boolean => {
  const message = `${error?.message || ''} ${error?.code || ''}`.toLowerCase();
  return (
    message.includes('nitro') ||
    message.includes('native module') ||
    message.includes('turbomodule') ||
    message.includes('not installed') ||
    message.includes('null is not an object') ||
    message.includes('undefined is not an object')
  );
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
      await RNIap.initConnection();
    } catch (e) {
      console.warn('[IapService] init failed:', e);
      this.rememberNativeError(e);
    }
  }

  async fetchRemoveAdsProduct(): Promise<IapProduct | null> {
    if (this.cachedProduct) {
      return this.cachedProduct;
    }
    if (!this.hasNative()) {
      // Fallback-цена для dev/Expo Go; реальная цена приходит из Google Play.
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
      this.rememberNativeError(e);
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
      this.rememberNativeError(e);
      // Нативка сломалась на рантайме (старый dev-клиент): в dev симулируем,
      // чтобы можно было тестировать логику покупки и отключения рекламы.
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
      return { success: false, error: code };
    }
  }

  async restoreRemoveAds(): Promise<IapServiceResult> {
    if (!this.hasNative()) {
      return { success: false, error: 'iap_unavailable' };
    }
    try {
      const purchases = await RNIap.getAvailablePurchases();
      const found = (purchases || []).some(
        (p: any) => p.productId === AdsConstants.REMOVE_ADS_PRODUCT_ID
      );
      return { success: found, error: found ? undefined : 'not_found' };
    } catch (e) {
      console.warn('[IapService] restore failed:', e);
      this.rememberNativeError(e);
      return { success: false, error: 'iap_unavailable' };
    }
  }
}

export const IapService = new IapServiceClass();