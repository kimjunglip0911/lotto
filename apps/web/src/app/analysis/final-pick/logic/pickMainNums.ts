import type { WinningNumberRow } from '../types/winRow';

/** 선택 당첨 또는 직전 회차 본번호 6개 — 카이제곱·워크포워드 reference용. */
export const pickReferenceMainNumbers = (
  selectedWinningNumber: WinningNumberRow | null,
  previousDrawRows: WinningNumberRow[],
): number[] => {
  if (selectedWinningNumber) {
    return [
      selectedWinningNumber.num1,
      selectedWinningNumber.num2,
      selectedWinningNumber.num3,
      selectedWinningNumber.num4,
      selectedWinningNumber.num5,
      selectedWinningNumber.num6,
    ];
  }
  if (previousDrawRows.length === 0) return [];
  const latest = previousDrawRows[previousDrawRows.length - 1];
  return [latest.num1, latest.num2, latest.num3, latest.num4, latest.num5, latest.num6];
};
