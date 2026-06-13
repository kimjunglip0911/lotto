import { HighLowSumTable } from './table/HighLowSumTable';
import { PositionBandProbabilityTable } from './table/PositionBandProbabilityTable';
import type { useCombinationAnalysisData } from '../hooks/useCombinationAnalysisData';

type Props = ReturnType<typeof useCombinationAnalysisData>;

/** 조합 분석 본문: 로딩·에러·2개 집계 표 */
export function CombinationMain({
  isLoading,
  loadError,
  totalDraws,
  positionBandRows,
  sumExtremeStats,
}: Props) {
  return (
    <main className="flex-1 overflow-y-auto pb-12 px-4 pt-4 space-y-6">
      {isLoading && <p className="text-sm text-slate-300">데이터를 불러오는 중...</p>}
      {!isLoading && loadError && <p className="text-sm text-rose-300">{loadError}</p>}
      {!isLoading && !loadError && (
        <>
          <PositionBandProbabilityTable totalDraws={totalDraws} rows={positionBandRows} />
          <HighLowSumTable stats={sumExtremeStats} />
        </>
      )}
    </main>
  );
}
