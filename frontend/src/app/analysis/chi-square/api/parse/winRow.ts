import { isWinningNumberRow } from '../../logic/guards';
import type { WinningNumberRow } from '../../types';

export const parseWinningNumberRowResponse = (data: unknown, invalidMessage: string): WinningNumberRow => {
  if (!isWinningNumberRow(data)) {
    throw new Error(invalidMessage);
  }
  return data;
};
