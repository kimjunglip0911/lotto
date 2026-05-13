// 분석 회차 수 / 최장·평균 연속 출현 / 상위 5% / 평균 초과 개수 요약 카드.

type SummaryCardsProps = {
  analyzedDrawCount: number;
  maxStreak: number;
  averageStreak: number;
  top5PctThreshold: number;
  coldNumbersCount: number;
};

export const SummaryCards = ({
  analyzedDrawCount,
  maxStreak,
  averageStreak,
  top5PctThreshold,
  coldNumbersCount,
}: SummaryCardsProps) => (
  <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
    {[
      { label: '분석 회차 수 (N)', value: `${analyzedDrawCount}회` },
      { label: '최장 연속 출현', value: `${maxStreak}회차` },
      { label: '평균 연속 출현', value: averageStreak > 0 ? `${averageStreak.toFixed(1)}회차` : '-' },
      { label: '상위 5% 임계값', value: top5PctThreshold > 0 ? `${top5PctThreshold}회차` : '-' },
      { label: '평균 초과 연속 출현', value: `${coldNumbersCount}개` },
    ].map(({ label, value }) => (
      <div key={label} className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-4 flex flex-col gap-1">
        <span className="text-xs text-slate-400">{label}</span>
        <span className="text-xl font-bold text-white">{value}</span>
      </div>
    ))}
  </section>
);
