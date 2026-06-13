import { describe, expect, it } from 'vitest';
import type { WinningNumberRow } from '@/lib/accu-nums/types';
import type { PositionBandDistributionRow } from '@/app/combination/types';
import {
  bandInnerSlot,
  buildBandTargetsForRank,
  buildBandTargetsPerPosition,
  COMBO_RANK_SLOT_ORDER,
  generateCombinationBasedSets,
  TARGET_SET_COUNT,
} from '@/app/recommend/logic/combo';
import { MAX_NUM_USAGE } from '@/app/recommend/constants/comboThresholds';
import { FULL_LOTTO_POOL } from '@/app/recommend/constants/lottoPool';
import { numberToBandIndex } from '@/app/combination/logic/numberToBand';
import type { GeneratedSet } from '@/app/recommend/types/generatedSet';

function countUsageInPool(sets: GeneratedSet[], pool: number[]): Map<number, number> {
  const u = new Map<number, number>(pool.map((n) => [n, 0]));
  for (const s of sets) {
    for (const n of [s.num1, s.num2, s.num3, s.num4, s.num5, s.num6]) {
      u.set(n, (u.get(n) ?? 0) + 1);
    }
  }
  return u;
}

function mkRow(drawNo: number, nums: [number, number, number, number, number, number]): WinningNumberRow {
  return {
    draw_no: drawNo,
    num1: nums[0],
    num2: nums[1],
    num3: nums[2],
    num4: nums[3],
    num5: nums[4],
    num6: nums[5],
    bonus_num: 1,
  };
}

const SYNTHETIC_MAIN_PATTERNS: [number, number, number, number, number, number][] = [
  [1, 2, 3, 4, 5, 6],
  [15, 16, 17, 18, 19, 20],
  [7, 8, 9, 10, 11, 12],
  [2, 4, 6, 8, 10, 12],
  [5, 7, 9, 11, 13, 15],
  [3, 6, 9, 12, 15, 18],
  [4, 8, 12, 16, 17, 18],
  [1, 5, 10, 14, 18, 20],
];

function syntheticHistory(count: number): WinningNumberRow[] {
  const rows: WinningNumberRow[] = [];
  for (let i = 0; i < count; i++) {
    const nums = SYNTHETIC_MAIN_PATTERNS[i % SYNTHETIC_MAIN_PATTERNS.length];
    rows.push(mkRow(i + 1, nums));
  }
  return rows;
}

describe('bandInnerSlot', () => {
  it('1단위 구간에서는 innerSlot이 항상 0이다', () => {
    expect(bandInnerSlot(1)).toBe(0);
    expect(bandInnerSlot(45)).toBe(0);
  });
});

describe('buildBandTargetsForRank', () => {
  it('rank 1은 자리별 최고 비율 band를 반환한다', () => {
    const rows: PositionBandDistributionRow[] = [];
    for (let pos = 1; pos <= 6; pos++) {
      rows.push({ position: pos, bandLabel: '1', drawCount: 10, percentage: 50 });
      rows.push({ position: pos, bandLabel: '2', drawCount: 5, percentage: 25 });
    }
    const t1 = buildBandTargetsForRank(rows, 1)!;
    expect(t1.every((b) => b === 0)).toBe(true);
  });

  it('buildBandTargetsPerPosition은 rank 별칭이다', () => {
    const rows: PositionBandDistributionRow[] = [
      { position: 1, bandLabel: '3', drawCount: 1, percentage: 60 },
      { position: 1, bandLabel: '1', drawCount: 1, percentage: 40 },
    ];
    expect(buildBandTargetsPerPosition(rows, 1)).toEqual(buildBandTargetsForRank(rows, 1));
  });
});

describe('COMBO_RANK_SLOT_ORDER', () => {
  it('rank 1~20 슬롯을 가진다', () => {
    expect(COMBO_RANK_SLOT_ORDER).toHaveLength(TARGET_SET_COUNT);
    expect(COMBO_RANK_SLOT_ORDER[0]).toBe(1);
    expect(COMBO_RANK_SLOT_ORDER[19]).toBe(20);
  });
});

describe('generateCombinationBasedSets', () => {
  it('번호 풀이 6개 미만이면 세트를 만들지 않는다', async () => {
    const hist = syntheticHistory(40);
    const r = await generateCombinationBasedSets(hist, [1, 2, 3], 0);
    expect(r.sets).toHaveLength(0);
    expect(r.warning).toBeTruthy();
  });

  it('이력이 비어 있으면 합산 통계 부재로 세트를 만들지 않는다', async () => {
    const r = await generateCombinationBasedSets([], Array.from({ length: 20 }, (_, i) => i + 1), 0);
    expect(r.sets).toHaveLength(0);
    expect(r.summaryLines.some((l) => l.includes('고저 합산'))).toBe(true);
  });

  it(
    '이력이 있으면 rank strategy·중복 없음·번호 풀·분산이 만족된다',
    async () => {
      const hist = syntheticHistory(80);
      const numberPool = [...FULL_LOTTO_POOL];
      const r = await generateCombinationBasedSets(hist, numberPool, 81);
      expect(r.sets.length).toBeGreaterThan(0);
      expect(r.sets.length).toBeLessThanOrEqual(TARGET_SET_COUNT);
      expect(r.sets.every((s) => /^combo:(fallback:)?rank\d+$/.test(s.strategy ?? ''))).toBe(true);
      expect(r.summaryLines.some((l) => l.includes('고저 합산'))).toBe(true);
      expect(r.summaryLines.some((l) => l.includes('rank 1~20'))).toBe(true);
      const keys = new Set(
        r.sets.map((s) => [s.num1, s.num2, s.num3, s.num4, s.num5, s.num6].sort((a, b) => a - b).join(',')),
      );
      expect(keys.size).toBe(r.sets.length);
      for (const s of r.sets) {
        const nums = [s.num1, s.num2, s.num3, s.num4, s.num5, s.num6];
        expect(new Set(nums).size).toBe(6);
        for (const n of nums) {
          expect(numberPool.includes(n)).toBe(true);
        }
      }
      const usage = countUsageInPool(r.sets, numberPool);
      for (const [, count] of usage) {
        expect(count).toBeLessThanOrEqual(MAX_NUM_USAGE);
      }
      const bandsUsed = new Set<number>();
      for (const s of r.sets) {
        for (const n of [s.num1, s.num2, s.num3, s.num4, s.num5, s.num6]) {
          bandsUsed.add(numberToBandIndex(n));
        }
      }
      expect(bandsUsed.size).toBeGreaterThanOrEqual(12);
    },
    120_000,
  );
});
