import { describe, expect, it } from 'vitest';
import { APPLIED_RULE_IDS } from '@/app/recommend/constants/generationRules';

describe('APPLIED_RULE_IDS', () => {
  it('1~30은 자리대 규칙만 쓰고 간격·0회 ID는 없다', () => {
    expect(APPLIED_RULE_IDS).toContain('pos-band-ranks-1-30');
    expect(APPLIED_RULE_IDS).toContain('combination-rank-30sets');
    expect(APPLIED_RULE_IDS.some((id) => id.startsWith('gap-'))).toBe(false);
    expect(APPLIED_RULE_IDS).not.toContain('equal-zero-ranks-18-20');
  });
});
