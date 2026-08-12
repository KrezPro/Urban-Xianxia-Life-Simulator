import { GameConstants } from '../constants/GameConstants';
import {
  safeBigInt,
  increaseBigIntByPercent,
  reduceBigIntByPercent,
  randomBigIntBetween,
} from './helpers';
import itemsData from '../data/items.json';
import techniquesData from '../data/techniques.json';
import lifestyleData from '../data/lifestyle.json';
import stagesData from '../data/stages.json';

export type LifestyleCategory = 'job' | 'sport' | 'food' | 'housing' | 'portal';
export type LifestyleSelection = Record<LifestyleCategory, string>;

export interface PlayerLike {
  money: string;
  health: number;
  maxHealth: number;
  intelligence: number;
  appearance: number;
  spiritualRoot: number;
  cultivationStage: string;
}

export interface LifestyleRequirements {
  intelligence?: number;
  appearance?: number;
  spiritualRoot?: number;
  healthMin?: number;
  maxHealthMin?: number;
  stage?: string;
}

export interface LifestylePortal {
  attemptCost: string;
  successBase: number;
  moneyMin: string;
  moneyMax: string;
  qiMin: string;
  qiMax: string;
  failDamage: number;
}

export interface LifestyleEffects {
  moneyGainPercent?: number;
  jobIncomePercent?: number;
  qiGainPercent?: number;
  breakthroughChancePercent?: number;
  healthRegenPercent?: number;
  damageReductionPercent?: number;
  portalSuccessPercent?: number;
  portalMoneyPercent?: number;
  karmaGainPercent?: number;
  healthRegenPerYear?: number;
  maxHealthPerYear?: number;
  appearancePerYear?: number;
  qiPerYear?: string;
}

export interface LifestyleOption {
  id: string;
  category: LifestyleCategory;
  tier: number;
  dailyCost: string;
  dailyIncome?: string;
  requirements?: LifestyleRequirements;
  effects?: LifestyleEffects;
  portal?: LifestylePortal;
}

export interface LifestyleModifiers {
  moneyGainPercent: number;
  jobIncomePercent: number;
  qiGainPercent: number;
  breakthroughChancePercent: number;
  healthRegenPercent: number;
  damageReductionPercent: number;
  portalSuccessPercent: number;
  portalMoneyPercent: number;
  karmaGainPercent: number;
}

export interface KarmaEffects {
  startMoney: string;
  startMaxHealth: number;
  startSpiritualRoot: number;
  moneyGainPercent: number;
  qiGainPercent: number;
  breakthroughChancePercent: number;
  healthRegenPercent: number;
  damageReductionPercent: number;
  karmaGainPercent: number;
}

export interface LifestyleReport {
  moneyDelta: string;
  healthDelta: number;
  maxHealthDelta: number;
  appearanceDelta: number;
  qiDelta: string;
  disabled: LifestyleCategory[];
  portalResult: 'none' | 'success' | 'fail';
  portalMoney: string;
  portalQi: string;
  portalDamage: number;
}

export const defaultLifestyleSelection: LifestyleSelection = {
  job: 'job_none',
  sport: 'sport_none',
  food: 'food_none',
  housing: 'housing_none',
  portal: 'portal_none',
};

export const emptyModifiers = (): LifestyleModifiers => ({
  moneyGainPercent: 0,
  jobIncomePercent: 0,
  qiGainPercent: 0,
  breakthroughChancePercent: 0,
  healthRegenPercent: 0,
  damageReductionPercent: 0,
  portalSuccessPercent: 0,
  portalMoneyPercent: 0,
  karmaGainPercent: 0,
});

export const combineModifiers = (...modifiers: Array<Partial<LifestyleModifiers>>): LifestyleModifiers => {
  const result = emptyModifiers();

  modifiers.forEach((modifier) => {
    (Object.keys(result) as Array<keyof LifestyleModifiers>).forEach((key) => {
      result[key] += (modifier as any)[key] || 0;
    });
  });

  return result;
};

export const getStageIndex = (stageId: string): number => {
  const index = (stagesData as any[]).findIndex((stage) => stage.id === stageId);
  return 0 > index ? 0 : index;
};

