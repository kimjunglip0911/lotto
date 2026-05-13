import type { StreakResult, WinningNumberRow } from '../types';
import { getMainNumbers } from './consec';

// 선택 회차 N 직전 (N-1)회부터 역순으로 본번호 6개에 연속 포함된 **회차 수**를 센 뒤,
// 화면 값 streak = max(0, 그 회차 수 − 1)으로 둔다. (직전 1회만 출현 → 0, 2회 연속 출현 → 1)
// 평균을 넘긴 번호는 표에서 강조(isCold)하고, 상위 5% 임계값도 함께 계산한다.

const TOTAL_NUMBERS = 45;
const WINNING_NUMBER_MIN = 1;

const isValidLotteryNumber = (n: number): boolean =>
  n >= WINNING_NUMBER_MIN && n <= TOTAL_NUMBERS;

const mainSet = (row: WinningNumberRow): Set<number> =>
  new Set(getMainNumbers(row).filter(isValidLotteryNumber));

const countRunFromPrevDraw = (
  drawByNo: Map<number, WinningNumberRow>,
  selectedDrawNo: number,
  n: number,
): { rawRunLen: number; segmentStart: number | null } => {
  let rawRunLen = 0;
  let segmentStart: number | null = null;
  for (let d = selectedDrawNo - 1; d >= 1; d -= 1) {
    const row = drawByNo.get(d);
    if (!row) break;
    if (!mainSet(row).has(n)) break;
    rawRunLen += 1;
    segmentStart = d;
  }
  return { rawRunLen, segmentStart };
};

/** streak 필드를 가진 배열의 평균 — StreakResult에서 재사용. */
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

export const getTop5PctThreshold = (results: StreakResult[]): number => {
  if (results.length === 0) return 0;
  const sorted = results.map((r) => r.streak).sort((a, b) => a - b);
  const idx = Math.min(Math.ceil(sorted.length * 0.95) - 1, sorted.length - 1);
  return sorted[idx];
};
