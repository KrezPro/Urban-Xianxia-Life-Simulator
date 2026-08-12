import { formatLargeNumber } from './helpers';

export const formatBpsPercent = (bps: number): string => {
  const safe = Number.isFinite(bps) ? bps : 0;
  const percent = safe / 100;
  const fixed = percent.toFixed(1);
  return fixed.endsWith('.0') ? fixed.slice(0, -2) : fixed;
};

const toNumber = (value: any): number => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

export const buildEffectLines = (
  effects: Record<string, any> | undefined | null,
  labels: Record<string, string> | undefined | null,
  multiplier: number = 1
): string[] => {
  if (!effects || !labels) {
    return [];
  }

  const safeMultiplier = Number.isFinite(multiplier) ? multiplier : 1;
  const lines: string[] = [];

  Object.keys(effects).forEach((key) => {
    const label = labels[key];
    if (!label) {
      return;
    }

    const rawValue = effects[key];
    const numeric = toNumber(rawValue);
    if (numeric === 0) {
      return;
    }

    const value = numeric * safeMultiplier;
    if (value === 0) {
      return;
    }

    let formatted: string;

    if (key.endsWith('Bps')) {
      formatted = formatBpsPercent(value);
    } else if (typeof rawValue === 'string' && safeMultiplier === 1) {
      formatted = formatLargeNumber(rawValue);
    } else {
      formatted = formatLargeNumber(Math.floor(value).toString());
    }

    lines.push(label.replace('{value}', formatted));
  });

  return lines;
};