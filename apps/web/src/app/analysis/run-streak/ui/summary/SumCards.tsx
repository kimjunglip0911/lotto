// 분석 회차 수와 최장 연속 출현을 한 줄 카드로 보여 주는 요약 영역.

type SumCardsProps = {
  analyzedDrawCount: number;
  maxStreak: number;
};

export const SumCards = ({ analyzedDrawCount, maxStreak }: SumCardsProps) => (
  <section className="grid grid-cols-2 gap-3">
    {[
      { label: '분석 회차 수 (N)', value: `${analyzedDrawCount}회` },
      { label: '최장 연속 출현', value: `${maxStreak}회차` },
    ].map(({ label, value }) => (
      <div key={label} className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-4 flex flex-col gap-1">
        <span className="text-xs text-slate-400">{label}</span>
        <span className="text-xl font-bold text-white">{value}</span>
      </div>
    ))}
  </section>
);
