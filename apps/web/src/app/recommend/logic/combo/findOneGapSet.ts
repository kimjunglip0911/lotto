/**
 * RANK1~10 간격순위 세트 1개를 만듭니다.
 *
 * 하는 일
 * - 목표 간격순위 6칸에 맞는 번호를 num1~6 순서로 고릅니다.
 * - 번호 3회 한도·세트 중복·과거 당첨 조합 제외를 적용합니다.
 *
 * 역할 나눔
 * - 간격순위 계산은 `logic/gap/gapRank.ts`, 슬롯 분기는 `fillSlots.ts`가 담당합니다.
 */

import { bumpUsage, setKey, toGeneratedSet } from '@/app/recommend/logic/combo/toSet';
import { yieldToMain } from '@/app/recommend/logic/combo/yieldMain';
import {
  buildNumberByGapRank,
  gapRowsByRankDesc,
  isBeyondGapRankPool,
  targetGapRanksForSetRank,
  targetGapRanksFromStart,
} from '@/app/recommend/logic/gap/gapTargets';
import { isSetWithinUsageLimit, canUseNum } from '@/app/recommend/logic/repair/usageLimit';
import type { GeneratedSet } from '@/app/recommend/types/generatedSet';
import type { GapRankLookup } from '@/app/recommend/types/gapRank';
import { LOTTO_GAP_RANK_MAX } from '@/app/recommend/constants/gapSetRanks';

const isUsableGapSet = (
  picked: number[] | null,
  usedKeys: ReadonlySet<string>,
  usage: ReadonlyMap<number, number>,
  avoidKeys: ReadonlySet<string>,
): picked is number[] =>
  picked !== null &&
  picked.length === 6 &&
  new Set(picked).size === 6 &&
  !usedKeys.has(setKey(picked)) &&
  !avoidKeys.has(setKey(picked)) &&
  isSetWithinUsageLimit(picked, usage);

const pickFromRankDesc = (
  rows: readonly { number: number }[],
  used: ReadonlySet<number>,
  usage: ReadonlyMap<number, number>,
): number | null => {
  for (const row of rows) {
    if (used.has(row.number)) continue;
    if (!canUseNum(row.number, usage)) continue;
    return row.number;
  }
  return null;
};

const pickFromRankAsc = (
  byRank: ReadonlyMap<number, number>,
  startRank: number,
  used: ReadonlySet<number>,
  usage: ReadonlyMap<number, number>,
): number | null => {
  for (let rank = startRank; rank <= LOTTO_GAP_RANK_MAX; rank++) {
    const num = byRank.get(rank);
    if (num === undefined || used.has(num) || !canUseNum(num, usage)) continue;
    return num;
  }
  return null;
};

export const pickGapSetNumbers = (
  setRank: number,
  gapRankLookup: GapRankLookup,
  usage: ReadonlyMap<number, number>,
  startRank?: number,
): number[] | null => {
  if (gapRankLookup.size === 0) return null;

  const targets =
    startRank === undefined
      ? targetGapRanksForSetRank(setRank)
      : targetGapRanksFromStart(startRank);
  const byRank = buildNumberByGapRank(gapRankLookup);
  const rankDesc = gapRowsByRankDesc(gapRankLookup);
  const picked: number[] = [];
  const used = new Set<number>();

  for (const targetRank of targets) {
    let chosen: number | null = null;

    if (isBeyondGapRankPool(targetRank)) {
      chosen = pickFromRankDesc(rankDesc, used, usage);
    } else {
      chosen = pickFromRankAsc(byRank, targetRank, used, usage);
    }

    if (chosen === null) {
      chosen = pickFromRankAsc(byRank, 1, used, usage);
    }
    if (chosen === null) {
      chosen = pickFromRankDesc(rankDesc, used, usage);
    }
    if (chosen === null) return null;

    picked.push(chosen);
    used.add(chosen);
  }

  return picked;
};

const nudgeGapDuplicate = (
  picked: readonly number[],
  setRank: number,
  gapRankLookup: GapRankLookup,
  usage: ReadonlyMap<number, number>,
  blockedKeys: ReadonlySet<string>,
  startRank?: number,
): number[] | null => {
  const byRank = buildNumberByGapRank(gapRankLookup);
  const rankDesc = gapRowsByRankDesc(gapRankLookup);
  const targets =
    startRank === undefined
      ? targetGapRanksForSetRank(setRank)
      : targetGapRanksFromStart(startRank);

  for (let pos = 0; pos < 6; pos++) {
    const used = new Set(picked.filter((_, index) => index !== pos));
    const startRank = targets[pos]!;

    const trySwap = (candidate: number | null): number[] | null => {
      if (candidate === null || candidate === picked[pos]) return null;
      const next = [...picked];
      next[pos] = candidate;
      if (new Set(next).size !== 6) return null;
      if (blockedKeys.has(setKey(next))) return null;
      if (!isSetWithinUsageLimit(next, usage)) return null;
      return next;
    };

    for (let rank = startRank + 1; rank <= LOTTO_GAP_RANK_MAX; rank++) {
      const swapped = trySwap(byRank.get(rank) ?? null);
      if (swapped) return swapped;
    }
    for (const row of rankDesc) {
      const swapped = trySwap(used.has(row.number) ? null : row.number);
      if (swapped) return swapped;
    }
  }

  return null;
};

export const findOneGapSetForRank = async (
  setRank: number,
  gapRankLookup: GapRankLookup,
  usedKeys: Set<string>,
  usage: Map<number, number>,
  innerSlotUsage: Map<string, number>,
  avoidKeys: ReadonlySet<string> = new Set(),
  repairYieldEvery: number = 0,
  /** 간격 칸 선택용 rank(기본=setRank). 0회 세트는 1 등 사용. */
  pickRank: number = setRank,
  gapStart?: number,
): Promise<GeneratedSet | null> => {
  if (repairYieldEvery > 0) await yieldToMain();

  const blockedKeys =
    avoidKeys.size > 0 ? new Set([...usedKeys, ...avoidKeys]) : usedKeys;

  let picked = pickGapSetNumbers(pickRank, gapRankLookup, usage, gapStart);
  if (
    picked !== null &&
    (usedKeys.has(setKey(picked)) || avoidKeys.has(setKey(picked)))
  ) {
    picked = nudgeGapDuplicate(
      picked,
      pickRank,
      gapRankLookup,
      usage,
      blockedKeys,
      gapStart,
    );
  }

  if (!isUsableGapSet(picked, usedKeys, usage, avoidKeys)) return null;

  usedKeys.add(setKey(picked));
  bumpUsage(picked, usage, innerSlotUsage);
  return toGeneratedSet(picked, `combo:rank${setRank}`);
};
