import { AdsConstants } from '../constants/AdsConstants';

/**
 * Определяет, нужно ли показывать рекламу после смерти.
 * Правила:
 * - removeAdsActive = true -> никогда не показывать
 * - totalDeaths = 5 -> первая реклама
 * - totalDeaths = 8 -> вторая реклама
 * - totalDeaths > 8 -> каждую смерть (если EVERY_DEATH_AFTER)
 * - Одна и та же смерть не показывается дважды (shownForDeath === totalDeaths)
 */
export const shouldShowDeathAd = (
  totalDeaths: number,
  removeAdsActive: boolean,
  shownForDeath: number
): boolean => {
  if (!AdsConstants.ADS_ENABLED) {
    return false;
  }
  if (removeAdsActive) {
    return false;
  }
  if (shownForDeath >= totalDeaths) {
    // Уже показали рекламу для этой смерти
    return false;
  }
  const policy = AdsConstants.DEATH_AD_POLICY;
  if (totalDeaths === policy.FIRST_DEATH) {
    return true;
  }
  if (totalDeaths === policy.SECOND_DEATH) {
    return true;
  }
  if (policy.EVERY_DEATH_AFTER && totalDeaths > policy.SECOND_DEATH) {
    return true;
  }
  return false;
};