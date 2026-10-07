import type { PositionBandDistributionRow } from '@/app/combination/types';
import { rankPositionBandRows } from '@/app/combination/logic/rankPositionBands';
import { LOTTO_SUM_MAX, LOTTO_SUM_MIN } from '@/app/recommend/constants/comboThresholds';
import { buildRankLadders } from '@/app/recommend/logic/combo/bandMaps';
import { flatsOrStored } from '@/app/recommend/logic/combo/winFlats';
import { makeFillCtx } from '@/app/recommend/logic/combo/makeCtx';
import {
  bandRankSummary,
  emptyResult,
  uniquePool,
} from '@/app/recommend/logic/combo/genPrep';
import { DEFAULT_REPAIR_YIELD_EVERY } from '@/app/recommend/logic/combo/yieldMain';
import type { CombinationGenerationOptions, StartGen } from '@/app/recommend/logic/combo/genTypes';

export const startGen = (
  storedRows: readonly PositionBandDistributionRow[],
  numberPool: readonly number[],
  referenceDrawNo: number,
  options: CombinationGenerationOptions,
): StartGen => {
  const lines: string[] = [];
  lines.push(`과거 당첨 조합 제외: ${(options.pastWinningKeys ?? new Set()).size}개`);
  const flats = flatsOrStored(storedRows, options.appearHist, referenceDrawNo);
  if (flats.all.length === 0) {
    return { result: emptyResult(lines, '자리대 통계를 계산할 수 없습니다.', '자리대 통계 없음') };
  }
  const sample = flats.all.filter((r) => r.position === 1).reduce((a, r) => a + r.drawCount, 0);
  lines.push(bandRankSummary(sample));
  const poolSorted = uniquePool(numberPool);
  if (poolSorted.length < 6) {
    return { result: emptyResult(lines, '유효 번호 풀이 6개 미만입니다.', '번호 풀 부족') };
  }
  const { targetsByRank, laddersByRank } = buildRankLadders(flats);
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
    rankedRows: rankPositionBandRows(flats.all),
    repairYieldEvery: options.repairYieldEvery ?? DEFAULT_REPAIR_YIELD_EVERY,
    pastWinningKeys: options.pastWinningKeys ?? new Set(),
  });
  return { ctx, lines };
};
