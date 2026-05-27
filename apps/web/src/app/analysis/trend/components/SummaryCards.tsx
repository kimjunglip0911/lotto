type Props = {
  historyCount: number;
  baseline: number;
  kTrend: number;
};

export function SummaryCards({ historyCount, baseline, kTrend }: Props) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-3 flex flex-col gap-1">
        <span className="text-xs font-semibold text-slate-400">분석 회차 수</span>
        <span className="text-lg font-bold text-white">{historyCount}회</span>
        <span className="text-[10px] text-slate-500">기준 회차 미만 전체 이력</span>
      </div>
      <div className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-3 flex flex-col gap-1">
        <span className="text-xs font-semibold text-sky-400">EMA</span>
        <span className="text-lg font-bold text-white">k = {kTrend}</span>
        <span className="text-[10px] text-slate-500">주6 출현만, 보너스 제외</span>
      </div>
      <div className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-3 flex flex-col gap-1">
        <span className="text-xs font-semibold text-slate-400">기댓값</span>
        <span className="text-lg font-bold text-white">{(baseline * 100).toFixed(1)}%</span>
        <span className="text-[10px] text-slate-500">이력 집계(주6), 이론 6/45</span>
      </div>
    </section>
  );
}
