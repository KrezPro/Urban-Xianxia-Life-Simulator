import { usePlayerStore } from '../store/usePlayerStore';
import { useEventStore } from '../store/useEventStore';
import stagesData from '../data/stages.json';

export const useBreakthrough = () => {
  const player = usePlayerStore();
  const { addLog } = useEventStore();

  const currentStageIndex = stagesData.findIndex(s => s.id === player.cultivationStage);
  const nextStage = stagesData[currentStageIndex + 1];

  const calculateChance = () => {
    if (!nextStage) return 0;
    
    // Бонус от духовного корня (0.5% за единицу) и интеллекта (0.2% за единицу)
    const rootBonus = player.spiritualRoot * 0.005;
    const intBonus = player.intelligence * 0.002;
    
    let chance = nextStage.baseSuccessRate + rootBonus + intBonus;
    
    // Ограничиваем максимальный шанс 99%
    if (chance > 0.99) {
      chance = 0.99;
    }
    
    return chance;
  };

  const attemptBreakthrough = () => {
    if (!nextStage || player.isDead) return;

    const reqQi = BigInt(nextStage.requiredQi);
    const currentQi = BigInt(player.qi);

    // Если Ци меньше требуемой, отменяем
    if (reqQi > currentQi) {
      addLog("Недостаточно энергии Ци для прорыва.", "system");
      return;
    }

    // Списываем Ци
    player.deductQi(nextStage.requiredQi);
    
    const chance = calculateChance();
    const roll = Math.random();
    // Успех, если ролл попадает в процент шанса
    const isSuccess = chance >= roll; 

    if (isSuccess) {
      player.setCultivationStage(nextStage.id);
      addLog(`[УСПЕХ] Прорыв успешен! Вы достигли стадии: ${nextStage.name}. Меридианы расширены.`, "secret");
    } else {
      // Базовый урон при провале
      const damage = 30; 
      
      player.applyEffects({ health: -damage });
      
      // Если здоровье падает ниже или равно урону, персонаж погибает
      if (damage >= player.health) {
        addLog(`[КРИТИЧЕСКИЙ ПРОВАЛ] Небесная скорбь оказалась слишком сильна. Ваши меридианы разорваны. Вы погибли.`, "system");
      } else {
        addLog(`[ПРОВАЛ] Прорыв не удался. Произошел откат энергии (Mana Burn), вы получили ${damage} урона.`, "secret");
      }
    }
  };

  return { attemptBreakthrough, nextStage, calculateChance };
};