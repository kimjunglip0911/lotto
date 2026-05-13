import type { AccumulatedBarChartStats } from './accBarStat';

/** 조회가 끝난 뒤 막대·평균선만 그립니다. */

type Props = {
  title: string;
  stats: AccumulatedBarChartStats;
  selectedHighlightNumbers: Set<number> | null;
};

export const AccumChartBars = ({ title, stats, selectedHighlightNumbers }: Props) => {
  const { averageCount, averageLineBottomPx, chartRows } = stats;
  return (
    <div className="overflow-x-auto pb-0.5">
      <div className="relative w-max">
        <div className="pointer-events-none absolute inset-x-0" style={{ bottom: `${averageLineBottomPx}px` }}>
          <div className="w-full border-t-[3px] border-rose-400/90" />
          <span className="absolute -top-5 right-0 rounded bg-rose-500/20 px-2 py-0.5 text-[11px] font-medium text-rose-300">
            평균 {averageCount.toFixed(1)}회
          </span>
        </div>
        <ul className="w-max flex items-end gap-1 h-[200px]">
          {chartRows.map((item) => {
            const isHighlighted = selectedHighlightNumbers?.has(item.number) ?? false;
            return (
              <li key={`${title}-${item.number}`} className="w-8 shrink-0 flex flex-col items-center gap-1">
                <span className="text-[11px] text-slate-100 tabular-nums leading-none">{item.count}</span>
                <div className="w-full h-[145px] rounded-md border border-white/10 bg-slate-900/70 flex items-end overflow-hidden">
                  <div
                    className={`w-full ${isHighlighted ? 'bg-rose-500/90' : 'bg-primary/80'}`}
                    style={{ height: `${Math.max(item.ratio, item.count > 0 ? 2 : 0)}%` }}
                  />
                </div>
                <span className="text-[11px] text-slate-300 font-medium leading-none">{item.number}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
