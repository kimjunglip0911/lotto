import { describe, expect, it } from 'vitest';
import { TECH_ITEM_RANK, techLabelFromStrategy } from '@/app/recommend/helpers/techLabel';
import { getStrategyLabel } from '@/app/recommend/constants/resultView';

describe('techLabelFromStrategy', () => {
  it('RANK1부터 30은 항목별 순위 로직이다', () => {
    expect(techLabelFromStrategy('combo:rank1')).toBe(TECH_ITEM_RANK);
    expect(techLabelFromStrategy('combo:rank10')).toBe(TECH_ITEM_RANK);
    expect(techLabelFromStrategy('combo:rank18')).toBe(TECH_ITEM_RANK);
    expect(techLabelFromStrategy('combo:rank30')).toBe(TECH_ITEM_RANK);
  });
});

describe('getStrategyLabel', () => {
  it('기법 표시명을 반환한다', () => {
    expect(getStrategyLabel('combo:rank3')).toBe(TECH_ITEM_RANK);
    expect(getStrategyLabel('combo:rank15')).toBe(TECH_ITEM_RANK);
    expect(getStrategyLabel('combo:rank18')).toBe(TECH_ITEM_RANK);
  });
});
