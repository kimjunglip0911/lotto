import type { WinningNumberRow } from '@/lib/accu-nums/types';
import { buildPositionBandDistribution } from '@/app/combination/logic/buildPositionBandDistribution';
import { buildSumExtremeStats } from '@/app/combination/logic/buildSumExtremeStats';
import { COMBO_RANK_SLOT_ORDER } from '@/app/recommend/constants/comboSlots';
import { MAX_NUM_USAGE, BAND_TIER_REPEATS, TARGET_SET_COUNT } from '@/app/recommend/constants/comboThresholds';
import type { GeneratedSet } from '@/app/recommend/types/generatedSet';
import { buildPoolByBand } from '@/app/recommend/logic/repair';
import { bandTierForRank, buildBandLadderForRankCascade, primaryBandTargetsFromLadder } from '@/app/recommend/logic/combo/buildBandTargets';
import {
  appendMissingProfileDiagnostics,
  fillTargetProfiles,
  type FillCtx,
} from '@/app/recommend/logic/combo/fillSlots';
import { withSortedMains } from '@/app/recommend/logic/combo/sortMains';
import { setsInProfileSlotOrder } from '@/app/recommend/logic/combo/orderSets';
import { STATS_BAND_CASCADE_LABEL } from '@/lib/statsWindow';
import { DEFAULT_REPAIR_YIELD_EVERY, MAX_PRIORITY_ROUNDS } from '@/app/recommend/logic/combo/yieldMain';

export type CombinationGenerationResult = {
  sets: GeneratedSet[];
  summaryLines: string[];
  warning: string | null;
};

/** 1~45 전체 풀·고저=전체 누적·자리대=3→6→12개월 cascade로 최대 20세트 생성 */

export const generateCombinationBasedSets = async (
  sumHistory: readonly WinningNumberRow[],
  bandWindowHistories: readonly (readonly WinningNumberRow[])[],
  numberPool: readonly number[],
  _referenceDrawNo: number,
  repairYieldEvery: number = DEFAULT_REPAIR_YIELD_EVERY,
): Promise<CombinationGenerationResult> => {
  const summaryLines: string[] = [];

  const sortedSumHistory = [...sumHistory].sort((a, b) => a.draw_no - b.draw_no).map(withSortedMains);
  const sumStats = buildSumExtremeStats(sortedSumHistory);
  if (!sumStats || sumStats.trimmedMinSum === null || sumStats.trimmedMaxSum === null) {
    return {
      sets: [],
      summaryLines: ['고저 합산 통계를 계산할 수 없어 세트를 만들 수 없습니다.'],
      warning: '합산 극단 통계 없음',
    };
  }

  const minSum = sumStats.trimmedMinSum;
  const maxSum = sumStats.trimmedMaxSum;

  summaryLines.push(
    `고저 합산 허용 구간: ${minSum} ~ ${maxSum} (전체 누적 ${sumStats.totalDraws}회차·극단 제외 후)`,
  );

  const flatByWindow = bandWindowHistories.map((hist) => {
    const sorted = [...hist].sort((a, b) => a.draw_no - b.draw_no).map(withSortedMains);
    return buildPositionBandDistribution(sorted).rows;
  });

  if (flatByWindow.length === 0 || flatByWindow.every((rows) => rows.length === 0)) {
    return {
      sets: [],
      summaryLines: [...summaryLines, '자리대 band 통계를 계산할 수 없습니다.'],
      warning: '자리대 통계 없음',
    };
  }

  summaryLines.push(
    `자리대 순위: ${STATS_BAND_CASCADE_LABEL} cascade·동일 순위 ${BAND_TIER_REPEATS}회 반복·자리별 1등→2등 ladder(출현 번호만)`,
  );

  const poolSorted = [...new Set(numberPool)].filter((n) => n >= 1 && n <= 45).sort((a, b) => a - b);
  if (poolSorted.length < 6) {
    return {
      sets: [],
      summaryLines: [...summaryLines, '유효 번호 풀이 6개 미만입니다.'],
      warning: '번호 풀 부족',
    };
  }

  const poolByBand = buildPoolByBand(poolSorted);
  const usage = new Map<number, number>();
  for (const n of poolSorted) usage.set(n, 0);
  const innerSlotUsage = new Map<string, number>();
  const usedKeys = new Set<string>();

  const targetsByRank = new Map<number, number[]>();
  const laddersByRank = new Map<number, number[][]>();
  for (const rank of COMBO_RANK_SLOT_ORDER) {
    const bandTier = bandTierForRank(rank);
    const ladder = buildBandLadderForRankCascade(flatByWindow, bandTier);
    if (!ladder) {
      return {
        sets: [],
        summaryLines: [
          ...summaryLines,
          `rank${rank}(자리 band ${bandTier}등) cascade ladder를 만들 수 없습니다.`,
        ],
        warning: '자리대 통계 없음',
      };
    }
    targetsByRank.set(rank, primaryBandTargetsFromLadder(ladder));
    laddersByRank.set(rank, ladder);
  }

  const profileSlots: (GeneratedSet | null)[] = Array.from(
    { length: COMBO_RANK_SLOT_ORDER.length },
    () => null,
  );

  const ctx: FillCtx = {
    poolByBand,
    minSum,
    maxSum,
    targetsByRank,
    laddersByRank,
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

  const builtCount = profileSlots.filter((s) => s !== null).length;
  summaryLines.push(`조합 세트: ${builtCount}개 (rank 1~${COMBO_RANK_SLOT_ORDER.length}·자리 ladder)`);

  const maxSetsByUsage = Math.floor((poolSorted.length * MAX_NUM_USAGE) / 6);
  if (maxSetsByUsage < TARGET_SET_COUNT) {
    summaryLines.push(
      `번호당 ${MAX_NUM_USAGE}회 한도·풀 ${poolSorted.length}개 기준 이론상 최대 ${maxSetsByUsage}세트(20세트는 풀 ${Math.ceil((TARGET_SET_COUNT * 6) / MAX_NUM_USAGE)}개 이상 필요).`,
    );
  }

  appendMissingProfileDiagnostics(ctx, summaryLines);
  const sets = setsInProfileSlotOrder(profileSlots);

  summaryLines.push(
    `세트 구성: rank 1~20·1구간→6구간 순차·고저·자리 ladder·${sets.length}개.`,
  );
  const warning =
    sets.length < TARGET_SET_COUNT
      ? `목표 ${TARGET_SET_COUNT}세트 중 ${sets.length}개만 생성되었습니다. 제약을 확인해 주세요.`
      : null;
  if (warning) summaryLines.push(warning);
  summaryLines.push(`생성 세트 수: ${sets.length}`);

  return { sets, summaryLines, warning };
};
