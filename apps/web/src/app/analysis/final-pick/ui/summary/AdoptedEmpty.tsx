type Props = { targetCount: number };

export function AdoptedEmpty({ targetCount }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: targetCount }).map((_, idx) => (
          <span
            key={`final-pick-adopted-empty-${idx}`}
            className="inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-dashed border-emerald-300/30 bg-slate-900/40 px-2 text-sm font-semibold text-emerald-200/40"
          >
            ·
          </span>
        ))}
      </div>
      <p className="text-xs text-emerald-100/70">기준 회차 조회 후 통합 채택 번호가 표시됩니다.</p>
    </div>
  );
}
