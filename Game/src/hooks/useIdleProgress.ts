import { useEffect } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { storage } from '../store/mmkvStorage';
import { GameConstants } from '../constants/GameConstants';

export const useIdleProgress = () => {
  const { addQi, hasHydrated, spiritualRoot } = usePlayerStore();

  useEffect(() => {
    if (!hasHydrated) return;

    const lastLoginStr = storage.getString('lastLoginTime');
    const now = Date.now();

    if (lastLoginStr) {
      const lastLogin = Number(lastLoginStr);
      const deltaMs = now - lastLogin;

      // Начисляем прогресс только если прошло достаточно времени
      if (deltaMs > GameConstants.IDLE_MIN_TIME_MS) {
        const deltaSeconds = Math.floor(deltaMs / 1000);
        // Базовый расчет: 1 сек = (spiritualRoot / 10) Ци
        const multiplier = Math.max(1, Math.floor(spiritualRoot / GameConstants.QI_BASE_MULTIPLIER));
        const earnedQi = BigInt(deltaSeconds) * BigInt(multiplier);
        
        addQi(earnedQi);
      }
    }

    // Обновляем время последнего входа
    storage.set('lastLoginTime', now.toString());
  }, [hasHydrated, addQi, spiritualRoot]);
};