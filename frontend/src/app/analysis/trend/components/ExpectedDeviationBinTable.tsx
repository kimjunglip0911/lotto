import type { DeviationBinsSummary } from '../types';

type Props = {
  summary: DeviationBinsSummary;
};

/**
 * 선택 회차를 제외한 전체 이력에서 주6 각 번호를 표본으로, 직전 이력 기준 기댓값 대비 EMA 편차(%) 구간 분포를 표시한다.
 */
export function ExpectedDeviationBinTable({ summary }: Props) {
  const { rows, validSampleCount, skippedSampleCount } = summary;

  return (
    <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-4 space-y-3">
      <div>
        <h3 className="text-xl font-semibold text-white">기댓값 대비 EMA 편차 구간(10%p)</h3>
        <p className="text-xs text-slate-400 mt-1">
          표본: 조회한 선택 회차보다 이전의 전체 회차 당첨 주6 각각(보너스 제외). 각 회차는 직전 이력만 반영한 기댓값·EMA로 편차%를 계산합니다.
        </p>
      </div>

      <p className="text-[11px] text-slate-500">
        유효 표본 {validSampleCount.toLocaleString()}건
        {skippedSampleCount > 0 ? ` · 기댓값 미달 등으로 제외 ${skippedSampleCount.toLocaleString()}건` : ''}
      </p>

      {validSampleCount === 0 ? (
        <p className="text-sm text-slate-300">집계 가능한 이전 이력이 없거나, 유효 표본이 없어 구간을 표시할 수 없습니다.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-card-border/20">
          <table className="w-full min-w-[320px] text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-card-border/30 bg-black/20">
                <th scope="col" className="py-2 px-3 font-semibold text-slate-300">
                  편차 구간
                </th>
                <th scope="col" className="py-2 px-3 font-semibold text-slate-300 text-right">
                  표본 수
                </th>
                <th scope="col" className="py-2 px-3 font-semibold text-slate-300 text-right">
                  비율
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className="border-b border-card-border/15 last:border-0">
                  <td className="py-1.5 px-3 text-slate-200 whitespace-nowrap">{r.label}</td>
                  <td className="py-1.5 px-3 text-right text-slate-300 tabular-nums">{r.count}</td>
                  <td className="py-1.5 px-3 text-right text-sky-300 tabular-nums">{r.percent.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
