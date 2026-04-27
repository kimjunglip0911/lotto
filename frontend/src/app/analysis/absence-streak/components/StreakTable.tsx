import type { StreakResult } from '../types';

type StreakTableProps = {
  hasSearched: boolean;
  noHistory: boolean;
  isSearching: boolean;
  searchError: string | null;
  streakResults: StreakResult[];
};

export const StreakTable = ({
  hasSearched,
  noHistory,
  isSearching,
  searchError,
  streakResults,
}: StreakTableProps) => (
  <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-4 space-y-3">
    <h3 className="text-xl font-semibold text-white">번호별 연속 미출현 분석 결과</h3>

    {noHistory ? (
      <p className="text-sm text-slate-300">1회는 이전 회차가 없어 집계할 데이터가 없습니다.</p>
    ) : !hasSearched ? (
      <p className="text-sm text-slate-300">조회를 실행하면 번호별 연속 미출현 결과 테이블이 표시됩니다.</p>
    ) : isSearching ? (
      <p className="text-sm text-slate-300">데이터를 계산하는 중입니다...</p>
    ) : searchError ? (
      <p className="text-sm text-rose-300">{searchError}</p>
    ) : streakResults.length === 0 ? (
      <p className="text-sm text-slate-300">집계할 이전 회차 데이터가 없습니다.</p>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left min-w-[480px]">
          <thead>
            <tr className="border-b border-white/10 text-xs text-slate-400">
              <th className="py-2 pr-3 font-medium w-12">번호</th>
              <th className="py-2 pr-3 font-medium text-right">마지막 출현 회차</th>
              <th className="py-2 pr-3 font-medium text-right">연속 미출현</th>
              <th className="py-2 font-medium text-center">판정</th>
            </tr>
          </thead>
          <tbody>
            {streakResults.map((row) => (
              <tr
                key={row.number}
                className={`border-b border-white/5 transition-colors ${
                  row.isCold ? 'bg-orange-500/10 hover:bg-orange-500/15' : 'hover:bg-white/3'
                }`}
              >
                <td className="py-2 pr-3">
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      row.isCold ? 'bg-orange-500/30 text-orange-200' : 'bg-white/10 text-white'
                    }`}
                  >
                    {row.number}
                  </span>
                </td>
                <td className="py-2 pr-3 text-right tabular-nums text-slate-300">
                  {row.lastDrawNo !== null ? `${row.lastDrawNo}회` : '출현 기록 없음'}
                </td>
                <td className={`py-2 pr-3 text-right tabular-nums font-semibold ${row.isCold ? 'text-orange-300' : 'text-white'}`}>
                  {row.streak}회차
                </td>
                <td className="py-2 text-center">
                  {row.isCold ? (
                    <span className="text-xs font-semibold text-orange-300 bg-orange-500/20 rounded-md px-2 py-0.5">저빈도 후보</span>
                  ) : (
                    <span className="text-xs text-slate-500">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </section>
);
