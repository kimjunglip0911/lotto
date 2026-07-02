/**
 * 추천 생성에서 쓸 번호별 간격 순위를 계산합니다.
 *
 * 하는 일
 * - 기준 회차보다 앞선 당첨 이력만 보고 1~45번의 마지막 출현 간격을 구합니다.
 * - 과거 출현 간격 평균과 현재 간격이 가까운 번호부터 1등으로 순위를 매깁니다.
 *
 * 역할 나눔
 * - 이 파일은 계산만 담당하고, 화면 표시는 하지 않습니다.
 * - 생성 로직은 이 결과를 후보 번호 정렬에만 사용합니다.
 */

import type { WinningNumberRow } from '@/lib/accu-nums/types';
import type { GapRankLookup, GapRankRow } from '@/app/recommend/types/gapRank';
import {
  avgGap,
  buildGaps,
  collectNumberDraws,
  LOTTO_MAX,
} from '@/app/recommend/logic/gap/gapParts';

const compareGapRows = (a: GapRankRow, b: GapRankRow): number => {
  const distA = a.distance ?? Number.POSITIVE_INFINITY;
  const distB = b.distance ?? Number.POSITIVE_INFINITY;
  if (distA !== distB) return distA - distB;
  const gapA = a.currentGap ?? Number.NEGATIVE_INFINITY;
  const gapB = b.currentGap ?? Number.NEGATIVE_INFINITY;
  if (gapA !== gapB) return gapB - gapA;
  return a.number - b.number;
};

export const buildGapRankRows = (
  rows: readonly WinningNumberRow[],
  referenceDrawNo: number,
): GapRankRow[] => {
  const sorted = [...rows].sort((a, b) => a.draw_no - b.draw_no);
  const byNumber = collectNumberDraws(sorted, referenceDrawNo);
  const baseRows = Array.from({ length: LOTTO_MAX }, (_, index) => {
    const number = index + 1;
    const draws = byNumber[number] ?? [];
    const avg = avgGap(buildGaps(draws));
    const last = draws[draws.length - 1] ?? null;
    const currentGap = last === null ? null : referenceDrawNo - last;
    const distance = avg === null || currentGap === null ? null : Math.abs(currentGap - avg);
    return { number, draws, currentGap, avgGap: avg, distance, rank: LOTTO_MAX };
  });
  return [...baseRows].sort(compareGapRows).map((row, index) => ({ ...row, rank: index + 1 }));
};

export const buildGapRankLookup = (
  rows: readonly WinningNumberRow[],
  referenceDrawNo: number,
): GapRankLookup => new Map(buildGapRankRows(rows, referenceDrawNo).map((row) => [row.number, row]));
