'use client';

import type { AccumulatedBarChartStats } from '@/app/analysis/accu-nums/ui/chart/accBarStat';
import { ExclusionMarkers } from './ExclusionMarkers';

type Props = {
  chartRows: AccumulatedBarChartStats['chartRows'];
  averageCount: number;
  averageLineBottomPx: number;
  highlightedNumbers?: Set<number>;
  streakSet: Set<number>;
  accumulatedSet: Set<number>;
  chiSquareExcludedSet: Set<number>;
};

/** 누적 출현 막대 본문(평균선 포함). */
export function ChartBars({
  chartRows,
  averageCount,
  averageLineBottomPx,
  highlightedNumbers,
  streakSet,
  accumulatedSet,
  chiSquareExcludedSet,
}: Props) {
  return (
    <div className="overflow-x-auto pb-0.5">
      <div className="relative w-max">
        <div className="pointer-events-none absolute inset-x-0" style={{ bottom: `${averageLineBottomPx}px` }}>
          <div className="w-full border-t-[3px] border-rose-400/90" />
          <span className="absolute -top-5 right-0 rounded bg-rose-500/20 px-2 py-0.5 text-[11px] font-medium text-rose-300">
            평균 {averageCount.toFixed(1)}회
          </span>
        </div>
        <ul className="flex h-[200px] w-max items-end gap-1">
          {chartRows.map((item) => {
            const isHighlighted = highlightedNumbers?.has(item.number) ?? false;
            return (
              <li key={`comprehensive-${item.number}`} className="flex w-8 shrink-0 flex-col items-center gap-1">
                <span className="text-[11px] leading-none text-slate-100 tabular-nums">{item.count}</span>
                <ExclusionMarkers
                  number={item.number}
                  streakSet={streakSet}
                  accumulatedSet={accumulatedSet}
                  chiSquareExcludedSet={chiSquareExcludedSet}
                />
                <div className="flex h-[145px] w-full items-end overflow-hidden rounded-md border border-white/10 bg-slate-900/70">
                  <div
                    className={`w-full ${isHighlighted ? 'bg-rose-500/90' : 'bg-primary/80'}`}
                    style={{ height: `${Math.max(item.ratio, item.count > 0 ? 2 : 0)}%` }}
                  />
                </div>
                <span className="text-[11px] font-medium leading-none text-slate-300">{item.number}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
