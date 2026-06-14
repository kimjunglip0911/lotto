import type { PositionBandRankRow } from '@/app/combination/types';
import { getStrategyLabel } from '@/app/recommend/constants/resultView';
import type { GeneratedSet } from '@/app/recommend/types/generatedSet';

export type PositionRankLookup = ReadonlyMap<string, number>;

export type PositionDrawCountLookup = ReadonlyMap<string, number>;

const lookupKey = (position: number, num: number): string => `${position}:${num}`;

export const buildPositionRankLookup = (
  rankedRows: readonly PositionBandRankRow[],
): PositionRankLookup => {
  const map = new Map<string, number>();
  for (const row of rankedRows) {
    map.set(`${row.position}:${row.bandLabel}`, row.rank);
  }
  return map;
};

/** 구간별 조합분석 총 회차(drawCount) lookup */
export const buildPositionDrawCountLookup = (
  rankedRows: readonly PositionBandRankRow[],
): PositionDrawCountLookup => {
  const map = new Map<string, number>();
  for (const row of rankedRows) {
    map.set(`${row.position}:${row.bandLabel}`, row.drawCount);
  }
  return map;
};

export const rankAtPosition = (
  lookup: PositionRankLookup,
  position: number,
  num: number,
): number | null => lookup.get(lookupKey(position, num)) ?? null;

export const drawCountAtPosition = (
  lookup: PositionDrawCountLookup,
  position: number,
  num: number,
): number => lookup.get(lookupKey(position, num)) ?? 0;

export const numsFromSet = (set: GeneratedSet): number[] =>
  [set.num1, set.num2, set.num3, set.num4, set.num5, set.num6];

export const comboRankTitle = (strategy?: string | null): string => {
  const m = strategy?.match(/^combo:rank(\d+)$/i);
  if (m) return `RANK${m[1]}`;
  if (strategy) return getStrategyLabel(strategy).toUpperCase();
  return 'SET';
};

export const POSITION_SLOTS = [1, 2, 3, 4, 5, 6] as const;
