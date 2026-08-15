import type { PositionBandDistributionRow } from '@/app/combination/types';
import { rankPositionBandRows } from '@/app/combination/logic/rankPositionBands';
import { LOTTO_SUM_MAX, LOTTO_SUM_MIN } from '@/app/recommend/constants/comboThresholds';
import { buildRankLadders } from '@/app/recommend/logic/combo/bandMaps';
import { makeFillCtx } from '@/app/recommend/logic/combo/makeCtx';
import {
  bandRankSummary,
  emptyResult,
  uniquePool,
} from '@/app/recommend/logic/combo/genPrep';
import { DEFAULT_REPAIR_YIELD_EVERY } from '@/app/recommend/logic/combo/yieldMain';
import type { CombinationGenerationOptions } from '@/app/recommend/logic/combo/genTypes';
import type { FillCtx } from '@/app/recommend/logic/combo/fillCtx';

export const startGen = (
  storedRows: readonly PositionBandDistributionRow[],
  numberPool: readonly number[],
  referenceDrawNo: number,
  options: CombinationGenerationOptions,
): { ctx: FillCtx; lines: string[] } | { result: ReturnType<typeof emptyResult> } => {
  const lines: string[] = [];
  lines.push(`과거 당첨 조합 제외: ${(options.pastWinningKeys ?? new Set()).size}개`);
  if (storedRows.length === 0) {
    return { result: emptyResult(lines, '자리대 통계를 계산할 수 없습니다.', '자리대 통계 없음') };
  }
  const sample = storedRows.filter((r) => r.position === 1).reduce((a, r) => a + r.drawCount, 0);
  lines.push(bandRankSummary(sample));
  const poolSorted = uniquePool(numberPool);
  if (poolSorted.length < 6) {
    return { result: emptyResult(lines, '유효 번호 풀이 6개 미만입니다.', '번호 풀 부족') };
  }
  const { targetsByRank, laddersByRank } = buildRankLadders([storedRows]);
  if (targetsByRank.size === 0) {
    return { result: emptyResult(lines, '자리별 band cascade ladder를 만들 수 없습니다.', '자리대 통계 없음') };
  }
  const ctx = makeFillCtx({
    poolSorted,
    minSum: LOTTO_SUM_MIN,
    maxSum: LOTTO_SUM_MAX,
    targetsByRank,
    laddersByRank,
    appearHist: options.appearHist ?? [],
    referenceDrawNo,
    rankedRows: rankPositionBandRows(storedRows),
    repairYieldEvery: options.repairYieldEvery ?? DEFAULT_REPAIR_YIELD_EVERY,
    pastWinningKeys: options.pastWinningKeys ?? new Set(),
  });
  return { ctx, lines };
};
