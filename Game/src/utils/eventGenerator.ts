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
    bodyTempering?: number;
  };
  modifiers?: ModifierSet;
}

const rawRules: any[] = Array.isArray((eventRulesData as any).rules)
  ? (eventRulesData as any).rules
  : [];

const slotPools: Record<string, string[]> = {};
const rawSlotPools = (eventRulesData as any).slotPools;
if (rawSlotPools && typeof rawSlotPools === 'object') {
  Object.keys(rawSlotPools).forEach((poolName) => {
    const poolValues = rawSlotPools[poolName];
    if (Array.isArray(poolValues)) {
      slotPools[poolName] = poolValues.filter((value) => typeof value === 'string');
    }
  });
}

const STANDARD_SLOTS = [
  'intro',
  'scene',
  'incident',
  'twist',
  'outcome',
  'actor',
  'action',
  'place',
];

const tableNumber = (table: any, key: string | number, fallback: number): number => {
  if (!table) {
    return fallback;
  }
  const value = table[key as any];
  return typeof value === 'number' ? value : fallback;
};

function pickRandom<T>(arr: T[]): T | null {
  if (!Array.isArray(arr) || arr.length === 0) {
    return null;
  }
  return arr[getRandomInt(0, arr.length - 1)];
}

function chooseWeighted<T>(items: Array<{ weight: number; value: T }>): T | null {
  if (!items || items.length === 0) {
    return null;
  }
  const total = items.reduce((sum, item) => sum + (item.weight || 0), 0);
  if (total <= 0) {
    return items[0].value;
  }
  let roll = getRandomInt(1, total);
  for (const item of items) {
    roll -= item.weight || 0;
    if (roll <= 0) {
      return item.value;
    }
  }
  return items[items.length - 1].value;
}

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
  const safeStage = stageId || 'mortal';
  const ageTier = age < 12 ? 0 : age < 18 ? 1 : 2;
  let stageTier = 0;
  if (safeStage.startsWith('qi_condensation')) {
    stageTier = 3;
  } else if (safeStage.startsWith('foundation')) {
    stageTier = 4;
  } else if (safeStage === 'core_formation') {
    stageTier = 5;
  } else if (safeStage === 'immortal') {
    stageTier = 6;
  }
  return Math.max(ageTier, stageTier);
};

const getSlotCandidates = (slotConfig: any): string[] => {
  if (typeof slotConfig === 'string') {
    return [slotConfig];
  }
  if (Array.isArray(slotConfig)) {
    return slotConfig.filter((value) => typeof value === 'string');
  }
  return [];
};

const chooseValueFromCandidates = (candidates: string[]): string => {
  const available = candidates.filter(
    (poolName) => Array.isArray(slotPools[poolName]) && slotPools[poolName].length > 0
  );
  if (available.length === 0) {
    return '';
  }
  const poolName = pickRandom(available) || '';
  const values = slotPools[poolName] || [];
  return pickRandom(values) || '';
};

const chooseSlotValue = (slotName: string, rule: any): string => {
  const directCandidates = getSlotCandidates(rule?.slots?.[slotName]);
  const directValue = chooseValueFromCandidates(directCandidates);
  if (directValue !== '') {
    return directValue;
  }
  return chooseValueFromCandidates([`fallback_${slotName}`]);
};

const meetsActivities = (rule: any, lifestyle: LifestyleSelection | undefined): boolean => {
  const requirements = rule?.requiresActivities;
  if (!requirements) {
    return true;
  }
  const safeLifestyle: any = lifestyle || {};
  return Object.keys(requirements).every((category) => {
    const allowed = requirements[category] || [];
    return Array.isArray(allowed) && allowed.includes(safeLifestyle[category]);
  });
};

