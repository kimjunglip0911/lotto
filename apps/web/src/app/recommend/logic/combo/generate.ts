import type { WinningNumberRow } from '@/app/analysis/chi-square/types';
import { buildConsecutiveRunDistribution } from '@/app/analysis/combination/logic/buildConsecutiveRunDistribution';
import { buildOddEvenDistribution } from '@/app/analysis/combination/logic/buildOddEvenDistribution';
import { buildPositionBandDistribution } from '@/app/analysis/combination/logic/buildPositionBandDistribution';
import { buildSumExtremeStats } from '@/app/analysis/combination/logic/buildSumExtremeStats';
import { COMBO_PROFILE_SLOT_ORDER } from '@/app/recommend/constants/comboSlots';
import {
  MAX_NUM_USAGE,
  MIN_BAND_TIER_PERCENT,
  TARGET_SET_COUNT,
} from '@/app/recommend/constants/comboThresholds';
import { PROFILE_BUILD_ATTEMPTS } from '@/app/recommend/constants/repairLimits';
import type { AdoptReservePools } from '@/app/recommend/logic/adopt/adoptTypes';
import type { GeneratedSet } from '@/app/recommend/types/generatedSet';
import { buildPoolByBand } from '@/app/recommend/logic/repair';
import { buildBandTargetsPerPosition } from '@/app/recommend/logic/combo/buildBandTargets';
import { fillFallbackSlots } from '@/app/recommend/logic/combo/fillFallback';
import { withSortedMains } from '@/app/recommend/logic/combo/sortMains';
import {
  appendMissingProfileDiagnostics,
  fillTargetProfiles,
  type FillCtx,
} from '@/app/recommend/logic/combo/fillSlots';
import { setsInProfileSlotOrder } from '@/app/recommend/logic/combo/orderSets';
import { DEFAULT_REPAIR_YIELD_EVERY, MAX_PRIORITY_ROUNDS } from '@/app/recommend/logic/combo/yieldMain';

export type CombinationGenerationResult = {
  sets: GeneratedSet[];
  summaryLines: string[];
  warning: string | null;
};

const emptyReservePools = (): AdoptReservePools => ({
  accumulatedExcluded: [],
  chiExcludedByPct: [],
});

/** 통합 채택 풀·이력 통계로 최대 20세트 생성 */

