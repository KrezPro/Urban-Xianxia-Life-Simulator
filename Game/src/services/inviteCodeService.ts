import { GameConstants } from '../constants/GameConstants';

const allowedChars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export const generateInviteCode = (): string => {
  return Array.from({ length: GameConstants.SOCIAL_INVITE_CODE_LENGTH })
    .map(() => allowedChars.charAt(Math.floor(Math.random() * allowedChars.length)))
    .join('');
};

export const normalizeInviteCode = (code: string): string => {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, '');
};

export const isValidInviteCode = (code: string): boolean => {
  return /^[A-Z0-9]{8}$/.test(code);
};

export const codeToSeed = (code: string): number => {
  return normalizeInviteCode(code)
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
};