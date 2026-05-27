'use client';

import { useMemo } from 'react';
import { toChartStats } from '@/app/analysis/accu-nums/ui/chart/accBarStat';
import { ChartBars } from './ChartBars';
import { ChartEmpty } from './ChartEmpty';
import { ChartLegend } from './ChartLegend';

type Props = {
  counts: number[];
  analyzedDrawCountForChart: number;
  highlightedNumbers?: Set<number>;
  accumulatedExcludedNumbers?: number[];
  chiSquareWalkForwardExcludedNumbers?: number[];
  streakExcludedNumbers?: number[];
};

/** 1~45 종합 누적 출현 막대 차트. */
export function ComprehensiveChart({
  counts,
  analyzedDrawCountForChart,
  highlightedNumbers,
  accumulatedExcludedNumbers,
  chiSquareWalkForwardExcludedNumbers,
  streakExcludedNumbers,
}: Props) {
  const hasData = counts.length === 45 && analyzedDrawCountForChart > 0;
  const stats = hasData
    ? toChartStats(counts, analyzedDrawCountForChart)
    : { averageCount: 0, averageLineBottomPx: 0, chartRows: [] };

  const accumulatedExcludedSet = useMemo(
    () => new Set(accumulatedExcludedNumbers ?? []),
    [accumulatedExcludedNumbers],
  );
  const chiSquareExcludedSet = useMemo(
    () => new Set(chiSquareWalkForwardExcludedNumbers ?? []),
    [chiSquareWalkForwardExcludedNumbers],
  );
  const streakSet = useMemo(() => new Set(streakExcludedNumbers ?? []), [streakExcludedNumbers]);

  return (
    <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-3 space-y-2.5">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h3 className="text-xl font-semibold text-white">번호별 종합 분석 차트 (1~45)</h3>
        <span className="text-xs text-slate-400">누적 출현(이전 회차까지)</span>
      </div>
      <ChartLegend />
      {hasData ? (
        <ChartBars
          chartRows={stats.chartRows}
          averageCount={stats.averageCount}
          averageLineBottomPx={stats.averageLineBottomPx}
          highlightedNumbers={highlightedNumbers}
          streakSet={streakSet}
          accumulatedSet={accumulatedExcludedSet}
          chiSquareExcludedSet={chiSquareExcludedSet}
        />
      ) : (
        <ChartEmpty
          streakSet={streakSet}
          accumulatedSet={accumulatedExcludedSet}
          chiSquareExcludedSet={chiSquareExcludedSet}
        />
      )}
    </section>
  );
}
