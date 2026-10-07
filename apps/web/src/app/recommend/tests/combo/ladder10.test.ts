import { describe, expect, it } from 'vitest';
import { bandIndexFromLabel } from '@/app/combination/logic/rankPositionBands';
import type { PositionBandDistributionRow } from '@/app/combination/types';
import { buildRankLadders } from '@/app/recommend/logic/combo/bandMaps';
import { buildBandLadderForRankCascade } from '@/app/recommend/logic/combo/buildLadder';

const row = (pos: number, label: string, pct: number): PositionBandDistributionRow => ({
  position: pos,
  bandLabel: label,
  drawCount: pct,
  percentage: pct,
});

describe('10등 다음 ladder', () => {
  it('12개 채택 번호대여도 10등 다음은 1등이다', () => {
    const rows: PositionBandDistributionRow[] = [];
    for (let pos = 1; pos <= 6; pos++) {
      for (let n = 1; n <= 12; n++) rows.push(row(pos, String(n), 30 - n));
    }
    const ladder = buildBandLadderForRankCascade([rows], 10)!;
    expect(ladder[0]![0]).toBe(bandIndexFromLabel('10'));
    expect(ladder[0]![1]).toBe(bandIndexFromLabel('1'));
    expect(ladder[0]).toHaveLength(10);
    expect(ladder[0]).not.toContain(bandIndexFromLabel('11'));
  });
});

describe('buildRankLadders', () => {
  it('세트 1·11·21은 각 기간의 1등 번호대를 쓴다', () => {
    const flat = (best: string) =>
      [1, 2, 3, 4, 5, 6].flatMap((pos) => [row(pos, best, 50), row(pos, '1', 10)]);
    const { targetsByRank } = buildRankLadders({
      '1y': flat('8'),
      '3y': flat('15'),
      all: flat('22'),
    });
    expect(targetsByRank.get(1)![0]).toBe(bandIndexFromLabel('8'));
    expect(targetsByRank.get(11)![0]).toBe(bandIndexFromLabel('15'));
    expect(targetsByRank.get(21)![0]).toBe(bandIndexFromLabel('22'));
  });
});
