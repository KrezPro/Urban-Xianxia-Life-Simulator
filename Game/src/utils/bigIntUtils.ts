export const safeBigInt = (value: string | number | bigint): bigint => {
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

export const divideBigIntStringByNumber = (value: string, divisor: number): string => {
  if (0 === divisor) {
    return '0';
  }

  return (safeBigInt(value) / BigInt(divisor)).toString();
};