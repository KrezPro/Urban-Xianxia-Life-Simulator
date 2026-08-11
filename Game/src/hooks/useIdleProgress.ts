import { useEffect } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { storage } from '../store/mmkvStorage';
import { GameConstants } from '../constants/GameConstants';
import { calculateOfflineDelta } from '../utils/timeUtils';

export const useIdleProgress = () => {
  const hasHydrated = usePlayerStore((state) => state.hasHydrated);
  const isDead = usePlayerStore((state) => state.isDead);
  const spiritualRoot = usePlayerStore((state) => state.spiritualRoot);
  const activityFocus = usePlayerStore((state) => state.activityFocus);
  const addQi = usePlayerStore((state) => state.addQi);
  const applyEffects = usePlayerStore((state) => state.applyEffects);
  const pushUiNotification = useNotificationStore((state) => state.pushUiNotification);

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

          pushUiNotification('idle_secret', 'reward', {
            seconds: deltaSeconds.toString(),
            amount: earnedQi.toString(),
          });
        } else {
          const earnedMoney = deltaSeconds * GameConstants.OFFLINE_MONEY_RATE;

          applyEffects({ money: earnedMoney.toString() });

          pushUiNotification('idle_mundane', 'reward', {
            seconds: deltaSeconds.toString(),
            amount: earnedMoney.toString(),
          });
        }
      }
    }

    storage.set('lastLoginTime', now.toString());
  }, [hasHydrated]);
};