import { useEffect } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useEventStore } from '../store/useEventStore';
import { useLocaleStore } from '../store/useLocaleStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useTechniquesStore } from '../store/useTechniquesStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { storage } from '../store/mmkvStorage';
import { GameConstants } from '../constants/GameConstants';
import { calculateOfflineDelta } from '../utils/timeUtils';
import { combineModifiers, getTechniqueModifiers, getKarmaTotalEffects } from '../utils/gameplayUtils';
import { increaseBigIntByBps } from '../utils/helpers';
import ruUI from '../locales/ru/ui.json';
import enUI from '../locales/en/ui.json';

export const useIdleProgress = () => {
  const { hasHydrated, isDead, spiritualRoot, activityFocus, addQi, applyEffects } = usePlayerStore();
  const { addLog } = useEventStore();
  const pushUiNotification = useNotificationStore((state) => state.pushUiNotification);
  const locale = useLocaleStore((state) => state.locale);

  const uiData: any = locale === 'ru' ? ruUI : enUI;

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
        const cappedSeconds = Math.min(deltaSeconds, GameConstants.OFFLINE_MAX_DAYS * 86400);

        const modifiers = combineModifiers(
          getTechniqueModifiers(useTechniquesStore.getState().levels),
          getKarmaTotalEffects(useInventoryStore.getState().items)
        );

        if (activityFocus === 'secret') {
          const baseQi = Math.max(1, Math.floor((cappedSeconds * spiritualRoot) / 86400));
          const earnedQi = BigInt(increaseBigIntByBps(baseQi.toString(), modifiers.qiGainBps));

          addQi(earnedQi.toString());

          const logMsg = uiData.idle.offline_secret
            .replace('{seconds}', deltaSeconds.toString())
            .replace('{amount}', earnedQi.toString());

          addLog(logMsg, 'system');
          pushUiNotification('idle_secret', 'reward', {
            seconds: deltaSeconds.toString(),
            amount: earnedQi.toString(),
          });
        } else {
          const baseMoney = Math.max(1, Math.floor((cappedSeconds * GameConstants.OFFLINE_MONEY_PER_DAY) / 86400));
          const earnedMoney = BigInt(increaseBigIntByBps(baseMoney.toString(), modifiers.moneyGainBps));

          applyEffects({ money: earnedMoney.toString() });

          const logMsg = uiData.idle.offline_mundane
            .replace('{seconds}', deltaSeconds.toString())
            .replace('{amount}', earnedMoney.toString());

          addLog(logMsg, 'system');
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