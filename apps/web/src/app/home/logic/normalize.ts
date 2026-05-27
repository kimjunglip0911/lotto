/** 당첨번호 입력값을 계산 가능한 숫자 배열로 정규화 */

import type { InputNumber } from '../types/home';

export const toNullableNumber = (value: InputNumber): number | null => {
  const parsedValue = Number.parseInt(String(value), 10);
  return Number.isNaN(parsedValue) ? null : parsedValue;
};

export const normalizeWinningNumbers = (winningNumbers: InputNumber[]): number[] =>
  winningNumbers
    .map(toNullableNumber)
    .filter((number): number is number => number !== null);

export const isCalculableWinningNumbers = (winningNumbers: number[]): boolean =>
  winningNumbers.length === 6 && !winningNumbers.some((number) => number === 0);
