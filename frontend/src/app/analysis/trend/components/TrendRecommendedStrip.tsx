type Props = {
  trendRecommendedFour: readonly [number, number, number, number] | null;
};

/**
 * 누적·카이제곱 제외 후 기대값 대비 구간 규칙으로 뽑은 트렌드 선정 4개를 표시한다.
 */
export function TrendRecommendedStrip({ trendRecommendedFour }: Props) {
  return (
    <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-4 space-y-3">
      <h3 className="text-base font-semibold text-slate-100">트렌드 선정 4개</h3>
      {trendRecommendedFour ? (
        <>
          <div className="flex flex-wrap gap-2">
            {trendRecommendedFour.map((n) => (
              <span
                key={`trend-pick-${n}`}
                className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-amber-400/20 px-2 text-sm font-bold text-amber-100"
              >
                {n}
              </span>
            ))}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            누적번호 분석 최종 4개·카이제곱 사용 번호 4개를 제외한 뒤, 기대값 대비(Slow EMA)가{' '}
            <span className="text-slate-300">+2.0~+3.9%p → +0.0~+0.9%p</span> 순으로 채웁니다.
            첫 구간 후보가 4개를 넘으면 +3%p에 가까운 번호를 우선합니다.
          </p>
        </>
      ) : (
        <p className="text-sm text-slate-400">
          위 구간(양수 기대값 대비)만으로는 번호 4개를 채우지 못했습니다. 음수·0에 가까운 값만 남았거나 제외
          번호가 많을 때 발생할 수 있습니다.
        </p>
      )}
    </section>
  );
}
