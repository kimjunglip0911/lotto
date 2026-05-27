import type { ChiSquareHistoryRow } from '@/app/recommend/types/legacyRule';
import type { GeneratedSet } from '@/app/recommend/types/generatedSet';

/** API 응답이 당첨·추천 세트 형식인지 검사한다 */

type WinningRow = {
  draw_no: number;
  num1: number;
  num2: number;
  num3: number;
  num4: number;
  num5: number;
  num6: number;
  bonus_num: number;
};

export const isWinningRow = (value: unknown): value is WinningRow => {
  if (typeof value !== 'object' || value === null) return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.draw_no === 'number' &&
    typeof row.num1 === 'number' &&
    typeof row.num2 === 'number' &&
    typeof row.num3 === 'number' &&
    typeof row.num4 === 'number' &&
    typeof row.num5 === 'number' &&
    typeof row.num6 === 'number' &&
    typeof row.bonus_num === 'number'
  );
};

export const isChiSquareHistoryRow = (value: unknown): value is ChiSquareHistoryRow =>
  isWinningRow(value);

export const isGeneratedSet = (value: unknown): value is GeneratedSet => {
  if (typeof value !== 'object' || value === null) return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.num1 === 'number' &&
    typeof row.num2 === 'number' &&
    typeof row.num3 === 'number' &&
    typeof row.num4 === 'number' &&
    typeof row.num5 === 'number' &&
    typeof row.num6 === 'number' &&
    typeof row.method === 'string'
  );
};
