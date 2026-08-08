import { setKey } from '@/app/recommend/logic/combo/toSet';
import { toMainNumbersOnly } from '@/lib/accu-nums/logic/numCounts';
import type { WinningNumberRow } from '@/lib/accu-nums/types';

/** 기준 회차 이전 본번호 6개 조합 키 집합 */

export const buildPastWinningKeys = (
  rows: readonly WinningNumberRow[],
  referenceDrawNo: number,
): ReadonlySet<string> =>
  new Set(
    rows
      .filter((row) => row.draw_no < referenceDrawNo)
      .map((row) => setKey(toMainNumbersOnly(row))),
  );
