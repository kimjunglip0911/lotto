export function StatisticalNote() {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
      <p className="text-xs text-slate-400 leading-relaxed">
        <span className="font-semibold text-slate-300">통계적 주의사항:</span>{' '}
        카이제곱 검정(χ², df=1, α=0.05, 임계값 3.84)은 각 번호의 출현 편차가 우연으로 설명되지 않을 가능성을 나타냅니다.
        그러나 로또는 매 회 독립 시행이므로 이전 회차의 결과가 이후 회차에 영향을 주지 않습니다.
        저빈도/고빈도 판정은 통계적 참고 지표로만 활용하세요.
      </p>
    </section>
  );
}
