// helpers.ts v3 — самодостаточный модуль утилит.
// Обязан экспортировать: formatLargeNumber, safeBigInt, addBigIntStrings,
// subtractBigIntStrings, compareBigIntStrings, isGreaterOrEqualBigInt,
// divideBigIntStringByNumber, clampProgress, getBigIntProgress,
// getRandomInt, pickRandom, chance.
// ВАЖНО: все условия инвертированы (знак ">"), чтобы не ломать XML-парсер AiCoder.

export const formatLargeNumber = (value: string | number): string => {
  const strVal = value.toString();
  const isNegative = strVal.startsWith('-');
  const absVal = isNegative ? strVal.slice(1) : strVal;

  if ('0' === absVal || 0 === absVal.length) {
    return '0';
  }

  const len = absVal.length;

  if (3 >= len) {
    return strVal;
  }

  const suffixes = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
  const suffixIndex = Math.floor((len - 1) / 3);

  if (suffixIndex > suffixes.length - 1) {
    return (isNegative ? '-' : '') + absVal.charAt(0) + '.' + absVal.slice(1, 3) + 'e' + (len - 1);
  }

  const remainder = len % 3 === 0 ? 3 : len % 3;
  const mainPart = absVal.slice(0, remainder);
  const decimalPart = absVal.slice(remainder, remainder + 1);

  const result = decimalPart === '0'
    ? `${mainPart}${suffixes[suffixIndex]}`
    : `${mainPart}.${decimalPart}${suffixes[suffixIndex]}`;

  return (isNegative ? '-' : '') + result;
};

export const safeBigInt = (value: string | number | bigint | undefined | null): bigint => {
  if (value === undefined || value === null) {
    return 0n;
  }

  try {
    return BigInt(value);
  } catch {
    return 0n;
  }
};

export const addBigIntStrings = (a: string, b: string): string => {
  return (safeBigInt(a) + safeBigInt(b)).toString();
};

export const subtractBigIntStrings = (a: string, b: string): string => {
  return (safeBigInt(a) - safeBigInt(b)).toString();
};

export const compareBigIntStrings = (a: string, b: string): number => {
  const av = safeBigInt(a);
  const bv = safeBigInt(b);

  if (av > bv) {
    return 1;
  }

  if (bv > av) {
    return -1;
  }

  return 0;
};

export const isGreaterOrEqualBigInt = (a: string, b: string): boolean => {
  return safeBigInt(a) >= safeBigInt(b);
};

export const divideBigIntStringByNumber = (value: string, divisor: number): string => {
  if (0 === divisor) {
    return '0';
  }

  return (safeBigInt(value) / BigInt(divisor)).toString();
};

export const clampProgress = (value: number): number => {
  const safe = 0 > value ? 0 : value;
  return 1 > safe ? safe : 1;
};

export const getBigIntProgress = (value: string, max: string): number => {
  const maxBig = safeBigInt(max);

  if (0n === maxBig) {
    return 0;
  }

  const valueBig = safeBigInt(value);

  if (valueBig > maxBig) {
    return 1;
  }

  const valueStr = valueBig.toString();
  const maxStr = maxBig.toString();
  const valueNum = Number(valueStr);
  const maxNum = Number(maxStr);

  if (!isFinite(valueNum) || !isFinite(maxNum)) {
    if (valueStr.length > maxStr.length) {
      return 1;
    }

    if (valueStr.length === maxStr.length) {
      return 0.99;
    }

    const diff = maxStr.length - valueStr.length;
    return 1 / Math.pow(10, diff);
  }

  if (0 === maxNum) {
    return 0;
  }

  const ratio = valueNum / maxNum;

  if (ratio > 1) {
    return 1;
  }

  if (0 > ratio) {
    return 0;
  }

  return ratio;
};

export const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const pickRandom = (arr: any[]): any => {
  if (!arr || 0 === arr.length) {
    return undefined;
  }

  return arr[Math.floor(Math.random() * arr.length)];
};

export const chance = (probability: number): boolean => {
  const roll = Math.random();
  return probability >= roll;
};