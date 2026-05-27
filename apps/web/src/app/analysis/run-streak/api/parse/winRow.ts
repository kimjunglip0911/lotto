import type { WinningNumberRow } from '../../types';

export const isWinningNumberRow = (value: unknown): value is WinningNumberRow => {
  if (typeof value !== 'object' || value === null) return false;
  const c = value as Partial<WinningNumberRow>;
  return (
    typeof c.draw_no === 'number' &&
    typeof c.num1 === 'number' &&
    typeof c.num2 === 'number' &&
    typeof c.num3 === 'number' &&
    typeof c.num4 === 'number' &&
    typeof c.num5 === 'number' &&
    typeof c.num6 === 'number' &&
    typeof c.bonus_num === 'number'
  );
};

export const parseWinningNumberRowResponse = (
  data: unknown,
  invalidMessage: string,
): WinningNumberRow => {
  if (!isWinningNumberRow(data)) {
    throw new Error(invalidMessage);
  }
  return data;
};
