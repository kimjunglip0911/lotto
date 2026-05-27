import { describe, expect, it } from 'vitest';
import { isChiSquareNumberExcludedByWalkForwardBin } from '../../logic/chiWf';

describe('isChiSquareNumberExcludedByWalkForwardBin', () => {
  it('조건부 확률이 10% 이하이면 제외(정수 비교)', () => {
    expect(
      isChiSquareNumberExcludedByWalkForwardBin({
        binKey: 'b_0',
        label: '',
        hits: 0,
        roundsHit: 100,
        roundsMatched: 10,
        pct: 10,
      }),
    ).toBe(true);
  });

  it('조건부 확률 9%는 제외·10%는 경계에서 제외', () => {
    const ninePct = {
      binKey: 'b_0',
      label: '',
      hits: 0,
      roundsHit: 100,
      roundsMatched: 9,
      pct: 9,
    };
    const tenPct = { ...ninePct, roundsMatched: 10, pct: 10 };
    expect(isChiSquareNumberExcludedByWalkForwardBin(ninePct)).toBe(true);
    expect(isChiSquareNumberExcludedByWalkForwardBin(tenPct)).toBe(true);
  });

  it('조건부 확률 11%면 잔여', () => {
    expect(
      isChiSquareNumberExcludedByWalkForwardBin({
        binKey: 'b_0',
        label: '',
        hits: 0,
        roundsHit: 100,
        roundsMatched: 11,
        pct: 11,
      }),
    ).toBe(false);
  });

  it('겹침 회차가 5회 이하면 제외', () => {
    expect(
      isChiSquareNumberExcludedByWalkForwardBin({
        binKey: 'b_0',
        label: '',
        hits: 0,
        roundsHit: 100,
        roundsMatched: 5,
        pct: 50,
      }),
    ).toBe(true);
  });

  it('겹침 회차 6회·조건부 확률 20%면 잔여', () => {
    expect(
      isChiSquareNumberExcludedByWalkForwardBin({
        binKey: 'b_0',
        label: '',
        hits: 0,
        roundsHit: 10,
        roundsMatched: 6,
        pct: 20,
      }),
    ).toBe(false);
  });
});
