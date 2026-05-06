import { CHART_HALF_H } from '../constants';
import type { ChiSquareResult } from '../types';

type Props = {
  hasSearched: boolean;
  noHistory: boolean;
  isSearching: boolean;
  searchError: string | null;
  chiSquareResults: ChiSquareResult[];
  selectedWinningNumberSet: Set<number> | null;
  /** 사용 번호 14개 — 막대·번호에 보조 강조 */
  adoptedUsageNumberSet?: Set<number> | null;
  maxAbsDeviation: number;
};

export function DeviationChart({
  hasSearched,
  noHistory,
  isSearching,
  searchError,
  chiSquareResults,
  selectedWinningNumberSet,
  adoptedUsageNumberSet = null,
  maxAbsDeviation,
}: Props) {
  const sortedItems = [...chiSquareResults].sort(
    (a, b) => a.deviation - b.deviation || a.number - b.number
  );

  return (
    <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-3 space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-xl font-semibold text-white">번호별 편차 차트 (O − E)</h3>
          {hasSearched && !noHistory && chiSquareResults.length > 0 && (
            <p className="text-[11px] text-slate-500 mt-0.5">막대 순서: 편차 작은 순(음→양)</p>
          )}
        </div>
        {hasSearched && !noHistory && chiSquareResults.length > 0 && (
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
            {adoptedUsageNumberSet && adoptedUsageNumberSet.size > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded ring-2 ring-emerald-400/90 ring-offset-1 ring-offset-slate-900 bg-emerald-500/40" />
                사용 번호 14개
              </span>
            )}
          </div>
        )}
      </div>
      {noHistory ? (
        <p className="text-sm text-slate-300">1회는 이전 회차가 없어 집계할 데이터가 없습니다.</p>
      ) : !hasSearched ? (
        <p className="text-sm text-slate-300">조회를 실행하면 번호별 편차 차트가 표시됩니다.</p>
      ) : isSearching ? (
        <p className="text-sm text-slate-300">차트 데이터를 계산하는 중입니다...</p>
      ) : searchError ? (
        <p className="text-sm text-rose-300">{searchError}</p>
      ) : chiSquareResults.length === 0 ? (
        <p className="text-sm text-slate-300">집계할 이전 회차 데이터가 없습니다.</p>
      ) : (
        <div className="overflow-x-auto pb-0.5">
          <div className="relative w-max">
            <ul className="w-max flex gap-1">
              {sortedItems.map((item) => {
                const isWinningNum = selectedWinningNumberSet?.has(item.number) ?? false;
                const isAdopted = adoptedUsageNumberSet?.has(item.number) ?? false;
                const posBarPx = item.deviation > 0
                  ? Math.max((item.deviation / maxAbsDeviation) * CHART_HALF_H, 2)
                  : 0;
                const negBarPx = item.deviation < 0
                  ? Math.max((Math.abs(item.deviation) / maxAbsDeviation) * CHART_HALF_H, 2)
                  : 0;

                const posColor = isWinningNum ? 'bg-amber-400/90' : item.isHighFreq ? 'bg-blue-500/90' : 'bg-blue-400/50';
                const negColor = isWinningNum ? 'bg-amber-400/90' : item.isLowFreq ? 'bg-rose-500/90' : 'bg-rose-400/50';
                const numColor = isWinningNum ? 'text-amber-300 font-bold' : 'text-slate-300 font-medium';

                return (
                  <li
                    key={item.number}
                    className={`w-8 shrink-0 flex flex-col items-center ${isAdopted ? 'rounded-b-sm pb-0.5 ring-1 ring-emerald-400/70 ring-offset-1 ring-offset-slate-950' : ''}`}
                  >
                    <div className="relative w-full flex flex-col justify-end" style={{ height: CHART_HALF_H }}>
                      {item.deviation > 0 && (
                        <>
                          <span className="absolute bottom-full left-0 right-0 text-center text-[10px] text-slate-200 tabular-nums leading-none mb-0.5">
                            +{item.deviation.toFixed(1)}
                          </span>
                          <div className={`w-full rounded-t-sm ${posColor}`} style={{ height: posBarPx }} />
                        </>
                      )}
                    </div>

                    <div className={`w-full h-[2px] ${isWinningNum ? 'bg-amber-400/60' : 'bg-white/20'}`} />

                    <div className="relative w-full flex flex-col justify-start" style={{ height: CHART_HALF_H }}>
                      {item.deviation < 0 && (
                        <>
                          <div className={`w-full rounded-b-sm ${negColor}`} style={{ height: negBarPx }} />
                          <span className="absolute top-full left-0 right-0 text-center text-[10px] text-slate-200 tabular-nums leading-none mt-0.5">
                            {item.deviation.toFixed(1)}
                          </span>
                        </>
                      )}
                    </div>

                    <span className={`text-[11px] leading-none mt-4 ${numColor}`}>{item.number}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
