import { DeathCause, ModifierSet, RebirthReport } from '../types';
import { getRandomInt } from './helpers';
import { GameConstants } from '../constants/GameConstants';
import rebirthData from '../data/rebirthPenalties.json';

const data: any = rebirthData;

export const getCurseById = (curseId: string): any => {
  return (data.curses || []).find((curse: any) => curse.id === curseId);
};

export const getCurseModifiers = (activeCurses: string[]): ModifierSet => {
  const modifiers: ModifierSet = {
    moneyGainBps: 0,
    jobIncomeBps: 0,
    qiGainBps: 0,
    breakthroughChanceBps: 0,
    healthRegenBps: 0,
    damageReductionBps: 0,
    portalSuccessBps: 0,
    portalMoneyBps: 0,
  };

  activeCurses.forEach((curseId) => {
    const curse = getCurseById(curseId);

    if (!curse || !curse.modifiers) {
      return;
    }

    (Object.keys(modifiers) as Array<keyof ModifierSet>).forEach((key) => {
      modifiers[key] += curse.modifiers[key] || 0;
    });
  });

  return modifiers;
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

const causeAffinity: Record<DeathCause, string[]> = {
  none: [],
  old_age: ['curse_major_sickly', 'curse_minor_frail'],
  health: ['curse_major_sickly', 'curse_minor_frail'],
  breakthrough: ['curse_major_cracked_meridians', 'curse_major_heaven_mark'],
  portal: ['curse_major_debt', 'curse_minor_hunger'],
  event: ['curse_minor_fog', 'curse_minor_rough_skin'],
};

const chooseCurse = (severity: 'minor' | 'major', deathCause: DeathCause, existing: string[]): string | null => {
  const candidates = (data.curses || []).filter(
    (curse: any) => curse.severity === severity && !existing.includes(curse.id)
  );

  if (!candidates.length) {
    return null;
  }

  const affinity = causeAffinity[deathCause] || [];

  const items = candidates.map((curse: any) => ({
    weight: 100 + (affinity.includes(curse.id) ? 250 : 0),
    value: curse.id,
  }));

  return chooseWeighted(items);
};

export const rollRebirthReport = (deathCause: DeathCause): RebirthReport => {
  if (deathCause === 'none') {
    return {
      fortuneTier: 'blessed',
      moneyPenaltyKey: 'money_loss_0',
      moneyPenaltyBps: 0,
      healthStartKey: 'health_start_100',
      healthStartBps: 10000,
      curses: [],
      deathCause,
    };
  }

  const roll = getRandomInt(0, 9999);
  const tier = (data.fortuneTiers || []).find((t: any) => roll >= t.minRoll && roll <= t.maxRoll)
    || data.fortuneTiers[0];

  let moneyPenaltyKey = 'money_loss_0';
  let moneyPenaltyBps = 0;
  let healthStartKey = 'health_start_100';
  let healthStartBps = 10000;
  const curses: string[] = [];

  const picks: number = tier.picks || 0;

  for (let i = 0; i < picks; i += 1) {
    const entry = chooseWeighted((tier.entries || []).map((e: any) => ({ weight: e.weight, value: e })));

    if (!entry) {
      continue;
    }

    if (entry.kind === 'money') {
      const bps = data.moneyPenalties[entry.ref] || 0;

      if (bps > moneyPenaltyBps) {
        moneyPenaltyBps = bps;
        moneyPenaltyKey = entry.ref;
      }
    }

    if (entry.kind === 'health') {
      const bps = data.healthStart[entry.ref] || 10000;

      if (bps < healthStartBps) {
        healthStartBps = bps;
        healthStartKey = entry.ref;
      }
    }

    if (entry.kind === 'curse') {
      if (curses.length < GameConstants.REBIRTH_CURSE_MAX_PER_LIFE) {
        const curseId = chooseCurse(entry.severity, deathCause, curses);

        if (curseId) {
          curses.push(curseId);
        }
      }
    }
  }

  return {
    fortuneTier: tier.id,
    moneyPenaltyKey,
    moneyPenaltyBps,
    healthStartKey,
    healthStartBps,
    curses,
    deathCause,
  };
};