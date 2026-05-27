type Props = {
  kTrend: number;
};

export function StatisticalNote({ kTrend }: Props) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
      <p className="text-xs text-slate-400 leading-relaxed">
        <span className="font-semibold text-slate-300">분석 방식:</span>{' '}
        기준 회차를 제외한 <span className="text-slate-300 font-medium">전체 이력</span>에서{' '}
        <span className="text-slate-300 font-medium">주번호 6개만</span> 출현 여부를 세고, 보너스는 트렌드 EMA·기댓값 계산에 넣지
        않습니다. (당첨 세로선 표시는 당첨 7개 포함.) EMA는 k={kTrend} 지수평활이며, 기댓값은 동일 이력의 출현
        비율입니다. 누적·카이제곱은 각 화면 정의대로이며 보너스 포함 여부가 트렌드와 다를 수 있습니다. 로또는 매 회
        독립 시행이므로 과거 추세가 미래 결과를 보장하지 않습니다. 참고 지표로만 활용하세요.
      </p>
    </section>
  );
}
