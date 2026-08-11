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