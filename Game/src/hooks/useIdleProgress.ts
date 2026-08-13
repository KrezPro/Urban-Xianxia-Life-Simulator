import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { usePlayerStore } from '../store/usePlayerStore';
import { useEventStore } from '../store/useEventStore';
import { useLocaleStore } from '../store/useLocaleStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useTechniquesStore } from '../store/useTechniquesStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { storage } from '../store/mmkvStorage';
import { GameConstants } from '../constants/GameConstants';
import { calculateOfflineDelta } from '../utils/timeUtils';
import {
  combineModifiers,
  getTechniqueModifiers,
  getKarmaTotalEffects,
  getStageMeditationMultiplier,
} from '../utils/gameplayUtils';
import ruUI from '../locales/ru/ui.json';
import enUI from '../locales/en/ui.json';

export const useIdleProgress = () => {
  const {
    hasHydrated,
    isDead,
    spiritualRoot,
    cultivationStage,
    activityFocus,
    addQi,
    applyEffects,
  } = usePlayerStore();
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
        const days = cappedSeconds / 86400;
        const modifiers = combineModifiers(
          getTechniqueModifiers(useTechniquesStore.getState().levels),
          getKarmaTotalEffects(useInventoryStore.getState().items)
        );

        if (activityFocus === 'secret') {
          const dailyQi =
            spiritualRoot *
            GameConstants.MEDITATION_QI_MULTIPLIER *
            getStageMeditationMultiplier(cultivationStage);
          const flatQiPerYear = Math.min(GameConstants.QI_FLAT_CAP, modifiers.qiFlatPerYear || 0);
          const baseQi = Math.floor(dailyQi * days);
          const flatQi = Math.floor((flatQiPerYear * days) / 365);
          const earnedQiNumber = Math.max(1, baseQi + flatQi);
          const earnedQi = BigInt(earnedQiNumber);
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
          const flatMoneyPerYear = Math.min(
            GameConstants.MONEY_FLAT_CAP,
            modifiers.moneyFlatPerYear || 0
          );
          const baseMoney = Math.floor(days * GameConstants.OFFLINE_MONEY_PER_DAY);
          const flatMoney = Math.floor((flatMoneyPerYear * days) / 365);
          const earnedMoneyNumber = Math.max(1, baseMoney + flatMoney);
          applyEffects({ money: earnedMoneyNumber.toString() });
          const logMsg = uiData.idle.offline_mundane
            .replace('{seconds}', deltaSeconds.toString())
            .replace('{amount}', earnedMoneyNumber.toString());
          addLog(logMsg, 'system');
          pushUiNotification('idle_mundane', 'reward', {
            seconds: deltaSeconds.toString(),
            amount: earnedMoneyNumber.toString(),
          });
        }
      }
    }

    storage.set('lastLoginTime', now.toString());
  }, [hasHydrated]);

  // Автосохранение времени последней активности.
  // Прогресс самих игровых сторов уже пишется в MMKV при каждом изменении,
  // а здесь мы фиксируем момент последней сессии для корректного offline-прогресса.
  useEffect(() => {
    const saveLastActive = () => {
      storage.set('lastLoginTime', Date.now().toString());
    };

    const interval = setInterval(saveLastActive, 60000);

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' || nextAppState === 'background' || nextAppState === 'inactive') {
        saveLastActive();
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, []);
};