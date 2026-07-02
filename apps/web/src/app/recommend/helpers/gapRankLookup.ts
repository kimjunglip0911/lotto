/**
 * 추천 결과 표에서 번호별 간격 값을 꺼내 쓰는 보조 함수입니다.
 *
 * 하는 일
 * - 번호 하나에 대해 마지막 출현 이후 현재 간격·평균 간격·간격 순위를 lookup에서 찾습니다.
 *
 * 역할 나눔
 * - 간격 계산은 `logic/gap/gapRank.ts`가 담당합니다.
 * - 화면 표는 이 함수로 값만 읽어 옵니다.
 */

import type { GapRankLookup } from '@/app/recommend/types/gapRank';

export const currentGapAtNumber = (
  lookup: GapRankLookup,
  num: number,
): number | null => lookup.get(num)?.currentGap ?? null;

export const avgGapAtNumber = (lookup: GapRankLookup, num: number): number | null =>
  lookup.get(num)?.avgGap ?? null;

export const gapRankAtNumber = (lookup: GapRankLookup, num: number): number | null =>
  lookup.get(num)?.rank ?? null;
