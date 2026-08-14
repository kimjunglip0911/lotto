import { describe, expect, it } from 'vitest';
import {
  GAP_RANKS_PER_SET,
  GAP_SET_RANK_MAX,
  isGapSetRank,
  isSectionSetRank,
  toSectionRank,
} from '@/app/recommend/constants/gapSetRanks';
import {
  LEFT_BAND_START,
  isLeftBandRank,
  isLeftGapRank,
  leftBandTier,
  leftGapStartRank,
} from '@/app/recommend/constants/leftRanks';
import { APPLIED_RULE_IDS } from '@/app/recommend/constants/generationRules';
import {
  buildNumberByGapRank,
  isBeyondGapRankPool,
  targetGapRanksForSetRank,
  targetGapRanksFromStart,
} from '@/app/recommend/logic/gap/gapTargets';
import type { GapRankLookup, GapRankRow } from '@/app/recommend/types/gapRank';

const gapRow = (number: number, rank: number): GapRankRow => ({
  number,
  rank,
  draws: [],
  currentGap: rank,
  avgGap: rank,
  maxGap: rank,
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

describe('leftover gap windows', () => {
  it('시작 등수부터 6칸 창을 만든다', () => {
    expect(targetGapRanksFromStart(11)).toEqual([11, 12, 13, 14, 15, 16]);
  });

  it('21세트는 11부터 16, 25세트는 35부터 40이다', () => {
    expect(targetGapRanksFromStart(leftGapStartRank(21))).toEqual([
      11, 12, 13, 14, 15, 16,
    ]);
    expect(targetGapRanksFromStart(leftGapStartRank(25))).toEqual([
      35, 36, 37, 38, 39, 40,
    ]);
  });

  it('targetGapRanksForSetRank(11)은 leftover 창이 아니다', () => {
    expect(targetGapRanksForSetRank(11)).toEqual([61, 62, 63, 64, 65, 66]);
  });

  it('26부터 30세트는 항목별 11등부터이다', () => {
    expect(isLeftGapRank(21)).toBe(true);
    expect(isLeftGapRank(26)).toBe(false);
    expect(isLeftBandRank(26)).toBe(true);
    expect(leftBandTier(26)).toBe(LEFT_BAND_START);
    expect(leftBandTier(30)).toBe(15);
  });

  it('규칙 ID는 30세트이다', () => {
    expect(APPLIED_RULE_IDS).toContain('combination-rank-30sets');
    expect(APPLIED_RULE_IDS).not.toContain('combination-rank-20sets');
  });
});
