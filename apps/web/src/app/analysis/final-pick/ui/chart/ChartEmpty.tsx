const NUMBER_RANGE = Array.from({ length: 45 }, (_, i) => i + 1);

/** 집계 전 placeholder 막대. */
export function ChartEmpty() {
  return (
    <div className="space-y-2">
      <div className="overflow-x-auto pb-0.5">
        <ul className="flex h-[200px] w-max items-end gap-1">
          {NUMBER_RANGE.map((number) => (
            <li key={`comprehensive-empty-${number}`} className="flex w-8 shrink-0 flex-col items-center gap-1">
              <span className="text-[11px] leading-none text-slate-500 tabular-nums">·</span>
              <div className="h-3" />
              <div className="h-[145px] w-full rounded-md border border-dashed border-white/10 bg-slate-900/40" />
              <span className="text-[11px] font-medium leading-none text-slate-500">{number}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="text-xs text-slate-400">
        기준 회차 조회 후 1~45번 누적 출현 횟수가 표시됩니다(2회차부터 이전 회차 집계).
      </p>
    </div>
  );
}
