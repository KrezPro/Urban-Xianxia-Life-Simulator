import { Dimensions, PixelRatio } from 'react-native';

const BASE_PHONE_WIDTH = 390;
const BASE_TABLET_WIDTH = 640;
const TABLET_MIN_SIDE = 600;

export const getWindowDimensions = () => {
  return Dimensions.get('window');
};

export const isTablet = (): boolean => {
  const { width, height } = getWindowDimensions();
  return Math.min(width, height) >= TABLET_MIN_SIDE;
};

export const getScale = (): number => {
  const { width } = getWindowDimensions();
  const base = isTablet() ? BASE_TABLET_WIDTH : BASE_PHONE_WIDTH;
  const scale = width / base;

  return Math.min(1.25, Math.max(0.85, scale));
};

export const getFontScale = (): number => {
  return Math.min(1.2, Math.max(0.9, getScale()));
};

export const scaleSize = (size: number): number => {
  return PixelRatio.roundToNearestPixel(size * getScale());
};

export const scaleFont = (size: number): number => {
  return PixelRatio.roundToNearestPixel(size * getFontScale());
};

export const getContentMaxWidth = (): number => {
  return scaleSize(isTablet() ? 680 : 560);
};

export const getHorizontalPadding = (): number => {
  const { width } = getWindowDimensions();

  return Math.min(scaleSize(24), width * 0.06);
};

export const getNotificationAreaHeight = (): number => {
  return scaleSize(isTablet() ? 104 : 88);
};