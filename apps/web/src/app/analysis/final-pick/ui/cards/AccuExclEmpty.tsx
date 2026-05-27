/** 누적 제외 카드 — 조회 전 placeholder. */
export function AccuExclEmpty() {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, idx) => (
          <span
            key={`acc-ex-empty-${idx}`}
            className="inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-dashed border-rose-300/30 bg-slate-900/40 px-2 text-sm font-semibold text-rose-200/40"
          >
            ·
          </span>
        ))}
      </div>
      <p className="text-xs text-slate-400">기준 회차 조회 후 표시됩니다.</p>
    </div>
  );
}
