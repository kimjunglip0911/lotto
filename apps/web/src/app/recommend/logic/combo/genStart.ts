import type { WinningNumberRow } from '@/lib/accu-nums/types';
import { rankPositionBandRows } from '@/app/combination/logic/rankPositionBands';
import { LOTTO_SUM_MAX, LOTTO_SUM_MIN } from '@/app/recommend/constants/comboThresholds';
import { buildRankLadders } from '@/app/recommend/logic/combo/bandMaps';
import { makeFillCtx } from '@/app/recommend/logic/combo/makeCtx';
import {
  bandRankSummary,
  emptyResult,
  flattenBandWindows,
  lastHist,
  uniquePool,
} from '@/app/recommend/logic/combo/genPrep';
import { DEFAULT_REPAIR_YIELD_EVERY } from '@/app/recommend/logic/combo/yieldMain';
import type { CombinationGenerationOptions } from '@/app/recommend/logic/combo/genTypes';
import type { FillCtx } from '@/app/recommend/logic/combo/fillCtx';
export const startGen = (
  bandWindowHistories: readonly (readonly WinningNumberRow[])[],
  numberPool: readonly number[],
  referenceDrawNo: number,
  options: CombinationGenerationOptions,
): { ctx: FillCtx; lines: string[] } | { result: ReturnType<typeof emptyResult> } => {
  const lines: string[] = [];
  lines.push(`과거 당첨 조합 제외: ${(options.pastWinningKeys ?? new Set()).size}개`);
  const flatByWindow = flattenBandWindows(bandWindowHistories);
  if (flatByWindow.length === 0 || flatByWindow.every((rows) => rows.length === 0)) {
    return { result: emptyResult(lines, '자리대 통계를 계산할 수 없습니다.', '자리대 통계 없음') };
  }
  lines.push(bandRankSummary(bandWindowHistories[0]?.length ?? 0));
  const poolSorted = uniquePool(numberPool);
  if (poolSorted.length < 6) {
    return { result: emptyResult(lines, '유효 번호 풀이 6개 미만입니다.', '번호 풀 부족') };
  }
  const { targetsByRank, laddersByRank } = buildRankLadders(flatByWindow);
  if (targetsByRank.size === 0) {
    return { result: emptyResult(lines, '자리별 band cascade ladder를 만들 수 없습니다.', '자리대 통계 없음') };
  }
  const ctx = makeFillCtx({
    poolSorted,
    minSum: LOTTO_SUM_MIN,
    maxSum: LOTTO_SUM_MAX,
    targetsByRank,
    laddersByRank,
    appearHist: lastHist(bandWindowHistories),
    referenceDrawNo,
    rankedRows: rankPositionBandRows(flatByWindow[flatByWindow.length - 1] ?? []),
    repairYieldEvery: options.repairYieldEvery ?? DEFAULT_REPAIR_YIELD_EVERY,
    pastWinningKeys: options.pastWinningKeys ?? new Set(),
  });
  return { ctx, lines };
};
