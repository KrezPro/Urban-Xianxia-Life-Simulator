export const calculateOfflineDelta = (lastLoginMs: number, currentMs: number) => {
  const deltaMs = Math.max(0, currentMs - lastLoginMs);
  const deltaSeconds = Math.floor(deltaMs / 1000);
  return { deltaMs, deltaSeconds };
};