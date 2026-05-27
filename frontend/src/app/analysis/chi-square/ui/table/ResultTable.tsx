import { sortChiByDeviation } from '../../helpers/sortByDev';
import type { ChiSquareData } from '../../hooks/useChiSquareData';
import type { ChiSquareView } from '../../hooks/useChiSquareDerived';
import { ResultCriteria } from './ResultCriteria';
import { ResultTableBody } from './ResultTableBody';

type Props = { data: ChiSquareData; view: ChiSquareView };

export function ResultTable({ data, view }: Props) {
  const sortedRows = sortChiByDeviation(data.chiSquareResults);
  const hasWfExclusion = Boolean(
    view.walkForwardExcludedNumberSet && view.walkForwardExcludedNumberSet.size > 0,
  );

  return (
    <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-4 space-y-3">
      <h3 className="text-xl font-semibold text-white">번호별 카이제곱 검정 결과</h3>

      {view.noHistory ? (
        <p className="text-sm text-slate-300">1회는 이전 회차가 없어 집계할 데이터가 없습니다.</p>
      ) : !view.hasSearched ? (
        <p className="text-sm text-slate-300">조회를 실행하면 번호별 카이제곱 검정 결과 테이블이 표시됩니다.</p>
      ) : data.isSearching ? (
        <p className="text-sm text-slate-300">데이터를 계산하는 중입니다...</p>
      ) : data.searchError ? (
        <p className="text-sm text-rose-300">{data.searchError}</p>
      ) : data.chiSquareResults.length === 0 ? (
        <p className="text-sm text-slate-300">집계할 이전 회차 데이터가 없습니다.</p>
      ) : (
        <>
          <ResultCriteria
            expected={view.expected}
            analyzedDrawCount={data.analyzedDrawCount}
            chiSquareThreshold={view.chiSquareThreshold}
            hasWinningHighlight={Boolean(view.selectedWinningNumberSet)}
            hasWfExclusion={hasWfExclusion}
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[560px]">
              <thead>
                <tr className="border-b border-white/10 text-xs text-slate-400">
                  <th className="py-2 pr-3 font-medium w-12">번호</th>
                  <th className="py-2 pr-3 font-medium text-right">실제(O)</th>
                  <th className="py-2 pr-3 font-medium text-right">기대(E)</th>
                  <th className="py-2 pr-3 font-medium text-right">편차(O-E)</th>
                  <th className="py-2 pr-3 font-medium text-right">χ² 기여값</th>
                  <th className="py-2 font-medium text-center">판정</th>
                </tr>
              </thead>
              <ResultTableBody rows={sortedRows} walkForwardExcludedNumberSet={view.walkForwardExcludedNumberSet} />
            </table>
          </div>
        </>
      )}
    </section>
  );
}
