import { describe, expect, it } from 'vitest';
import { buildEqualExclude } from '../logic/buildExclude';
import { freqGeTwo } from '../logic/freqGeTwo';
import { draw } from './fixtures';

describe('freqGeTwo', () => {
  it('2회 이상만 모은다', () => {
    const rows = [
      draw(1, [1, 2, 3, 4, 5, 6], 7),
      draw(2, [1, 8, 9, 10, 11, 12], 7),
    ];
    expect(freqGeTwo(rows)).toEqual([1, 7]);
  });
});

describe('buildEqualExclude', () => {
  it('2회 이상만 제외하고 전회차 전용 번호는 남긴다', () => {
    const rows = [
      draw(1, [1, 2, 3, 4, 5, 6], 7),
      draw(2, [1, 8, 9, 10, 11, 12], 7),
    ];
    expect(buildEqualExclude(rows)).toEqual([1, 7]);
    expect(buildEqualExclude(rows)).not.toContain(13);
  });

  it('빈 창이면 제외 목록이 없다', () => {
    expect(buildEqualExclude([])).toEqual([]);
  });
});
