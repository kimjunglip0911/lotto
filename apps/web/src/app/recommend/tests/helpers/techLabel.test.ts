import { describe, expect, it } from 'vitest';
import {
  TECH_GAP_EXTRACT,
  TECH_ITEM_RANK,
  TECH_ZERO_COMBO,
  TECH_ZERO_GAP,
  techLabelFromStrategy,
} from '@/app/recommend/helpers/techLabel';
import { getStrategyLabel } from '@/app/recommend/constants/resultView';

describe('techLabelFromStrategy', () => {
  it('RANK1~10은 미추첨 간격 추출이다', () => {
    expect(techLabelFromStrategy('combo:rank1')).toBe('미추첨 간격 추출');
    expect(techLabelFromStrategy('combo:rank10')).toBe(TECH_GAP_EXTRACT);
  });

  it('RANK11~17은 항목별 순위 로직이다', () => {
    expect(techLabelFromStrategy('combo:rank11')).toBe(TECH_ITEM_RANK);
    expect(techLabelFromStrategy('combo:rank17')).toBe(TECH_ITEM_RANK);
  });

  it('RANK18부터 20은 균등 0회 기법이다', () => {
    expect(techLabelFromStrategy('combo:rank18')).toBe(TECH_ZERO_GAP);
    expect(techLabelFromStrategy('combo:rank19')).toBe(TECH_ZERO_COMBO);
    expect(techLabelFromStrategy('combo:rank20')).toBe(TECH_ZERO_COMBO);
  });

  it('RANK21부터 25는 간격, RANK26부터 30은 항목별이다', () => {
    expect(techLabelFromStrategy('combo:rank21')).toBe(TECH_GAP_EXTRACT);
    expect(techLabelFromStrategy('combo:rank25')).toBe(TECH_GAP_EXTRACT);
    expect(techLabelFromStrategy('combo:rank26')).toBe(TECH_ITEM_RANK);
    expect(techLabelFromStrategy('combo:rank30')).toBe(TECH_ITEM_RANK);
  });
});

describe('getStrategyLabel', () => {
  it('기법 표시명을 반환한다', () => {
    expect(getStrategyLabel('combo:rank3')).toBe(TECH_GAP_EXTRACT);
    expect(getStrategyLabel('combo:rank15')).toBe(TECH_ITEM_RANK);
    expect(getStrategyLabel('combo:rank18')).toBe(TECH_ZERO_GAP);
  });
});
