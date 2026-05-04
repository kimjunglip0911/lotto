import { PHASE_META } from '../constants';
import type { NumberTrendResult } from '../types';

type Props = {
  noHistory: boolean;
  hasSearched: boolean;
  isSearching: boolean;
  searchError: string | null;
  hasResults: boolean;
  trendResults: NumberTrendResult[];
  selectedWinningNumberSet: Set<number> | null;
  /** 트렌드 이력 기반 기댓값(주6·보너스 제외) */
  baseline: number;
};

export function TrendResultTable({
  noHistory,
  hasSearched,
  isSearching,
  searchError,
  hasResults,
  trendResults,
  selectedWinningNumberSet,
  baseline,
}: Props) {
  return (
    <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-4 space-y-3">
      <h3 className="text-xl font-semibold text-white">번호별 EMA 출현율 상세</h3>

      {noHistory ? (
        <p className="text-sm text-slate-300">1회는 이전 회차가 없어 집계할 데이터가 없습니다.</p>
      ) : !hasSearched ? (
        <p className="text-sm text-slate-300">조회를 실행하면 번호별 EMA 출현율 테이블이 표시됩니다.</p>
      ) : isSearching ? (
        <p className="text-sm text-slate-300">데이터를 계산하는 중입니다...</p>
      ) : searchError ? (
        <p className="text-sm text-rose-300">{searchError}</p>
      ) : !hasResults ? (
        <p className="text-sm text-slate-300">집계할 이전 회차 데이터가 없습니다.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left" style={{ minWidth: 400 }}>
            <thead>
              <tr className="border-b border-white/10 text-xs text-slate-400">
                <th className="py-2 pr-3 font-medium w-12">번호</th>
                <th className="py-2 pr-2 font-medium text-right" style={{ color: '#38bdf8' }}>
                  EMA
                </th>
                <th className="py-2 pr-2 font-medium text-right text-slate-400">기댓값 대비</th>
                <th className="py-2 font-medium text-center">국면</th>
              </tr>
            </thead>
            <tbody>
              {trendResults.map((row) => {
                const isWinning = selectedWinningNumberSet?.has(row.number) ?? false;
                const meta = PHASE_META[row.phase];
                const emaPct = (row.ema * 100).toFixed(1);
                const diffPct = ((row.ema - baseline) * 100).toFixed(1);
                const diffPositive = row.ema >= baseline;
                return (
                  <tr key={row.number} className={`border-b border-white/5 transition-colors ${meta.bgClass} hover:brightness-110`}>
                    <td className="py-1.5 pr-3">
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          isWinning ? 'bg-amber-400/30 text-amber-200' : `${meta.badgeClass}`
                        }`}
                      >
                        {row.number}
                      </span>
                    </td>
                    <td className="py-1.5 pr-2 text-right tabular-nums text-xs text-sky-300">{emaPct}%</td>
                    <td className={`py-1.5 pr-2 text-right tabular-nums text-xs ${diffPositive ? 'text-blue-300' : 'text-rose-400'}`}>
                      {diffPositive ? '+' : ''}
                      {diffPct}%
                    </td>
                    <td className="py-1.5 text-center">
                      <span className={`text-xs font-semibold rounded-md px-2 py-0.5 ${meta.badgeClass}`}>{meta.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
