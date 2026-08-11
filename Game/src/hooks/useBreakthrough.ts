import { usePlayerStore } from '../store/usePlayerStore';
import { useEventStore } from '../store/useEventStore';
import { useLocaleStore } from '../store/useLocaleStore';
import stagesData from '../data/stages.json';
import ruUI from '../locales/ru/ui.json';
import enUI from '../locales/en/ui.json';

export const useBreakthrough = () => {
  const player = usePlayerStore();
  const { addLog } = useEventStore();
  const locale = useLocaleStore((state) => state.locale);
  const uiData: any = locale === 'ru' ? ruUI.dao_screen : enUI.dao_screen;

  const currentStageIndex = stagesData.findIndex((s) => s.id === player.cultivationStage);
  const nextStage = stagesData[currentStageIndex + 1];

  const calculateChance = (hasAdBuff: boolean = false) => {
    if (!nextStage) {
      return 0;
    }

    const rootBonus = player.spiritualRoot * 0.005;
    const intBonus = player.intelligence * 0.002;
    let chance = nextStage.baseSuccessRate + rootBonus + intBonus;

    if (hasAdBuff) {
      chance += 0.15;
    }

    if (chance > 0.99) {
      chance = 0.99;
    }

    return chance;
  };

  const attemptBreakthrough = (hasAdBuff: boolean = false, clearBuff: () => void) => {
    if (!nextStage || player.isDead) {
      return;
    }

    const reqQi = BigInt(nextStage.requiredQi);
    const currentQi = BigInt(player.qi);

    if (reqQi > currentQi) {
      addLog(uiData.log_no_qi, 'system');
      return;
    }

    player.deductQi(nextStage.requiredQi);

    const chance = calculateChance(hasAdBuff);
    const roll = Math.random();
    const isSuccess = chance >= roll;

    if (isSuccess) {
      player.setCultivationStage(nextStage.id);
      addLog(uiData.log_success.replace('{name}', nextStage.name), 'secret');
    } else {
      if (hasAdBuff) {
        addLog(uiData.log_ad_saved, 'secret');
      } else {
        const damage = 30;

        if (player.health > damage) {
          player.applyEffects({ health: -damage });
          addLog(uiData.log_fail_damage.replace('{damage}', damage.toString()), 'secret');
        } else {
          player.applyEffects({ health: -damage });
          addLog(uiData.log_fail_death, 'system');
        }
      }
    }

    if (hasAdBuff) {
      clearBuff();
    }
  };

  return { attemptBreakthrough, nextStage, calculateChance };
};