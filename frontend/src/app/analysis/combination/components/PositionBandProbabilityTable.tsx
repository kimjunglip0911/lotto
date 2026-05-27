import type { PositionBandDistributionRow } from '../types';

type Props = {
  totalDraws: number;
  rows: PositionBandDistributionRow[];
};

/** 구간(자리) 홀짝에 따라 은은한 번갈이 배경 */
function positionGroupRowBg(position: number): string {
  return position % 2 === 1 ? 'bg-slate-800/35' : 'bg-slate-900/30';
}

/** 저장된 전체 당첨 이력 기준, 정렬된 주6 각 자리별 번호대 출현 회차 수·비율(%) 표 */
export function PositionBandProbabilityTable({ totalDraws, rows }: Props) {
  return (
    <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-4 space-y-3">
      <div>
        <h3 className="text-xl font-semibold text-white">구간별 번호 확률</h3>
        <p className="text-xs text-slate-400 mt-1">
          표본: DB에 저장된 전체 회차의 당첨 주번호 6개(num1~num6)만 사용합니다. 보너스 번호는 제외합니다.
          번호구간은 5개 번호 단위(1~5, 6~10, …, 41~45)로 집계합니다.
          각 행의 비율은 해당 구간(자리) 안에서만 합산하여 100%입니다.
        </p>
      </div>

      <p className="text-[11px] text-slate-500">집계 회차 {totalDraws.toLocaleString()}건</p>

      {totalDraws === 0 ? (
        <p className="text-sm text-slate-300">집계할 당첨 이력이 없습니다.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-card-border/20">
          <table className="w-full min-w-[360px] text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-card-border/30 bg-black/20">
                <th
                  scope="col"
                  className="py-2 px-3 font-semibold text-slate-300 text-center align-middle"
                >
                  구간
                </th>
                <th scope="col" className="py-2 px-3 font-semibold text-slate-300">
                  번호구간
                </th>
                <th scope="col" className="py-2 px-3 font-semibold text-slate-300 text-right">
                  총 회차
                </th>
                <th scope="col" className="py-2 px-3 font-semibold text-slate-300 text-right">
                  비율 (%)
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const isFirstInPosition = i === 0 || rows[i - 1].position !== r.position;
                const isLastInPosition =
                  i === rows.length - 1 || rows[i + 1].position !== r.position;
                let rowSpan = 1;
                if (isFirstInPosition) {
                  for (let j = i + 1; j < rows.length && rows[j].position === r.position; j++) {
                    rowSpan++;
                  }
                }
                const rowBg = positionGroupRowBg(r.position);
                const groupTopRule =
                  isFirstInPosition && i > 0 ? 'border-t-2 border-slate-500/45' : '';
                const rowBottomRule = isLastInPosition
                  ? 'border-b border-slate-500/35'
                  : 'border-b border-white/[0.06]';

                return (
                  <tr
                    key={`${r.position}-${r.bandLabel}`}
                    className={`${groupTopRule} ${rowBottomRule}`}
                  >
                    {isFirstInPosition ? (
                      <td
                        rowSpan={rowSpan}
                        className={`py-1.5 px-3 text-slate-200 tabular-nums text-center align-middle border-r border-slate-500/30 ${rowBg}`}
                      >
                        {r.position}번째
                      </td>
                    ) : null}
                    <td className={`py-1.5 px-3 text-slate-200 tabular-nums ${rowBg}`}>
                      {r.bandLabel}
                    </td>
                    <td
                      className={`py-1.5 px-3 text-right text-slate-300 tabular-nums ${rowBg}`}
                    >
                      {r.drawCount.toLocaleString()}
                    </td>
                    <td
                      className={`py-1.5 px-3 text-right text-sky-300 tabular-nums ${rowBg}`}
                    >
                      {r.percentage.toFixed(2)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
