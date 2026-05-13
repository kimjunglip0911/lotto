import type { StreakResult, WinningNumberRow } from '../types';

// 번호별로 "마지막 출현 뒤 몇 회차나 안 나왔는지"를 계산하는 코드입니다.
// 평균을 넘긴 번호는 "저빈도 후보(isCold)"로 표시되고, 상위 5% 임계값도 함께 계산합니다.

const TOTAL_NUMBERS = 45;
const WINNING_NUMBER_MIN = 1;

type StreakBaseResult = Omit<StreakResult, 'isCold'>;

const getWinningNumbers = (row: WinningNumberRow): number[] => [
  row.num1, row.num2, row.num3, row.num4, row.num5, row.num6, row.bonus_num,
];

const isValidLotteryNumber = (n: number): boolean =>
  n >= WINNING_NUMBER_MIN && n <= TOTAL_NUMBERS;

const updateLastSeenByRow = (lastSeen: Array<number | null>, row: WinningNumberRow): void => {
  for (const n of getWinningNumbers(row)) {
    if (!isValidLotteryNumber(n)) continue;
    const idx = n - WINNING_NUMBER_MIN;
    const prev = lastSeen[idx];
    if (prev === null || row.draw_no > prev) lastSeen[idx] = row.draw_no;
  }
};

const buildBaseStreakResults = (
  lastSeen: Array<number | null>,
  selectedDrawNo: number,
): StreakBaseResult[] =>
  lastSeen.map((lastDrawNo, index) => ({
    number: index + WINNING_NUMBER_MIN,
    lastDrawNo,
    streak: lastDrawNo === null ? selectedDrawNo : selectedDrawNo - lastDrawNo,
  }));

/** streak 필드를 가진 배열의 평균 — base/StreakResult 양쪽에서 재사용. */
const meanStreak = <T extends { streak: number }>(rows: T[]): number =>
  rows.length > 0 ? rows.reduce((s, r) => s + r.streak, 0) / rows.length : 0;

export const buildStreakResults = (rows: WinningNumberRow[], selectedDrawNo: number): StreakResult[] => {
  const lastSeen: Array<number | null> = Array.from({ length: TOTAL_NUMBERS }, () => null);
  for (const row of rows) updateLastSeenByRow(lastSeen, row);
  const base = buildBaseStreakResults(lastSeen, selectedDrawNo);
  const avg = meanStreak(base);
  return base.map((r) => ({ ...r, isCold: avg > 0 && r.streak > avg }));
};

export const getAverageStreak = (results: StreakResult[]): number => meanStreak(results);

export const getMaxStreak = (results: StreakResult[]): number =>
  results.length > 0 ? results.reduce((m, r) => (r.streak > m ? r.streak : m), 0) : 0;

export const getTop5PctThreshold = (results: StreakResult[]): number => {
  if (results.length === 0) return 0;
  const sorted = results.map((r) => r.streak).sort((a, b) => a - b);
  const idx = Math.min(Math.ceil(sorted.length * 0.95) - 1, sorted.length - 1);
  return sorted[idx];
};