const getNextStageQi = (stageId: string): bigint => {
  const index = getStageIndex(stageId || 'mortal');
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
  if (!effectDef) {
    return null;
  }
  const player: any = ctx.player || {};
  const sign = effectDef.sign || 'positive';
  const positive = sign === 'positive';
  const scale = effectDef.scale || 'stat';
  const maxHealth =
    typeof player.maxHealth === 'number' && player.maxHealth > 0 ? player.maxHealth : 100;
  const currentHealth = typeof player.health === 'number' ? player.health : maxHealth;
  const bodyLevel = typeof player.bodyTempering === 'number' ? player.bodyTempering : 0;

  if (scale === 'money') {
    const base = Math.floor(
      tableNumber((GameConstants as any).EVENT_MONEY_BASE_BY_TIER, tier, 100) *
        tableNumber((GameConstants as any).EVENT_RARITY_MONEY_MULTIPLIER, rarity, 1)
    );
    if (base <= 0) {
      return null;
    }
    let amount = BigInt(getRandomInt(base, base * 4));
    const currentMoney = safeBigInt(player.money);
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
    const base = Math.floor(
      tableNumber((GameConstants as any).EVENT_QI_BASE_BY_TIER, tier, 5) *
        tableNumber((GameConstants as any).EVENT_RARITY_QI_MULTIPLIER, rarity, 1)
    );
    if (base <= 0) {
      return null;
    }
    let amount = BigInt(getRandomInt(base, base * 4));
    const currentQi = safeBigInt(player.qi);
    if (positive) {
      const nextQi = getNextStageQi(ctx.cultivationStage);
      if (nextQi > 0n) {
        const divisor = BigInt(
          tableNumber((GameConstants as any).EVENT_QI_CAP_DIVISOR, rarity, 10)
        );
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
    const rawBps = tableNumber(
      (GameConstants as any).EVENT_HEALTH_DAMAGE_BPS_BY_RARITY,
      rarity,
      600
    );
    const bodyReduction = Math.min(
      GameConstants.BODY_TEMPERING.EVENT_DAMAGE_REDUCTION_CAP_BPS,
      bodyLevel * GameConstants.BODY_TEMPERING.EVENT_DAMAGE_REDUCTION_PER_LEVEL_BPS
    );
    const bps = Math.max(200, rawBps - bodyReduction);
    const amount = Math.max(1, Math.floor((maxHealth * bps) / 10000));
    return { stat: 'health', amount, positive: false };
  }

  if (scale === 'healthHeal') {
    const bps = tableNumber((GameConstants as any).EVENT_HEALTH_HEAL_BPS_BY_RARITY, rarity, 300);
    const maxHeal = maxHealth - currentHealth;
    if (maxHeal <= 0) {
      return null;
    }
    const amount = Math.min(maxHeal, Math.max(1, Math.floor((maxHealth * bps) / 10000)));
    return { stat: 'health', amount, positive: true };
  }

  if (scale === 'karma') {
    const base = tableNumber((GameConstants as any).EVENT_KARMA_CHANGE_BY_RARITY, rarity, 1);
    if (base <= 0) {
      return null;
    }
    let amount = getRandomInt(1, base);
    if (!positive) {
      const currentKarma = safeBigInt(player.karma);
      const cap = currentKarma > BigInt(1000000) ? 1000000 : Number(currentKarma);
      amount = Math.min(amount, cap);
    }
    if (amount <= 0) {
      return null;
    }
    return { stat: 'karma', amount, positive };
  }

  const base = tableNumber((GameConstants as any).EVENT_STAT_CHANGE_BY_RARITY, rarity, 1);
  if (base <= 0) {
    return null;
  }
  let amount = getRandomInt(1, base);
  if (!positive) {
    const currentValue = typeof player[effectDef.stat] === 'number' ? player[effectDef.stat] : 0;
    amount = Math.min(amount, currentValue);
  }
  if (amount <= 0) {
    return null;
  }
  return { stat: effectDef.stat, amount, positive };
};

const buildGeneratedFallback = (pool: 'mundane' | 'secret'): GeneratedEvent => ({
  id: 'fallback_year',
  pool,
  category: 'generic',
  rarity: 'common',
  tone: 'neutral',
  titleKey: 'titles.neutral_common',
  textKey: 'templates.tmpl_simple',
  params: { outcome: 'outcomes_generic.ok' },
  effects: {},
  displayEffects: [],
  logType: pool,
});

export const generateYearEvent = (ctx: GeneratorContext): GeneratedEvent => {
  const safeCtx: GeneratorContext = {
    age: typeof ctx.age === 'number' ? ctx.age : 0,
    focus: ctx.focus === 'secret' ? 'secret' : 'mundane',
    cultivationStage: ctx.cultivationStage || 'mortal',
    lifestyle:
      ctx.lifestyle ||
      ({
        job: 'job_none',
        sport: 'sport_none',
        food: 'food_none',
        housing: 'housing_none',
        portal: 'portal_none',
      } as LifestyleSelection),
    player: {
      money: '0',
      qi: '0',
      karma: '0',
      health: 100,
      maxHealth: 100,
      intelligence: 10,
      appearance: 50,
      spiritualRoot: 10,
      bodyTempering: 0,
      ...(ctx.player || {}),
    },
  };

  const secretChanceBps =
    safeCtx.focus === 'secret'
      ? GameConstants.EVENT_SECRET_FOCUS_CHANCE_BPS
      : GameConstants.EVENT_MUNDANE_SECRET_CHANCE_BPS;

  const chosenPool: 'mundane' | 'secret' =
    getRandomInt(0, 9999) < secretChanceBps ? 'secret' : 'mundane';

  const ageGroup = getAgeGroup(safeCtx.age);
  const stageIndex = getStageIndex(safeCtx.cultivationStage);

  let eligible = rawRules.filter((rule) => {
    if (!rule || !Array.isArray(rule.pool) || !rule.pool.includes(chosenPool)) {
      return false;
    }
    if (Array.isArray(rule.focus) && !rule.focus.includes(safeCtx.focus)) {
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
    return meetsActivities(rule, safeCtx.lifestyle);
  });

  if (eligible.length === 0) {
    eligible = rawRules.filter((rule) => rule && rule.id === 'generic_common');
  }

  if (eligible.length === 0) {
    eligible = rawRules.slice();
  }

  if (eligible.length === 0) {
    return buildGeneratedFallback(chosenPool);
  }

  const chosenRule =
    chooseWeighted(eligible.map((rule) => ({ weight: rule.weight || 10, value: rule }))) ||
    eligible[0];

  const rarityOptions: EventRarity[] =
    Array.isArray(chosenRule.rarity) && chosenRule.rarity.length > 0
      ? chosenRule.rarity
      : ['common'];

  const rarity =
    chooseWeighted<EventRarity>(
      rarityOptions.map((rarityOption) => ({
        weight: tableNumber((GameConstants as any).EVENT_RARITY_WEIGHTS, rarityOption, 1),
        value: rarityOption,
      }))
    ) || 'common';

  const tone: EventTone =
    Array.isArray(chosenRule.tones) && chosenRule.tones.length > 0
      ? (chooseWeighted<EventTone>(
          chosenRule.tones.map((toneOption: EventTone) => ({
            weight: 10,
            value: toneOption,
          }))
        ) || 'neutral')
      : ((chosenRule.tone || 'neutral') as EventTone);

  const params: Record<string, string> = {};

  if (chosenRule.params && typeof chosenRule.params === 'object') {
    Object.keys(chosenRule.params).forEach((key) => {
      const list = chosenRule.params[key];
      if (Array.isArray(list) && list.length > 0) {
        const value = pickRandom(list);
        if (typeof value === 'string' || typeof value === 'number') {
          params[key] = String(value);
        }
      } else if (typeof list === 'string') {
        params[key] = list;
      }
    });
  }

  if (chosenRule.slots && typeof chosenRule.slots === 'object') {
    Object.keys(chosenRule.slots).forEach((slotName) => {
      params[slotName] = chooseSlotValue(slotName, chosenRule);
    });
  }

  STANDARD_SLOTS.forEach((slotName) => {
    if (params[slotName] === undefined || params[slotName] === '') {
      params[slotName] = chooseSlotValue(slotName, chosenRule);
    }
  });

  STANDARD_SLOTS.forEach((slotName) => {
    if (params[slotName] === undefined) {
      params[slotName] = '';
    }
  });

  const templateKey =
    Array.isArray(chosenRule.templates) && chosenRule.templates.length > 0
      ? pickRandom(chosenRule.templates) || 'templates.tmpl_simple'
      : chosenRule.textTemplate || 'templates.tmpl_simple';

  const titleKey =
    Array.isArray(chosenRule.titleKeys) && chosenRule.titleKeys.length > 0
      ? pickRandom(chosenRule.titleKeys) || `titles.${tone}_${rarity}`
      : `titles.${tone}_${rarity}`;

  const tier = getEventTier(safeCtx.age, safeCtx.cultivationStage);
  const effects: any = {};
  const bodyLevel = safeCtx.player.bodyTempering || 0;
  const illnessResistanceBps = Math.min(
    GameConstants.BODY_TEMPERING.ILLNESS_RESISTANCE_CAP_BPS,
    bodyLevel * GameConstants.BODY_TEMPERING.ILLNESS_RESISTANCE_PER_LEVEL_BPS
  );

  (Array.isArray(chosenRule.effects) ? chosenRule.effects : []).forEach((effectDef: any) => {
    let chanceBps = typeof effectDef?.chanceBps === 'number' ? effectDef.chanceBps : 10000;
    if (effectDef?.stat === 'health' && effectDef?.sign === 'negative') {
      chanceBps = Math.max(1000, chanceBps - illnessResistanceBps);
    }
    if (getRandomInt(0, 9999) >= chanceBps) {
      return;
    }
    const calculated = calculateEffectValue(effectDef, safeCtx, tier, rarity);
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
    const currentMoney = safeBigInt(safeCtx.player.money);
    const loss = safeBigInt(effects.money);
    if (-loss > currentMoney) {
      effects.money = (-currentMoney).toString();
    }
  }

  if (effects.qi && safeBigInt(effects.qi) < 0n) {
    const currentQi = safeBigInt(safeCtx.player.qi);
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
    if (num === 0 || !isFinite(num)) {
      return;
    }
    displayEffects.push({
      stat: stat as EffectChip['stat'],
      amount: Math.abs(num).toString(),
      positive: num > 0,
    });
  });

  return {
    id: chosenRule.id || 'generic_common',
    pool: chosenPool,
    category: chosenRule.category || 'generic',
    rarity,
    tone,
    titleKey,
    textKey: templateKey,
    params,
    effects,
    displayEffects,
    logType: chosenPool,
  };
};