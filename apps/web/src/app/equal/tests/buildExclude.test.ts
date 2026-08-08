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
  it('2회 이상과 직전 7개를 합치고 중복을 제거한다', () => {
    const rows = [
      draw(1, [1, 2, 3, 4, 5, 6], 7),
      draw(2, [1, 8, 9, 10, 11, 12], 7),
    ];
    const prev = [8, 9, 10, 11, 12, 13, 7];
    expect(buildEqualExclude(rows, prev)).toEqual([1, 7, 8, 9, 10, 11, 12, 13]);
  });

  it('직전만 있어도 제외 목록을 만든다', () => {
    expect(buildEqualExclude([], [3, 1, 2])).toEqual([1, 2, 3]);
  });
});
