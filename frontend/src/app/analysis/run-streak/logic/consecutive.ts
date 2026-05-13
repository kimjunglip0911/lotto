import type { WinningNumberRow } from '../types';

// 직전 두 회차에 연달아 나온 본번호를 찾아내는 코드입니다.
// 추천 화면과 최종 4개 화면이 "이번에 빼고 갈 번호" 후보로 이 결과를 사용합니다.

const TOTAL_NUMBERS = 45;
const WINNING_NUMBER_MIN = 1;

const isValidLotteryNumber = (n: number): boolean =>
  n >= WINNING_NUMBER_MIN && n <= TOTAL_NUMBERS;

/** 본번호 6개만 — 연속 출현·제외 후보 로직은 보너스를 비교하지 않는다. */
export const getMainNumbers = (row: WinningNumberRow): number[] => [
  row.num1,
  row.num2,
  row.num3,
  row.num4,
  row.num5,
  row.num6,
];

/**
 * 선택 회차 N 직전 (N-1)회에서 끝나는 길이 2 이상 연속 출현에 포함된 본번호를 반환한다.
 * (N-1)회와 (N-2)회 본번호 교집합으로 판정하며, 더 긴 streak도 동일 조건으로 포함된다.
 */
export const getConsecutivelyAppearedMainNumbers = (
  rows: WinningNumberRow[],
  selectedDrawNo: number,
): number[] => {
  if (selectedDrawNo < 3) return [];

  const prev1 = rows.find((r) => r.draw_no === selectedDrawNo - 1);
  const prev2 = rows.find((r) => r.draw_no === selectedDrawNo - 2);
  if (!prev1 || !prev2) return [];

  const prev1Main = new Set(getMainNumbers(prev1).filter(isValidLotteryNumber));
  const intersected = new Set<number>();
  for (const n of getMainNumbers(prev2)) {
    if (isValidLotteryNumber(n) && prev1Main.has(n)) intersected.add(n);
  }
  return [...intersected].sort((a, b) => a - b);
};
