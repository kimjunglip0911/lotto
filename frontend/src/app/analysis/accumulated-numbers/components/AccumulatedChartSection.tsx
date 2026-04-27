type AccumulatedChartSectionProps = {
  title: string;
  counts: number[];
  analyzedDrawCountForChart: number;
  noDataMessage: string;
  hasSearched: boolean;
  selectedSearchDrawNo: number;
  isSearching: boolean;
  searchError: string | null;
  selectedHighlightNumbers: Set<number> | null;
};

export function AccumulatedChartSection({
  title,
  counts,
  analyzedDrawCountForChart,
  noDataMessage,
  hasSearched,
  selectedSearchDrawNo,
  isSearching,
  searchError,
  selectedHighlightNumbers,
}: AccumulatedChartSectionProps) {
  const maxCount = Math.max(...counts, 0);
  const totalCount = counts.reduce((sum, count) => sum + count, 0);
  const averageCount = analyzedDrawCountForChart > 0 ? totalCount / counts.length : 0;
  const averageRatio = maxCount > 0 ? (averageCount / maxCount) * 100 : 0;
  const clampedAverageRatio = Math.min(100, Math.max(0, averageRatio));
  const chartBarHeightPx = 145;
  const chartBottomLabelOffsetPx = 14;
  const averageLineBottomPx = chartBottomLabelOffsetPx + (clampedAverageRatio / 100) * chartBarHeightPx;
  const chartRows = counts.map((count, index) => ({
    number: index + 1,
    count,
    ratio: maxCount > 0 ? (count / maxCount) * 100 : 0,
  }));

  return (
    <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-3 space-y-2.5">
      <h3 className="text-xl font-semibold text-white">{title}</h3>
      {hasSearched && selectedSearchDrawNo <= 1 ? (
        <p className="text-sm text-slate-300">1회는 이전 회차가 없어 집계할 데이터가 없습니다.</p>
      ) : !hasSearched ? (
        <p className="text-sm text-slate-300">조회를 실행하면 번호별 누적 막대 차트가 표시됩니다.</p>
      ) : isSearching ? (
        <p className="text-sm text-slate-300">차트 데이터를 계산하는 중입니다...</p>
      ) : searchError ? (
        <p className="text-sm text-rose-300">{searchError}</p>
      ) : analyzedDrawCountForChart <= 0 ? (
        <p className="text-sm text-slate-300">{noDataMessage}</p>
      ) : (
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
      )}
    </section>
  );
}
