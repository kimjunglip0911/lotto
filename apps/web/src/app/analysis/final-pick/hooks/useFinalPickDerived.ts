import { useMemo } from 'react';
import { buildNumberCounts } from '@/app/analysis/accu-nums/logic/numCounts';
import type { WinningNumberRow } from '../types/winRow';

type Opts = {
  previousDrawRows: WinningNumberRow[];
};

export type FinalPickDerived = {
  comprehensiveChartCounts: number[];
  comprehensiveChartAnalyzedDrawCount: number;
};

/** 종합 차트용 누적 출현 집계 — 조회 세션 기준. */
export const useFinalPickDerived = ({ previousDrawRows }: Opts): FinalPickDerived => {
  return useMemo(() => {
    if (previousDrawRows.length === 0) {
      return { comprehensiveChartCounts: [] as number[], comprehensiveChartAnalyzedDrawCount: 0 };
    }
    return {
      comprehensiveChartCounts: buildNumberCounts(previousDrawRows),
      comprehensiveChartAnalyzedDrawCount: previousDrawRows.length,
    };
  }, [previousDrawRows]);
};
