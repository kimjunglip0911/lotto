import { describe, expect, it } from 'vitest';
import { MAX_NUM_USAGE } from '@/app/recommend/constants/comboThresholds';
import {
  findOneGapSetForRank,
  pickGapSetNumbers,
} from '@/app/recommend/logic/combo/findOneGapSet';
import { setKey } from '@/app/recommend/logic/combo/toSet';
import type { GapRankLookup, GapRankRow } from '@/app/recommend/types/gapRank';

const gapRow = (number: number, rank: number): GapRankRow => ({
  number,
  rank,
  draws: [],
  currentGap: rank,
  avgGap: rank,
  distance: 0,
});

const fullLookup = (): GapRankLookup =>
  new Map(
    Array.from({ length: 45 }, (_, index) => {
      const number = index + 1;
      return [number, gapRow(number, number)] as const;
    }),
  );

describe('pickGapSetNumbers', () => {
  it('RANK1은 간격순위 1~6번 번호를 num1~6에 매핑한다', () => {
    const picked = pickGapSetNumbers(1, fullLookup(), new Map());
    expect(picked).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('RANK2는 간격순위 7~12번 번호를 고른다', () => {
    const picked = pickGapSetNumbers(2, fullLookup(), new Map());
    expect(picked).toEqual([7, 8, 9, 10, 11, 12]);
  });

  it('번호 한도에 걸리면 다음 간격순위로 넘긴다', () => {
    const usage = new Map<number, number>([[1, MAX_NUM_USAGE]]);
    const picked = pickGapSetNumbers(1, fullLookup(), usage);
    expect(picked?.[0]).toBe(2);
    expect(picked?.slice(1)).toEqual([3, 4, 5, 6, 7]);
  });

  it('RANK10은 45 초과 목표를 간격순위 낮은 미사용 번호로 채운다', () => {
    const picked = pickGapSetNumbers(10, fullLookup(), new Map());
    expect(picked).toEqual([45, 44, 43, 42, 41, 40]);
  });
});

describe('findOneGapSetForRank', () => {
  it('중복 세트면 1칸 교체를 시도한다', async () => {
    const lookup = fullLookup();
    const usedKeys = new Set<string>([setKey([1, 2, 3, 4, 5, 6])]);
    const usage = new Map<number, number>();
    const innerSlotUsage = new Map<string, number>();

    const set = await findOneGapSetForRank(1, lookup, usedKeys, usage, innerSlotUsage);
    expect(set).not.toBeNull();
    expect(
      setKey([set!.num1, set!.num2, set!.num3, set!.num4, set!.num5, set!.num6]),
    ).not.toBe(setKey([1, 2, 3, 4, 5, 6]));
    expect(set!.strategy).toBe('combo:rank1');
  });
});
