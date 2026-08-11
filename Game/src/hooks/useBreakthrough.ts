import { usePlayerStore } from '../store/usePlayerStore';
import { useEventStore } from '../store/useEventStore';
import { GameConstants } from '../constants/GameConstants';

export const useBreakthrough = () => {
  const { age, spiritualRoot } = usePlayerStore();
  const { addLog } = useEventStore();

  const attemptBreakthrough = () => {
    // Простейшая формула шанса прорыва
    const chance = GameConstants.BASE_BREAKTHROUGH_CHANCE + (spiritualRoot * 0.01);
    const isSuccess = Math.random() < chance;
    
    const timestamp = Date.now();

    if (isSuccess) {
      addLog({
        id: timestamp.toString(),
        age,
        text: 'cultivation.breakthrough_success',
        type: 'cultivation',
        timestamp
      });
      // В будущем: логика повышения cultivationStage и списания Ци
    } else {
      // Шанс на смертельный исход или тяжелую травму
      const isLethal = Math.random() < 0.1; // 10% шанс смерти при провале
      
      if (isLethal) {
        addLog({
          id: timestamp.toString(),
          age,
          text: 'cultivation.breakthrough_fail_death',
          type: 'system',
          timestamp
        });
        // В будущем: вызов функции смерти / реинкарнации
      } else {
        addLog({
          id: timestamp.toString(),
          age,
          text: 'cultivation.breakthrough_fail_minor',
          type: 'cultivation',
          timestamp
        });
        // В будущем: логика отнятия здоровья (health)
      }
    }
  };

  return { attemptBreakthrough };
};