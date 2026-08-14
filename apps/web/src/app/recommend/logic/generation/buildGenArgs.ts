import { buildEqualBuckets } from '@/app/equal/logic/buildBuckets';
import { buildEqualExclude } from '@/app/equal/logic/buildExclude';
import { EQUAL_WINDOW } from '@/app/equal/constants/window';
import {
  findPrevDrawRow,
  numsFromDrawRow,
  poolWithoutNums,
} from '@/app/recommend/logic/generation/prevDrawExclude';
import { buildPastWinningKeys } from '@/app/recommend/logic/generation/pastWinKeys';
import { pickStatsHistory } from '@/lib/pickStatsHistory';
import {
  STATS_BAND_CASCADE_WINDOWS,
  STATS_WINDOW_ALL,
} from '@/lib/statsWindow';
import type { WinningNumberRow } from '@/lib/accu-nums/types';

/** 이력·기준 회차로 생성 입력(표본·풀·제외·0회 풀)을 만든다 */
export const buildGenArgs = (
  fullHistory: readonly WinningNumberRow[],
  selectedDraw: number,
) => {
  const prevRow = findPrevDrawRow(fullHistory, selectedDraw);
  const equalWindow = pickStatsHistory(fullHistory, selectedDraw, EQUAL_WINDOW);
  const excludedNumbers = buildEqualExclude(
    equalWindow,
    numsFromDrawRow(prevRow),
  );
  const zeroPool = buildEqualBuckets(equalWindow).zero;
  return {
    bandWindowHistories: STATS_BAND_CASCADE_WINDOWS.map((size) =>
      pickStatsHistory(fullHistory, selectedDraw, size),
    ),
    gapHistory: pickStatsHistory(fullHistory, selectedDraw, STATS_WINDOW_ALL),
    pastWinningKeys: buildPastWinningKeys(fullHistory, selectedDraw),
    excludedNumbers,
    numberPool: poolWithoutNums(excludedNumbers),
    zeroPool,
  };
};
