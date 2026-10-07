import { PositionBandProbabilityTable } from './table/PositionBandProbabilityTable';
import type { useCombinationAnalysisData } from '../hooks/useCombinationAnalysisData';

type Props = ReturnType<typeof useCombinationAnalysisData>;

/** 조합 분석 본문: 로딩·에러·기간별 집계 표 */
export function CombinationMain({ isLoading, loadError, windows }: Props) {
  return (
    <main className="flex-1 overflow-y-auto pb-12 px-4 pt-4 space-y-6">
      {isLoading && <p className="text-sm text-slate-300">데이터를 불러오는 중...</p>}
      {!isLoading && loadError && <p className="text-sm text-rose-300">{loadError}</p>}
      {!isLoading &&
        !loadError &&
        windows.map((w) => (
          <PositionBandProbabilityTable
            key={w.key}
            label={w.label}
            windowSize={w.windowSize}
            totalDraws={w.totalDraws}
            rows={w.rows}
          />
        ))}
    </main>
  );
}
