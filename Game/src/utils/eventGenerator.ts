import {
  EffectChip,
  EventRarity,
  EventTone,
  GeneratedEvent,
  LifestyleSelection,
} from '../types';
import { GameConstants } from '../constants/GameConstants';
import { getRandomInt, safeBigInt } from './helpers';
import { getLifePhase, getStageIndex, LifePhase } from './yearlyUtils';
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
  phase: LifePhase,
  rarity: EventRarity
): { stat: string; amount: bigint | number; positive: boolean } | null => {
  const sign = effectDef.sign || 'positive';
  const positive = sign === 'positive';
  const scale = effectDef.scale || 'stat';

  if (scale === 'money') {
    const base = Number((GameConstants.EVENT_MONEY_BASE_BY_PHASE as any)[phase] || 0);
    const mult = Number((GameConstants.EVENT_RARITY_MONEY_MULTIPLIER as any)[rarity] || 1);
    const min = base * mult;
    const max = base * mult * 4;

    if (max <= 0) {
      return null;
    }

    let amount = BigInt(getRandomInt(min, max));
    const currentMoney = safeBigInt(ctx.player.money);
    const globalCap = safeBigInt(GameConstants.EVENT_MONEY_CAP);

    if (positive) {
      const softCap = currentMoney / 2n + BigInt(min);
      if (amount > softCap) {
        amount = softCap;
      }
      if (amount > globalCap) {
        amount = globalCap;
      }
    } else {
      if (amount > currentMoney) {
        amount = currentMoney;
      }
      if (amount > globalCap) {
        amount = globalCap;
      }
    }

    if (amount <= 0n) {
      return null;
    }

    return { stat: effectDef.stat || 'money', amount, positive };
  }

  if (scale === 'qi') {
    const base = Number((GameConstants.EVENT_QI_BASE_BY_PHASE as any)[phase] || 0);
    const mult = Number((GameConstants.EVENT_RARITY_QI_MULTIPLIER as any)[rarity] || 1);
    const min = base * mult;
    const max = base * mult * 4;

    if (max <= 0) {
      return null;
    }

    let amount = BigInt(getRandomInt(min, max));
    const currentQi = safeBigInt(ctx.player.qi);

    if (positive) {
      const nextQi = getNextStageQi(ctx.cultivationStage);

      if (nextQi > 0n) {
        const divisor = BigInt((GameConstants.EVENT_QI_CAP_DIVISOR as any)[rarity] || 10);
        const cap = nextQi / divisor + BigInt(min);

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
    const bps = (GameConstants.EVENT_HEALTH_DAMAGE_BPS_BY_RARITY as any)[rarity] || 600;
    let amount = Math.max(1, Math.floor((ctx.player.maxHealth * bps) / 10000));

    if (ctx.player.age < 12 || ctx.player.age >= 65) {
      amount = Math.floor(amount * 1.25);
    }

    return { stat: 'health', amount, positive: false };
  }

  if (scale === 'healthHeal') {
    const bps = (GameConstants.EVENT_HEALTH_HEAL_BPS_BY_RARITY as any)[rarity] || 300;
    const maxHeal = ctx.player.maxHealth - ctx.player.health;

    if (maxHeal <= 0) {
      return null;
    }

    const amount = Math.min(maxHeal, Math.max(1, Math.floor((ctx.player.maxHealth * bps) / 10000)));
    return { stat: 'health', amount, positive: true };
  }

  if (scale === 'karma') {
    const base = (GameConstants.EVENT_KARMA_CHANGE_BY_RARITY as any)[rarity] || 1;
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

  const base = (GameConstants.EVENT_STAT_CHANGE_BY_RARITY as any)[rarity] || 1;
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
  const phase = getLifePhase(ctx.age, ctx.cultivationStage);

  let eligible = rules.filter((rule) => {
    if (!Array.isArray(rule.pool) || !rule.pool.includes(chosenPool)) {
      return false;
    }

    if (Array.isArray(rule.age) && !rule.age.includes(ageGroup)) {
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

  const hardship =
    ctx.player.money === '0' ||
    ctx.player.health * 100 < ctx.player.maxHealth * 30;

  if (hardship) {
    const negativeEligible = eligible.filter((rule) => rule.tone === 'negative');

    if (negativeEligible.length > 0) {
      eligible = negativeEligible;
    }
  }

  if (!eligible.length) {
    eligible = rules.filter((rule) => rule.id === 'generic_common');
  }

  if (!eligible.length) {
    return {
      id: 'generic_common',
      pool: chosenPool,
      category: 'generic',
      rarity: 'common',
      tone: 'neutral',
      titleKey: 'titles.neutral_common',
      textKey: 'templates.tmpl_simple',
      params: { outcome: 'outcomes_generic.ok' },
      effects: {},
      displayEffects: [],
      logType: chosenPool,
    };
  }

  const rule = chooseWeighted(eligible.map((r) => ({ weight: r.weight || 10, value: r }))) || eligible[0];

  const rarityOptions: EventRarity[] = Array.isArray(rule.rarity) && rule.rarity.length > 0
    ? rule.rarity
    : ['common'];

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

  const effects: any = {};

  (rule.effects || []).forEach((effectDef: any) => {
    const chanceBps = effectDef.chanceBps === undefined ? 10000 : effectDef.chanceBps;

    if (getRandomInt(0, 9999) >= chanceBps) {
      return;
    }

    const calculated = calculateEffectValue(effectDef, ctx, phase, rarity);

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