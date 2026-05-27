import type { DeviationBinsSummary } from '../../types';

type Props = {
  summary: DeviationBinsSummary;
};

export function DevBinTbl({ summary }: Props) {
  const { rows, validDrawCount, skippedDrawCount } = summary;
  const visibleRows = rows.filter((row) => row.drawCount > 0);

  return (
    <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-4 space-y-3">
      <div>
        <h3 className="text-xl font-semibold text-white">기댓값 대비 EMA 편차 구간(1)</h3>
        <p className="text-xs text-slate-400 mt-1">
          표본: 조회한 선택 회차보다 이전의 전체 회차(보너스 제외). 각 회차에서 번호별 편차(%p) 구간이 나온 회차 대비,
          실제 당첨 주6 포함 회차 비율을 출현확률로 계산합니다.
        </p>
      </div>
      <p className="text-[11px] text-slate-500">
        유효 회차 {validDrawCount.toLocaleString()}건
        {skippedDrawCount > 0 ? ` · 기댓값 미달 등으로 제외 ${skippedDrawCount.toLocaleString()}건` : ''}
      </p>
      {validDrawCount === 0 || visibleRows.length === 0 ? (
        <p className="text-sm text-slate-300">집계 가능한 이전 이력이 없거나, 유효 회차가 없어 구간을 표시할 수 없습니다.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-card-border/20">
          <table className="w-full min-w-[320px] text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-card-border/30 bg-black/20">
                <th scope="col" className="py-2 px-3 font-semibold text-slate-300">
                  편차 구간
                </th>
                <th scope="col" className="py-2 px-3 font-semibold text-slate-300 text-right">
                  구간 출현 회차
                </th>
                <th scope="col" className="py-2 px-3 font-semibold text-slate-300 text-right">
                  당첨 포함 회차
                </th>
                <th scope="col" className="py-2 px-3 font-semibold text-slate-300 text-right">
                  출현확률
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((r) => (
                <tr key={r.key} className="border-b border-card-border/15 last:border-0">
                  <td className="py-1.5 px-3 text-slate-200 whitespace-nowrap">{r.label}</td>
                  <td className="py-1.5 px-3 text-right text-slate-300 tabular-nums">{r.drawCount}</td>
                  <td className="py-1.5 px-3 text-right text-slate-300 tabular-nums">{r.winningHitDrawCount}</td>
                  <td className="py-1.5 px-3 text-right text-sky-300 tabular-nums">
                    {r.appearanceProbability.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
