/** 2년·전체 구간에서 상·하위 출현 전략과 최종 채택 규칙을 한눈에 설명하는 고정 안내 블록입니다. */

export const AccStratNote = () => (
  <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-4 space-y-4">
    <h2 className="text-lg font-semibold text-slate-100">고도화 전략 분석 (2년 · 전체 상·하)</h2>
    <p className="text-sm text-slate-300 leading-relaxed">
      상단 전체 누적 막대 아래에는 직전 104회차(2년) 구간만으로 상위·하위 출현 4개 전략 차트를 둡니다. 최종 채택 4개는 선택
      회차 직전 전체 기간 누적을 기준으로 한 상위·하위 출현 4개 후보를 규칙에 따라 한 세트로 고릅니다. 위 &quot;누적 출현
      극값 제외&quot;는 통합 분석 페이지와 동일한 별도 규칙입니다.
    </p>
  </section>
);
