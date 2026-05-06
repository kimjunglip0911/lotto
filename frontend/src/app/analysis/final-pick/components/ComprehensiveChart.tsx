type ComprehensiveChartProps = {
  /** 1~45번 각 위치의 카운트(없으면 빈 막대 placeholder를 렌더). */
  counts: number[] | null;
  /** 통합 채택 번호(강조 색상 적용) */
  highlightedNumbers?: Set<number>;
};

const NUMBER_RANGE = Array.from({ length: 45 }, (_, i) => i + 1);

/**
 * 1~45번을 가로로 나열한 종합 막대 차트.
 *
 * - 데이터가 비어 있을 때는 회색 빈 막대 + 안내 문구를 보여 자리만 잡는다.
 * - 막대 토큰(`w-8`, `h-[145px]`)은 누적 분석의 `AccumulatedChartSection`과 동일하게 맞춰
 *   향후 실데이터를 주입했을 때 시각 일관성이 유지되도록 한다.
 *
 * 후속: 4개 분석 기법의 통합 점수(또는 출현 빈도)를 `counts`에 주입하여 비교 차트로 활용한다.
 */
export function ComprehensiveChart({ counts, highlightedNumbers }: ComprehensiveChartProps) {
  const hasData = Array.isArray(counts) && counts.some((c) => c > 0);
  const maxCount = hasData ? Math.max(...(counts as number[])) : 0;

  return (
    <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-3 space-y-2.5">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h3 className="text-xl font-semibold text-white">번호별 종합 분석 차트 (1~45)</h3>
        <span className="text-xs text-slate-400">
          후속: 4개 분석 통합 점수를 주입해 비교 차트로 활용
        </span>
      </div>

      {hasData ? (
        <div className="overflow-x-auto pb-0.5">
          <div className="relative w-max">
            <ul className="w-max flex items-end gap-1 h-[200px]">
              {NUMBER_RANGE.map((number, idx) => {
                const count = counts ? counts[idx] ?? 0 : 0;
                const ratio = maxCount > 0 ? (count / maxCount) * 100 : 0;
                const isHighlighted = highlightedNumbers?.has(number) ?? false;

                return (
                  <li key={`comprehensive-${number}`} className="w-8 shrink-0 flex flex-col items-center gap-1">
                    <span className="text-[11px] text-slate-100 tabular-nums leading-none">{count}</span>
                    <div className="w-full h-[145px] rounded-md border border-white/10 bg-slate-900/70 flex items-end overflow-hidden">
                      <div
                        className={`w-full ${isHighlighted ? 'bg-emerald-400/90' : 'bg-primary/80'}`}
                        style={{ height: `${Math.max(ratio, count > 0 ? 2 : 0)}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-slate-300 font-medium leading-none">{number}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="overflow-x-auto pb-0.5">
            <ul className="w-max flex items-end gap-1 h-[200px]">
              {NUMBER_RANGE.map((number) => (
                <li key={`comprehensive-empty-${number}`} className="w-8 shrink-0 flex flex-col items-center gap-1">
                  <span className="text-[11px] text-slate-500 tabular-nums leading-none">·</span>
                  <div className="w-full h-[145px] rounded-md border border-dashed border-white/10 bg-slate-900/40" />
                  <span className="text-[11px] text-slate-500 font-medium leading-none">{number}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-slate-400">
            기준 회차 조회 후 1~45번 종합 분석 결과가 막대 차트로 표시됩니다. (상세 로직은 후속 작업에서 구현)
          </p>
        </div>
      )}
    </section>
  );
}
