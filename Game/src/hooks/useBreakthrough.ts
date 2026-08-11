import { usePlayerStore } from '../store/usePlayerStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useLocaleStore } from '../store/useLocaleStore';
import stagesData from '../data/stages.json';

export const useBreakthrough = () => {
  const player = usePlayerStore();
  const pushUiNotification = useNotificationStore((state) => state.pushUiNotification);
  const locale = useLocaleStore((state) => state.locale);

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
      pushUiNotification('breakthrough_no_qi', 'system');
      return;
    }

    player.deductQi(nextStage.requiredQi);

    const chance = calculateChance(hasAdBuff);
    const roll = Math.random();
    const isSuccess = chance >= roll;

    if (isSuccess) {
      player.setCultivationStage(nextStage.id);
      pushUiNotification('breakthrough_success', 'reward', { name: nextStage.name });
    } else {
      if (hasAdBuff) {
        pushUiNotification('breakthrough_saved', 'reward');
      } else {
        const damage = 30;

        if (player.health > damage) {
          player.applyEffects({ health: -damage });
          pushUiNotification('breakthrough_fail_damage', 'danger', { damage: damage.toString() });
        } else {
          player.applyEffects({ health: -damage });
          pushUiNotification('breakthrough_fail_death', 'danger');
        }
      }
    }

    if (hasAdBuff) {
      clearBuff();
    }
  };

  return { attemptBreakthrough, nextStage, calculateChance };
};