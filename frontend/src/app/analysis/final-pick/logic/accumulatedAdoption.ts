import {
  buildAccumulatedCountExclusionResult,
  type AccumulatedCountExclusionResult,
} from '@/app/analysis/accumulated-numbers/logic/accumulatedCountExtremes';
import type { WinningNumberRow } from '../types';

export type AccumulatedExclusionResult = AccumulatedCountExclusionResult;

/**
 * 누적 출현 극값 기준 제외 번호(2년 최다·최소, 전체 최다·최소 각 1).
 * 연속 출현 제외는 극값 선정에 쓰지 않으며, 카이제곱 잔여 계산 시 별도로 excludedSet에 합류한다.
 */
export const getAccumulatedExclusionNumbers = ({
  previousDrawRows,
}: {
  previousDrawRows: WinningNumberRow[];
}): AccumulatedExclusionResult => buildAccumulatedCountExclusionResult(previousDrawRows);
