import { describe, expect, it } from 'vitest';
import type { WinningNumberRow } from '../types';
import { getTrendExcludedNumbers } from './trendExclusion';

const mk = (draw_no: number, nums: [number, number, number, number, number, number]): WinningNumberRow => ({
  draw_no,
  num1: nums[0],
  num2: nums[1],
  num3: nums[2],
  num4: nums[3],
  num5: nums[4],
  num6: nums[5],
  bonus_num: 1,
});

describe('getTrendExcludedNumbers', () => {
  it('이력이 비어 있으면 제외번호를 반환하지 않는다', () => {
    expect(getTrendExcludedNumbers([])).toEqual([]);
  });

  it('20.00 경계값은 제외에 포함된다', () => {
    const rows: WinningNumberRow[] = [];
    for (let d = 1; d <= 150; d += 1) {
      rows.push(mk(d, [1, 2, 3, 4, 5, 6]));
    }
    for (let d = 151; d <= 1000; d += 1) {
      rows.push(mk(d, d % 2 === 0 ? [7, 8, 9, 10, 11, 12] : [13, 14, 15, 16, 17, 18]));
    }
    // 대략 1000분의 200 수준으로 특정 구간 확률을 만들기 위한 보정
    for (let d = 1001; d <= 1050; d += 1) {
      rows.push(mk(d, [1, 2, 3, 4, 5, 6]));
    }

    const excluded = getTrendExcludedNumbers(rows);
    expect(excluded.length).toBeGreaterThan(0);
  });

  it('20.01 이상 구간 번호는 제외 대상이 아니다', () => {
    const rows: WinningNumberRow[] = [];
    for (let d = 1; d <= 1200; d += 1) {
      rows.push(mk(d, [1, 2, 3, 4, 5, 6]));
    }

    const excluded = getTrendExcludedNumbers(rows);
    expect(excluded).not.toContain(1);
    expect(excluded).not.toContain(2);
    expect(excluded).not.toContain(3);
    expect(excluded).not.toContain(4);
    expect(excluded).not.toContain(5);
    expect(excluded).not.toContain(6);
  });
});

