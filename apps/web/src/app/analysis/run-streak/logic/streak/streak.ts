import { TOTAL_NUMBERS, WINNING_NUMBER_MIN } from '../../constants/lotNums';
import type { StreakResult, WinningNumberRow } from '../../types';
import { countRunFromPrevDraw } from './streakRun';

// 선택 회차 N 직전 (N-1)회부터 역순으로 본번호 6개에 연속 포함된 **회차 수**를 센 뒤,
// 화면 값 streak = max(0, 그 회차 수 − 1)으로 둔다.

const meanStreak = <T extends { streak: number }>(rows: T[]): number =>
  rows.length > 0 ? rows.reduce((s, r) => s + r.streak, 0) / rows.length : 0;

export const buildStreakResults = (rows: WinningNumberRow[], selectedDrawNo: number): StreakResult[] => {
  const drawByNo = new Map(rows.map((r) => [r.draw_no, r]));
  const base: StreakResult[] = [];
  for (let i = 0; i < TOTAL_NUMBERS; i += 1) {
    const number = i + WINNING_NUMBER_MIN;
    const { rawRunLen, segmentStart } = countRunFromPrevDraw(drawByNo, selectedDrawNo, number);
    const streak = Math.max(0, rawRunLen - 1);
    const lastDrawNo = streak > 0 ? segmentStart : null;
    base.push({ number, lastDrawNo, streak, isCold: false });
  }
  const avg = meanStreak(base);
  return base.map((r) => ({ ...r, isCold: avg > 0 && r.streak > avg }));
};

export const getAverageStreak = (results: StreakResult[]): number => meanStreak(results);

export const getMaxStreak = (results: StreakResult[]): number =>
  results.length > 0 ? results.reduce((m, r) => (r.streak > m ? r.streak : m), 0) : 0;
