type Props = {
  baseline: number;
  kConfig: { fast: number; slow: number };
};

export function StatisticalNote({ baseline, kConfig }: Props) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
      <p className="text-xs text-slate-400 leading-relaxed">
        <span className="font-semibold text-slate-300">분석 방식:</span>{' '}
        전체 회차 이력을 입력으로 사용하며, 최근 회차일수록 더 높은 가중치를 부여합니다 (지수 감쇠). Fast EMA(k=
        {kConfig.fast}, 유효범위 약 90회)가 Slow EMA(k={kConfig.slow}, 유효범위 약 228회)를 웃돌고 Slow EMA가 기댓값(
        {(baseline * 100).toFixed(1)}%) 이상이면 <span className="text-emerald-300">상승지속</span>, Fast EMA가 Slow EMA
        아래이고 Slow EMA가 기댓값 이상이면 <span className="text-violet-300">하락전환</span>, Fast EMA가 Slow EMA 위이고
        Slow EMA가 기댓값 미만이면 <span className="text-sky-300">회복중</span>, 모두 기댓값 미만이면{' '}
        <span className="text-rose-300">하락지속</span>으로 분류합니다. 로또는 매 회 독립 시행이므로 과거 추세가 미래 결과를
        보장하지 않습니다. 참고 지표로만 활용하세요.
      </p>
    </section>
  );
}
