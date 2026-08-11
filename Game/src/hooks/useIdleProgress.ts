import { useEffect } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useEventStore } from '../store/useEventStore';
import { useLocaleStore } from '../store/useLocaleStore';
import { storage } from '../store/mmkvStorage';
import { GameConstants } from '../constants/GameConstants';
import { calculateOfflineDelta } from '../utils/timeUtils';
import ruUI from '../locales/ru/ui.json';
import enUI from '../locales/en/ui.json';

export const useIdleProgress = () => {
  const { hasHydrated, isDead, spiritualRoot, activityFocus, addQi, applyEffects } = usePlayerStore();
  const { addLog } = useEventStore();
  const locale = useLocaleStore((state) => state.locale);
  const ui: any = locale === 'ru' ? ruUI : enUI;

  useEffect(() => {
    if (!hasHydrated || isDead) {
      return;
    }

    const lastLoginStr = storage.getString('lastLoginTime');
    const now = Date.now();

    if (lastLoginStr) {
      const lastLogin = Number(lastLoginStr);
      const { deltaMs, deltaSeconds } = calculateOfflineDelta(lastLogin, now);

      if (deltaMs > GameConstants.IDLE_MIN_TIME_MS) {
        if (activityFocus === 'secret') {
          const multiplier = Math.max(1, Math.floor(spiritualRoot / GameConstants.QI_BASE_MULTIPLIER));
          const earnedQi = BigInt(deltaSeconds) * BigInt(multiplier);

          addQi(earnedQi.toString());

          const logMsg = ui.idle.offline_secret
            .replace('{seconds}', deltaSeconds.toString())
            .replace('{amount}', earnedQi.toString());

          addLog(logMsg, 'system');
        } else {
          const earnedMoney = deltaSeconds * GameConstants.OFFLINE_MONEY_RATE;

          applyEffects({ money: earnedMoney.toString() });

          const logMsg = ui.idle.offline_mundane
            .replace('{seconds}', deltaSeconds.toString())
            .replace('{amount}', earnedMoney.toString());

          addLog(logMsg, 'system');
        }
      }
    }

    storage.set('lastLoginTime', now.toString());
  }, [hasHydrated]);
};