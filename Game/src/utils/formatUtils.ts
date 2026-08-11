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