export const getKarmaItem = (itemId: string): any => {
  return (itemsData as any[]).find((item) => item.id === itemId);
};

export const getKarmaLevel = (items: Record<string, any>, itemId: string): number => {
  const item = items?.[itemId];
  const quantity = item?.quantity || 0;
  const karmaItem = getKarmaItem(itemId);

  if (!karmaItem) {
    return 0;
  }

  return Math.min(quantity, karmaItem.maxLevel || 0);
};

export const getKarmaNextCost = (itemId: string, currentLevel: number): string => {
  const item = getKarmaItem(itemId);

  if (!item || currentLevel >= item.maxLevel) {
    return '0';
  }

  return item.levels?.[currentLevel]?.cost || '0';
};

export const getKarmaLevelEffects = (itemId: string, level: number): Record<string, number | string> => {
  const item = getKarmaItem(itemId);

  if (!item || 0 >= level) {
    return {};
  }

  return item.levels?.[level - 1]?.effects || {};
};

export const getKarmaTotalEffects = (items: Record<string, any>): KarmaEffects => {
  let startMoney = 0n;
  let startMaxHealth = 0;
  let startSpiritualRoot = 0;
  let moneyGainPercent = 0;
  let qiGainPercent = 0;
  let breakthroughChancePercent = 0;
  let healthRegenPercent = 0;
  let damageReductionPercent = 0;
  let karmaGainPercent = 0;

  (itemsData as any[])
    .filter((item) => item.type === 'karma_buff')
    .forEach((item) => {
      const level = getKarmaLevel(items, item.id);

      if (0 >= level) {
        return;
      }

      const effects = item.levels?.[level - 1]?.effects || {};
      startMoney += safeBigInt(effects.startMoney || '0');
      startMaxHealth += effects.startMaxHealth || 0;
      startSpiritualRoot += effects.startSpiritualRoot || 0;
      moneyGainPercent += effects.moneyGainPercent || 0;
      qiGainPercent += effects.qiGainPercent || 0;
      breakthroughChancePercent += effects.breakthroughChancePercent || 0;
      healthRegenPercent += effects.healthRegenPercent || 0;
      damageReductionPercent += effects.damageReductionPercent || 0;
      karmaGainPercent += effects.karmaGainPercent || 0;
    });

  return {
    startMoney: startMoney.toString(),
    startMaxHealth,
    startSpiritualRoot,
    moneyGainPercent,
    qiGainPercent,
    breakthroughChancePercent,
    healthRegenPercent,
    damageReductionPercent,
    karmaGainPercent,
  };
};

export const getTechniqueCost = (technique: any, currentLevel: number): string => {
  if (!technique || currentLevel >= technique.maxLevel) {
    return '0';
  }

  let cost = safeBigInt(technique.baseCost || '0');
  const growth = technique.costGrowthPercent || 0;

  for (let i = 0; i < currentLevel; i += 1) {
    cost = (cost * BigInt(100 + growth) + 99n) / 100n;
  }

  return cost.toString();
};

export const getTechniqueModifiers = (levels: Record<string, number>): LifestyleModifiers => {
  const modifiers = emptyModifiers();

  (techniquesData as any[]).forEach((technique) => {
    const level = levels?.[technique.id] || 0;

    if (0 >= level) {
      return;
    }

    const effects = technique.effectsPerLevel || {};

    (Object.keys(modifiers) as Array<keyof LifestyleModifiers>).forEach((key) => {
      const value = effects[key];

      if (typeof value === 'number') {
        modifiers[key] += value * level;
      }
    });
  });

  return modifiers;
};

export const meetsTechniqueRequirements = (technique: any, player: PlayerLike): boolean => {
  if (!technique) {
    return false;
  }

  if (technique.requiredSpiritualRoot && player.spiritualRoot < technique.requiredSpiritualRoot) {
    return false;
  }

  if (technique.requiredIntelligence && player.intelligence < technique.requiredIntelligence) {
    return false;
  }

  if (technique.requiredStage) {
    const requiredIndex = getStageIndex(technique.requiredStage);
    const currentIndex = getStageIndex(player.cultivationStage);

    if (currentIndex < requiredIndex) {
      return false;
    }
  }

  return true;
};

