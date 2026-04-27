type Props = {
  analyzedDrawCount: number;
  expected: number;
  chiSquareThreshold: number;
  top5PctThreshold: number;
  excludedCount: number;
};

export function SummaryCards({
  analyzedDrawCount,
  expected,
  chiSquareThreshold,
  top5PctThreshold,
  excludedCount,
}: Props) {
  return (
    <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {[
        { label: '분석 회차 수 (N)', value: `${analyzedDrawCount}회` },
        { label: '기대 출현 횟수 (E)', value: expected.toFixed(2) },
        { label: '유의 임계값 (χ²)', value: chiSquareThreshold.toFixed(2) },
        { label: '+편차 상위5% 임계값', value: top5PctThreshold > 0 ? `+${top5PctThreshold.toFixed(2)}` : '-' },
        { label: '제외 번호 (상위5%)', value: `${excludedCount}개` },
      ].map(({ label, value }) => (
        <div key={label} className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-4 flex flex-col gap-1">
          <span className="text-xs text-slate-400">{label}</span>
          <span className="text-xl font-bold text-white">{value}</span>
        </div>
      ))}
    </section>
  );
}
