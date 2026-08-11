import { useEffect } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useEventStore } from '../store/useEventStore';
import { useLocaleStore } from '../store/useLocaleStore';
import { storage } from '../store/mmkvStorage';
import { GameConstants } from '../constants/GameConstants';
import { calculateOfflineDelta } from '../utils/timeUtils';

export const useIdleProgress = () => {
  const { hasHydrated, isDead, spiritualRoot, activityFocus, addQi, applyEffects } = usePlayerStore();
  const { addLog } = useEventStore();
  const locale = useLocaleStore(state => state.locale);

  useEffect(() => {
    // Ждем гидратации и не начисляем прогресс мертвым
    if (!hasHydrated || isDead) return;

    const lastLoginStr = storage.getString('lastLoginTime');
    const now = Date.now();

    if (lastLoginStr) {
      const lastLogin = Number(lastLoginStr);
      const { deltaMs, deltaSeconds } = calculateOfflineDelta(lastLogin, now);

      // Проверка на минимальное время оффлайна
      if (deltaMs > GameConstants.IDLE_MIN_TIME_MS) {
        if (activityFocus === 'secret') {
          const multiplier = Math.max(1, Math.floor(spiritualRoot / GameConstants.QI_BASE_MULTIPLIER));
          const earnedQi = BigInt(deltaSeconds) * BigInt(multiplier);
          
          addQi(earnedQi.toString());
          
          const logMsg = locale === 'ru' 
            ? `Оффлайн прогресс: Вы медитировали ${deltaSeconds} сек. Получено Ци: ${earnedQi}`
            : `Offline progress: Meditated for ${deltaSeconds}s. Earned Qi: ${earnedQi}`;
          addLog(logMsg, 'system');
          
        } else {
          const earnedMoney = deltaSeconds * GameConstants.OFFLINE_MONEY_RATE;
          
          applyEffects({ money: earnedMoney.toString() });
          
          const logMsg = locale === 'ru'
            ? `Оффлайн прогресс: Вы работали ${deltaSeconds} сек. Заработано: $${earnedMoney}`
            : `Offline progress: Worked for ${deltaSeconds}s. Earned: $${earnedMoney}`;
          addLog(logMsg, 'system');
        }
      }
    }

    // Сохраняем текущее время для следующей сессии
    storage.set('lastLoginTime', now.toString());
  }, [hasHydrated]); // Срабатывает только 1 раз при монтировании и гидратации
};