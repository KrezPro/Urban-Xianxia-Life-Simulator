import {
  EffectChip,
  EventRarity,
  EventTone,
  GeneratedEvent,
  LifestyleSelection,
  ModifierSet,
} from '../types';
import { GameConstants } from '../constants/GameConstants';
import { getRandomInt, safeBigInt } from './helpers';
import { getStageIndex } from './gameplayUtils';
import eventRulesData from '../data/eventRules.json';
import stagesData from '../data/stages.json';

type AgeGroup = 'child' | 'teen' | 'adult' | 'mature' | 'elder';

interface GeneratorContext {
  age: number;
  focus: 'mundane' | 'secret';
  cultivationStage: string;
  lifestyle: LifestyleSelection;
  player: {
    money: string;
    qi: string;
    karma: string;
    health: number;
    maxHealth: number;
    intelligence: number;
    appearance: number;
    spiritualRoot: number;
  };
  modifiers: ModifierSet;
}

const rules: any[] = (eventRulesData as any).rules || [];

const getAgeGroup = (age: number): AgeGroup => {
  if (age < 12) {
    return 'child';
  }

  if (age < 18) {
    return 'teen';
  }

  if (age < 50) {
    return 'adult';
  }

  if (age < 80) {
    return 'mature';
  }

  return 'elder';
};

const getEventTier = (age: number, stageId: string): number => {
  const ageTier = age < 12 ? 0 : age < 18 ? 1 : 2;

  let stageTier = 0;

  if (stageId.startsWith('qi_condensation')) {
    stageTier = 3;
  } else if (stageId.startsWith('foundation')) {
    stageTier = 4;
  } else if (stageId === 'core_formation') {
    stageTier = 5;
  } else if (stageId === 'immortal') {
    stageTier = 6;
  }

  return Math.max(ageTier, stageTier);
};

const chooseWeighted = <T,>(items: Array<{ weight: number; value: T }>): T | null => {
  if (!items.length) {
    return null;
  }

  const total = items.reduce((sum, item) => sum + item.weight, 0);

  if (total <= 0) {
    return items[0].value;
  }

  let roll = getRandomInt(1, total);

  for (const item of items) {
    roll -= item.weight;

    if (roll <= 0) {
      return item.value;
    }
  }

  return items[items.length - 1].value;
};

const meetsActivities = (rule: any, lifestyle: LifestyleSelection): boolean => {
  const requirements = rule.requiresActivities;

  if (!requirements) {
    return true;
  }

  return Object.keys(requirements).every((category) => {
    const allowed = requirements[category] || [];
    return allowed.includes(lifestyle[category as keyof LifestyleSelection]);
  });
};

const getNextStageQi = (stageId: string): bigint => {
  const index = getStageIndex(stageId);
  const nextStage = (stagesData as any[])[index + 1];

  if (!nextStage || !nextStage.requiredQi) {
    return 0n;
  }

  return safeBigInt(nextStage.requiredQi);
};

const calculateEffectValue = (
  effectDef: any,
  ctx: GeneratorContext,
  tier: number,
  rarity: EventRarity
): { stat: string; amount: bigint | number; positive: boolean } | null => {
  const sign = effectDef.sign || 'positive';
  const positive = sign === 'positive';
  const scale = effectDef.scale || 'stat';

  if (scale === 'money') {
    const base =
      GameConstants.EVENT_MONEY_BASE_BY_TIER[tier] *
      GameConstants.EVENT_RARITY_MONEY_MULTIPLIER[rarity];

    let amount = BigInt(getRandomInt(base, base * 4));

    const currentMoney = safeBigInt(ctx.player.money);

    if (positive) {
      const cap = currentMoney / 2n + BigInt(base);

      if (amount > cap) {
        amount = cap;
      }
    } else {
      if (amount > currentMoney) {
        amount = currentMoney;
      }
    }

    if (amount <= 0n) {
      return null;
    }

    return { stat: effectDef.stat || 'money', amount, positive };
  }

  if (scale === 'qi') {
    const base =
      GameConstants.EVENT_QI_BASE_BY_TIER[tier] *
      GameConstants.EVENT_RARITY_QI_MULTIPLIER[rarity];

    let amount = BigInt(getRandomInt(base, base * 4));
    const currentQi = safeBigInt(ctx.player.qi);

    if (positive) {
      const nextQi = getNextStageQi(ctx.cultivationStage);

      if (nextQi > 0n) {
        const divisor = BigInt(GameConstants.EVENT_QI_CAP_DIVISOR[rarity] || 10);
        const cap = nextQi / divisor + BigInt(base);

        if (amount > cap) {
          amount = cap;
        }
      }
    } else {
      if (amount > currentQi) {
        amount = currentQi;
      }
    }

    if (amount <= 0n) {
      return null;
    }

    return { stat: effectDef.stat || 'qi', amount, positive };
  }

  if (scale === 'healthDamage') {
    const bps = GameConstants.EVENT_HEALTH_DAMAGE_BPS_BY_RARITY[rarity] || 400;
    const amount = Math.max(1, Math.floor((ctx.player.maxHealth * bps) / 10000));
    return { stat: 'health', amount, positive: false };
  }

  if (scale === 'healthHeal') {
    const bps = GameConstants.EVENT_HEALTH_HEAL_BPS_BY_RARITY[rarity] || 300;
    const maxHeal = ctx.player.maxHealth - ctx.player.health;

    if (maxHeal <= 0) {
      return null;
    }

    const amount = Math.min(maxHeal, Math.max(1, Math.floor((ctx.player.maxHealth * bps) / 10000)));
    return { stat: 'health', amount, positive: true };
  }

  if (scale === 'karma') {
    const base = GameConstants.EVENT_KARMA_CHANGE_BY_RARITY[rarity] || 1;
    let amount = getRandomInt(1, base);

    if (!positive) {
      const currentKarma = safeBigInt(ctx.player.karma);

      if (currentKarma < BigInt(amount)) {
        amount = Number(currentKarma);
      }
    }

    if (amount <= 0) {
      return null;
    }

    return { stat: 'karma', amount, positive };
  }

  const base = GameConstants.EVENT_STAT_CHANGE_BY_RARITY[rarity] || 1;
  let amount = getRandomInt(1, base);

  if (!positive) {
    const currentValue = (ctx.player as any)[effectDef.stat] || 0;
    amount = Math.min(amount, currentValue);
  }

  if (amount <= 0) {
    return null;
  }

  return { stat: effectDef.stat, amount, positive };
};

