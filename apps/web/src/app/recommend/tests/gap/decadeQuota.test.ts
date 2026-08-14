import { describe, expect, it } from 'vitest';
import { decadeOf, decadeQuota } from '@/app/recommend/constants/decadeQuota';

const quotaSum = (rank: number): number =>
  Object.values(decadeQuota(rank) ?? {}).reduce((a, b) => a + b, 0);

describe('decadeQuota', () => {
  it('번호대를 1·10·20·30·40으로 나눈다', () => {
    expect(decadeOf(1)).toBe(1);
    expect(decadeOf(9)).toBe(1);
    expect(decadeOf(10)).toBe(10);
    expect(decadeOf(29)).toBe(20);
    expect(decadeOf(30)).toBe(30);
    expect(decadeOf(40)).toBe(40);
    expect(decadeOf(45)).toBe(40);
  });

  it('6~10세트 칸 합은 6이다', () => {
    expect(quotaSum(6)).toBe(6);
    expect(quotaSum(7)).toBe(6);
    expect(quotaSum(8)).toBe(6);
    expect(quotaSum(9)).toBe(6);
    expect(quotaSum(10)).toBe(6);
    expect(decadeQuota(5)).toBeNull();
  });
});
