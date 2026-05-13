/** 2년·전체 차트와 평균근접 규칙을 한눈에 설명하는 고정 안내 블록입니다. */

export const AccStratNote = () => (
  <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-4 space-y-4">
    <h2 className="text-lg font-semibold text-slate-100">고도화 전략 분석 (2년 / 평균근접)</h2>
    <p className="text-sm text-slate-300 leading-relaxed">
      상단은 선택 회차 직전 전체 누적, 아래는 직전 104회차(2년) 구간만 막대 차트로 둡니다. 최종 채택 4개는 전체 누적
      출현 분포에 대해 평균근접 규칙으로 선정합니다. 위 &quot;누적 출현 극값 제외&quot;는 통합 분석 페이지와 동일한 별도
      규칙입니다.
    </p>
  </section>
);
