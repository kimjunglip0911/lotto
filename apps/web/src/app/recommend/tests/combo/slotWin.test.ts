import { describe, expect, it } from 'vitest';
import { slotBandRank, slotWinKey } from '@/app/recommend/logic/combo/slotWin';

describe('slotWinKey / slotBandRank', () => {
  it('1~10은 1년 1~10등, 11~20은 3년, 21~30은 전체', () => {
    expect(slotWinKey(1)).toBe('1y');
    expect(slotWinKey(10)).toBe('1y');
    expect(slotWinKey(11)).toBe('3y');
    expect(slotWinKey(20)).toBe('3y');
    expect(slotWinKey(21)).toBe('all');
    expect(slotWinKey(30)).toBe('all');
    expect(slotBandRank(1)).toBe(1);
    expect(slotBandRank(10)).toBe(10);
    expect(slotBandRank(11)).toBe(1);
    expect(slotBandRank(20)).toBe(10);
    expect(slotBandRank(21)).toBe(1);
    expect(slotBandRank(30)).toBe(10);
  });
});
