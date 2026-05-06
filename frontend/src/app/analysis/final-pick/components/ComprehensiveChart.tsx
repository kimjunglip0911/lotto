import type { ChiSquareChartDatum } from '../logic/chiSquareAdoption';

type ComprehensiveChartProps = {
  /** 1~45번 번호별 카이제곱 편차(O-E) 및 순위 데이터. */
  chartData: ChiSquareChartDatum[];
  /** 통합 채택 번호(강조 색상 적용) */
  highlightedNumbers?: Set<number>;
};

const NUMBER_RANGE = Array.from({ length: 45 }, (_, i) => i + 1);

/**
 * 1~45번을 가로로 나열한 종합 막대 차트.
 *
 * - 데이터가 비어 있을 때는 회색 빈 막대 + 안내 문구를 보여 자리만 잡는다.
 * - 막대 토큰(`w-8`, `h-[145px]`)은 누적 분석의 `AccumulatedChartSection`과 동일하게 맞춰
 *   향후 실데이터를 주입했을 때 시각 일관성이 유지되도록 한다.
 *
 * 후속: 4개 분석 기법의 통합 점수(또는 출현 빈도)를 `counts`에 주입하여 비교 차트로 활용한다.
 */
export function ComprehensiveChart({ chartData, highlightedNumbers }: ComprehensiveChartProps) {
  const hasData = chartData.length === 45;
  const maxAbsDeviation = hasData ? Math.max(...chartData.map((row) => Math.abs(row.deviation)), 1) : 1;
  const sortedByRank = hasData ? [...chartData].sort((a, b) => a.rank - b.rank || a.number - b.number) : [];

  return (
    <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-3 space-y-2.5">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h3 className="text-xl font-semibold text-white">번호별 종합 분석 차트 (1~45)</h3>
        <span className="text-xs text-slate-400">카이제곱 편차(O-E) 기준</span>
      </div>

      {hasData ? (
        <div className="overflow-x-auto pb-0.5">
          <div className="relative w-max">
            <ul className="w-max flex items-end gap-1 h-[200px]">
              {sortedByRank.map((row) => {
                const number = row.number;
                const deviation = row?.deviation ?? 0;
                const rank = row?.rank ?? number;
                const normalizedHeight = (Math.abs(deviation) / maxAbsDeviation) * 50;
                const barHeight = Math.max(normalizedHeight, deviation !== 0 ? 2 : 0);
                const isHighlighted = highlightedNumbers?.has(number) ?? false;

                return (
                  <li key={`comprehensive-${number}`} className="w-8 shrink-0 flex flex-col items-center gap-1">
                    <span className="text-[11px] text-slate-100 tabular-nums leading-none">
                      {deviation.toFixed(2)}
                    </span>
                    <div className="relative w-full h-[145px] rounded-md border border-white/10 bg-slate-900/70 overflow-hidden">
                      <div className="absolute inset-x-0 top-1/2 h-px bg-white/20" />
                      <div
                        className={`absolute inset-x-0 ${isHighlighted ? 'bg-yellow-300/95' : 'bg-lime-400/90'}`}
                        style={
                          deviation >= 0
                            ? { height: `${barHeight}%`, bottom: '50%' }
                            : { height: `${barHeight}%`, top: '50%' }
                        }
                      />
                    </div>
                    <span className="text-[11px] text-slate-300 font-medium leading-none">{number}</span>
                    <span className="text-[11px] text-slate-400 leading-none">{rank}등</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="overflow-x-auto pb-0.5">
            <ul className="w-max flex items-end gap-1 h-[200px]">
              {NUMBER_RANGE.map((number) => (
                <li key={`comprehensive-empty-${number}`} className="w-8 shrink-0 flex flex-col items-center gap-1">
                  <span className="text-[11px] text-slate-500 tabular-nums leading-none">·</span>
                  <div className="w-full h-[145px] rounded-md border border-dashed border-white/10 bg-slate-900/40" />
                  <span className="text-[11px] text-slate-500 font-medium leading-none">{number}</span>
                  <span className="text-[11px] text-slate-600 leading-none">-등</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-slate-400">
            기준 회차 조회 후 1~45번 편차(O-E)와 카이제곱 기준 순위가 표시됩니다.
          </p>
        </div>
      )}
    </section>
  );
}
