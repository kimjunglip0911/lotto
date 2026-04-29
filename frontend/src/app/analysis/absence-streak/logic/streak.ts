import type { StreakResult, WinningNumberRow } from '../types';

const TOTAL_NUMBERS = 45;
const WINNING_NUMBER_MIN = 1;

type StreakBaseResult = Omit<StreakResult, 'isCold'>;

const getWinningNumbers = (row: WinningNumberRow): number[] => [
  row.num1,
  row.num2,
  row.num3,
  row.num4,
  row.num5,
  row.num6,
  row.bonus_num,
];

const isValidLotteryNumber = (number: number): boolean =>
  number >= WINNING_NUMBER_MIN && number <= TOTAL_NUMBERS;

const updateLastSeenByRow = (lastSeen: Array<number | null>, row: WinningNumberRow): void => {
  const winningNumbers = getWinningNumbers(row);
  for (const number of winningNumbers) {
    if (!isValidLotteryNumber(number)) continue;

    const numberIndex = number - WINNING_NUMBER_MIN;
    const previousDrawNo = lastSeen[numberIndex];
    if (previousDrawNo === null || row.draw_no > previousDrawNo) {
      lastSeen[numberIndex] = row.draw_no;
    }
  }
};

const buildBaseStreakResults = (
  lastSeen: Array<number | null>,
  selectedDrawNo: number
): StreakBaseResult[] =>
  lastSeen.map((lastDrawNo, index) => ({
    number: index + WINNING_NUMBER_MIN,
    lastDrawNo,
    streak: lastDrawNo === null ? selectedDrawNo : selectedDrawNo - lastDrawNo,
  }));

const getAverageStreakFromBaseResults = (baseResults: StreakBaseResult[]): number =>
  baseResults.length > 0
    ? baseResults.reduce((sum, result) => sum + result.streak, 0) / baseResults.length
    : 0;

export const buildStreakResults = (rows: WinningNumberRow[], selectedDrawNo: number): StreakResult[] => {
  const lastSeen: Array<number | null> = Array.from({ length: TOTAL_NUMBERS }, () => null);
  for (const row of rows) {
    updateLastSeenByRow(lastSeen, row);
  }

  const baseResults = buildBaseStreakResults(lastSeen, selectedDrawNo);
  const averageStreak = getAverageStreakFromBaseResults(baseResults);

  return baseResults.map((result) => ({
    ...result,
    isCold: averageStreak > 0 && result.streak > averageStreak,
  }));
};

export const getAverageStreak = (streakResults: StreakResult[]): number =>
  streakResults.length > 0
    ? streakResults.reduce((sum, r) => sum + r.streak, 0) / streakResults.length
    : 0;

export const getMaxStreak = (streakResults: StreakResult[]): number =>
  streakResults.length > 0
    ? streakResults.reduce((max, result) => (result.streak > max ? result.streak : max), 0)
    : 0;

export const getTop5PctThreshold = (streakResults: StreakResult[]): number => {
  if (streakResults.length === 0) return 0;

  const sortedStreaks = streakResults.map((result) => result.streak).sort((a, b) => a - b);
  const thresholdIndex = Math.min(Math.ceil(sortedStreaks.length * 0.95) - 1, sortedStreaks.length - 1);
  return sortedStreaks[thresholdIndex];
};
