import { isWinningNumberRow } from '../logic/numCounts';
import type { WinningNumberRow } from '../types';
import type { MessageResponse } from './types';

// 서버 응답이 기대 형태인지 검사 후 안전 값만 반환.

export const parseNumberArrayResponse = (data: unknown, invalidMessage: string): number[] => {
  if (!Array.isArray(data)) {
    throw new Error(invalidMessage);
  }

  return data.filter((item): item is number => typeof item === 'number');
};

export const parseWinningNumberRowsResponse = (data: unknown, invalidMessage: string): WinningNumberRow[] => {
  if (!Array.isArray(data)) {
    throw new Error(invalidMessage);
  }

  return data.filter(isWinningNumberRow);
};

export const parseMessageResponse = (data: unknown, invalidMessage: string): MessageResponse => {
  if (typeof data !== 'object' || data === null || !('message' in data)) {
    throw new Error(invalidMessage);
  }
  const message = (data as { message: unknown }).message;
  if (typeof message !== 'string') {
    throw new Error(invalidMessage);
  }
  return { message };
};
