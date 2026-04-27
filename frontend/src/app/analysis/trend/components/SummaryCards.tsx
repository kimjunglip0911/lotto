type Props = {
  historyCount: number;
  baseline: number;
  kConfig: { fast: number; slow: number };
};

export function SummaryCards({ historyCount, baseline, kConfig }: Props) {
  return (
    <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-3 flex flex-col gap-1">
        <span className="text-xs font-semibold text-slate-400">분석 회차 수</span>
        <span className="text-lg font-bold text-white">{historyCount}회</span>
        <span className="text-[10px] text-slate-500">전체 이력</span>
      </div>
      <div className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-3 flex flex-col gap-1">
        <span className="text-xs font-semibold text-emerald-400">Fast EMA</span>
        <span className="text-lg font-bold text-white">k = {kConfig.fast}</span>
        <span className="text-[10px] text-slate-500">~90회 유효</span>
      </div>
      <div className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-3 flex flex-col gap-1">
        <span className="text-xs font-semibold text-sky-400">Slow EMA</span>
        <span className="text-lg font-bold text-white">k = {kConfig.slow}</span>
        <span className="text-[10px] text-slate-500">~228회 유효</span>
      </div>
      <div className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-3 flex flex-col gap-1">
        <span className="text-xs font-semibold text-slate-400">기댓값</span>
        <span className="text-lg font-bold text-white">{(baseline * 100).toFixed(1)}%</span>
        <span className="text-[10px] text-slate-500">6/45 (주번호 기준)</span>
      </div>
    </section>
  );
}
