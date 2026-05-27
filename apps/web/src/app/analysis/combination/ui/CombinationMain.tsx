import { ConsecutiveNumberTable } from './table/ConsecutiveNumberTable';
import { HighLowSumTable } from './table/HighLowSumTable';
import { OddEvenProbabilityTable } from './table/OddEvenProbabilityTable';
import { PositionBandProbabilityTable } from './table/PositionBandProbabilityTable';
import type { useCombinationAnalysisData } from '../hooks/useCombinationAnalysisData';

type Props = ReturnType<typeof useCombinationAnalysisData>;

/** 조합 분석 본문: 로딩·에러·4개 집계 표 */
export function CombinationMain({
  isLoading,
  loadError,
  totalDraws,
  oddEvenRows,
  consecutiveRows,
  positionBandRows,
  sumExtremeStats,
}: Props) {
  return (
    <main className="flex-1 overflow-y-auto pb-12 px-4 pt-4 space-y-6">
      {isLoading && <p className="text-sm text-slate-300">데이터를 불러오는 중...</p>}
      {!isLoading && loadError && <p className="text-sm text-rose-300">{loadError}</p>}
      {!isLoading && !loadError && (
        <>
          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            <div className="flex-1 min-w-0">
              <OddEvenProbabilityTable totalDraws={totalDraws} rows={oddEvenRows} />
            </div>
            <ConsecutiveNumberTable totalDraws={totalDraws} rows={consecutiveRows} />
          </div>
          <PositionBandProbabilityTable totalDraws={totalDraws} rows={positionBandRows} />
          <HighLowSumTable stats={sumExtremeStats} />
        </>
      )}
    </main>
  );
}
