import type { WinningNumberRow } from '@/lib/accu-nums/types';
import { buildPositionBandDistribution } from '@/app/combination/logic/buildPositionBandDistribution';
import { rankPositionBandRows } from '@/app/combination/logic/rankPositionBands';
import { COMBO_RANK_SLOT_ORDER } from '@/app/recommend/constants/comboSlots';
import {
  SECTION_SET_RANK_START,
  toSectionRank,
} from '@/app/recommend/constants/gapSetRanks';
import {
  LOTTO_SUM_MAX,
  LOTTO_SUM_MIN,
  MAX_BAND_LADDER_DEPTH,
  MAX_NUM_USAGE,
  TARGET_SET_COUNT,
} from '@/app/recommend/constants/comboThresholds';
import type { GeneratedSet } from '@/app/recommend/types/generatedSet';
import {
  buildPositionDrawCountLookup,
  buildPositionRankLookup,
} from '@/app/recommend/helpers/positionRankLookup';
import { buildPoolByBand, buildHistCounts } from '@/app/recommend/logic/repair';
import { buildGapRankLookup } from '@/app/recommend/logic/gap/gapRank';
import {
  buildBandLadderForRankCascade,
  buildBandTargetsForRankCascade,
} from '@/app/recommend/logic/combo/buildBandTargets';
import {
  appendMissingProfileDiagnostics,
  fillTargetProfiles,
  recoverMissingSlots,
  type FillCtx,
} from '@/app/recommend/logic/combo/fillSlots';
import { withSortedMains } from '@/app/recommend/logic/combo/sortMains';
import { setsInProfileSlotOrder } from '@/app/recommend/logic/combo/orderSets';
import {
  formatStatsBandSummary,
  STATS_BAND_CASCADE_LABEL,
  STATS_POSITION_BAND_WINDOW,
} from '@/lib/statsWindow';
import { DEFAULT_REPAIR_YIELD_EVERY, MAX_PRIORITY_ROUNDS } from '@/app/recommend/logic/combo/yieldMain';

export type CombinationGenerationResult = {
  sets: GeneratedSet[];
  summaryLines: string[];
  warning: string | null;
};

export type CombinationGenerationOptions = {
  repairYieldEvery?: number;
  pastWinningKeys?: ReadonlySet<string>;
};

/** 1~45 전체 풀·자리대=최근 3년(156회) 표본·rank N=N등 band 시작으로 최대 20세트 생성 */

export const generateCombinationBasedSets = async (
  _sumHistory: readonly WinningNumberRow[],
  bandWindowHistories: readonly (readonly WinningNumberRow[])[],
  numberPool: readonly number[],
  referenceDrawNo: number,
  options: CombinationGenerationOptions = {},
): Promise<CombinationGenerationResult> => {
  const summaryLines: string[] = [];
  const repairYieldEvery = options.repairYieldEvery ?? DEFAULT_REPAIR_YIELD_EVERY;
  const pastWinningKeys = options.pastWinningKeys ?? new Set<string>();

  const minSum = LOTTO_SUM_MIN;
  const maxSum = LOTTO_SUM_MAX;

  summaryLines.push(`고저 합산: 미적용 (${minSum}~${maxSum} 전체 허용)`);
  summaryLines.push(`과거 당첨 조합 제외: ${pastWinningKeys.size}개`);

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

  const sampleDraws = bandWindowHistories[0]?.length ?? 0;
  summaryLines.push(
    `자리대 순위: ${formatStatsBandSummary(STATS_BAND_CASCADE_LABEL, STATS_POSITION_BAND_WINDOW, sampleDraws)}·rank N=N등 band 시작→ladder(최대 ${MAX_BAND_LADDER_DEPTH}단·출현 band만)`,
  );
  summaryLines.push('번호별 간격: RANK1~10은 간격순위 6칸씩(1~6, 7~12, …)');
  summaryLines.push('구간별 순위: RANK11~20은 구간 1~10등 band ladder');

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

  const appearHist =
    bandWindowHistories[bandWindowHistories.length - 1] ??
    bandWindowHistories[0] ??
    [];
  const histCounts = buildHistCounts(
    [...appearHist].sort((a, b) => a.draw_no - b.draw_no),
    referenceDrawNo,
  );
  const flatForRank = flatByWindow[flatByWindow.length - 1] ?? [];
  const rankedRows = rankPositionBandRows(flatForRank);
  const positionRankLookup = buildPositionRankLookup(rankedRows);
  const positionDrawCountLookup = buildPositionDrawCountLookup(rankedRows);
  const gapRankLookup = buildGapRankLookup(appearHist, referenceDrawNo);

  const targetsByRank = new Map<number, number[]>();
  const laddersByRank = new Map<number, number[][]>();
  for (const rank of COMBO_RANK_SLOT_ORDER) {
    if (rank < SECTION_SET_RANK_START) continue;
    const sectionRank = toSectionRank(rank);
    const targets = buildBandTargetsForRankCascade(flatByWindow, sectionRank);
    const ladder = buildBandLadderForRankCascade(flatByWindow, sectionRank);
    if (!targets || !ladder) continue;
    targetsByRank.set(rank, targets);
    laddersByRank.set(rank, ladder);
  }

  if (targetsByRank.size === 0) {
    return {
      sets: [],
      summaryLines: [...summaryLines, '자리별 band cascade ladder를 만들 수 없습니다.'],
      warning: '자리대 통계 없음',
    };
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
    histCounts,
    positionRankLookup,
    positionDrawCountLookup,
    gapRankLookup,
    repairYieldEvery,
    profileSlots,
    pastWinningKeys,
  };

  for (let round = 0; round < MAX_PRIORITY_ROUNDS; round++) {
    const gained = await fillTargetProfiles(ctx);
    if (gained === 0) break;
    if (profileSlots.every((s) => s !== null)) break;
  }

  if (profileSlots.some((s) => s === null)) {
    await recoverMissingSlots(ctx);
  }

  const builtCount = profileSlots.filter((s) => s !== null).length;
  summaryLines.push(`조합 세트: ${builtCount}개 (RANK1~10 간격·RANK11~20 구간)`);

  const maxSetsByUsage = Math.floor((poolSorted.length * MAX_NUM_USAGE) / 6);
  if (maxSetsByUsage < TARGET_SET_COUNT) {
    summaryLines.push(
      `번호당 ${MAX_NUM_USAGE}회 한도·풀 ${poolSorted.length}개 기준 이론상 최대 ${maxSetsByUsage}세트(20세트는 풀 ${Math.ceil((TARGET_SET_COUNT * 6) / MAX_NUM_USAGE)}개 이상 필요).`,
    );
  }

  appendMissingProfileDiagnostics(ctx, summaryLines);
  const sets = setsInProfileSlotOrder(profileSlots);

  summaryLines.push(
    `세트 구성: RANK1~10 간격순위·RANK11~20 구간 ladder·${sets.length}개.`,
  );
  const warning =
    sets.length < TARGET_SET_COUNT
      ? `목표 ${TARGET_SET_COUNT}세트 중 ${sets.length}개만 생성되었습니다. 제약을 확인해 주세요.`
      : null;
  if (warning) summaryLines.push(warning);
  summaryLines.push(`생성 세트 수: ${sets.length}`);

  return { sets, summaryLines, warning };
};
