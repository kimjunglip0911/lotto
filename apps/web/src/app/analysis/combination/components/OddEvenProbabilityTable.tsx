import type { OddEvenDistributionRow } from '../types';

type Props = {
  totalDraws: number;
  rows: OddEvenDistributionRow[];
};

/** 저장된 전체 당첨 이력 기준, 주6 짝수 개수별 출현 회차 수·비율(%) 표 */
export function OddEvenProbabilityTable({ totalDraws, rows }: Props) {
  return (
    <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-4 space-y-3">
      <div>
        <h3 className="text-xl font-semibold text-white">홀짝 확률 (짝수 개수)</h3>
        <p className="text-xs text-slate-400 mt-1">
          표본: DB에 저장된 전체 회차의 당첨 주번호 6개만 사용합니다. 보너스 번호는 제외합니다.
        </p>
      </div>

      <p className="text-[11px] text-slate-500">집계 회차 {totalDraws.toLocaleString()}건</p>

      {totalDraws === 0 ? (
        <p className="text-sm text-slate-300">집계할 당첨 이력이 없습니다.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-card-border/20">
          <table className="w-full min-w-[320px] text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-card-border/30 bg-black/20">
                <th scope="col" className="py-2 px-3 font-semibold text-slate-300">
                  짝수 개수
                </th>
                <th scope="col" className="py-2 px-3 font-semibold text-slate-300 text-right">
                  해당 회차 수
                </th>
                <th scope="col" className="py-2 px-3 font-semibold text-slate-300 text-right">
                  비율 (%)
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.evenCount} className="border-b border-card-border/15 last:border-0">
                  <td className="py-1.5 px-3 text-slate-200 tabular-nums">{r.evenCount}개</td>
                  <td className="py-1.5 px-3 text-right text-slate-300 tabular-nums">
                    {r.drawCount.toLocaleString()}
                  </td>
                  <td className="py-1.5 px-3 text-right text-sky-300 tabular-nums">
                    {r.percentage.toFixed(2)}%
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