export const getAllLifestyleOptions = (): LifestyleOption[] => {
  return (lifestyleData as any).categories.reduce(
    (acc: LifestyleOption[], category: any) => acc.concat(category.options || []),
    []
  );
};

export const getOptionById = (optionId: string): LifestyleOption | undefined => {
  return getAllLifestyleOptions().find((option) => option.id === optionId);
};

export const meetsLifestyleRequirements = (option: LifestyleOption, player: PlayerLike): boolean => {
  const requirements = option.requirements;

  if (!requirements) {
    return true;
  }

  if (requirements.intelligence && player.intelligence < requirements.intelligence) {
    return false;
  }

  if (requirements.appearance && player.appearance < requirements.appearance) {
    return false;
  }

  if (requirements.spiritualRoot && player.spiritualRoot < requirements.spiritualRoot) {
    return false;
  }

  if (requirements.healthMin && player.health < requirements.healthMin) {
    return false;
  }

  if (requirements.maxHealthMin && player.maxHealth < requirements.maxHealthMin) {
    return false;
  }

  if (requirements.stage) {
    const requiredIndex = getStageIndex(requirements.stage);
    const currentIndex = getStageIndex(player.cultivationStage);

    if (currentIndex < requiredIndex) {
      return false;
    }
  }

  return true;
};

const addEffectToModifiers = (modifiers: LifestyleModifiers, effects?: LifestyleEffects): void => {
  if (!effects) {
    return;
  }

  (Object.keys(modifiers) as Array<keyof LifestyleModifiers>).forEach((key) => {
    const value = (effects as any)[key];

    if (typeof value === 'number') {
      modifiers[key] += value;
    }
  });
};

const yearlyCost = (option: LifestyleOption): bigint => {
  return safeBigInt(option.dailyCost || '0') * BigInt(GameConstants.YEAR_DAYS);
};

const jobYearlyIncome = (
  option: LifestyleOption,
  player: PlayerLike,
  modifiers: LifestyleModifiers
): bigint => {
  if (!option.dailyIncome) {
    return 0n;
  }

  const base = safeBigInt(option.dailyIncome) * BigInt(GameConstants.YEAR_DAYS);
  const bonusPercent =
    (modifiers.jobIncomePercent || 0) +
    (modifiers.moneyGainPercent || 0) +
    player.intelligence * 4 +
    player.appearance * 2;

  return increaseBigIntByPercent(base, bonusPercent);
};

const calcLifestyleNet = (
  entries: Array<{ cat: LifestyleCategory; option: LifestyleOption }>,
  player: PlayerLike,
  modifiers: LifestyleModifiers
): bigint => {
  let income = 0n;
  let cost = 0n;

  entries.forEach(({ cat, option }) => {
    cost += yearlyCost(option);

    if (cat === 'portal' && option.portal) {
      cost += safeBigInt(option.portal.attemptCost || '0');
    }

    if (cat === 'job') {
      income += jobYearlyIncome(option, player, modifiers);
    }
  });

  return income - cost;
};

