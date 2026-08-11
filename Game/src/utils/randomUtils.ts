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