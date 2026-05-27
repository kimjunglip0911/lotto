import { sortChiByDeviation } from '../../helpers/sortByDev';
import type { ChiSquareData } from '../../hooks/useChiSquareData';
import type { ChiSquareView } from '../../hooks/useChiSquareDerived';
import { DeviationBarList } from './DeviationBarList';

type Props = { data: ChiSquareData; view: ChiSquareView };

export function DeviationChart({ data, view }: Props) {
  const sortedItems = sortChiByDeviation(data.chiSquareResults);
  const showChart =
    view.hasSearched && !view.noHistory && data.chiSquareResults.length > 0 && !data.isSearching && !data.searchError;

  return (
    <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-3 space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-xl font-semibold text-white">번호별 편차 차트 (O − E)</h3>
          {showChart && <p className="text-[11px] text-slate-500 mt-0.5">막대 순서: 편차 작은 순(음→양)</p>}
        </div>
        {showChart && (
          <div className="flex flex-wrap gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded bg-amber-400/50 border border-amber-400/70" />
              선택 회차 본번호(보너스 제외)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded bg-blue-500/60 border border-blue-500/80" />
              + 편차 (많이 나옴)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded bg-rose-500/60 border border-rose-500/80" />
              − 편차 (적게 나옴)
            </span>
            {view.walkForwardExcludedNumberSet && view.walkForwardExcludedNumberSet.size > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded ring-2 ring-rose-400/90 ring-offset-1 ring-offset-slate-900 bg-rose-500/40" />
                워크포워드 제외 번호
              </span>
            )}
          </div>
        )}
      </div>
      {view.noHistory ? (
        <p className="text-sm text-slate-300">1회는 이전 회차가 없어 집계할 데이터가 없습니다.</p>
      ) : !view.hasSearched ? (
        <p className="text-sm text-slate-300">조회를 실행하면 번호별 편차 차트가 표시됩니다.</p>
      ) : data.isSearching ? (
        <p className="text-sm text-slate-300">차트 데이터를 계산하는 중입니다...</p>
      ) : data.searchError ? (
        <p className="text-sm text-rose-300">{data.searchError}</p>
      ) : data.chiSquareResults.length === 0 ? (
        <p className="text-sm text-slate-300">집계할 이전 회차 데이터가 없습니다.</p>
      ) : (
        <div className="overflow-x-auto pb-0.5">
          <div className="relative w-max">
            <DeviationBarList
              items={sortedItems}
              maxAbsDeviation={view.maxAbsDeviation}
              selectedWinningNumberSet={view.selectedWinningNumberSet}
              walkForwardExcludedNumberSet={view.walkForwardExcludedNumberSet}
            />
          </div>
        </div>
      )}
    </section>
  );
}
