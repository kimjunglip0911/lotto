export function StatisticalNote() {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
      <p className="text-xs text-slate-400 leading-relaxed">
        <span className="font-semibold text-slate-300">통계적 주의사항:</span>{' '}
        연속 미출현 기간(Absence Streak)은 각 번호가 마지막으로 당첨된 이후 몇 회차가 경과했는지를 나타내는 지표입니다.
        그러나 로또는 매 회차가 독립 시행이므로 과거의 미출현이 미래 출현 확률에 영향을 주지 않습니다.
        (도박사의 오류) 저빈도 후보 판정은 통계적 참고 지표로만 활용하시기 바랍니다.
      </p>
    </section>
  );
}
