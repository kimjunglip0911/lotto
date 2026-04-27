import type { StreakResult, WinningNumberRow } from '../types';

const TOTAL_NUMBERS = 45;

export const buildStreakResults = (rows: WinningNumberRow[], selectedDrawNo: number): StreakResult[] => {
  const lastSeen: (number | null)[] = Array.from({ length: TOTAL_NUMBERS }, () => null);

  for (const row of rows) {
    const nums = [row.num1, row.num2, row.num3, row.num4, row.num5, row.num6, row.bonus_num];
    for (const num of nums) {
      if (num >= 1 && num <= TOTAL_NUMBERS) {
        const prev = lastSeen[num - 1];
        if (prev === null || row.draw_no > prev) {
          lastSeen[num - 1] = row.draw_no;
        }
      }
    }
  }

  const streaks = lastSeen.map((last, index) => ({
    number: index + 1,
    lastDrawNo: last,
    streak: last === null ? selectedDrawNo : selectedDrawNo - last,
  }));

  const averageStreak = streaks.reduce((sum, s) => sum + s.streak, 0) / streaks.length;

  return streaks.map((s) => ({
    ...s,
    isCold: averageStreak > 0 && s.streak > averageStreak,
  }));
};

export const getAverageStreak = (streakResults: StreakResult[]): number =>
  streakResults.length > 0
    ? streakResults.reduce((sum, r) => sum + r.streak, 0) / streakResults.length
    : 0;

export const getTop5PctThreshold = (streakResults: StreakResult[]): number => {
  if (streakResults.length === 0) return 0;
  const sorted = [...streakResults.map((s) => s.streak)].sort((a, b) => a - b);
  const idx = Math.min(Math.ceil(sorted.length * 0.95) - 1, sorted.length - 1);
  return sorted[idx];
};
