import {
  buildAccumulatedCountExclusionResult,
  type AccumulatedCountExclusionResult,
} from '@/app/analysis/accu-nums/logic/accuCntExt';
import type { WinningNumberRow } from '../types/winRow';

export type AccumulatedExclusionResult = AccumulatedCountExclusionResult;

/** 누적 출현 극값 기준 제외 번호(2년·전체 각 최다·최소 1). */
export const getAccumulatedExclusionNumbers = ({
  previousDrawRows,
}: {
  previousDrawRows: WinningNumberRow[];
}): AccumulatedExclusionResult => buildAccumulatedCountExclusionResult(previousDrawRows);
