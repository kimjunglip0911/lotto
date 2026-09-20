import { describe, expect, it } from 'vitest';
import { formatExcludeSummary } from '@/app/recommend/helpers/excludeSummary';

describe('formatExcludeSummary', () => {
  it('2회↑ 제외 목록을 한 줄로 만든다', () => {
    const text = formatExcludeSummary([1, 7]);
    expect(text).toBe('제외 번호(2회↑): 1, 7 (2개)');
    expect(text).not.toContain('직전');
  });

  it('제외가 없으면 없음 문구를 쓴다', () => {
    expect(formatExcludeSummary([])).toBe('제외 번호: 없음');
  });
});
