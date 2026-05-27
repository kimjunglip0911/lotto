import { isWinningNumberRow } from '../../logic/guards';
import type { WinningNumberRow } from '../../types';

export const parseWinningNumberRowsResponse = (data: unknown, invalidMessage: string): WinningNumberRow[] => {
  if (!Array.isArray(data)) {
    throw new Error(invalidMessage);
  }
  return data.filter(isWinningNumberRow);
};
