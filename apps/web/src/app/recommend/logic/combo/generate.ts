import type { WinningNumberRow } from '@/lib/accu-nums/types';
import { buildPositionBandDistribution } from '@/app/combination/logic/buildPositionBandDistribution';
import { rankPositionBandRows } from '@/app/combination/logic/rankPositionBands';
import { COMBO_RANK_SLOT_ORDER } from '@/app/recommend/constants/comboSlots';
import {
  SECTION_SET_RANK_START,
  toSectionRank,
} from '@/app/recommend/constants/gapSetRanks';
import {
  CORE_SET_COUNT,
  isLeftBandRank,
  isLeftGapRank,
} from '@/app/recommend/constants/leftRanks';
import {
  LOTTO_SUM_MAX,
  LOTTO_SUM_MIN,
  MAX_BAND_LADDER_DEPTH,
  // MAX_NUM_USAGE, // 3회 한도 임시 비활성
  TARGET_SET_COUNT,
} from '@/app/recommend/constants/comboThresholds';
import type { GeneratedSet } from '@/app/recommend/types/generatedSet';
import {
  buildPositionDrawCountLookup,
  buildPositionRankLookup,
} from '@/app/recommend/helpers/positionRankLookup';
import { buildPoolByBand, buildHistCounts } from '@/app/recommend/logic/repair';
import { buildGapRankLookup } from '@/app/recommend/logic/gap/gapRank';
import { keepPoolGapLookup } from '@/app/recommend/logic/gap/keepPoolGaps';
import {
  buildBandLadderForRankCascade,
  buildBandTargetsForRankCascade,
} from '@/app/recommend/logic/combo/buildBandTargets';
import {
  appendMissingProfileDiagnostics,
  type FillCtx,
} from '@/app/recommend/logic/combo/fillSlots';
import { fillSlotRange } from '@/app/recommend/logic/combo/fillRange';
import { attachLeftPools } from '@/app/recommend/logic/combo/leftFill';
import { withSortedMains } from '@/app/recommend/logic/combo/sortMains';
import { setsInProfileSlotOrder } from '@/app/recommend/logic/combo/orderSets';
import {
  formatStatsBandSummary,
  STATS_BAND_CASCADE_LABEL,
  STATS_POSITION_BAND_WINDOW,
  STATS_WINDOW_ONE_YEAR,
  STATS_WINDOW_ONE_YEAR_LABEL,
} from '@/lib/statsWindow';
import { DEFAULT_REPAIR_YIELD_EVERY } from '@/app/recommend/logic/combo/yieldMain';

export type CombinationGenerationResult = {
  sets: GeneratedSet[];
  summaryLines: string[];
  warning: string | null;
};

export type CombinationGenerationOptions = {
  repairYieldEvery?: number;
  pastWinningKeys?: ReadonlySet<string>;
  /** 균등 분석 0회 번호(RANK18~20 전용 풀) */
  zeroPool?: readonly number[];
  /** 미추첨 간격 전용 표본(자리대 창과 분리) */
  gapHistory?: readonly WinningNumberRow[];
};

/** 1부터 45 전체 풀·최대 30세트 생성 */

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
  summaryLines.push(
    `번호별 간격: ${formatStatsBandSummary(STATS_WINDOW_ONE_YEAR_LABEL, STATS_WINDOW_ONE_YEAR, options.gapHistory?.length)}·RANK1~10은 최대간격 근접·초과 최우선 순위 6칸씩(1~6, 7~12, …)`,
  );
  summaryLines.push('구간별 순위: RANK11~17은 구간 band ladder');
  summaryLines.push('균등 0회: RANK18 간격·RANK19~20 조합(0회 번호만)');
  summaryLines.push('leftover: RANK21부터 25는 1부터 10 미사용·간격 11등, RANK26부터 30은 11부터 20 미사용·항목별 11등');

  const poolSorted = [...new Set(numberPool)].filter((n) => n >= 1 && n <= 45).sort((a, b) => a - b);
  if (poolSorted.length < 6) {
    return {
      sets: [],
      summaryLines: [...summaryLines, '유효 번호 풀이 6개 미만입니다.'],
      warning: '번호 풀 부족',
    };
  }

  const allowed = new Set(poolSorted);
  const zeroSorted = [...new Set(options.zeroPool ?? [])]
    .filter((n) => n >= 1 && n <= 45 && allowed.has(n))
    .sort((a, b) => a - b);
  summaryLines.push(`균등 0회 풀: ${zeroSorted.length}개`);

  const poolByBand = buildPoolByBand(poolSorted);
  const zeroPoolByBand = buildPoolByBand(zeroSorted);
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
  const gapHist = options.gapHistory ?? appearHist;
  const fullGapLookup = buildGapRankLookup(gapHist, referenceDrawNo);
  const gapRankLookup = keepPoolGapLookup(fullGapLookup, poolSorted);
  const zeroGapRankLookup = keepPoolGapLookup(fullGapLookup, zeroSorted);

  const targetsByRank = new Map<number, number[]>();
  const laddersByRank = new Map<number, number[][]>();
  for (const rank of COMBO_RANK_SLOT_ORDER) {
    if (rank < SECTION_SET_RANK_START) continue;
    if (isLeftGapRank(rank) || isLeftBandRank(rank)) continue;
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
    zeroPoolByBand,
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
    zeroGapRankLookup,
    leftGapLookup: new Map(),
    leftPoolByBand: new Map(),
    repairYieldEvery,
    profileSlots,
    pastWinningKeys,
  };

  await fillSlotRange(ctx, 0, CORE_SET_COUNT);
  const leftPools = attachLeftPools(ctx, poolSorted, fullGapLookup, flatByWindow);
  summaryLines.push(`leftover 간격 풀: ${leftPools.gapPool.length}개`);
  summaryLines.push(`leftover 구간 풀: ${leftPools.bandPool.length}개`);
  await fillSlotRange(ctx, CORE_SET_COUNT, TARGET_SET_COUNT);

  const builtCount = profileSlots.filter((s) => s !== null).length;
  summaryLines.push(
    `조합 세트: ${builtCount}개 (RANK1부터 20 기존·RANK21부터 30 leftover)`,
  );

  // 3회 한도 임시 비활성 — 재활성화 시 아래 요약 블록을 되돌린다
  // const maxSetsByUsage = Math.floor((poolSorted.length * MAX_NUM_USAGE) / 6);
  // if (maxSetsByUsage < TARGET_SET_COUNT) {
  //   summaryLines.push(
  //     `번호당 ${MAX_NUM_USAGE}회 한도·풀 ${poolSorted.length}개 기준 이론상 최대 ${maxSetsByUsage}세트(20세트는 풀 ${Math.ceil((TARGET_SET_COUNT * 6) / MAX_NUM_USAGE)}개 이상 필요).`,
  //   );
  // }

  appendMissingProfileDiagnostics(ctx, summaryLines);
  const sets = setsInProfileSlotOrder(profileSlots);

  summaryLines.push(
    `세트 구성: RANK1부터 20 기존·RANK21부터 30 leftover·${sets.length}개.`,
  );
  const warning =
    sets.length < TARGET_SET_COUNT
      ? `목표 ${TARGET_SET_COUNT}세트 중 ${sets.length}개만 생성되었습니다. 제약을 확인해 주세요.`
      : null;
  if (warning) summaryLines.push(warning);
  summaryLines.push(`생성 세트 수: ${sets.length}`);

  return { sets, summaryLines, warning };
};
