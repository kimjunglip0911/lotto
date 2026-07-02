import { describe, expect, it } from 'vitest';
import {
  GAP_RANKS_PER_SET,
  GAP_SET_RANK_MAX,
  isGapSetRank,
  isSectionSetRank,
  toSectionRank,
} from '@/app/recommend/constants/gapSetRanks';
import {
  buildNumberByGapRank,
  isBeyondGapRankPool,
  targetGapRanksForSetRank,
} from '@/app/recommend/logic/gap/gapTargets';
import type { GapRankLookup, GapRankRow } from '@/app/recommend/types/gapRank';

const gapRow = (number: number, rank: number): GapRankRow => ({
  number,
  rank,
  draws: [],
  currentGap: rank,
  avgGap: rank,
  distance: 0,
});

const lookupFromRanks = (entries: readonly [number, number][]): GapRankLookup =>
  new Map(entries.map(([num, rank]) => [num, gapRow(num, rank)]));

describe('gapSetRanks constants', () => {
  it('간격·구간 슬롯 구분을 판별한다', () => {
    expect(isGapSetRank(1)).toBe(true);
    expect(isGapSetRank(10)).toBe(true);
    expect(isGapSetRank(11)).toBe(false);
    expect(isSectionSetRank(11)).toBe(true);
    expect(toSectionRank(11)).toBe(1);
    expect(toSectionRank(20)).toBe(10);
  });
});

describe('targetGapRanksForSetRank', () => {
  it('RANK1은 1~6, RANK2는 7~12, RANK10은 55~60 목표를 만든다', () => {
    expect(targetGapRanksForSetRank(1)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(targetGapRanksForSetRank(2)).toEqual([7, 8, 9, 10, 11, 12]);
    expect(targetGapRanksForSetRank(GAP_SET_RANK_MAX)).toEqual([55, 56, 57, 58, 59, 60]);
    expect(GAP_RANKS_PER_SET).toBe(6);
  });

  it('45 초과 목표는 beyond pool로 표시한다', () => {
    expect(isBeyondGapRankPool(45)).toBe(false);
    expect(isBeyondGapRankPool(46)).toBe(true);
  });

  it('rank→number 역 lookup을 만든다', () => {
    const lookup = lookupFromRanks([
      [3, 1],
      [7, 2],
    ]);
    expect(buildNumberByGapRank(lookup).get(1)).toBe(3);
    expect(buildNumberByGapRank(lookup).get(2)).toBe(7);
  });
});
