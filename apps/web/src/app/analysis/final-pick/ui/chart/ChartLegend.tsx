/** 종합 차트 범례. */
export function ChartLegend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400">
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block size-1.5 shrink-0 rounded-full bg-red-500" />
        카이제곱 제외
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block size-1.5 shrink-0 rounded-full bg-amber-400" />
        누적 제외
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block size-1.5 shrink-0 rounded-full bg-sky-400" />
        연속 제외
      </span>
    </div>
  );
}
