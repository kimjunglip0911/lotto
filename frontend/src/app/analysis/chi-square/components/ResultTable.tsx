import type { ChiSquareResult } from '../types';

type Props = {
  hasSearched: boolean;
  noHistory: boolean;
  isSearching: boolean;
  searchError: string | null;
  chiSquareResults: ChiSquareResult[];
  expected: number;
  analyzedDrawCount: number;
  chiSquareThreshold: number;
  selectedWinningNumberSet: Set<number> | null;
  /** 워크포워드 제외 규칙에 해당하는 번호 — 행·번호 셀에 보조 강조 */
  walkForwardExcludedNumberSet?: Set<number> | null;
};

export function ResultTable({
  hasSearched,
  noHistory,
  isSearching,
  searchError,
  chiSquareResults,
  expected,
  analyzedDrawCount,
  chiSquareThreshold,
  selectedWinningNumberSet,
  walkForwardExcludedNumberSet = null,
}: Props) {
  const sortedRows = [...chiSquareResults].sort(
    (a, b) => a.deviation - b.deviation || a.number - b.number
  );

  return (
    <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-4 space-y-3">
      <h3 className="text-xl font-semibold text-white">번호별 카이제곱 검정 결과</h3>

      {noHistory ? (
        <p className="text-sm text-slate-300">1회는 이전 회차가 없어 집계할 데이터가 없습니다.</p>
      ) : !hasSearched ? (
        <p className="text-sm text-slate-300">조회를 실행하면 번호별 카이제곱 검정 결과 테이블이 표시됩니다.</p>
      ) : isSearching ? (
        <p className="text-sm text-slate-300">데이터를 계산하는 중입니다...</p>
      ) : searchError ? (
        <p className="text-sm text-rose-300">{searchError}</p>
      ) : chiSquareResults.length === 0 ? (
        <p className="text-sm text-slate-300">집계할 이전 회차 데이터가 없습니다.</p>
      ) : (
        <>
          <div className="rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 space-y-2 mb-1">
            <p className="text-xs font-semibold text-slate-300">판정 기준값</p>
            <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-slate-400">
              <span>
                기대값 <span className="font-semibold text-white">E = {expected.toFixed(2)}</span>
                <span className="text-slate-500 ml-1">({analyzedDrawCount}회 × 6 / 45)</span>
              </span>
              <span>
                유의 임계값 <span className="font-semibold text-amber-300">χ² ≥ {chiSquareThreshold}</span>
                <span className="text-slate-500 ml-1">(p &lt; 0.05, df=1)</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-slate-400 pt-1 border-t border-white/5">
              <span className="text-slate-500 w-full">행 정렬: 편차(O−E) 작은 순(음→양), 동률 시 번호 오름차순</span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded bg-rose-500/40 border border-rose-500/60" />
                저빈도: O &lt; {expected.toFixed(2)} AND χ² ≥ {chiSquareThreshold}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded bg-blue-500/40 border border-blue-500/60" />
                고빈도: O &gt; {expected.toFixed(2)} AND χ² ≥ {chiSquareThreshold}
              </span>
              {selectedWinningNumberSet && (
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded bg-amber-400/40 border border-amber-400/60" />
                  선택 회차 본번호(보너스 제외)
                </span>
              )}
              {walkForwardExcludedNumberSet && walkForwardExcludedNumberSet.size > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded ring-2 ring-rose-400/80 ring-offset-1 ring-offset-slate-900 bg-rose-500/30" />
                  워크포워드 제외 번호
                </span>
              )}
            </div>
          </div>
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
              <tbody>
                {sortedRows.map((row) => {
                  const isWalkForwardExcluded = walkForwardExcludedNumberSet?.has(row.number) ?? false;
                  return (
                    <tr
                      key={row.number}
                      className={`border-b border-white/5 transition-colors ${
                        row.isLowFreq
                          ? 'bg-rose-500/10 hover:bg-rose-500/15'
                          : row.isHighFreq
                            ? 'bg-blue-500/10 hover:bg-blue-500/15'
                            : 'hover:bg-white/3'
                      }`}
                    >
                      <td className="py-2 pr-3">
                        <span
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                            row.isLowFreq
                              ? 'bg-rose-500/30 text-rose-200'
                              : row.isHighFreq
                                ? 'bg-blue-500/30 text-blue-200'
                                : 'bg-white/10 text-white'
                          } ${isWalkForwardExcluded ? 'ring-2 ring-rose-400/85 ring-offset-1 ring-offset-slate-900' : ''}`}
                        >
                          {row.number}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums text-white font-medium">{row.observed}</td>
                      <td className="py-2 pr-3 text-right tabular-nums text-slate-400">{row.expected.toFixed(2)}</td>
                      <td className={`py-2 pr-3 text-right tabular-nums font-medium ${row.deviation < 0 ? 'text-rose-300' : row.deviation > 0 ? 'text-blue-300' : 'text-slate-400'}`}>
                        {row.deviation > 0 ? '+' : ''}
                        {row.deviation.toFixed(2)}
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums text-slate-300">{row.chiSquare.toFixed(4)}</td>
                      <td className="py-2 text-center">
                        {row.isLowFreq ? (
                          <span className="text-xs font-semibold text-rose-300 bg-rose-500/20 rounded-md px-2 py-0.5">저빈도</span>
                        ) : row.isHighFreq ? (
                          <span className="text-xs font-semibold text-blue-300 bg-blue-500/20 rounded-md px-2 py-0.5">고빈도</span>
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
