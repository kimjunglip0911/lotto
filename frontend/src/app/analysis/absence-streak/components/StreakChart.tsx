import type { StreakResult } from '../types';

type StreakChartProps = {
  hasSearched: boolean;
  noHistory: boolean;
  isSearching: boolean;
  searchError: string | null;
  streakResults: StreakResult[];
  maxStreak: number;
  top5PctThreshold: number;
  selectedWinningNumberSet: Set<number> | null;
};

const CHART_H = 160;

export const StreakChart = ({
  hasSearched,
  noHistory,
  isSearching,
  searchError,
  streakResults,
  maxStreak,
  top5PctThreshold,
  selectedWinningNumberSet,
}: StreakChartProps) => (
  <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-3 space-y-2.5">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="text-xl font-semibold text-white">번호별 연속 미출현 기간 차트</h3>
      {hasSearched && !noHistory && streakResults.length > 0 && (
        <div className="flex flex-wrap gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded bg-amber-400/50 border border-amber-400/70" />
            선택 회차 당첨번호
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded bg-orange-500/70 border border-orange-500/90" />
            저빈도 후보 (평균 초과)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded bg-indigo-500/60 border border-indigo-500/80" />
            일반 미출현
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-6 border-t-2 border-dashed border-violet-400/80" />
            상위 5%
          </span>
        </div>
      )}
    </div>
    {noHistory ? (
      <p className="text-sm text-slate-300">1회는 이전 회차가 없어 집계할 데이터가 없습니다.</p>
    ) : !hasSearched ? (
      <p className="text-sm text-slate-300">조회를 실행하면 번호별 연속 미출현 기간 차트가 표시됩니다.</p>
    ) : isSearching ? (
      <p className="text-sm text-slate-300">차트 데이터를 계산하는 중입니다...</p>
    ) : searchError ? (
      <p className="text-sm text-rose-300">{searchError}</p>
    ) : streakResults.length === 0 ? (
      <p className="text-sm text-slate-300">집계할 이전 회차 데이터가 없습니다.</p>
    ) : (
      <div className="overflow-x-auto pb-0.5">
        <div className="relative w-max">
          {top5PctThreshold > 0 && maxStreak > 0 && (
            <div
              className="pointer-events-none absolute inset-x-0 z-10"
              style={{ top: Math.round(CHART_H - (top5PctThreshold / maxStreak) * CHART_H) }}
            >
              <div className="w-full border-t-2 border-dashed border-violet-400/80" />
              <span className="absolute -top-5 left-0 rounded bg-violet-500/20 px-2 py-0.5 text-[11px] font-medium text-violet-300 whitespace-nowrap">
                상위 5% {top5PctThreshold}회차
              </span>
            </div>
          )}
          <ul className="w-max flex gap-1 items-end" style={{ height: CHART_H + 32 }}>
            {streakResults.map((item) => {
              const isWinningNum = selectedWinningNumberSet?.has(item.number) ?? false;
              const barPx = maxStreak > 0 ? Math.max((item.streak / maxStreak) * CHART_H, 2) : 2;
              const barColor = isWinningNum
                ? 'bg-amber-400/90'
                : item.isCold
                  ? 'bg-orange-500/90'
                  : 'bg-indigo-500/60';
              const numColor = isWinningNum
                ? 'text-amber-300 font-bold'
                : item.isCold
                  ? 'text-orange-300 font-bold'
                  : 'text-slate-300 font-medium';

              return (
                <li key={item.number} className="w-8 shrink-0 flex flex-col items-center justify-end" style={{ height: CHART_H + 32 }}>
                  <span className="text-[10px] text-slate-200 tabular-nums leading-none mb-0.5">{item.streak}</span>
                  <div className={`w-full rounded-t-sm ${barColor}`} style={{ height: barPx }} />
                  <span className={`text-[11px] leading-none mt-1 ${numColor}`}>{item.number}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    )}
  </section>
);