export const processLifestyleYear = (
  player: PlayerLike,
  selection: LifestyleSelection,
  baseModifiers: LifestyleModifiers
): LifestyleReport => {
  const disabled: LifestyleCategory[] = [];

  const markDisabled = (category: LifestyleCategory): void => {
    if (!disabled.includes(category)) {
      disabled.push(category);
    }
  };

  const categories: LifestyleCategory[] = ['job', 'sport', 'food', 'housing', 'portal'];
  const selectedEntries = categories
    .map((cat) => ({ cat, option: getOptionById(selection[cat]) }))
    .filter(
      (entry): entry is { cat: LifestyleCategory; option: LifestyleOption } =>
        !!entry.option && entry.option.id !== `${entry.cat}_none`
    );

  let affordable = selectedEntries.filter((entry) => {
    const meets = meetsLifestyleRequirements(entry.option, player);

    if (!meets) {
      markDisabled(entry.cat);
    }

    return meets;
  });

  let net = calcLifestyleNet(affordable, player, baseModifiers);
  const currentMoney = safeBigInt(player.money);
  const priority = GameConstants.LIFESTYLE_DISABLE_PRIORITY as LifestyleCategory[];

  while (0n > currentMoney + net && affordable.length > 0) {
    let removed = false;

    for (const category of priority) {
      const index = affordable.findIndex((entry) => entry.cat === category);

      if (index >= 0) {
        markDisabled(category);
        affordable.splice(index, 1);
        removed = true;
        break;
      }
    }

    if (!removed) {
      break;
    }

    net = calcLifestyleNet(affordable, player, baseModifiers);
  }

  const activeOptions = affordable.map((entry) => entry.option);
  const optionModifiers = emptyModifiers();
  activeOptions.forEach((option) => addEffectToModifiers(optionModifiers, option.effects));
  const modifiers = combineModifiers(baseModifiers, optionModifiers);

  let income = 0n;
  let cost = 0n;

  affordable.forEach(({ cat, option }) => {
    cost += yearlyCost(option);

    if (cat === 'portal' && option.portal) {
      cost += safeBigInt(option.portal.attemptCost || '0');
    }

    if (cat === 'job') {
      income += jobYearlyIncome(option, player, modifiers);
    }
  });

  let moneyDelta = income - cost;

  const healthRegenBase = activeOptions.reduce(
    (sum, option) => sum + (option.effects?.healthRegenPerYear || 0),
    0
  );
  const maxHealthDelta = activeOptions.reduce(
    (sum, option) => sum + (option.effects?.maxHealthPerYear || 0),
    0
  );
  const appearanceDelta = activeOptions.reduce(
    (sum, option) => sum + (option.effects?.appearancePerYear || 0),
    0
  );
  const qiBase = activeOptions.reduce(
    (sum, option) => sum + safeBigInt(option.effects?.qiPerYear || '0'),
    0n
  );

  const healthRegen = Number(
    increaseBigIntByPercent(BigInt(Math.max(0, Math.floor(healthRegenBase))), modifiers.healthRegenPercent)
  );
  let healthDelta = healthRegen + maxHealthDelta;
  let qiDelta = increaseBigIntByPercent(qiBase, modifiers.qiGainPercent);

  let portalResult: LifestyleReport['portalResult'] = 'none';
  let portalMoney = '0';
  let portalQi = '0';
  let portalDamage = 0;

  const portalEntry = affordable.find((entry) => entry.cat === 'portal');

  if (portalEntry?.option.portal) {
    const portal = portalEntry.option.portal;
    const successChance = Math.min(
      GameConstants.PORTAL_MAX_CHANCE,
      Math.max(
        GameConstants.PORTAL_MIN_CHANCE,
        portal.successBase +
          player.spiritualRoot * 0.004 +
          player.intelligence * 0.002 +
          modifiers.portalSuccessPercent / 100
      )
    );

    if (successChance >= Math.random()) {
      portalResult = 'success';
      const rawMoney = randomBigIntBetween(portal.moneyMin, portal.moneyMax);
      const rawQi = randomBigIntBetween(portal.qiMin, portal.qiMax);
      const finalMoney = increaseBigIntByPercent(
        rawMoney,
        modifiers.moneyGainPercent + modifiers.portalMoneyPercent
      );
      const finalQi = increaseBigIntByPercent(rawQi, modifiers.qiGainPercent);

      moneyDelta += finalMoney;
      qiDelta += finalQi;
      portalMoney = finalMoney.toString();
      portalQi = finalQi.toString();
    } else {
      portalResult = 'fail';
      const reducedDamage = reduceBigIntByPercent(BigInt(portal.failDamage), modifiers.damageReductionPercent);
      portalDamage = Math.max(1, Number(reducedDamage));
      healthDelta -= portalDamage;
    }
  }

  return {
    moneyDelta: moneyDelta.toString(),
    healthDelta,
    maxHealthDelta,
    appearanceDelta,
    qiDelta: qiDelta.toString(),
    disabled,
    portalResult,
    portalMoney,
    portalQi,
    portalDamage,
  };
};