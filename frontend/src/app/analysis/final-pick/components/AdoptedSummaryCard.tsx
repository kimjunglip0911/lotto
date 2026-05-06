type AdoptedSummaryCardProps = {
  numbers: number[];
  targetCount: number;
  mainWinningSet?: Set<number>;
};

/**
 * 4개 분석 기법을 통합해 채택한 번호(기본 18개)를 종합 차트 위에 강조하는 카드.
 *
 * - 채택 번호가 비어 있으면 회색 dashed 슬롯 `targetCount`개로 자리만 잡는다.
 * - 본번호 적중 시 amber ring으로 강조(누적 페이지 main hit 톤 재사용).
 */
export function AdoptedSummaryCard({
  numbers,
  targetCount,
  mainWinningSet,
}: AdoptedSummaryCardProps) {
  const sortedNumbers = [...numbers].sort((a, b) => a - b);
  const hasNumbers = sortedNumbers.length > 0;

  return (
    <section className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-4 space-y-3">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h2 className="text-lg font-semibold text-emerald-200">
          4개 기법 통합 채택 {targetCount}
        </h2>
        <span className="text-xs font-medium text-emerald-100/80">
          연속 미출현 · 추세 · 누적 · 카이제곱 결과를 합쳐 좁힌 후보군
        </span>
      </div>

      {hasNumbers ? (
        <div className="flex flex-wrap gap-2">
          {sortedNumbers.map((n) => {
            const isMainHit = mainWinningSet?.has(n) ?? false;
            return (
              <span
                key={`final-pick-adopted-${n}`}
                className={
                  isMainHit
                    ? 'inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-amber-400 px-2 text-sm font-bold text-slate-900 ring-1 ring-amber-200/90 shadow-[inset_0_-3px_0_rgba(0,0,0,0.12)]'
                    : 'inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-emerald-400/25 px-2 text-sm font-bold text-emerald-100'
                }
              >
                {n}
              </span>
            );
          })}
        </div>
      ) : (
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
          <p className="text-xs text-emerald-100/70">
            기준 회차 조회 후 4개 분석 기법의 통합 채택 번호가 표시됩니다. (상세 로직은 후속 작업에서 구현)
          </p>
        </div>
      )}
    </section>
  );
}