export const generateCombinationBasedSets = async (
  fullHistory: readonly WinningNumberRow[],
  adoptedPool: readonly number[],
  referenceDrawNo: number,
  reservePools: AdoptReservePools = emptyReservePools(),
  repairYieldEvery: number = DEFAULT_REPAIR_YIELD_EVERY,
): Promise<CombinationGenerationResult> => {
  const summaryLines: string[] = [];
  if (adoptedPool.length < 6) {
    return {
      sets: [],
      summaryLines: ['채택 번호가 6개 미만이라 세트를 만들 수 없습니다.'],
      warning: '채택 풀 부족',
    };
  }

  const sortedHistory = [...fullHistory].sort((a, b) => a.draw_no - b.draw_no).map(withSortedMains);
  const sumStats = buildSumExtremeStats(sortedHistory);
  if (!sumStats || sumStats.trimmedMinSum === null || sumStats.trimmedMaxSum === null) {
    return {
      sets: [],
      summaryLines: ['고저 합산 통계를 계산할 수 없어 세트를 만들 수 없습니다.'],
      warning: '합산 극단 통계 없음',
    };
  }

  const minSum = sumStats.trimmedMinSum;
  const maxSum = sumStats.trimmedMaxSum;
  const oddEven = buildOddEvenDistribution(sortedHistory);
  const consecutive = buildConsecutiveRunDistribution(sortedHistory);
  const positionBand = buildPositionBandDistribution(sortedHistory);

  summaryLines.push(
    `고저 합산 허용 구간: ${minSum} ~ ${maxSum} (전체 ${sumStats.totalDraws}회차 기준 극단 제외 후)`,
  );

  const poolSorted = [...new Set(adoptedPool)].filter((n) => n >= 1 && n <= 45).sort((a, b) => a - b);
  if (poolSorted.length < 6) {
    return {
      sets: [],
      summaryLines: [...summaryLines, '유효 채택 번호가 6개 미만입니다.'],
      warning: '채택 풀 부족',
    };
  }

  const poolByBand = buildPoolByBand(poolSorted);
  const usage = new Map<number, number>();
  for (const n of poolSorted) usage.set(n, 0);
  const innerSlotUsage = new Map<string, number>();
  const usedKeys = new Set<string>();

  const t1 = buildBandTargetsPerPosition(positionBand.rows, 1);
  const t2 = t1 ? buildBandTargetsPerPosition(positionBand.rows, 2, t1) : null;
  const t3 = t2 ? buildBandTargetsPerPosition(positionBand.rows, 3, t2) : null;
  if (!t1 || !t2 || !t3) {
    return {
      sets: [],
      summaryLines: [...summaryLines, '자리별 번호대 통계를 해석할 수 없어 세트를 만들 수 없습니다.'],
      warning: '자리대 통계 없음',
    };
  }

  const profileSlots: (GeneratedSet | null)[] = Array.from(
    { length: COMBO_PROFILE_SLOT_ORDER.length },
    () => null,
  );

  const ctx: FillCtx = {
    poolByBand,
    minSum,
    maxSum,
    oddRows: oddEven.rows,
    consecRows: consecutive.rows,
    targetsByBandTier: [t1, t2, t3],
    usedKeys,
    usage,
    innerSlotUsage,
    repairYieldEvery,
    profileSlots,
  };

  for (let round = 0; round < MAX_PRIORITY_ROUNDS; round++) {
    const gained = await fillTargetProfiles(ctx);
    if (gained === 0) break;
    if (profileSlots.every((s) => s !== null)) break;
  }

  const phase1Count = profileSlots.filter((s) => s !== null).length;
  summaryLines.push(`1단계 조합 세트: ${phase1Count}개`);

  const fallbackResult = fillFallbackSlots(ctx, poolSorted, reservePools);
  if (fallbackResult.filled > 0) {
    summaryLines.push(`2단계 폴백 세트: ${fallbackResult.filled}개`);
  }
  if (fallbackResult.accuAdded > 0 || fallbackResult.chiAdded > 0) {
    summaryLines.push(
      `풀 확장: 누적 +${fallbackResult.accuAdded}, 카이 +${fallbackResult.chiAdded}`,
    );
  }

  const maxSetsByUsage = Math.floor((fallbackResult.expandedPoolSize * MAX_NUM_USAGE) / 6);
  if (maxSetsByUsage < TARGET_SET_COUNT) {
    summaryLines.push(
      `번호당 ${MAX_NUM_USAGE}회 한도·확장 풀 ${fallbackResult.expandedPoolSize}개 기준 최대 ${maxSetsByUsage}세트까지 가능합니다.`,
    );
  }

  appendMissingProfileDiagnostics(ctx, summaryLines);
  const sets = setsInProfileSlotOrder(profileSlots);

  summaryLines.push(
    `세트 구성: 고정 ${TARGET_SET_COUNT}슬롯(15패턴+5, band1~3·자리별 ${MIN_BAND_TIER_PERCENT}% 미만 N등→1등)·1단계 ${PROFILE_BUILD_ATTEMPTS}회·2단계 폴백·${sets.length}개.`,
  );

  const warning =
    sets.length < TARGET_SET_COUNT
      ? `목표 ${TARGET_SET_COUNT}세트 중 ${sets.length}개만 생성되었습니다. 채택 풀·제약을 확인해 주세요.`
      : null;
  if (warning) summaryLines.push(warning);
  summaryLines.push(`생성 세트 수: ${sets.length}`);

  return { sets, summaryLines, warning };
};
