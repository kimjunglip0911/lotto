import type { StreakResult } from '../types';

// 1~45번 막대 그래프와 "상위 5%" 점선을 그리는 부분. 색은 당첨(노랑)/저빈도(주황)/일반(보라).

const CHART_H = 160;

type StreakChartBarsProps = {
  streakResults: StreakResult[];
  maxStreak: number;
  top5PctThreshold: number;
  selectedWinningNumberSet: Set<number> | null;
};

const pickBarColor = (w: boolean, c: boolean): string =>
  w ? 'bg-amber-400/90' : c ? 'bg-orange-500/90' : 'bg-indigo-500/60';

const pickNumColor = (w: boolean, c: boolean): string =>
  w ? 'text-amber-300 font-bold' : c ? 'text-orange-300 font-bold' : 'text-slate-300 font-medium';

export const StreakChartBars = ({
  streakResults,
  maxStreak,
  top5PctThreshold,
  selectedWinningNumberSet,
}: StreakChartBarsProps) => (
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
          return (
            <li key={item.number} className="w-8 shrink-0 flex flex-col items-center justify-end" style={{ height: CHART_H + 32 }}>
              <span className="text-[10px] text-slate-200 tabular-nums leading-none mb-0.5">{item.streak}</span>
              <div className={`w-full rounded-t-sm ${pickBarColor(isWinningNum, item.isCold)}`} style={{ height: barPx }} />
              <span className={`text-[11px] leading-none mt-1 ${pickNumColor(isWinningNum, item.isCold)}`}>{item.number}</span>
            </li>
          );
        })}
      </ul>
    </div>
  </div>
);
