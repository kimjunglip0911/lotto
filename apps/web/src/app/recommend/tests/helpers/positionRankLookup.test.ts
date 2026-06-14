import { describe, expect, it } from 'vitest';
import {
  buildPositionDrawCountLookup,
  buildPositionRankLookup,
  comboRankTitle,
  drawCountAtPosition,
  rankAtPosition,
} from '@/app/recommend/helpers/positionRankLookup';

describe('positionRankLookup', () => {
  it('rankAtPosition은 자리·번호로 순위를 찾는다', () => {
    const lookup = buildPositionRankLookup([
      { position: 1, bandLabel: '1', drawCount: 9, percentage: 50, rank: 1 },
      { position: 2, bandLabel: '10', drawCount: 5, percentage: 40, rank: 2 },
    ]);
    expect(rankAtPosition(lookup, 1, 1)).toBe(1);
    expect(rankAtPosition(lookup, 2, 10)).toBe(2);
    expect(rankAtPosition(lookup, 1, 10)).toBeNull();
  });

  it('drawCountAtPosition은 자리·번호로 총 회차를 찾는다', () => {
    const rows = [
      { position: 1, bandLabel: '1', drawCount: 18, percentage: 50, rank: 1 },
      { position: 6, bandLabel: '45', drawCount: 4, percentage: 10, rank: 1 },
    ];
    const lookup = buildPositionDrawCountLookup(rows);
    expect(drawCountAtPosition(lookup, 1, 1)).toBe(18);
    expect(drawCountAtPosition(lookup, 6, 45)).toBe(4);
    expect(drawCountAtPosition(lookup, 1, 45)).toBe(0);
  });

  it('comboRankTitle은 combo:rankN을 RANKN으로 표시한다', () => {
    expect(comboRankTitle('combo:rank4')).toBe('RANK4');
    expect(comboRankTitle('combo:rank20')).toBe('RANK20');
  });
});