export const generateYearEvent = (ctx: GeneratorContext): GeneratedEvent => {
  const secretChanceBps =
    ctx.focus === 'secret'
      ? GameConstants.EVENT_SECRET_FOCUS_CHANCE_BPS
      : GameConstants.EVENT_MUNDANE_SECRET_CHANCE_BPS;

  const chosenPool: 'mundane' | 'secret' =
    getRandomInt(0, 9999) < secretChanceBps ? 'secret' : 'mundane';

  const ageGroup = getAgeGroup(ctx.age);
  const stageIndex = getStageIndex(ctx.cultivationStage);

  let eligible = rules.filter((rule) => {
    if (!rule.pool.includes(chosenPool)) {
      return false;
    }

    if (rule.age && !rule.age.includes(ageGroup)) {
      return false;
    }

    if (rule.stageMin) {
      const minIndex = getStageIndex(rule.stageMin);

      if (stageIndex < minIndex) {
        return false;
      }
    }

    if (rule.stageMax) {
      const maxIndex = getStageIndex(rule.stageMax);

      if (stageIndex > maxIndex) {
        return false;
      }
    }

    return meetsActivities(rule, ctx.lifestyle);
  });

  if (!eligible.length) {
    eligible = rules.filter((rule) => rule.id === 'generic_common');
  }

  if (!eligible.length) {
    eligible = rules;
  }

  const rule = chooseWeighted(eligible.map((r) => ({ weight: r.weight || 10, value: r }))) || eligible[0];

  const rarityOptions: EventRarity[] = rule.rarity?.length ? rule.rarity : ['common'];
  const rarity =
    chooseWeighted(
      rarityOptions.map((r) => ({
        weight: (GameConstants.EVENT_RARITY_WEIGHTS as any)[r] || 1,
        value: r,
      }))
    ) || 'common';

  const params: Record<string, string> = {};

  Object.keys(rule.params || {}).forEach((key) => {
    const list = rule.params[key] || [];

    if (list.length) {
      params[key] = list[getRandomInt(0, list.length - 1)];
    }
  });

  const tier = getEventTier(ctx.age, ctx.cultivationStage);
  const effects: any = {};

  (rule.effects || []).forEach((effectDef: any) => {
    const chanceBps = effectDef.chanceBps === undefined ? 10000 : effectDef.chanceBps;

    if (getRandomInt(0, 9999) >= chanceBps) {
      return;
    }

    const calculated = calculateEffectValue(effectDef, ctx, tier, rarity);

    if (!calculated) {
      return;
    }

    if (calculated.stat === 'money' || calculated.stat === 'qi') {
      const current = safeBigInt(effects[calculated.stat] || '0');
      const value = calculated.amount as bigint;
      const signed = calculated.positive ? value : -value;
      effects[calculated.stat] = (current + signed).toString();
      return;
    }

    const current = Number(effects[calculated.stat] || 0);
    const value = Number(calculated.amount);
    effects[calculated.stat] = current + (calculated.positive ? value : -value);
  });

  if (effects.money && safeBigInt(effects.money) < 0n) {
    const currentMoney = safeBigInt(ctx.player.money);
    const loss = safeBigInt(effects.money);

    if (-loss > currentMoney) {
      effects.money = (-currentMoney).toString();
    }
  }

  if (effects.qi && safeBigInt(effects.qi) < 0n) {
    const currentQi = safeBigInt(ctx.player.qi);
    const loss = safeBigInt(effects.qi);

    if (-loss > currentQi) {
      effects.qi = (-currentQi).toString();
    }
  }

  const displayEffects: EffectChip[] = [];

  Object.keys(effects).forEach((stat) => {
    const value = effects[stat];

    if (stat === 'money' || stat === 'qi') {
      const big = safeBigInt(value);

      if (big === 0n) {
        return;
      }

      displayEffects.push({
        stat: stat as EffectChip['stat'],
        amount: (big < 0n ? -big : big).toString(),
        positive: big > 0n,
      });
      return;
    }

    const num = Number(value);

    if (num === 0) {
      return;
    }

    displayEffects.push({
      stat: stat as EffectChip['stat'],
      amount: Math.abs(num).toString(),
      positive: num > 0,
    });
  });

  return {
    id: rule.id,
    pool: chosenPool,
    category: rule.category || 'generic',
    rarity,
    tone: (rule.tone || 'neutral') as EventTone,
    titleKey: `titles.${rule.tone || 'neutral'}_${rarity}`,
    textKey: rule.textTemplate || 'templates.tmpl_simple',
    params,
    effects,
    displayEffects,
    logType: chosenPool,
  };
};