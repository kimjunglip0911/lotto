import { describe, expect, it } from 'vitest';
import {
  TECH_GAP_EXTRACT,
  TECH_ITEM_RANK,
  techLabelFromStrategy,
} from '@/app/recommend/helpers/techLabel';
import { getStrategyLabel } from '@/app/recommend/constants/resultView';

describe('techLabelFromStrategy', () => {
  it('RANK1~10은 간격 추출 로직이다', () => {
    expect(techLabelFromStrategy('combo:rank1')).toBe(TECH_GAP_EXTRACT);
    expect(techLabelFromStrategy('combo:rank10')).toBe(TECH_GAP_EXTRACT);
  });

  it('RANK11~20은 항목별 순위 로직이다', () => {
    expect(techLabelFromStrategy('combo:rank11')).toBe(TECH_ITEM_RANK);
    expect(techLabelFromStrategy('combo:rank20')).toBe(TECH_ITEM_RANK);
  });
});

describe('getStrategyLabel', () => {
  it('기법 표시명을 반환한다', () => {
    expect(getStrategyLabel('combo:rank3')).toBe(TECH_GAP_EXTRACT);
    expect(getStrategyLabel('combo:rank15')).toBe(TECH_ITEM_RANK);
  });
});
