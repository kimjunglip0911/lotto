// 화면 맨 아래에 띄우는 통계적 주의사항 안내 문구입니다.
// 과거 출현 패턴이 미래 확률을 바꾸지 않는다는 점(도박사의 오류)을 짚어 줍니다.

export function StatisticalNote() {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
      <p className="text-xs text-slate-400 leading-relaxed">
        <span className="font-semibold text-slate-300">통계적 주의사항:</span>{' '}
        여기서의 연속 출현은 선택 회차 직전 회차부터 거슬러 올라가며, 본번호 6개에 연속 포함된 회차 수에서 1을 뺀 값입니다. 직전 1회만 출현하면 0, 두 회차 연속이면 1입니다.
        로또는 매 회차가 독립 시행이므로 과거의 연속 출현 패턴이 다음 회차 출현 확률에 영향을 주지 않습니다.
        (도박사의 오류) 평균 초과 표시는 참고용 지표로만 활용하시기 바랍니다.
      </p>
    </section>
  );
}
